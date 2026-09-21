import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardState, CustomAlarmSound } from './types';
import { getLocalDateString } from '@/utils/date';
import { filterActiveDeadlines, mergeDailyTimes } from './helpers';
import { useTaskStore } from '@/store/taskStore';
import {
  fileStorage, triggerInstantSave, pushCountdownsToDB, pushDeadlinesToDB,
  pushDailyRoutineToDB, pushStreakToDB, clearOldDataAPI, clearAllDataAPI, forcePushTimerState
} from './sync';

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      wallpaper: '/wallpapers/naruto.webp',
      bgIndex: 0,
      currentBgType: null,
      lockedWallpaper: null,
      history: {},
      isHidden: false,
      _hasHydrated: false,
      theme: 'dark',
      notesThemeOverride: 'light',
      timetableThemeOverride: 'light',
      userGroups: [],
      setUserGroups: (groups) => set({ userGroups: groups }),
      selectedGroupId: null,
      setSelectedGroupId: (id) => set({ selectedGroupId: id }),
      setTheme: (theme) => set({ theme, notesThemeOverride: null, timetableThemeOverride: null }),
      setNotesThemeOverride: (theme) => set({ notesThemeOverride: theme }),
      setTimetableThemeOverride: (theme) => set({ timetableThemeOverride: theme }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      toggleLockWallpaper: () => set((state) => ({ lockedWallpaper: state.lockedWallpaper ? null : state.wallpaper })),
      setLockedWallpaper: (filename) => set({ lockedWallpaper: filename }),
      setWallpaper: (url) => set({ wallpaper: url }),
      cycleBackground: () => set((state) => {
        const BUILT_IN = [
          "/wallpapers/naruto.webp",
          "https://static.toiimg.com/photo/imgsize-23456,msid-122440968,resizemode-4/naruto-vs-sasuke.jpg",
          "https://images4.alphacoders.com/140/1402795.mp4",
          "https://images4.alphacoders.com/476/thumb-1920-47698.png"
        ];
        const nextIndex = (state.bgIndex + 1) % BUILT_IN.length;
        return { lockedWallpaper: null, bgIndex: nextIndex, wallpaper: BUILT_IN[nextIndex] };
      }),
      setCurrentBgType: (type) => set({ currentBgType: type }),
      isVideoMuted: true,
      setIsVideoMuted: (muted) => set({ isVideoMuted: muted }),
      isVideoPlaying: true,
      setIsVideoPlaying: (playing) => set({ isVideoPlaying: playing }),

      customDesktopWallpapers: [],
      setCustomDesktopWallpapers: (urls) => set({ customDesktopWallpapers: urls }),
      activeDesktopCustomIndex: null,
      setActiveDesktopCustomIndex: (index) => set({ activeDesktopCustomIndex: index }),

      customMobileWallpapers: [],
      setCustomMobileWallpapers: (urls) => set({ customMobileWallpapers: urls }),
      activeMobileCustomIndex: null,
      setActiveMobileCustomIndex: (index) => set({ activeMobileCustomIndex: index }),

      showManifestationBoard: true,
      setShowManifestationBoard: (show) => set({ showManifestationBoard: show }),
      isManifestationOpen: false,
      setIsManifestationOpen: (open) => set({ isManifestationOpen: open }),
      toggleManifestationOpen: () => set((state) => ({ isManifestationOpen: !state.isManifestationOpen })),

      manifestationDesktopPhotos: [],
      setManifestationDesktopPhotos: (urls) => set({ manifestationDesktopPhotos: urls }),
      activeManifestationDesktopIndex: null,
      setActiveManifestationDesktopIndex: (index) => set({ activeManifestationDesktopIndex: index }),

      manifestationMobilePhotos: [],
      setManifestationMobilePhotos: (urls) => set({ manifestationMobilePhotos: urls }),
      activeManifestationMobileIndex: null,
      setActiveManifestationMobileIndex: (index) => set({ activeManifestationMobileIndex: index }),

      addMins: (dateKey, mins) => {
        set((state) => {
          const oldTotal = state.history[dateKey] || 0;
          const newTotal = oldTotal + mins;

          if (newTotal >= 60 && typeof window !== 'undefined') {
            pushStreakToDB(dateKey, newTotal);
          }

          if (typeof window !== 'undefined') {
            try {
              const queueStr = localStorage.getItem('unsaved_focus_mins');
              const queue = queueStr ? JSON.parse(queueStr) : {};
              queue[dateKey] = (queue[dateKey] || 0) + mins;
              localStorage.setItem('unsaved_focus_mins', JSON.stringify(queue));
            } catch (e) {}
          }

          return {
            history: { ...state.history, [dateKey]: newTotal },
            dailyTimes: {
              ...state.dailyTimes,
              [dateKey]: {
                ...(state.dailyTimes[dateKey] || {}),
                workStartedTime: (state.dailyTimes[dateKey] || {}).workStartedTime || Date.now(),
                bedTime: Date.now()
              }
            },
            lastModified: Date.now()
          } as any;
        });
        get().forceInstantSave();
      },

      toggleHide: () => set((state) => {
        if (state.isPanicHidden) return {}; // Exclusive with Peek Mode
        return { isHidden: !state.isHidden };
      }),

      isTaskManagerOpen: false,
      toggleTaskManager: () => set((state) => {
        const next = !state.isTaskManagerOpen;
        let extra = {};
        if (next) {
          const currentZ = state.widgetZIndices || {};
          const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50;
          extra = { widgetZIndices: { ...currentZ, tasks: maxZ + 1 } };
        }
        return { isTaskManagerOpen: next, ...extra };
      }),

      isStatsOpen: false,
      toggleStats: () => set((state) => ({ isStatsOpen: !state.isStatsOpen })),

      isTimerOpen: false,
      toggleTimer: () => set((state) => {
        const next = !state.isTimerOpen;
        let extra = {};
        if (next) {
          const currentZ = state.widgetZIndices || {};
          const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50;
          extra = { widgetZIndices: { ...currentZ, timer: maxZ + 1 } };
        }
        return { isTimerOpen: next, ...extra };
      }),

      isCalendarOpen: false,
      isCalendarBusy: false,
      setIsCalendarBusy: (busy) => set({ isCalendarBusy: busy }),
      toggleCalendar: () => set((state) => {
        const next = !state.isCalendarOpen;
        let extra = {};
        if (next) {
          const currentZ = state.widgetZIndices || {};
          const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50;
          extra = { widgetZIndices: { ...currentZ, calendar: maxZ + 1 } };
        }
        return { isCalendarOpen: next, ...extra };
      }),

      isClockOpen: true,
      toggleClock: () => set((state) => {
        const next = !state.isClockOpen;
        let extra = {};
        if (next) {
          const currentZ = state.widgetZIndices || {};
          const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50;
          extra = { widgetZIndices: { ...currentZ, clock: maxZ + 1 } };
        }
        return { isClockOpen: next, ...extra };
      }),

      isSettingsOpen: false,
      isNewsOpen: false,
      hasUnreadNews: true,
      toggleNews: () => set((state) => ({ isNewsOpen: !state.isNewsOpen })),
      setHasUnreadNews: (val: boolean) => set(() => ({ hasUnreadNews: val })),
      settingsActiveTab: 'preferences',
      connectInitialTab: undefined,

      toggleSettings: () => set((state) => {
        const willClose = state.isSettingsOpen;
        if (willClose && typeof window !== 'undefined') {
          get().pushWallpapersToDB();
          get().pushManifestationToDB();
        }
        return {
          isSettingsOpen: !state.isSettingsOpen,
          isAlarmPlaying: false,
          isManifestationOpen: false,
          ...(willClose
            ? { connectInitialTab: undefined }
            : {
              settingsActiveTab: state.settingsActiveTab === 'connect' ? 'preferences' : state.settingsActiveTab,
              connectInitialTab: undefined
            }
          )
        };
      }),

      setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),
      setConnectInitialTab: (tab) => set({ connectInitialTab: tab }),
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (seen: boolean) => {
        if (typeof window !== 'undefined' && seen) {
          localStorage.setItem('grindboard_has_seen_onboarding', 'true');
        }
        set({ hasSeenOnboarding: seen });
      },

      isTourOpen: false,
      setIsTourOpen: (open) => set({ isTourOpen: open }),
      startTour: () => set({ isTourOpen: true }),
      timerTrigger: null,

      triggerTimer: (mins, taskId, taskTitle) => set((state) => {
        const currentZ = state.widgetZIndices || {};
        const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50;
        return {
          timerTrigger: { mins, ts: Date.now(), taskId, taskTitle },
          showTimer: true,
          isTimerOpen: true,
          isHidden: false,
          hideConfig: { ...state.hideConfig, timer: false },
          mobileHideConfig: { ...state.mobileHideConfig, timer: false },
          widgetZIndices: { ...currentZ, timer: maxZ + 1 }
        };
      }),

      activeTaskId: null,
      activeTaskTitle: null,
      setActiveTask: (id, title) => {
        set({ activeTaskId: id, activeTaskTitle: title });
        get().forceInstantSave();
      },

      updateTaskDuration: (id, decreaseMins) => {
        set((state) => {
          const newTasks = ((state as any).tasks || []).map((t: any) =>
            t.id === id ? { ...t, duration: Math.max(0, t.duration - decreaseMins), timeSpent: (t.timeSpent || 0) + decreaseMins } : t
          );
          const newTomorrowTasks = ((state as any).tomorrowTasks || []).map((t: any) =>
            t.id === id ? { ...t, duration: Math.max(0, t.duration - decreaseMins), timeSpent: (t.timeSpent || 0) + decreaseMins } : t
          );
          return { tasks: newTasks, tomorrowTasks: newTomorrowTasks } as any;
        });
        get().forceInstantSave();
      },

      editTaskDuration: (id, newDuration, tab = 'today') => {
        set((state) => ({
          ...(tab === 'today' && { tasks: ((state as any).tasks || []).map((t: any) => t.id === id ? { ...t, duration: newDuration } : t) }),
          ...(tab === 'tomorrow' && { tomorrowTasks: ((state as any).tomorrowTasks || []).map((t: any) => t.id === id ? { ...t, duration: newDuration } : t) })
        } as any));
        get().forceInstantSave();
      },

      incrementGroupTaskTimeSpent: (id, minsToSave) => {
        set((state) => {
          let updatedGroups = state.userGroups;
          if (updatedGroups) {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const user = JSON.parse(localStorage.getItem('dashboard-auth-user') || '{}');
            const userId = user._id || user.username;
            if (!userId) return state;

            updatedGroups = updatedGroups.map(group => {
              const hasTask = group.memberTasks?.[userId]?.some((t: any) => t.id === id);
              if (!hasTask) return group;

              const currentCompletions = group.completions?.[userId]?.[todayStr] || {};
              const currentTaskComp = currentCompletions[id] || { completed: false, timeSpent: 0 };
              const newCompletions = {
                ...group.completions,
                [userId]: {
                  ...(group.completions?.[userId] || {}),
                  [todayStr]: {
                    ...currentCompletions,
                    [id]: { ...currentTaskComp, timeSpent: (currentTaskComp.timeSpent || 0) + minsToSave }
                  }
                }
              };
              return { ...group, completions: newCompletions };
            });
          }
          return { userGroups: updatedGroups };
        });
        get().forceInstantSave();
      },

      editTaskTimeSpent: (id, newTimeSpent, tab = 'today') => {
        set((state) => ({
          ...(tab === 'today' && { tasks: ((state as any).tasks || []).map((t: any) => t.id === id ? { ...t, timeSpent: newTimeSpent } : t) }),
          ...(tab === 'tomorrow' && { tomorrowTasks: ((state as any).tomorrowTasks || []).map((t: any) => t.id === id ? { ...t, timeSpent: newTimeSpent } : t) })
        } as any));
        get().forceInstantSave();
      },

      updateTaskTitle: (id, title, tab = 'today') => {
        set((state) => {
          const isCurrentlyActive = state.activeTaskId === id;
          const currentTasks = (state as any).tasks || [];
          const currentTomorrow = (state as any).tomorrowTasks || [];

          if (tab === 'today') {
            return {
              tasks: currentTasks.map((t: any) => t.id === id ? { ...t, title } : t),
              ...(isCurrentlyActive && { activeTaskTitle: title }),
            };
          }
          return {
            tomorrowTasks: currentTomorrow.map((t: any) => t.id === id ? { ...t, title } : t),
            ...(isCurrentlyActive && { activeTaskTitle: title }),
          };
        });
        get().forceInstantSave();
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
        return { customAlarmSounds: [...currentList, newSound], alarmSound: url };
      }),

      deleteCustomAlarmSound: (id) => set((state) => {
        const currentList = state.customAlarmSounds || [];
        const soundToDelete = currentList.find(s => s.id === id);
        const updatedList = currentList.filter(s => s.id !== id);
        const activeSound = state.alarmSound === soundToDelete?.url ? '/ringtones/narutoBGM.mp3' : state.alarmSound;
        return { customAlarmSounds: updatedList, alarmSound: activeSound };
      }),

      alarmVolume: 1,
      setTimerEndAt: (time) => set({ timerEndAt: time, timerLastUpdated: Date.now() }),
      setTimerPausedLeft: (time) => set({ timerPausedLeft: time, timerLastUpdated: Date.now() }),
      setTimerInitialMins: (mins) => set({ timerInitialMins: mins, timerLastUpdated: Date.now() }),
      setTimerDeviceId: (id) => set({ timerDeviceId: id, timerLastUpdated: Date.now() }),

      clearTimerState: () => {
        set({
          timerEndAt: null,
          timerPausedLeft: null,
          timerInitialMins: null,
          timerDeviceId: null,
          timerLastSavedChunks: 0,
          timerLastAlertedChunks: 0,
          timerLastUpdated: Date.now(),
          activeTaskId: null,
          activeTaskTitle: null,
        });
        forcePushTimerState();
      },

      setTimerLastSavedChunks: (chunks) => set({ timerLastSavedChunks: chunks }),
      setTimerLastAlertedChunks: (chunks) => set({ timerLastAlertedChunks: chunks }),
      setIsAlarmPlaying: (playing) => set({ isAlarmPlaying: playing }),
      setAlarmSound: (sound) => set({ alarmSound: sound }),
      alarmDurationSecs: 60,
      setAlarmDurationSecs: (secs) => set({ alarmDurationSecs: secs }),
      setAlarmVolume: (vol) => set({ alarmVolume: vol }),
      enableAlarmSound: true,
      enableAlarmVibration: true,
      enablePanicButton: true,
      panicButtonMode: 'hide',
      taskIntervalAlertMins: 10,
      setEnableAlarmSound: (val) => set({ enableAlarmSound: val }),
      setEnableAlarmVibration: (val) => set({ enableAlarmVibration: val }),
      isTaskIntervalAlertEnabled: false,
      setIsTaskIntervalAlertEnabled: (enabled) => set({ isTaskIntervalAlertEnabled: enabled }),
      setTaskIntervalAlertMins: (mins) => set({ taskIntervalAlertMins: mins }),
      taskIntervalRingSecs: 10,
      setTaskIntervalRingSecs: (secs) => set({ taskIntervalRingSecs: secs }),

      isTimerIntervalEnabled: false,
      setIsTimerIntervalEnabled: (enabled) => set({ isTimerIntervalEnabled: enabled }),
      timerIntervalMins: 5,
      setTimerIntervalMins: (mins) => set({ timerIntervalMins: mins }),

      isStopwatchIntervalEnabled: false,
      setIsStopwatchIntervalEnabled: (enabled) => set({ isStopwatchIntervalEnabled: enabled }),
      stopwatchIntervalMins: 5,
      setStopwatchIntervalMins: (mins) => set({ stopwatchIntervalMins: mins }),
      setEnablePanicButton: (val) => set({ enablePanicButton: val }),
      setPanicButtonMode: (val) => set({ panicButtonMode: val }),

      currentQuote: null,
      isQuotePopupOpen: false,
      showQuotePopup: (quote) => set({ currentQuote: quote, isQuotePopupOpen: true }),
      hideQuotePopup: () => set({ isQuotePopupOpen: false }),
      customQuotes: [],
      setCustomQuotes: (quotes) => set({ customQuotes: quotes }),
      useCustomQuotes: false,
      setUseCustomQuotes: (useCustom) => set({ useCustomQuotes: useCustom }),
      manifestationCustomQuotes: [],
      setManifestationCustomQuotes: (quotes) => set(() => {
        return { manifestationCustomQuotes: (quotes || []).slice(0, 30) };
      }),
      addManifestationCustomQuote: (quote) => set((state) => {
        const trimmed = quote.trim();
        const current = state.manifestationCustomQuotes || [];
        if (!trimmed || current.length >= 30) return state;
        return { manifestationCustomQuotes: [...current, trimmed] };
      }),
      deleteManifestationCustomQuote: (index) => set((state) => {
        return { manifestationCustomQuotes: (state.manifestationCustomQuotes || []).filter((_, i) => i !== index) };
      }),

      isNotesOpen: false,
      toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),

      isTimetableOpen: false,
      setIsTimetableOpen: (isOpen) => set({ isTimetableOpen: isOpen }),
      timetableGrid: {},
      timetableColors: {},
      weekdayTimes: [],
      weekendTimes: [],
      timetableStartTime: 540,
      timetableWeekendStartTime: 540,

      isStopwatchOpen: false,
      toggleStopwatch: () => set((state) => {
        const next = !state.isStopwatchOpen;
        let extra = {};
        if (next) {
          const currentZ = state.widgetZIndices || {};
          const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50;
          extra = { widgetZIndices: { ...currentZ, stopwatch: maxZ + 1 } };
        }
        return { isStopwatchOpen: next, ...extra };
      }),
      stopwatchStartTime: null,
      setStopwatchStartTime: (time) => set({ stopwatchStartTime: time }),
      stopwatchDeviceId: null,
      setStopwatchDeviceId: (id) => set({ stopwatchDeviceId: id }),
      stopwatchLastSavedChunks: 0,
      setStopwatchLastSavedChunks: (chunks) => set({ stopwatchLastSavedChunks: chunks }),
      stopwatchAddToStats: true,
      setStopwatchAddToStats: (val) => set({ stopwatchAddToStats: val }),

      roadmaps: [
        {
          id: 'default-roadmap-id',
          name: 'My Personal Goals',
          targetDate: '2026-12-31',
          nodes: [
            {
              id: 'node-seed-1',
              title: 'Core Objective 1',
              description: 'Primary milestone focus area',
              status: 'in-progress',
              subItems: [
                { id: 'node-seed-1-1', title: 'Action Item A', status: 'completed' },
                { id: 'node-seed-1-2', title: 'Action Item B', status: 'pending' }
              ]
            },
            {
              id: 'node-seed-2',
              title: 'Core Objective 2',
              description: 'Secondary milestone focus area',
              status: 'pending',
              subItems: [
                { id: 'node-seed-2-1', title: 'Sub-task Alpha', status: 'pending' }
              ]
            }
          ]
        }
      ],
      setRoadmaps: (roadmaps) => set({ roadmaps }),
      syntheticDeadlines: {},
      setSyntheticDeadline: (status, date) => set((state) => {
        const payload = { syntheticDeadlines: { ...state.syntheticDeadlines, [status]: date } };
        pushDeadlinesToDB(payload);
        return payload;
      }),
      isPlansOpen: false,
      togglePlans: () => set((state) => ({ isPlansOpen: !state.isPlansOpen })),

      is24HourClock: false,
      toggle24HourClock: () => set((state) => ({ is24HourClock: !state.is24HourClock })),
      clockScale: 1,
      setClockScale: (scale) => set({ clockScale: scale }),
      dashboardScale: 1,
      setDashboardScale: (scale) => set({ dashboardScale: scale }),
      mobileDashboardScale: 1,
      setMobileDashboardScale: (scale) => set({ mobileDashboardScale: scale }),
      dockScale: 1,
      setDockScale: (scale) => set({ dockScale: scale }),
      dockOffset: 0,
      setDockOffset: (offset) => set({ dockOffset: offset }),

      countdowns: [],
      autoOpenCountdowns: true,
      setAutoOpenCountdowns: (enabled) => set({ autoOpenCountdowns: enabled }),
      addCountdown: (title = 'New Target', endDate = null) => {
        let newId = '';
        set((state) => {
          if (state.countdowns.length >= 5) return state;
          newId = Date.now().toString();
          const newArr = [...state.countdowns, { id: newId, title, endDate }];
          pushCountdownsToDB({ countdowns: newArr });
          return { countdowns: newArr };
        });
        return newId;
      },
      updateCountdown: (id, title, endDate) => set((state) => {
        const newArr = state.countdowns.map(c => c.id === id ? { ...c, title, endDate } : c);
        pushCountdownsToDB({ countdowns: newArr });
        return { countdowns: newArr };
      }),
      deleteCountdown: (id) => set((state) => {
        const newArr = state.countdowns.filter(c => c.id !== id);
        pushCountdownsToDB({ countdowns: newArr });
        return { countdowns: newArr };
      }),

      deadlines: [],
      addDeadline: (date, text) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        set((state) => {
          const payload = { deadlines: [...filterActiveDeadlines(state.deadlines), { id, date, text }] };
          pushDeadlinesToDB(payload);
          return payload;
        });
        return id;
      },
      updateDeadline: (id, text) => set((state) => {
        const payload = { deadlines: state.deadlines.map(d => d.id === id ? { ...d, text } : d) };
        pushDeadlinesToDB(payload);
        return payload;
      }),
      deleteDeadline: (id) => set((state) => {
        const payload = { deadlines: state.deadlines.filter(d => d.id !== id) };
        pushDeadlinesToDB(payload);
        return payload;
      }),
      toggleDeadlineDone: (id) => set((state) => {
        const payload = { deadlines: state.deadlines.map(d => d.id === id ? { ...d, isDone: !d.isDone } : d) };
        pushDeadlinesToDB(payload);
        return payload;
      }),
      deleteAllDeadlinesForDay: (date) => set((state) => {
        const payload = { deadlines: state.deadlines.filter(d => d.date !== date) };
        pushDeadlinesToDB(payload);
        return payload;
      }),
      deleteAllDeadlines: () => set(() => {
        const payload = { deadlines: [] };
        pushDeadlinesToDB(payload);
        return payload;
      }),
      cleanOldDeadlines: () => set((state) => {
        const filtered = filterActiveDeadlines(state.deadlines);
        const didChange = filtered.length !== state.deadlines.length;
        const isHydrated = useDashboardStore.getState()._hasHydrated;
        if (didChange && isHydrated && state.deadlines.length > 0) {
          pushDeadlinesToDB({ deadlines: filtered });
        }
        return { deadlines: filtered };
      }),

      deadlineAlertDays: 0,
      setDeadlineAlertDays: (days) => set(() => {
        const payload = { deadlineAlertDays: Math.max(0, days) };
        pushDeadlinesToDB(payload);
        return payload;
      }),
      dismissedDeadlineAlerts: [],
      dismissDeadlineAlert: (id) => set((state) => {
        const payload = { dismissedDeadlineAlerts: Array.from(new Set([...(state.dismissedDeadlineAlerts || []), id])) };
        pushDeadlinesToDB(payload);
        return payload;
      }),
      disableDeadlineLockOnToday: false,
      setDisableDeadlineLockOnToday: (disabled) => set(() => {
        const payload = { disableDeadlineLockOnToday: disabled };
        pushDeadlinesToDB(payload);
        return payload;
      }),
      hideYouInLeaderboard: false,
      setHideYouInLeaderboard: (hide) => set(() => {
        const payload = { hideYouInLeaderboard: hide };
        pushDeadlinesToDB(payload); // saving it alongside deadlines for ease since we just need it in DB
        return payload;
      }),

      isDeadlinesCollapsed: false,
      setIsDeadlinesCollapsed: (collapsed) => set({ isDeadlinesCollapsed: collapsed }),

      viewingFriend: null,
      setViewingFriend: (friend) => set({ viewingFriend: friend }),

      dailyTimes: {},
      isDayStartModalOpen: false,
      toggleDayStartModal: () => set((state) => ({ isDayStartModalOpen: !state.isDayStartModalOpen })),
      updateDailyTime: (dateKey, field, timestamp) => {
        set((state) => {
          const newData = { ...state.dailyTimes };
          if (!newData[dateKey]) newData[dateKey] = {};
          newData[dateKey] = { ...newData[dateKey], [field]: timestamp };
          pushDailyRoutineToDB({ dailyTimes: newData });
          return { dailyTimes: newData };
        });
      },

      clockOffsets: {},
      updateClockOffset: (bgSrc, x, y) => set((state) => ({
        clockOffsets: { ...state.clockOffsets, [bgSrc]: { x, y } }
      })),
      resetClockOffset: (bgSrc) => set((state) => {
        const newOffsets = { ...state.clockOffsets };
        delete newOffsets[bgSrc];
        return { clockOffsets: newOffsets };
      }),

      widgetOffsets: {},
      updateWidgetOffset: (bgSrc, widgetId, x, y) => set((state) => {
        const currentBgOffsets = state.widgetOffsets[bgSrc] || {};
        return {
          widgetOffsets: {
            ...state.widgetOffsets,
            [bgSrc]: { ...currentBgOffsets, [widgetId]: { x, y } }
          }
        };
      }),
      resetWidgetOffset: (bgSrc, widgetId) => set((state) => {
        if (!state.widgetOffsets[bgSrc]) return state;
        const newBgOffsets = { ...state.widgetOffsets[bgSrc] };
        delete newBgOffsets[widgetId];
        return { widgetOffsets: { ...state.widgetOffsets, [bgSrc]: newBgOffsets } };
      }),

      lockedWidgets: ['quote', 'countdowns', 'timer', 'stopwatch', 'toolbar'],
      toggleWidgetLock: (widgetId) => set((state) => ({
        lockedWidgets: state.lockedWidgets.includes(widgetId)
          ? state.lockedWidgets.filter(id => id !== widgetId)
          : [...state.lockedWidgets, widgetId]
      })),

      widgetZIndices: {},
      bringToFront: (widgetId) => set((state) => {
        const currentZIndices = state.widgetZIndices || {};
        const values = Object.values(currentZIndices);
        const maxZ = values.length > 0 ? Math.max(...values) : 50;
        if (currentZIndices[widgetId] === maxZ && maxZ > 50) return state;
        return { widgetZIndices: { ...currentZIndices, [widgetId]: maxZ + 1 } };
      }),

      resetAllOffsets: (bgSrc) => set((state) => {
        const newClockOffsets = { ...state.clockOffsets };
        delete newClockOffsets[bgSrc];
        const newWidgetOffsets = { ...state.widgetOffsets };
        delete newWidgetOffsets[bgSrc];
        return { clockOffsets: newClockOffsets, widgetOffsets: newWidgetOffsets };
      }),

      currentBgSrc: null,
      setCurrentBgSrc: (src) => set({ currentBgSrc: src }),

      hiddenWallpapers: [],
      toggleWallpaperVisibility: (filename) => set((state) => ({
        hiddenWallpapers: state.hiddenWallpapers.includes(filename)
          ? state.hiddenWallpapers.filter(name => name !== filename)
          : [...state.hiddenWallpapers, filename]
      })),

      isSlideshowEnabled: false,
      setIsSlideshowEnabled: (enabled) => set({ isSlideshowEnabled: enabled }),
      isMobileCountdownsVisible: true,
      setIsMobileCountdownsVisible: (visible) => set({ isMobileCountdownsVisible: visible }),
      slideshowIntervalMins: 10,
      setSlideshowIntervalMins: (mins) => set({ slideshowIntervalMins: mins }),

      upiId: '',
      setUpiId: (id) => set({ upiId: id }),

      showQuote: true,
      showTimer: true,
      showCountdowns: true,
      showVideoControls: true,
      showClock: true,
      showTasks: true,
      showCalendar: true,
      showTodayWork: true,
      showStats: true,
      showPlans: true,
      showNotes: true,
      showTimetable: true,
      showDock: true,
      showDeadlineAlerts: true,
      showBgSwitcher: true,
      showSettingsBtn: true,
      showStopwatch: true,
      toggleVisibility: (key) => set((state) => {
        return { [key]: !state[key] };
      }),

      hideConfig: { quote: true, timer: false, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true },
      setHideConfig: (key, value) => set((state) => ({ hideConfig: { ...state.hideConfig, [key]: value } })),
      setHideAll: (hide) => {
        if (hide) {
          set({ hideConfig: { quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true } });
        } else {
          set({ hideConfig: {} });
        }
      },

      mobileHideConfig: { quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true },
      setMobileHideConfig: (key, value) => set((state) => ({ mobileHideConfig: { ...state.mobileHideConfig, [key]: value } })),
      setMobileHideAll: (hide) => {
        if (hide) {
          set({ mobileHideConfig: { quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true } });
        } else {
          set({ mobileHideConfig: {} });
        }
      },

      isPanicHidden: false,
      togglePanicHide: () => set((state) => {
        if (state.isHidden) return {}; // Exclusive with Focus Mode
        return { isPanicHidden: !state.isPanicHidden };
      }),
      panicShortcutKey: 'ctrl+z',
      setPanicShortcutKey: (key) => {
        set({ panicShortcutKey: key.toLowerCase() });
        get().forceInstantSave();
      },
      focusShortcutKey: 'ctrl+h',
      setFocusShortcutKey: (key) => {
        set({ focusShortcutKey: key.toLowerCase() });
        get().forceInstantSave();
      },
      panicWallpaperSwitch: false,
      setPanicWallpaperSwitch: (val) => {
        set({ panicWallpaperSwitch: val });
        get().forceInstantSave();
      },
      peekModeWallpaper: null,
      setPeekModeWallpaper: (url) => {
        set({ peekModeWallpaper: url });
        get().forceInstantSave();
      },
      customPeekModeWallpapers: [],
      setCustomPeekModeWallpapers: (urls) => set({ customPeekModeWallpapers: urls }),
      activePeekModeCustomIndex: null,
      setActivePeekModeCustomIndex: (index) => {
        set({ activePeekModeCustomIndex: index });
        get().forceInstantSave();
      },

      rightWidgetsOffset: 48,
      setRightWidgetsOffset: (offset) => set({ rightWidgetsOffset: Math.max(0, offset) }),

      dismissedBroadcasts: [],
      dismissBroadcast: (id) => set((state) => {
        if (!state.dismissedBroadcasts.includes(id)) {
          return { dismissedBroadcasts: [...state.dismissedBroadcasts, id] };
        }
        return state;
      }),

      clearOldData: async (days: number) => {
        try {
          await clearOldDataAPI(days);
          set((state) => {
            const newHistory = { ...state.history };
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

            Object.keys(newHistory).forEach((key) => {
              if (key < cutoffDateStr) delete newHistory[key];
            });

            const newDailyTimes = { ...state.dailyTimes };
            Object.keys(newDailyTimes).forEach((key) => {
              if (key < cutoffDateStr) delete newDailyTimes[key];
            });

            return { history: newHistory, dailyTimes: newDailyTimes };
          });
        } catch (err) { console.error("Failed to clear old data", err); }
      },

      clearAllData: async () => {
        try {
          await clearAllDataAPI();
          localStorage.removeItem('dashboard-storage');
          window.location.reload();
        } catch (err) { console.error("Failed to clear all data", err); }
      },

      clearAllTasksAndPlans: () => {
        useTaskStore.setState({ tasks: [], tomorrowTasks: [] });
        get().forceInstantSave();
      },

      resetTimetable: () => {
        set({ timetableGrid: {}, timetableColors: {} });
        get().forceInstantSave();
      },

      forceInstantSave: () => { triggerInstantSave(); },
      pushManifestationToDB: () => { triggerInstantSave(); },
      pushWallpapersToDB: () => { triggerInstantSave(); },
    }),
    {
      name: 'dashboard-storage',
      storage: fileStorage,
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          if (!persistedState.hideConfig) persistedState.hideConfig = {};
        }
        return persistedState;
      },
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

        const transientKeys = [
          'isQuotePopupOpen', 'isTaskManagerOpen', 'isStatsOpen', 'timerTrigger',
          'isNotesOpen', 'isPlansOpen', 'isTimetableOpen', 'isDayStartModalOpen',
          'isVideoMuted', 'isVideoPlaying', 'isSettingsOpen', 'isStopwatchOpen', '_hasHydrated',
          'isAlarmPlaying', 'isTourOpen', 'isNewsOpen', 'isManifestationOpen', 'selectedGroupId'
        ];
        transientKeys.forEach(key => { if (persistedState[key] !== undefined) delete persistedState[key]; });

        if (persistedState.wallpaper === "/wallpapers/defaultWallpaper2.jpeg") {
          persistedState.wallpaper = "/wallpapers/naruto.webp";
        }
        
        if (persistedState.timerEndAt && persistedState.timerEndAt < Date.now()) {
          persistedState.timerEndAt = null;
          persistedState.timerPausedLeft = null;
          persistedState.timerInitialMins = null;
          persistedState.timerDeviceId = null;
          persistedState.timerLastSavedChunks = 0;
          persistedState.timerLastAlertedChunks = 0;
          persistedState.activeTaskId = null;
          persistedState.activeTaskTitle = null;
        } else if (!persistedState.timerEndAt && (persistedState.timerPausedLeft === null || persistedState.timerPausedLeft === undefined)) {
          persistedState.timerInitialMins = null;
          persistedState.timerDeviceId = null;
          persistedState.timerLastSavedChunks = 0;
          persistedState.timerLastAlertedChunks = 0;
          persistedState.activeTaskId = null;
          persistedState.activeTaskTitle = null;
        }

        persistedState.isAlarmPlaying = false;

        if (persistedState.hideConfig && currentState.hideConfig) {
          persistedState.hideConfig = { ...currentState.hideConfig, ...persistedState.hideConfig };
        }
        if (persistedState.mobileHideConfig && currentState.mobileHideConfig) {
          persistedState.mobileHideConfig = { ...currentState.mobileHideConfig, ...persistedState.mobileHideConfig };
        }

        if (!persistedState._focusPillDefaultsUpdated) {
          if (persistedState.hideConfig) {
            persistedState.hideConfig.todayFocusPill = false;
            persistedState.hideConfig.timerPill = false;
          }
          if (persistedState.mobileHideConfig) {
            persistedState.mobileHideConfig.todayFocusPill = false;
            persistedState.mobileHideConfig.timerPill = false;
          }
          persistedState._focusPillDefaultsUpdated = true;
        }

        if (!persistedState.customAlarmSounds) persistedState.customAlarmSounds = [];
        if (persistedState.deadlines && Array.isArray(persistedState.deadlines)) {
          persistedState.deadlines = filterActiveDeadlines(persistedState.deadlines);
        }
        if (!persistedState.tomorrowTasks) persistedState.tomorrowTasks = [];
        if (!persistedState.tasksDate) persistedState.tasksDate = getLocalDateString();

        const safeState = { ...currentState, ...persistedState };
        safeState.dashboardScale = typeof persistedState.dashboardScale === 'number' ? persistedState.dashboardScale : 1;
        safeState.mobileDashboardScale = typeof persistedState.mobileDashboardScale === 'number' ? persistedState.mobileDashboardScale : 1;
        safeState.dockScale = typeof persistedState.dockScale === 'number' ? persistedState.dockScale : 1;
        safeState.dockOffset = typeof persistedState.dockOffset === 'number' ? persistedState.dockOffset : 0;

        safeState.roadmaps = Array.isArray(persistedState.roadmaps) ? persistedState.roadmaps : currentState.roadmaps;
        safeState.deadlines = filterActiveDeadlines(persistedState.deadlines || []);

        if (persistedState.history && typeof persistedState.history === 'object') {
          safeState.history = { ...currentState.history, ...persistedState.history };
        }
        if (persistedState.dailyTimes && typeof persistedState.dailyTimes === 'object') {
          safeState.dailyTimes = mergeDailyTimes(currentState.dailyTimes || {}, persistedState.dailyTimes || {});
        }
        
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
        Promise.resolve().then(() => {
          if (state && typeof state.setHasHydrated === 'function') {
            state.setHasHydrated(true);
          } else {
            useDashboardStore.getState().setHasHydrated(true);
          }
        });
      },
    }
  )
);
// Re-export external handlers so other components can import them directly from '@/store/dashboardStore'

export * from './helpers';
export * from './types';