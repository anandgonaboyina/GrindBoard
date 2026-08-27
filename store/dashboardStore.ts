import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getLocalDateString } from '@/utils/date';

export interface CustomAlarmSound {
  id: string;
  name: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  duration: number; // in minutes
  completed: boolean;
  timeSpent?: number; // total minutes spent on this task
  groupId?: number; // 0, 1, or 2 for Tab 1, 2, 3
}

export interface Note {
  id: string;
  title: string;
  entries: Record<string, string>; // date string -> html content
}

export type ResourceLink = {
  id: string;
  label: string;
  url: string;
};

export type RoadmapItem = {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  links?: ResourceLink[];
  subItems?: RoadmapItem[];
};

export type Roadmap = {
  id: string;
  name: string;
  targetDate?: string;
  nodes: RoadmapItem[];
};

export interface DailyTime {
  wakeupTime?: number;
  workStartedTime?: number;
  sleepTime?: number;
  customFields?: Record<string, number>;
}

export const filterActiveDeadlines = (deadlines: any[]) => {
  if (!Array.isArray(deadlines)) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return deadlines.filter((d: any) => {
    if (!d || !d.date) return false;
    const parts = String(d.date).split('-');
    if (parts.length < 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

    const dDate = new Date(year, month - 1, day);
    dDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    // Keep if it is in the future, today, or up to 7 days in the past (diffDays <= 7)
    return diffDays <= 7;
  });
};

export type TimetableGrid = Record<string, Record<string, string>>;

interface DashboardState {
  wallpaper: string;
  bgIndex: number;
  currentBgType: 'image' | 'video' | null;
  cycleBackground: () => void;
  setCurrentBgType: (type: 'image' | 'video' | null) => void;
  isVideoMuted: boolean;
  setIsVideoMuted: (muted: boolean) => void;
  isVideoPlaying: boolean;
  setIsVideoPlaying: (playing: boolean) => void;

  customDesktopWallpapers: string[];
  setCustomDesktopWallpapers: (urls: string[]) => void;
  activeDesktopCustomIndex: number | null;
  setActiveDesktopCustomIndex: (index: number | null) => void;

  customMobileWallpapers: string[];
  setCustomMobileWallpapers: (urls: string[]) => void;
  activeMobileCustomIndex: number | null;
  setActiveMobileCustomIndex: (index: number | null) => void;

  history: Record<string, number>;
  tasks: Task[];
  tomorrowTasks: Task[];
  tasksDate: string;
  checkTasksRollover: () => void;
  reorderTasks: (tab: 'today' | 'tomorrow', startIndex: number, endIndex: number) => void;
  isHidden: boolean;
  lockedWallpaper: string | null;
  setLockedWallpaper: (filename: string | null) => void;
  setWallpaper: (url: string) => void;
  addMins: (dateKey: string, mins: number) => void;
  setTasks: (tasks: Task[], tab?: 'today' | 'tomorrow') => void;
  addTask: (title: string, duration: number, tab?: 'today' | 'tomorrow', groupId?: number) => void;
  toggleTask: (id: string, tab?: 'today' | 'tomorrow') => void;
  deleteTask: (id: string, tab?: 'today' | 'tomorrow') => void;
  moveTaskTab: (id: string, fromTab: 'today' | 'tomorrow') => void;
  taskGroupNames: string[];
  setTaskGroupName: (index: number, name: string) => void;
  toggleHide: () => void;

  isTaskManagerOpen: boolean;
  toggleTaskManager: () => void;
  isStatsOpen: boolean;
  toggleStats: () => void;
  isTimerOpen: boolean;
  toggleTimer: () => void;
  isCalendarOpen: boolean;
  toggleCalendar: () => void;
  isCalendarBusy: boolean;
  setIsCalendarBusy: (busy: boolean) => void;
  isClockOpen: boolean;
  toggleClock: () => void;
  isSettingsOpen: boolean;
  isNewsOpen: boolean;
  hasUnreadNews: boolean;
  toggleNews: () => void;
  setHasUnreadNews: (val: boolean) => void;
  settingsActiveTab: 'preferences' | 'data' | 'about' | 'focus' | 'sound' | 'credits' | 'connect' | 'update' | 'wallpaper' | 'quotes';
  toggleSettings: () => void;
  setSettingsActiveTab: (tab: 'preferences' | 'data' | 'about' | 'focus' | 'sound' | 'credits' | 'connect' | 'update' | 'wallpaper' | 'quotes') => void;
  connectInitialTab?: 'profile' | 'friends' | 'leaderboard' | 'groups';
  setConnectInitialTab: (tab?: 'profile' | 'friends' | 'leaderboard' | 'groups') => void;
  
  userGroups: any[];
  setUserGroups: (groups: any[]) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  
  timerTrigger: { mins: number; ts: number; taskId?: string; taskTitle?: string } | null;
  triggerTimer: (mins: number, taskId?: string, taskTitle?: string) => void;

  // Active Task for Timer
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  setActiveTask: (id: string | null, title: string | null) => void;
  updateTaskDuration: (id: string, decreaseMins: number) => void;
  editTaskDuration: (id: string, newDuration: number, tab?: 'today' | 'tomorrow') => void;
  editTaskTimeSpent: (id: string, newTimeSpent: number, tab?: 'today' | 'tomorrow') => void;
  updateTaskTitle: (id: string, title: string, tab?: 'today' | 'tomorrow') => void;

  // Global Timer State
  timerEndAt: number | null;
  timerPausedLeft: number | null; // Keeps track of remaining time if paused
  timerInitialMins: number | null;
  timerDeviceId: string | null;
  timerLastSavedChunks: number;
  timerLastAlertedChunks: number;
  timerLastUpdated: number;
  isAlarmPlaying: boolean;
  alarmSound: string;
  customAlarmSounds: CustomAlarmSound[];
  addCustomAlarmSound: (name: string, url: string) => void;
  deleteCustomAlarmSound: (id: string) => void;
  alarmVolume: number;
  enableAlarmSound: boolean;
  enableAlarmVibration: boolean;
  enablePanicButton: boolean;
  panicButtonMode: 'redirect' | 'hide';
  alarmDurationSecs: number;
  taskIntervalAlertMins: number;
  setEnableAlarmSound: (enabled: boolean) => void;
  setEnableAlarmVibration: (enabled: boolean) => void;
  setEnablePanicButton: (enabled: boolean) => void;
  setPanicButtonMode: (mode: 'redirect' | 'hide') => void;
  setTimerEndAt: (time: number | null) => void;
  setTimerPausedLeft: (time: number | null) => void;
  setTimerInitialMins: (mins: number | null) => void;
  setTimerDeviceId: (id: string | null) => void;
  setTimerLastSavedChunks: (chunks: number) => void;
  setTimerLastAlertedChunks: (chunks: number) => void;
  setIsAlarmPlaying: (playing: boolean) => void;
  setAlarmSound: (sound: string) => void;
  setAlarmDurationSecs: (secs: number) => void;
  setAlarmVolume: (vol: number) => void;
  setTaskIntervalAlertMins: (mins: number) => void;
  isTaskIntervalAlertEnabled: boolean;
  setIsTaskIntervalAlertEnabled: (enabled: boolean) => void;
  taskIntervalRingSecs: number;
  setTaskIntervalRingSecs: (secs: number) => void;

  isTimerIntervalEnabled: boolean;
  setIsTimerIntervalEnabled: (enabled: boolean) => void;
  timerIntervalMins: number;
  setTimerIntervalMins: (mins: number) => void;

  isStopwatchIntervalEnabled: boolean;
  setIsStopwatchIntervalEnabled: (enabled: boolean) => void;
  stopwatchIntervalMins: number;
  setStopwatchIntervalMins: (mins: number) => void;

  // Quotes State
  currentQuote: { text: string; author: string } | null;
  isQuotePopupOpen: boolean;
  showQuotePopup: (quote: { text: string; author: string }) => void;
  hideQuotePopup: () => void;
  customQuotes: { text: string; author: string }[];
  setCustomQuotes: (quotes: { text: string; author: string }[]) => void;
  useCustomQuotes: boolean;
  setUseCustomQuotes: (useCustom: boolean) => void;


  // Notes State
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  activeNoteId: string | null;
  isNotesOpen: boolean;
  addNote: () => void;
  updateNoteTitle: (id: string, title: string) => void;
  updateNoteEntry: (id: string, date: string, content: string) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string) => void;
  toggleNotes: () => void;
  reorderNotes: (fromIndex: number, toIndex: number) => void;

  // Stopwatch State
  isStopwatchOpen: boolean;
  toggleStopwatch: () => void;
  stopwatchStartTime: number | null;
  setStopwatchStartTime: (time: number | null) => void;
  stopwatchDeviceId: string | null;
  setStopwatchDeviceId: (id: string | null) => void;
  stopwatchLastSavedChunks: number;
  setStopwatchLastSavedChunks: (chunks: number) => void;
  stopwatchAddToStats: boolean;
  setStopwatchAddToStats: (val: boolean) => void;

  // Plans/Roadmap State
  roadmaps: Roadmap[];
  setRoadmaps: (roadmaps: Roadmap[]) => void;
  syntheticDeadlines: Record<string, string>;
  setSyntheticDeadline: (status: string, date: string) => void;
  isPlansOpen: boolean;
  togglePlans: () => void;

  // Clock Format & Size & Dashboard Scale
  is24HourClock: boolean;
  toggle24HourClock: () => void;
  clockScale: number;
  setClockScale: (scale: number) => void;
  dashboardScale: number;
  setDashboardScale: (scale: number) => void;
  mobileDashboardScale: number;
  setMobileDashboardScale: (scale: number) => void;
  dockScale: number;
  setDockScale: (scale: number) => void;
  dockOffset: number;
  setDockOffset: (offset: number) => void;

  // Countdowns
  countdowns: { id: string; title: string; endDate: string | null }[];
  addCountdown: (title?: string, endDate?: string | null) => string;
  updateCountdown: (id: string, title: string, endDate: string | null) => void;
  deleteCountdown: (id: string) => void;

  // Deadlines
  deadlines: any[];
  addDeadline: (date: string, text: string) => string;
  updateDeadline: (id: string, text: string) => void;
  deleteDeadline: (id: string) => void;
  toggleDeadlineDone: (id: string) => void;
  deleteAllDeadlinesForDay: (date: string) => void;
  deleteAllDeadlines: () => void;
  cleanOldDeadlines: () => void;
  deadlineAlertDays: number;
  setDeadlineAlertDays: (days: number) => void;
  dismissedDeadlineAlerts: string[];
  dismissDeadlineAlert: (id: string) => void;
  isDeadlinesCollapsed: boolean;
  setIsDeadlinesCollapsed: (collapsed: boolean) => void;

  // Timetable
  timetableGrid: TimetableGrid;
  timetableColors: Record<string, Record<string, string>>;
  updateTimetableCell: (day: string, time: string, subject: string) => void;
  updateTimetableColor: (day: string, time: string, color: string) => void;
  weekdayTimes: string[];
  weekendTimes: string[];
  timetableStartTime: number;
  timetableWeekendStartTime: number;
  setTimetableStartTime: (mins: number) => void;
  setTimetableWeekendStartTime: (mins: number) => void;
  updateTimetableTime: (isWeekend: boolean, index: number, newTime: string, keyMap?: Record<string, string>) => void;
  renameTimetableKeys: (isWeekend: boolean, keyMap: Record<string, string>) => void;
  resetTimetable: () => void;
  addTimetableRow: (isWeekend: boolean, prepend?: boolean) => void;
  deleteTimetableRow: (isWeekend: boolean, index: number) => void;
  useTimetableRange: boolean;
  toggleTimetableRange: () => void;
  isTimetableOpen: boolean;
  setIsTimetableOpen: (isOpen: boolean) => void;

  viewingFriend: { username: string, stats: any } | null;
  setViewingFriend: (friend: { username: string, stats: any } | null) => void;

  // Daily Times (Wake up, Work start, Bed time)
  dailyTimes: Record<string, DailyTime>;
  updateDailyTime: (dateKey: string, field: keyof DailyTime, timestamp: number) => void;
  isDayStartModalOpen: boolean;
  toggleDayStartModal: () => void;

  clockOffsets: Record<string, { x: number, y: number }>;
  updateClockOffset: (bgSrc: string, x: number, y: number) => void;
  resetClockOffset: (bgSrc: string) => void;

  widgetOffsets: Record<string, Record<string, { x: number, y: number }>>;
  updateWidgetOffset: (bgSrc: string, widgetId: string, x: number, y: number) => void;
  resetWidgetOffset: (bgSrc: string, widgetId: string) => void;

  lockedWidgets: string[];
  toggleWidgetLock: (widgetId: string) => void;
  resetAllOffsets: (bgSrc: string) => void;

  widgetZIndices: Record<string, number>;
  bringToFront: (widgetId: string) => void;

  currentBgSrc: string | null;
  setCurrentBgSrc: (src: string | null) => void;

  hiddenWallpapers: string[];
  toggleWallpaperVisibility: (filename: string) => void;

  // Slideshow
  isSlideshowEnabled: boolean;
  setIsSlideshowEnabled: (enabled: boolean) => void;
  isMobileCountdownsVisible: boolean;
  setIsMobileCountdownsVisible: (visible: boolean) => void;
  slideshowIntervalMins: number;
  setSlideshowIntervalMins: (mins: number) => void;

  // Support
  upiId: string;
  setUpiId: (id: string) => void;

  // Theme
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  notesThemeOverride: 'light' | 'dark' | null;
  setNotesThemeOverride: (theme: 'light' | 'dark' | null) => void;
  timetableThemeOverride: 'light' | 'dark' | null;
  setTimetableThemeOverride: (theme: 'light' | 'dark' | null) => void;

  // Widget Visibility Preferences
  showQuote: boolean;
  showTimer: boolean;
  showCountdowns: boolean;
  showVideoControls: boolean;
  showClock: boolean;
  showTasks: boolean;
  showCalendar: boolean;
  showTodayWork: boolean;
  showStats: boolean;
  showPlans: boolean;
  showNotes: boolean;
  showTimetable: boolean;
  showDock: boolean;
  showDeadlineAlerts: boolean;
  showBgSwitcher: boolean;
  showSettingsBtn: boolean;
  showStopwatch: boolean;
  toggleVisibility: (key: 'showQuote' | 'showTimer' | 'showCountdowns' | 'showVideoControls' | 'showClock' | 'showTasks' | 'showCalendar' | 'showTodayWork' | 'showStats' | 'showPlans' | 'showNotes' | 'showTimetable' | 'showDock' | 'showDeadlineAlerts' | 'showBgSwitcher' | 'showSettingsBtn' | 'showStopwatch') => void;

  // Custom Hide Configuration (Panic Mode / Focus Mode)
  hideConfig: Record<string, boolean>;
  setHideConfig: (key: string, value: boolean) => void;
  setHideAll: (hide: boolean) => void;

  mobileHideConfig: Record<string, boolean>;
  setMobileHideConfig: (key: string, value: boolean) => void;
  setMobileHideAll: (hide: boolean) => void;

  isPanicHidden: boolean;
  togglePanicHide: () => void;
  panicShortcutKey: string;
  setPanicShortcutKey: (key: string) => void;
  focusShortcutKey: string;
  setFocusShortcutKey: (key: string) => void;
  panicWallpaperSwitch: boolean;
  setPanicWallpaperSwitch: (val: boolean) => void;


  // Custom Placement
  rightWidgetsOffset: number;
  setRightWidgetsOffset: (offset: number) => void;

  dismissedBroadcasts: string[];
  dismissBroadcast: (id: string) => void;

  clearOldData: (days: number) => Promise<void>;
  clearAllData: () => Promise<void>;

  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// ---------------------------------------------------------------------------
// Persistent storage: writes to a JSON file on disk via /api/store so that
// data survives PC reboots in Lively Wallpaper (WebView2 wipes localStorage).
// Falls back to localStorage when the API is unavailable (e.g. offline dev).
// ---------------------------------------------------------------------------
const getSyncToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('dashboard_sync_token') || localStorage.getItem('token');
  }
  return null;
};

