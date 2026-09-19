'use client';

import { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { X, Settings as SettingsIcon, Sliders, MonitorPlay, RefreshCw, Clock, MessageSquare, Bell, EyeOff, Database, Globe, BookOpen, Info, ChevronLeft, BadgeCheck, Send, Briefcase, Newspaper, Loader2 } from 'lucide-react';

// Global Modals
import ConnectTab from './ConnectTab';
import UserManualModal from './UserManualModal';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';
import WallpaperTutorialModal from './WallpaperTutorialModal';

// Subcomponents (We will create these next)
import PreferencesTab from './settings/PreferencesTab';
import SoundTab from './settings/SoundTab';
import FocusPeekTab from './settings/FocusPeekTab';
import WallpaperTab from './settings/WallpaperTab';
import DataBackupTab from './settings/DataBackupTab';
import QuotesTab from './settings/QuotesTab';
import AboutTab from './settings/AboutTab';

export default function SettingsModal() {
  const { settingsActiveTab, setSettingsActiveTab, isSettingsOpen, toggleSettings, connectInitialTab, hasUnreadNews, toggleNews } = useDashboardStore();

  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWallpaperTutorialOpen, setIsWallpaperTutorialOpen] = useState(false);
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);
  const [infoModalKey, setInfoModalKey] = useState<string | null>(null);
  const [isRedirectingToRegister, setIsRedirectingToRegister] = useState(false);

  const [isDemoUser, setIsDemoUser] = useState(false);
  useEffect(() => {
    setIsDemoUser(localStorage.getItem('dashboard_username')?.toLowerCase() === 'demo_user');
  }, []);

  // Global Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: React.ReactNode; requireText?: string;
    isDestructive?: boolean; isPrompt?: boolean; promptPlaceholder?: string;
    confirmText?: string; cancelText?: string; hideCancel?: boolean;
    onConfirm: (val?: string) => void; onCancel?: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showAlertModal = (title: string, message: React.ReactNode, onConfirm?: () => void) => {
    setConfirmModal({
      isOpen: true, title, message, confirmText: 'Done', hideCancel: true,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
    });
  };

  const handleRefreshApp = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) await reg.update().catch(() => { });
      }
    } catch (err) { console.warn('ServiceWorker refresh error:', err); }

    setTimeout(() => {
      try { window.location.reload(); } 
      catch (err) { window.location.href = window.location.origin + window.location.pathname + '?r=' + Date.now(); }
    }, 100);

    setTimeout(() => { window.location.href = window.location.origin + window.location.pathname + '?refresh=' + Date.now(); }, 1000);
  };

  useEffect(() => {
    if (isSettingsOpen && connectInitialTab) {
      setSettingsActiveTab('connect');
      setIsMobileDetailView(true);
    }
  }, [isSettingsOpen, connectInitialTab, setSettingsActiveTab]);

  const handleTabClick = (tab: string) => {
    setSettingsActiveTab(tab as any);
    setIsMobileDetailView(true);
  };

  const SETTINGS_INFO: Record<string, { title: string, content: React.ReactNode }> = {
    preferences: {
      title: 'General Preferences',
      content: (
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/80 pb-2">
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px]">Widget Visibility</h4>
          <p className="text-[11px] leading-relaxed">Customize your workspace by toggling any widget on or off. Hidden widgets are completely removed from the dashboard, giving you a cleaner view when you want fewer distractions.</p>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px]">Widget Drag Locking</h4>
          <p className="text-[11px] leading-relaxed">When unlocked, all widgets can be freely dragged anywhere on the screen. Toggle the lock for specific widgets to freeze them in place so they aren't accidentally moved. If your layout gets messy, use the 'Reset Default Positions' button to snap everything back to their original layout.</p>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px]">Display Options</h4>
          <p className="text-[11px] leading-relaxed mb-1"><strong>24-Hour Clock:</strong> Toggle the big dashboard clock between a standard 12-hour AM/PM format and a 24-hour military time format.</p>
          <p className="text-[11px] leading-relaxed"><strong>Deadline Alert Days:</strong> Configure how many days in advance the dashboard should warn you about an upcoming deadline on your calendar. If a deadline falls within this threshold, a prominent red warning banner will appear automatically when you open the app.</p>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px] mt-2">Widget Drag Controls</h4>
          <p className="text-[11px] leading-relaxed">many widgets can be controlled using swipe gestures instead of buttons for a faster experience:</p>
          <ul className="list-disc pl-4 space-y-1 text-[11px]">
            <li><strong>Countdowns:</strong> Swipe left or right on the widget to switch between your countdowns. Swipe <strong>UP</strong> directly on the widget to close/hide it. You can also do a right or left swipe on the top Focus Pill to toggle the Countdowns widget open or closed.</li>
            <li><strong>Calendar:</strong> Swipe left or right near top-left edge on screen to show or hide calendar quickly without calender button you can hide it from settings if you want.</li>
            <li><strong>Task Manager:</strong> Swipe left or right near top-right edge on screen to show or hide the tasks quickly without calender button you can hide it from settings if you want.</li>
            <li><strong>Menus & Modals:</strong> You can use mouse click and drag (or swipe on touch screens) to close or navigate the Settings side menu.</li>
            <li><strong>Edge Panels:</strong> The Right Toolbar hide at the screen edges. Click or hover the exposed edge to expand them. Swipe right on the Toolbar to hide it.</li>
          </ul>
        </div>
      )
    },
    sound: {
      title: 'Sound Settings',
      content: (
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/80 pb-2">
          <p className="text-[11px] leading-relaxed">Configure the behavior of alarms when your Focus Timer finishes its countdown.</p>
          <ul className="list-disc pl-4 space-y-1 text-[11px]">
            <li><strong>Enable Alarm Sound:</strong> Triggers your selected audio ringtone when the timer finishes.</li>
            <li><strong>Enable Device Vibrate:</strong> Specifically for mobile devices, physically vibrates the phone when the timer ends.</li>
            <li><strong>Auto Stop Timer:</strong> A slider that controls how long the alarm is allowed to ring before it automatically silences itself (ranging from 5 seconds to 2 minutes).</li>
            <li><strong>Select Alarm Sound:</strong> Pick from a list of curated ringtone options.</li>
          </ul>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-4">
            <h4 className="font-bold text-blue-300 mb-1 text-[12px]">Background Alarm via MacroDroid (Android)</h4>
            <p className="text-[10px] mb-2 leading-relaxed">Because mobile operating systems aggressively suspend background web apps, your browser may fail to continuously play a looping alarm sound if you lock your screen or minimize the app. To bypass this and guarantee a full, blaring alarm, you can use the free automation app <strong>MacroDroid</strong> to intercept the app's push notification and trigger a native alarm.</p>
            <p className="text-[10px] mb-1 font-bold text-gray-900 dark:text-white">MacroDroid "Notification Present" Triggers to watch for:</p>
            <ul className="list-disc pl-4 text-[10px] space-y-1.5 font-mono">
              <li className="text-pink-300 break-words leading-tight">PWA_ALARM_RING_VIBRATE <span className="font-sans text-gray-700 dark:text-white/80 block mt-0.5">Use this exact text if you have BOTH sound and vibration enabled in these settings.</span></li>
              <li className="text-pink-300 break-words leading-tight">PWA_ALARM_RING <span className="font-sans text-gray-700 dark:text-white/80 block mt-0.5">Use this exact text if you ONLY have sound enabled.</span></li>
              <li className="text-pink-300 break-words leading-tight">PWA_ALARM_VIBRATE <span className="font-sans text-gray-700 dark:text-white/80 block mt-0.5">Use this exact text if you ONLY have vibration enabled.</span></li>
              <li className="text-pink-300 break-words leading-tight">PWA_ALARM_TRIGGER <span className="font-sans text-gray-700 dark:text-white/80 block mt-0.5">A fallback title just in case.</span></li>
            </ul>
          </div>
        </div>
      )
    },
    panic: {
      title: 'Focus / Peek Mode',
      content: (
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/80 pb-2">
          <p className="text-[11px] leading-relaxed">Configure how to instantly hide your dashboard or specific widgets.</p>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px] mt-2">Desktop Controls</h4>
          <p className="text-[11px] leading-relaxed">On Desktop, there is no Eye icon. Instead, you use Keyboard Shortcuts (configured below) or simply click on the <strong>Today Focus top pill</strong> to toggle your hidden state. You can set separate shortcuts for <strong>Focus Mode</strong> (hides only selected widgets) and <strong>Peek Mode</strong> (hides everything).</p>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px] mt-2">Mobile Controls</h4>
          <p className="text-[11px] leading-relaxed">On Mobile, use the <strong>👁️ Eye icon</strong> on the right side of the screen. Tap 👁️ Eye icon on right side of screen to hide all and click on same place to get back all that icon becomes invisible on peak mode but remains on same place to toggle back, You can configure this icon below to act as either a Peek button (hide all) or a Focus button (hide selected).</p>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px] mt-2">Peek Actions</h4>
          <ul className="list-disc pl-4 space-y-1 text-[11px]">
            <li><strong>Hide UI:</strong> Makes all widgets instantly disappear, leaving a blank screen.</li>
          </ul>
        </div>
      )
    },
    wallpapers: {
      title: 'Wallpapers',
      content: (
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/80 pb-2">
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px]">Built-in Wallpapers</h4>
          <p className="text-[11px] leading-relaxed">Choose from a curated selection of static images and animated video backgrounds. Click any thumbnail to apply it instantly.</p>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px] mt-2">Custom URL Wallpapers</h4>
          <p className="text-[11px] leading-relaxed">You can add your own custom images or video loops (like .mp4 or .webm) by pasting a direct URL to the file.</p>
          <ul className="list-disc pl-4 space-y-1 text-[11px]">
            <li><strong>Desktop vs Mobile:</strong> The app stores up to 4 custom wallpapers specifically for your Desktop, and 4 completely separate ones for your Mobile device. This ensures your phone gets appropriately sized vertical backgrounds while your PC gets widescreen ones.</li>
            <li><strong>Selection:</strong> The currently active custom wallpaper will have a checkmark on it.</li>
            <li><strong>Removal:</strong> Click the trash can icon on any custom wallpaper to delete it and free up one of your 4 slots.</li>
          </ul>
        </div>
      )
    },
    backup: {
      title: 'Data & Backup',
      content: (
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/80 pb-2">
          <p className="text-[11px] leading-relaxed">Your data automatically syncs to the cloud in real-time. You can also manage offline backups, restore data, or clear history here.</p>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px] mt-2">Cloud Real-Time Sync</h4>
          <p className="text-[11px] leading-relaxed">All changes (tasks, focus logs, timetable, daily routines, settings) are continuously saved to your account in the cloud. Logging in on any device restores your full data.</p>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px] mt-2">Export Data (.json)</h4>
          <p className="text-[11px] leading-relaxed">Downloads a complete <code>.json</code> backup file containing your entire history, tasks, roadmap, calendar deadlines, notes, and preferences.</p>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px] mt-2">Import Data (.json)</h4>
          <ul className="list-disc pl-4 space-y-1 text-[11px]">
            <li><strong>Merge:</strong> Upload a backup file and safely combine it with your existing data without losing anything.</li>
            <li><strong>Overwrite:</strong> Replaces your current dashboard data entirely with the backup file contents.</li>
          </ul>
          <h4 className="font-bold text-gray-900 dark:text-white text-[13px] mt-2">Reset & Data Clearing</h4>
          <ul className="list-disc pl-4 space-y-1 text-[11px]">
            <li><strong>Reset Timetable:</strong> Resets your weekly schedule and custom slot colors back to defaults.</li>
            <li><strong>Factory Reset Profile:</strong> Permanently wipes all local and cloud tasks, notes, history, and settings (requires typing <em>delete all</em>).</li>
          </ul>
        </div>
      )
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-1.5 sm:p-4 pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={() => {
          toggleSettings();
          setIsMobileDetailView(false); // Reset to menu on close
        }}
      />

      <div className={`relative w-full max-w-3xl flex flex-col bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl md:rounded-3xl overflow-hidden text-white animate-in zoom-in-95 duration-200 ${!isMobileDetailView ? 'h-fit max-h-[85vh] md:h-[80vh]' : 'h-[85vh] md:h-[80vh]'}`}>
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes continuous-glass-sweep {
            0% { left: -100%; }
            100% { left: 200%; }
          }
          .glass-sweep-anim {
            animation: continuous-glass-sweep 3s infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
          }
        ` }} />

        {/* Header - Scaled down padding, wrapped text */}
        <div className="flex flex-row items-center justify-between p-2 md:p-3 border-b border-white/10 bg-black/20 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isMobileDetailView && (
              <button
                onClick={() => setIsMobileDetailView(false)}
                className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 border border-white/10 bg-white/5 shrink-0 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <SettingsIcon className={`${isMobileDetailView ? 'hidden md:block' : 'block'} text-blue-400 w-4 h-4 md:w-5 md:h-5 shrink-0`} />
            <h2 className="text-sm md:text-base font-bold tracking-wide leading-tight flex items-center gap-1 md:gap-2 flex-wrap min-w-0">
              {isMobileDetailView ? (
                <span className="md:hidden capitalize break-words">
                  {settingsActiveTab === "manifestation" ? "Manifestation Board" : settingsActiveTab === "about" ? "About Dev" : settingsActiveTab === "connect" ? "Connect & Ranks" : settingsActiveTab + " Settings"}
                </span>
              ) : null}
              <span className={isMobileDetailView ? 'hidden md:inline break-words' : 'inline break-words'}>
                <span className="md:hidden">Settings</span>
                <span className="hidden md:inline">Dashboard Settings</span>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setInfoModalKey('preferences'); }}
                className={`${isMobileDetailView ? 'hidden md:flex' : 'flex'} p-1 text-blue-400 hover:text-blue-300 bg-white/5 hover:bg-white/10 border border-blue-500/20 rounded-full transition-colors shrink-0`}
                title="View Settings Info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isDemoUser && (
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
                className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 ${isRedirectingToRegister ? 'bg-indigo-700 opacity-70' : 'bg-indigo-500 hover:bg-indigo-600 animate-pulse'} text-white font-bold text-[9px] md:text-xs rounded-md md:rounded-lg transition-colors border border-indigo-400 shadow-sm mr-1 md:mr-2 whitespace-nowrap active:scale-95`}
              >
                {isRedirectingToRegister ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Wait...
                  </>
                ) : (
                  'Register Now'
                )}
              </button>
            )}
            <div className="flex items-center gap-1.5 mr-1 md:mr-2 border-r border-white/10 pr-1.5 md:pr-2.5 shrink-0">
              <div className="relative group">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 bg-[#1a1b26]/90 backdrop-blur-md border border-white/10 rounded-md text-[8px] font-bold tracking-widest text-white/70 uppercase pointer-events-none z-10 transition-colors group-hover:text-blue-300 whitespace-nowrap opacity-0 group-hover:opacity-100">Apply Changes</span>
                <button
                  onClick={handleRefreshApp}
                  disabled={isRefreshing}
                  className="flex flex-row items-center justify-center gap-1.5 px-2 py-1.5 hover:bg-blue-500/20 hover:border-blue-500/50 active:scale-95 rounded-lg transition-all border border-white/10 bg-white/5 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                  title="Refresh the app to apply changes or fix wallpaper bugs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-400 shrink-0 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <span className="text-[9px] md:text-[10px] font-bold text-white/90 leading-none whitespace-nowrap">
                    {isRefreshing ? 'Refreshing...' : 'Refresh App'}
                  </span>
                </button>
              </div>
            </div>
            {isMobileDetailView && ['preferences', 'sound', 'focus', 'wallpapers', 'data'].includes(settingsActiveTab) && (
              <button
                onClick={() => setInfoModalKey(settingsActiveTab === 'focus' ? 'panic' : settingsActiveTab === 'data' ? 'backup' : settingsActiveTab)}
                className="md:hidden p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-400 bg-white/5 border border-white/10 shadow-sm active:scale-95"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                toggleSettings();
                setIsMobileDetailView(false);
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white border border-transparent hover:border-white/10 active:scale-95"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full">
          {/* Sidebar Tabs - Highly Compact */}
          <div className={`${isMobileDetailView ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-44 lg:w-48 bg-black/20 border-r-0 md:border-r border-white/10 relative group shrink-0`}>
            <ScrollableWithArrows className="flex-1 p-2 flex flex-col gap-1.5 pb-4 md:pb-10 custom-scrollbar">
              <button
                onClick={() => handleTabClick('preferences')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${settingsActiveTab === 'preferences' && !isMobileDetailView ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
              >
                <Sliders className="w-3.5 h-3.5" /> Preferences
              </button>
              <button
                onClick={() => handleTabClick('wallpaper')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${settingsActiveTab === 'wallpaper' && !isMobileDetailView ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
              >
                <MonitorPlay className="w-3.5 h-3.5" /> Wallpapers
              </button>

              <button
                onClick={() => handleTabClick('quotes')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${settingsActiveTab === 'quotes' && !isMobileDetailView ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30 shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Quotes Settings
              </button>
              <button
                onClick={() => handleTabClick('sound')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${settingsActiveTab === 'sound' && !isMobileDetailView ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
              >
                <Bell className="w-3.5 h-3.5" /> Sound Settings
              </button>

              <button
                onClick={() => handleTabClick('focus')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${settingsActiveTab === 'focus' && !isMobileDetailView ? 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
              >
                <EyeOff className="w-3.5 h-3.5" /> Focus / Peek
              </button>
              <button
                onClick={() => handleTabClick('data')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${settingsActiveTab === 'data' && !isMobileDetailView ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
              >
                <Database className="w-3.5 h-3.5" /> Data & Backup
              </button>
              <button
                onClick={() => handleTabClick('connect')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${settingsActiveTab === 'connect' && !isMobileDetailView ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
              >
                <Globe className={`w-3.5 h-3.5 ${settingsActiveTab === 'connect' ? 'text-blue-400 animate-pulse' : ''}`} /> Connect & Ranks
              </button>

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={() => handleTabClick('about')}
                className={`relative overflow-hidden group flex flex-row w-full items-center gap-2 px-2 py-2 rounded-xl transition-all ${settingsActiveTab === 'about' && !isMobileDetailView ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'}`}
              >
                <div className="absolute top-0 bottom-0 w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none glass-sweep-anim" style={{ left: '-100%' }} />
                <img
                  src="/branding/author.jpeg"
                  alt="Developer"
                  className="w-10 h-10 rounded-full object-cover shadow-sm border border-white/30 shrink-0"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="text-[10px] font-bold text-white/90">Anand Kumar</span>
                  <span className="text-[8px] text-blue-300 font-bold uppercase tracking-wider">about Developer</span>
                </div>
              </button>

              <button
                onClick={() => {
                  toggleSettings();
                  setIsMobileDetailView(false);
                  useDashboardStore.setState({ isNewsOpen: true });
                }}
                className={`flex relative w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white border border-transparent`}
              >
                <div className="relative">
                  <Newspaper className="w-3.5 h-3.5 text-blue-400" />
                  {hasUnreadNews && <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(59,130,246,0.8)] z-10" />}
                </div>
                What's New
              </button>

              <button
                onClick={() => setIsUserManualOpen(true)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-[11px] font-bold text-white/60 hover:bg-white/5 hover:text-white border border-transparent mb-2 mt-1`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" /> User Manual
              </button>

            </ScrollableWithArrows>
          </div>

          {/* Content Area - Minimized Padding, Wrapped Text */}
          <div className={`relative flex-1 overflow-hidden flex-col group/content ${isMobileDetailView ? 'flex' : 'hidden md:flex'}`}>

            <ScrollableWithArrows className="flex-1 p-2 pb-8 md:p-4 md:pb-8 h-full custom-scrollbar">

              {settingsActiveTab === 'connect' && <ConnectTab />}
              {settingsActiveTab === 'preferences' && <PreferencesTab setInfoModalKey={setInfoModalKey} setIsWallpaperTutorialOpen={setIsWallpaperTutorialOpen} />}
              {settingsActiveTab === 'sound' && <SoundTab setInfoModalKey={setInfoModalKey} showAlertModal={showAlertModal} />}
              {settingsActiveTab === 'quotes' && <QuotesTab showAlertModal={showAlertModal} />}
              {settingsActiveTab === 'wallpaper' && <WallpaperTab setConfirmModal={setConfirmModal} showAlertModal={showAlertModal}  setIsWallpaperTutorialOpen={setIsWallpaperTutorialOpen} />}
              {settingsActiveTab === 'focus' && <FocusPeekTab setConfirmModal={setConfirmModal} setInfoModalKey={setInfoModalKey} showAlertModal={showAlertModal} />}
              {settingsActiveTab === 'data' && <DataBackupTab setInfoModalKey={setInfoModalKey} showAlertModal={showAlertModal} setConfirmModal={setConfirmModal} />}
              {settingsActiveTab === 'about' && <AboutTab />}

            </ScrollableWithArrows>

          </div>
        </div>
      </div>

      <UserManualModal isOpen={isUserManualOpen} onClose={() => setIsUserManualOpen(false)} />
      
      {/* Info Modal */}
      {infoModalKey && SETTINGS_INFO[infoModalKey] && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-50 dark:bg-[#1a1a1a] border border-gray-300 dark:border-white/10 rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-white/5 bg-gray-200/50 dark:bg-black/20">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                {SETTINGS_INFO[infoModalKey].title}
              </h3>
              <button
                onClick={() => setInfoModalKey(null)}
                className="text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white p-1.5 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto arrow-scrollbar">
              {SETTINGS_INFO[infoModalKey].content}
            </div>
            <div className="p-3 border-t border-gray-300 dark:border-white/5 bg-gray-200/50 dark:bg-black/20">
              <button
                onClick={() => setInfoModalKey(null)}
                className="w-full py-2 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 rounded-xl text-gray-900 dark:text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Confirmation Modal overlay (highest z-index) */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false, onCancel: undefined, isPrompt: false })}
        onConfirm={confirmModal.onConfirm}
        onCancel={(confirmModal as any).onCancel}
        title={confirmModal.title}
        message={confirmModal.message}
        requireText={confirmModal.requireText}
        isDestructive={confirmModal.isDestructive}
        isPrompt={confirmModal.isPrompt}
        promptPlaceholder={confirmModal.promptPlaceholder}
        confirmText={(confirmModal as any).confirmText}
        cancelText={(confirmModal as any).cancelText}
        hideCancel={confirmModal.hideCancel}
      />

      {/* PC Desktop Wallpaper Tutorial Modal */}
      <WallpaperTutorialModal
        isOpen={isWallpaperTutorialOpen}
        onClose={() => setIsWallpaperTutorialOpen(false)}
      />
    </div>
  );
}