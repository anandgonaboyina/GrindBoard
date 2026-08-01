'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDashboardStore } from '@/store/dashboardStore';
import { getLocalDateString } from '@/utils/date';
import { Timer, Clock, Flame } from 'lucide-react';

export default function BigClock() {
  const [time, setTime] = useState<Date | null>(null);
  const history = useDashboardStore((state) => state.history);
  const toggleHide = useDashboardStore((state) => state.toggleHide);
  const currentBgType = useDashboardStore((state) => state.currentBgType);
  const isTimetableOpen = useDashboardStore((state) => state.isTimetableOpen);
  const is24HourClock = useDashboardStore((state) => state.is24HourClock);
  const toggle24HourClock = useDashboardStore((state) => state.toggle24HourClock);
  const showClock = useDashboardStore((state) => state.showClock);
  const showTodayWork = useDashboardStore((state) => state.showTodayWork);
  const clockScale = useDashboardStore((state) => state.clockScale || 1);

  const timerEndAt = useDashboardStore((state) => state.timerEndAt);
  const deadlines = useDashboardStore((state) => state.deadlines);
  const deadlineAlertDays = useDashboardStore((state) => state.deadlineAlertDays);
  const dismissedDeadlineAlerts = useDashboardStore((state) => state.dismissedDeadlineAlerts);
  const isDeadlinesCollapsed = useDashboardStore((state) => state.isDeadlinesCollapsed);
  const setIsDeadlinesCollapsed = useDashboardStore((state) => state.setIsDeadlinesCollapsed);
  const theme = useDashboardStore((state) => state.theme);
  const timerPausedLeft = useDashboardStore((state) => state.timerPausedLeft);
  const stopwatchStartTime = useDashboardStore((state) => state.stopwatchStartTime);

  const [isMobile, setIsMobile] = useState(false);

  const [activeTimerSecs, setActiveTimerSecs] = useState<number | null>(null);
  const [activeStopwatchSecs, setActiveStopwatchSecs] = useState<number | null>(null);

  const baseHideConfig = useDashboardStore((state) => state.hideConfig);
  const mobileHideConfig = useDashboardStore((state) => state.mobileHideConfig);
  const isHidden = useDashboardStore((state) => state.isHidden);
  const hideConfig = isMobile ? mobileHideConfig : baseHideConfig;

  // Detect mobile viewport size
  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const swipeStartX = useRef<number | null>(null);
  const wasSwiped = useRef<boolean>(false);

  const handlePillTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    wasSwiped.current = false;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    swipeStartX.current = clientX;
  };

  const handlePillTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (swipeStartX.current === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diffX = clientX - swipeStartX.current;

    if (Math.abs(diffX) > 10) {
      wasSwiped.current = true;
    }
  };

  const handlePillTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (swipeStartX.current === null) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diffX = clientX - swipeStartX.current;

    if (Math.abs(diffX) > 50) {
      // Long horizontal swipe toggles countdowns
      useDashboardStore.getState().setIsMobileCountdownsVisible(
        !useDashboardStore.getState().isMobileCountdownsVisible
      );
    }
    swipeStartX.current = null;
  };

  const timerEndAtRef = useRef(timerEndAt);
  const timerPausedLeftRef = useRef(timerPausedLeft);
  const stopwatchStartTimeRef = useRef(stopwatchStartTime);

  useEffect(() => {
    timerEndAtRef.current = timerEndAt;
    timerPausedLeftRef.current = timerPausedLeft;
    stopwatchStartTimeRef.current = stopwatchStartTime;
  }, [timerEndAt, timerPausedLeft, stopwatchStartTime]);

  useEffect(() => {
    // Initial set
    setTime(new Date());

    // Update every second for the clock, and faster for active pills
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    const activeInterval = setInterval(() => {
      const endAt = timerEndAtRef.current;
      const pausedLeft = timerPausedLeftRef.current;
      const stopStart = stopwatchStartTimeRef.current;

      setActiveTimerSecs(prev => {
        let next = null;
        if (endAt) {
          next = Math.max(0, Math.floor((endAt - Date.now()) / 1000));
        } else if (pausedLeft !== null) {
          next = pausedLeft;
        }
        return prev !== next ? next : prev;
      });

      setActiveStopwatchSecs(prev => {
        let next = null;
        if (stopStart) {
          next = Math.floor((Date.now() - stopStart) / 1000);
        }
        return prev !== next ? next : prev;
      });
    }, 250);

    return () => {
      clearInterval(interval);
      clearInterval(activeInterval);
    };
  }, []);

  const formatPillTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Avoid hydration mismatch by not rendering until mounted
  if (!time) {
    return (
      <div className={`flex flex-col justify-center pointer-events-none opacity-0 items-center`}>
        <div className="text-[5rem] md:text-[12rem] font-bold leading-none tracking-tighter">00:00</div>
      </div>
    );
  }

  // Format the time
  const rawHours = time.getHours();
  const displayHours = is24HourClock ? rawHours : (rawHours % 12 || 12);
  const hours = displayHours.toString().padStart(2, '0');

  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = rawHours >= 12 ? 'PM' : 'AM';

  const today = getLocalDateString();
  const todayMins = history[today] || 0;
  const focusHours = Math.floor(todayMins / 60);
  const focusMins = todayMins % 60;

  // Format "Xh Ym" or just "Ym" if no hours
  const focusText = focusHours > 0 ? `${focusHours}h ${focusMins}m` : `${focusMins}m`;

  // Time left today
  const eod = new Date(time);
  eod.setHours(23, 59, 59, 999);
  const msLeft = eod.getTime() - time.getTime();
  const hrsLeft = Math.floor(msLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
  const timeLeftText = `${hrsLeft}h ` + `${minsLeft}m left`;

  const clockVisible = showClock && !isMobile && (!isHidden || !hideConfig.clock);
  const focusPillVisible = showTodayWork && (!isHidden || !hideConfig.todayFocusPill);
  const timerPillVisible = (!isHidden || !hideConfig.timerPill);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const hasAlerts = deadlines.filter((d) => {
    const deadlineDate = new Date(d.date);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    const isToday = diffDays === 0;
    const alertKey = `${d.id}-${isToday ? 'today' : 'preview'}`;
    if (dismissedDeadlineAlerts.includes(alertKey)) return false;
    return diffDays === 0 || (diffDays > 0 && diffDays <= deadlineAlertDays);
  }).length > 0;

  return (
    <div 
      className={`flex flex-col w-fit h-fit justify-center pointer-events-none transition-all duration-700 items-center select-none`}
      style={{ zoom: clockScale }}
    >
      {clockVisible && (
        <>
          <div
            onClick={toggle24HourClock}
            className={`${(isTimetableOpen && !isMobile) ? 'text-[3.5rem] md:text-[5rem]' : 'text-[5.5rem] md:text-[12rem]'} tabular-nums font-bold leading-none tracking-tighter pointer-events-auto cursor-pointer transition-all duration-700 text-transparent bg-clip-text bg-gradient-to-b from-white/90 via-white/50 to-white/10 [-webkit-text-stroke:1px_rgba(255,255,255,0.5)] md:[-webkit-text-stroke:1.5px_rgba(255,255,255,0.5)] drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] md:drop-shadow-[0_30px_40px_rgba(0,0,0,0.8)] drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] md:drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:from-white hover:to-white/40`}
            title="Toggle 12/24 Hour Format"
          >
            {hours}:{minutes}
          </div>
          <div className={`${(isTimetableOpen && !isMobile) ? 'text-lg md:text-2xl' : 'text-2xl md:text-5xl'} font-semibold tracking-widest uppercase mt-1 md:mt-2 transition-all duration-700 flex items-baseline`}>
            <span className="tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white/90 to-white/30 [-webkit-text-stroke:1px_rgba(255,255,255,0.4)] drop-shadow-[0_15px_20px_rgba(0,0,0,0.7)]">{seconds}</span>
            {!is24HourClock && <span className="text-white/40 ml-1.5 md:ml-2 [-webkit-text-stroke:0px]">{ampm}</span>}
          </div>
        </>
      )}
      <div className='center pills fixed top-0 left-0 w-full flex justify-center  items-center'>
        {/* Top Floating Pills (Global Focus + Global Timer) */}
        {typeof document !== 'undefined' && createPortal(
          <div className="fixed top-0 left-0 right-0 z-[99999] flex items-start justify-center gap-3 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] translate-y-0 pointer-events-none mt-2 md:mt-3">
            <div
              className="flex flex-row items-center justify-center gap-1.5 md:gap-2 px-2 max-w-full w-full md:w-auto"
              onTouchStart={handlePillTouchStart}
              onTouchMove={handlePillTouchMove}
              onTouchEnd={handlePillTouchEnd}
              onMouseDown={handlePillTouchStart}
              onMouseMove={handlePillTouchMove}
              onMouseUp={handlePillTouchEnd}
              onMouseLeave={handlePillTouchEnd}
            >

              {/* 3 Dots for Mobile ONLY */}
              {isMobile && hasAlerts && isDeadlinesCollapsed && (
                <div
                  className={`fixed left-0 -top-1 mr-10 md:mr-0 flex md:hidden flex-row gap-1 cursor-pointer pointer-events-auto hover:scale-105 active:scale-95 transition-transform p-1 rounded-full border backdrop-blur-md shadow-lg shrink-0 ${theme === 'light' ? 'bg-white/60 border-red-500/30 shadow-red-500/10' : 'bg-black/40 border-red-500/20'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeadlinesCollapsed(false);
                  }}
                  title="Show Deadline Alerts"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-red-900/50" />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-red-900/50" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-red-900/50" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div className={`flex gap-1 ${timerPillVisible && (activeTimerSecs !== null || activeStopwatchSecs !== null) ? "ml-5 md:ml-0" : "ml-0"}`}>
                {/* Focus Pill for BOTH Desktop & Mobile */}
                {focusPillVisible && (
                  <div
                    onClick={(e) => {
                      if (wasSwiped.current) {
                        wasSwiped.current = false;
                        return;
                      }
                      toggleHide();
                    }}
                    title="Toggle Hidden Mode (Ctrl+H)"
                    className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-[13px] px-4 py-1.5 shadow-[0_5px_20px_rgba(59,130,246,0.3)] rounded-full bg-black/80 backdrop-blur-xl text-white border border-white/10 cursor-pointer pointer-events-auto shrink-0 transition-transform active:scale-95 hover:bg-black/90"
                  >
                    <div className="flex items-center justify-center bg-orange-500/20 w-5 h-5 md:w-6 md:h-6 rounded-full border-blue-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                      <Flame className="text-orange-400 w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                    </div>
                    <div className="flex items-center whitespace-nowrap">
                      <span>Today: <span className="text-white/90 font-bold ml-1">{focusText}</span></span>
                      <span className="text-white/30 mx-1.5 md:mx-2">|</span>
                      <span className="text-white/80">{timeLeftText}</span>
                    </div>
                  </div>
                )}

                {/* ACTIVE TIMER/STOPWATCH PILL FOR BOTH DESKTOP & MOBILE */}
                {timerPillVisible && (activeTimerSecs !== null || activeStopwatchSecs !== null) && (
                  <div
                    onClick={() => {
                      if (wasSwiped.current) {
                        wasSwiped.current = false;
                        return;
                      }
                      if (activeTimerSecs !== null) {
                        useDashboardStore.getState().toggleTimer();
                      } else if (activeStopwatchSecs !== null) {
                        useDashboardStore.getState().toggleStopwatch();
                      }
                    }}
                    className={`relative flex items-center gap-1.5 text-[12px] md:text-sm font-bold tracking-widest bg-black/80 border border-blue-500/40 backdrop-blur-xl px-4 py-1.5 rounded-full shadow-[0_5px_20px_rgba(59,130,246,0.3)] cursor-pointer pointer-events-auto active:scale-95 transition-transform shrink-0 hover:bg-black/90 ${activeTimerSecs !== null ? 'text-timer-pill' : 'text-stopwatch-pill'}`}
                  >
                    {activeTimerSecs !== null ? (
                      <Timer className="w-3.5 h-3.5 md:w-4 md:h-4 icon-timer-pill animate-pulse" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 icon-stopwatch-pill animate-pulse" />
                    )}
                    <span>
                      {activeTimerSecs !== null ? formatPillTime(activeTimerSecs) : formatPillTime(activeStopwatchSecs!)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}