const getSyncLastModified = () => {
  if (typeof window !== 'undefined') {
    return Number(localStorage.getItem('dashboard_last_modified') || '0');
  }
  return 0;
};

const setSyncLastModified = (timestamp: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dashboard_last_modified', timestamp.toString());
  }
};

let failedToLoadDB = false;
export let hasUnsavedChanges = false;
let saveTimeout: NodeJS.Timeout | null = null;
let pendingValue: string | null = null;
let lastSavedValue: string | null = null;
let isSaving = false;
export let isSyncingFromCloud = false;
export let isAuthTransition = false;
export const setAuthTransition = (val: boolean) => { isAuthTransition = val; };
export let bypassCloudSync = false;
export const setBypassCloudSync = (bypass: boolean = true) => {
  bypassCloudSync = bypass;
};

const performSave = async () => {
  if (!pendingValue || isSyncingFromCloud || isAuthTransition) {
    saveTimeout = null;
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
      saveTimeout = setTimeout(performSave, 500);
    }
    isSaving = false;
    return;
  }

  let success = false;
  try {
    const lastModified = getSyncLastModified();
    let modifiedCollections: string[] = [];
    if (lastSavedValue) {
      const oldState = JSON.parse(lastSavedValue).state || {};
      const newState = JSON.parse(valueToSave).state || {};

      const TASK_KEYS = ['tasks', 'tomorrowTasks', 'tasksDate', 'taskGroupNames', 'countdowns', 'deadlines', 'syntheticDeadlines', 'deadlineAlertDays', 'dismissedDeadlineAlerts', 'plans'];
      const STATS_KEYS = ['history'];
      const DAILY_ROUTINE_KEYS = ['dailyTimes'];
      const NOTES_KEYS = ['notes'];
      const ROADMAPS_KEYS = ['roadmaps'];

      Object.keys(newState).forEach(key => {
        if (JSON.stringify(newState[key]) !== JSON.stringify(oldState[key])) {
          if (TASK_KEYS.includes(key)) modifiedCollections.push('Tasks');
          else if (STATS_KEYS.includes(key)) modifiedCollections.push('Stats');
          else if (DAILY_ROUTINE_KEYS.includes(key)) modifiedCollections.push('DailyRoutine');
          else if (NOTES_KEYS.includes(key)) modifiedCollections.push('Notes');
          else if (ROADMAPS_KEYS.includes(key)) modifiedCollections.push('Roadmaps');
          else if (!key.startsWith('is') && !key.startsWith('show')) modifiedCollections.push('Settings');
        }
      });
      modifiedCollections = [...new Set(modifiedCollections)];

      // If we literally changed nothing persistent, just cancel the save!
      if (modifiedCollections.length === 0) {
        isSaving = false;
        hasUnsavedChanges = false;
        pendingValue = null;
        saveTimeout = null;
        return;
      }
    }

    const res = await fetch('/api/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSyncToken()}`
      },
      body: JSON.stringify({ data: JSON.parse(valueToSave), lastModified, modifiedCollections }),
    });

    if (res.status === 409) {
      // Conflict! Cloud is newer, but we have local changes. SMART MERGE them!
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
      const mergedDailyTimes = { ...localDailyTimes };
      for (const date in cloudDailyTimes) {
        if (mergedDailyTimes[date]) {
          mergedDailyTimes[date] = {
            ...cloudDailyTimes[date],
            ...mergedDailyTimes[date], // Local wins for daily times if conflict
          };
        } else {
          mergedDailyTimes[date] = cloudDailyTimes[date];
        }
      }

      const mergedState = {
        ...parsedLocal.state,
        ...parsedCloud.state, // Cloud wins for scalar settings and complex objects to prevent default overrides

        // Deep merge tracking data to prevent data loss
        history: mergedHistory,
        dailyTimes: mergedDailyTimes,
        timetableGrid: { ...(parsedLocal.state.timetableGrid || {}), ...(parsedCloud.state.timetableGrid || {}) },
        timetableColors: { ...(parsedLocal.state.timetableColors || {}), ...(parsedCloud.state.timetableColors || {}) },

        // Intelligently merge arrays to prevent data loss, prioritizing local changes
        tasks: [...(parsedLocal.state.tasks || []), ...(parsedCloud.state.tasks || [])].filter((t: any, i: number, a: any[]) => a.findIndex(x => x.id === t.id) === i),
        countdowns: [...(parsedLocal.state.countdowns || []), ...(parsedCloud.state.countdowns || [])].filter((t: any, i: number, a: any[]) => a.findIndex(x => x.id === t.id) === i),
        deadlines: [...(parsedLocal.state.deadlines || []), ...(parsedCloud.state.deadlines || [])].filter((t: any, i: number, a: any[]) => a.findIndex(x => x.id === t.id) === i),
        notes: [...(parsedLocal.state.notes || []), ...(parsedCloud.state.notes || [])].filter((t: any, i: number, a: any[]) => a.findIndex(x => x.id === t.id) === i),
        roadmaps: [...(parsedLocal.state.roadmaps || []), ...(parsedCloud.state.roadmaps || [])].filter((t: any, i: number, a: any[]) => a.findIndex(x => x.id === t.id) === i),
      };

      const mergedData = { version: 2, state: mergedState };
      const mergedStr = JSON.stringify(mergedData);

      isSyncingFromCloud = true;
      setSyncLastModified(Date.now());
      try {
        localStorage.setItem('dashboard-storage', mergedStr);
      } catch (e) {
        console.warn("Failed to set mergedStr in localStorage:", e);
      }
      useDashboardStore.setState(mergedState);
      setTimeout(() => { isSyncingFromCloud = false; }, 500);

      // Re-queue the merged data to save to cloud
      pendingValue = mergedStr;
      hasUnsavedChanges = true;
      saveTimeout = setTimeout(performSave, 500);

      isSaving = false;
      return;
    }

    if (!res.ok) {
      throw new Error(`API save failed with status ${res.status}`);
    }

    const json = await res.json();
    setSyncLastModified(json.lastModified);
    success = true;
    lastSavedValue = valueToSave; // Update the last saved reference
  } catch (err) {
    console.warn("Failed to save to DB, storing locally:", err);
    lastSavedValue = valueToSave;
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
      // If we failed to save to the DB, we already saved to localStorage as fallback.
      // We should NOT retry infinitely, otherwise it spams the server.
      if (pendingValue === valueToSave) {
        pendingValue = null;
        hasUnsavedChanges = false;
        saveTimeout = null;
      } else {
        saveTimeout = setTimeout(performSave, 500);
      }
    }
  }
};

