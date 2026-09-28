import { createJSONStorage } from 'zustand/middleware';
import { useDashboardStore } from './index';
import { getSyncToken, getSyncLastModified, setSyncLastModified, mergeDailyTimes } from './helpers';

export let failedToLoadDB = false;
export let hasUnsavedChanges = false;
export let pendingValue: string | null = null;
export let lastSavedValue: string | null = null;
export let isSaving = false;
export let isSyncing = false;
export let isSyncingFromCloud = false;
export let isAuthTransition = false;
export let bypassCloudSync = false;
export let abortInstantLoad = false;

let saveTimeout: NodeJS.Timeout | null = null;

export const setSyncingFromCloud = (val: boolean) => { isSyncingFromCloud = val; };
export const setAuthTransition = (val: boolean) => { isAuthTransition = val; };
export const setBypassCloudSync = (bypass: boolean = true) => { bypassCloudSync = bypass; };
export const setAbortInstantLoad = (val: boolean) => { abortInstantLoad = val; };

// ----------------------------------------------------------------------
// ANTI-TAMPER SECURE QUEUE ENGINE (Focus Minutes)
// ----------------------------------------------------------------------
const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; 
  }
  return hash.toString(36);
};

export const getSecureFocusQueue = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem('unsaved_focus_mins');
  if (!raw) return {};
  
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.sig || !parsed.data) {
        localStorage.removeItem('unsaved_focus_mins');
        return {};
    }
    const token = getSyncToken() || "offline_fallback_salt";
    if (generateHash(JSON.stringify(parsed.data) + token) !== parsed.sig) {
        localStorage.removeItem('unsaved_focus_mins');
        return {};
    }
    return parsed.data;
  } catch (e) {
    localStorage.removeItem('unsaved_focus_mins');
    return {};
  }
};

export const setSecureFocusQueue = (queueData: Record<string, number>) => {
  if (typeof window === 'undefined') return;
  if (Object.keys(queueData).length === 0) {
      localStorage.removeItem('unsaved_focus_mins');
      return;
  }
  const token = getSyncToken() || "offline_fallback_salt";
  const sig = generateHash(JSON.stringify(queueData) + token);
  localStorage.setItem('unsaved_focus_mins', JSON.stringify({ data: queueData, sig }));
};

// ----------------------------------------------------------------------
// DEDICATED QUEUE SYNC: Securely pushes offline minutes to the DB
// ----------------------------------------------------------------------
let isSyncingQueue = false;

export const syncFocusQueue = async () => {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  if (isSyncingQueue) return;

  const token = getSyncToken();
  if (!token) return;

  let queue = getSecureFocusQueue();
  if (Object.keys(queue).length === 0) return;

  isSyncingQueue = true;
  setSecureFocusQueue({}); 

  let failedQueue: Record<string, number> = {};
  let hasFailures = false;

  for (const dateStr of Object.keys(queue)) {
    const mins = queue[dateStr];
    if (mins <= 0) continue;

    try {
      const res = await fetch('/api/users/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ dateStr, minutes: mins })
      });
      
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.lastModified) setSyncLastModified(json.lastModified);
      } else {
        failedQueue[dateStr] = (failedQueue[dateStr] || 0) + mins;
        hasFailures = true;
      }
    } catch (e) {
      failedQueue[dateStr] = (failedQueue[dateStr] || 0) + mins;
      hasFailures = true;
    }
  }

  if (hasFailures) {
    const currentQueue = getSecureFocusQueue();
    for (const dateStr in failedQueue) {
      currentQueue[dateStr] = (currentQueue[dateStr] || 0) + failedQueue[dateStr];
    }
    setSecureFocusQueue(currentQueue);
  }

  isSyncingQueue = false;
};

export const pushStreakToDB = (dateKey: string, minutes: number) => {
  if (typeof window === 'undefined' || minutes <= 0) return;

  const token = getSyncToken();

  if (!token || !navigator.onLine) {
    try {
      const queue = getSecureFocusQueue();
      queue[dateKey] = (queue[dateKey] || 0) + minutes;
      setSecureFocusQueue(queue);
    } catch (e) {}
    return;
  }

  fetch('/api/users/streak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ dateStr: dateKey, minutes })
  })
  .then(res => {
    if (!res.ok) throw new Error(`streak API ${res.status}`);
    return res.json();
  })
  .then(json => {
     if (json.lastModified) setSyncLastModified(json.lastModified);
  })
  .catch(() => {
    try {
      const queue = getSecureFocusQueue();
      queue[dateKey] = (queue[dateKey] || 0) + minutes;
      setSecureFocusQueue(queue);
    } catch (e) {}
  });
};

