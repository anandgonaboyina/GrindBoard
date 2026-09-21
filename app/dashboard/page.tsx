"use client";

import { useEffect, useState, useRef } from "react";
import { 
  ChevronDown, CalendarDays, Calendar, ListTodo, 
  ImageIcon, Newspaper, Trophy, Users, Hourglass, Sparkles, Loader2 
} from "lucide-react";

// Components
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
import DayStartModal from "@/components/modals/DayStartModal";
import DraggableClock from "@/components/DraggableClock";
import SettingsModal from "@/components/SettingsModal";
import RightToolbar from "@/components/RightToolbar";
import DeadlineTickerWidget from "@/components/DeadlineTickerWidget";
import StartupUpdateChecker from "@/components/StartupUpdateChecker";
import FriendRequestPopup from "@/components/FriendRequestPopup";
import GroupRequestPopup from "@/components/GroupRequestPopup";
import GlobalBroadcastPopup from "@/components/GlobalBroadcastPopup";
import VideoBackground from "@/components/VideoBackground";
import LoadingScreen from "@/components/LoadingScreen";
import NewsModal from "@/components/NewsModal";
import ConnectionStatusToast from "@/components/ConnectionStatusToast";
import Tooltip from "@/components/Tooltip";
import GuidedTour from "@/components/GuidedTour";
import ManifestationBoard from "@/components/ManifestationBoard";

// Logic & Stores
import { useDashboardStore } from "@/store/dashboardStore";
import { useTaskStore } from "@/store/taskStore";
import { useTimetableStore } from "@/store/timetableStore";
import { useNoteStore } from "@/store/noteStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useDashboardLogic } from "@/hooks/useDashboardLogic";

