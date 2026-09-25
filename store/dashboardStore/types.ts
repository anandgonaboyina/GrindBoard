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

export interface DashboardState {
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
  lastSeenNewsTime: number;
  updateLastSeenNews: (timestamp: number) => void;
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

  activeTaskId: string | null;
  activeTaskTitle: string | null;
  setActiveTask: (id: string | null, title: string | null) => void;
  updateTaskDuration: (id: string, decreaseMins: number) => void;
  incrementGroupTaskTimeSpent: (id: string, minsToSave: number) => void;
  editTaskDuration: (id: string, newDuration: number, tab?: 'today' | 'tomorrow') => void;
  editTaskTimeSpent: (id: string, newTimeSpent: number, tab?: 'today' | 'tomorrow') => void;
  updateTaskTitle: (id: string, title: string, tab?: 'today' | 'tomorrow') => void;

  timerEndAt: number | null;
  timerPausedLeft: number | null;
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

  isNotesOpen: boolean;
  toggleNotes: () => void;

  isTimetableOpen: boolean;
  setIsTimetableOpen: (isOpen: boolean) => void;
  
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

  roadmaps: Roadmap[];
  setRoadmaps: (roadmaps: Roadmap[]) => void;
  syntheticDeadlines: Record<string, string>;
  setSyntheticDeadline: (status: string, date: string) => void;
  isPlansOpen: boolean;
  togglePlans: () => void;

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

  countdowns: { id: string; title: string; endDate: string | null }[];
  addCountdown: (title?: string, endDate?: string | null) => string;
  updateCountdown: (id: string, title: string, endDate: string | null) => void;
  deleteCountdown: (id: string) => void;
  autoOpenCountdowns: boolean;
  setAutoOpenCountdowns: (enabled: boolean) => void;

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
  disableDeadlineLockOnToday: boolean;
  setDisableDeadlineLockOnToday: (disabled: boolean) => void;
  hideYouInLeaderboard: boolean;
  setHideYouInLeaderboard: (hide: boolean) => void;
  isDeadlinesCollapsed: boolean;
  setIsDeadlinesCollapsed: (collapsed: boolean) => void;

  viewingFriend: { username: string, stats: any } | null;
  setViewingFriend: (friend: { username: string, stats: any } | null) => void;

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

  isSlideshowEnabled: boolean;
  setIsSlideshowEnabled: (enabled: boolean) => void;
  isMobileCountdownsVisible: boolean;
  setIsMobileCountdownsVisible: (visible: boolean) => void;
  slideshowIntervalMins: number;
  setSlideshowIntervalMins: (mins: number) => void;

  upiId: string;
  setUpiId: (id: string) => void;

  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  notesThemeOverride: 'light' | 'dark' | null;
  setNotesThemeOverride: (theme: 'light' | 'dark' | null) => void;
  timetableThemeOverride: 'light' | 'dark' | null;
  setTimetableThemeOverride: (theme: 'light' | 'dark' | null) => void;

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
  customPeekModeWallpapers: string[];
  setCustomPeekModeWallpapers: (urls: string[]) => void;
  activePeekModeCustomIndex: number | null;
  setActivePeekModeCustomIndex: (index: number | null) => void;

  rightWidgetsOffset: number;
  setRightWidgetsOffset: (offset: number) => void;

  dismissedBroadcasts: string[];
  dismissBroadcast: (id: string) => void;

  clearOldData: (days: number) => Promise<void>;
  clearAllData: () => Promise<void>;

  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}