// ----------------------------------------------------------------------
// CROSS-DEVICE TIMER CHECK
// ----------------------------------------------------------------------
export const checkTimerStillActiveInDB = async (type: 'timer' | 'stopwatch'): Promise<'active' | 'stopped' | 'unknown'> => {
  if (typeof window === 'undefined' || !navigator.onLine) return 'unknown';
  const token = getSyncToken();
  if (!token) return 'unknown';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const localLastMod = getSyncLastModified() || 0;
    const res = await fetch(`/api/store?t=${Date.now()}&localModified=${localLastMod}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return 'unknown';
    const json = await res.json();
    if (json.upToDate) return 'active';

    const cloudState = json?.data?.state;
    if (!cloudState) return 'unknown';

    if (type === 'timer') {
      if (cloudState.timerEndAt && cloudState.timerEndAt > Date.now()) return 'active';
      return 'stopped';
    } else {
      if (cloudState.stopwatchStartTime) return 'active';
      return 'stopped';
    }
  } catch {
    return 'unknown';
  }
};

// ----------------------------------------------------------------------
// MAIN STATE SAVE: Only handles DashboardStorage now!
// ----------------------------------------------------------------------
export const performSave = async () => {
  await syncFocusQueue();

  if (!pendingValue || isSyncingFromCloud || isAuthTransition) {
    saveTimeout = null;
    return;
  }

  if (isSyncing) {
    if (!saveTimeout) saveTimeout = setTimeout(performSave, 1000);
    return;
  }
  isSyncing = true;

  if (typeof window !== 'undefined' && !navigator.onLine) {
    hasUnsavedChanges = true;
    isSaving = false;
    isSyncing = false;
    if (!saveTimeout) saveTimeout = setTimeout(performSave, 5000);
    return;
  }

  const valueToSave = pendingValue;
  isSaving = true;

  if (failedToLoadDB || !getSyncToken()) {
    if (pendingValue === valueToSave) {
      pendingValue = null; hasUnsavedChanges = false; saveTimeout = null;
    } else {
      saveTimeout = setTimeout(performSave, 5000);
    }
    isSaving = false;
    isSyncing = false;
    return;
  }

  let success = false;
  try {
    const lastModified = getSyncLastModified();
    let modifiedCollections: string[] = ['DashboardStorage'];
    let modifiedKeys: string[] = [];

    if (lastSavedValue) {
      const oldState = JSON.parse(lastSavedValue).state || {};
      const newState = JSON.parse(valueToSave).state || {};
      
      const TRANSIENT_KEYS = [
        'isSaving', 'hasUnsavedChanges', '_hasHydrated', 'isTaskManagerOpen', 'isCalendarOpen',
        'isTimetableOpen', 'isPlansOpen', 'isNotesOpen', 'isSettingsOpen', 'isNewsOpen',
        'isStatsOpen', 'isMobileCountdownsVisible', 'isCalendarBusy', 'expandedLeaderboardUserId',
        'pendingValue', 'saveTimeout', 'activeNoteId', 'activeCountdownIndex',
        'settingsActiveTab', 'connectInitialTab', 
        'isDayStartModalOpen', 'isTourOpen', 'isAlarmPlaying', 'isQuotePopupOpen'
      ];

      Object.keys(newState).forEach(key => {
        if (key === 'lastModified' || TRANSIENT_KEYS.includes(key)) return;
        if (JSON.stringify(newState[key]) !== JSON.stringify(oldState[key])) {
          modifiedKeys.push(key);
        }
      });

      if (modifiedKeys.length === 0) {
        isSaving = false; hasUnsavedChanges = false; pendingValue = null; saveTimeout = null; 
        isSyncing = false; 
        return;
      }
    } else {
      const newState = JSON.parse(valueToSave).state || {};
      modifiedKeys = Object.keys(newState);
    }

    let parsedData = null;
    try {
      parsedData = JSON.parse(valueToSave);
    } catch (parseErr) {
      isSaving = false; isSyncing = false; return;
    }

    if (parsedData?.state) {
      const LOCAL_ONLY_MEDIA_KEYS = ['customDesktopWallpapers', 'customMobileWallpapers', 'manifestationDesktopPhotos', 'manifestationMobilePhotos'];
      LOCAL_ONLY_MEDIA_KEYS.forEach(key => {
        if (Array.isArray(parsedData.state[key])) {
          parsedData.state[key] = parsedData.state[key].filter((v: string) => typeof v === 'string' && !v.startsWith('data:'));
        }
      });
      if (typeof parsedData.state.peekModeWallpaper === 'string' && parsedData.state.peekModeWallpaper.startsWith('data:')) {
        delete parsedData.state.peekModeWallpaper;
      }
      
      // 1. Live Timers
      delete parsedData.state.timerEndAt;
      delete parsedData.state.timerPausedLeft;
      delete parsedData.state.timerInitialMins;
      delete parsedData.state.stopwatchStartTime;

      // 2. Primary Collections
      delete parsedData.state.history;
      delete parsedData.state.dailyTimes;
      delete parsedData.state.countdowns;
      delete parsedData.state.deadlines;
      delete parsedData.state.syntheticDeadlines;
      delete parsedData.state.tasks;
      delete parsedData.state.tomorrowTasks;
      delete parsedData.state.notes;
      delete parsedData.state.roadmaps;

      // 3. Timetable
      delete parsedData.state.timetableGrid;
      delete parsedData.state.timetableColors;
      delete parsedData.state.weekdayTimes;
      delete parsedData.state.weekendTimes;

      // 4. UI Configurations & Media Arrays (Stops First-Load wipe)
      delete parsedData.state.hideConfig;
      delete parsedData.state.mobileHideConfig;
      delete parsedData.state.clockOffsets;
      delete parsedData.state.widgetOffsets;
      delete parsedData.state.customDesktopWallpapers;
      delete parsedData.state.customMobileWallpapers;
      delete parsedData.state.customQuotes;
      delete parsedData.state.manifestationCustomQuotes;
      delete parsedData.state.customAlarmSounds;
      delete parsedData.state.hiddenWallpapers;
      delete parsedData.state.lockedWidgets;
      delete parsedData.state.manifestationDesktopPhotos;
      delete parsedData.state.manifestationMobilePhotos;

      if (modifiedKeys && modifiedKeys.length > 0) {
        const diffState: any = {};
        modifiedKeys.forEach(k => {
          if (parsedData.state[k] !== undefined) {
            diffState[k] = parsedData.state[k];
          }
        });
        parsedData.state = diffState;
      }
    }

    const payload = JSON.stringify({ 
      data: parsedData, 
      lastModified, 
      modifiedCollections: ['DashboardStorage'], 
      modifiedKeys,
      isFullSync: false // HARDCODED FALSE: Kills the "First Load Nuke"
    });

    const res = await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getSyncToken()}` },
      body: payload,
      keepalive: true
    });

    if (res.status === 409) {
      const json = await res.json();
      const parsedCloud = json.cloudData;
      const parsedLocal = JSON.parse(valueToSave); 

      const userModifications: any = {};
      if (lastSavedValue && modifiedKeys && modifiedKeys.length > 0) {
        modifiedKeys.forEach(k => {
          if (k !== 'lastModified' && parsedLocal.state && parsedLocal.state[k] !== undefined) {
            userModifications[k] = parsedLocal.state[k];
          }
        });
      }
        
      const mergedState = {
        ...parsedLocal.state,
        ...parsedCloud.state,
        ...userModifications,
        history: parsedCloud.state?.history || parsedLocal.state?.history || {},
        dailyTimes: mergeDailyTimes(parsedLocal.state?.dailyTimes || {}, parsedCloud.state?.dailyTimes || {}),
      };

      const transientKeys = ['isQuotePopupOpen', 'isTaskManagerOpen', 'isStatsOpen', 'timerTrigger', 'isNotesOpen', 'isPlansOpen', 'isTimetableOpen', 'isDayStartModalOpen', 'isVideoMuted', 'isVideoPlaying', 'isSettingsOpen', 'isStopwatchOpen', '_hasHydrated', 'widgetZIndices', 'isAlarmPlaying', 'isTourOpen', 'isNewsOpen', 'isManifestationOpen', 'selectedGroupId'];
      transientKeys.forEach(key => delete (mergedState as any)[key]);

      const mergedStr = JSON.stringify({ version: 2, state: mergedState });

      isSyncingFromCloud = true;
      setSyncLastModified(json.cloudLastModified);
      
      try { localStorage.setItem('dashboard-storage', mergedStr); } catch (e) { }
      useDashboardStore.setState(mergedState);

      pendingValue = mergedStr;
      
      const pureCloudBaseline = { ...parsedLocal.state, ...parsedCloud.state };
      lastSavedValue = JSON.stringify({ version: 2, state: pureCloudBaseline });

      hasUnsavedChanges = true;
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(performSave, 500);

      setTimeout(() => { isSyncingFromCloud = false; }, 500);
      isSaving = false;
      isSyncing = false; 
      return;
    }

    if (!res.ok) throw new Error(`API save failed with status ${res.status}`);

    const json = await res.json();
    setSyncLastModified(json.lastModified);
    
    success = true;
    lastSavedValue = valueToSave;

    if (json.updatedHistory) {
      useDashboardStore.setState((state: any) => ({ history: { ...state.history, ...json.updatedHistory } }));
      const currentPending = JSON.parse(pendingValue || lastSavedValue);
      if (currentPending.state) {
        currentPending.state.history = { ...currentPending.state.history, ...json.updatedHistory };
        pendingValue = JSON.stringify(currentPending);
        lastSavedValue = pendingValue;
      }
    }
  } catch (err) {
    console.warn("Failed to save to DB, storing locally:", err);
  } finally {
    isSaving = false;
    isSyncing = false;
    
    if (success) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('deadlines_offline_queue');
        localStorage.removeItem('countdowns_offline_queue');
        localStorage.removeItem('tasks_offline_queue');
        localStorage.removeItem('notes_offline_queue');
        localStorage.removeItem('settings_offline_queue');
        localStorage.removeItem('timetable_offline_queue');
        localStorage.removeItem('daily_routine_offline_queue');
        localStorage.removeItem('roadmaps_offline_queue');
      }
      
      if (pendingValue === valueToSave) { 
        pendingValue = null; 
        hasUnsavedChanges = false; 
        saveTimeout = null; 
      } else { 
        saveTimeout = setTimeout(performSave, 800); 
      }
    } else {
      setSyncLastModified(Date.now());
      hasUnsavedChanges = true;
      if (!saveTimeout) saveTimeout = setTimeout(performSave, 5000);
    }
  }
};

