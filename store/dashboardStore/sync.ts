import { createJSONStorage } from 'zustand/middleware';
import { useDashboardStore } from './index';
import { getLocalDateString } from '@/utils/date';
import {
  getSyncToken, getSyncLastModified, setSyncLastModified,
  mergeDailyTimes, mergeArraysById, mergeStringArrays
} from './helpers';

export let failedToLoadDB = false;
export let hasUnsavedChanges = false;
export let pendingValue: string | null = null;
export let lastSavedValue: string | null = null;
export let isSaving = false;
export let isSyncing = false; // Global lock to prevent overlapping saves
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
// ANTI-TAMPER SECURE QUEUE ENGINE
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
    // Legacy fallback or tampered format check
    if (!parsed.sig || !parsed.data) {
        localStorage.removeItem('unsaved_focus_mins');
        return {};
    }
    
    const token = getSyncToken() || "offline_fallback_salt";
    const expectedSig = generateHash(JSON.stringify(parsed.data) + token);
    
    // IF TAMPERED: Reject and delete
    if (expectedSig !== parsed.sig) {
        console.warn("🔒 Security Alert: Focus minutes tampering detected. Queue cleared.");
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
export const syncFocusQueue = async () => {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  const token = getSyncToken();
  if (!token) return;

  let queue = getSecureFocusQueue();
  if (Object.keys(queue).length === 0) return;

  let updatedQueue = { ...queue };
  let hasChanges = false;

  for (const dateStr of Object.keys(queue)) {
    const mins = queue[dateStr];
    if (mins <= 0) {
      delete updatedQueue[dateStr];
      hasChanges = true;
      continue;
    }

    try {
      const res = await fetch('/api/users/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ dateStr, minutes: mins })
      });
      
      if (res.ok) {
        delete updatedQueue[dateStr];
        hasChanges = true;
      }
    } catch (e) {
      console.warn(`[Sync] Failed to push focus queue for ${dateStr}. Will retry later.`, e);
    }
  }

  if (hasChanges) {
    setSecureFocusQueue(updatedQueue);
  }
};

