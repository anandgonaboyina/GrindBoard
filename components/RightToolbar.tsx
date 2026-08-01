'use client';

import { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Map, ListTodo, BarChart2, StickyNote, Settings, Clock, Timer as TimerIcon, Calendar, EyeOff, Image as ImageIcon } from 'lucide-react';

export default function RightToolbar() {
  const isHidden = useDashboardStore((state) => state.isHidden);

  const isPlansOpen = useDashboardStore((state) => state.isPlansOpen);
  const togglePlans = useDashboardStore((state) => state.togglePlans);

  const isTaskManagerOpen = useDashboardStore((state) => state.isTaskManagerOpen);
  const toggleTaskManager = useDashboardStore((state) => state.toggleTaskManager);

  const isStatsOpen = useDashboardStore((state) => state.isStatsOpen);
  const toggleStats = useDashboardStore((state) => state.toggleStats);

  const isStopwatchOpen = useDashboardStore((state) => state.isStopwatchOpen);
  const toggleStopwatch = useDashboardStore((state) => state.toggleStopwatch);
  const showStopwatch = useDashboardStore((state) => state.showStopwatch);

  const isTimerOpen = useDashboardStore((state) => state.isTimerOpen);
  const toggleTimer = useDashboardStore((state) => state.toggleTimer);
  const showTimer = useDashboardStore((state) => state.showTimer);

  const isCalendarOpen = useDashboardStore((state) => state.isCalendarOpen);
  const toggleCalendar = useDashboardStore((state) => state.toggleCalendar);
  const showCalendar = useDashboardStore((state) => state.showCalendar);

  const isNotesOpen = useDashboardStore((state) => state.isNotesOpen);
  const toggleNotes = useDashboardStore((state) => state.toggleNotes);

  const toggleSettings = useDashboardStore((state) => state.toggleSettings);
  const showSettingsBtn = useDashboardStore((state) => state.showSettingsBtn);
  const enableRightToolbarPeek = useDashboardStore((state) => state.enableRightToolbarPeek);

  const baseHideConfig = useDashboardStore((state) => state.hideConfig);
  const mobileHideConfig = useDashboardStore((state) => state.mobileHideConfig);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (startX.current !== null) {
        if (e.clientX - startX.current > 2) setIsExpanded(false);
        startX.current = null;
      }
    };
    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (startX.current !== null) {
        if (e.changedTouches[0].clientX - startX.current > 15) setIsExpanded(false);
        startX.current = null;
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalTouchEnd);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, []);

  const handleDragStart = (clientX: number) => {
    startX.current = clientX;
  };

  const handleDragEnd = (clientX: number) => {
    if (startX.current !== null) {
      const deltaX = clientX - startX.current;
      // Drag right to close (since it's on the right edge)
      if (deltaX > 15) {
        setIsExpanded(false);
      }
      startX.current = null;
    }
  };

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hideConfig = isMobile ? mobileHideConfig : baseHideConfig;

  const showPlans = useDashboardStore((state) => state.showPlans);
  const showTasks = useDashboardStore((state) => state.showTasks);
  const showStats = useDashboardStore((state) => state.showStats);
  const showNotes = useDashboardStore((state) => state.showNotes);
  const enablePanicButton = useDashboardStore((state) => state.enablePanicButton);
  const panicButtonMode = useDashboardStore((state) => state.panicButtonMode);
  const togglePanicHide = useDashboardStore((state) => state.togglePanicHide);
  const toggleHide = useDashboardStore((state) => state.toggleHide);

  const handlePanic = () => {
    if (isHidden) {
      // If dashboard is currently hidden, ALWAYS unhide it instead of redirecting
      toggleHide();
      return;
    }

    if (panicButtonMode === 'hide') {
      toggleHide();
    } else {
      // Use deep links to open apps instantly without network loading
      const urls = [
        'tg://resolve?domain=telegram',
        'flipkart://'
      ];
      window.location.href = urls[Math.floor(Math.random() * urls.length)];
    }
  };

  return (
    <div
      className={`relative flex flex-col gap-2 md:gap-3 pointer-events-auto transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${!enableRightToolbarPeek || isExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-12px)] md:translate-x-[calc(100%-16px)] opacity-90 md:opacity-100 hover:opacity-100 cursor-pointer drop-shadow-md'
        }`}
      onClick={enableRightToolbarPeek && !isExpanded ? () => setIsExpanded(true) : undefined}
    >
      {/* Invisible drag handle to the left of the toolbar for easier swipe-to-close on desktop */}
      {enableRightToolbarPeek && isExpanded && (
        <div
          className="absolute right-full top-0 w-24 md:w-48 h-full cursor-e-resize z-10"
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
          onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
          onTouchCancel={() => { startX.current = null; }}
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onMouseUp={(e) => handleDragEnd(e.clientX)}
          onMouseLeave={(e) => handleDragEnd(e.clientX)}
        />
      )}

      <div
        className={`relative z-20 flex flex-col gap-2 md:gap-3 ${(!isExpanded && enableRightToolbarPeek) ? 'pointer-events-none' : ''}`}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
        onTouchCancel={() => { startX.current = null; }}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseUp={(e) => handleDragEnd(e.clientX)}
        onMouseLeave={(e) => handleDragEnd(e.clientX)}
      >
        {/* Panic Button - Mobile Only */}
        <button
          onClick={handlePanic}
          className={`lg:hidden p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-red-500/30 bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 shadow-xl shadow-red-500/10 transition-all backdrop-blur-xl ${isHidden && panicButtonMode === 'hide' ? 'opacity-0' : 'opacity-100'}`}
          title={isHidden ? "Unhide Interface" : (panicButtonMode === 'redirect' ? "Panic! Launch App" : "Panic! Hide Interface")}
        >
          <EyeOff size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Plans Toggle Button */}
        {showPlans && (
          <button
            onClick={togglePlans}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isPlansOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.plans ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title="Roadmap & Plans"
          >
            <Map size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Calendar Toggle Button */}
        {/* {showCalendar && (
          <button
            onClick={toggleCalendar}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isCalendarOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.calendar ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title="Calendar"
          >
            <Calendar size={20} className="sm:w-6 sm:h-6" />
          </button>
        )} */}

        {/* Task Manager Toggle Button */}
        {/* {showTasks && (
          <button
            onClick={toggleTaskManager}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isTaskManagerOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.tasks ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title="Toggle Tasks"
          >
            <ListTodo size={20} className="sm:w-6 sm:h-6" />
          </button>
        )} */}

        {/* Stats Toggle Button */}
        {showStats && (
          <button
            onClick={toggleStats}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isStatsOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.stats ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title="Focus History"
          >
            <BarChart2 size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Stopwatch Toggle Button */}
        {showStopwatch && (
          <button
            onClick={toggleStopwatch}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isStopwatchOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.stopwatch ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title="Stopwatch"
          >
            <Clock size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Timer Toggle Button */}
        {showTimer && (
          <button
            onClick={toggleTimer}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isTimerOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.timer ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title="Session Timer"
          >
            <TimerIcon size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Notes Toggle Button */}
        {showNotes && (
          <button
            onClick={toggleNotes}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isNotesOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.notes ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title="Quick Notes"
          >
            <StickyNote size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Settings Toggle Button */}
        {showSettingsBtn && (
          <button
            onClick={toggleSettings}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all glass-btn ${isHidden && hideConfig.settingsBtn ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title="Settings"
          >
            <Settings size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
