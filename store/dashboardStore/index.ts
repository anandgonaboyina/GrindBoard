import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardState, CustomAlarmSound } from './types';
import { getLocalDateString } from '@/utils/date';
import { filterActiveDeadlines, mergeDailyTimes } from './helpers';
import { useTaskStore } from '@/store/taskStore';

import {
  getSyncToken, getSyncLastModified, setSyncLastModified,
  mergeArraysById
} from './helpers';

import { 
  fileStorage, triggerInstantSave, pushStreakToDB, 
  clearOldDataAPI, clearAllDataAPI, forcePushTimerState, checkTimerStillActiveInDB
} from './sync';

// ----------------------------------------------------------------------
// ATOMIC OFFLINE QUEUES
// ----------------------------------------------------------------------
const processQueue = async (queueName: string, url: string) => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token) return;

    const queueStr = localStorage.getItem(queueName);
    if (!queueStr) return;

    let actions: any[] = [];
    try { actions = JSON.parse(queueStr); } catch (e) { return; }
    if (actions.length === 0) return;

    try {
        const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ actions })
        });
        if (res.ok) localStorage.removeItem(queueName);
    } catch (e) { console.warn(`[Queue] Failed to push ${queueName}`); }
};

// Settings
export const syncSettingsQueue = () => processQueue('settings_offline_queue', '/api/settings');
let syncSettingsTimeout: NodeJS.Timeout | null = null;
export const queueSettingsAction = (updates: Record<string, any>) => {
    if (typeof window === 'undefined') return;
    let queue: any[] = [];
    try { const qs = localStorage.getItem('settings_offline_queue'); if (qs) queue = JSON.parse(qs); } catch (e) {}
    if (queue.length > 0 && queue[queue.length - 1].type === 'UPDATE_SETTINGS') {
        queue[queue.length - 1].updates = { ...queue[queue.length - 1].updates, ...updates };
    } else queue.push({ type: 'UPDATE_SETTINGS', updates });
    localStorage.setItem('settings_offline_queue', JSON.stringify(queue));
    if (navigator.onLine) {
        if (syncSettingsTimeout) clearTimeout(syncSettingsTimeout);
        syncSettingsTimeout = setTimeout(syncSettingsQueue, 1500);
    }
};

const SETTING_ARRAY_KEYS = [
  'customDesktopWallpapers', 'customMobileWallpapers', 'hiddenWallpapers', 'activeDesktopCustomIndex', 'activeMobileCustomIndex', 'customLocalWallpaperName',
  'widgetOffsets', 'clockOffsets', 'lockedWidgets', 'panicWallpaperSwitch', 'enableAlarmSound', 'enableAlarmVibration', 'enablePanicButton',
  'manifestationDesktopPhotos', 'manifestationMobilePhotos', 'activeManifestationDesktopIndex', 'activeManifestationMobileIndex',
  'manifestationCustomQuotes', 'customQuotes', 'customAlarmSounds', 'showManifestationBoard', 'hasSeenOnboarding', 'hideConfig', 'mobileHideConfig', 
  'panicButtonMode', 'panicShortcutKey', 'focusShortcutKey', 'selectedSound', 'alarmVolume', 'dashboardScale', 'mobileDashboardScale', 'dockScale',
  'dockOffset', 'rightWidgetsOffset', 'enableRightToolbarPeek', 'autoOpenCountdowns', 'activeTheme', 'clockStyle', 'fontFamily', 'soundEffectVolume', 'currentBgType',
  'selectedLocalWallpaperName', 'timetableGrid', 'timetableColors', 'weekdayTimes', 'weekendTimes', 'timetableStartTime', 'timetableWeekendStartTime'
];
export const queueSetting = (key: string, value: any) => {
   if (SETTING_ARRAY_KEYS.includes(key)) queueSettingsAction({ [key]: value });
   else if ((key.startsWith('show') || key.startsWith('hide') || key.startsWith('is')) && key !== 'hideConfig' && key !== 'mobileHideConfig') queueSettingsAction({ [`displaySettings.${key}`]: value });
   else queueSettingsAction({ [`generalSettings.${key}`]: value });
};

// Deadlines
export const syncDeadlinesQueue = () => processQueue('deadlines_offline_queue', '/api/deadlines');
const queueDeadlineAction = (action: any) => {
    if (typeof window === 'undefined') return;
    let queue: any[] = [];
    try { const qs = localStorage.getItem('deadlines_offline_queue'); if (qs) queue = JSON.parse(qs); } catch (e) {}
    queue.push(action);
    localStorage.setItem('deadlines_offline_queue', JSON.stringify(queue));
    if (navigator.onLine) syncDeadlinesQueue();
};
let deadlineTypingTimer: NodeJS.Timeout | null = null;

// Countdowns
export const syncCountdownsQueue = () => processQueue('countdowns_offline_queue', '/api/countdowns');
const queueCountdownAction = (action: any) => {
    if (typeof window === 'undefined') return;
    let queue: any[] = [];
    try { const qs = localStorage.getItem('countdowns_offline_queue'); if (qs) queue = JSON.parse(qs); } catch (e) {}
    queue.push(action);
    localStorage.setItem('countdowns_offline_queue', JSON.stringify(queue));
    if (navigator.onLine) syncCountdownsQueue();
};

// Daily Routine
export const syncDailyRoutineQueue = () => processQueue('daily_routine_offline_queue', '/api/daily-routine');
const queueDailyRoutineAction = (action: any) => {
    if (typeof window === 'undefined') return;
    let queue: any[] = [];
    try { const qs = localStorage.getItem('daily_routine_offline_queue'); if (qs) queue = JSON.parse(qs); } catch (e) {}
    queue.push(action);
    localStorage.setItem('daily_routine_offline_queue', JSON.stringify(queue));
    if (navigator.onLine) syncDailyRoutineQueue();
};

// Roadmaps 
export const syncRoadmapsQueue = () => processQueue('roadmaps_offline_queue', '/api/roadmap');
let roadmapDebounceTimer: NodeJS.Timeout | null = null;
const queueRoadmapAction = (action: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('roadmaps_offline_queue', JSON.stringify([action]));
    if (navigator.onLine) {
        if (roadmapDebounceTimer) clearTimeout(roadmapDebounceTimer);
        roadmapDebounceTimer = setTimeout(syncRoadmapsQueue, 1500);
    }
};

if (typeof window !== 'undefined') {
    const runAllQueues = () => {
        syncSettingsQueue(); syncDeadlinesQueue(); syncCountdownsQueue(); 
        syncDailyRoutineQueue(); syncRoadmapsQueue();
    };
    window.addEventListener('online', runAllQueues);
    window.addEventListener('app_sync_now', runAllQueues);
}

