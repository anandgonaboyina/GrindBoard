"use client";

import Dock from "@/components/Navbar";
import BigClock from "@/components/BigClock";
import Timer from "@/components/Timer";
import Stopwatch from "@/components/Stopwatch";
import TaskManager from "@/components/TaskManager";
import QuotePopup from "@/components/QuotePopup";
import StatsModal from "@/components/StatsModal";
import NotesManager from "@/components/NotesManager";
import RoadmapManager from "@/components/RoadmapManager";
import MiniCalendar from "@/components/MiniCalendar";
import Countdown from "@/components/Countdown";
import Timetable from "@/components/Timetable";
import DayStartModal from "@/components/DayStartModal";
import DraggableClock from "@/components/DraggableClock";
import DraggableWidget from "@/components/DraggableWidget";
import SettingsModal from "@/components/SettingsModal";
import RightToolbar from "@/components/RightToolbar";
import DeadlineAlerts from "@/components/DeadlineAlerts";
import StartupUpdateChecker from "@/components/StartupUpdateChecker";
import FriendRequestPopup from "@/components/FriendRequestPopup";
import GroupRequestPopup from "@/components/GroupRequestPopup";
import GlobalBroadcastPopup from "@/components/GlobalBroadcastPopup";
import VideoBackground from "@/components/VideoBackground";
import LoadingScreen from "@/components/LoadingScreen";
import NewsModal from "@/components/NewsModal";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, ChevronUp, CalendarDays, Calendar, Settings, ChevronLeft, ListTodo, ChevronRight, EyeOff, Image as ImageIcon, Newspaper, Trophy, Users } from "lucide-react";
import { useDashboardStore, hasUnsavedChanges } from "@/store/dashboardStore";
import { fetchQuote } from "@/utils/quoteEngine";

