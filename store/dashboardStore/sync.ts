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
export let isSyncingFromCloud = false;
export let isAuthTransition = false;
export let bypassCloudSync = false;
export let abortInstantLoad = false;

let saveTimeout: NodeJS.Timeout | null = null;

export const setSyncingFromCloud = (val: boolean) => { isSyncingFromCloud = val; };
export const setAuthTransition = (val: boolean) => { isAuthTransition = val; };
export const setBypassCloudSync = (bypass: boolean = true) => { bypassCloudSync = bypass; };
export const setAbortInstantLoad = (val: boolean) => { abortInstantLoad = val; };

export const performSave = async () => {
  if (!pendingValue || isSyncingFromCloud || isAuthTransition) {
    saveTimeout = null;
    return;
  }

  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.warn("Offline: Dashboard save paused, keeping local changes safe until Wi-Fi connects.");
    hasUnsavedChanges = true;
    isSaving = false;
    if (!saveTimeout) saveTimeout = setTimeout(performSave, 5000);
    return;
  }

  const valueToSave = pendingValue;
  isSaving = true;

  if (failedToLoadDB || !getSyncToken()) {
    if (pendingValue === valueToSave) {
      pendingValue = null;
      hasUnsavedChanges = false;
      saveTimeout = null;
    } else {
      saveTimeout = setTimeout(performSave, 5000);
    }
    isSaving = false;
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

      Object.keys(newState).forEach(key => {
        if (JSON.stringify(newState[key]) !== JSON.stringify(oldState[key])) {
          modifiedKeys.push(key);
          if (TASK_KEYS.includes(key)) modifiedCollections.push('Tasks');
          else if (key === 'history') modifiedCollections.push('Stats');
          else if (DAILY_ROUTINE_KEYS.includes(key)) modifiedCollections.push('DailyRoutine');
          else if (NOTES_KEYS.includes(key)) modifiedCollections.push('Notes');
          else if (ROADMAPS_KEYS.includes(key)) modifiedCollections.push('Roadmaps');
          else if (TIMETABLE_KEYS.includes(key)) modifiedCollections.push('Settings');
          else if (!TRANSIENT_KEYS.includes(key)) modifiedCollections.push('Settings');
        }
      });
      modifiedCollections = [...new Set(modifiedCollections)];

      if (modifiedCollections.length === 0) {
        isSaving = false;
        hasUnsavedChanges = false;
        pendingValue = null;
        saveTimeout = null;
        return;
      }
    }

    let parsedData = null;
    try {
      parsedData = JSON.parse(valueToSave);
    } catch (parseErr) {
      console.error("Failed to parse valueToSave:", parseErr);
      isSaving = false;
      return;
    }

    const LOCAL_ONLY_MEDIA_KEYS = [
      'customDesktopWallpapers', 'customMobileWallpapers',
      'manifestationDesktopPhotos', 'manifestationMobilePhotos',
    ];
    if (parsedData?.state) {
      LOCAL_ONLY_MEDIA_KEYS.forEach(key => {
        if (Array.isArray(parsedData.state[key])) {
          parsedData.state[key] = parsedData.state[key].filter(
            (v: string) => typeof v === 'string' && !v.startsWith('data:')
          );
        }
      });
      if (typeof parsedData.state.peekModeWallpaper === 'string' && parsedData.state.peekModeWallpaper.startsWith('data:')) {
        delete parsedData.state.peekModeWallpaper;
      }
    }

    const payload = JSON.stringify({ data: parsedData, lastModified, modifiedCollections, modifiedKeys });
    
    const res = await fetch('/api/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSyncToken()}`
      },
      body: payload,
    });

    if (res.status === 409) {
      const json = await res.json();
      const parsedCloud = json.cloudData;
      const parsedLocal = JSON.parse(valueToSave);

      const localHistory = parsedLocal.state.history || {};
      const cloudHistory = parsedCloud.state.history || {};
      const mergedHistory = { ...localHistory };
      for (const date in cloudHistory) {
        if (mergedHistory[date] !== undefined) {
          mergedHistory[date] = Math.max(mergedHistory[date], cloudHistory[date]);
        } else {
          mergedHistory[date] = cloudHistory[date];
        }
      }

      const localDailyTimes = parsedLocal.state.dailyTimes || {};
      const cloudDailyTimes = parsedCloud.state.dailyTimes || {};
      const mergedDailyTimes = mergeDailyTimes(localDailyTimes, cloudDailyTimes);

      const localHasSeen = parsedLocal.state?.hasSeenOnboarding || (typeof window !== 'undefined' && localStorage.getItem('grindboard_has_seen_onboarding') === 'true');
      const cloudHasSeen = parsedCloud.state?.hasSeenOnboarding;
      const mergedHasSeenOnboarding = Boolean(localHasSeen || cloudHasSeen);

      const mergedState = {
        ...parsedCloud.state,
        ...parsedLocal.state,
        history: mergedHistory,
        dailyTimes: mergedDailyTimes,
        hasSeenOnboarding: mergedHasSeenOnboarding,
        timetableGrid: parsedCloud.state.timetableGrid || parsedLocal.state.timetableGrid,
        timetableColors: parsedCloud.state.timetableColors || parsedLocal.state.timetableColors,
        weekdayTimes: parsedCloud.state.weekdayTimes || parsedLocal.state.weekdayTimes,
        weekendTimes: parsedCloud.state.weekendTimes || parsedLocal.state.weekendTimes,
        deadlines: parsedCloud.state.deadlines || parsedLocal.state.deadlines,
        syntheticDeadlines: parsedCloud.state.syntheticDeadlines || parsedLocal.state.syntheticDeadlines,
        deadlineAlertDays: parsedCloud.state.deadlineAlertDays || parsedLocal.state.deadlineAlertDays,
        dismissedDeadlineAlerts: parsedCloud.state.dismissedDeadlineAlerts || parsedLocal.state.dismissedDeadlineAlerts,
        roadmaps: mergeArraysById(parsedLocal.state.roadmaps, parsedCloud.state.roadmaps),
        plans: mergeArraysById(parsedLocal.state.plans, parsedCloud.state.plans),
        customAlarmSounds: mergeArraysById(parsedLocal.state.customAlarmSounds, parsedCloud.state.customAlarmSounds),
        timerEndAt: ((parsedLocal.state.timerLastUpdated || 0) >= (parsedCloud.state.timerLastUpdated || 0)) ? (parsedLocal.state.timerEndAt ?? null) : (parsedCloud.state.timerEndAt ?? null),
        timerPausedLeft: ((parsedLocal.state.timerLastUpdated || 0) >= (parsedCloud.state.timerLastUpdated || 0)) ? (parsedLocal.state.timerPausedLeft ?? null) : (parsedCloud.state.timerPausedLeft ?? null),
        timerInitialMins: ((parsedLocal.state.timerLastUpdated || 0) >= (parsedCloud.state.timerLastUpdated || 0)) ? (parsedLocal.state.timerInitialMins ?? null) : (parsedCloud.state.timerInitialMins ?? null),
        timerDeviceId: ((parsedLocal.state.timerLastUpdated || 0) >= (parsedCloud.state.timerLastUpdated || 0)) ? (parsedLocal.state.timerDeviceId ?? null) : (parsedCloud.state.timerDeviceId ?? null),
        timerLastUpdated: Math.max(parsedLocal.state.timerLastUpdated || 0, parsedCloud.state.timerLastUpdated || 0),
        timerLastSavedChunks: ((parsedLocal.state.timerLastUpdated || 0) >= (parsedCloud.state.timerLastUpdated || 0)) ? (parsedLocal.state.timerLastSavedChunks || 0) : (parsedCloud.state.timerLastSavedChunks || 0),
        timerLastAlertedChunks: ((parsedLocal.state.timerLastUpdated || 0) >= (parsedCloud.state.timerLastUpdated || 0)) ? (parsedLocal.state.timerLastAlertedChunks || 0) : (parsedCloud.state.timerLastAlertedChunks || 0),
        activeTaskId: ((parsedLocal.state.timerLastUpdated || 0) >= (parsedCloud.state.timerLastUpdated || 0)) ? (parsedLocal.state.activeTaskId ?? null) : (parsedCloud.state.activeTaskId ?? null),
        activeTaskTitle: ((parsedLocal.state.timerLastUpdated || 0) >= (parsedCloud.state.timerLastUpdated || 0)) ? (parsedLocal.state.activeTaskTitle ?? null) : (parsedCloud.state.activeTaskTitle ?? null),
        manifestationDesktopPhotos: mergeStringArrays(parsedLocal.state.manifestationDesktopPhotos, parsedCloud.state.manifestationDesktopPhotos, parsedCloud.state.manifestationDesktopPhotos),
        manifestationMobilePhotos: mergeStringArrays(parsedLocal.state.manifestationMobilePhotos, parsedCloud.state.manifestationMobilePhotos, parsedCloud.state.manifestationMobilePhotos),
        customDesktopWallpapers: mergeStringArrays(parsedLocal.state.customDesktopWallpapers, parsedCloud.state.customDesktopWallpapers, parsedCloud.state.customDesktopWallpapers),
        customMobileWallpapers: mergeStringArrays(parsedLocal.state.customMobileWallpapers, parsedCloud.state.customMobileWallpapers, parsedCloud.state.customMobileWallpapers),
        customQuotes: mergeStringArrays(parsedLocal.state.customQuotes, parsedCloud.state.customQuotes, parsedCloud.state.customQuotes),
        manifestationCustomQuotes: mergeStringArrays(parsedLocal.state.manifestationCustomQuotes, parsedCloud.state.manifestationCustomQuotes, parsedCloud.state.manifestationCustomQuotes),
        activeDesktopCustomIndex: (parsedLocal.state.activeDesktopCustomIndex !== undefined && parsedLocal.state.activeDesktopCustomIndex !== null) ? parsedLocal.state.activeDesktopCustomIndex : parsedCloud.state.activeDesktopCustomIndex,
        activeMobileCustomIndex: (parsedLocal.state.activeMobileCustomIndex !== undefined && parsedLocal.state.activeMobileCustomIndex !== null) ? parsedLocal.state.activeMobileCustomIndex : parsedCloud.state.activeMobileCustomIndex,
        activeManifestationDesktopIndex: (parsedLocal.state.activeManifestationDesktopIndex !== undefined && parsedLocal.state.activeManifestationDesktopIndex !== null) ? parsedLocal.state.activeManifestationDesktopIndex : parsedCloud.state.activeManifestationDesktopIndex,
        activeManifestationMobileIndex: (parsedLocal.state.activeManifestationMobileIndex !== undefined && parsedLocal.state.activeManifestationMobileIndex !== null) ? parsedLocal.state.activeManifestationMobileIndex : parsedCloud.state.activeManifestationMobileIndex,
        peekModeWallpaper: (parsedLocal.state.peekModeWallpaper !== undefined && parsedLocal.state.peekModeWallpaper !== null) ? parsedLocal.state.peekModeWallpaper : parsedCloud.state.peekModeWallpaper,
      };

      if (mergedState.timerEndAt && mergedState.timerEndAt < Date.now()) {
        mergedState.timerEndAt = null;
        mergedState.timerPausedLeft = null;
        mergedState.timerInitialMins = null;
        mergedState.timerDeviceId = null;
        mergedState.timerLastSavedChunks = 0;
        mergedState.timerLastAlertedChunks = 0;
        mergedState.activeTaskId = null;
        mergedState.activeTaskTitle = null;
      }

      const transientKeys = [
        'isQuotePopupOpen', 'isTaskManagerOpen', 'isStatsOpen', 'timerTrigger',
        'isNotesOpen', 'isPlansOpen', 'isTimetableOpen', 'isDayStartModalOpen',
        'isVideoMuted', 'isVideoPlaying', 'isSettingsOpen', 'isStopwatchOpen', '_hasHydrated',
        'widgetZIndices', 'isAlarmPlaying', 'isTourOpen', 'isNewsOpen', 'isManifestationOpen',
        'selectedGroupId'
      ];
      transientKeys.forEach(key => delete (mergedState as any)[key]);

      const mergedData = { version: 2, state: mergedState };
      const mergedStr = JSON.stringify(mergedData);

      isSyncingFromCloud = true;
      setSyncLastModified(Date.now());
      try { localStorage.setItem('dashboard-storage', mergedStr); } catch (e) { }
      useDashboardStore.setState(mergedState);

      pendingValue = mergedStr;
      hasUnsavedChanges = true;
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(performSave, 500);

      setTimeout(() => { isSyncingFromCloud = false; }, 500);
      isSaving = false;
      return;
    }

    if (!res.ok) throw new Error(`API save failed with status ${res.status}`);

    const json = await res.json();
    setSyncLastModified(json.lastModified);
    success = true;
    lastSavedValue = valueToSave;
  } catch (err) {
    console.warn("Failed to save to DB, storing locally:", err);
  } finally {
    isSaving = false;
    if (success) {
      if (pendingValue === valueToSave) {
        pendingValue = null;
        hasUnsavedChanges = false;
        saveTimeout = null;
      } else {
        saveTimeout = setTimeout(performSave, 500);
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
          const payload = JSON.stringify({
            data: parsedData,
            lastModified: Date.now(),
            modifiedCollections: ['Settings'],
            modifiedKeys: ['timerEndAt', 'timerPausedLeft', 'timerInitialMins', 'timerDeviceId', 'timerLastSavedChunks', 'timerLastAlertedChunks', 'timerLastUpdated', 'activeTaskId', 'activeTaskTitle']
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

export const pushCountdownsToDB = async (payload: any) => {
  if (typeof window === 'undefined') return;
  const token = getSyncToken();
  if (!token) return;
  try {
    await fetch('/api/countdowns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
  } catch (e) { console.error('Failed to push countdowns', e); }
};

export const pushDeadlinesToDB = async (payload: any) => {
  if (typeof window === 'undefined') return;
  const token = getSyncToken();
  if (!token) return;
  try {
    await fetch('/api/deadlines', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
  } catch (e) { console.error("Failed to push deadlines", e); }
};

export const pushDailyRoutineToDB = async (payload: any) => {
  if (typeof window === 'undefined') return;
  const token = getSyncToken();
  if (!token) return;
  try {
    const statePayload = JSON.stringify({
      data: { state: payload, version: 2 },
      lastModified: Date.now(),
      modifiedCollections: ['DailyRoutine'],
      modifiedKeys: Object.keys(payload)
    });
    await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: statePayload
    });
  } catch (e) { console.error('Failed to push daily routine', e); }
};

export const pushStreakToDB = (dateKey: string, minutes: number) => {
  const token = getSyncToken();
  if (token) {
    fetch('/api/users/streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ dateStr: dateKey, minutes })
    }).catch(err => console.error("Streak sync error:", err));
  }
};

export const clearOldDataAPI = async (days: number) => {
  const token = getSyncToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  await fetch(`/api/health?action=olderThan&days=${days}`, { method: 'DELETE', headers });
};

export const clearAllDataAPI = async () => {
  const token = getSyncToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  await fetch(`/api/health?action=deleteAll`, { method: 'DELETE', headers });
  await fetch('/api/store', {
    method: 'POST',
    headers,
    body: JSON.stringify({ clearAll: true })
  });
};

if (typeof window !== 'undefined') {
  const triggerAutoSyncOnOnline = () => {
    try {
      const stateObj = useDashboardStore.getState();
      if (!stateObj || typeof stateObj !== 'object' || !stateObj._hasHydrated) return;

      const filteredState = { ...stateObj } as any;
      const transientKeys = [
        'isQuotePopupOpen', 'isTaskManagerOpen', 'isStatsOpen', 'timerTrigger',
        'isNotesOpen', 'isPlansOpen', 'isTimetableOpen', 'isDayStartModalOpen',
        'isVideoMuted', 'isVideoPlaying', 'isSettingsOpen', 'isStopwatchOpen', '_hasHydrated',
        'widgetZIndices', 'isAlarmPlaying', 'isTourOpen', 'isNewsOpen', 'isManifestationOpen',
        'settingsActiveTab', 'connectInitialTab'
      ];
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
      abortInstantLoad = false;
      bypassCloudSync = false;
      lastSavedValue = localDataStr;
      return localDataStr;
    }

    if (token) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`/api/store?t=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          failedToLoadDB = false;
          const json = await res.json();

          if (json.data && json.data.state) {
            let localState: any = {};
            if (localDataStr) {
              try { localState = JSON.parse(localDataStr).state || {}; } catch (e) { }
            }

            const localModified = localState.lastModified || 0;
            const cloudModified = json.lastModified || 0;
            const isLocalNewer = localModified > cloudModified;

            const localHistory = localState.history || {};
            const cloudHistory = json.data.state.history || {};
            const mergedHistory = isLocalNewer ? { ...cloudHistory, ...localHistory } : { ...localHistory, ...cloudHistory };
            
            const todayKey = getLocalDateString();
            const localToday = localHistory[todayKey] || 0;
            const cloudToday = cloudHistory[todayKey] || 0;
            if (isLocalNewer && localToday === 0 && cloudToday > 0) mergedHistory[todayKey] = cloudToday;
            else if (!isLocalNewer && cloudToday === 0 && localToday > 0) mergedHistory[todayKey] = localToday;

            const localDailyTimes = localState.dailyTimes || {};
            const cloudDailyTimes = json.data.state.dailyTimes || {};
            const mergedDailyTimes = mergeDailyTimes(localDailyTimes, cloudDailyTimes);

            const mergedState = {
              ...json.data.state,
              isSettingsOpen: false,
              settingsActiveTab: 'preferences',
              connectInitialTab: undefined,
              history: mergedHistory,
              dailyTimes: mergedDailyTimes,
              activeDesktopCustomIndex: localState.activeDesktopCustomIndex !== undefined ? localState.activeDesktopCustomIndex : json.data.state.activeDesktopCustomIndex,
              activeMobileCustomIndex: localState.activeMobileCustomIndex !== undefined ? localState.activeMobileCustomIndex : json.data.state.activeMobileCustomIndex,
              activeManifestationDesktopIndex: localState.activeManifestationDesktopIndex !== undefined ? localState.activeManifestationDesktopIndex : json.data.state.activeManifestationDesktopIndex,
              activeManifestationMobileIndex: localState.activeManifestationMobileIndex !== undefined ? localState.activeManifestationMobileIndex : json.data.state.activeManifestationMobileIndex,
              activePeekModeCustomIndex: localState.activePeekModeCustomIndex !== undefined ? localState.activePeekModeCustomIndex : json.data.state.activePeekModeCustomIndex,
              peekModeWallpaper: localState.peekModeWallpaper !== undefined ? localState.peekModeWallpaper : json.data.state.peekModeWallpaper,
            };

            const cloudStr = JSON.stringify({ version: 2, state: mergedState });
            localStorage.setItem('dashboard-storage', cloudStr);
            
            const hasOfflineStatsToPush = JSON.stringify(mergedHistory) !== JSON.stringify(cloudHistory) || JSON.stringify(mergedDailyTimes) !== JSON.stringify(cloudDailyTimes);
            if (hasOfflineStatsToPush) {
              lastSavedValue = JSON.stringify({ version: 2, state: json.data.state });
              pendingValue = cloudStr;
              hasUnsavedChanges = true;
              if (!saveTimeout) saveTimeout = setTimeout(performSave, 5000);
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