export const forcePushTimerState = () => {
  if (typeof window !== 'undefined') {
    if (pendingValue) {
      if (!isSaving) { saveTimeout = setTimeout(performSave, 0); }
      const token = getSyncToken();
      if (token && navigator.onLine) {
        try {
          const parsedData = JSON.parse(pendingValue);
          const explicitModifiedKeys = [
            'timerEndAt', 'timerPausedLeft', 'timerInitialMins', 'timerDeviceId', 
            'timerLastSavedChunks', 'timerLastAlertedChunks', 'timerLastUpdated', 
            'activeTaskId', 'activeTaskTitle',
            'stopwatchStartTime', 'stopwatchDeviceId', 'stopwatchLastSavedChunks'
          ];

          if (parsedData?.state) {
            delete parsedData.state.userGroups;
            delete parsedData.state.selectedGroupId;
            delete parsedData.state.viewingFriend;
            delete parsedData.state.syntheticDeadlines;

            const diffState: any = {};
            explicitModifiedKeys.forEach(k => {
              if (parsedData.state[k] !== undefined) {
                diffState[k] = parsedData.state[k];
              }
            });
            parsedData.state = diffState;
          }

          const payload = JSON.stringify({
            data: parsedData,
            lastModified: getSyncLastModified(), 
            modifiedCollections: ['DashboardStorage'],
            modifiedKeys: explicitModifiedKeys,
            isFullSync: false
          });
          
          fetch('/api/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: payload,
            keepalive: true
          })
          .then(res => res.json())
          .then(json => {
            if (json.lastModified) setSyncLastModified(json.lastModified);
          })
          .catch(() => {});
        } catch (e) { }
      }
    }
  }
};