export default function Dashboard() {
  const showQuotePopup = useDashboardStore((state) => state.showQuotePopup);
  const isHidden = useDashboardStore((state) => state.isHidden);
  const baseHideConfig = useDashboardStore((state) => state.hideConfig);
  const mobileHideConfig = useDashboardStore((state) => state.mobileHideConfig);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hideConfig = isMobile ? mobileHideConfig : baseHideConfig;
  const _hasHydrated = useDashboardStore((state) => state._hasHydrated);

  const toggleHide = useDashboardStore((state) => state.toggleHide);
  const currentBgType = useDashboardStore((state) => state.currentBgType);
  const countdowns = useDashboardStore((state) => state.countdowns);
  const [activeCountdownIndex, setActiveCountdownIndex] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const calendarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showBgSwitcher = useDashboardStore((state) => state.showBgSwitcher);
  const customDesktopWallpapers = useDashboardStore((state) => state.customDesktopWallpapers);
  const activeDesktopCustomIndex = useDashboardStore((state) => state.activeDesktopCustomIndex);
  const setActiveDesktopCustomIndex = useDashboardStore((state) => state.setActiveDesktopCustomIndex);
  const customMobileWallpapers = useDashboardStore((state) => state.customMobileWallpapers);
  const activeMobileCustomIndex = useDashboardStore((state) => state.activeMobileCustomIndex);
  const setActiveMobileCustomIndex = useDashboardStore((state) => state.setActiveMobileCustomIndex);


  const isMobileCountdownsVisible = useDashboardStore((state) => state.isMobileCountdownsVisible);
  const isTimetableOpen = useDashboardStore((state) => state.isTimetableOpen);
  const setIsTimetableOpen = useDashboardStore((state) => state.setIsTimetableOpen);
  const isCalendarOpen = useDashboardStore((state) => state.isCalendarOpen);
  const isCalendarBusy = useDashboardStore((state) => state.isCalendarBusy);
  const isTaskManagerOpen = useDashboardStore((state) => state.isTaskManagerOpen);
  const isNewsOpen = useDashboardStore((state) => state.isNewsOpen);
  const hasUnreadNews = useDashboardStore((state) => state.hasUnreadNews);
  const [edgeTouchStartX, setEdgeTouchStartX] = useState<number | null>(null);
  const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(false);

  const showQuote = useDashboardStore((state) => state.showQuote);
  const showTimer = useDashboardStore((state) => state.showTimer);
  const showStopwatch = useDashboardStore((state) => state.showStopwatch);
  const showCountdowns = useDashboardStore((state) => state.showCountdowns);
  const showClock = useDashboardStore((state) => state.showClock);
  const showTodayWork = useDashboardStore((state) => state.showTodayWork);
  const showTasks = useDashboardStore((state) => state.showTasks);
  const showCalendar = useDashboardStore((state) => state.showCalendar);
  const showStats = useDashboardStore((state) => state.showStats);
  const showPlans = useDashboardStore((state) => state.showPlans);
  const showNotes = useDashboardStore((state) => state.showNotes);
  const showTimetable = useDashboardStore((state) => state.showTimetable);
  const showDock = useDashboardStore((state) => state.showDock);
  const showDeadlineAlerts = useDashboardStore((state) => state.showDeadlineAlerts);
  const showSettingsBtn = useDashboardStore((state) => state.showSettingsBtn);
  const rightWidgetsOffset = useDashboardStore((state) => state.rightWidgetsOffset);
  const toggleSettings = useDashboardStore((state) => state.toggleSettings);
  const widgetZIndices = useDashboardStore((state) => state.widgetZIndices) || {};
  const bringToFront = useDashboardStore((state) => state.bringToFront);

  const isPanicHidden = useDashboardStore((state) => state.isPanicHidden);
  const togglePanicHide = useDashboardStore((state) => state.togglePanicHide);
  const panicShortcutKey = useDashboardStore((state) => state.panicShortcutKey);
  const focusShortcutKey = useDashboardStore((state) => state.focusShortcutKey);
  const enablePanicButton = useDashboardStore((state) => state.enablePanicButton);
  const panicButtonMode = useDashboardStore((state) => state.panicButtonMode);
  const isAlarmPlaying = useDashboardStore((state) => state.isAlarmPlaying);
  const cycleBackground = useDashboardStore((state) => state.cycleBackground);

  const handlePanic = () => {
    if (isHidden) {
      toggleHide();
      return;
    }
    if (panicButtonMode === 'hide') {
      toggleHide();
    } else {
      const urls = ['tg://resolve?domain=telegram', 'flipkart://'];
      window.location.href = urls[Math.floor(Math.random() * urls.length)];
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      if (e.altKey && (e.key?.toLowerCase() === 'f4' || e.code === 'F4' || e.keyCode === 115)) return; // NEVER block Alt+F4

      let fKey = focusShortcutKey;
      if (!fKey.includes('+') && fKey.length === 1) fKey = 'ctrl+' + fKey;
      let pKey = panicShortcutKey;
      if (!pKey.includes('+') && pKey.length === 1) pKey = 'ctrl+' + pKey;

      const checkShortcut = (ev: KeyboardEvent, shortcut: string) => {
        const parts = shortcut.split('+');
        const key = parts.pop();
        const ctrl = parts.includes('ctrl');
        const alt = false; // Alt removed from custom combinations to prevent Alt+F4 and Windows OS conflicts
        const shift = parts.includes('shift');
        return ev.ctrlKey === ctrl && ev.altKey === alt && ev.shiftKey === shift && ev.key?.toLowerCase() === key;
      };

      if (checkShortcut(e, fKey)) {
        e.preventDefault();
        toggleHide();
      }

      if (checkShortcut(e, pKey)) {
        e.preventDefault();
        togglePanicHide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleHide, isHidden, hideConfig, togglePanicHide, isPanicHidden, panicShortcutKey, focusShortcutKey]);

  const handleCalendarExpand = () => {
    useDashboardStore.setState({ isCalendarOpen: true });
    if (calendarTimeoutRef.current) clearTimeout(calendarTimeoutRef.current);
    calendarTimeoutRef.current = setTimeout(() => {
      if (!useDashboardStore.getState().isCalendarBusy) {
        useDashboardStore.setState({ isCalendarOpen: false });
      }
    }, 8000);
  };

  const cycleWallpaper = () => {
    if (isMobile) {
      if (!customMobileWallpapers || customMobileWallpapers.length === 0) {
        cycleBackground();
        return;
      }
      const nextIndex = activeMobileCustomIndex === null ? 0 : (activeMobileCustomIndex + 1) % customMobileWallpapers.length;
      setActiveMobileCustomIndex(nextIndex);
    } else {
      if (!customDesktopWallpapers || customDesktopWallpapers.length === 0) {
        cycleBackground();
        return;
      }
      const nextIndex = activeDesktopCustomIndex === null ? 0 : (activeDesktopCustomIndex + 1) % customDesktopWallpapers.length;
      setActiveDesktopCustomIndex(nextIndex);
    }
  };


  useEffect(() => {
    if (!_hasHydrated) return;
    if (isCalendarOpen) {
      if (isCalendarBusy) {
        if (calendarTimeoutRef.current) clearTimeout(calendarTimeoutRef.current);
      } else {
        handleCalendarExpand();
      }
    }
  }, [isCalendarBusy, isCalendarOpen]);

  useEffect(() => {
    return () => {
      if (calendarTimeoutRef.current) clearTimeout(calendarTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!_hasHydrated) return;
    const initialTimer = setTimeout(async () => {
      const q = await fetchQuote();
      showQuotePopup(q);
    }, 5000);

    const interval = setInterval(async () => {
      const q = await fetchQuote();
      showQuotePopup(q);
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [_hasHydrated, showQuotePopup]);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token || token === 'null') {
      window.location.href = '/';
    }
  }, []);

  if (!_hasHydrated) {
    return <LoadingScreen />;
  }

  const tasksZ = widgetZIndices.tasks || 50;
  const stopwatchZ = widgetZIndices.stopwatch || 50;
  const timerZ = widgetZIndices.timer || 50;
  const toolbarZ = widgetZIndices.toolbar || 50;
  const bottomRightZ = Math.max(tasksZ, stopwatchZ, timerZ, toolbarZ);

  return (
    <main className="relative overflow-hidden w-full flex-1">

      <VideoBackground />

      {(!isHidden || !hideConfig.deadlineAlerts) && showDeadlineAlerts && <DeadlineAlerts />}

      {/* Background Switcher */}
      {!isPanicHidden && (!isHidden || !hideConfig.bgSwitcher) && showBgSwitcher && (
        <button
          onClick={cycleWallpaper}
          className="fixed top-10 left-3 z-[90000] p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-white/20 shadow-xl transition-all glass-btn hidden md:block"
          title="Next Wallpaper"
        >
          <ImageIcon className="w-1 h-1 sm:w-4 sm:h-4" />
        </button>
      )}

      {!isPanicHidden && (
        <>
          {/* Quote Popup */}
          {(!isHidden || !hideConfig.quote) && showQuote && <QuotePopup />}

          {/* Stats Modal */}
          {(!isHidden || !hideConfig.stats) && showStats && <StatsModal />}

          {/* Day Start Modal / Indicator */}
          <DayStartModal />

          {/* Quick Notes */}
          {(!isHidden || !hideConfig.notes) && showNotes && <NotesManager />}

          {/* Roadmap & Plans */}
          {(!isHidden || !hideConfig.plans) && showPlans && <RoadmapManager />}

          {/* Top Center: Target Countdowns */}
          {(!isHidden || !hideConfig.countdowns) && showCountdowns && (
            <div
              style={{ zIndex: widgetZIndices.countdowns || 50 }}
              className={`absolute top-[140px] md:top-36 left-1/2 -translate-x-1/2 scale-[0.85] md:scale-100 origin-top pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex justify-center ${!isMobileCountdownsVisible ? '-translate-y-[150%] opacity-0' : 'translate-y-0 opacity-100'}`}
            >
              <div
                className="relative flex items-center justify-center group pointer-events-auto"
                onTouchStart={(e) => {
                  setTouchStartX(e.touches[0].clientX);
                  setTouchStartY(e.touches[0].clientY);
                }}
                onTouchEnd={(e) => {
                  if (touchStartX === null || touchStartY === null) return;
                  const touchEndX = e.changedTouches[0].clientX;
                  const touchEndY = e.changedTouches[0].clientY;
                  const diffX = touchStartX - touchEndX;
                  const diffY = touchStartY - touchEndY;

                  // Hide if swiped UP significantly
                  if (diffY > 50 && Math.abs(diffY) > Math.abs(diffX)) {
                    useDashboardStore.getState().setIsMobileCountdownsVisible(false);
                  } else if (diffX > 40) {
                    setActiveCountdownIndex(p => Math.min(countdowns.length - 1, p + 1));
                  } else if (diffX < -40) {
                    setActiveCountdownIndex(p => Math.max(0, p - 1));
                  }

                  setTouchStartX(null);
                  setTouchStartY(null);
                }}
              >
                {countdowns.length > 0 && (() => {
                  const safeIndex = Math.min(activeCountdownIndex, Math.max(0, countdowns.length - 1));
                  return (
                    <Countdown
                      key={countdowns[safeIndex].id}
                      id={countdowns[safeIndex].id}
                      hasPrev={safeIndex > 0}
                      hasNext={safeIndex < countdowns.length - 1}
                      onPrev={() => setActiveCountdownIndex(p => p - 1)}
                      onNext={() => setActiveCountdownIndex(p => p + 1)}
                    />
                  );
                })()}
              </div>
            </div>
          )}

          {/* Draggable Widgets */}
          <div className="absolute inset-0 pointer-events-none z-50">
          </div>

          {/* Left Side Drawer: Calendar */}
          {(!isHidden || !hideConfig.calendar) && showCalendar && (
            <>
              {/* Edge Peek Tab for Calendar */}
              <div
                className={`fixed left-0 top-[20vh] glass-btn border-l-0 rounded-l-none rounded-r-xl sm:rounded-r-2xl p-1.5 py-2 sm:p-2.5 sm:py-3 z-[90] cursor-pointer shadow-xl flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCalendarOpen ? '-translate-x-[120%]' : 'translate-x-0'}`}
                onClick={handleCalendarExpand}
                title="Open Calendar"
              >
                <Calendar size={20} className="sm:w-6 sm:h-6" />
              </div>

              {/* Edge Peek Tab for Leaderboard */}
              <div
                className={`fixed left-0 top-[28vh] glass-btn border-l-0 rounded-l-none rounded-r-xl sm:rounded-r-2xl p-1.5 py-2 sm:p-2.5 sm:py-3 z-[90] cursor-pointer shadow-xl flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCalendarOpen ? '-translate-x-[120%]' : 'translate-x-0'}`}
                onClick={() => {
                  useDashboardStore.setState({ isSettingsOpen: true, settingsActiveTab: 'connect', connectInitialTab: 'leaderboard' });
                }}
                title="Open Leaderboard"
              >
                <Trophy size={20} className="sm:w-6 sm:h-6" />
              </div>

              {/* Edge Peek Tab for Groups */}
              <div
                className={`fixed left-0 top-[36vh] glass-btn border-l-0 rounded-l-none rounded-r-xl sm:rounded-r-2xl p-1.5 py-2 sm:p-2.5 sm:py-3 z-[90] cursor-pointer shadow-xl flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCalendarOpen ? '-translate-x-[120%]' : 'translate-x-0'}`}
                onClick={() => {
                  useDashboardStore.setState({ isSettingsOpen: true, settingsActiveTab: 'connect', connectInitialTab: 'groups' });
                }}
                title="Open Groups"
              >
                <Users size={20} className="sm:w-6 sm:h-6" />
              </div>

              <div
                className={`fixed top-[100px] left-0 h-auto max-h-[calc(100vh-140px)] w-auto max-w-[85vw] pb-4 pl-2 pr-0 sm:pl-4 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-[100] group pointer-events-auto select-none ${isCalendarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-[calc(100%+20px)] pointer-events-none'}`}
                onTouchStart={(e) => setEdgeTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (edgeTouchStartX !== null && edgeTouchStartX - e.changedTouches[0].clientX > 15) {
                    if (isCalendarOpen) useDashboardStore.setState({ isCalendarOpen: false });
                  }
                  setEdgeTouchStartX(null);
                }}
                onTouchCancel={() => setEdgeTouchStartX(null)}
                onMouseDown={(e) => setEdgeTouchStartX(e.clientX)}
                onMouseUp={(e) => {
                  if (edgeTouchStartX !== null && edgeTouchStartX - e.clientX > 15) {
                    if (isCalendarOpen) useDashboardStore.setState({ isCalendarOpen: false });
                  }
                  setEdgeTouchStartX(null);
                }}
                onMouseLeave={(e) => {
                  if (edgeTouchStartX !== null && edgeTouchStartX - e.clientX > 15) {
                    if (isCalendarOpen) useDashboardStore.setState({ isCalendarOpen: false });
                  }
                  setEdgeTouchStartX(null);
                }}
              >
                {/* When closed, disable clicks on the calendar so you don't accidentally press its buttons when tapping the edge */}
                <div className={`w-full h-full relative ${!isCalendarOpen ? 'pointer-events-none' : ''}`}>
                  <MiniCalendar />
                </div>
              </div>
            </>
          )}

          {/* Right Side Drawer: Tasks */}
          {(!isHidden || !hideConfig.tasks) && showTasks && (
            <>
              {/* Edge Peek Tab for Task Manager */}
              <div
                className={`fixed right-0 top-[20vh] glass-btn border-r-0 rounded-r-none rounded-l-xl sm:rounded-l-2xl p-1.5 py-2 sm:p-2.5 sm:py-3 z-[90] cursor-pointer shadow-xl flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isTaskManagerOpen ? 'translate-x-[120%]' : 'translate-x-0'}`}
                onClick={() => { if (!isTaskManagerOpen) useDashboardStore.setState({ isTaskManagerOpen: true }) }}
                title="Open Tasks"
              >
                <ListTodo size={20} className="sm:w-6 sm:h-6" />
              </div>

              <div
                className={`fixed top-[140px] right-0 h-auto max-h-[calc(100vh-200px)] w-[320px] sm:w-[340px] max-w-[85vw] pb-4 pr-2 pl-0 sm:pr-4 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-[100] ${isTaskManagerOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'}`}
                onTouchStart={(e) => setEdgeTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (edgeTouchStartX !== null && e.changedTouches[0].clientX - edgeTouchStartX > 60) {
                    if (isTaskManagerOpen) useDashboardStore.setState({ isTaskManagerOpen: false });
                  }
                  setEdgeTouchStartX(null);
                }}
                onTouchCancel={() => setEdgeTouchStartX(null)}
                onMouseDown={(e) => setEdgeTouchStartX(e.clientX)}
                onMouseUp={(e) => {
                  if (edgeTouchStartX !== null && e.clientX - edgeTouchStartX > 60) {
                    if (isTaskManagerOpen) useDashboardStore.setState({ isTaskManagerOpen: false });
                  }
                  setEdgeTouchStartX(null);
                }}
                onMouseLeave={() => setEdgeTouchStartX(null)}
              >
                <div className="w-full h-full relative">
                  <TaskManager />
                </div>
              </div>
            </>
          )}

          {/* Edge Peek Tab for News */}
          {(!isHidden || !hideConfig.settingsBtn) && (
            <>
              <div
                className={`fixed right-0 top-[28vh] sm:top-[30vh] glass-btn border-r-0 rounded-r-none rounded-l-xl sm:rounded-l-2xl p-1.5 py-2 sm:p-2.5 sm:py-3 z-[90] cursor-pointer shadow-xl flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isNewsOpen ? 'translate-x-[120%]' : 'translate-x-0'}`}
                onClick={() => useDashboardStore.setState({ isNewsOpen: true })}
                title="What's New"
              >
                <div className="relative flex flex-col items-center">
                  <Newspaper size={20} className="sm:w-6 sm:h-6 text-blue-400" />
                  {hasUnreadNews && (
                    <span className="absolute -top-3 -right-3 bg-blue-500 text-white text-[8px] font-black px-1 py-0.5 rounded shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse border border-black z-10 uppercase tracking-widest">
                      NEW
                    </span>
                  )}
                </div>
              </div>
              <NewsModal />
            </>
          )}

          {/* BigClock */}
          {(showClock || showTodayWork || showTimer || showStopwatch) && (
            <div
              style={{ zIndex: widgetZIndices.clock || 50 }}
              className={`absolute pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isTimetableOpen
                ? 'top-28 left-1/2 -translate-x-1/2 md:top-1/2 md:left-20 md:-translate-y-1/2 md:translate-x-0 scale-[0.85] md:scale-100 origin-top md:origin-center'
                : currentBgType === 'image'
                  ? 'top-32 left-1/2 -translate-x-1/2 translate-y-0 scale-[0.85] md:scale-100 md:top-40 origin-top'
                  : 'top-32 left-1/2 -translate-x-1/2 md:top-40 md:left-10 md:translate-x-0 translate-y-0 scale-[0.85] md:scale-100 origin-top md:origin-top-left'
                }`}>
              <DraggableClock>
                <BigClock />
              </DraggableClock>
            </div>
          )}

          {/* Bottom Center (Above Dock): Timetable */}
          {(!isHidden || !hideConfig.timetable) && showTimetable && (
            <div
              style={{ zIndex: widgetZIndices.timetable || 50 }}
              className="absolute bottom-24  w-[calc(100vw)] md:bottom-40 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto flex flex-col items-center scale-[0.9] md:scale-100 origin-bottom pointer-events-none"
            >
              {/* The Expanded Timetable */}
              <div
                onPointerDown={() => bringToFront('timetable')}
                className={`flex flex-col items-center gap-2 absolute bottom-0 origin-bottom transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] w-full md:w-auto ${isTimetableOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-12 scale-90 pointer-events-none'}`}
              >
                <Timetable />
                <button
                  onClick={() => setIsTimetableOpen(false)}
                  className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-3 text-white/60 hover:text-white hover:bg-black/60 transition-colors flex items-center gap-2 shadow-xl"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* The Closed Button */}
              <div
                onPointerDown={() => bringToFront('timetable')}
                className={`absolute bottom-0 origin-bottom transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${!isTimetableOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto delay-300' : 'opacity-0 translate-y-8 scale-50 pointer-events-none'}`}
              >
                <button
                  onClick={() => setIsTimetableOpen(true)}
                  className="bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-3 py-3 text-white/80 hover:text-white hover:bg-black/40 transition-colors flex items-center gap-2 shadow-xl hover:scale-105"
                >
                  <CalendarDays size={20} className="text-purple-400" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Center: Dock */}
          {(!isHidden || !hideConfig.dock) && showDock && (
            <div className="absolute bottom-2 md:bottom-18 left-1/2 -translate-x-1/2 z-50 scale-[0.85] md:scale-100 origin-bottom">
              <Dock onOpenNotes={() => console.log('Open Notes clicked')} />
            </div>
          )}



          {/* Bottom Right Container */}
          <div
            style={{ bottom: `${rightWidgetsOffset + 30}px`, zIndex: bottomRightZ }}
            className="absolute right-1 sm:right-2 md:right-2 flex items-end transition-all duration-300 pointer-events-none scale-[0.75] sm:scale-85 md:scale-100 origin-bottom-right"
          >
            {/* TaskManager & Timer Group */}
            <div className="flex flex-col items-end gap-2 pointer-events-none mr-1 md:mr-[10px] relative z-20">
              <div className="flex flex-col md:flex-row items-end md:items-start gap-2 md:gap-3 pointer-events-auto">
                <div className={(!isHidden || !hideConfig.stopwatch) && showStopwatch ? '' : 'hidden'}>
                  <Stopwatch />
                </div>
                <div className={((!isHidden || !hideConfig.timer) && showTimer) || isAlarmPlaying ? '' : 'hidden'}>
                  <Timer />
                </div>
              </div>
            </div>

            {/* Vertical Icons Toolbar (Side toggle btns scale with container) */}
            <div className="pointer-events-none relative z-10">
              <RightToolbar />
            </div>
          </div>
        </>
      )}

      {/* Settings Modal */}
      <SettingsModal />

      {/* Auto Update Checker */}
      <StartupUpdateChecker />

      {/* Global Friend Request Notification */}
      <FriendRequestPopup />
      <GroupRequestPopup />

      {/* Global Developer Broadcast Notification */}
      <GlobalBroadcastPopup />

    </main>
  );
}