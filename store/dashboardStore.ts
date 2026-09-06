import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getLocalDateString } from '@/utils/date';
import { useTaskStore } from '@/store/taskStore';
import { useTimetableStore } from '@/store/timetableStore';
export interface CustomAlarmSound {
  id: string;
  name: string;
  url: string;
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

interface DashboardState {
  history: Record<string, number>;
  addMins: (dateKey: string, mins: number) => void;
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
  clearAllTasksAndPlans: () => void;
  resetTimetable: () => void;
  customMobileWallpapers: string[];
  setCustomMobileWallpapers: (urls: string[]) => void;
  activeMobileCustomIndex: number | null;
  setActiveMobileCustomIndex: (index: number | null) => void;

  showManifestationBoard: boolean;
  setShowManifestationBoard: (show: boolean) => void;
  isManifestationOpen: boolean;
  setIsManifestationOpen: (open: boolean) => void;
  toggleManifestationOpen: () => void;

  manifestationDesktopPhotos: string[];
  setManifestationDesktopPhotos: (urls: string[]) => void;
  activeManifestationDesktopIndex: number | null;
  setActiveManifestationDesktopIndex: (index: number | null) => void;

  manifestationMobilePhotos: string[];
  setManifestationMobilePhotos: (urls: string[]) => void;
  activeManifestationMobileIndex: number | null;
  setActiveManifestationMobileIndex: (index: number | null) => void;
  isHidden: boolean;
  lockedWallpaper: string | null;
  setLockedWallpaper: (filename: string | null) => void;
  setWallpaper: (url: string) => void;
  toggleHide: () => void;
  timetableGrid: Record<string, any>;
  timetableColors: Record<string, any>;
  weekdayTimes: string[];
  weekendTimes: string[];
  timetableStartTime: number;
  timetableWeekendStartTime: number;
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
  settingsActiveTab: 'preferences' | 'data' | 'about' | 'focus' | 'sound' | 'credits' | 'connect' | 'update' | 'wallpaper' | 'quotes' | 'manifestation';
  toggleSettings: () => void;
  setSettingsActiveTab: (tab: 'preferences' | 'data' | 'about' | 'focus' | 'sound' | 'credits' | 'connect' | 'update' | 'wallpaper' | 'quotes' | 'manifestation') => void;
  connectInitialTab?: 'profile' | 'friends' | 'leaderboard' | 'groups';
  setConnectInitialTab: (tab?: 'profile' | 'friends' | 'leaderboard' | 'groups') => void;

  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
  isTourOpen: boolean;
  setIsTourOpen: (open: boolean) => void;
  startTour: () => void;

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
  /** Atomically clear ALL timer state and immediately push to cloud so other devices don't see a ghost timer. */
  clearTimerState: () => void;
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
  manifestationCustomQuotes: string[];
  setManifestationCustomQuotes: (quotes: string[]) => void;
  addManifestationCustomQuote: (quote: string) => void;
  deleteManifestationCustomQuote: (index: number) => void;


  // Notes State
  isNotesOpen: boolean;
  toggleNotes: () => void;

  //timetable
  isTimetableOpen: boolean;
  setIsTimetableOpen: (isOpen: boolean) => void;
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
  autoOpenCountdowns: boolean;
  setAutoOpenCountdowns: (enabled: boolean) => void;

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

  forceInstantSave: () => void;
  pushManifestationToDB: () => void;
  pushWallpapersToDB: () => void;