// ----------------------------------------------------------------------
// CROSS-DEVICE TIMER CHECK: Poll cloud to see if active timer was stopped
// Returns: 'active' | 'stopped' | 'unknown' (unknown = network/error)
// Only call this after 5 minutes of running to avoid false positives.
// ----------------------------------------------------------------------
export const checkTimerStillActiveInDB = async (type: 'timer' | 'stopwatch'): Promise<'active' | 'stopped' | 'unknown'> => {
  if (typeof window === 'undefined' || !navigator.onLine) return 'unknown';
  const token = getSyncToken();
  if (!token) return 'unknown';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`/api/store?t=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return 'unknown';
    const json = await res.json();
    const cloudState = json?.data?.state;
    if (!cloudState) return 'unknown';

    if (type === 'timer') {
      // Timer is active if cloud still has a future timerEndAt
      if (cloudState.timerEndAt && cloudState.timerEndAt > Date.now()) return 'active';
      if (cloudState.timerEndAt === null || cloudState.timerEndAt === undefined) return 'stopped';
      return 'stopped'; // expired
    } else {
      // Stopwatch is active if cloud still has a stopwatchStartTime
      if (cloudState.stopwatchStartTime) return 'active';
      return 'stopped';
    }
  } catch {
    return 'unknown';
  }
};


// ----------------------------------------------------------------------
// MAIN STATE SAVE: Pushes UI state and settings to /api/store
// ----------------------------------------------------------------------
export const performSave = async () => {
  syncFocusQueue();

  if (!pendingValue || isSyncingFromCloud || isAuthTransition) {
    saveTimeout = null;
    return;
  }

  // 1. SYNC LOCK: Prevent overlapping saves. If already saving, reschedule and bail.
  if (isSyncing) {
    if (!saveTimeout) saveTimeout = setTimeout(performSave, 1000);
    return;
  }
  isSyncing = true; // Lock engaged

  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.warn("Offline: Dashboard save paused, keeping local changes safe until Wi-Fi connects.");
    hasUnsavedChanges = true;
    isSaving = false;
    isSyncing = false; // Release lock
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
    isSyncing = false; // Release lock
    return;
  }

  let success = false;
  try {
    const lastModified = getSyncLastModified();
    let modifiedCollections: string[] = [];
    let modifiedKeys: string[] = [];

    if (lastSavedValue) {
      const oldState = JSON.parse(lastSavedValue).state || {};
      const newState = JSON.parse(valueToSave).state || {};
      const TASK_KEYS = ['deadlines', 'syntheticDeadlines', 'deadlineAlertDays', 'dismissedDeadlineAlerts', 'plans'];
      const DAILY_ROUTINE_KEYS = ['dailyTimes'];
      const NOTES_KEYS = ['notes'];
      const ROADMAPS_KEYS = ['roadmaps'];
      const TIMETABLE_KEYS = ['timetableGrid', 'timetableColors', 'weekdayTimes', 'weekendTimes', 'timetableStartTime', 'timetableWeekendStartTime'];
      const DEADLINE_KEYS = ['deadlines', 'syntheticDeadlines', 'deadlineAlertDays', 'dismissedDeadlineAlerts', 'disableDeadlineLockOnToday', 'hideYouInLeaderboard'];
      const COUNTDOWN_KEYS = ['countdowns'];
      const TRANSIENT_KEYS = [
        'isSaving', 'hasUnsavedChanges', '_hasHydrated', 'isTaskManagerOpen', 'isCalendarOpen',
        'isTimetableOpen', 'isPlansOpen', 'isNotesOpen', 'isSettingsOpen', 'isNewsOpen',
        'isStatsOpen', 'isMobileCountdownsVisible', 'isCalendarBusy', 'expandedLeaderboardUserId',
        'pendingValue', 'saveTimeout', 'activeNoteId', 'activeCountdownIndex',
        'settingsActiveTab', 'connectInitialTab',
        ...DEADLINE_KEYS,
        ...COUNTDOWN_KEYS
      ];

      // ACTION SQUASHING: Detect and squash rapid slider/toggle changes
      Object.keys(newState).forEach(key => {
        if (JSON.stringify(newState[key]) !== JSON.stringify(oldState[key])) {
          modifiedKeys.push(key);
          if (TASK_KEYS.includes(key)) modifiedCollections.push('Tasks');
          else if (key === 'history') modifiedCollections.push('Stats');
          else if (DAILY_ROUTINE_KEYS.includes(key)) modifiedCollections.push('DailyRoutine');
          else if (NOTES_KEYS.includes(key)) modifiedCollections.push('Notes');
          else if (ROADMAPS_KEYS.includes(key)) modifiedCollections.push('Roadmaps');
          else if (TIMETABLE_KEYS.includes(key)) modifiedCollections.push('Timetable');
          else if (DEADLINE_KEYS.includes(key)) modifiedCollections.push('Deadlines');
          else if (!TRANSIENT_KEYS.includes(key)) modifiedCollections.push('Settings');
        }
      });
      modifiedCollections = [...new Set(modifiedCollections)];

      if (modifiedCollections.length === 0) {
        isSaving = false; hasUnsavedChanges = false; pendingValue = null; saveTimeout = null; 
        isSyncing = false; // Release lock
        return;
      }
    } else {
      // First save (no lastSavedValue): Treat as a FULL SYNC to prevent data loss on the server
      const newState = JSON.parse(valueToSave).state || {};
      modifiedKeys = Object.keys(newState);
      modifiedCollections = ['Tasks', 'Stats', 'DailyRoutine', 'Notes', 'Roadmaps', 'Settings', 'Deadlines', 'DashboardStorage'];
    }

    let parsedData = null;
    try {
      parsedData = JSON.parse(valueToSave);
    } catch (parseErr) {
      console.error("Failed to parse valueToSave:", parseErr);
      isSaving = false; isSyncing = false; return;
    }

    const LOCAL_ONLY_MEDIA_KEYS = ['customDesktopWallpapers', 'customMobileWallpapers', 'manifestationDesktopPhotos', 'manifestationMobilePhotos'];
    if (parsedData?.state) {
      LOCAL_ONLY_MEDIA_KEYS.forEach(key => {
        if (Array.isArray(parsedData.state[key])) {
          parsedData.state[key] = parsedData.state[key].filter((v: string) => typeof v === 'string' && !v.startsWith('data:'));
        }
      });
      if (typeof parsedData.state.peekModeWallpaper === 'string' && parsedData.state.peekModeWallpaper.startsWith('data:')) {
        delete parsedData.state.peekModeWallpaper;
      }

      // 1. STRIP massive transient data before sending to server to prevent infinite pending/413 errors
      delete parsedData.state.userGroups;
      delete parsedData.state.selectedGroupId;
      delete parsedData.state.viewingFriend;
      delete parsedData.state.syntheticDeadlines;
      delete parsedData.state.timerEndAt;
      delete parsedData.state.timerPausedLeft;
      delete parsedData.state.timerInitialMins;
      delete parsedData.state.stopwatchStartTime;

      // 2. DELTA SYNC: Only send the exact keys that were modified!
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
      modifiedCollections, 
      modifiedKeys,
      isFullSync: !lastSavedValue
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
          if (parsedLocal.state && parsedLocal.state[k] !== undefined) {
            userModifications[k] = parsedLocal.state[k];
          }
        });
      }

      const mergedState = {
        ...parsedLocal.state,          // Base: full local state (preserves Notes, Tasks, etc.)
        ...parsedCloud.state,          // Overlay: only the fields the server returned (e.g. just Settings)
        ...userModifications,          // User's own unsaved edits win on top
        history: parsedCloud.state?.history || parsedLocal.state?.history || {},
        dailyTimes: mergeDailyTimes(parsedLocal.state?.dailyTimes || {}, parsedCloud.state?.dailyTimes || {}),
        timerEndAt: (parsedLocal.state?.timerLastUpdated || 0) >= (parsedCloud.state?.timerLastUpdated || 0) ? parsedLocal.state?.timerEndAt : parsedCloud.state?.timerEndAt,
        timerPausedLeft: (parsedLocal.state?.timerLastUpdated || 0) >= (parsedCloud.state?.timerLastUpdated || 0) ? parsedLocal.state?.timerPausedLeft : parsedCloud.state?.timerPausedLeft,
        timerInitialMins: parsedLocal.state?.timerInitialMins !== undefined ? parsedLocal.state?.timerInitialMins : parsedCloud.state?.timerInitialMins,
        timerDeviceId: parsedLocal.state?.timerDeviceId !== undefined ? parsedLocal.state?.timerDeviceId : parsedCloud.state?.timerDeviceId,
        timerLastSavedChunks: parsedLocal.state?.timerLastSavedChunks !== undefined ? parsedLocal.state?.timerLastSavedChunks : parsedCloud.state?.timerLastSavedChunks,
        timerLastAlertedChunks: parsedLocal.state?.timerLastAlertedChunks !== undefined ? parsedLocal.state?.timerLastAlertedChunks : parsedCloud.state?.timerLastAlertedChunks,
        timerLastUpdated: parsedLocal.state?.timerLastUpdated !== undefined ? parsedLocal.state?.timerLastUpdated : parsedCloud.state?.timerLastUpdated,
        stopwatchStartTime: parsedCloud.state?.stopwatchStartTime !== undefined ? parsedCloud.state?.stopwatchStartTime : parsedLocal.state?.stopwatchStartTime,
        stopwatchDeviceId: parsedLocal.state?.stopwatchDeviceId !== undefined ? parsedLocal.state?.stopwatchDeviceId : parsedCloud.state?.stopwatchDeviceId,
        stopwatchLastSavedChunks: parsedLocal.state?.stopwatchLastSavedChunks !== undefined ? parsedLocal.state?.stopwatchLastSavedChunks : parsedCloud.state?.stopwatchLastSavedChunks,
        activeTaskId: parsedLocal.state?.activeTaskId !== undefined ? parsedLocal.state?.activeTaskId : parsedCloud.state?.activeTaskId,
        activeTaskTitle: parsedLocal.state?.activeTaskTitle !== undefined ? parsedLocal.state?.activeTaskTitle : parsedCloud.state?.activeTaskTitle,
      };

      if (mergedState.timerEndAt && mergedState.timerEndAt < Date.now()) {
        mergedState.timerEndAt = null; mergedState.timerPausedLeft = null;
        mergedState.timerInitialMins = null; mergedState.timerDeviceId = null;
      }

      const transientKeys = ['isQuotePopupOpen', 'isTaskManagerOpen', 'isStatsOpen', 'timerTrigger', 'isNotesOpen', 'isPlansOpen', 'isTimetableOpen', 'isDayStartModalOpen', 'isVideoMuted', 'isVideoPlaying', 'isSettingsOpen', 'isStopwatchOpen', '_hasHydrated', 'widgetZIndices', 'isAlarmPlaying', 'isTourOpen', 'isNewsOpen', 'isManifestationOpen', 'selectedGroupId'];
      transientKeys.forEach(key => delete (mergedState as any)[key]);

      const mergedStr = JSON.stringify({ version: 2, state: mergedState });

      isSyncingFromCloud = true;
      // CRITICAL: Update local timestamp instantly on conflict resolution
      setSyncLastModified(Math.max(Date.now(), (json.cloudLastModified || 0) + 1000));
      try { localStorage.setItem('dashboard-storage', mergedStr); } catch (e) { }
      useDashboardStore.setState(mergedState);

      pendingValue = mergedStr;
      hasUnsavedChanges = true;
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(performSave, 500);

      setTimeout(() => { isSyncingFromCloud = false; }, 500);
      isSaving = false;
      isSyncing = false; // Release lock
      return;
    }

    if (!res.ok) throw new Error(`API save failed with status ${res.status}`);

    const json = await res.json();
    
    // 2. CRITICAL: Update local timestamp INSTANTLY on success to prevent 409 loop
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
    isSyncing = false; // 1. Always release the lock
    
    if (success) {
      // 3. FLUSH LOCAL QUEUE instantly on success
      if (typeof window !== 'undefined') {
        localStorage.removeItem('deadlines_offline_queue');
        localStorage.removeItem('countdowns_offline_queue');
        localStorage.removeItem('tasks_offline_queue');
        localStorage.removeItem('notes_offline_queue');
        localStorage.removeItem('settings_offline_queue');
        localStorage.removeItem('timetable_offline_queue');
        localStorage.removeItem('daily_routine_offline_queue');
      }
      
      if (pendingValue === valueToSave) { 
        pendingValue = null; 
        hasUnsavedChanges = false; 
        saveTimeout = null; 
      } else { 
        // 4. ACTION SQUASHING: if more changes happened while syncing, delay the next batch slightly to squash them
        saveTimeout = setTimeout(performSave, 800); 
      }
    } else {
      setSyncLastModified(Date.now());
      hasUnsavedChanges = true;
      if (!saveTimeout) saveTimeout = setTimeout(performSave, 5000);
    }
  }
};

export const triggerInstantSave = () => {
  if (typeof window !== 'undefined') {
    if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
    saveTimeout = setTimeout(performSave, 0);
  }
};

export const forcePushTimerState = () => {
  if (typeof window !== 'undefined') {
    if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
    if (pendingValue) {
      if (!isSaving) { saveTimeout = setTimeout(performSave, 0); }
      const token = getSyncToken();
      if (token && navigator.onLine) {
        try {
          const parsedData = JSON.parse(pendingValue);
          
          const explicitModifiedKeys = ['timerEndAt', 'timerPausedLeft', 'timerInitialMins', 'timerDeviceId', 'timerLastSavedChunks', 'timerLastAlertedChunks', 'timerLastUpdated', 'activeTaskId', 'activeTaskTitle'];

          if (parsedData?.state) {
            delete parsedData.state.userGroups;
            delete parsedData.state.selectedGroupId;
            delete parsedData.state.viewingFriend;
            delete parsedData.state.syntheticDeadlines;

            // DELTA SYNC: Only send the explicit modified keys for this push
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
            lastModified: Date.now(),
            modifiedCollections: ['Settings'],
            modifiedKeys: explicitModifiedKeys
          });
          fetch('/api/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: payload,
            keepalive: true
          }).catch(() => {});
        } catch (e) { }
      }
    }
  }
};

export const pushCountdownsToDB = async (payload: any) => { };
export const pushDeadlinesToDB = async (payload: any) => { };
export const pushDailyRoutineToDB = async (payload: any) => { };
export const pushStreakToDB = (dateKey: string, minutes: number) => {
  if (typeof window === 'undefined' || minutes <= 0) return;

  const token = getSyncToken();

  if (!token || !navigator.onLine) {
    // Offline: write to queue, will flush when back online
    try {
      const queue = getSecureFocusQueue();
      queue[dateKey] = (queue[dateKey] || 0) + minutes;
      setSecureFocusQueue(queue);
    } catch (e) {}
    return;
  }

  // Online: fire directly — only fall back to queue on network failure
  fetch('/api/users/streak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ dateStr: dateKey, minutes })
  }).then(res => {
    if (!res.ok) throw new Error(`streak API ${res.status}`);
    // Success — nothing to queue, already committed to DB via $inc
  }).catch(() => {
    // Network failure: queue so syncFocusQueue retries later
    try {
      const queue = getSecureFocusQueue();
      queue[dateKey] = (queue[dateKey] || 0) + minutes;
      setSecureFocusQueue(queue);
    } catch (e) {}
  });
};
export const clearOldDataAPI = async (days: number) => {  };
export const clearAllDataAPI = async () => {  };

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
        
        // CONDITIONAL GET: Pass local timestamp to the server
        const localLastMod = getSyncLastModified() || 0;
        const res = await fetch(`/api/store?t=${Date.now()}&localModified=${localLastMod}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          failedToLoadDB = false;
          const json = await res.json();
          syncFocusQueue(); 
          
          if (json.lastModified) {
            setSyncLastModified(json.lastModified);
          }

          // FAST EXIT: If cloud says we are up to date, just return local data!
          if (json.upToDate) {
             lastSavedValue = localDataStr;
             return localDataStr;
          }

          if (json.data && json.data.state) {
            let localState: any = {};
            if (localDataStr) {
              try { localState = JSON.parse(localDataStr).state || {}; } catch (e) { }
            }

            const cloudState = json.data.state;
            const mergedHistory = { ...(cloudState.history || {}) };
            
            // Securely fetch queue to merge accurate UI history
            const queue = getSecureFocusQueue();
            for (const dateKey in queue) {
                if (queue[dateKey] > 0) {
                    mergedHistory[dateKey] = (mergedHistory[dateKey] || 0) + queue[dateKey];
                }
            }

            const mergedState = {
              ...cloudState,
              isSettingsOpen: false,
              settingsActiveTab: 'preferences',
              connectInitialTab: undefined,
              history: mergedHistory,
              dailyTimes: mergeDailyTimes(localState.dailyTimes || {}, cloudState.dailyTimes || {}),
              timerEndAt: localState.timerEndAt !== undefined ? localState.timerEndAt : cloudState.timerEndAt,
              timerPausedLeft: localState.timerPausedLeft !== undefined ? localState.timerPausedLeft : cloudState.timerPausedLeft,
              timerInitialMins: localState.timerInitialMins !== undefined ? localState.timerInitialMins : cloudState.timerInitialMins,
              timerDeviceId: localState.timerDeviceId !== undefined ? localState.timerDeviceId : cloudState.timerDeviceId,
              timerLastSavedChunks: localState.timerLastSavedChunks !== undefined ? localState.timerLastSavedChunks : cloudState.timerLastSavedChunks,
              timerLastAlertedChunks: localState.timerLastAlertedChunks !== undefined ? localState.timerLastAlertedChunks : cloudState.timerLastAlertedChunks,
              timerLastUpdated: localState.timerLastUpdated !== undefined ? localState.timerLastUpdated : cloudState.timerLastUpdated,
              stopwatchStartTime: localState.stopwatchStartTime !== undefined ? localState.stopwatchStartTime : cloudState.stopwatchStartTime,
              stopwatchDeviceId: localState.stopwatchDeviceId !== undefined ? localState.stopwatchDeviceId : cloudState.stopwatchDeviceId,
              stopwatchLastSavedChunks: localState.stopwatchLastSavedChunks !== undefined ? localState.stopwatchLastSavedChunks : cloudState.stopwatchLastSavedChunks,
              activeTaskId: localState.activeTaskId !== undefined ? localState.activeTaskId : cloudState.activeTaskId,
              activeTaskTitle: localState.activeTaskTitle !== undefined ? localState.activeTaskTitle : cloudState.activeTaskTitle,
              activeDesktopCustomIndex: localState.activeDesktopCustomIndex !== undefined ? localState.activeDesktopCustomIndex : cloudState.activeDesktopCustomIndex,
              activeMobileCustomIndex: localState.activeMobileCustomIndex !== undefined ? localState.activeMobileCustomIndex : cloudState.activeMobileCustomIndex,
              activeManifestationDesktopIndex: localState.activeManifestationDesktopIndex !== undefined ? localState.activeManifestationDesktopIndex : cloudState.activeManifestationDesktopIndex,
              activeManifestationMobileIndex: localState.activeManifestationMobileIndex !== undefined ? localState.activeManifestationMobileIndex : cloudState.activeManifestationMobileIndex,
              activePeekModeCustomIndex: localState.activePeekModeCustomIndex !== undefined ? localState.activePeekModeCustomIndex : cloudState.activePeekModeCustomIndex,
              peekModeWallpaper: localState.peekModeWallpaper !== undefined ? localState.peekModeWallpaper : cloudState.peekModeWallpaper,
            };

            const cloudStr = JSON.stringify({ version: 2, state: mergedState });
            localStorage.setItem('dashboard-storage', cloudStr);

            if (JSON.stringify(mergeDailyTimes(localState.dailyTimes || {}, cloudState.dailyTimes || {})) !== JSON.stringify(cloudState.dailyTimes)) {
              lastSavedValue = JSON.stringify({ version: 2, state: cloudState });
              pendingValue = cloudStr;
              hasUnsavedChanges = true;
              if (!saveTimeout) saveTimeout = setTimeout(performSave, 1000);
            } else {
              lastSavedValue = cloudStr;
            }
            return cloudStr;
          }
        }
      } catch (e) {
        console.warn("Cloud fetch failed (network error), falling back to local cache.");
      }
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