// ----------------------------------------------------------------------
// MAIN DASHBOARD STORE
// ----------------------------------------------------------------------
export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      wallpaper: '/wallpapers/naruto.webp',
      bgIndex: 0,
      currentBgType: null,
      lockedWallpaper: null,
      history: {},
      syncTodayFocus: async () => {
          if (typeof window === 'undefined' || !navigator.onLine) return;
          try {
            const token = localStorage.getItem('dashboard_sync_token');
            if (!token) return;
            
            const localLastMod = getSyncLastModified() || 0;
            const res = await fetch(`/api/store?t=${Date.now()}&localModified=${localLastMod}`, {
              method: 'GET', headers: { 'Authorization': `Bearer ${token}` }, signal: AbortSignal.timeout(5000)
            });
            
            const json = await res.json();
            if (json.upToDate) return; 

            if (res.ok && json.data?.state?.history) {
              const clientOffset = new Date().getTimezoneOffset();
              const now = Date.now();
              const localMs = now - (clientOffset * 60 * 1000);
              const todayStr = new Date(localMs).toISOString().split('T')[0];
              const dbToday = json.data.state.history[todayStr] || 0;
              const currentLocal = get().history[todayStr] || 0;
              
              if (dbToday != currentLocal) {
                set((state) => ({ history: { ...state.history, [todayStr]: dbToday } }));
              }
            }
          } catch (e) {}
        },
      isHidden: false,
      _hasHydrated: false,
      theme: 'dark',
      notesThemeOverride: 'light',
      timetableThemeOverride: 'light',
      userGroups: [],
      setUserGroups: (groups) => set({ userGroups: groups }),
      selectedGroupId: null,
      setSelectedGroupId: (id) => set({ selectedGroupId: id }),
      setTheme: (theme) => set((state) => {
        queueSettingsAction({ 'generalSettings.theme': theme, 'generalSettings.notesThemeOverride': null, 'generalSettings.timetableThemeOverride': null });
        return { theme, notesThemeOverride: null, timetableThemeOverride: null };
      }),
      setNotesThemeOverride: (theme) => set((state) => { queueSetting('notesThemeOverride', theme); return { notesThemeOverride: theme }; }),
      setTimetableThemeOverride: (theme) => set((state) => { queueSetting('timetableThemeOverride', theme); return { timetableThemeOverride: theme }; }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      toggleLockWallpaper: () => set((state) => { const nextVal = state.lockedWallpaper ? null : state.wallpaper; queueSetting('lockedWallpaper', nextVal); return { lockedWallpaper: nextVal }; }),
      setLockedWallpaper: (filename) => set((state) => { queueSetting('lockedWallpaper', filename); return { lockedWallpaper: filename }; }),
      setWallpaper: (url) => set((state) => { queueSetting('wallpaper', url); return { wallpaper: url }; }),
      cycleBackground: () => set((state) => {
        const BUILT_IN = [ "/wallpapers/naruto.webp", "https://static.toiimg.com/photo/imgsize-23456,msid-122440968,resizemode-4/naruto-vs-sasuke.jpg", "https://images4.alphacoders.com/140/1402795.mp4", "https://images4.alphacoders.com/476/thumb-1920-47698.png" ];
        const nextIndex = (state.bgIndex + 1) % BUILT_IN.length;
        queueSettingsAction({ 'generalSettings.lockedWallpaper': null, 'generalSettings.bgIndex': nextIndex, 'generalSettings.wallpaper': BUILT_IN[nextIndex] });
        return { lockedWallpaper: null, bgIndex: nextIndex, wallpaper: BUILT_IN[nextIndex] };
      }),
      setCurrentBgType: (type) => set((state) => { queueSetting('currentBgType', type); return { currentBgType: type }; }),
      isVideoMuted: true,
      setIsVideoMuted: (muted) => set({ isVideoMuted: muted }),
      isVideoPlaying: true,
      setIsVideoPlaying: (playing) => set({ isVideoPlaying: playing }),

      customDesktopWallpapers: [],
      setCustomDesktopWallpapers: (urls) => set((state) => { queueSetting('customDesktopWallpapers', urls); return { customDesktopWallpapers: urls }; }),
      activeDesktopCustomIndex: null,
      setActiveDesktopCustomIndex: (index) => set((state) => { queueSetting('activeDesktopCustomIndex', index); return { activeDesktopCustomIndex: index }; }),

      customMobileWallpapers: [],
      setCustomMobileWallpapers: (urls) => set((state) => { queueSetting('customMobileWallpapers', urls); return { customMobileWallpapers: urls }; }),
      activeMobileCustomIndex: null,
      setActiveMobileCustomIndex: (index) => set((state) => { queueSetting('activeMobileCustomIndex', index); return { activeMobileCustomIndex: index }; }),

      showManifestationBoard: true,
      setShowManifestationBoard: (show) => set((state) => { queueSetting('showManifestationBoard', show); return { showManifestationBoard: show }; }),
      isManifestationOpen: false,
      setIsManifestationOpen: (open) => set({ isManifestationOpen: open }),
      toggleManifestationOpen: () => set((state) => ({ isManifestationOpen: !state.isManifestationOpen })),

      manifestationDesktopPhotos: [],
      setManifestationDesktopPhotos: (urls) => set((state) => { queueSetting('manifestationDesktopPhotos', urls); return { manifestationDesktopPhotos: urls }; }),
      activeManifestationDesktopIndex: null,
      setActiveManifestationDesktopIndex: (index) => set((state) => { queueSetting('activeManifestationDesktopIndex', index); return { activeManifestationDesktopIndex: index }; }),

      manifestationMobilePhotos: [],
      setManifestationMobilePhotos: (urls) => set((state) => { queueSetting('manifestationMobilePhotos', urls); return { manifestationMobilePhotos: urls }; }),
      activeManifestationMobileIndex: null,
      setActiveManifestationMobileIndex: (index) => set((state) => { queueSetting('activeManifestationMobileIndex', index); return { activeManifestationMobileIndex: index }; }),

        addMins: (dateKey, mins) => {
        set((state) => {
          const oldTotal = state.history[dateKey] || 0;
          const newTotal = oldTotal + mins;
          if (typeof window !== 'undefined') { pushStreakToDB(dateKey, mins); }
          const existingWorkStarted = (state.dailyTimes[dateKey] || {}).workStartedTime;
          const newBedTime = Date.now();

          if (!existingWorkStarted) { queueDailyRoutineAction({ type: 'UPDATE_DAILY_TIME', dateKey, field: 'workStartedTime', timestamp: newBedTime }); }
          queueDailyRoutineAction({ type: 'UPDATE_DAILY_TIME', dateKey, field: 'bedTime', timestamp: newBedTime });

          return {
            history: { ...state.history, [dateKey]: newTotal },
            dailyTimes: { ...state.dailyTimes, [dateKey]: { ...(state.dailyTimes[dateKey] || {}), workStartedTime: existingWorkStarted || newBedTime, bedTime: newBedTime } },
            lastModified: Date.now()
          } as any;
        });
      },

      toggleHide: () => set((state) => {
        if (state.isPanicHidden) return {}; 
        const nextVal = !state.isHidden; queueSetting('isHidden', nextVal);
        return { isHidden: nextVal };
      }),

      isTaskManagerOpen: false,
      toggleTaskManager: () => set((state) => {
        const next = !state.isTaskManagerOpen; let extra = {};
        if (next) { const currentZ = state.widgetZIndices || {}; const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50; extra = { widgetZIndices: { ...currentZ, tasks: maxZ + 1 } }; }
        return { isTaskManagerOpen: next, ...extra };
      }),

      isStatsOpen: false,
      toggleStats: () => set((state) => ({ isStatsOpen: !state.isStatsOpen })),

      isTimerOpen: false,
      toggleTimer: () => set((state) => {
        const next = !state.isTimerOpen; let extra = {};
        if (next) { const currentZ = state.widgetZIndices || {}; const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50; extra = { widgetZIndices: { ...currentZ, timer: maxZ + 1 } }; }
        return { isTimerOpen: next, ...extra };
      }),

      isCalendarOpen: false,
      isCalendarBusy: false,
      setIsCalendarBusy: (busy) => set({ isCalendarBusy: busy }),
      toggleCalendar: () => set((state) => {
        const next = !state.isCalendarOpen; let extra = {};
        if (next) { const currentZ = state.widgetZIndices || {}; const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50; extra = { widgetZIndices: { ...currentZ, calendar: maxZ + 1 } }; }
        return { isCalendarOpen: next, ...extra };
      }),

      isClockOpen: true,
      toggleClock: () => set((state) => {
        const next = !state.isClockOpen; let extra = {};
        if (next) { const currentZ = state.widgetZIndices || {}; const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50; extra = { widgetZIndices: { ...currentZ, clock: maxZ + 1 } }; }
        return { isClockOpen: next, ...extra };
      }),

      isSettingsOpen: false,
      lastSeenNewsTime: 0,
      updateLastSeenNews: (timestamp) => set((state) => {
          queueSetting('lastSeenNewsTime', timestamp);
          return { lastSeenNewsTime: timestamp, lastModified: Date.now() };
      }),
      isNewsOpen: false,
      hasUnreadNews: true,
      toggleNews: () => set((state) => ({ isNewsOpen: !state.isNewsOpen })),
      setHasUnreadNews: (val: boolean) => set((state) => { queueSetting('hasUnreadNews', val); return { hasUnreadNews: val }; }),
      settingsActiveTab: 'preferences',
      connectInitialTab: undefined,

      toggleSettings: () => set((state) => {
        const willClose = state.isSettingsOpen;
        if (willClose && typeof window !== 'undefined') { triggerInstantSave(); }
        return {
          isSettingsOpen: !state.isSettingsOpen, isAlarmPlaying: false, isManifestationOpen: false,
          ...(willClose ? { connectInitialTab: undefined } : { settingsActiveTab: state.settingsActiveTab === 'connect' ? 'preferences' : state.settingsActiveTab, connectInitialTab: undefined })
        };
      }),

      setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),
      setConnectInitialTab: (tab) => set({ connectInitialTab: tab }),
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (seen: boolean) => set((state) => {
        if (typeof window !== 'undefined' && seen) { localStorage.setItem('grindboard_has_seen_onboarding', 'true'); }
        queueSetting('hasSeenOnboarding', seen);
        return { hasSeenOnboarding: seen };
      }),

      isTourOpen: false,
      setIsTourOpen: (open) => set({ isTourOpen: open }),
      startTour: () => set({ isTourOpen: true }),
      timerTrigger: null,

      triggerTimer: (mins, taskId, taskTitle) => set((state) => {
        const currentZ = state.widgetZIndices || {};
        const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50;
        return {
          timerTrigger: { mins, ts: Date.now(), taskId, taskTitle }, showTimer: true, isTimerOpen: true, isHidden: false,
          hideConfig: { ...state.hideConfig, timer: false }, mobileHideConfig: { ...state.mobileHideConfig, timer: false },
          widgetZIndices: { ...currentZ, timer: maxZ + 1 }
        };
      }),

      activeTaskId: null,
      activeTaskTitle: null,
      setActiveTask: (id, title) => { set({ activeTaskId: id, activeTaskTitle: title }); triggerInstantSave(); },
      updateTaskDuration: (id, decreaseMins) => {
        set((state) => {
          const newTasks = ((state as any).tasks || []).map((t: any) => t.id === id ? { ...t, duration: Math.max(0, t.duration - decreaseMins), timeSpent: (t.timeSpent || 0) + decreaseMins } : t);
          const newTomorrowTasks = ((state as any).tomorrowTasks || []).map((t: any) => t.id === id ? { ...t, duration: Math.max(0, t.duration - decreaseMins), timeSpent: (t.timeSpent || 0) + decreaseMins } : t);
          return { tasks: newTasks, tomorrowTasks: newTomorrowTasks } as any;
        });
        triggerInstantSave();
      },
      editTaskDuration: (id, newDuration, tab = 'today') => {
        set((state) => ({ ...(tab === 'today' && { tasks: ((state as any).tasks || []).map((t: any) => t.id === id ? { ...t, duration: newDuration } : t) }), ...(tab === 'tomorrow' && { tomorrowTasks: ((state as any).tomorrowTasks || []).map((t: any) => t.id === id ? { ...t, duration: newDuration } : t) }) } as any));
        triggerInstantSave();
      },
      incrementGroupTaskTimeSpent: (id, minsToSave) => {
        set((state) => {
          let updatedGroups = state.userGroups;
          if (updatedGroups) {
            const todayStr = new Date().toLocaleDateString('en-CA'); const user = JSON.parse(localStorage.getItem('dashboard-auth-user') || '{}');
            const userId = user._id || user.username; if (!userId) return state;
            updatedGroups = updatedGroups.map(group => {
              const hasTask = group.memberTasks?.[userId]?.some((t: any) => t.id === id); if (!hasTask) return group;
              const currentCompletions = group.completions?.[userId]?.[todayStr] || {}; const currentTaskComp = currentCompletions[id] || { completed: false, timeSpent: 0 };
              const newCompletions = { ...group.completions, [userId]: { ...(group.completions?.[userId] || {}), [todayStr]: { ...currentCompletions, [id]: { ...currentTaskComp, timeSpent: (currentTaskComp.timeSpent || 0) + minsToSave } } } };
              return { ...group, completions: newCompletions };
            });
          }
          return { userGroups: updatedGroups };
        });
        triggerInstantSave();
      },
      editTaskTimeSpent: (id, newTimeSpent, tab = 'today') => {
        set((state) => ({ ...(tab === 'today' && { tasks: ((state as any).tasks || []).map((t: any) => t.id === id ? { ...t, timeSpent: newTimeSpent } : t) }), ...(tab === 'tomorrow' && { tomorrowTasks: ((state as any).tomorrowTasks || []).map((t: any) => t.id === id ? { ...t, timeSpent: newTimeSpent } : t) }) } as any));
        triggerInstantSave();
      },
      updateTaskTitle: (id, title, tab = 'today') => {
        set((state) => {
          const isCurrentlyActive = state.activeTaskId === id; const currentTasks = (state as any).tasks || []; const currentTomorrow = (state as any).tomorrowTasks || [];
          if (tab === 'today') { return { tasks: currentTasks.map((t: any) => t.id === id ? { ...t, title } : t), ...(isCurrentlyActive && { activeTaskTitle: title }), }; }
          return { tomorrowTasks: currentTomorrow.map((t: any) => t.id === id ? { ...t, title } : t), ...(isCurrentlyActive && { activeTaskTitle: title }), };
        });
        triggerInstantSave();
      },

      timerEndAt: null,
      timerPausedLeft: null,
      timerInitialMins: null,
      timerDeviceId: null,
      timerLastSavedChunks: 0,
      timerLastAlertedChunks: 0,
      timerLastUpdated: 0,
      isAlarmPlaying: false,
      alarmSound: '/ringtones/narutoBGM.mp3',
      customAlarmSounds: [],

      addCustomAlarmSound: (name, url) => set((state) => {
        const currentList = state.customAlarmSounds || [];
        if (currentList.length >= 3) return state;
        const newSound: CustomAlarmSound = { id: Date.now().toString(), name, url };
        const updatedList = [...currentList, newSound];
        queueSetting('customAlarmSounds', updatedList); queueSetting('alarmSound', url);
        return { customAlarmSounds: updatedList, alarmSound: url };
      }),
      deleteCustomAlarmSound: (id) => set((state) => {
        const currentList = state.customAlarmSounds || [];
        const soundToDelete = currentList.find(s => s.id === id); const updatedList = currentList.filter(s => s.id !== id);
        const activeSound = state.alarmSound === soundToDelete?.url ? '/ringtones/narutoBGM.mp3' : state.alarmSound;
        queueSetting('customAlarmSounds', updatedList); queueSetting('alarmSound', activeSound);
        return { customAlarmSounds: updatedList, alarmSound: activeSound };
      }),

      alarmVolume: 1,
      setTimerEndAt: (time) => set({ timerEndAt: time, timerLastUpdated: Date.now() }),
      setTimerPausedLeft: (time) => set({ timerPausedLeft: time, timerLastUpdated: Date.now() }),
      setTimerInitialMins: (mins) => set({ timerInitialMins: mins, timerLastUpdated: Date.now() }),
      setTimerDeviceId: (id) => set({ timerDeviceId: id, timerLastUpdated: Date.now() }),

      clearTimerState: () => {
        set({ timerEndAt: null, timerPausedLeft: null, timerInitialMins: null, timerDeviceId: null, timerLastSavedChunks: 0, timerLastAlertedChunks: 0, timerLastUpdated: Date.now(), activeTaskId: null, activeTaskTitle: null });
        forcePushTimerState();
      },

      setTimerLastSavedChunks: (chunks) => set({ timerLastSavedChunks: chunks }),
      setTimerLastAlertedChunks: (chunks) => set({ timerLastAlertedChunks: chunks }),
      setIsAlarmPlaying: (playing) => set({ isAlarmPlaying: playing }),
      
      setAlarmSound: (sound) => set((state) => { queueSetting('alarmSound', sound); return { alarmSound: sound }; }),
      alarmDurationSecs: 60,
      setAlarmDurationSecs: (secs) => set((state) => { queueSetting('alarmDurationSecs', secs); return { alarmDurationSecs: secs }; }),
      setAlarmVolume: (vol) => set((state) => { queueSetting('alarmVolume', vol); return { alarmVolume: vol }; }),
      enableAlarmSound: true,
      enableAlarmVibration: true,
      enablePanicButton: true,
      panicButtonMode: 'hide',
      taskIntervalAlertMins: 10,
      setEnableAlarmSound: (val) => set((state) => { queueSetting('enableAlarmSound', val); return { enableAlarmSound: val }; }),
      setEnableAlarmVibration: (val) => set((state) => { queueSetting('enableAlarmVibration', val); return { enableAlarmVibration: val }; }),
      isTaskIntervalAlertEnabled: false,
      setIsTaskIntervalAlertEnabled: (enabled) => set((state) => { queueSetting('isTaskIntervalAlertEnabled', enabled); return { isTaskIntervalAlertEnabled: enabled }; }),
      setTaskIntervalAlertMins: (mins) => set((state) => { queueSetting('taskIntervalAlertMins', mins); return { taskIntervalAlertMins: mins }; }),
      taskIntervalRingSecs: 10,
      setTaskIntervalRingSecs: (secs) => set((state) => { queueSetting('taskIntervalRingSecs', secs); return { taskIntervalRingSecs: secs }; }),

      isTimerIntervalEnabled: false,
      setIsTimerIntervalEnabled: (enabled) => set((state) => { queueSetting('isTimerIntervalEnabled', enabled); return { isTimerIntervalEnabled: enabled }; }),
      timerIntervalMins: 5,
      setTimerIntervalMins: (mins) => set((state) => { queueSetting('timerIntervalMins', mins); return { timerIntervalMins: mins }; }),

      isStopwatchIntervalEnabled: false,
      setIsStopwatchIntervalEnabled: (enabled) => set((state) => { queueSetting('isStopwatchIntervalEnabled', enabled); return { isStopwatchIntervalEnabled: enabled }; }),
      stopwatchIntervalMins: 5,
      setStopwatchIntervalMins: (mins) => set((state) => { queueSetting('stopwatchIntervalMins', mins); return { stopwatchIntervalMins: mins }; }),
      setEnablePanicButton: (val) => set((state) => { queueSetting('enablePanicButton', val); return { enablePanicButton: val }; }),
      setPanicButtonMode: (val) => set((state) => { queueSetting('panicButtonMode', val); return { panicButtonMode: val }; }),

      currentQuote: null,
      isQuotePopupOpen: false,
      showQuotePopup: (quote) => set({ currentQuote: quote, isQuotePopupOpen: true }),
      hideQuotePopup: () => set({ isQuotePopupOpen: false }),
      customQuotes: [],
      setCustomQuotes: (quotes) => set((state) => { queueSetting('customQuotes', quotes); return { customQuotes: quotes }; }),
      useCustomQuotes: false,
      setUseCustomQuotes: (useCustom) => set((state) => { queueSetting('useCustomQuotes', useCustom); return { useCustomQuotes: useCustom }; }),
      manifestationCustomQuotes: [],
      setManifestationCustomQuotes: (quotes) => set((state) => { const trimmedQuotes = (quotes || []).slice(0, 30); queueSetting('manifestationCustomQuotes', trimmedQuotes); return { manifestationCustomQuotes: trimmedQuotes }; }),
      addManifestationCustomQuote: (quote) => set((state) => { const trimmed = quote.trim(); const current = state.manifestationCustomQuotes || []; if (!trimmed || current.length >= 30) return state; const newArr = [...current, trimmed]; queueSetting('manifestationCustomQuotes', newArr); return { manifestationCustomQuotes: newArr }; }),
      deleteManifestationCustomQuote: (index) => set((state) => { const newArr = (state.manifestationCustomQuotes || []).filter((_, i) => i !== index); queueSetting('manifestationCustomQuotes', newArr); return { manifestationCustomQuotes: newArr }; }),

      isNotesOpen: false,
      toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),

      isTimetableOpen: false,
      setIsTimetableOpen: (isOpen) => set({ isTimetableOpen: isOpen }),
      timetableGrid: {}, timetableColors: {}, weekdayTimes: [], weekendTimes: [], timetableStartTime: 540, timetableWeekendStartTime: 540,

      isStopwatchOpen: false,
      toggleStopwatch: () => set((state) => { const next = !state.isStopwatchOpen; let extra = {}; if (next) { const currentZ = state.widgetZIndices || {}; const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50; extra = { widgetZIndices: { ...currentZ, stopwatch: maxZ + 1 } }; } return { isStopwatchOpen: next, ...extra }; }),
      stopwatchStartTime: null, setStopwatchStartTime: (time) => set({ stopwatchStartTime: time }),
      stopwatchDeviceId: null, setStopwatchDeviceId: (id) => set({ stopwatchDeviceId: id }),
      stopwatchLastSavedChunks: 0, setStopwatchLastSavedChunks: (chunks) => set({ stopwatchLastSavedChunks: chunks }),
      stopwatchAddToStats: true, setStopwatchAddToStats: (val) => set((state) => { queueSetting('stopwatchAddToStats', val); return { stopwatchAddToStats: val }; }),

      roadmaps: [{ id: 'default-roadmap-id', name: 'My Personal Goals', targetDate: '2026-12-31', nodes: [{ id: 'node-seed-1', title: 'Core Objective 1', description: 'Primary milestone focus area', status: 'in-progress', subItems: [{ id: 'node-seed-1-1', title: 'Action Item A', status: 'completed' }, { id: 'node-seed-1-2', title: 'Action Item B', status: 'pending' }] }, { id: 'node-seed-2', title: 'Core Objective 2', description: 'Secondary milestone focus area', status: 'pending', subItems: [{ id: 'node-seed-2-1', title: 'Sub-task Alpha', status: 'pending' }] }] }],
      setRoadmaps: (roadmaps) => set((state) => { queueRoadmapAction({ type: 'REPLACE_ALL', roadmaps }); return { roadmaps }; }),
      syntheticDeadlines: {},
      setSyntheticDeadline: (status, date) => set((state) => { const payload = { syntheticDeadlines: { ...state.syntheticDeadlines, [status]: date } }; queueDeadlineAction({ type: 'UPDATE_SETTINGS', updates: payload }); return payload; }),
      isPlansOpen: false, togglePlans: () => set((state) => ({ isPlansOpen: !state.isPlansOpen })),

      is24HourClock: false, toggle24HourClock: () => set((state) => { const nextVal = !state.is24HourClock; queueSetting('is24HourClock', nextVal); return { is24HourClock: nextVal }; }),
      clockScale: 1, setClockScale: (scale) => set((state) => { queueSetting('clockScale', scale); return { clockScale: scale }; }),
      dashboardScale: 1, setDashboardScale: (scale) => set((state) => { queueSetting('dashboardScale', scale); return { dashboardScale: scale }; }),
      mobileDashboardScale: 1, setMobileDashboardScale: (scale) => set((state) => { queueSetting('mobileDashboardScale', scale); return { mobileDashboardScale: scale }; }),
      dockScale: 1, setDockScale: (scale) => set((state) => { queueSetting('dockScale', scale); return { dockScale: scale }; }),
      dockOffset: 0, setDockOffset: (offset) => set((state) => { queueSetting('dockOffset', offset); return { dockOffset: offset }; }),

      countdowns: [],
      autoOpenCountdowns: true, setAutoOpenCountdowns: (enabled) => set((state) => { queueSetting('autoOpenCountdowns', enabled); return { autoOpenCountdowns: enabled }; }), 
      addCountdown: (title = 'New Target', endDate = null) => { let newId = ''; set((state) => { if (state.countdowns.length >= 5) return state; newId = Date.now().toString(); const newCountdown = { id: newId, title, endDate }; queueCountdownAction({ type: 'ADD_COUNTDOWN', countdown: newCountdown }); return { countdowns: [...state.countdowns, newCountdown] }; }); return newId; },
      updateCountdown: (id, title, endDate) => set((state) => { queueCountdownAction({ type: 'UPDATE_COUNTDOWN', countdownId: id, updates: { title, endDate } }); return { countdowns: state.countdowns.map(c => c.id === id ? { ...c, title, endDate } : c) }; }),
      deleteCountdown: (id) => set((state) => { queueCountdownAction({ type: 'DELETE_COUNTDOWN', countdownId: id }); return { countdowns: state.countdowns.filter(c => c.id !== id) }; }),

      deadlines: [],
      addDeadline: (date, text) => { const id = Date.now().toString() + Math.random().toString(36).substr(2, 5); set((state) => { const newDeadline = { id, date, text, isDone: false }; queueDeadlineAction({ type: 'ADD_DEADLINE', deadline: newDeadline }); return { deadlines: [...filterActiveDeadlines(state.deadlines), newDeadline] }; }); return id; },
      updateDeadline: (id, text) => {
        set((state) => ({ deadlines: state.deadlines.map(d => d.id === id ? { ...d, text } : d) }));
        if (deadlineTypingTimer) clearTimeout(deadlineTypingTimer);
        if (!text || text.trim() === '') return;
        deadlineTypingTimer = setTimeout(() => { const currentState = get(); const updatedDeadline = currentState.deadlines.find(d => d.id === id); if (updatedDeadline && updatedDeadline.text.trim() !== '') { queueDeadlineAction({ type: 'UPDATE_DEADLINE', deadlineId: id, updates: { text: updatedDeadline.text } }); } }, 3000);
      },
      deleteDeadline: (id) => set((state) => { queueDeadlineAction({ type: 'DELETE_DEADLINE', deadlineId: id }); return { deadlines: state.deadlines.filter(d => d.id !== id) }; }),
      toggleDeadlineDone: (id) => set((state) => { const deadline = state.deadlines.find(d => d.id === id); if (deadline) { queueDeadlineAction({ type: 'UPDATE_DEADLINE', deadlineId: id, updates: { isDone: !deadline.isDone } }); } return { deadlines: state.deadlines.map(d => d.id === id ? { ...d, isDone: !d.isDone } : d) }; }),
      deleteAllDeadlinesForDay: (date) => set((state) => { const newDeadlines = state.deadlines.filter(d => d.date !== date); queueDeadlineAction({ type: 'REPLACE_ALL', data: { deadlines: newDeadlines } }); return { deadlines: newDeadlines }; }),
      deleteAllDeadlines: () => set(() => { queueDeadlineAction({ type: 'REPLACE_ALL', data: { deadlines: [] } }); return { deadlines: [] }; }),
      cleanOldDeadlines: () => set((state) => { const filtered = filterActiveDeadlines(state.deadlines); const didChange = filtered.length !== state.deadlines.length; const isHydrated = useDashboardStore.getState()._hasHydrated; if (didChange && isHydrated && state.deadlines.length > 0) { queueDeadlineAction({ type: 'REPLACE_ALL', data: { deadlines: filtered } }); } return { deadlines: filtered }; }),
      deadlineAlertDays: 0, setDeadlineAlertDays: (days) => set(() => { const val = Math.max(0, days); queueDeadlineAction({ type: 'UPDATE_SETTINGS', updates: { deadlineAlertDays: val } }); return { deadlineAlertDays: val }; }),
      dismissedDeadlineAlerts: [], dismissDeadlineAlert: (id) => set((state) => { const newAlerts = Array.from(new Set([...(state.dismissedDeadlineAlerts || []), id])); queueDeadlineAction({ type: 'UPDATE_SETTINGS', updates: { dismissedDeadlineAlerts: newAlerts } }); return { dismissedDeadlineAlerts: newAlerts }; }),
      disableDeadlineLockOnToday: false, setDisableDeadlineLockOnToday: (disabled) => set(() => { queueDeadlineAction({ type: 'UPDATE_SETTINGS', updates: { disableDeadlineLockOnToday: disabled } }); return { disableDeadlineLockOnToday: disabled }; }),
      hideYouInLeaderboard: false, setHideYouInLeaderboard: (hide) => set(() => { queueDeadlineAction({ type: 'UPDATE_SETTINGS', updates: { hideYouInLeaderboard: hide } }); return { hideYouInLeaderboard: hide }; }),

      isDeadlinesCollapsed: false, setIsDeadlinesCollapsed: (collapsed) => set({ isDeadlinesCollapsed: collapsed }),
      viewingFriend: null, setViewingFriend: (friend) => set({ viewingFriend: friend }),
      dailyTimes: {}, isDayStartModalOpen: false, toggleDayStartModal: () => set((state) => ({ isDayStartModalOpen: !state.isDayStartModalOpen })),
      updateDailyTime: (dateKey, field, timestamp) => {
        set((state) => {
          const newData = { ...state.dailyTimes }; if (!newData[dateKey]) newData[dateKey] = {}; newData[dateKey] = { ...newData[dateKey], [field]: timestamp };
          queueDailyRoutineAction({ type: 'UPDATE_DAILY_TIME', dateKey, field, timestamp });
          return { dailyTimes: newData };
        });
      },

      clockOffsets: {}, updateClockOffset: (bgSrc, x, y) => set((state) => { queueSettingsAction({ [`clockOffsets.${bgSrc}`]: { x, y } }); return { clockOffsets: { ...state.clockOffsets, [bgSrc]: { x, y } } }; }),
      resetClockOffset: (bgSrc) => set((state) => { const newOffsets = { ...state.clockOffsets }; delete newOffsets[bgSrc]; queueSettingsAction({ clockOffsets: newOffsets }); return { clockOffsets: newOffsets }; }),
      widgetOffsets: {}, updateWidgetOffset: (bgSrc, widgetId, x, y) => set((state) => { const currentBgOffsets = state.widgetOffsets[bgSrc] || {}; queueSettingsAction({ [`widgetOffsets.${bgSrc}`]: { ...currentBgOffsets, [widgetId]: { x, y } } }); return { widgetOffsets: { ...state.widgetOffsets, [bgSrc]: { ...currentBgOffsets, [widgetId]: { x, y } } } }; }),
      resetWidgetOffset: (bgSrc, widgetId) => set((state) => { if (!state.widgetOffsets[bgSrc]) return state; const newBgOffsets = { ...state.widgetOffsets[bgSrc] }; delete newBgOffsets[widgetId]; queueSettingsAction({ [`widgetOffsets.${bgSrc}`]: newBgOffsets }); return { widgetOffsets: { ...state.widgetOffsets, [bgSrc]: newBgOffsets } }; }),
      lockedWidgets: ['quote', 'countdowns', 'timer', 'stopwatch', 'toolbar'], toggleWidgetLock: (widgetId) => set((state) => { const newArr = state.lockedWidgets.includes(widgetId) ? state.lockedWidgets.filter(id => id !== widgetId) : [...state.lockedWidgets, widgetId]; queueSetting('lockedWidgets', newArr); return { lockedWidgets: newArr }; }),
      widgetZIndices: {}, bringToFront: (widgetId) => set((state) => { const currentZIndices = state.widgetZIndices || {}; const values = Object.values(currentZIndices); const maxZ = values.length > 0 ? Math.max(...values) : 50; if (currentZIndices[widgetId] === maxZ && maxZ > 50) return state; return { widgetZIndices: { ...currentZIndices, [widgetId]: maxZ + 1 } }; }),
      resetAllOffsets: (bgSrc) => set((state) => { const newClockOffsets = { ...state.clockOffsets }; delete newClockOffsets[bgSrc]; const newWidgetOffsets = { ...state.widgetOffsets }; delete newWidgetOffsets[bgSrc]; queueSettingsAction({ clockOffsets: newClockOffsets, widgetOffsets: newWidgetOffsets }); return { clockOffsets: newClockOffsets, widgetOffsets: newWidgetOffsets }; }),
      
      currentBgSrc: null, setCurrentBgSrc: (src) => set((state) => { queueSetting('currentBgSrc', src); return { currentBgSrc: src }; }),
      hiddenWallpapers: [], toggleWallpaperVisibility: (filename) => set((state) => { const newArr = state.hiddenWallpapers.includes(filename) ? state.hiddenWallpapers.filter(name => name !== filename) : [...state.hiddenWallpapers, filename]; queueSetting('hiddenWallpapers', newArr); return { hiddenWallpapers: newArr }; }),
      isSlideshowEnabled: false, setIsSlideshowEnabled: (enabled) => set((state) => { queueSetting('isSlideshowEnabled', enabled); return { isSlideshowEnabled: enabled }; }),
      isMobileCountdownsVisible: true, setIsMobileCountdownsVisible: (visible) => set((state) => { queueSetting('isMobileCountdownsVisible', visible); return { isMobileCountdownsVisible: visible }; }),
      slideshowIntervalMins: 10, setSlideshowIntervalMins: (mins) => set((state) => { queueSetting('slideshowIntervalMins', mins); return { slideshowIntervalMins: mins }; }),
      upiId: '', setUpiId: (id) => set((state) => { queueSetting('upiId', id); return { upiId: id }; }),

      showQuote: true, showTimer: true, showCountdowns: true, showVideoControls: true, showClock: true, showTasks: true, showCalendar: true, showTodayWork: true, showStats: true, showPlans: true, showNotes: true, showTimetable: true, showDock: true, showDeadlineAlerts: true, showBgSwitcher: true, showSettingsBtn: true, showStopwatch: true,
      toggleVisibility: (key) => set((state) => { const nextVal = !state[key]; queueSetting(key, nextVal); return { [key]: nextVal }; }),
      hideConfig: { quote: true, timer: false, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true },
      setHideConfig: (key, value) => set((state) => { queueSettingsAction({ [`hideConfig.${key}`]: value }); return { hideConfig: { ...state.hideConfig, [key]: value } }; }),
      setHideAll: (hide) => set((state) => { const newConfig = (hide ? { quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true } : {}) as Record<string, boolean>; queueSettingsAction({ hideConfig: newConfig }); return { hideConfig: newConfig }; }),

      mobileHideConfig: { quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true },
      setMobileHideConfig: (key, value) => set((state) => { queueSettingsAction({ [`mobileHideConfig.${key}`]: value }); return { mobileHideConfig: { ...state.mobileHideConfig, [key]: value } }; }),
      setMobileHideAll: (hide) => set((state) => { const newConfig = (hide ? { quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true } : {}) as Record<string, boolean>; queueSettingsAction({ mobileHideConfig: newConfig }); return { mobileHideConfig: newConfig }; }),

      isPanicHidden: false, togglePanicHide: () => set((state) => { if (state.isHidden) return {}; const nextVal = !state.isPanicHidden; queueSetting('isPanicHidden', nextVal); return { isPanicHidden: nextVal }; }),
      panicShortcutKey: 'ctrl+z', setPanicShortcutKey: (key) => set((state) => { const lowerKey = key.toLowerCase(); queueSetting('panicShortcutKey', lowerKey); return { panicShortcutKey: lowerKey }; }),
      focusShortcutKey: 'ctrl+h', setFocusShortcutKey: (key) => set((state) => { const lowerKey = key.toLowerCase(); queueSetting('focusShortcutKey', lowerKey); return { focusShortcutKey: lowerKey }; }),
      panicWallpaperSwitch: false, setPanicWallpaperSwitch: (val) => set((state) => { queueSetting('panicWallpaperSwitch', val); return { panicWallpaperSwitch: val }; }),
      peekModeWallpaper: null, setPeekModeWallpaper: (url) => set((state) => { queueSetting('peekModeWallpaper', url); return { peekModeWallpaper: url }; }),
      customPeekModeWallpapers: [], setCustomPeekModeWallpapers: (urls) => set((state) => { queueSetting('customPeekModeWallpapers', urls); return { customPeekModeWallpapers: urls }; }),
      activePeekModeCustomIndex: null, setActivePeekModeCustomIndex: (index) => set((state) => { queueSetting('activePeekModeCustomIndex', index); return { activePeekModeCustomIndex: index }; }),
      rightWidgetsOffset: 48, setRightWidgetsOffset: (offset) => set((state) => { const safeOffset = Math.max(0, offset); queueSetting('rightWidgetsOffset', safeOffset); return { rightWidgetsOffset: safeOffset }; }),
      dismissedBroadcasts: [], dismissBroadcast: (id) => set((state) => { if (!state.dismissedBroadcasts.includes(id)) { const newArr = [...state.dismissedBroadcasts, id]; queueSetting('dismissedBroadcasts', newArr); return { dismissedBroadcasts: newArr }; } return state; }),

      clearOldData: async (days: number) => {
        try {
          await clearOldDataAPI(days);
          set((state) => {
            const newHistory = { ...state.history }; const cutoffDate = new Date(); cutoffDate.setDate(cutoffDate.getDate() - days);
            const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
            Object.keys(newHistory).forEach((key) => { if (key < cutoffDateStr) delete newHistory[key]; });
            const newDailyTimes = { ...state.dailyTimes };
            Object.keys(newDailyTimes).forEach((key) => { if (key < cutoffDateStr) delete newDailyTimes[key]; });
            return { history: newHistory, dailyTimes: newDailyTimes };
          });
        } catch (err) { }
      },
      clearAllData: async () => { try { await clearAllDataAPI(); localStorage.removeItem('dashboard-storage'); window.location.reload(); } catch (err) { } },
      clearAllTasksAndPlans: () => { useTaskStore.setState({ tasks: [], tomorrowTasks: [] }); triggerInstantSave(); },
      resetTimetable: () => { queueSettingsAction({ timetableGrid: {}, timetableColors: {} }); set({ timetableGrid: {}, timetableColors: {} }); },
      forceInstantSave: () => { triggerInstantSave(); },
      pushManifestationToDB: () => { triggerInstantSave(); },
      pushWallpapersToDB: () => { triggerInstantSave(); },
    }),
    {
      name: 'dashboard-storage',
      storage: fileStorage,
      version: 2,
      migrate: (persistedState: any, version: number) => { if (version < 2) { if (!persistedState.hideConfig) persistedState.hideConfig = {}; } return persistedState; },
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => ![
          'isQuotePopupOpen', 'isTaskManagerOpen', 'isStatsOpen', 'timerTrigger',
          'isNotesOpen', 'isPlansOpen', 'isTimetableOpen', 'isDayStartModalOpen',
          'isVideoMuted', 'isVideoPlaying', 'isSettingsOpen', 'isStopwatchOpen', '_hasHydrated',
          'widgetZIndices', 'isAlarmPlaying', 'isTourOpen', 'isManifestationOpen', 'isNewsOpen'
        ].includes(key))
      ),
      merge: (persistedState: any, currentState: DashboardState) => {
        if (!persistedState) return currentState;
        const transientKeys = [ 'isQuotePopupOpen', 'isTaskManagerOpen', 'isStatsOpen', 'timerTrigger', 'isNotesOpen', 'isPlansOpen', 'isTimetableOpen', 'isDayStartModalOpen', 'isVideoMuted', 'isVideoPlaying', 'isSettingsOpen', 'isStopwatchOpen', '_hasHydrated', 'isAlarmPlaying', 'isTourOpen', 'isNewsOpen', 'isManifestationOpen', 'selectedGroupId' ];
        transientKeys.forEach(key => { if (persistedState[key] !== undefined) delete persistedState[key]; });
        if (persistedState.wallpaper === "/wallpapers/defaultWallpaper2.jpeg") persistedState.wallpaper = "/wallpapers/naruto.webp";
        
        if (persistedState.timerEndAt && persistedState.timerEndAt < Date.now()) {
          persistedState.timerEndAt = null; persistedState.timerPausedLeft = null; persistedState.timerInitialMins = null; persistedState.timerDeviceId = null;
          persistedState.timerLastSavedChunks = 0; persistedState.timerLastAlertedChunks = 0; persistedState.activeTaskId = null; persistedState.activeTaskTitle = null;
        } else if (!persistedState.timerEndAt && (persistedState.timerPausedLeft === null || persistedState.timerPausedLeft === undefined)) {
          persistedState.timerInitialMins = null; persistedState.timerDeviceId = null; persistedState.timerLastSavedChunks = 0; persistedState.timerLastAlertedChunks = 0; persistedState.activeTaskId = null; persistedState.activeTaskTitle = null;
        }
        persistedState.isAlarmPlaying = false;
        if (persistedState.hideConfig && currentState.hideConfig) persistedState.hideConfig = { ...currentState.hideConfig, ...persistedState.hideConfig };
        if (persistedState.mobileHideConfig && currentState.mobileHideConfig) persistedState.mobileHideConfig = { ...currentState.mobileHideConfig, ...persistedState.mobileHideConfig };
        if (!persistedState._focusPillDefaultsUpdated) {
          if (persistedState.hideConfig) { persistedState.hideConfig.todayFocusPill = false; persistedState.hideConfig.timerPill = false; }
          if (persistedState.mobileHideConfig) { persistedState.mobileHideConfig.todayFocusPill = false; persistedState.mobileHideConfig.timerPill = false; }
          persistedState._focusPillDefaultsUpdated = true;
        }
        if (!persistedState.customAlarmSounds) persistedState.customAlarmSounds = [];
        if (persistedState.deadlines && Array.isArray(persistedState.deadlines)) persistedState.deadlines = filterActiveDeadlines(persistedState.deadlines);
        if (!persistedState.tomorrowTasks) persistedState.tomorrowTasks = [];
        if (!persistedState.tasksDate) persistedState.tasksDate = getLocalDateString();

        const safeState = { ...currentState, ...persistedState };
        safeState.dashboardScale = typeof persistedState.dashboardScale === 'number' ? persistedState.dashboardScale : 1;
        safeState.mobileDashboardScale = typeof persistedState.mobileDashboardScale === 'number' ? persistedState.mobileDashboardScale : 1;
        safeState.dockScale = typeof persistedState.dockScale === 'number' ? persistedState.dockScale : 1;
        safeState.dockOffset = typeof persistedState.dockOffset === 'number' ? persistedState.dockOffset : 0;
        safeState.roadmaps = Array.isArray(persistedState.roadmaps) ? persistedState.roadmaps : currentState.roadmaps;
        safeState.deadlines = filterActiveDeadlines(persistedState.deadlines || []);
        if (persistedState.history && typeof persistedState.history === 'object') safeState.history = { ...currentState.history, ...persistedState.history };
        if (persistedState.dailyTimes && typeof persistedState.dailyTimes === 'object') safeState.dailyTimes = mergeDailyTimes(currentState.dailyTimes || {}, persistedState.dailyTimes || {});
        
        const hasSeenLocal = (typeof window !== 'undefined' && localStorage.getItem('grindboard_has_seen_onboarding') === 'true');
        safeState.hasSeenOnboarding = Boolean(persistedState?.hasSeenOnboarding || currentState?.hasSeenOnboarding || hasSeenLocal);
        
        if (persistedState.clockOffsets && typeof persistedState.clockOffsets === 'object') safeState.clockOffsets = { ...currentState.clockOffsets, ...persistedState.clockOffsets };
        if (persistedState.widgetOffsets && typeof persistedState.widgetOffsets === 'object') safeState.widgetOffsets = { ...currentState.widgetOffsets, ...persistedState.widgetOffsets };
        if (persistedState.hideConfig && typeof persistedState.hideConfig === 'object') safeState.hideConfig = { ...(currentState.hideConfig || {}), ...persistedState.hideConfig };
        if (persistedState.mobileHideConfig && typeof persistedState.mobileHideConfig === 'object') safeState.mobileHideConfig = { ...(currentState.mobileHideConfig || {}), ...persistedState.mobileHideConfig };
        return safeState;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error("Hydration failed!", error);
        Promise.resolve().then(() => { if (state && typeof state.setHasHydrated === 'function') state.setHasHydrated(true); else useDashboardStore.getState().setHasHydrated(true); });
      },
    }
  )
);
export * from './helpers';
export * from './types';