export default function Dashboard() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeCountdownIndex, setActiveCountdownIndex] = useState(1);
  const dragStartX = useRef<number | null>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);

  // Hydration - MUST BE AT THE TOP AND UNCONDITIONAL
  const _hasHydratedDashboard = useDashboardStore((state) => state._hasHydrated);
  const _hasHydratedTask = useTaskStore((state) => state._hasHydrated);
  const _hasHydratedTimetable = useTimetableStore((state) => state._hasHydrated);
  const _hasHydratedNote = useNoteStore((state) => state._hasHydrated);
  const _hasHydratedSettings = useSettingsStore((state) => state._hasHydrated);

  const _hasHydrated = _hasHydratedDashboard && _hasHydratedTask && _hasHydratedTimetable && _hasHydratedNote && _hasHydratedSettings;

  // Inject decoupled background logic
  const { cycleWallpaper, handleCalendarExpand } = useDashboardLogic(isMobile, _hasHydrated);

  // Configuration
  const isHidden = useDashboardStore((state) => state.isHidden);
  const isPanicHidden = useDashboardStore((state) => state.isPanicHidden);
  const mobileHideConfig = useDashboardStore((state) => state.mobileHideConfig);
  const baseHideConfig = useDashboardStore((state) => state.hideConfig);
  const hideConfig = isMobile ? mobileHideConfig : baseHideConfig;

  // Layout & Visibility
  const dashboardScale = useDashboardStore((state) => state.dashboardScale || 1);
  const mobileDashboardScale = useDashboardStore((state) => state.mobileDashboardScale || 1);
  const activeDashboardScale = isMobile ? mobileDashboardScale : dashboardScale;
  const dockScale = useDashboardStore((state) => state.dockScale || 1);
  const dockOffset = useDashboardStore((state) => state.dockOffset || 0);
  const rightWidgetsOffset = useDashboardStore((state) => state.rightWidgetsOffset);
  const widgetZIndices = useDashboardStore((state) => state.widgetZIndices) || {};
  const currentBgType = useDashboardStore((state) => state.currentBgType);
  const countdowns = useDashboardStore((state) => state.countdowns);

  // Modals & Drawers
  const isSettingsOpen = useDashboardStore((state) => state.isSettingsOpen);
  const isTimetableOpen = useDashboardStore((state) => state.isTimetableOpen);
  const isCalendarOpen = useDashboardStore((state) => state.isCalendarOpen);
  const isTaskManagerOpen = useDashboardStore((state) => state.isTaskManagerOpen);
  const isNewsOpen = useDashboardStore((state) => state.isNewsOpen);
  const isMobileCountdownsVisible = useDashboardStore((state) => state.isMobileCountdownsVisible);
  const hasUnreadNews = useDashboardStore((state) => state.hasUnreadNews);
  const isAlarmPlaying = useDashboardStore((state) => state.isAlarmPlaying);

  // Toggles & Actions
  const toggleManifestationOpen = useDashboardStore((state) => state.toggleManifestationOpen);
  const setIsTimetableOpen = useDashboardStore((state) => state.setIsTimetableOpen);
  const bringToFront = useDashboardStore((state) => state.bringToFront);

  // Component Visibilities
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
  const showBgSwitcher = useDashboardStore((state) => state.showBgSwitcher);
  const showManifestationBoard = useDashboardStore((state) => state.showManifestationBoard);
  const showSettingsBtn = useDashboardStore((state) => state.showSettingsBtn);

  const [showDemoRegisterBtn, setShowDemoRegisterBtn] = useState(false);
  const [isRedirectingToRegister, setIsRedirectingToRegister] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token || token === 'null') {
      window.location.href = '/';
      return;
    }

    const username = localStorage.getItem('dashboard_username');
    if (username?.toLowerCase() === process.env.DEMO_USERNAME) {
      const now = Date.now();
      let sessionStart = parseInt(localStorage.getItem('demo_session_start') || '0', 10);
      if (!sessionStart || isNaN(sessionStart)) {
        sessionStart = now;
        localStorage.setItem('demo_session_start', sessionStart.toString());
      }
      
      const timeElapsed = now - sessionStart;
      const timeRemaining = Math.max(0, (25 * 60 * 1000) - timeElapsed);

      const performDemoLogout = () => {
        Object.keys(localStorage).forEach(key => {
          if (
            key.startsWith('dashboard') || 
            key.startsWith('tasks') || 
            key.startsWith('notes') || 
            key.startsWith('timetable') || 
            key.startsWith('settings')
          ) {
            localStorage.removeItem(key);
          }
        });
        localStorage.removeItem('stopwatch_paused_secs');
        localStorage.removeItem('stopwatch_last_active');
        localStorage.removeItem('demo_session_start');
        fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: '', username: '' })
        }).catch(() => {});
        
        import('@/lib/indexedDB').then(({ clearAllMediaFromDB }) => {
          clearAllMediaFromDB().catch(console.error).finally(() => {
            window.location.href = '/';
          });
        });
      };

      if (timeRemaining === 0) {
        performDemoLogout();
        return;
      }

      const demoLogoutTimeout = setTimeout(performDemoLogout, timeRemaining);

      const demoPromptInterval = setInterval(() => {
        setShowDemoRegisterBtn(true);
      }, 5 * 60 * 1000); // every 5 minutes

      return () => {
        clearTimeout(demoLogoutTimeout);
        clearInterval(demoPromptInterval);
      };
    }
  }, []);

  // ALL HOOKS MUST BE ABOVE THIS LINE
  const bottomRightZ = Math.max(50, widgetZIndices.tasks || 50, widgetZIndices.stopwatch || 50, widgetZIndices.timer || 50, widgetZIndices.toolbar || 50);

  return (
    <>
      {(!_hasHydrated || isOverlayVisible) && <LoadingScreen onFinished={() => setIsOverlayVisible(false)} />}
      
      {_hasHydrated && (
      <main className="relative overflow-hidden w-full flex-1" style={{ zoom: activeDashboardScale }}>
        <ConnectionStatusToast />
        <VideoBackground />

        {/* Background Switcher Controls */}
        {!isPanicHidden && (!isHidden || !hideConfig.bgSwitcher) && showBgSwitcher && (
          <div className="fixed top-10 left-3 z-[40] flex flex-col items-center gap-2">
            <button data-tour="wallpaper-btn" onClick={cycleWallpaper} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-white/20 shadow-xl transition-all glass-btn hidden md:flex items-center justify-center group">
              <ImageIcon className="w-4 h-4" />
              <Tooltip text="Next Wallpaper" position="right" />
            </button>
          </div>
        )}

        <div className={isPanicHidden ? 'hidden' : 'block'}>
          
          {showManifestationBoard && (
            <div data-tour="manifestation-toggle"
              className={`fixed z-[90] sm:z-[40] cursor-pointer flex flex-col items-center justify-center transition-all duration-700 text-amber-300 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] group left-0 top-[calc(26vh-46px)] sm:left-auto sm:top-10 sm:right-3 glass-btn sm:bg-transparent sm:glass-btn-none border-l-0 sm:border-l sm:border sm:border-amber-500/40 rounded-l-none rounded-r-xl sm:rounded-xl p-1.5 py-2 sm:p-2 ${(!isHidden || !hideConfig.manifestation) ? 'block' : 'hidden'} ${isCalendarOpen ? 'max-sm:-translate-x-[120%]' : 'translate-x-0'}`}
              onClick={toggleManifestationOpen}>
              <Sparkles className="w-5 h-5 sm:w-4 sm:h-4 animate-pulse text-amber-300" />
            </div>
          )}

          {/* Independent UI Components */}
          {showQuote && <div className={(!isHidden || !hideConfig.quote) ? 'block' : 'hidden'}><QuotePopup /></div>}
          {showStats && <div className={(!isHidden || !hideConfig.stats) ? 'block' : 'hidden'}><StatsModal /></div>}
          <DayStartModal />
          {showNotes && <div className={(!isHidden || !hideConfig.notes) ? 'block' : 'hidden'}><NotesManager /></div>}
          {showPlans && <div className={(!isHidden || !hideConfig.plans) ? 'block' : 'hidden'}><RoadmapManager /></div>}

          {/* Bottom Left Stack: Target Countdowns & Deadline Ticker */}
          <div style={{ bottom: isMobile ? `${148 + dockOffset}px` : `${80 + dockOffset}px`, zIndex: 50 }} className="fixed left-1.5 sm:left-4 flex flex-col items-start gap-2.5 pointer-events-none transition-all duration-300">
{showCountdowns && (
              <div 
                className={(!isHidden || !hideConfig.countdowns) ? `pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${!isMobileCountdownsVisible ? '-translate-x-[150%] opacity-0 pointer-events-none h-0 overflow-hidden mb-0' : 'translate-x-0 opacity-100'}` : 'hidden'}
                onTouchStart={(e) => { dragStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (dragStartX.current !== null && dragStartX.current - e.changedTouches[0].clientX > 30) {
                    useDashboardStore.setState({ isMobileCountdownsVisible: false });
                  }
                  dragStartX.current = null;
                }}
                onTouchCancel={() => { dragStartX.current = null; }}
                onMouseDown={(e) => { dragStartX.current = e.clientX; }}
                onMouseUp={(e) => {
                  if (dragStartX.current !== null && dragStartX.current - e.clientX > 30) {
                    useDashboardStore.setState({ isMobileCountdownsVisible: false });
                  }
                  dragStartX.current = null;
                }}
                onMouseLeave={(e) => {
                  if (dragStartX.current !== null && dragStartX.current - e.clientX > 30) {
                    useDashboardStore.setState({ isMobileCountdownsVisible: false });
                  }
                  dragStartX.current = null;
                }}
              >
                {countdowns.length > 0 ? (() => {
                  const safeIndex = Math.min(activeCountdownIndex, Math.max(0, countdowns.length - 1));
                  return <Countdown key={countdowns[safeIndex].id} id={countdowns[safeIndex].id} hasPrev={safeIndex > 0} hasNext={safeIndex < countdowns.length - 1} onPrev={() => setActiveCountdownIndex(p => p - 1)} onNext={() => setActiveCountdownIndex(p => p + 1)} onAddNew={() => setActiveCountdownIndex(countdowns.length)} currentIndex={safeIndex} totalCount={countdowns.length} />;
                })() : (<Countdown totalCount={0} onAddNew={() => setActiveCountdownIndex(0)} />)}
              </div>
            )}
            {showDeadlineAlerts && (
              <div className={(!isHidden || !hideConfig.deadlineAlerts) ? "pointer-events-auto" : "hidden"}><DeadlineTickerWidget /></div>
            )}
          </div>

          <div className="absolute inset-0 pointer-events-none z-50"></div>

          {/* Left Drawers */}
          <>
            {showCalendar && (
              <div data-tour="calendar-drawer" onClick={handleCalendarExpand} className={`fixed left-0 top-[26vh] sm:top-[20vh] glass-btn border-l-0 rounded-l-none rounded-r-xl sm:rounded-r-2xl p-1.5 py-2 sm:p-2.5 sm:py-3 z-[90] cursor-pointer shadow-xl flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group ${(!isHidden || !hideConfig.calendar) ? 'block' : 'hidden'} ${isCalendarOpen ? '-translate-x-[120%]' : 'translate-x-0'}`}>
                <Calendar size={20} className="sm:w-6 sm:h-6" /><Tooltip text="Open Calendar" position="right" />
              </div>
            )}

            <div data-tour="leaderboard-drawer" onClick={(e) => { e.stopPropagation(); useDashboardStore.setState({ isSettingsOpen: true, settingsActiveTab: 'connect', connectInitialTab: 'leaderboard' }); }} className={`fixed left-0 top-[calc(26vh+46px)] sm:top-[28vh] glass-btn border-l-0 rounded-l-none rounded-r-xl sm:rounded-r-2xl p-1.5 py-2 sm:p-2.5 sm:py-3 cursor-pointer shadow-xl flex items-center justify-center z-40 group transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCalendarOpen || isSettingsOpen ? '-translate-x-[120%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'} `}>
              <Trophy size={20} className="sm:w-6 sm:h-6" /><Tooltip text="Open Leaderboard" position="right" />
            </div>

            <div data-tour="groups-drawer" onClick={(e) => { e.stopPropagation(); useDashboardStore.setState({ isSettingsOpen: true, settingsActiveTab: 'connect', connectInitialTab: 'groups' }); }} className={`fixed left-0 top-[calc(26vh+92px)] sm:top-[36vh] glass-btn border-l-0 rounded-l-none rounded-r-xl sm:rounded-r-2xl p-1.5 py-2 sm:p-2.5 sm:py-3 z-[90] cursor-pointer shadow-xl flex items-center justify-center group transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCalendarOpen || isSettingsOpen ? '-translate-x-[120%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
              <Users size={20} className="sm:w-6 sm:h-6" /><Tooltip text="Open Groups" position="right" />
            </div>

            <div onClick={() => useDashboardStore.getState().setIsMobileCountdownsVisible(true)} className={`fixed left-0 top-[calc(26vh+138px)] sm:top-[44vh] glass-btn border-l-0 rounded-l-none rounded-r-xl sm:rounded-r-2xl p-1.5 py-2 sm:p-2.5 sm:py-3 z-[50] cursor-pointer shadow-xl flex items-center justify-center group transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${((!isHidden || !hideConfig.countdowns) && showCountdowns) ? 'block' : 'hidden'} ${isMobileCountdownsVisible ? '-translate-x-[120%]' : 'translate-x-0'}`}>
              <Hourglass size={20} className="sm:w-6 sm:h-6 text-indigo-400 animate-pulse" /><Tooltip text="Open Target Countdowns" position="right" />
            </div>

            <div onTouchStart={(e) => { dragStartX.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (dragStartX.current !== null && dragStartX.current - e.changedTouches[0].clientX > 30) { useDashboardStore.setState({ isCalendarOpen: false }); } dragStartX.current = null; }} onTouchCancel={() => { dragStartX.current = null; }} onMouseDown={(e) => { dragStartX.current = e.clientX; }} onMouseUp={(e) => { if (dragStartX.current !== null && dragStartX.current - e.clientX > 30) { useDashboardStore.setState({ isCalendarOpen: false }); } dragStartX.current = null; }} onMouseLeave={(e) => { if (dragStartX.current !== null && dragStartX.current - e.clientX > 30) { useDashboardStore.setState({ isCalendarOpen: false }); } dragStartX.current = null; }} className={`fixed top-[100px] left-0 h-auto max-h-[calc(100vh-140px)] w-auto max-w-[85vw] pb-4 pl-2 pr-0 sm:pl-4 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-[100] group select-none ${isCalendarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-[calc(100%+20px)] pointer-events-none'}`}>
              <div className={`w-full h-full relative ${!isCalendarOpen ? 'pointer-events-none' : ''}`}><MiniCalendar /></div>
            </div>
          </>

          {/* Right Drawers */}
          {showTasks && (
            <>
              <div data-tour="task-drawer" onClick={() => { if (!isTaskManagerOpen) useDashboardStore.setState({ isTaskManagerOpen: true }) }} className={`fixed right-0 top-[20vh] glass-btn border-r-0 rounded-r-none rounded-l-xl sm:rounded-l-2xl p-1.5 py-2 sm:p-2.5 sm:py-3 z-[90] cursor-pointer shadow-xl flex items-center justify-center group transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${(!isHidden || !hideConfig.tasks) ? 'block' : 'hidden'} ${isTaskManagerOpen ? 'translate-x-[120%]' : 'translate-x-0'}`}>
                <ListTodo size={20} className="sm:w-6 sm:h-6" /><Tooltip text="Open Tasks" position="left" />
              </div>
              <div onTouchStart={(e) => { dragStartX.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (dragStartX.current !== null && e.changedTouches[0].clientX - dragStartX.current > 30) { useDashboardStore.setState({ isTaskManagerOpen: false }); } dragStartX.current = null; }} onTouchCancel={() => { dragStartX.current = null; }} onMouseDown={(e) => { dragStartX.current = e.clientX; }} onMouseUp={(e) => { if (dragStartX.current !== null && e.clientX - dragStartX.current > 30) { useDashboardStore.setState({ isTaskManagerOpen: false }); } dragStartX.current = null; }} onMouseLeave={(e) => { if (dragStartX.current !== null && e.clientX - dragStartX.current > 30) { useDashboardStore.setState({ isTaskManagerOpen: false }); } dragStartX.current = null; }} className={`fixed top-[140px] right-0 h-auto max-h-[calc(100vh-200px)] w-[320px] sm:w-[340px] max-w-[85vw] pb-4 pr-2 pl-0 sm:pr-4 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-[100] ${isTaskManagerOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'}`}>
                <div className="w-full h-full relative"><TaskManager /></div>
              </div>
            </>
          )}

          <div className={(!isHidden || !hideConfig.settingsBtn) ? 'block' : 'hidden'}>

            <NewsModal />
          </div>

          {/* Center Display Components */}
          <div className={(showClock || showTodayWork || showTimer || showStopwatch) ? 'block' : 'hidden'}>
            <div style={{ zIndex: widgetZIndices.clock || 50 }} className={`absolute pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] origin-top md:origin-top-left ${isTimetableOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'} ${currentBgType === 'image' ? 'top-32 left-1/2 -translate-x-1/2 translate-y-0 scale-[0.85] md:scale-100 md:top-40 origin-top' : 'top-32 left-1/2 -translate-x-1/2 md:top-40 md:left-10 md:translate-x-0 translate-y-0 scale-[0.85] md:scale-100'}`}>
              <DraggableClock><BigClock /></DraggableClock>
            </div>
          </div>

          {showTimetable && (
            <div className={(!isHidden || !hideConfig.timetable) ? 'block' : 'hidden'}>
              <div style={{ zIndex: widgetZIndices.timetable || 50, bottom: isMobile ? `${96 + dockOffset}px` : `${160 + dockOffset}px` }} className="block absolute left-1/2 -translate-x-1/2 w-[calc(100vw)] md:w-auto flex flex-col items-center scale-[0.9] md:scale-100 origin-bottom pointer-events-none transition-all duration-300">
                <div onPointerDown={() => bringToFront('timetable')} className={`flex flex-col items-center gap-2 absolute bottom-0 origin-bottom w-full md:w-auto transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isTimetableOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-12 scale-90 pointer-events-none'}`}>
                  <Timetable />
                  <button onClick={() => setIsTimetableOpen(false)} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-3 text-white/60 hover:text-white hover:bg-black/60 transition-colors flex items-center gap-2 shadow-xl"><ChevronDown size={18} /></button>
                </div>
                <div data-tour="timetable-btn" onPointerDown={() => bringToFront('timetable')} className={`absolute bottom-0 origin-bottom transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${!isTimetableOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto delay-300' : 'opacity-0 translate-y-8 scale-50 pointer-events-none'}`}>
                  <button onClick={() => setIsTimetableOpen(true)} className="bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-3 py-3 text-white/80 hover:text-white hover:bg-black/40 transition-colors flex items-center gap-2 shadow-xl hover:scale-105 group"><CalendarDays size={20} className="text-purple-400" /><Tooltip text="Timetable" position="top" /></button>
                </div>
              </div>
            </div>
          )}

          {showDock && (
            <div style={{ bottom: isMobile ? `${8 + dockOffset}px` : `${72 + dockOffset}px`, transform: `translateX(-50%) scale(${isMobile ? mobileDashboardScale : dockScale})`, transformOrigin: 'bottom center' }} className={(!isHidden || !hideConfig.dock) ? "block absolute left-1/2 z-50 transition-all duration-300 w-[calc(100vw-16px)] max-w-md sm:w-auto sm:max-w-none flex justify-center" : 'hidden'}>
              <Dock onOpenNotes={() => console.log('Open Notes clicked')} />
            </div>
          )}
        </div>
        
        {/* Bottom Right Container */}
        <div style={{ bottom: `${rightWidgetsOffset + 30}px`, zIndex: bottomRightZ }} className="absolute right-1 sm:right-2 md:right-2 flex items-end transition-all duration-300 pointer-events-none scale-[0.75] sm:scale-85 md:scale-100 origin-bottom-right">
          <div className={`flex flex-col items-end gap-2 pointer-events-none mr-1 md:mr-[10px] relative z-20 ${isPanicHidden ? 'hidden' : ''}`}>
            <div className="flex flex-col md:flex-row items-end md:items-start gap-2 md:gap-3 pointer-events-auto">
              <div className={(!isHidden || !hideConfig.stopwatch) && showStopwatch ? '' : 'hidden'}><Stopwatch /></div>
              <div className={((!isHidden || !hideConfig.timer) && showTimer) || isAlarmPlaying ? '' : 'hidden'}><Timer /></div>
            </div>
          </div>
          <div className="pointer-events-none relative z-10"><RightToolbar /></div>
        </div>

        <SettingsModal />
        <StartupUpdateChecker />
        <ManifestationBoard />
        <FriendRequestPopup />
        <GroupRequestPopup />
        <GlobalBroadcastPopup />
        <GuidedTour />

        {showDemoRegisterBtn && (
          <div className="fixed inset-0 pointer-events-none z-[99999] flex items-center justify-center">
            <div className="pointer-events-auto flex flex-col items-center p-5 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-indigo-500/40 shadow-[0_0_50px_rgba(79,70,229,0.25)] animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500">
              <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <Sparkles className="text-indigo-400 w-5 h-5"/> Like what you see?
              </h3>
              <p className="text-slate-300 text-xs text-center max-w-[280px] mb-5 leading-relaxed">
                You're currently in Demo Mode. Register your own free account to save your progress permanently and unlock all features!
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowDemoRegisterBtn(false)} 
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold transition-colors"
                >
                  Later
                </button>
                <button
                  disabled={isRedirectingToRegister}
                  onClick={() => {
                    setIsRedirectingToRegister(true);
                    Object.keys(localStorage).forEach(key => {
                      if (
                        key.startsWith('dashboard') || 
                        key.startsWith('tasks') || 
                        key.startsWith('notes') || 
                        key.startsWith('timetable') || 
                        key.startsWith('settings')
                      ) {
                        localStorage.removeItem(key);
                      }
                    });
                    localStorage.removeItem('stopwatch_paused_secs');
                    localStorage.removeItem('stopwatch_last_active');
                    fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: '', username: '' }) }).catch(() => {});
                    import('@/lib/indexedDB').then(({ clearAllMediaFromDB }) => {
                      clearAllMediaFromDB().catch(console.error).finally(() => {
                        window.location.href = '/?mode=register';
                      });
                    });
                  }}
                  className={`flex-1 py-2.5 rounded-xl ${isRedirectingToRegister ? 'bg-indigo-700 opacity-70' : 'bg-indigo-500 hover:bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-105'} text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5`}
                >
                  {isRedirectingToRegister ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Wait...
                    </>
                  ) : (
                    'Register Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      )}
    </>
  );
}