export const triggerInstantSave = () => {
  if (typeof window !== 'undefined') {
    if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
    saveTimeout = setTimeout(performSave, 0);
  }
};

if (typeof window !== 'undefined') {
  const triggerAutoSyncOnOnline = () => {
    try {
      syncFocusQueue(); 
      const stateObj = useDashboardStore.getState();
      if (!stateObj || typeof stateObj !== 'object' || !stateObj._hasHydrated) return;

      const filteredState = { ...stateObj } as any;
      const transientKeys = ['isQuotePopupOpen', 'isTaskManagerOpen', 'isStatsOpen', 'timerTrigger', 'isNotesOpen', 'isPlansOpen', 'isTimetableOpen', 'isDayStartModalOpen', 'isVideoMuted', 'isVideoPlaying', 'isSettingsOpen', 'isStopwatchOpen', '_hasHydrated', 'widgetZIndices', 'isAlarmPlaying', 'isTourOpen', 'isNewsOpen', 'isManifestationOpen', 'settingsActiveTab', 'connectInitialTab'];
      transientKeys.forEach(key => delete filteredState[key]);

      pendingValue = JSON.stringify({ state: filteredState });
      hasUnsavedChanges = true;
      failedToLoadDB = false;
      if (!saveTimeout) saveTimeout = setTimeout(performSave, 5000);
    } catch (e) { console.warn("Auto sync trigger failed:", e); }
  };
  window.addEventListener('online', triggerAutoSyncOnOnline);
  window.addEventListener('app_sync_now', triggerAutoSyncOnOnline);
}