if (typeof window !== 'undefined') {
  const triggerAutoSyncOnOnline = () => {
    try {
      const stateObj = useDashboardStore.getState();
      if (stateObj && typeof stateObj === 'object') {
        const str = JSON.stringify({ state: stateObj });
        pendingValue = str;
        hasUnsavedChanges = true;
        failedToLoadDB = false;
        if (!saveTimeout) {
          saveTimeout = setTimeout(performSave, 500);
        }
      }
    } catch (e) {
      console.warn("Auto sync trigger failed:", e);
    }
  };

  window.addEventListener('online', triggerAutoSyncOnOnline);
  window.addEventListener('app_sync_now', triggerAutoSyncOnOnline);
}

const fileStorage = createJSONStorage(() => ({
  getItem: async (_name: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    let retries = 0;
    const token = getSyncToken();
    const isBypassed = bypassCloudSync;
    bypassCloudSync = false; // Always consume bypass flag for current load so future syncs operate normally!

    while (retries < 15 && token) {
      if (isBypassed || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        console.warn("Bypassing cloud sync and loading local data instantly.");
        break;
      }
      try {
        const res = await fetch(`/api/store?t=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store'
        });
        if (res.ok) {
          failedToLoadDB = false;
          const json = await res.json();
          const localDataStr = localStorage.getItem('dashboard-storage');
          const localTimestampStr = localStorage.getItem('dashboard_last_modified');

          // If cloud data is null (new account), we MUST return localData so they don't lose progress!
          // We return "{}" instead of null if localDataStr is empty, to guarantee Zustand parses it cleanly.
          if (json.data === null) {
            lastSavedValue = localDataStr || "{}";
            return lastSavedValue;
          }

          if (json.data) {
            let useLocal = false;
            if (localDataStr && localTimestampStr) {
              const localTime = parseInt(localTimestampStr);
              // If local is newer than cloud (offline changes), we keep local and force sync to cloud!
              if (localTime > json.lastModified) {
                useLocal = true;
                pendingValue = localDataStr;
                hasUnsavedChanges = true;
                saveTimeout = setTimeout(performSave, 500);
                console.log("Local offline data is newer! Pushing to cloud.");
              }
            }

            if (useLocal) {
              lastSavedValue = localDataStr;
              return localDataStr;
            } else {
              setSyncLastModified(json.lastModified);
              
              // SMART MERGE local history into cloud before overwriting
              let hasLocalHigher = false;
              if (localDataStr) {
                try {
                  const parsedLocal = JSON.parse(localDataStr);
                  const localHistory = parsedLocal.state?.history || {};
                  const cloudHistory = json.data.state?.history || {};
                  
                  for (const date in localHistory) {
                    const lVal = localHistory[date] || 0;
                    const cVal = cloudHistory[date] || 0;
                    if (lVal > cVal) {
                      json.data.state.history = json.data.state.history || {};
                      json.data.state.history[date] = lVal;
                      hasLocalHigher = true;
                    }
                  }
                } catch (e) {
                  console.warn("Failed to merge local history during cloud sync", e);
                }
              }

              const str = JSON.stringify(json.data);
              
              isSyncingFromCloud = !hasLocalHigher; // If local had higher, we don't treat it fully as sync from cloud, we want it to trigger save!
              setTimeout(() => { isSyncingFromCloud = false; }, 1000);
              
              // ensure local cache perfectly matches cloud
              try {
                localStorage.setItem('dashboard-storage', str);
              } catch (e) {
                console.warn("Failed to update localStorage with cloud data:", e);
              }
              
              lastSavedValue = str;
              
              // If we salvaged higher offline stats, queue a save to push them to the cloud!
              if (hasLocalHigher) {
                pendingValue = str;
                hasUnsavedChanges = true;
                if (!saveTimeout) {
                   saveTimeout = setTimeout(performSave, 500);
                }
              }
              
              return str;
            }
          }
        } else {
          console.warn(`Database API returned ${res.status}, skipping retries.`);
          break; // Stop retrying on server/auth errors!
        }
      } catch (e) {
        console.warn(`Database API error, retrying... (${retries + 1}/15)`, e);
      }
      retries++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.warn("Failed to fetch store from DB after retries or no token, falling back to localStorage.");
    const localData = localStorage.getItem('dashboard-storage');
    // If we have no local cache and we couldn't fetch from DB, we are hydrating defaults.
    // We MUST set failedToLoadDB to true to permanently disable cloud saves for this session,
    // otherwise these defaults will overwrite the user's cloud database!
    if (!localData) {
      failedToLoadDB = true;
    }
    lastSavedValue = localData;
    return localData;
  },
  setItem: async (_name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined' || isSyncingFromCloud || isAuthTransition) return;
    if (value === lastSavedValue) return; // Prevent overwriting DB with unchanged hydration state

    // Safety check: NEVER save to DB if hydration hasn't finished, to prevent overwriting with initial defaults!
    if (useDashboardStore.getState && !useDashboardStore.getState()._hasHydrated) {
      console.warn("Blocked save attempt before hydration!");
      return;
    }

    // ALWAYS save locally first so offline restarts have immediate latest data!
    try {
      localStorage.setItem('dashboard-storage', value);
    } catch (e) {
      console.warn("Failed to save to localStorage, likely due to massive base64 strings exceeding 5MB quota:", e);
      // We do NOT return here, so that pendingValue is still updated and cloud sync still fires!
    }
    const newTime = Math.max(Date.now(), getSyncLastModified() + 1);
    setSyncLastModified(newTime); // Mark local as newest immediately!

    pendingValue = value;
    hasUnsavedChanges = true;

    if (!isSaving && !saveTimeout) {
      saveTimeout = setTimeout(performSave, 500);
    }
  },
  removeItem: async (_name: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('dashboard-storage');
  },
}));

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      wallpaper: '/wallpapers/naruto.webp',
      bgIndex: 0,
      currentBgType: null,
      lockedWallpaper: null,
      history: {},
      tasks: [],
      tomorrowTasks: [],
      tasksDate: getLocalDateString(),
      taskGroupNames: ['Tab 1', 'Tab 2', 'Tab 3'],
      setTaskGroupName: (index, name) => set((state) => {
        const newNames = [...(state.taskGroupNames || ['Tab 1', 'Tab 2', 'Tab 3'])];
        newNames[index] = name;
        return { taskGroupNames: newNames };
      }),
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
        const BUILT_IN = ["/wallpapers/naruto.webp", "/wallpapers/defaultWallpaper2.jpeg"];
        const nextIndex = (state.bgIndex + 1) % BUILT_IN.length;
        return { lockedWallpaper: null, bgIndex: nextIndex, wallpaper: BUILT_IN[nextIndex] };
      }),
      setCurrentBgType: (type) => set({ currentBgType: type }),
      currentBgSrc: null,
      setCurrentBgSrc: (src) => set({ currentBgSrc: src }),
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

      addMins: (dateKey, mins) => {
        set((state) => {
          const oldTotal = state.history[dateKey] || 0;
          const newTotal = oldTotal + mins;
          
          if (newTotal >= 60 && typeof window !== 'undefined') {
            const token = localStorage.getItem('dashboard_sync_token') || localStorage.getItem('token');
            if (token) {
              fetch('/api/users/streak', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ dateStr: dateKey, minutes: newTotal })
              }).catch(err => console.error("Streak sync error:", err));
            }
          }

          return {
            history: {
              ...state.history,
              [dateKey]: newTotal,
            },
            dailyTimes: {
              ...state.dailyTimes,
              [dateKey]: {
                ...(state.dailyTimes[dateKey] || {}),
                workStartedTime: (state.dailyTimes[dateKey] || {}).workStartedTime || Date.now(),
                bedTime: Date.now()
              }
            }
          };
        });
      },

      setTasks: (tasks, tab = 'today') => set(tab === 'today' ? { tasks } : { tomorrowTasks: tasks }),

      addTask: (title, duration, tab = 'today', groupId = 0) =>
        set((state) => {
          const newTask = {
            id: Date.now().toString(),
            title,
            duration,
            completed: false,
            timeSpent: 0,
            groupId
          };
          if (tab === 'today') {
            return { tasks: [...state.tasks, newTask] };
          }
          return { tomorrowTasks: [...state.tomorrowTasks, newTask] };
        }),

      toggleTask: (id, tab = 'today') =>
        set((state) => {
          if (tab === 'today') {
            return {
              tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, completed: !t.completed } : t
              ),
            };
          }
          return {
            tomorrowTasks: state.tomorrowTasks.map((t) =>
              t.id === id ? { ...t, completed: !t.completed } : t
            ),
          };
        }),

      deleteTask: (id, tab = 'today') =>
        set((state) => {
          const isCurrentlyActive = state.activeTaskId === id;
          if (tab === 'today') {
            return {
              tasks: state.tasks.filter((t) => t.id !== id),
              ...(isCurrentlyActive && { activeTaskId: null, activeTaskTitle: null })
            };
          }
          return {
            tomorrowTasks: state.tomorrowTasks.filter((t) => t.id !== id),
            ...(isCurrentlyActive && { activeTaskId: null, activeTaskTitle: null })
          };
        }),

      moveTaskTab: (id, fromTab) =>
        set((state) => {
          if (fromTab === 'today') {
            const taskToMove = state.tasks.find(t => t.id === id);
            if (!taskToMove) return state;
            return {
              tasks: state.tasks.filter(t => t.id !== id),
              tomorrowTasks: [...state.tomorrowTasks, taskToMove]
            };
          } else {
            const taskToMove = state.tomorrowTasks.find(t => t.id === id);
            if (!taskToMove) return state;
            return {
              tomorrowTasks: state.tomorrowTasks.filter(t => t.id !== id),
              tasks: [...state.tasks, taskToMove]
            };
          }
        }),

      updateTaskTitle: (id, title, tab = 'today') =>
        set((state) => {
          const isCurrentlyActive = state.activeTaskId === id;
          if (tab === 'today') {
            return {
              tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, title } : t
              ),
              ...(isCurrentlyActive && { activeTaskTitle: title }),
            };
          }
          return {
            tomorrowTasks: state.tomorrowTasks.map((t) =>
              t.id === id ? { ...t, title } : t
            ),
            ...(isCurrentlyActive && { activeTaskTitle: title }),
          };
        }),

      toggleHide: () => set((state) => ({ isHidden: !state.isHidden })),

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
      hasUnreadNews: true, // test mode
      toggleNews: () => set((state) => ({ isNewsOpen: !state.isNewsOpen })),
      setHasUnreadNews: (val: boolean) => set(() => ({ hasUnreadNews: val })),
      settingsActiveTab: 'preferences',
      connectInitialTab: undefined,
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen, isAlarmPlaying: false })),
      setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),
      setConnectInitialTab: (tab) => set({ connectInitialTab: tab }),
      timerTrigger: null,
      triggerTimer: (mins, taskId, taskTitle) => set((state) => {
        const currentZ = state.widgetZIndices || {};
        const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50;
        return {
          timerTrigger: { mins, ts: Date.now(), taskId, taskTitle },
          showTimer: true,
          isTimerOpen: true,
          isHidden: false, // Break out of focus mode if they explicitly start a task timer
          hideConfig: { ...state.hideConfig, timer: false },
          mobileHideConfig: { ...state.mobileHideConfig, timer: false },
          widgetZIndices: { ...currentZ, timer: maxZ + 1 }
        };
      }),

      activeTaskId: null,
      activeTaskTitle: null,
      setActiveTask: (id, title) => set({ activeTaskId: id, activeTaskTitle: title }),
      updateTaskDuration: (id, decreaseMins) => set((state) => {
        const isPersonal = state.tasks.some(t => t.id === id) || state.tomorrowTasks.some(t => t.id === id);
        
        if (isPersonal) {
          return {
            tasks: state.tasks.map(t => t.id === id ? {
              ...t,
              duration: Math.max(0, t.duration - decreaseMins),
              timeSpent: (t.timeSpent || 0) + decreaseMins
            } : t),
            tomorrowTasks: state.tomorrowTasks.map(t => t.id === id ? {
              ...t,
              duration: Math.max(0, t.duration - decreaseMins),
              timeSpent: (t.timeSpent || 0) + decreaseMins
            } : t)
          };
        }

        let foundGroup: any = null;
        let foundTask: any = null;
        for (const g of state.userGroups) {
           const t = g.tasks?.find((task: any) => task.id === id);
           if (t) {
             foundGroup = g;
             foundTask = t;
             break;
           }
        }

        if (foundGroup) {
          const username = localStorage.getItem('dashboard_username');
          const myMemberInfo = foundGroup.members?.find((m: any) => m.username === username);
          if (myMemberInfo) {
             const d = new Date();
             const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
             
             let updatedCompletionParams = null;

             const newUserGroups = state.userGroups.map(g => {
                if (g._id === foundGroup._id) {
                   const completions = g.completions || {};
                   const userCompletions = completions[myMemberInfo.userId] || {};
                   const todayCompletions = userCompletions[todayStr] || {};
                   const taskCompletion = todayCompletions[id] || { timeSpent: 0, completed: false };
                   
                   const newTimeSpent = (taskCompletion.timeSpent || 0) + decreaseMins;
                   let newCompleted = taskCompletion.completed;
                   
                   // Auto-complete if time spent equals or exceeds duration
                   if (newTimeSpent >= (foundTask.duration || 0)) {
                       newCompleted = true;
                   }

                   const newCompletions = {
                      ...completions,
                      [myMemberInfo.userId]: {
                         ...userCompletions,
                         [todayStr]: {
                            ...todayCompletions,
                            [id]: {
                               ...taskCompletion,
                               timeSpent: newTimeSpent,
                               completed: newCompleted
                            }
                         }
                      }
                   };
                   
                   updatedCompletionParams = {
                       dateStr: todayStr,
                       taskId: id,
                       completed: newCompleted,
                       timeSpent: newTimeSpent
                   };

                   return {
                      ...g,
                      completions: newCompletions
                   };
                }
                return g;
             });

             const token = localStorage.getItem('dashboard_sync_token');
             if (token && updatedCompletionParams) {
                fetch(`/api/groups/${foundGroup._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ action: 'update_completion', ...((updatedCompletionParams as any) || {}) })
                }).catch(() => {});
             }

             return { userGroups: newUserGroups };
          }
        }

        return state;
      }),
      editTaskDuration: (id, newDuration, tab = 'today') => set((state) => {
        if (tab === 'today') {
          return { tasks: state.tasks.map(t => t.id === id ? { ...t, duration: Math.max(0, newDuration) } : t) };
        }
        return { tomorrowTasks: state.tomorrowTasks.map(t => t.id === id ? { ...t, duration: Math.max(0, newDuration) } : t) };
      }),
      editTaskTimeSpent: (id, newTimeSpent, tab = 'today') => set((state) => {
        const updateTasks = (tasks: Task[]) => tasks.map(t => {
          if (t.id === id) {
            const diff = newTimeSpent - (t.timeSpent || 0);
            return {
              ...t,
              timeSpent: Math.max(0, newTimeSpent),
              duration: Math.max(0, t.duration - diff)
            };
          }
          return t;
        });
        
        if (tab === 'today') {
          return { tasks: updateTasks(state.tasks) };
        }
        return { tomorrowTasks: updateTasks(state.tomorrowTasks) };
      }),
      reorderTasks: (tab, startIndex, endIndex) => set((state) => {
        const list = tab === 'today' ? Array.from(state.tasks) : Array.from(state.tomorrowTasks);
        const [removed] = list.splice(startIndex, 1);
        list.splice(endIndex, 0, removed);
        return tab === 'today' ? { tasks: list } : { tomorrowTasks: list };
      }),
      checkTasksRollover: () => set((state) => {
        const todayStr = getLocalDateString();
        if (!state.tasksDate || state.tasksDate !== todayStr) {
          if (!state.tomorrowTasks || state.tomorrowTasks.length === 0) {
            return { tasksDate: todayStr };
          }
          const newToday = state.tomorrowTasks.map(t => ({
            ...t,
            completed: false,
            timeSpent: 0,
            id: Date.now().toString() + Math.random() // Unique ID
          }));
          return {
            tasksDate: todayStr,
            tasks: [...state.tasks, ...newToday],
            tomorrowTasks: [], // Clear tomorrow's tasks after they are moved to today
          };
        }
        return {};
      }),

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
        return {
          customAlarmSounds: [...currentList, newSound],
          alarmSound: url
        };
      }),
      deleteCustomAlarmSound: (id) => set((state) => {
        const currentList = state.customAlarmSounds || [];
        const soundToDelete = currentList.find(s => s.id === id);
        const updatedList = currentList.filter(s => s.id !== id);
        const activeSound = state.alarmSound === soundToDelete?.url ? '/ringtones/narutoBGM.mp3' : state.alarmSound;
        return {
          customAlarmSounds: updatedList,
          alarmSound: activeSound
        };
      }),
      alarmVolume: 1,
      setTimerEndAt: (time) => set({ timerEndAt: time, timerLastUpdated: Date.now() }),
      setTimerPausedLeft: (time) => set({ timerPausedLeft: time, timerLastUpdated: Date.now() }),
      setTimerInitialMins: (mins) => set({ timerInitialMins: mins, timerLastUpdated: Date.now() }),
      setTimerDeviceId: (id) => set({ timerDeviceId: id, timerLastUpdated: Date.now() }),
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

      // Notes State
      notes: [{ id: 'default', title: 'Daily Journal', entries: {} }],
      setNotes: (notes) => set({ notes }),
      activeNoteId: 'default',
      isNotesOpen: false,
      addNote: () => set((state) => {
        const emptyNote = state.notes.find(n => n.title === 'New Note' && Object.values(n.entries).every(e => !e || e.trim() === '' || e === '<br>'));
        if (emptyNote) {
          return { activeNoteId: emptyNote.id };
        }
        const newNote = { id: Date.now().toString(), title: 'New Note', entries: {} };
        return { notes: [newNote, ...state.notes], activeNoteId: newNote.id };
      }),
      updateNoteTitle: (id, title) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, title } : n)
      })),
      updateNoteEntry: (id, date, content) => set((state) => {
        return {
          notes: state.notes.map(n => {
            if (n.id !== id) return n;
            const newEntries = { ...n.entries };
            const cleanText = content.replace(/<[^>]*>?/gm, '').trim();
            if (!cleanText) {
              delete newEntries[date];
            } else {
              newEntries[date] = content;
            }
            return { ...n, entries: newEntries };
          })
        };
      }),
      deleteNote: (id) => set((state) => {
        const newNotes = state.notes.filter(n => n.id !== id);
        if (newNotes.length === 0) {
          const defaultNote = { id: Date.now().toString(), title: 'Daily Journal', entries: {} };
          return { notes: [defaultNote], activeNoteId: defaultNote.id };
        }
        return {
          notes: newNotes,
          activeNoteId: state.activeNoteId === id ? newNotes[0].id : state.activeNoteId
        };
      }),
      setActiveNote: (id) => set({ activeNoteId: id }),
      toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),
      reorderNotes: (fromIndex, toIndex) => set((state) => {
        if (fromIndex < 0 || fromIndex >= state.notes.length || toIndex < 0 || toIndex >= state.notes.length) return state;
        const newNotes = [...state.notes];
        const [moved] = newNotes.splice(fromIndex, 1);
        newNotes.splice(toIndex, 0, moved);
        return { notes: newNotes };
      }),

      // Stopwatch Defaults
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

      // Plans/Roadmap State
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
      setSyntheticDeadline: (status, date) => set((state) => ({
        syntheticDeadlines: { ...state.syntheticDeadlines, [status]: date }
      })),
      isPlansOpen: false,
      togglePlans: () => set((state) => ({ isPlansOpen: !state.isPlansOpen })),

      // Clock Format & Size & Dashboard Scale
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

      // Countdowns
      countdowns: [
        { id: '1', title: 'Target 1', endDate: null },
      ],
      addCountdown: (title = 'New Target', endDate = null) => {
        let newId = '';
        set((state) => {
          if (state.countdowns.length >= 5) return state;
          newId = Date.now().toString();
          return {
            countdowns: [...state.countdowns, { id: newId, title, endDate }]
          };
        });
        return newId;
      },
      updateCountdown: (id, title, endDate) => set((state) => ({
        countdowns: state.countdowns.map(c => c.id === id ? { ...c, title, endDate } : c)
      })),
      deleteCountdown: (id) => set((state) => ({
        countdowns: state.countdowns.filter(c => c.id !== id)
      })),

      // Deadlines
      deadlines: [],
      addDeadline: (date, text) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        set((state) => ({
          deadlines: [...filterActiveDeadlines(state.deadlines), { id, date, text }]
        }));
        return id;
      },
      updateDeadline: (id, text) => set((state) => ({
        deadlines: state.deadlines.map(d => d.id === id ? { ...d, text } : d)
      })),
      deleteDeadline: (id) => set((state) => ({
        deadlines: state.deadlines.filter(d => d.id !== id)
      })),
      toggleDeadlineDone: (id) => set((state) => ({
        deadlines: state.deadlines.map(d => d.id === id ? { ...d, isDone: !d.isDone } : d)
      })),
      deleteAllDeadlinesForDay: (date) => set((state) => ({
        deadlines: state.deadlines.filter(d => d.date !== date)
      })),
      deleteAllDeadlines: () => set({ deadlines: [] }),
      cleanOldDeadlines: () => set((state) => ({
        deadlines: filterActiveDeadlines(state.deadlines)
      })),

      deadlineAlertDays: 0,
      setDeadlineAlertDays: (days) => set({ deadlineAlertDays: Math.max(0, days) }),
      dismissedDeadlineAlerts: [],
      dismissDeadlineAlert: (id) => set((state) => ({
        dismissedDeadlineAlerts: Array.from(new Set([...(state.dismissedDeadlineAlerts || []), id]))
      })),

      isDeadlinesCollapsed: false,
      setIsDeadlinesCollapsed: (collapsed) => set({ isDeadlinesCollapsed: collapsed }),

      // Timetable
      timetableGrid: {
        "Mon": { "09:00 AM": "DSA", "10:00 AM": "Web Dev", "11:00 AM": "OS", "12:00 PM": "Lunch", "01:00 PM": "Math", "02:00 PM": "Physics", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
        "Tue": { "09:00 AM": "Math", "10:00 AM": "DSA", "11:00 AM": "Web Dev", "12:00 PM": "Lunch", "01:00 PM": "OS", "02:00 PM": "DB", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
        "Wed": { "09:00 AM": "OS", "10:00 AM": "Math", "11:00 AM": "DSA", "12:00 PM": "Lunch", "01:00 PM": "Web Dev", "02:00 PM": "Physics", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
        "Thu": { "09:00 AM": "DB", "10:00 AM": "OS", "11:00 AM": "Math", "12:00 PM": "Lunch", "01:00 PM": "DSA", "02:00 PM": "Web Dev", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
        "Fri": { "09:00 AM": "Web Dev", "10:00 AM": "DB", "11:00 AM": "OS", "12:00 PM": "Lunch", "01:00 PM": "Math", "02:00 PM": "DSA", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
        "Sat": { "09:00 AM": "Free", "10:00 AM": "Free", "11:00 AM": "Free", "12:00 PM": "Free", "01:00 PM": "Free", "02:00 PM": "Free", "03:00 PM": "Free", "04:00 PM": "Free", "05:00 PM": "Free" },
        "Sun": { "09:00 AM": "Free", "10:00 AM": "Free", "11:00 AM": "Free", "12:00 PM": "Free", "01:00 PM": "Free", "02:00 PM": "Free", "03:00 PM": "Free", "04:00 PM": "Free", "05:00 PM": "Free" },
      },
      timetableColors: {},
      updateTimetableCell: (day, time, subject) => set((state) => ({
        timetableGrid: {
          ...state.timetableGrid,
          [day]: {
            ...state.timetableGrid[day],
            [time]: subject
          }
        }
      })),
      updateTimetableColor: (day, time, color) => set((state) => ({
        timetableColors: {
          ...state.timetableColors,
          [day]: {
            ...(state.timetableColors[day] || {}),
            [time]: color
          }
        }
      })),
      weekdayTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
      weekendTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
      timetableStartTime: 540, // Default 9:00 AM
      timetableWeekendStartTime: 540, // Default 9:00 AM
      setTimetableStartTime: (mins) => set({ timetableStartTime: mins }),
      setTimetableWeekendStartTime: (mins) => set({ timetableWeekendStartTime: mins }),
      updateTimetableTime: (isWeekend, index, newTime, keyMap) => set((state) => {
        const targetArray = isWeekend ? state.weekendTimes : state.weekdayTimes;
        const fallbackArray = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
        const timesList = targetArray || fallbackArray;
        const newTimes = [...timesList];
        const oldTime = newTimes[index];
        newTimes[index] = newTime;

        // Also update the timetableGrid and timetableColors keys to preserve data
        const newGrid = { ...state.timetableGrid };
        const newColors = { ...(state.timetableColors || {}) };
        const targetDays = isWeekend ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];

        if (keyMap) {
          targetDays.forEach(day => {
            if (newGrid[day]) {
              const currentDayData = { ...newGrid[day] };
              let updatedDayData: Record<string, string> = {};
              Object.entries(currentDayData).forEach(([oldKey, value]) => {
                const newKey = keyMap[oldKey] || oldKey;
                updatedDayData[newKey] = value;
              });
              newGrid[day] = updatedDayData;
            }
            if (newColors[day]) {
              const currentDayColors = { ...newColors[day] };
              let updatedDayColors: Record<string, string> = {};
              Object.entries(currentDayColors).forEach(([oldKey, value]) => {
                const newKey = keyMap[oldKey] || oldKey;
                updatedDayColors[newKey] = value;
              });
              newColors[day] = updatedDayColors;
            }
          });
        } else {
          targetDays.forEach(day => {
            if (newGrid[day] && newGrid[day][oldTime] !== undefined) {
              newGrid[day] = { ...newGrid[day] };
              newGrid[day][newTime] = newGrid[day][oldTime];
              delete newGrid[day][oldTime];
            }
            if (newColors[day] && newColors[day][oldTime] !== undefined) {
              newColors[day] = { ...newColors[day] };
              newColors[day][newTime] = newColors[day][oldTime];
              delete newColors[day][oldTime];
            }
          });
        }

        return isWeekend
          ? { weekendTimes: newTimes, timetableGrid: newGrid, timetableColors: newColors }
          : { weekdayTimes: newTimes, timetableGrid: newGrid, timetableColors: newColors };
      }),
      renameTimetableKeys: (isWeekend, keyMap) => set((state) => {
        const newGrid = { ...state.timetableGrid };
        const newColors = { ...(state.timetableColors || {}) };
        const targetDays = isWeekend ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];

        targetDays.forEach(day => {
          if (newGrid[day]) {
            const currentDayData = { ...newGrid[day] };
            let updatedDayData: Record<string, string> = {};

            Object.entries(currentDayData).forEach(([oldKey, value]) => {
              const newKey = keyMap[oldKey] || oldKey;
              updatedDayData[newKey] = value;
            });
            newGrid[day] = updatedDayData;
          }
          if (newColors[day]) {
            const currentDayColors = { ...newColors[day] };
            let updatedDayColors: Record<string, string> = {};

            Object.entries(currentDayColors).forEach(([oldKey, value]) => {
              const newKey = keyMap[oldKey] || oldKey;
              updatedDayColors[newKey] = value;
            });
            newColors[day] = updatedDayColors;
          }
        });

        return { timetableGrid: newGrid, timetableColors: newColors };
      }),
      resetTimetable: () => set(() => ({
        timetableGrid: {
          "Mon": { "09:00 AM": "DSA", "10:00 AM": "Web Dev", "11:00 AM": "OS", "12:00 PM": "Lunch", "01:00 PM": "Math", "02:00 PM": "Physics", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
          "Tue": { "09:00 AM": "Math", "10:00 AM": "DSA", "11:00 AM": "Web Dev", "12:00 PM": "Lunch", "01:00 PM": "OS", "02:00 PM": "DB", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
          "Wed": { "09:00 AM": "OS", "10:00 AM": "Math", "11:00 AM": "DSA", "12:00 PM": "Lunch", "01:00 PM": "Web Dev", "02:00 PM": "Physics", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
          "Thu": { "09:00 AM": "DB", "10:00 AM": "OS", "11:00 AM": "Math", "12:00 PM": "Lunch", "01:00 PM": "DSA", "02:00 PM": "Web Dev", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
          "Fri": { "09:00 AM": "Web Dev", "10:00 AM": "DB", "11:00 AM": "OS", "12:00 PM": "Lunch", "01:00 PM": "Math", "02:00 PM": "DSA", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
          "Sat": { "09:00 AM": "Free", "10:00 AM": "Free", "11:00 AM": "Free", "12:00 PM": "Free", "01:00 PM": "Free", "02:00 PM": "Free", "03:00 PM": "Free", "04:00 PM": "Free", "05:00 PM": "Free" },
          "Sun": { "09:00 AM": "Free", "10:00 AM": "Free", "11:00 AM": "Free", "12:00 PM": "Free", "01:00 PM": "Free", "02:00 PM": "Free", "03:00 PM": "Free", "04:00 PM": "Free", "05:00 PM": "Free" },
        },
        timetableColors: {},
        weekdayTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
        weekendTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
      })),
      addTimetableRow: (isWeekend, prepend = false) => set((state) => {
        const targetArray = isWeekend ? state.weekendTimes : state.weekdayTimes;
        const timesList = targetArray || [];
        const newTimes = prepend ? ["60", ...timesList] : [...timesList, "60"];
        return isWeekend ? { weekendTimes: newTimes } : { weekdayTimes: newTimes };
      }),
      deleteTimetableRow: (isWeekend, index) => set((state) => {
        const targetArray = isWeekend ? state.weekendTimes : state.weekdayTimes;
        const timesList = targetArray || [];
        const newTimes = timesList.filter((_, i) => i !== index);
        // Do not aggressively delete keys from timetableGrid here.
        // It relies on legacy string times and can accidentally delete shifted rows.
        // Orphaned keys are harmless and prevent data loss.
        return isWeekend ? { weekendTimes: newTimes } : { weekdayTimes: newTimes };
      }),
      useTimetableRange: true,
      toggleTimetableRange: () => set((state) => ({ useTimetableRange: !state.useTimetableRange })),
      isTimetableOpen: false,
      setIsTimetableOpen: (isOpen) => set((state) => {
        let extra = {};
        if (isOpen) {
          const currentZ = state.widgetZIndices || {};
          const maxZ = Object.values(currentZ).length > 0 ? Math.max(...Object.values(currentZ)) : 50;
          extra = { widgetZIndices: { ...currentZ, timetable: maxZ + 1 } };
        }
        return { isTimetableOpen: isOpen, ...extra };
      }),



      viewingFriend: null,
      setViewingFriend: (friend) => set({ viewingFriend: friend }),

      // Daily Times
      dailyTimes: {},
      isDayStartModalOpen: false,
      toggleDayStartModal: () => set((state) => ({ isDayStartModalOpen: !state.isDayStartModalOpen })),
      updateDailyTime: (dateKey, field, timestamp) => {
        set((state) => {
          const newData = { ...state.dailyTimes };
          if (!newData[dateKey]) {
            newData[dateKey] = {};
          }
          newData[dateKey] = {
            ...newData[dateKey],
            [field]: timestamp
          };
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
        return {
          widgetOffsets: {
            ...state.widgetOffsets,
            [bgSrc]: newBgOffsets
          }
        };
      }),

      lockedWidgets: ['quote', 'countdowns', 'timer', 'toolbar'],
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
        if (currentZIndices[widgetId] === maxZ && maxZ > 50) {
          return state;
        }
        return {
          widgetZIndices: {
            ...currentZIndices,
            [widgetId]: maxZ + 1
          }
        };
      }),
      resetAllOffsets: (bgSrc) => set((state) => {
        const newClockOffsets = { ...state.clockOffsets };
        delete newClockOffsets[bgSrc];

        const newWidgetOffsets = { ...state.widgetOffsets };
        delete newWidgetOffsets[bgSrc];

        return {
          clockOffsets: newClockOffsets,
          widgetOffsets: newWidgetOffsets
        };
      }),

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
      toggleVisibility: (key) => set((state) => ({ [key]: !state[key] })),

      hideConfig: {
        quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true
      },
      setHideConfig: (key, value) => {
        set((state) => ({ hideConfig: { ...state.hideConfig, [key]: value } }));
      },
      setHideAll: (hide) => {
        if (hide) {
          set({
            hideConfig: {
              quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true
            }
          });
        } else {
          set({ hideConfig: {} });
        }
      },

      mobileHideConfig: {
        quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true
      },
      setMobileHideConfig: (key, value) => {
        set((state) => ({ mobileHideConfig: { ...state.mobileHideConfig, [key]: value } }));
      },
      setMobileHideAll: (hide) => {
        if (hide) {
          set({
            mobileHideConfig: {
              quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true
            }
          });
        } else {
          set({ mobileHideConfig: {} });
        }
      },

      isPanicHidden: false,
      togglePanicHide: () => set((state) => ({ isPanicHidden: !state.isPanicHidden })),
      panicShortcutKey: 'ctrl+z',
      setPanicShortcutKey: (key) => set({ panicShortcutKey: key.toLowerCase() }),
      focusShortcutKey: 'ctrl+h',
      setFocusShortcutKey: (key) => set({ focusShortcutKey: key.toLowerCase() }),
      panicWallpaperSwitch: false,
      setPanicWallpaperSwitch: (val) => set({ panicWallpaperSwitch: val }),

      rightWidgetsOffset: 48, // Default corresponds to bottom-12 (48px)
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
          const token = getSyncToken();
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          await fetch(`/api/health?action=olderThan&days=${days}`, { method: 'DELETE', headers });

          set((state) => {
            const newHistory = { ...state.history };
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

            Object.keys(newHistory).forEach((key) => {
              if (key < cutoffDateStr) {
                delete newHistory[key];
              }
            });

            // Also clear dailyTimes locally
            const newDailyTimes = { ...state.dailyTimes };
            Object.keys(newDailyTimes).forEach((key) => {
              if (key < cutoffDateStr) {
                delete newDailyTimes[key];
              }
            });

            return { history: newHistory, dailyTimes: newDailyTimes };
          });
        } catch (err) {
          console.error("Failed to clear old data", err);
        }
      },

      clearAllData: async () => {
        try {
          const token = getSyncToken();
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          await fetch(`/api/health?action=deleteAll`, { method: 'DELETE', headers });
          await fetch('/api/store', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ clearAll: true })
          });
          localStorage.removeItem('dashboard-storage');
          window.location.reload();
        } catch (err) {
          console.error("Failed to clear all data", err);
        }
      },
    }),
    {
      name: 'dashboard-storage',
      storage: fileStorage,
      version: 2, // Store schema version
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Schema Migration V2: Fix legacy tasks to prevent .toUpperCase() crashes
          if (persistedState.tasks && Array.isArray(persistedState.tasks)) {
            persistedState.tasks = persistedState.tasks.map((task: any) => ({
              ...task,
              priority: task.priority || 'medium', // Ensure priority always exists
              tags: task.tags || [],               // Ensure tags always exist
              subtasks: task.subtasks || [],       // Ensure subtasks always exist
            }));
          }
          // Ensure hideConfig is a safe object
          if (!persistedState.hideConfig) {
            persistedState.hideConfig = {};
          }
        }
        return persistedState;
      },
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => ![
          'isQuotePopupOpen', 'isTaskManagerOpen', 'isStatsOpen', 'timerTrigger',
          'isNotesOpen', 'isPlansOpen', 'isTimetableOpen', 'isDayStartModalOpen',
          'isVideoMuted', 'isVideoPlaying', 'isSettingsOpen', 'isStopwatchOpen', '_hasHydrated',
          'widgetZIndices', 'isAlarmPlaying'
        ].includes(key))
      ),
      merge: (persistedState: any, currentState: DashboardState) => {
        if (!persistedState) return currentState;
        // Clean up expired or inactive timers from past sessions to prevent ghost minutes
        if (persistedState.timerEndAt && persistedState.timerEndAt < Date.now()) {
          persistedState.timerEndAt = null;
          persistedState.timerPausedLeft = null;
          persistedState.timerInitialMins = null;
          persistedState.timerLastSavedChunks = 0;
          persistedState.timerLastAlertedChunks = 0;
          persistedState.activeTaskId = null;
          persistedState.activeTaskTitle = null;
        } else if (!persistedState.timerEndAt && persistedState.timerPausedLeft === null) {
          persistedState.timerInitialMins = null;
          persistedState.timerLastSavedChunks = 0;
          persistedState.timerLastAlertedChunks = 0;
          persistedState.activeTaskId = null;
          persistedState.activeTaskTitle = null;
        }

        // Prevent alarm from persisting and triggering continuously on reload/focus
        persistedState.isAlarmPlaying = false;

        // Conflict resolution: The most recently updated timer state always wins.
        // This prevents a polling tab from reviving a stopped timer from its own stale state.
        const currentUpdated = currentState.timerLastUpdated || 0;
        const persistedUpdated = persistedState.timerLastUpdated || 0;

        if (currentUpdated > persistedUpdated) {
          persistedState.timerEndAt = currentState.timerEndAt;
          persistedState.timerPausedLeft = currentState.timerPausedLeft;
          persistedState.timerInitialMins = currentState.timerInitialMins;
          persistedState.timerDeviceId = currentState.timerDeviceId;
          persistedState.activeTaskId = currentState.activeTaskId;
          persistedState.activeTaskTitle = currentState.activeTaskTitle;
          persistedState.timerLastSavedChunks = currentState.timerLastSavedChunks;
          persistedState.timerLastAlertedChunks = currentState.timerLastAlertedChunks;
          persistedState.timerLastUpdated = currentState.timerLastUpdated;
        }

        // Deep merge nested configurations to prevent schema drift from old backups
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

        if (!persistedState.customAlarmSounds) {
          persistedState.customAlarmSounds = [];
        }

        // Auto-cleanup deadlines that are more than 7 days in the past
        if (persistedState.deadlines && Array.isArray(persistedState.deadlines)) {
          persistedState.deadlines = filterActiveDeadlines(persistedState.deadlines);
        }

        if (!persistedState.tomorrowTasks) {
          persistedState.tomorrowTasks = [];
        }
        if (!persistedState.tasksDate) {
          persistedState.tasksDate = getLocalDateString();
        }

        // Create a safe merged state that defaults to current state
        const safeState = { ...currentState, ...persistedState };
        safeState.dashboardScale = typeof persistedState.dashboardScale === 'number' ? persistedState.dashboardScale : 1;
        safeState.mobileDashboardScale = typeof persistedState.mobileDashboardScale === 'number' ? persistedState.mobileDashboardScale : 1;
        safeState.dockScale = typeof persistedState.dockScale === 'number' ? persistedState.dockScale : 1;
        safeState.dockOffset = typeof persistedState.dockOffset === 'number' ? persistedState.dockOffset : 0;

        // Defensive fallbacks: Ensure critical arrays and objects are NEVER overwritten with undefined or null
        // due to schema mismatches, and always retain their expected types.
        safeState.tasks = Array.isArray(persistedState.tasks) ? persistedState.tasks : currentState.tasks;
        safeState.tomorrowTasks = Array.isArray(persistedState.tomorrowTasks) ? persistedState.tomorrowTasks : currentState.tomorrowTasks;
        safeState.notes = Array.isArray(persistedState.notes) ? persistedState.notes : currentState.notes;
        safeState.roadmaps = Array.isArray(persistedState.roadmaps) ? persistedState.roadmaps : currentState.roadmaps;
        safeState.deadlines = filterActiveDeadlines(persistedState.deadlines || []);

        // Deep merge records/objects to ensure we don't drop newly added default keys
        if (persistedState.history && typeof persistedState.history === 'object') {
          safeState.history = { ...currentState.history, ...persistedState.history };
        }
        if (persistedState.timetableGrid && typeof persistedState.timetableGrid === 'object') {
          safeState.timetableGrid = persistedState.timetableGrid; // Do not merge with defaults, or deleted entries will come back
        }
        if (persistedState.timetableColors && typeof persistedState.timetableColors === 'object') {
          safeState.timetableColors = persistedState.timetableColors;
        }
        if (persistedState.dailyTimes && typeof persistedState.dailyTimes === 'object') {
          safeState.dailyTimes = { ...currentState.dailyTimes, ...persistedState.dailyTimes };
        }
        if (persistedState.clockOffsets && typeof persistedState.clockOffsets === 'object') {
          safeState.clockOffsets = { ...currentState.clockOffsets, ...persistedState.clockOffsets };
        }
        if (persistedState.widgetOffsets && typeof persistedState.widgetOffsets === 'object') {
          safeState.widgetOffsets = { ...currentState.widgetOffsets, ...persistedState.widgetOffsets };
        }

        return safeState;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Hydration failed!", error);
        }
        if (state && typeof state.cleanOldDeadlines === 'function') {
          state.cleanOldDeadlines();
        }
        // Guarantee hydration completion so UI never gets stuck
        if (state && typeof state.setHasHydrated === 'function') {
          state.setHasHydrated(true);
        } else {
          useDashboardStore.getState().setHasHydrated(true);
        }
      },
    }
  )
);
