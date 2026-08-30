'use client';

import { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Map, ListTodo, BarChart2, StickyNote, Settings, Clock, Timer as TimerIcon, Calendar, EyeOff, Image as ImageIcon } from 'lucide-react';
import Tooltip from './Tooltip';

export default function RightToolbar() {
  const isHidden = useDashboardStore((state) => state.isHidden);

  const isPlansOpen = useDashboardStore((state) => state.isPlansOpen);
  const togglePlans = useDashboardStore((state) => state.togglePlans);

  const isTaskManagerOpen = useDashboardStore((state) => state.isTaskManagerOpen);
  const toggleTaskManager = useDashboardStore((state) => state.toggleTaskManager);
  const showTasks = useDashboardStore((state) => state.showTasks);

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

  const showPlans = useDashboardStore((state) => state.showPlans);
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
      className="relative flex flex-col gap-2 md:gap-3 pointer-events-auto transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] translate-x-0"
    >

      <div
        className={`relative z-20 flex flex-col gap-2 md:gap-3`}
      >
        {/* Panic Button - Mobile Only */}
        <Tooltip text={isHidden ? "Unhide Interface" : (panicButtonMode === 'redirect' ? "Panic! Launch App" : "Panic! Hide Interface")} position="left">
          <button
            onClick={handlePanic}
            className={`lg:hidden p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-red-500/30 bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 shadow-xl shadow-red-500/10 transition-all backdrop-blur-xl ${isHidden && panicButtonMode === 'hide' ? 'opacity-0' : 'opacity-100'}`}
          >
            <EyeOff size={20} className="sm:w-6 sm:h-6" />
          </button>
        </Tooltip>

        {/* Plans Toggle Button */}
        {showPlans && (
          <Tooltip text="Roadmap & Plans" position="left">
            <button
              onClick={togglePlans}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isPlansOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.plans ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <Map size={20} className="sm:w-6 sm:h-6" />
            </button>
          </Tooltip>
        )}
        {/* removed as from right toolbar since kept as edge peek toggle */}
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
          <Tooltip text="Focus History" position="left">
            <button
              onClick={toggleStats}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isStatsOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.stats ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <BarChart2 size={20} className="sm:w-6 sm:h-6" />
            </button>
          </Tooltip>
        )}

        {/* Stopwatch Toggle Button */}
        {showStopwatch && (
          <Tooltip text="Stopwatch" position="left">
            <button
              onClick={toggleStopwatch}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isStopwatchOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.stopwatch ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <Clock size={20} className="sm:w-6 sm:h-6" />
            </button>
          </Tooltip>
        )}

        {/* Timer Toggle Button */}
        {showTimer && (
          <Tooltip text="Session Timer" position="left">
            <button
              onClick={toggleTimer}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isTimerOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.timer ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <TimerIcon size={20} className="sm:w-6 sm:h-6" />
            </button>
          </Tooltip>
        )}

        {/* Notes Toggle Button */}
        {showNotes && (
          <Tooltip text="Quick Notes" position="left">
            <button
              onClick={toggleNotes}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all ${isNotesOpen ? 'glass-btn-active' : 'glass-btn'} ${isHidden && hideConfig.notes ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <StickyNote size={20} className="sm:w-6 sm:h-6" />
            </button>
          </Tooltip>
        )}

        {/* Settings Toggle Button */}
        {showSettingsBtn && (
          <Tooltip text="Settings" position="left">
            <button
              onClick={toggleSettings}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl transition-all glass-btn ${isHidden && hideConfig.settingsBtn ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <Settings size={20} className="sm:w-6 sm:h-6" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