// ----------------------------------------------------------------------
// DATA CLEARING APIS
// ----------------------------------------------------------------------
export const clearOldDataAPI = async (days: number) => { };
export const clearAllDataAPI = async () => { };

// ----------------------------------------------------------------------
// FILE STORAGE (Local cache manager & Cloud Puller)
// ----------------------------------------------------------------------
export const fileStorage = createJSONStorage(() => ({
  getItem: async (_name: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    const token = getSyncToken();
    const localDataStr = localStorage.getItem('dashboard-storage');

    if (bypassCloudSync || (typeof navigator !== 'undefined' && !navigator.onLine) || abortInstantLoad) {
      abortInstantLoad = false; bypassCloudSync = false; lastSavedValue = localDataStr;
      return localDataStr;
    }

    if (token) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const localLastMod = getSyncLastModified() || 0;
        const res = await fetch(`/api/store?t=${Date.now()}&localModified=${localLastMod}`, {
          headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store', signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          failedToLoadDB = false;
          const json = await res.json();
          syncFocusQueue(); 
          if (json.lastModified) setSyncLastModified(json.lastModified);
          if (json.upToDate) { lastSavedValue = localDataStr; return localDataStr; }

          if (json.data && json.data.state) {
            let localState: any = {};
            if (localDataStr) { try { localState = JSON.parse(localDataStr).state || {}; } catch (e) { } }
            
            const cloudState = json.data.state;
            const mergedState = {
              ...cloudState,
              isSettingsOpen: false, settingsActiveTab: 'preferences', connectInitialTab: undefined,
              history: { ...(cloudState.history || {}) },
              dailyTimes: mergeDailyTimes(localState.dailyTimes || {}, cloudState.dailyTimes || {}),
              activeDesktopCustomIndex: localState.activeDesktopCustomIndex !== undefined ? localState.activeDesktopCustomIndex : cloudState.activeDesktopCustomIndex,
              activeMobileCustomIndex: localState.activeMobileCustomIndex !== undefined ? localState.activeMobileCustomIndex : cloudState.activeMobileCustomIndex,
              activeManifestationDesktopIndex: localState.activeManifestationDesktopIndex !== undefined ? localState.activeManifestationDesktopIndex : cloudState.activeManifestationDesktopIndex,
              activeManifestationMobileIndex: localState.activeManifestationMobileIndex !== undefined ? localState.activeManifestationMobileIndex : cloudState.activeManifestationMobileIndex,
              activePeekModeCustomIndex: localState.activePeekModeCustomIndex !== undefined ? localState.activePeekModeCustomIndex : cloudState.activePeekModeCustomIndex,
            };

            const cloudStr = JSON.stringify({ version: 2, state: mergedState });
            localStorage.setItem('dashboard-storage', cloudStr);

            if (JSON.stringify(mergeDailyTimes(localState.dailyTimes || {}, cloudState.dailyTimes || {})) !== JSON.stringify(cloudState.dailyTimes)) {
              lastSavedValue = JSON.stringify({ version: 2, state: cloudState });
              pendingValue = cloudStr; hasUnsavedChanges = true;
              if (!saveTimeout) saveTimeout = setTimeout(performSave, 1000);
            } else { lastSavedValue = cloudStr; }
            return cloudStr;
          }
        }
      } catch (e) { console.warn("Cloud fetch failed (network error), falling back to local cache."); }
    }
    if (!localDataStr) failedToLoadDB = true;
    lastSavedValue = localDataStr;
    return localDataStr;
  },
  setItem: async (_name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined' || isSyncingFromCloud || isAuthTransition) return;
    if (value === lastSavedValue) return;
    if (useDashboardStore?.getState && !useDashboardStore.getState()._hasHydrated) return;
    try { localStorage.setItem('dashboard-storage', value); } catch (e) { }
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      pendingValue = value;
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(performSave, 2000);
    }
  },
  removeItem: async (_name: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('dashboard-storage');
  },
}));
