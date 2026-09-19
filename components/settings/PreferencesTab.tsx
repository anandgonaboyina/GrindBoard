'use client';

import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Info, MonitorPlay, Sparkles, Layout, X, Clock, EyeOff, Hourglass, Bell, Monitor, Minus, Plus, RotateCcw, Smartphone, Sliders, ChevronUp, ChevronDown, MessageSquare, Timer as TimerIcon, Film, Flame, CheckSquare, Calendar, BarChart2, Map as MapIcon, StickyNote, CalendarDays, Image as ImageIcon } from 'lucide-react';

interface PreferencesTabProps {
  setInfoModalKey: (key: string) => void;
  setIsWallpaperTutorialOpen: (isOpen: boolean) => void;
}

export default React.memo(function PreferencesTab({ setInfoModalKey, setIsWallpaperTutorialOpen }: PreferencesTabProps) {
  const [showThemeNotice, setShowThemeNotice] = useState(false);

  const {
    setTheme,
    is24HourClock, toggle24HourClock,
    autoOpenCountdowns, setAutoOpenCountdowns,
    deadlineAlertDays, setDeadlineAlertDays, disableDeadlineLockOnToday, setDisableDeadlineLockOnToday,
    dashboardScale, setDashboardScale,
    mobileDashboardScale, setMobileDashboardScale,
    clockScale, setClockScale,
    dockScale, setDockScale,
    rightWidgetsOffset, setRightWidgetsOffset,
    dockOffset, setDockOffset,
    currentBgSrc, resetAllOffsets,
    lockedWidgets, toggleWidgetLock,
    showQuote, showTimer, showCountdowns, showVideoControls, showClock, showTasks, showCalendar, showTodayWork, showStats, showPlans, showNotes, showTimetable, showDock, showDeadlineAlerts, showBgSwitcher, showStopwatch, toggleVisibility,
    showManifestationBoard, setShowManifestationBoard,
    startTour, toggleSettings
  } = useDashboardStore();

  // Optimized: Memoize the massive array of widget toggles so it doesn't rebuild on every render
  const widgetToggles = useMemo(() => [
    { key: 'showQuote', icon: MessageSquare, label: 'Quote Box', color: 'text-purple-400', state: showQuote },
    { key: 'showTimer', icon: TimerIcon, label: 'Timer', color: 'text-yellow-400', state: showTimer },
    { key: 'showStopwatch', icon: Clock, label: 'Stopwatch', color: 'text-blue-400', state: showStopwatch },
    { key: 'showCountdowns', icon: Hourglass, label: 'Targets', color: 'text-indigo-400', state: showCountdowns },
    { key: 'showVideoControls', icon: Film, label: 'Media Ctrl', color: 'text-green-400', state: showVideoControls },
    { key: 'showTodayWork', icon: Flame, label: 'Today Focus', color: 'text-orange-400', state: showTodayWork },
    { key: 'showTasks', icon: CheckSquare, label: 'Tasks', color: 'text-orange-400', state: showTasks },
    { key: 'showCalendar', icon: Calendar, label: 'Calendar', color: 'text-pink-400', state: showCalendar },
    { key: 'showStats', icon: BarChart2, label: 'Stats Modal', color: 'text-emerald-400', state: showStats },
    { key: 'showPlans', icon: MapIcon, label: 'Roadmap', color: 'text-indigo-400', state: showPlans },
    { key: 'showNotes', icon: StickyNote, label: 'Quick Notes', color: 'text-yellow-300', state: showNotes },
    { key: 'showTimetable', icon: CalendarDays, label: 'Timetable', color: 'text-purple-400', state: showTimetable },
    { key: 'showDock', icon: Layout, label: 'Bottom Dock', color: 'text-cyan-300', state: showDock },
    { key: 'showDeadlineAlerts', icon: Bell, label: 'Deadline Alerts', color: 'text-red-400', state: showDeadlineAlerts },
    { key: 'showBgSwitcher', icon: ImageIcon, label: 'Bg Switch', color: 'text-green-300', state: showBgSwitcher },
    { key: 'showClock', icon: Clock, label: 'Big Clock', color: 'text-cyan-400', state: showClock },
  ], [
    showQuote, showTimer, showStopwatch, showCountdowns, showVideoControls, showTodayWork, showTasks, showCalendar, showStats, showPlans, showNotes, showTimetable, showDock, showDeadlineAlerts, showBgSwitcher, showClock
  ]);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-bold text-white/90">General Preferences</h3>
          <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words">Customize theme, UI scaling, layout positions, and individual widget visibility.</p>
        </div>
        <button onClick={() => setInfoModalKey('preferences')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-colors shrink-0">
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {/* PC Wallpaper Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/20 gap-2 shadow-sm">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/20 shrink-0">
              <MonitorPlay className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-[11px] md:text-xs font-bold text-white/90 flex items-center gap-1.5 flex-wrap">
                <span className="break-words">PC Wallpaper Tutorial</span>
                <span className="text-[8px] bg-blue-500/30 text-blue-200 border border-blue-500/40 px-1.5 py-0.5 rounded font-bold">Guide</span>
              </h4>
              <p className="text-[9px] md:text-[10px] text-white/60 leading-snug mt-0.5 break-words">
                Learn how to set up interactive desktop backgrounds via Lively.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWallpaperTutorialOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold text-[10px] shadow-sm active:scale-95 transition-all w-full sm:w-auto text-center shrink-0"
          >
            Setup Guide
          </button>
        </div>

        {/* Manifestation Button Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-900/20 to-orange-900/10 border border-amber-500/20 gap-3 shadow-sm">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-[11px] md:text-xs font-bold text-amber-200 break-words">Manifestation Button</h4>
              <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">
                Toggle visibility of the Vision Board launcher on your dashboard.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowManifestationBoard(!showManifestationBoard)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${showManifestationBoard ? 'bg-amber-500' : 'bg-white/20'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${showManifestationBoard ? 'translate-x-4.5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:gap-4">
        {/* SECTION 1: THEME & DISPLAY OPTIONS */}
        <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5 px-1 pb-1 border-b border-white/5">
            <Layout className="w-3.5 h-3.5" /> Theme & Formatting
          </h4>

          <div className="flex flex-col gap-1.5 mt-1">
            {/* Theme Toggle */}
            <div className="flex flex-col p-2.5 rounded-lg bg-black/40 border border-white/5 gap-2.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Layout className="text-purple-400 w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">Dashboard Theme</h5>
                    <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Dark Mode is optimized. Light & Auto modes are coming soon.</p>
                  </div>
                </div>
                <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 w-full sm:w-auto shrink-0 gap-1">
                  <button onClick={() => setTheme('dark')} className="flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold rounded-md bg-purple-500/80 text-white shadow-sm transition-all">Dark</button>
                  <button onClick={() => setShowThemeNotice(true)} className="flex-1 sm:flex-none px-2 py-1.5 text-[10px] font-bold rounded-md text-white/40 hover:bg-white/10 transition-all flex items-center justify-center gap-1">Light <span className="text-[7px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded border border-amber-500/30 leading-none">Soon</span></button>
                </div>
              </div>
              {showThemeNotice && (
                <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-200 flex items-start justify-between gap-2">
                  <span className="break-words leading-tight">Light and Auto themes will be available in a future update!</span>
                  <button onClick={() => setShowThemeNotice(false)} className="p-0.5 shrink-0 hover:bg-white/10 rounded"><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>

            {/* 24-hour clock */}
            <div className="flex flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Clock className="text-blue-300 w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">24-Hour Clock Format</h5>
                  <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Use military time (e.g., 14:00 instead of 2:00 PM).</p>
                </div>
              </div>
              <button onClick={toggle24HourClock} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${is24HourClock ? 'bg-blue-500' : 'bg-white/20'}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${is24HourClock ? 'translate-x-4.5' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Auto-Open Countdowns */}
            <div className="flex flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Hourglass className="text-indigo-400 w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">Auto-Open Countdowns</h5>
                  <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Automatically expand your target countdowns on startup.</p>
                </div>
              </div>
              <button onClick={() => setAutoOpenCountdowns(!autoOpenCountdowns)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${autoOpenCountdowns ? 'bg-indigo-500' : 'bg-white/20'}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoOpenCountdowns ? 'translate-x-4.5' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Deadline Alerts */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Bell className="text-yellow-400 w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">Deadline Alerts</h5>
                  <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Show popup modal as important deadlines approach.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto bg-black/40 p-1.5 rounded-lg border border-white/5">
                <span className="text-white/60 text-[9px] font-bold uppercase">Alert me</span>
                <input
                  type="number" min="0" max="30"
                  value={deadlineAlertDays}
                  onChange={(e) => setDeadlineAlertDays(parseInt(e.target.value) || 0)}
                  className="w-10 bg-black/60 border border-white/20 rounded p-1 text-center text-white outline-none focus:border-yellow-400 font-bold text-[10px]"
                />
                <span className="text-white/60 text-[9px] font-bold uppercase">days before</span>
              </div>
            </div>
            {/* Deadline Auto-Lock */}
            <div className="flex flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Bell className="text-yellow-400 w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">Unlock Today's Deadlines</h5>
                  <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Allow closing the deadline alert even when a deadline is due today.</p>
                </div>
              </div>
              <button onClick={() => setDisableDeadlineLockOnToday(!disableDeadlineLockOnToday)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${disableDeadlineLockOnToday ? 'bg-yellow-500' : 'bg-white/20'}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${disableDeadlineLockOnToday ? 'translate-x-4.5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: SIZING & SCALING */}
        <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 px-1 pb-1 border-b border-white/5">
            <Sliders className="w-3.5 h-3.5" /> UI Scaling Controls
          </h4>

          <div className="flex flex-col gap-1.5 mt-1">
            {/* Desktop UI Scale */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Monitor className="text-emerald-400 w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">Desktop UI Scale</h5>
                  <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Scale the entire dashboard layout for larger displays.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 w-full xl:w-auto justify-end">
                <div className="flex bg-black/60 border border-white/10 rounded-md p-1 gap-0.5">
                  {[0.75, 1.0, 1.25].map(s => (
                    <button key={s} onClick={() => setDashboardScale(s)} className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${Math.abs((dashboardScale || 1) - s) < 0.01 ? 'bg-emerald-500/80 text-white' : 'text-white/50 hover:bg-white/10'}`}>
                      {Math.round(s * 100)}%
                    </button>
                  ))}
                </div>
                <div className="flex items-center bg-black/60 border border-white/10 rounded-md p-1">
                  <button onClick={() => setDashboardScale(Math.max(0.5, Math.round(((dashboardScale || 1) - 0.05) * 100) / 100))} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><Minus className="w-3 h-3" /></button>
                  <span className="font-mono text-[10px] text-emerald-300 font-bold px-1.5">{Math.round((dashboardScale || 1) * 100)}%</span>
                  <button onClick={() => setDashboardScale(Math.min(1.5, Math.round(((dashboardScale || 1) + 0.05) * 100) / 100))} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
                </div>
                {Math.abs((dashboardScale || 1) - 1.0) >= 0.01 && (
                  <button onClick={() => setDashboardScale(1.0)} className="p-1.5 hover:bg-white/10 border border-white/5 rounded text-white/50 hover:text-white transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>

            {/* Mobile UI Scale */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Smartphone className="text-sky-400 w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">Mobile UI Scale</h5>
                  <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Independent scale adjustment for smaller touch screens.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 w-full xl:w-auto justify-end">
                <div className="flex bg-black/60 border border-white/10 rounded-md p-1 gap-0.5">
                  {[0.75, 1.0, 1.25].map(s => (
                    <button key={s} onClick={() => setMobileDashboardScale(s)} className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${Math.abs((mobileDashboardScale || 1) - s) < 0.01 ? 'bg-sky-500/80 text-white' : 'text-white/50 hover:bg-white/10'}`}>
                      {Math.round(s * 100)}%
                    </button>
                  ))}
                </div>
                <div className="flex items-center bg-black/60 border border-white/10 rounded-md p-1">
                  <button onClick={() => setMobileDashboardScale(Math.max(0.5, Math.round(((mobileDashboardScale || 1) - 0.05) * 100) / 100))} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><Minus className="w-3 h-3" /></button>
                  <span className="font-mono text-[10px] text-sky-300 font-bold px-1.5">{Math.round((mobileDashboardScale || 1) * 100)}%</span>
                  <button onClick={() => setMobileDashboardScale(Math.min(1.5, Math.round(((mobileDashboardScale || 1) + 0.05) * 100) / 100))} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
                </div>
                {Math.abs((mobileDashboardScale || 1) - 1.0) >= 0.01 && (
                  <button onClick={() => setMobileDashboardScale(1.0)} className="p-1.5 hover:bg-white/10 border border-white/5 rounded text-white/50 hover:text-white transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>

            {/* Components Scale (Clock & Dock) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              <div className="flex flex-col p-2.5 rounded-lg bg-black/40 border border-white/5 gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Clock className="text-blue-400 w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">Big Clock Size</h5>
                    <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Scale the main clock widget.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 bg-black/40 p-1.5 rounded-md border border-white/5">
                  <span className="text-[9px] text-white/40 font-bold">50%</span>
                  <input type="range" min="0.5" max="1.5" step="0.05" value={clockScale} onChange={(e) => setClockScale(parseFloat(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                  <span className="text-[9px] text-white/40 font-bold">150%</span>
                </div>
              </div>

              <div className="flex flex-col p-2.5 rounded-lg bg-black/40 border border-white/5 gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Sliders className="text-purple-400 w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">Bottom Dock Size</h5>
                    <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Resize the global bottom dock.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-md p-1 w-fit mt-1">
                  <button onClick={() => setDockScale(Math.max(0.5, Math.round(((dockScale || 1) - 0.05) * 100) / 100))} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><Minus className="w-3 h-3" /></button>
                  <span className="font-mono text-[10px] text-purple-300 font-bold px-3">{Math.round((dockScale || 1) * 100)}%</span>
                  <button onClick={() => setDockScale(Math.min(1.5, Math.round(((dockScale || 1) + 0.05) * 100) / 100))} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: TOOLBAR & OFFSETS */}
        <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 px-1 pb-1 border-b border-white/5">
            <ChevronUp className="w-3.5 h-3.5" /> Positional Offsets
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-1">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Layout className="text-cyan-400 w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">Right Toolbar</h5>
                  <p className="text-[9px] text-white/50 leading-snug mt-0.5 break-words">Vertical offset.</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 bg-black/60 border border-white/10 rounded-md p-1">
                <button onClick={() => setRightWidgetsOffset(Math.max(0, rightWidgetsOffset - 10))} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                <span className="font-bold text-[10px] w-6 text-center text-cyan-300">{rightWidgetsOffset}</span>
                <button onClick={() => setRightWidgetsOffset(rightWidgetsOffset + 10)} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Layout className="text-purple-400 w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h5 className="font-bold text-[11px] md:text-xs text-white/90 break-words">Bottom Dock</h5>
                  <p className="text-[9px] text-white/50 leading-snug mt-0.5 break-words">Vertical offset.</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 bg-black/60 border border-white/10 rounded-md p-1">
                <button onClick={() => setDockOffset(dockOffset - 10)} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                <span className="font-bold text-[10px] w-6 text-center text-purple-300">{dockOffset}</span>
                <button onClick={() => setDockOffset(dockOffset + 10)} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: DRAG LOCKING */}
        <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-white/5">
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Widget Drag Lock
            </h4>
            <button onClick={() => { if (currentBgSrc) resetAllOffsets(currentBgSrc); }} className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded text-[9px] font-bold transition-all active:scale-95 break-words">
              Reset Default Positions
            </button>
          </div>
          <p className="text-[9px] md:text-[10px] text-white/50 px-1 leading-snug break-words">Lock specific elements to prevent accidental dragging on your screen.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mt-1">
            {[{ key: 'clock', icon: Clock, label: 'Main Clock', color: 'text-blue-400' }].map(({ key, icon: Icon, label, color }) => (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <Icon className={`${color} w-3.5 h-3.5 shrink-0`} />
                  <span className="text-[9px] md:text-[10px] font-bold break-words">{label}</span>
                </div>
                <button onClick={() => toggleWidgetLock(key as any)} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0 ${lockedWidgets.includes(key as any) ? 'bg-blue-500' : 'bg-white/20'}`}>
                  <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${lockedWidgets.includes(key as any) ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: WIDGET VISIBILITY */}
        <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 px-1 pb-1 border-b border-white/5">
            <EyeOff className="w-3.5 h-3.5" /> Widget Visibility Toggles
          </h4>
          <p className="text-[9px] md:text-[10px] text-white/50 px-1 leading-snug break-words">Turn individual dashboard components on or off globally.</p>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 mt-1">
            {widgetToggles.map(({ key, icon: Icon, label, color, state }) => (
              <div key={key} className="flex items-center justify-between p-2 md:p-2.5 rounded-lg bg-black/40 border border-white/5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <Icon className={`${color} w-3.5 h-3.5 shrink-0`} />
                  <span className="text-[9px] md:text-[10px] font-bold text-white/90 break-words">{label}</span>
                </div>
                <button onClick={() => toggleVisibility(key as any)} className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors shrink-0 ${state ? 'bg-blue-500' : 'bg-white/20'}`}>
                  <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${state ? 'translate-x-4.5' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Guided Tour Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-indigo-900/30 to-purple-900/20 border border-indigo-500/20 gap-2 shadow-sm">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-[11px] md:text-xs font-bold text-white/90 flex items-center gap-1.5 flex-wrap">
                <span className="break-words">Guided Tour</span>
                <span className="text-[8px] bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 px-1.5 py-0.5 rounded font-bold">Interactive</span>
              </h4>
              <p className="text-[9px] md:text-[10px] text-white/60 leading-snug mt-0.5 break-words">
                Need a refresher? Replay the guided tour to learn dashboard controls.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              startTour();
              toggleSettings();
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-lg font-bold text-[10px] shadow-sm active:scale-95 transition-all w-full sm:w-auto text-center shrink-0"
          >
            Replay Tour
          </button>
        </div>
      </div>
    </div>
  );
});