  isPanicHidden: boolean;
  togglePanicHide: () => void;
  panicShortcutKey: string;
  setPanicShortcutKey: (key: string) => void;
  focusShortcutKey: string;
  setFocusShortcutKey: (key: string) => void;
  panicWallpaperSwitch: boolean;
  setPanicWallpaperSwitch: (val: boolean) => void;
  peekModeWallpaper: string | null;
  setPeekModeWallpaper: (url: string | null) => void;


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
let notesSaveTimeout: NodeJS.Timeout | null = null;
let pendingValue: string | null = null;
let lastSavedValue: string | null = null;
let isSaving = false;
export let isSyncingFromCloud = false;
export const setSyncingFromCloud = (val: boolean) => { isSyncingFromCloud = val; };
export let isAuthTransition = false;
export const setAuthTransition = (val: boolean) => { isAuthTransition = val; };
export let bypassCloudSync = false;
export const setBypassCloudSync = (bypass: boolean = true) => {
  bypassCloudSync = bypass;
};
export let abortInstantLoad = false;
export const setAbortInstantLoad = (val: boolean) => { abortInstantLoad = val; };

const mergeDailyTimes = (localDailyTimes: Record<string, any> = {}, cloudDailyTimes: Record<string, any> = {}) => {
  const merged: Record<string, any> = { ...cloudDailyTimes };
  for (const date in localDailyTimes) {
    if (!merged[date]) {
      merged[date] = localDailyTimes[date];
    } else {
      merged[date] = {
        ...cloudDailyTimes[date],
        ...localDailyTimes[date],
      };
      // Non-destructive preservation of logged timestamps: wake up, work start, sleep/bed time
      ['wakeupTime', 'workStartedTime', 'sleepTime', 'bedTime'].forEach((field) => {
        const localVal = localDailyTimes[date]?.[field];
        const cloudVal = cloudDailyTimes[date]?.[field];
        if (localVal && !cloudVal) {
          merged[date][field] = localVal;
        } else if (cloudVal && !localVal) {
          merged[date][field] = cloudVal;
        } else if (localVal && cloudVal) {
          merged[date][field] = localVal;
        }
      });
    }
  }
  return merged;
};

const mergeArraysById = (localArr: any[] = [], cloudArr: any[] = []) => {
  if (!Array.isArray(localArr)) localArr = [];
  if (!Array.isArray(cloudArr)) cloudArr = [];
  if (localArr.length === 0 && cloudArr.length > 0) return cloudArr;
  if (cloudArr.length === 0 && localArr.length > 0) return localArr;
  const map = new Map();
  cloudArr.forEach((item) => {
    if (item && item.id !== undefined) map.set(item.id, item);
  });
  localArr.forEach((item) => {
    if (item && item.id !== undefined) {
      const existing = map.get(item.id);
      if (existing) {
        map.set(item.id, { ...existing, ...item });
      } else {
        map.set(item.id, item);
      }
    }
  });
  return Array.from(map.values());
};

const deduplicateTasks = (tasks: any[]) => {
  if (!Array.isArray(tasks)) return [];
  const map = new Map();
  tasks.forEach(t => {
    if (t && t.id) map.set(t.id, t);
  });
  return Array.from(map.values());
};

const mergeStringArrays = (localArr: any, cloudArr: any, baseArr: any = null, cloudIsNewer: boolean = false) => {
  if (!Array.isArray(localArr)) localArr = [];
  if (!Array.isArray(cloudArr)) cloudArr = [];

  // Remove base64 data, but KEEP 'custom-' references so the device can recover them
  const sanitizedCloudArr = cloudArr.filter((item: any) => typeof item === 'string' && !item.startsWith('data:'));
  const localOnlyItems = localArr.filter((item: any) => typeof item === 'string' && item.startsWith('custom-'));

  if (cloudIsNewer) {
    return Array.from(new Set([...sanitizedCloudArr, ...localOnlyItems]));
  }

  if (cloudArr.length === 0) return localArr;
  if (localArr.length === 0) return cloudArr;

  const localSet = new Set(localArr);
  const result = [...localArr];
  for (const item of sanitizedCloudArr) {
    if (!localSet.has(item)) {
      result.push(item);
    }
  }
  return result;
};


const performSave = async () => {
  if (!pendingValue || isSyncingFromCloud || isAuthTransition) {
    saveTimeout = null;
    return;
  }

  // 🛡️ STRICT OFFLINE GUARD: Stop the save engine completely if offline
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
      const DEADLINE_KEYS = ['deadlines', 'syntheticDeadlines', 'deadlineAlertDays', 'dismissedDeadlineAlerts'];
      const COUNTDOWN_KEYS = ['countdowns'];

      const TRANSIENT_KEYS = [
        'isSaving', 'hasUnsavedChanges', '_hasHydrated', 'isTaskManagerOpen', 'isCalendarOpen',
        'isTimetableOpen', 'isPlansOpen', 'isNotesOpen', 'isSettingsOpen', 'isNewsOpen',
        'isStatsOpen', 'isMobileCountdownsVisible', 'isCalendarBusy', 'expandedLeaderboardUserId',
        'pendingValue', 'saveTimeout', 'activeNoteId', 'activeCountdownIndex',
        ...DEADLINE_KEYS,  // Deadlines sync is handled entirely by its own real-time endpoint
        ...COUNTDOWN_KEYS  // Countdowns sync is handled entirely by its own real-time endpoint
      ];

      Object.keys(newState).forEach(key => {
        if (JSON.stringify(newState[key]) !== JSON.stringify(oldState[key])) {
          modifiedKeys.push(key);
          if (TASK_KEYS.includes(key)) modifiedCollections.push('Tasks');
          else if (TASK_KEYS.includes(key)) modifiedCollections.push('Stats');
          else if (DAILY_ROUTINE_KEYS.includes(key)) modifiedCollections.push('DailyRoutine');
          else if (NOTES_KEYS.includes(key)) modifiedCollections.push('Notes');
          else if (ROADMAPS_KEYS.includes(key)) modifiedCollections.push('Roadmaps');
          else if (TIMETABLE_KEYS.includes(key)) modifiedCollections.push('Settings');
          else if (!TRANSIENT_KEYS.includes(key)) modifiedCollections.push('Settings');
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

    let parsedData = null;
    try {
      parsedData = JSON.parse(valueToSave);
    } catch (parseErr) {
      console.error("Failed to parse valueToSave:", parseErr, "Value was:", valueToSave?.substring(0, 200));
      isSaving = false;
      return;
    }

    // Sanitize: strip any local IndexedDB files (custom-) or data-URLs from media arrays before sending to the cloud.
    // Local file uploads live ONLY in IndexedDB — they must never reach MongoDB.
    const LOCAL_ONLY_MEDIA_KEYS = [
      'customDesktopWallpapers', 'customMobileWallpapers',
      'manifestationDesktopPhotos', 'manifestationMobilePhotos',
    ];
    if (parsedData?.state) {
      LOCAL_ONLY_MEDIA_KEYS.forEach(key => {
        if (Array.isArray(parsedData.state[key])) {
          parsedData.state[key] = parsedData.state[key].filter(
            (v: string) => typeof v === 'string' && !v.startsWith('data:')
          ); // FIX: Removed the custom- restriction
        }
      });
      // Also sanitize scalar media fields
      if (typeof parsedData.state.peekModeWallpaper === 'string' && parsedData.state.peekModeWallpaper.startsWith('data:')) {
        delete parsedData.state.peekModeWallpaper;
      }
    }

    const payload = JSON.stringify({ data: parsedData, lastModified, modifiedCollections, modifiedKeys });
    console.log(`[performSave] Payload size: ${(payload.length / 1024).toFixed(2)} KB`);


    const res = await fetch('/api/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSyncToken()}`
      },
      body: payload,
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
      const mergedDailyTimes = mergeDailyTimes(localDailyTimes, cloudDailyTimes);

      const localHasSeen = parsedLocal.state?.hasSeenOnboarding || (typeof window !== 'undefined' && localStorage.getItem('grindboard_has_seen_onboarding') === 'true');
      const cloudHasSeen = parsedCloud.state?.hasSeenOnboarding;
      const mergedHasSeenOnboarding = Boolean(localHasSeen || cloudHasSeen);

      const mergedState = {
        ...parsedCloud.state, // Cloud goes first
        ...parsedLocal.state, // Local goes SECOND so your fresh edits win!

        // Deep merge tracking data to prevent data loss
        history: mergedHistory,
        dailyTimes: mergedDailyTimes,
        hasSeenOnboarding: mergedHasSeenOnboarding,
        // Timetable is completely decoupled and always takes the cloud truth (like Group Tasks)
        timetableGrid: parsedCloud.state.timetableGrid || parsedLocal.state.timetableGrid,
        timetableColors: parsedCloud.state.timetableColors || parsedLocal.state.timetableColors,
        weekdayTimes: parsedCloud.state.weekdayTimes || parsedLocal.state.weekdayTimes,
        weekendTimes: parsedCloud.state.weekendTimes || parsedLocal.state.weekendTimes,

        // Deadlines are completely decoupled and always take the cloud truth
        deadlines: parsedCloud.state.deadlines || parsedLocal.state.deadlines,
        syntheticDeadlines: parsedCloud.state.syntheticDeadlines || parsedLocal.state.syntheticDeadlines,
        deadlineAlertDays: parsedCloud.state.deadlineAlertDays || parsedLocal.state.deadlineAlertDays,
        dismissedDeadlineAlerts: parsedCloud.state.dismissedDeadlineAlerts || parsedLocal.state.dismissedDeadlineAlerts,

        // Strict overwrite based on cloud truth to prevent ghost resurrections
        roadmaps: mergeArraysById(parsedLocal.state.roadmaps, parsedCloud.state.roadmaps),
        plans: mergeArraysById(parsedLocal.state.plans, parsedCloud.state.plans),
        customAlarmSounds: mergeArraysById(parsedLocal.state.customAlarmSounds, parsedCloud.state.customAlarmSounds),

        // Timer state is strictly LOCAL. Cloud should never overwrite the current device's timer during a conflict.
        timerEndAt: parsedLocal.state.timerEndAt ?? null,
        timerPausedLeft: parsedLocal.state.timerPausedLeft ?? null,
        timerInitialMins: parsedLocal.state.timerInitialMins ?? null,
        timerDeviceId: parsedLocal.state.timerDeviceId ?? null,
        timerLastUpdated: parsedLocal.state.timerLastUpdated || 0,
        timerLastSavedChunks: parsedLocal.state.timerLastSavedChunks || 0,
        timerLastAlertedChunks: parsedLocal.state.timerLastAlertedChunks || 0,
        activeTaskId: parsedLocal.state.activeTaskId ?? null,
        activeTaskTitle: parsedLocal.state.activeTaskTitle ?? null,

        manifestationDesktopPhotos: mergeStringArrays(parsedLocal.state.manifestationDesktopPhotos, parsedCloud.state.manifestationDesktopPhotos, parsedCloud.state.manifestationDesktopPhotos), // In 409, base is cloud so local overrides if different
        manifestationMobilePhotos: mergeStringArrays(parsedLocal.state.manifestationMobilePhotos, parsedCloud.state.manifestationMobilePhotos, parsedCloud.state.manifestationMobilePhotos),
        customDesktopWallpapers: mergeStringArrays(parsedLocal.state.customDesktopWallpapers, parsedCloud.state.customDesktopWallpapers, parsedCloud.state.customDesktopWallpapers),
        customMobileWallpapers: mergeStringArrays(parsedLocal.state.customMobileWallpapers, parsedCloud.state.customMobileWallpapers, parsedCloud.state.customMobileWallpapers),
        customQuotes: mergeStringArrays(parsedLocal.state.customQuotes, parsedCloud.state.customQuotes, parsedCloud.state.customQuotes),
        manifestationCustomQuotes: mergeStringArrays(parsedLocal.state.manifestationCustomQuotes, parsedCloud.state.manifestationCustomQuotes, parsedCloud.state.manifestationCustomQuotes),

        // Active wallpaper/manifestation index: LOCAL always wins — it's a per-device UI selection.
        // Cloud only fills in when local is null (fresh device).
        activeDesktopCustomIndex: (parsedLocal.state.activeDesktopCustomIndex !== undefined && parsedLocal.state.activeDesktopCustomIndex !== null)
          ? parsedLocal.state.activeDesktopCustomIndex : parsedCloud.state.activeDesktopCustomIndex,
        activeMobileCustomIndex: (parsedLocal.state.activeMobileCustomIndex !== undefined && parsedLocal.state.activeMobileCustomIndex !== null)
          ? parsedLocal.state.activeMobileCustomIndex : parsedCloud.state.activeMobileCustomIndex,
        activeManifestationDesktopIndex: (parsedLocal.state.activeManifestationDesktopIndex !== undefined && parsedLocal.state.activeManifestationDesktopIndex !== null)
          ? parsedLocal.state.activeManifestationDesktopIndex : parsedCloud.state.activeManifestationDesktopIndex,
        activeManifestationMobileIndex: (parsedLocal.state.activeManifestationMobileIndex !== undefined && parsedLocal.state.activeManifestationMobileIndex !== null)
          ? parsedLocal.state.activeManifestationMobileIndex : parsedCloud.state.activeManifestationMobileIndex,
        peekModeWallpaper: (parsedLocal.state.peekModeWallpaper !== undefined && parsedLocal.state.peekModeWallpaper !== null)
          ? parsedLocal.state.peekModeWallpaper
          : parsedCloud.state.peekModeWallpaper,
      };

      // Safety: clear any expired timer during conflict merge
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
      try {
        localStorage.setItem('dashboard-storage', mergedStr);
      } catch (e) {
        console.warn("Failed to set mergedStr in localStorage:", e);
      }
      useDashboardStore.setState(mergedState);

      // CRITICAL: We must push the merged result back to the cloud!
      pendingValue = mergedStr;
      hasUnsavedChanges = true;
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(performSave, 500);

      setTimeout(() => { isSyncingFromCloud = false; }, 500);
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
      // If we failed to save to the DB (network disconnect/throttling), preserve pendingValue and local timestamp.
      // Do NOT discard unsaved offline changes! Keep hasUnsavedChanges = true so it syncs when network is restored.
      setSyncLastModified(Date.now());
      hasUnsavedChanges = true;
      if (!saveTimeout) {
        saveTimeout = setTimeout(performSave, 5000);
      }
    }
  }
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
        'widgetZIndices', 'isAlarmPlaying', 'isTourOpen', 'isNewsOpen', 'isManifestationOpen'
      ];
      transientKeys.forEach(key => delete filteredState[key]);

      const str = JSON.stringify({ state: filteredState });
      pendingValue = str;
      hasUnsavedChanges = true;
      hasUnsavedChanges = true;
      failedToLoadDB = false;
      if (!saveTimeout) {
        saveTimeout = setTimeout(performSave, 5000);
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
    const maxRetries = 2; // Fast initial load: max 2 retries (prevents 15s loading screen hangs)
    const token = getSyncToken();
    const isBypassed = bypassCloudSync;
    bypassCloudSync = false; // Always consume bypass flag for current load so future syncs operate normally!

    while (retries < maxRetries && token) {
      // Check if user clicked "Load Offline Instantly" — bail out immediately
      if (abortInstantLoad) {
        abortInstantLoad = false;
        console.warn("Instant load requested — aborting cloud fetch.");
        break;
      }
      if (isBypassed || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        console.warn("Bypassing cloud sync and loading local data instantly.");
        break;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s max request timeout

        const res = await fetch(`/api/store?t=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          failedToLoadDB = false;
          const json = await res.json();
          const localDataStr = localStorage.getItem('dashboard-storage');

          // If cloud data is null (new account), return localData so user progress isn't lost
          if (json.data === null) {
            lastSavedValue = localDataStr || "{}";
            return lastSavedValue;
          }

          if (json.data) {
            let localState: any = null;
            if (localDataStr) {
              try {
                localState = JSON.parse(localDataStr).state || {};
              } catch (e) {
                console.warn("Failed to parse local storage in getItem", e);
              }
            }

            const cloudState = json.data.state || {};

            // Sanitize: strip any base64/data-URL strings from local media arrays.
            // These may have been saved to the DB by an older version of the app.
            // They should only ever exist in IndexedDB — not in the cloud-synced state.
            const CLOUD_LOCAL_MEDIA_KEYS = [
              'customDesktopWallpapers', 'customMobileWallpapers',
              'manifestationDesktopPhotos', 'manifestationMobilePhotos',
            ];
            CLOUD_LOCAL_MEDIA_KEYS.forEach(key => {
              if (Array.isArray(cloudState[key])) {
                cloudState[key] = cloudState[key].filter(
                  (v: string) => typeof v === 'string' && !v.startsWith('data:')
                );
              }
            });

            // Perform deep smart merge to guarantee NO LOCAL DATA (tasks, deadlines, sleep logs, settings) IS EVER WIPED

            if (localState) {
              // 1. History (stats)
              const localHistory = localState.history || {};
              const cloudHistory = cloudState.history || {};
              const mergedHistory = { ...cloudHistory };
              for (const date in localHistory) {
                mergedHistory[date] = Math.max(localHistory[date] || 0, cloudHistory[date] || 0);
              }

              // 2. Daily Times (sleep & wake-up logs) - Merge per date, local wins for conflict
              const localDailyTimes = localState.dailyTimes || {};
              const cloudDailyTimes = cloudState.dailyTimes || {};
              const mergedDailyTimes = mergeDailyTimes(localDailyTimes, cloudDailyTimes);

              const todayStr = getLocalDateString();
              if (mergedDailyTimes && mergedDailyTimes[todayStr] && Object.keys(mergedDailyTimes[todayStr]).length > 0) {
                if (typeof window !== 'undefined') {
                  localStorage.setItem(`grindboard_wakeup_logged_${todayStr}`, 'true');
                }
              }

              const localHasSeen = localState?.hasSeenOnboarding || (typeof window !== 'undefined' && localStorage.getItem('grindboard_has_seen_onboarding') === 'true');
              const cloudHasSeen = cloudState?.hasSeenOnboarding;
              const mergedHasSeenOnboarding = Boolean(localHasSeen || cloudHasSeen);

              const cloudLastMod = json.lastModified ? Number(json.lastModified) : 0;
              const isCloudNewer = cloudLastMod > getSyncLastModified();

              // Use union merge for tasks to prevent data loss across devices or during offline syncs
              const mergedTasks = isCloudNewer ? (cloudState.tasks || []) : (localState.tasks || []);
              const mergedTomorrowTasks = isCloudNewer ? (cloudState.tomorrowTasks || []) : (localState.tomorrowTasks || []);

              const mergedTasksDate = (localState.tasksDate && cloudState.tasksDate) ?
                (localState.tasksDate > cloudState.tasksDate ? localState.tasksDate : cloudState.tasksDate) :
                (cloudState.tasksDate || localState.tasksDate || getLocalDateString());
              const mergedDeadlines = filterActiveDeadlines(mergeArraysById(localState.deadlines, cloudState.deadlines));

              const mergedRoadmaps = mergeArraysById(localState.roadmaps, cloudState.roadmaps);
              const mergedPlans = mergeArraysById(localState.plans, cloudState.plans);
              const mergedCustomAlarmSounds = mergeArraysById(localState.customAlarmSounds, cloudState.customAlarmSounds);

              const baseState = lastSavedValue ? (JSON.parse(lastSavedValue).state || {}) : {};
              const mergedManifestationDesktopPhotos = mergeStringArrays(localState.manifestationDesktopPhotos, cloudState.manifestationDesktopPhotos, baseState.manifestationDesktopPhotos, isCloudNewer);
              const mergedManifestationMobilePhotos = mergeStringArrays(localState.manifestationMobilePhotos, cloudState.manifestationMobilePhotos, baseState.manifestationMobilePhotos, isCloudNewer);
              const mergedCustomDesktopWallpapers = mergeStringArrays(localState.customDesktopWallpapers, cloudState.customDesktopWallpapers, baseState.customDesktopWallpapers, isCloudNewer);
              const mergedCustomMobileWallpapers = mergeStringArrays(localState.customMobileWallpapers, cloudState.customMobileWallpapers, baseState.customMobileWallpapers, isCloudNewer);
              const mergedCustomQuotes = mergeStringArrays(localState.customQuotes, cloudState.customQuotes, baseState.customQuotes, isCloudNewer);
              const mergedManifestationCustomQuotes = mergeStringArrays(localState.manifestationCustomQuotes, cloudState.manifestationCustomQuotes, baseState.manifestationCustomQuotes, isCloudNewer);
              const mergedLockedWidgets = mergeStringArrays(localState.lockedWidgets, cloudState.lockedWidgets, baseState.lockedWidgets, isCloudNewer);

              const mergedWeekdayTimes = (Array.isArray(cloudState.weekdayTimes) && cloudState.weekdayTimes.length > 0)
                ? cloudState.weekdayTimes
                : (Array.isArray(localState.weekdayTimes) ? localState.weekdayTimes : []);
              const mergedWeekendTimes = (Array.isArray(cloudState.weekendTimes) && cloudState.weekendTimes.length > 0)
                ? cloudState.weekendTimes
                : (Array.isArray(localState.weekendTimes) ? localState.weekendTimes : []);

              const mergedClockOffsets = { ...(localState.clockOffsets || {}), ...(cloudState.clockOffsets || {}) };
              const mergedWidgetOffsets = { ...(localState.widgetOffsets || {}), ...(cloudState.widgetOffsets || {}) };
              const mergedHideConfig = { ...(localState.hideConfig || {}), ...(cloudState.hideConfig || {}) };
              const mergedMobileHideConfig = { ...(localState.mobileHideConfig || {}), ...(cloudState.mobileHideConfig || {}) };

              // Active index: LOCAL wins — the user's current selection on this device takes priority.
              // Cloud only fills in when local is null (fresh device / no selection yet).
              // This prevents the debounced cloud save from reverting the user's just-made selection on refresh.
              const activeDesktopCustomIndex = (localState.activeDesktopCustomIndex !== undefined && localState.activeDesktopCustomIndex !== null)
                ? localState.activeDesktopCustomIndex
                : cloudState.activeDesktopCustomIndex;
              const activeMobileCustomIndex = (localState.activeMobileCustomIndex !== undefined && localState.activeMobileCustomIndex !== null)
                ? localState.activeMobileCustomIndex
                : cloudState.activeMobileCustomIndex;
              const activeManifestationDesktopIndex = (localState.activeManifestationDesktopIndex !== undefined && localState.activeManifestationDesktopIndex !== null)
                ? localState.activeManifestationDesktopIndex
                : cloudState.activeManifestationDesktopIndex;
              const activeManifestationMobileIndex = (localState.activeManifestationMobileIndex !== undefined && localState.activeManifestationMobileIndex !== null)
                ? localState.activeManifestationMobileIndex
                : cloudState.activeManifestationMobileIndex;

              const mergedPeekModeWallpaper = (localState.peekModeWallpaper !== undefined && localState.peekModeWallpaper !== null)
                ? localState.peekModeWallpaper
                : cloudState.peekModeWallpaper;

              // 4. Construct Merged State
              //    Cloud wins for settings/data, but LOCAL ALWAYS WINS for timer state.
              //    Timer is fundamentally device-local — cloud must never override what
              //    this browser's timer shows (stopped, paused, or running).
              const mergedState = {
                ...localState,
                ...cloudState,
                activeDesktopCustomIndex,
                activeMobileCustomIndex,
                activeManifestationDesktopIndex,
                activeManifestationMobileIndex,
                peekModeWallpaper: mergedPeekModeWallpaper,
                tasksDate: mergedTasksDate,
                hideConfig: mergedHideConfig,
                mobileHideConfig: mergedMobileHideConfig,
                history: mergedHistory,
                dailyTimes: mergedDailyTimes,
                hasSeenOnboarding: mergedHasSeenOnboarding,
                tasks: mergedTasks,
                tomorrowTasks: mergedTomorrowTasks,
                countdowns: cloudState.countdowns || localState.countdowns,
                roadmaps: mergedRoadmaps,
                plans: mergedPlans,
                manifestationDesktopPhotos: mergedManifestationDesktopPhotos,
                manifestationMobilePhotos: mergedManifestationMobilePhotos,
                customDesktopWallpapers: mergedCustomDesktopWallpapers,
                customMobileWallpapers: mergedCustomMobileWallpapers,
                customQuotes: mergedCustomQuotes,
                manifestationCustomQuotes: mergedManifestationCustomQuotes,
                customAlarmSounds: mergedCustomAlarmSounds,
                lockedWidgets: mergedLockedWidgets,
                weekdayTimes: mergedWeekdayTimes,
                weekendTimes: mergedWeekendTimes,
                clockOffsets: mergedClockOffsets,
                widgetOffsets: mergedWidgetOffsets,
                // Deadlines are completely decoupled and always take the cloud truth
                deadlines: cloudState.deadlines || localState.deadlines,
                syntheticDeadlines: cloudState.syntheticDeadlines || localState.syntheticDeadlines,
                deadlineAlertDays: cloudState.deadlineAlertDays || localState.deadlineAlertDays,
                dismissedDeadlineAlerts: cloudState.dismissedDeadlineAlerts || localState.dismissedDeadlineAlerts,
                // 5. Timer: LOCAL ALWAYS WINS. If user stopped/paused on this device,
                //    that state is in localStorage. Cloud must never resurrect a ghost timer.
                timerEndAt: localState.timerEndAt ?? null,
                timerPausedLeft: localState.timerPausedLeft ?? null,
                timerInitialMins: localState.timerInitialMins ?? null,
                timerDeviceId: localState.timerDeviceId ?? null,
                timerLastUpdated: localState.timerLastUpdated || 0,
                timerLastSavedChunks: localState.timerLastSavedChunks || 0,
                timerLastAlertedChunks: localState.timerLastAlertedChunks || 0,
                activeTaskId: localState.activeTaskId ?? null,
                activeTaskTitle: localState.activeTaskTitle ?? null,
              };

              // Safety: clear any expired timer
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

              const mergedData = { version: 2, state: mergedState };
              const mergedStr = JSON.stringify(mergedData);

              const isDifferentFromCloud = JSON.stringify(cloudState) !== JSON.stringify(mergedState);
              if (isDifferentFromCloud) {
                pendingValue = mergedStr;
                hasUnsavedChanges = true;
                hasUnsavedChanges = true;
                setSyncLastModified(Date.now());
                if (!saveTimeout) {
                  saveTimeout = setTimeout(performSave, 5000);
                }
              } else {
                setSyncLastModified(json.lastModified);
              }

              try {
                localStorage.setItem('dashboard-storage', mergedStr);
              } catch (e) {
                console.warn("Failed to update localStorage with merged data:", e);
              }

              // CRITICAL: If there are local changes, lastSavedValue MUST be the cloud state
              // so that the scheduled performSave() detects the diff and pushes them to the DB.
              lastSavedValue = isDifferentFromCloud ? JSON.stringify({ version: 2, state: cloudState }) : mergedStr;
              return mergedStr;
            } else {
              // No local state (fresh device/browser) — use cloud as-is but validate timer
              setSyncLastModified(json.lastModified);
              const cloudOnlyState = json.data?.state || {};
              // Safety: never carry a foreign-device timer to a fresh device.
              // The receiving device is NOT the owner, so the timer should not tick here.
              // We only keep a cloud timer if it's genuinely still running AND not expired.
              if (cloudOnlyState.timerEndAt) {
                if (cloudOnlyState.timerEndAt < Date.now()) {
                  // Already expired — wipe it
                  cloudOnlyState.timerEndAt = null;
                  cloudOnlyState.timerPausedLeft = null;
                  cloudOnlyState.timerInitialMins = null;
                  cloudOnlyState.timerDeviceId = null;
                  cloudOnlyState.timerLastSavedChunks = 0;
                  cloudOnlyState.timerLastAlertedChunks = 0;
                  cloudOnlyState.activeTaskId = null;
                  cloudOnlyState.activeTaskTitle = null;
                }
                // Note: if timerEndAt is in the future we DO show it — the user may have
                // started it on another tab in the same browser and opened this one intentionally.
                // The timerDeviceId guard in Timer.tsx ensures only the owner saves focus minutes.
              } else if (cloudOnlyState.timerPausedLeft !== null && cloudOnlyState.timerPausedLeft !== undefined) {
                // Paused timer from another device — a fresh device should NOT inherit paused state
                // because the owner device is the only one that can resume it correctly.
                // Clear it so this fresh device shows a clean slate.
                cloudOnlyState.timerEndAt = null;
                cloudOnlyState.timerPausedLeft = null;
                cloudOnlyState.timerInitialMins = null;
                cloudOnlyState.timerDeviceId = null;
                cloudOnlyState.timerLastSavedChunks = 0;
                cloudOnlyState.timerLastAlertedChunks = 0;
                cloudOnlyState.activeTaskId = null;
                cloudOnlyState.activeTaskTitle = null;
              }
              const cleaned = { ...json.data, state: cloudOnlyState };
              const str = JSON.stringify(cleaned);
              try {
                localStorage.setItem('dashboard-storage', str);
              } catch (e) {
                console.warn("Failed to update localStorage with cloud data:", e);
              }
              lastSavedValue = str;
              return str;
            }
          }
        } else {
          console.warn(`Database API returned ${res.status}, skipping retries.`);
          break; // Stop retrying on server/auth errors!
        }
      } catch (e) {
        console.warn(`Database API error, retrying... (${retries + 1}/${maxRetries})`, e);
      }
      retries++;
      await new Promise(resolve => setTimeout(resolve, 350));
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
    if (value === lastSavedValue) return;

    // Safety check: NEVER save to DB if hydration hasn't finished
    if (useDashboardStore.getState && !useDashboardStore.getState()._hasHydrated) {
      return;
    }

    try {
      localStorage.setItem('dashboard-storage', value);
    } catch (e) { }

    const newTime = Math.max(Date.now(), getSyncLastModified() + 1);
    setSyncLastModified(newTime);

    pendingValue = value;
    hasUnsavedChanges = true;
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    if (!isSaving) {
      saveTimeout = setTimeout(performSave, 5000);
    }
  },
  removeItem: async (_name: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('dashboard-storage');
  },
}));


export const pushCountdownsToDB = async (payload: any) => {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('dashboard_sync_token');
  if (!token) return;
  try {
    await fetch('/api/countdowns', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Failed to push countdowns to DB', e);
  }
};


export const pushDeadlinesToDB = async (payload: any) => {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('dashboard_sync_token');
  if (!token) return;
  try {
    await fetch('/api/deadlines', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Failed to push deadlines to DB", e);
  }
};

export const pushDailyRoutineToDB = async (payload: any) => {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('dashboard_sync_token');
  if (!token) return;
  try {
    // Use the main /api/store endpoint with DailyRoutine as the modified collection
    // so it goes through the proper merge logic that never wipes existing wakeup logs.
    const statePayload = JSON.stringify({
      data: { state: payload, version: 2 },
      lastModified: Date.now(),
      modifiedCollections: ['DailyRoutine'],
      modifiedKeys: Object.keys(payload)
    });
    await fetch('/api/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: statePayload
    });
  } catch (e) {
    console.error('Failed to push daily routine to DB', e);
  }
};

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
        const BUILT_IN = ["/wallpapers/naruto.webp"];
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
      toggleSettings: () => set((state) => {
        const willClose = state.isSettingsOpen;
        if (willClose && typeof window !== 'undefined') {
          // Push both explicitly to bypass performSave concurrency issues
          useDashboardStore.getState().pushWallpapersToDB();
          useDashboardStore.getState().pushManifestationToDB();
        }
        return {
          isSettingsOpen: !state.isSettingsOpen,
          isAlarmPlaying: false,
          isManifestationOpen: false,
          ...(willClose && { connectInitialTab: undefined })
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
      setIsTourOpen: (open: boolean) => set({ isTourOpen: open }),
      startTour: () => set({ isTourOpen: true }),
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
      // Active Task for Timer
      activeTaskId: null,
      activeTaskTitle: null,
      setActiveTask: (id, title) => {
        set({ activeTaskId: id, activeTaskTitle: title });
        get().forceInstantSave();
      },
      updateTaskDuration: (id, decreaseMins) => {
        set((state) => ({
          tasks: ((state as any).tasks || []).map((t: any) => t.id === id ? { ...t, duration: Math.max(0, t.duration - decreaseMins) } : t),
          tomorrowTasks: ((state as any).tomorrowTasks || []).map((t: any) => t.id === id ? { ...t, duration: Math.max(0, t.duration - decreaseMins) } : t)
        } as any));
        get().forceInstantSave();
      },
      editTaskDuration: (id, newDuration, tab = 'today') => {
        set((state) => ({
          ...(tab === 'today' && { tasks: ((state as any).tasks || []).map((t: any) => t.id === id ? { ...t, duration: newDuration } : t) }),
          ...(tab === 'tomorrow' && { tomorrowTasks: ((state as any).tomorrowTasks || []).map((t: any) => t.id === id ? { ...t, duration: newDuration } : t) })
        } as any));
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
          // Cast to any since tasks array type is implicitly handled in your store
          const currentTasks = (state as any).tasks || [];
          const currentTomorrow = (state as any).tomorrowTasks || [];

          if (tab === 'today') {
            return {
              tasks: currentTasks.map((t: any) =>
                t.id === id ? { ...t, title } : t
              ),
              ...(isCurrentlyActive && { activeTaskTitle: title }),
            };
          }
          return {
            tomorrowTasks: currentTomorrow.map((t: any) =>
              t.id === id ? { ...t, title } : t
            ),
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
      clearTimerState: () => {
        // Atomically clear every timer field in one set()
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
        // The set() above triggers Zustand persist’s setItem which:
        //   1. Saves the cleared state to localStorage synchronously
        //   2. Queues a cloud save via the normal 500ms debounce
        // We accelerate the cloud save by cancelling the debounce and running immediately.
        // We use the pendingValue that Zustand's setItem already prepared (correct partialized format).
        if (typeof window !== 'undefined') {
          if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
          if (!isSaving && pendingValue) { saveTimeout = setTimeout(performSave, 0); }
        }
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
      // Notes UI State
      isNotesOpen: false,
      toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),

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
      setSyntheticDeadline: (status, date) => set((state) => {
        const payload = { syntheticDeadlines: { ...state.syntheticDeadlines, [status]: date } };
        pushDeadlinesToDB(payload);
        return payload;
      }),
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

      // Deadlines
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
        // Only push to DB if we actually removed something AND the store is hydrated.
        // NEVER push when state.deadlines is [] (unhydrated default) — that wipes the DB!
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

      isDeadlinesCollapsed: false,
      setIsDeadlinesCollapsed: (collapsed) => set({ isDeadlinesCollapsed: collapsed }),

      //timetable
      isTimetableOpen: false,
      setIsTimetableOpen: (isOpen) => set({ isTimetableOpen: isOpen }),
      timetableGrid: {},
      timetableColors: {},
      weekdayTimes: [],
      weekendTimes: [],
      timetableStartTime: 540,
      timetableWeekendStartTime: 540,

      viewingFriend: null,
      setViewingFriend: (friend) => set({ viewingFriend: friend }),

      // Daily Times (WAKE UP LOG)
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
          // Immediately push to DB so the wakeup log is never lost.
          // Use a dedicated push so it isn't lost in the debounced performSave queue.
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
        return {
          widgetOffsets: {
            ...state.widgetOffsets,
            [bgSrc]: newBgOffsets
          }
        };
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
      toggleVisibility: (key) => set((state) => {
        return { [key]: !state[key] };
      }),
      hideConfig: {
        quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true
      },
      setHideConfig: (key, value) => set((state) => {
        return { hideConfig: { ...state.hideConfig, [key]: value } };
      }),
      setHideAll: (hide) => {
        if (hide) {
          set({
            hideConfig: {
              quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true
            }
          });
        } else {
          set({ hideConfig: {} });
        }
      },

      mobileHideConfig: {
        quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true
      },
      setMobileHideConfig: (key, value) => set((state) => {
        return { mobileHideConfig: { ...state.mobileHideConfig, [key]: value } };
      }),
      setMobileHideAll: (hide) => {
        if (hide) {
          set({
            mobileHideConfig: {
              quote: true, timer: true, countdowns: true, videoControls: true, clock: true, tasks: true, calendar: true, todayFocusPill: false, timerPill: false, stats: true, plans: true, notes: true, timetable: true, dock: true, deadlineAlerts: true, bgSwitcher: true, settingsBtn: true, stopwatch: true, manifestation: true
            }
          });
        } else {
          set({ mobileHideConfig: {} });
        }
      },

      isPanicHidden: false,
      togglePanicHide: () => set((state) => ({ isPanicHidden: !state.isPanicHidden })),
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
      clearAllTasksAndPlans: () => {
        useTaskStore.setState({ tasks: [], tomorrowTasks: [] });
        get().forceInstantSave();
      },
      resetTimetable: () => {
        set({
          timetableGrid: {}, // This will auto-fallback to defaults on next load
          timetableColors: {}
        });
        get().forceInstantSave();
      },
      forceInstantSave: () => {
        if (typeof window !== 'undefined') {
          if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
          saveTimeout = setTimeout(performSave, 0);
        }
      },

      pushManifestationToDB: () => {
        get().forceInstantSave();
      },

      pushWallpapersToDB: () => {
        get().forceInstantSave();
      },
    }),
    {
      name: 'dashboard-storage',
      storage: fileStorage,
      version: 2, // Store schema version
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
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
          'widgetZIndices', 'isAlarmPlaying', 'isTourOpen', 'isManifestationOpen', 'isNewsOpen'
        ].includes(key))
      ),
      merge: (persistedState: any, currentState: DashboardState) => {
        if (!persistedState) return currentState;

        // Force UI transient states to remain closed on page load, overriding any stale localStorage
        const transientKeys = [
          'isQuotePopupOpen', 'isTaskManagerOpen', 'isStatsOpen', 'timerTrigger',
          'isNotesOpen', 'isPlansOpen', 'isTimetableOpen', 'isDayStartModalOpen',
          'isVideoMuted', 'isVideoPlaying', 'isSettingsOpen', 'isStopwatchOpen', '_hasHydrated',
          'isAlarmPlaying', 'isTourOpen', 'isNewsOpen', 'isManifestationOpen', 'selectedGroupId'
        ];
        transientKeys.forEach(key => {
          if (persistedState[key] !== undefined) {
            delete persistedState[key];
          }
        });

        // Fix for PC users stuck with the mobile default wallpaper from old cycleBackground logic
        if (persistedState.wallpaper === "/wallpapers/defaultWallpaper2.jpeg") {
          persistedState.wallpaper = "/wallpapers/naruto.webp";
        }
        // Clean up expired or inactive timers from past sessions to prevent ghost minutes
        if (persistedState.timerEndAt && persistedState.timerEndAt < Date.now()) {
          // Timer expired while device was closed — clear it completely
          persistedState.timerEndAt = null;
          persistedState.timerPausedLeft = null;
          persistedState.timerInitialMins = null;
          persistedState.timerDeviceId = null;
          persistedState.timerLastSavedChunks = 0;
          persistedState.timerLastAlertedChunks = 0;
          persistedState.activeTaskId = null;
          persistedState.activeTaskTitle = null;
        } else if (!persistedState.timerEndAt && (persistedState.timerPausedLeft === null || persistedState.timerPausedLeft === undefined)) {
          // Timer is in a fully stopped state — sanitise all dependent fields
          persistedState.timerInitialMins = null;
          persistedState.timerDeviceId = null;
          persistedState.timerLastSavedChunks = 0;
          persistedState.timerLastAlertedChunks = 0;
          persistedState.activeTaskId = null;
          persistedState.activeTaskTitle = null;
        }

        // Prevent alarm from persisting and triggering continuously on reload/focus
        persistedState.isAlarmPlaying = false;

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
        safeState.roadmaps = Array.isArray(persistedState.roadmaps) ? persistedState.roadmaps : currentState.roadmaps;
        safeState.deadlines = filterActiveDeadlines(persistedState.deadlines || []);

        // Deep merge records/objects to ensure we don't drop newly added default keys
        if (persistedState.history && typeof persistedState.history === 'object') {
          safeState.history = { ...currentState.history, ...persistedState.history };
        }
        if (persistedState.dailyTimes && typeof persistedState.dailyTimes === 'object') {
          safeState.dailyTimes = mergeDailyTimes(currentState.dailyTimes || {}, persistedState.dailyTimes || {});
        }
        const hasSeenLocal = (typeof window !== 'undefined' && localStorage.getItem('grindboard_has_seen_onboarding') === 'true');
        safeState.hasSeenOnboarding = Boolean(persistedState?.hasSeenOnboarding || currentState?.hasSeenOnboarding || hasSeenLocal);
        if (persistedState.clockOffsets && typeof persistedState.clockOffsets === 'object') {
          safeState.clockOffsets = { ...currentState.clockOffsets, ...persistedState.clockOffsets };
        }
        if (persistedState.widgetOffsets && typeof persistedState.widgetOffsets === 'object') {
          safeState.widgetOffsets = { ...currentState.widgetOffsets, ...persistedState.widgetOffsets };
        }
        if (persistedState.hideConfig && typeof persistedState.hideConfig === 'object') {
          safeState.hideConfig = { ...(currentState.hideConfig || {}), ...persistedState.hideConfig };
        }
        if (persistedState.mobileHideConfig && typeof persistedState.mobileHideConfig === 'object') {
          safeState.mobileHideConfig = { ...(currentState.mobileHideConfig || {}), ...persistedState.mobileHideConfig };
        }

        return safeState;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Hydration failed!", error);
        }
        const markHydrated = () => {
          if (state && typeof state.setHasHydrated === 'function') {
            state.setHasHydrated(true);
          } else {
            useDashboardStore.getState().setHasHydrated(true);
          }
        };
        // Use Promise.resolve() to push to end of microtask queue
        Promise.resolve().then(markHydrated);
      },
    }
  )
);

