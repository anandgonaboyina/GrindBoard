'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useTimetableStore, pushTimetableToDB } from '@/store/timetableStore';
import { useTaskStore, pushTasksToDB } from '@/store/taskStore';
import { useNoteStore } from '@/store/noteStore';
import { X, Upload, Code, LinkIcon, BookOpen, Trash2, Image as ImageIcon, Settings as SettingsIcon, Sliders, MonitorPlay, Clock, Users, Plus, Minus, Eye, EyeOff, Download, UploadCloud, Activity, MessageSquare, Timer as TimerIcon, Hourglass, Film, User, BadgeCheck, Send, Briefcase, Calendar, CheckSquare, Flame, ChevronUp, ChevronDown, ChevronLeft, Database, Bell, RefreshCw, AlertTriangle, AlertCircle, CheckCircle, BarChart2, Map, StickyNote, CalendarDays, Layout, Globe, Star, Info, Play, Pause, Music, Volume2, Maximize2, RotateCcw, Smartphone, Monitor, Sparkles } from 'lucide-react';
import ConnectTab from './ConnectTab';
import UserManualModal from './UserManualModal';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';
import WallpaperTutorialModal from './WallpaperTutorialModal';

const DEFAULT_WALLPAPERS = [
  'itachi-uchiha.png', 'kakashi.mp4', 'kakashi2.mp4', 'kakashi3.png',
  'kakashiChild.jpg', 'naruto.webp', 'RockLee.mp4', 'squa7.jpg', 'demonslayer1.mp4'
];
const DEFAULT_ALARM_SOUNDS = [
  { id: 'naruto', name: 'naruto BGM ( default )', url: '/ringtones/narutoBGM.mp3' },
  { id: 'demonslayer', name: 'Demon Slayer', url: '/ringtones/Demon Slayer.mp3' },
  { id: 'fightsong', name: 'Fight Song', url: '/ringtones/Fight Song.mp3' },
  { id: 'heartbroken', name: 'Heart broken', url: '/ringtones/Heart broken.mp3' },
  { id: 'moneyheist', name: 'Moneyheist', url: '/ringtones/Moneyheist.mp3' },
  { id: 'onmyway', name: 'On My Way', url: '/ringtones/On My Way.mp3' },
  { id: 'unstoppable', name: 'Unstoppable', url: '/ringtones/Unstoppable.mp3' },
];

import { useWallpaperUrl } from '@/hooks/useWallpaperUrl';
import { saveWallpaperToDB, deleteWallpaperFromDB, saveAudioToDB, deleteAudioFromDB } from '@/lib/indexedDB';
import { getResolvedAudioUrl } from '@/hooks/useAudioUrl';
import { CustomWallpaperPreview } from './CustomWallpaperPreview';

export default function SettingsModal() {
  const { settingsActiveTab, setSettingsActiveTab, isSettingsOpen, toggleSettings, connectInitialTab, is24HourClock, toggle24HourClock, clockScale, setClockScale, dashboardScale, setDashboardScale, mobileDashboardScale, setMobileDashboardScale, dockScale, setDockScale, dockOffset, setDockOffset, currentBgSrc, hiddenWallpapers, toggleWallpaperVisibility, showQuote, showTimer, showCountdowns, showVideoControls, showClock, showTasks, showCalendar, showTodayWork, showStats, showPlans, showNotes, showTimetable, showDock, showDeadlineAlerts, showBgSwitcher, showSettingsBtn, showStopwatch, toggleVisibility, isSlideshowEnabled, setIsSlideshowEnabled, slideshowIntervalMins, setSlideshowIntervalMins, lockedWidgets, toggleWidgetLock, resetAllOffsets, clearOldData, clearAllData, /*clearAllTasksAndPlans */ lockedWallpaper, setLockedWallpaper, deadlineAlertDays, setDeadlineAlertDays, hideConfig, setHideConfig, setHideAll, mobileHideConfig, setMobileHideConfig, setMobileHideAll, rightWidgetsOffset, setRightWidgetsOffset, alarmSound, setAlarmSound, customAlarmSounds, addCustomAlarmSound, deleteCustomAlarmSound, alarmDurationSecs, setAlarmDurationSecs, alarmVolume, setAlarmVolume, enableAlarmSound, setEnableAlarmSound, enableAlarmVibration, setEnableAlarmVibration, toggleHide, panicShortcutKey, setPanicShortcutKey, focusShortcutKey, setFocusShortcutKey, togglePanicHide, panicWallpaperSwitch, setPanicWallpaperSwitch, peekModeWallpaper, setPeekModeWallpaper, panicButtonMode, setPanicButtonMode, customDesktopWallpapers, setCustomDesktopWallpapers, activeDesktopCustomIndex, setActiveDesktopCustomIndex, customMobileWallpapers, setCustomMobileWallpapers, activeMobileCustomIndex, setActiveMobileCustomIndex, theme, setTheme, customQuotes, setCustomQuotes, useCustomQuotes, setUseCustomQuotes, manifestationCustomQuotes, setManifestationCustomQuotes, addManifestationCustomQuote, deleteManifestationCustomQuote, taskIntervalAlertMins, setTaskIntervalAlertMins, taskIntervalRingSecs, setTaskIntervalRingSecs, autoOpenCountdowns, setAutoOpenCountdowns, showManifestationBoard, setShowManifestationBoard, manifestationDesktopPhotos, setManifestationDesktopPhotos, activeManifestationDesktopIndex, setActiveManifestationDesktopIndex, manifestationMobilePhotos, setManifestationMobilePhotos, activeManifestationMobileIndex, setActiveManifestationMobileIndex } = useDashboardStore();
  const { clearAllTasksAndPlans, resetTimetable, forceInstantSave } = useDashboardStore();

  const [focusPlatform, setFocusPlatform] = useState<'desktop' | 'mobile'>('desktop');
  const [showThemeNotice, setShowThemeNotice] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWallpaperTutorialOpen, setIsWallpaperTutorialOpen] = useState(false);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

  const handleRefreshApp = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update().catch(() => { });
        }
      }
    } catch (err) {
      console.warn('ServiceWorker refresh error:', err);
    }

    setTimeout(() => {
      try {
        window.location.reload();
      } catch (err) {
        window.location.href = window.location.origin + window.location.pathname + '?r=' + Date.now();
      }
    }, 100);

    setTimeout(() => {
      window.location.href = window.location.origin + window.location.pathname + '?refresh=' + Date.now();
    }, 1000);
  };

  // Mobile specific drill-down state
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  // Custom Audio state & handlers
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [previewingAudioUrl, setPreviewingAudioUrl] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isDefaultDropdownOpen, setIsDefaultDropdownOpen] = useState(false);

  const stopPreviewAudio = () => {
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current.removeAttribute('src');
        previewAudioRef.current.load();
      } catch (e) { }
      previewAudioRef.current = null;
    }
    setPreviewingAudioUrl(null);
  };

  const handleTogglePreviewAudio = async (url: string) => {
    if (previewingAudioUrl === url) {
      stopPreviewAudio();
    } else {
      stopPreviewAudio();
      const resolvedUrl = await getResolvedAudioUrl(url);
      const audio = new Audio(resolvedUrl);
      const vol = alarmVolume !== undefined ? alarmVolume : 1;
      audio.volume = vol > 1 ? vol / 100 : vol;
      audio.onended = () => stopPreviewAudio();
      audio.onerror = () => stopPreviewAudio();
      audio.play().catch(e => {
        console.error("Audio preview error:", e);
        stopPreviewAudio();
      });
      previewAudioRef.current = audio;
      setPreviewingAudioUrl(url);
    }
  };

  useEffect(() => {
    if (!isSettingsOpen) {
      stopPreviewAudio();
    }
    return () => {
      stopPreviewAudio();
    };
  }, [settingsActiveTab, isSettingsOpen]);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if ((customAlarmSounds || []).length >= 3) {
      showAlertModal('Limit Reached', 'Maximum 3 custom ringtones allowed. Please delete an existing custom ringtone first.');
      return;
    }

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      showAlertModal('Invalid File', 'Please select a valid audio file (MP3, WAV, OGG, M4A).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showAlertModal('File Too Large', 'Please select an audio file under 10MB.');
      return;
    }

    const audioKey = 'custom-audio-' + Date.now();
    await saveAudioToDB(audioKey, file);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    addCustomAlarmSound(nameWithoutExt, audioKey);

    if (e.target) {
      e.target.value = '';
    }
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    requireText?: string;
    isDestructive?: boolean;
    isPrompt?: boolean;
    promptPlaceholder?: string;
    confirmText?: string;
    cancelText?: string;
    hideCancel?: boolean;
    onConfirm: (val?: string) => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const showAlertModal = (title: string, message: React.ReactNode, onConfirm?: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: 'Done',
      hideCancel: true,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
    });
  };
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);

  const [infoModalKey, setInfoModalKey] = useState<string | null>(null);

  const SETTINGS_INFO: Record<string, { title: string, content: React.ReactNode }> = {
    preferences: {
      title: 'General Preferences',
      content: (
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/ pb-2">
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
            <li><strong>Countdowns:</strong> Swipe left or right on the widget to switch between your countdowns. Swipe <strong>UP</strong> directly on the widget to close/hide it.  You can also do a right or left swipe on the top Focus Pill to toggle the Countdowns widget open or closed.</li>
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
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/ pb-2">
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
              <li className="text-pink-300 break-words leading-tight">PWA_ALARM_RING_VIBRATE <span className="font-sans text-gray-700 dark:text-white/ block mt-0.5">Use this exact text if you have BOTH sound and vibration enabled in these settings.</span></li>
              <li className="text-pink-300 break-words leading-tight">PWA_ALARM_RING <span className="font-sans text-gray-700 dark:text-white/ block mt-0.5">Use this exact text if you ONLY have sound enabled.</span></li>
              <li className="text-pink-300 break-words leading-tight">PWA_ALARM_VIBRATE <span className="font-sans text-gray-700 dark:text-white/ block mt-0.5">Use this exact text if you ONLY have vibration enabled.</span></li>
              <li className="text-pink-300 break-words leading-tight">PWA_ALARM_TRIGGER <span className="font-sans text-gray-700 dark:text-white/ block mt-0.5">A fallback title just in case.</span></li>
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
            <li><strong>Redirect:</strong> The browser immediately navigates away to a random neutral website. Press "Back" in your browser to return.</li>
            <li><strong>Hide UI:</strong> Makes all widgets instantly disappear, leaving a blank screen.</li>
          </ul>
        </div>
      )
    },
    wallpapers: {
      title: 'Wallpapers',
      content: (
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/ pb-2">
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
    liveWallpaper: {
      title: 'Live Desktop Wallpaper',
      content: (
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/ pb-2">
          <p className="text-[11px] leading-relaxed text-gray-700 dark:text-white/">You can run Grind Board directly as your interactive Windows desktop background instead of using it in a browser window!</p>
          <ol className="list-decimal pl-4 space-y-2 text-[11px] text-gray-700 dark:text-white/">
            <li>
              Download and install Lively Wallpaper:
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li><a href="https://drive.google.com/file/d/1TJWAWPTtTbKNMaNVAwz2GwbSb04NO-J5/view?usp=drivesdk" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">Direct Download (Google Drive)</a> (Recommended)</li>
                <li><a href="https://rocksdanister.github.io/lively/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">Official Source</a> (Alternative)</li>
              </ul>
            </li>
            <li>Open Lively Wallpaper and click <strong>"Add Wallpaper"</strong> (the + icon).</li>
            <li>Under <strong>"Enter URL"</strong>, type the live URL of the Grind Board app <code className="bg-gray-200 dark:bg-white/ px-1 py-0.5 rounded text-[10px]">https://wallpaper-dashboard-cloud.vercel.app/</code> and press <strong>→</strong>.</li>
            <li>Lively will load the webpage as your desktop background! You can click and interact with all the widgets directly on your desktop.</li>
            <li>
              <strong>Enable Auto Start:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Open Lively Wallpaper Settings (⚙️) → <strong>General</strong> → Toggle <strong>"Start with Windows"</strong> ON.</li>
                <li>Open Windows <strong>Task Manager</strong> (Ctrl+Shift+Esc) → Go to the <strong>Startup Apps</strong> tab → Right-click on <strong>Lively Wallpaper</strong> and select <strong>Enable</strong>.</li>
              </ul>
            </li>
            <li>
              <strong>Important Performance & Sync Settings:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Go to Lively Settings (⚙️) → <strong>Wallpaper</strong> → Set Web Browser Engine to <strong>Edge (WebView2)</strong>.</li>
                <li>Click on the ⚙️ icon next to the Edge (WebView2) engine setting and set <strong>Cache Directory</strong> to <strong>Disk</strong> (This ensures your data is not lost when restarting your PC).</li>
                <li>Go to Lively Settings (⚙️) → <strong>Audio</strong> → Untick/Turn off <strong>"Play audio only when desktop is focused"</strong> (This ensures you hear the Focus Timer alarm even if you have full-screen apps or other tabs open).</li>
              </ul>
            </li>
          </ol>
        </div>
      )
    },
    backup: {
      title: 'Data & Backup',
      content: (
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/ pb-2">
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
            <li><strong>Clear Old Data:</strong> Deletes focus history entries older than chosen days to optimize performance.</li>
            <li><strong>Factory Reset Profile:</strong> Permanently wipes all local and cloud tasks, notes, history, and settings (requires typing <em>delete all</em>).</li>
          </ul>
        </div>
      )
    },
    dragControls: {
      title: 'Widget Drag Controls',
      content: (
        <div className="space-y-3 text-sm text-gray-700 dark:text-white/ pb-2">
          <p className="text-[11px] leading-relaxed">many widgets can be controlled using swipe gestures instead of buttons for a faster experience:</p>
          <ul className="list-disc pl-4 space-y-2 text-[11px]">
            <li><strong>Countdowns:</strong> Swipe left or right on the widget to switch between your countdowns. Swipe <strong>UP</strong> directly on the widget to close/hide it.  You can also do a right or left swipe on the top Focus Pill to toggle the Countdowns widget open or closed.</li>
            <li><strong>Calendar:</strong> Swipe left or right near top-left edge on screen to show or hide calendar quickly without calender button you can hide it from settings if you want.</li>
            <li><strong>Task Manager:</strong> Swipe left or right near top-right edge on screen to show or hide the tasks quickly without calender button you can hide it from settings if you want.</li>
            <li><strong>Menus & Modals:</strong> You can use mouse click and drag (or swipe on touch screens) to close or navigate the Settings side menu.</li>
          </ul>
        </div>
      )
    }
  };

  const handleShortcutCapture = (e: React.KeyboardEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const key = e.key.toLowerCase();
    if (e.altKey && (key === 'f4' || e.code === 'F4' || e.keyCode === 115)) return; // NEVER capture Alt+F4
    e.preventDefault();
    if (key === 'control' || key === 'shift' || key === 'alt' || key === 'meta') return;
    if (key === 'escape') {
      e.currentTarget.blur();
      return;
    }
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    parts.push(key === ' ' ? 'space' : key);
    setter(parts.join('+'));
    e.currentTarget.blur();
  };

  const formatShortcutText = (shortcut: string) => {
    if (!shortcut) return '';
    let val = shortcut;
    if (!val.includes('+') && val.length === 1) val = 'ctrl+' + val;
    return val.toUpperCase().replace(/\+/g, ' + ');
  };

  const [deleteDays, setDeleteDays] = useState<number>(60);
  const upiId = 'gonaboyinaanandkumar@ybl';
  const [donationAmount, setDonationAmount] = useState<number | null>(100);

  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkQuotesJson, setBulkQuotesJson] = useState('');

  const [newManifestationQuoteText, setNewManifestationQuoteText] = useState('');
  const [showBulkAddManifestation, setShowBulkAddManifestation] = useState(false);
  const [bulkManifestationInput, setBulkManifestationInput] = useState('');

  const handleAddManifestationQuote = () => {
    if (!newManifestationQuoteText.trim()) return;
    const current = manifestationCustomQuotes || [];
    if (current.length >= 30) return showAlertModal('Limit Reached', 'Maximum 30 custom manifestation quotes allowed.');
    addManifestationCustomQuote(newManifestationQuoteText.trim());
    setNewManifestationQuoteText('');
  };

  const handleBulkAddManifestationQuotes = () => {
    if (!bulkManifestationInput.trim()) return;
    let quotesToAdd: string[] = [];

    const raw = bulkManifestationInput.trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          quotesToAdd = parsed.map(q => (typeof q === 'string' ? q : q.text || '')).filter(Boolean);
        }
      } catch (err) {
        quotesToAdd = raw.split('\n').map(line => line.trim()).filter(Boolean);
      }
    } else {
      quotesToAdd = raw.split('\n').map(line => line.trim()).filter(Boolean);
    }

    if (quotesToAdd.length === 0) {
      showAlertModal('Invalid Input', 'No valid quotes found in input.');
      return;
    }

    const current = manifestationCustomQuotes || [];
    const remaining = 30 - current.length;

    if (remaining <= 0) {
      showAlertModal('Limit Reached', 'You already have 30 custom quotes (maximum limit).');
      return;
    }

    const newEntries = quotesToAdd.slice(0, remaining);
    setManifestationCustomQuotes([...current, ...newEntries]);
    setBulkManifestationInput('');
    setShowBulkAddManifestation(false);
    showAlertModal('Success', `Added ${newEntries.length} new quote(s) to your Manifestation Board!`);
  };

  const handleAddQuote = () => {
    if (!newQuoteText.trim()) return;
    const author = newQuoteAuthor.trim() || 'Unknown';
    if (customQuotes.length >= 50) return showAlertModal('Limit Reached', 'Maximum 50 custom quotes allowed.');
    setCustomQuotes([...customQuotes, { text: newQuoteText.trim(), author }]);
    setNewQuoteText('');
    setNewQuoteAuthor('');
  };

  const handleBulkAddQuotes = () => {
    try {
      const parsed = JSON.parse(bulkQuotesJson);
      if (!Array.isArray(parsed)) throw new Error('Must be an array of objects.');
      const validQuotes = parsed.filter(q => q.text && typeof q.text === 'string').map(q => ({
        text: q.text.trim(),
        author: (q.author && typeof q.author === 'string' ? q.author.trim() : 'Unknown')
      }));
      if (validQuotes.length === 0) return showAlertModal('Import Failed', 'No valid quotes found in JSON.');
      const newQuotes = [...customQuotes, ...validQuotes].slice(0, 50);
      setCustomQuotes(newQuotes);
      setShowBulkAddModal(false);
      setBulkQuotesJson('');
      showAlertModal('Quotes Imported', `Successfully added ${validQuotes.length} quotes! (Max 50)`);
    } catch (err) {
      showAlertModal('Invalid Format', 'Invalid JSON format. Please provide an array of objects like: [{"text": "Quote", "author": "Author"}]');
    }
  };

  const handleDeleteQuote = (index: number) => {
    setCustomQuotes(customQuotes.filter((_, i) => i !== index));
  };

  const settingsScrollRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (ref: React.RefObject<HTMLDivElement | null>, direction: 'up' | 'down') => {
    if (ref.current) {
      ref.current.scrollBy({ top: direction === 'up' ? -300 : 300, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isSettingsOpen && connectInitialTab) {
      setSettingsActiveTab('connect');
      setIsMobileDetailView(true);
    }
  }, [isSettingsOpen, connectInitialTab, setSettingsActiveTab]);


  const processBackupDownload = (data: any, filename: string, typeName: string) => {
    setIsProcessingBackup(true);

    // Defer the heavy JSON.stringify to let React paint the loading state first
    setTimeout(() => {
      const isWebView2 = typeof window !== 'undefined' && ((window as any).chrome?.webview !== undefined || navigator.userAgent.includes('wv') || navigator.userAgent.includes('Lively'));

      if (isWebView2) {
        fetch('/api/download-echo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: JSON.stringify(data, null, 2),
            name: filename,
            type: typeName
          })
        }).then(res => res.json()).then(result => {
          if (result.success && result.id) {
            window.open(window.location.origin + '/download.html?apiId=' + result.id + '&type=' + encodeURIComponent(typeName), '_blank');
          } else {
            showAlertModal('Download Error', 'Failed to prepare download.');
          }
        }).catch(() => {
          const encoded = encodeURIComponent(JSON.stringify(data, null, 2));
          const url = new URL(window.location.origin + '/download.html');
          url.searchParams.set('data', encoded);
          url.searchParams.set('name', filename.replace('.json', ''));
          url.searchParams.set('type', typeName);
          window.open(url.toString(), '_blank');
        }).finally(() => {
          setIsProcessingBackup(false);
        });
      } else {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        setIsProcessingBackup(false);
      }
    }, 50);
  };

  const showBackupModal = (title: string, filename: string, typeName: string, itemsDesc: string, getData: () => any) => {
    setConfirmModal({
      isOpen: true,
      title: title,
      message: (
        <div className="flex flex-col gap-3 text-sm text-white/80">
          <p>Your backup file (<code className="text-orange-300 text-xs px-1 bg-black/30 rounded">{filename}</code>) will be saved to your PC's <strong>Downloads</strong> folder.</p>
          <div className="p-2 bg-black/30 border border-white/10 rounded-lg text-xs leading-relaxed text-white/60">
            <strong>Will include:</strong> {itemsDesc}
          </div>
          {typeof window !== 'undefined' && ((window as any).chrome?.webview !== undefined || navigator.userAgent.includes('wv') || navigator.userAgent.includes('Lively')) && (
            <p className="text-[11px] text-blue-300 bg-blue-500/10 p-2 rounded mt-1 border border-blue-500/20">
              ℹ️ Since you are using Lively Wallpaper, your default browser will briefly open to process the download safely.
            </p>
          )}
        </div>
      ),
      confirmText: 'Download',
      onConfirm: () => {
        processBackupDownload(getData(), filename, typeName);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBackupPlanYourDay = () => {
    showBackupModal(
      'Backup Plan Your Day',
      'plan_your_day_backup.json',
      'Plan Your Day Backup',
      'All your created tasks (both Today and Tomorrow), time remaining, completion times, interval duration, and task alert beep settings.',
      () => {
        // 1. Pull task arrays and dates from your dedicated Task Store
        const taskState = useTaskStore.getState();

        // 2. Pull interval alert settings from the Dashboard Store
        const dashboardState = useDashboardStore.getState();

        return {
          // From Task Store:
          tasks: taskState.tasks || [],
          tomorrowTasks: taskState.tomorrowTasks || [],
          tasksDate: taskState.tasksDate,
          taskGroupNames: taskState.taskGroupNames || ['Core Tasks', 'Daily Routine', 'Milestones'],

          // From Dashboard Store:
          taskIntervalAlertMins: dashboardState.taskIntervalAlertMins || 10,
          taskIntervalRingSecs: dashboardState.taskIntervalRingSecs || 10,
          isTaskIntervalAlertEnabled: dashboardState.isTaskIntervalAlertEnabled || false,
        };
      }
    );
  };

  const handleRestorePlanYourDay = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingBackup(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        // 1. Prepare the payload for your dedicated Task Store
        const taskPayload = {
          tasks: data.tasks || [],
          tomorrowTasks: data.tomorrowTasks || [],
          tasksDate: data.tasksDate || new Date().toISOString().split('T')[0],
          taskGroupNames: data.taskGroupNames || ['Core Tasks', 'Daily Routine', 'Milestones']
        };

        // 2. Update the local Task Store and push directly to the Tasks API
        useTaskStore.setState(taskPayload);
        pushTasksToDB(taskPayload);

        // 3. Update the Dashboard Store with the interval settings and force its save
        useDashboardStore.setState({
          taskIntervalAlertMins: data.taskIntervalAlertMins || 10,
          taskIntervalRingSecs: data.taskIntervalRingSecs || 10,
          isTaskIntervalAlertEnabled: data.isTaskIntervalAlertEnabled || false,
        });
        useDashboardStore.getState().forceInstantSave();

        showAlertModal('Data Restored', 'Plan Your Day data restored successfully!');

      } catch (err) {
        showAlertModal('Restore Failed', 'Failed to parse backup file.');
      } finally {
        setIsProcessingBackup(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const handleBackupNotes = () => {
    showBackupModal(
      'Backup Notes',
      'notes_backup.json',
      'Notes Backup',
      'All your personal notes, ideas, and saved HTML content inside the notepad.',
      () => useNoteStore.getState().notes || []
    );
  };

  const handleRestoreNotes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingBackup(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          useNoteStore.getState().setNotes(data);
          showAlertModal('Data Restored', 'Notes restored successfully!');
        } else {
          showAlertModal('Restore Failed', 'Invalid format for notes backup.');
        }
      } catch (err) {
        showAlertModal('Restore Failed', 'Failed to parse backup file.');
      } finally {
        setIsProcessingBackup(false);
        useDashboardStore.getState().forceInstantSave();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBackupSettings = () => {
    showBackupModal(
      'Backup Settings',
      'settings_backup.json',
      'Settings Backup',
      'App theme, clocks, panic mode configs, focus mode settings, quote settings, and layout visibilities (excludes heavy data like stats and histories).',
      () => {
        const state = useDashboardStore.getState();
        const EXCLUDED_KEYS = ['history', 'healthData', 'tasks', 'tomorrowTasks', 'notes', 'timetableGrid', 'timetableColors', 'stopwatchSessions', 'deadlines', 'syntheticDeadlines', 'activeTaskId'];
        const settingsData: any = {};
        Object.keys(state).forEach(key => {
          if (typeof (state as any)[key] !== 'function' && !EXCLUDED_KEYS.includes(key)) {
            settingsData[key] = (state as any)[key];
          }
        });
        return settingsData;
      }
    );
  };

  const handleRestoreSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingBackup(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const EXCLUDED_KEYS = ['history', 'healthData', 'tasks', 'tomorrowTasks', 'notes', 'timetableGrid', 'timetableColors', 'stopwatchSessions', 'deadlines', 'syntheticDeadlines', 'activeTaskId'];
        const restoreData: any = {};
        Object.keys(data).forEach(key => {
          if (!EXCLUDED_KEYS.includes(key)) {
            restoreData[key] = data[key];
          }
        });
        useDashboardStore.setState(restoreData);
        showAlertModal('Data Restored', 'Settings restored successfully!');
      } catch (err) {
        showAlertModal('Restore Failed', 'Failed to parse backup file.');
      } finally {
        setIsProcessingBackup(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBackupTimetable = () => {
    showBackupModal(
      'Backup Timetable',
      'timetable_backup.json',
      'Timetable Backup',
      'Your weekly schedule, grid layout, times, and colors.',
      () => {
        const state = useDashboardStore.getState();
        return {
          timetableGrid: state.timetableGrid,
          timetableColors: state.timetableColors,
          weekdayTimes: state.weekdayTimes,
          weekendTimes: state.weekendTimes,
          timetableStartTime: state.timetableStartTime,
          timetableWeekendStartTime: state.timetableWeekendStartTime,
        };
      }
    );
  };

  const handleRestoreTimetable = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingBackup(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (data.timetableGrid) {
          const restoredPayload = {
            timetableGrid: data.timetableGrid || {},
            timetableColors: data.timetableColors || {},
            weekdayTimes: data.weekdayTimes || [],
            weekendTimes: data.weekendTimes || [],
            timetableStartTime: data.timetableStartTime || 540,
            timetableWeekendStartTime: data.timetableWeekendStartTime || 540,
          };

          // 1. Update the local Timetable store
          useTimetableStore.setState(restoredPayload);

          // 2. CRITICAL FIX: Use the dedicated API function instead of forceInstantSave
          pushTimetableToDB(restoredPayload);

          showAlertModal('Data Restored', 'Timetable restored successfully!');

        } else {
          showAlertModal('Restore Failed', 'Invalid backup file format for Timetable.');
        }
      } catch (err) {
        showAlertModal('Restore Failed', 'Failed to parse backup file.');
      } finally {
        setIsProcessingBackup(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const handleExportData = () => {
    showBackupModal(
      'Full Dashboard Backup',
      'dashboard_full_backup.json',
      'Full Backup',
      'All your settings, tasks, timetables, statistics, history, and notes.',
      () => {
        return {
          version: 2,
          state: useDashboardStore.getState()
        };
      }
    );
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('dashboard_sync_token');
      if (!token) {
        showAlertModal('Login Required', 'You must be logged in to import data. Please login via the Connect tab.');
        e.target.value = '';
        return;
      }

      const text = await file.text();
      const parsed = JSON.parse(text);

      if (typeof parsed !== 'object' || parsed === null || !('state' in parsed)) {
        showAlertModal('Invalid Backup', 'Invalid backup file. Missing required dashboard data structure.');
        e.target.value = '';
        return;
      }

      // Prevent cheating: Strip out stats/history from imported data so users cannot fake leaderboard times
      if (parsed.state) {
        delete parsed.state.history;
        delete parsed.state.dailyTimes;
        delete parsed.state.stopwatchSessions;
        delete parsed.state.timerLastSavedChunks;
      }

      const processImportData = async (isMerge: boolean) => {
        try {
          let finalData = parsed;

          // 1. Intercept and merge external store data (Tasks & Notes)
          const parsedTasks = parsed.state.tasks || [];
          const parsedNotes = parsed.state.notes || [];

          if (parsedTasks.length > 0) {
            const currentTasks = isMerge ? (useTaskStore.getState().tasks || []) : [];
            useTaskStore.getState().setTasks([...currentTasks, ...parsedTasks].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i));
          }
          if (parsedNotes.length > 0) {
            const currentNotes = isMerge ? (useNoteStore.getState().notes || []) : [];
            useNoteStore.getState().setNotes([...currentNotes, ...parsedNotes].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i));
          }

          // 2. Remove them from the parsed object so they don't break the Dashboard state types
          delete parsed.state.tasks;
          delete parsed.state.notes;
          delete parsed.state.timetableGrid;

          // 3. Process the rest of the Dashboard state normally
          if (isMerge) {
            const currentState = useDashboardStore.getState();
            finalData = {
              version: parsed.version || 2,
              state: {
                ...currentState,
                ...parsed.state,
                countdowns: [...(currentState.countdowns || []), ...(parsed.state.countdowns || [])].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i),
                deadlines: [...(currentState.deadlines || []), ...(parsed.state.deadlines || [])].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i),
                roadmaps: [...(currentState.roadmaps || []), ...(parsed.state.roadmaps || [])].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i),
              }
            };
          }

          const res = await fetch('/api/store', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ data: finalData })
          });

          if (res.ok) {
            showAlertModal('Import Successful', 'Data backup imported successfully! Reloading application...', () => window.location.reload());
          } else {
            showAlertModal('Import Failed', 'Import failed. Server rejected the data.');
          }
        } catch (err) {
          console.error(err);
          showAlertModal('Import Failed', 'Invalid JSON file format.');
        } finally {
          setIsProcessingBackup(false);
        }
      };

      setConfirmModal({
        isOpen: true,
        title: 'Restore Backup',
        message: 'Do you want to MERGE this backup with your current data?\n\n• Merge: Combine old and new data without losing existing settings.\n• Overwrite: Wipe existing data and replace it entirely with the backup.',
        confirmText: 'Merge',
        cancelText: 'Overwrite',
        onConfirm: () => processImportData(true),
        onCancel: () => processImportData(false),
      });

    } catch (err) {
      console.error(err);
      showAlertModal('Import Failed', 'Invalid JSON file format.');
      setIsProcessingBackup(false);
    }
    e.target.value = '';
  };

  const handleTabClick = (tab: string) => {
    setSettingsActiveTab(tab as any);
    setIsMobileDetailView(true);
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-1.5 sm:p-4 pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={() => {
          stopPreviewAudio();
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
                onClick={(e) => { e.stopPropagation(); setInfoModalKey('dragControls'); }}
                className={`${isMobileDetailView ? 'hidden md:flex' : 'flex'} p-1 text-blue-400 hover:text-blue-300 bg-white/5 hover:bg-white/10 border border-blue-500/20 rounded-full transition-colors shrink-0`}
                title="View Drag Controls"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
            {isMobileDetailView && ['preferences', 'sound', 'focus', 'wallpaper', 'data'].includes(settingsActiveTab) && (
              <button
                onClick={() => setInfoModalKey(settingsActiveTab === 'wallpaper' ? 'wallpapers' : settingsActiveTab === 'focus' ? 'panic' : settingsActiveTab === 'data' ? 'backup' : settingsActiveTab)}
                className="md:hidden p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-400 bg-white/5 border border-white/10 shadow-sm active:scale-95"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                stopPreviewAudio();
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
                <ImageIcon className="w-3.5 h-3.5" /> Wallpapers
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
                className={`relative overflow-hidden group flex flex-row w-full items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${settingsActiveTab === 'about' && !isMobileDetailView ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'}`}
              >
                <div className="absolute top-0 bottom-0 w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none glass-sweep-anim" style={{ left: '-100%' }} />
                <img
                  src="/branding/author.jpeg"
                  alt="Developer"
                  className="w-8 h-8 rounded-full object-cover shadow-sm border border-white/30 shrink-0"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="text-[10px] font-bold text-white/90">Anand Kumar</span>
                  <span className="text-[8px] text-blue-300 font-bold uppercase tracking-wider">Developer</span>
                </div>
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

              {settingsActiveTab === 'connect' && (
                <ConnectTab />
              )}

              {settingsActiveTab === 'preferences' && (
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
                        <Eye className="w-3.5 h-3.5" /> Widget Visibility Toggles
                      </h4>
                      <p className="text-[9px] md:text-[10px] text-white/50 px-1 leading-snug break-words">Turn individual dashboard components on or off globally.</p>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 mt-1">
                        {[
                          { key: 'showQuote', icon: MessageSquare, label: 'Quote Box', color: 'text-purple-400', state: showQuote },
                          { key: 'showTimer', icon: TimerIcon, label: 'Timer', color: 'text-yellow-400', state: showTimer },
                          { key: 'showStopwatch', icon: Clock, label: 'Stopwatch', color: 'text-blue-400', state: showStopwatch },
                          { key: 'showCountdowns', icon: Hourglass, label: 'Targets', color: 'text-indigo-400', state: showCountdowns },
                          { key: 'showVideoControls', icon: Film, label: 'Media Ctrl', color: 'text-green-400', state: showVideoControls },
                          { key: 'showTodayWork', icon: Flame, label: 'Today Focus', color: 'text-orange-400', state: showTodayWork },
                          { key: 'showTasks', icon: CheckSquare, label: 'Tasks', color: 'text-orange-400', state: showTasks },
                          { key: 'showCalendar', icon: Calendar, label: 'Calendar', color: 'text-pink-400', state: showCalendar },
                          { key: 'showStats', icon: BarChart2, label: 'Stats Modal', color: 'text-emerald-400', state: showStats },
                          { key: 'showPlans', icon: Map, label: 'Roadmap', color: 'text-indigo-400', state: showPlans },
                          { key: 'showNotes', icon: StickyNote, label: 'Quick Notes', color: 'text-yellow-300', state: showNotes },
                          { key: 'showTimetable', icon: CalendarDays, label: 'Timetable', color: 'text-purple-400', state: showTimetable },
                          { key: 'showDock', icon: Layout, label: 'Bottom Dock', color: 'text-cyan-300', state: showDock },
                          { key: 'showDeadlineAlerts', icon: Bell, label: 'Alerts', color: 'text-red-400', state: showDeadlineAlerts },
                          { key: 'showBgSwitcher', icon: ImageIcon, label: 'Bg Switch', color: 'text-green-300', state: showBgSwitcher },
                          { key: 'showClock', icon: Clock, label: 'Big Clock', color: 'text-cyan-400', state: showClock },
                        ].map(({ key, icon: Icon, label, color, state }) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 hover:bg-white/5 transition-colors">
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
                          useDashboardStore.getState().startTour();
                          toggleSettings();
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-lg font-bold text-[10px] shadow-sm active:scale-95 transition-all w-full sm:w-auto text-center shrink-0"
                      >
                        Replay Tour
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveTab === 'sound' && (
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="flex items-start justify-between gap-2 px-1">
                    <div className="flex flex-col">
                      <h3 className="text-sm md:text-base font-bold text-white/90">Sound Settings</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Configure audio ringtones, alarm durations, and focus interval beeps.</p>
                    </div>
                    <button onClick={() => setInfoModalKey('sound')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-colors shrink-0">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* SECTION 1: DEFAULT ALARM RINGTONES */}
                    <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
                      <div className="flex items-center justify-between px-1 pb-1 border-b border-white/5 gap-2">
                        <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5 break-words">
                          <Music className="w-3.5 h-3.5" /> Default Ringtones
                        </h4>
                        <span className="text-[8px] md:text-[9px] text-white/40 italic break-words text-right">Drag to scroll</span>
                      </div>

                      <div className="h-[28vh] md:h-52 rounded-xl bg-black/40 border border-white/10 overflow-hidden relative mt-1">
                        <ScrollableWithArrows className="p-1.5 flex flex-col gap-1.5" downArrowOffset="bottom-2">
                          {DEFAULT_ALARM_SOUNDS.map((sound) => {
                            const isActive = alarmSound === sound.url || (sound.url === '/ringtones/narutoBGM.mp3' && alarmSound === '/ringtones/alarm.mp3');
                            const isPreviewing = previewingAudioUrl === sound.url;

                            return (
                              <div
                                key={sound.id}
                                onClick={() => {
                                  stopPreviewAudio();
                                  setAlarmSound(sound.url);
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all select-none cursor-pointer ${isActive
                                  ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-sm'
                                  : 'bg-white/5 border-transparent hover:bg-white/10 text-white/80 hover:text-white'
                                  }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0 pr-2 flex-1">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${isActive ? 'border-blue-400 bg-blue-500/30' : 'border-white/30'}`}>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[10px] md:text-xs font-bold break-words leading-tight">{sound.name}</span>
                                    {isActive && <span className="text-[8px] md:text-[9px] text-blue-300 font-bold uppercase tracking-wider mt-0.5">Active Default</span>}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePreviewAudio(sound.url);
                                  }}
                                  className="p-1.5 md:p-2 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-white/80 hover:text-white transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                                >
                                  {isPreviewing ? <Pause className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            );
                          })}
                        </ScrollableWithArrows>
                      </div>
                    </div>

                    {/* SECTION 2: CUSTOM RINGTONES */}
                    <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
                      <div className="flex items-center justify-between px-1 pb-1 border-b border-white/5 gap-2">
                        <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5 break-words">
                          <Upload className="w-3.5 h-3.5" /> Custom Ringtones
                        </h4>

                        <input type="file" ref={audioFileInputRef} onChange={handleAudioUpload} accept="audio/*" className="hidden" />

                        <button
                          type="button"
                          onClick={() => audioFileInputRef.current?.click()}
                          disabled={(customAlarmSounds || []).length >= 3}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold transition-all border shrink-0 cursor-pointer ${(customAlarmSounds || []).length >= 3
                            ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                            : 'bg-purple-600/20 hover:bg-purple-600/40 border-purple-500/40 text-purple-200 hover:text-white'
                            }`}
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload ({(customAlarmSounds || []).length}/3)</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-1">
                        {(customAlarmSounds || []).length === 0 ? (
                          <div className="p-4 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-[10px] md:text-xs bg-black/20 break-words">
                            No custom ringtones uploaded yet. Max 3 files.
                          </div>
                        ) : (
                          (customAlarmSounds || []).map((sound) => {
                            const isActive = alarmSound === sound.url;
                            const isPreviewing = previewingAudioUrl === sound.url;
                            return (
                              <div
                                key={sound.id}
                                className={`flex items-center justify-between p-2 md:p-2.5 rounded-xl border transition-all ${isActive
                                  ? 'bg-purple-500/10 border-purple-500/40 shadow-sm'
                                  : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-black/60'
                                  }`}
                              >
                                <div
                                  className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0 pr-2"
                                  onClick={() => {
                                    stopPreviewAudio();
                                    setAlarmSound(sound.url);
                                  }}
                                >
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${isActive ? 'border-purple-400 bg-purple-500/30' : 'border-white/30'}`}>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] md:text-[11px] font-bold break-words leading-tight text-white/90">{sound.name}</span>
                                    {isActive && <span className="text-[8px] md:text-[9px] text-purple-300 font-bold uppercase tracking-wider mt-0.5">Active Custom</span>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePreviewAudio(sound.url)}
                                    className="p-1.5 md:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {isPreviewing ? <Pause className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      stopPreviewAudio();
                                      if (sound.url.startsWith('custom-audio-')) {
                                        deleteAudioFromDB(sound.url);
                                      }
                                      deleteCustomAlarmSound(sound.id);
                                    }}
                                    className="p-1.5 md:p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* SECTION 3: ALARM DURATION & SOUND TOGGLES */}
                    <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
                      <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 px-1 pb-1 border-b border-white/5">
                        <Volume2 className="w-3.5 h-3.5" /> Alarm Duration & Toggles
                      </h4>

                      <div className="flex flex-col gap-1.5 mt-1">
                        {/* Auto Stop Timer */}
                        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-black/40 border border-white/5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col min-w-0">
                              <label className="text-[11px] md:text-xs font-bold text-white/90 break-words">Auto Stop Timer</label>
                              <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">How long the alarm rings before stopping automatically.</p>
                            </div>
                            <span className="text-[9px] md:text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">{alarmDurationSecs}s</span>
                          </div>
                          <input
                            type="range" min="5" max="120" step="5"
                            value={alarmDurationSecs || 60}
                            onChange={(e) => setAlarmDurationSecs(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                          />
                          <div className="flex justify-between text-[8px] md:text-[9px] font-bold text-white/40">
                            <span>5s</span><span>60s</span><span>120s</span>
                          </div>
                        </div>

                        {/* Enable Sound */}
                        <div className="flex flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
                          <div className="flex flex-col pr-2 min-w-0">
                            <span className="text-[11px] md:text-xs font-bold text-white/90 break-words">Enable Alarm Sound</span>
                            <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Play ringtone when timer completes.</p>
                          </div>
                          <button onClick={() => setEnableAlarmSound(!enableAlarmSound)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${enableAlarmSound ? 'bg-blue-500' : 'bg-white/20'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enableAlarmSound ? 'translate-x-4.5' : 'translate-x-1'}`} />
                          </button>
                        </div>

                        {/* Enable Vibrate */}
                        <div className="flex flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
                          <div className="flex flex-col pr-2 min-w-0">
                            <span className="text-[11px] md:text-xs font-bold text-white/90 break-words">Enable Device Vibration</span>
                            <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Vibrate supported devices on timer end.</p>
                          </div>
                          <button onClick={() => setEnableAlarmVibration(!enableAlarmVibration)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${enableAlarmVibration ? 'bg-blue-500' : 'bg-white/20'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enableAlarmVibration ? 'translate-x-4.5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: TASK TIMER INTERVAL ALERTS */}
                    <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
                      <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 px-1 pb-1 border-b border-white/5">
                        <Bell className="w-3.5 h-3.5" /> Interval Focus Beeps
                      </h4>

                      <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-black/40 border border-white/5 mt-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                            <label className="text-[11px] md:text-xs font-bold text-white/90 break-words">Alert Frequency</label>
                            <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Plays a short beep every X mins during active tasks.</p>
                          </div>
                          <span className="text-[9px] md:text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">{taskIntervalAlertMins}m</span>
                        </div>
                        <input
                          type="range" min="1" max="60" step="1"
                          value={taskIntervalAlertMins || 10}
                          onChange={(e) => setTaskIntervalAlertMins(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-1"
                        />
                        <div className="flex justify-between text-[8px] md:text-[9px] font-bold text-white/40">
                          <span>1m</span><span>30m</span><span>60m</span>
                        </div>

                        <div className="h-px bg-white/10 w-full my-1.5" />

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                            <label className="text-[11px] md:text-xs font-bold text-white/90 break-words">Beep Duration</label>
                            <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">How long the interval rings before stopping.</p>
                          </div>
                          <span className="text-[9px] md:text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">{taskIntervalRingSecs}s</span>
                        </div>
                        <input
                          type="range" min="1" max="30" step="1"
                          value={taskIntervalRingSecs || 10}
                          onChange={(e) => setTaskIntervalRingSecs(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-1"
                        />
                        <div className="flex justify-between text-[8px] md:text-[9px] font-bold text-white/40">
                          <span>1s</span><span>15s</span><span>30s</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {settingsActiveTab === 'quotes' && (
                <div className="flex flex-col gap-3 md:gap-4 min-h-[50vh]">
                  <div className="flex items-start justify-between gap-2 px-1">
                    <div className="flex flex-col">
                      <h3 className="text-sm md:text-base font-bold text-white/90">Quotes Settings</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Manage your custom motivational quotes for the dashboard.</p>
                    </div>
                  </div>

                  <div className="flex flex-row items-start sm:items-center justify-between p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 gap-3 shadow-sm">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 bg-pink-500/10 rounded-lg border border-pink-500/20 shrink-0">
                        <MessageSquare className="text-pink-400 w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[11px] md:text-xs text-white/90 break-words">Use Custom Quotes</span>
                        <span className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Show your custom list instead of system defaults</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setUseCustomQuotes(!useCustomQuotes)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${useCustomQuotes ? 'bg-pink-500' : 'bg-white/20'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${useCustomQuotes ? 'translate-x-4.5' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {useCustomQuotes && (
                    <div className="flex flex-col gap-2.5 p-2.5 md:p-3 rounded-xl bg-black/20 border border-white/5">

                      {/* Add new quote form */}
                      <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex flex-col gap-2">
                        <h4 className="text-[10px] md:text-[11px] font-bold text-white/80 uppercase tracking-wider">Add New Quote</h4>
                        <input
                          type="text"
                          placeholder="Quote text..."
                          value={newQuoteText}
                          onChange={(e) => setNewQuoteText(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-[10px] md:text-xs outline-none focus:border-pink-500/50 placeholder:text-white/30 text-white font-medium shadow-inner"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Author (optional)"
                            value={newQuoteAuthor}
                            onChange={(e) => setNewQuoteAuthor(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-[10px] md:text-xs outline-none focus:border-pink-500/50 placeholder:text-white/30 text-white font-medium shadow-inner"
                          />
                          <button onClick={handleAddQuote} className="bg-pink-500/20 border border-pink-500/30 hover:bg-pink-500 text-pink-300 hover:text-white px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all active:scale-95 shrink-0">
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center px-1 pt-1 border-t border-white/5 mt-1">
                        <span className="text-[10px] md:text-[11px] font-bold text-white/70">Your Quotes ({customQuotes.length}/50)</span>
                        <button onClick={() => setShowBulkAddModal(true)} className="text-[9px] md:text-[10px] text-pink-400 hover:text-pink-300 font-bold bg-pink-500/10 px-2 py-1 rounded border border-pink-500/20 transition-colors">
                          Bulk Add JSON
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 h-[25vh] md:h-[30vh]">
                        <ScrollableWithArrows className="custom-scrollbar pr-1">
                          <div className="flex flex-col gap-1.5">
                            {customQuotes.length === 0 ? (
                              <div className="text-center py-6 text-[10px] md:text-xs text-white/40 italic bg-black/30 rounded-xl border border-white/5 break-words px-2">
                                No custom quotes added. Add some above!
                              </div>
                            ) : (
                              customQuotes.map((q, idx) => (
                                <div key={idx} className="flex items-start justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl gap-2 hover:bg-black/60 transition-colors">
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <span className="text-[10px] md:text-[11px] text-white/90 break-words leading-snug font-medium">"{q.text}"</span>
                                    <span className="text-[8px] md:text-[9px] text-pink-300/80 font-bold tracking-wide mt-1">- {q.author || 'Unknown'}</span>
                                  </div>
                                  <button onClick={() => handleDeleteQuote(idx)} className="p-1.5 text-white/30 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors shrink-0">
                                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollableWithArrows>
                      </div>
                    </div>
                  )}

                  {/* MANIFESTATION BOARD QUOTES */}
                  <div className="flex flex-col gap-2.5 mt-1 bg-white/[0.03] border border-white/10 rounded-xl p-2.5 md:p-3 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/5 pb-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h4 className="font-bold text-[11px] md:text-xs text-amber-300 break-words">Manifestation Board Quotes</h4>
                          <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Add custom phrases (max 30) for your vision board overlay.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <button
                          onClick={() => setShowBulkAddManifestation(!showBulkAddManifestation)}
                          className="text-[9px] md:text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded hover:bg-amber-500/20 font-bold transition-colors cursor-pointer"
                        >
                          {showBulkAddManifestation ? 'Hide Bulk' : 'Bulk Add'}
                        </button>
                        <span className="text-[9px] md:text-[10px] font-mono font-bold text-amber-300 bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                          {(manifestationCustomQuotes || []).length}/30
                        </span>
                      </div>
                    </div>

                    {showBulkAddManifestation && (
                      <div className="bg-black/60 border border-amber-500/20 rounded-xl p-2.5 flex flex-col gap-2 shadow-inner">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] md:text-[11px] font-bold text-amber-300 uppercase tracking-wider">Bulk Import Text</span>
                          <button onClick={() => setShowBulkAddManifestation(false)} className="p-0.5 text-white/40 hover:text-white bg-white/5 rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[8px] md:text-[9px] text-white/50 leading-tight break-words">
                          Paste multiple lines or a JSON array <code>["Quote 1", "Quote 2"]</code>.
                        </p>
                        <textarea
                          value={bulkManifestationInput}
                          onChange={(e) => setBulkManifestationInput(e.target.value)}
                          rows={4}
                          placeholder="Line 1: I am focused&#10;Line 2: Every small step counts"
                          className="w-full bg-black/40 border border-amber-500/20 rounded-lg p-2 text-[10px] md:text-xs font-mono text-amber-100/90 outline-none focus:border-amber-500/50 resize-none placeholder:text-white/20 custom-scrollbar"
                        />
                        <div className="flex justify-end mt-0.5">
                          <button
                            onClick={handleBulkAddManifestationQuotes}
                            className="bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500 text-amber-200 hover:text-black px-4 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Import Now
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/5">
                      <input
                        type="text"
                        placeholder="Type manifestation quote..."
                        value={newManifestationQuoteText}
                        onChange={(e) => setNewManifestationQuoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddManifestationQuote();
                          }
                        }}
                        className="flex-1 bg-transparent px-2 text-[10px] md:text-xs outline-none placeholder:text-white/30 text-white font-medium"
                      />
                      <button
                        onClick={handleAddManifestationQuote}
                        disabled={(manifestationCustomQuotes || []).length >= 30}
                        className="bg-amber-500/20 hover:bg-amber-500 disabled:opacity-30 text-amber-300 hover:text-black px-3 py-1.5 rounded-md text-[10px] font-bold transition-all shrink-0 border border-amber-500/30 hover:border-amber-500"
                      >
                        Add
                      </button>
                    </div>

                    {(manifestationCustomQuotes || []).length > 0 && (
                      <p className="text-[8.5px] md:text-[9.5px] text-amber-300/70 italic px-1 break-words">
                        ✨ Custom quotes are active and sync across devices!
                      </p>
                    )}

                    <div className="flex flex-col gap-1.5 max-h-[22vh] overflow-y-auto custom-scrollbar pr-1 mt-1">
                      {(manifestationCustomQuotes || []).length === 0 ? (
                        <div className="text-center py-4 text-[10px] md:text-[11px] text-white/40 italic bg-black/20 rounded-xl border border-white/5 px-2 break-words">
                          No custom quotes added. Default vision board quotes will show.
                        </div>
                      ) : (
                        (manifestationCustomQuotes || []).map((q, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 md:p-2.5 bg-black/40 border border-amber-500/10 hover:border-amber-500/20 rounded-xl gap-2 transition-colors">
                            <span className="text-[10px] md:text-[11px] text-amber-100/90 font-medium italic break-words leading-snug">
                              "{q}"
                            </span>
                            <button
                              onClick={() => deleteManifestationCustomQuote(idx)}
                              className="p-1.5 text-white/30 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Bulk Add Quotes JSON Modal */}
                  {showBulkAddModal && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xl z-50 flex flex-col p-4 md:p-6 md:rounded-r-3xl animate-in fade-in">
                      <div className="flex justify-between items-center mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2">
                          <Code className="text-pink-400 w-4 h-4" />
                          <h4 className="text-xs md:text-sm font-bold uppercase tracking-widest text-white/90">Bulk Import JSON</h4>
                        </div>
                        <button onClick={() => setShowBulkAddModal(false)} className="p-1.5 text-white/50 hover:text-white bg-black/40 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <p className="text-[9px] md:text-[10px] text-white/60 mb-2 px-1 break-words">Format must be valid JSON: <code>{`[{"text": "Quote here", "author": "Author Name"}]`}</code></p>
                      <textarea
                        value={bulkQuotesJson}
                        onChange={(e) => setBulkQuotesJson(e.target.value)}
                        className="flex-1 w-full bg-black/50 border border-pink-500/20 rounded-xl p-3 md:p-4 text-[10px] md:text-xs font-mono outline-none focus:border-pink-500/50 text-pink-100/80 resize-none custom-scrollbar shadow-inner"
                        placeholder='[\n  {"text": "Stay hungry, stay foolish.", "author": "Steve Jobs"}\n]'
                      />
                      <div className="flex justify-end mt-3">
                        <button onClick={handleBulkAddQuotes} className="bg-pink-500 hover:bg-pink-400 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg active:scale-95">Import JSON</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {settingsActiveTab === 'wallpaper' && (
                <div className="flex flex-col gap-3 md:gap-4 h-full pb-2">
                  <div className="flex items-start justify-between gap-2 px-1">
                    <div className="flex flex-col">
                      <h3 className="text-sm md:text-base font-bold text-white/90">Wallpapers</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Customize backgrounds for desktop and mobile layouts.</p>
                    </div>
                  </div>

                  {/* PC Wallpaper Tutorial Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/20 gap-2 shadow-sm shrink-0">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/20 shrink-0">
                        <MonitorPlay className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-[11px] md:text-xs font-bold text-white/90 flex items-center gap-1.5 flex-wrap">
                          <span className="break-words">PC Wallpaper Background</span>
                          <span className="text-[8px] bg-blue-500/30 text-blue-200 border border-blue-500/40 px-1.5 py-0.5 rounded font-bold">Tutorial</span>
                        </h4>
                        <p className="text-[9px] md:text-[10px] text-white/60 leading-snug mt-0.5 break-words">
                          Learn how to set up an interactive desktop background via Lively.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsWallpaperTutorialOpen(true)}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold text-[10px] shadow-sm active:scale-95 transition-all w-full sm:w-auto text-center shrink-0 flex justify-center items-center gap-1.5"
                    >
                      <MonitorPlay className="w-3 h-3 text-blue-300 hidden sm:block" /> Setup Guide
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
                    {/* Desktop Wallpapers */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 md:p-4 flex flex-col gap-2.5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="font-bold text-[11px] md:text-xs text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5" /> Desktop
                        </h4>
                        {customDesktopWallpapers.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Delete All Desktop Wallpapers',
                                message: 'Are you sure you want to delete all custom desktop wallpapers?',
                                isDestructive: true,
                                onConfirm: async () => {
                                  for (const url of customDesktopWallpapers) {
                                    if (url.startsWith('custom-')) await deleteWallpaperFromDB(url).catch(() => { });
                                  }
                                  setCustomDesktopWallpapers([]);
                                  setActiveDesktopCustomIndex(null);
                                }
                              });
                            }}
                            className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20 cursor-pointer font-bold"
                          >
                            <Trash2 className="w-3 h-3" /> Delete All
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {customDesktopWallpapers.map((url, i) => (
                          <CustomWallpaperPreview
                            key={`desktop-wp-${i}`}
                            url={url}
                            isActive={activeDesktopCustomIndex === i}
                            onClick={() => setActiveDesktopCustomIndex(i)}
                            onShowAlert={showAlertModal}
                            onDelete={async (e: React.MouseEvent) => {
                              e.stopPropagation();
                              setConfirmModal({
                                isOpen: true,
                                title: 'Remove Wallpaper',
                                message: 'Are you sure you want to remove this wallpaper?',
                                isDestructive: true,
                                onConfirm: async () => {
                                  const newUrls = [...customDesktopWallpapers];
                                  newUrls.splice(i, 1);
                                  setCustomDesktopWallpapers(newUrls);
                                  if (activeDesktopCustomIndex === i) setActiveDesktopCustomIndex(null);
                                  else if (activeDesktopCustomIndex !== null && activeDesktopCustomIndex > i) setActiveDesktopCustomIndex(activeDesktopCustomIndex - 1);
                                  if (url.startsWith('custom-')) await deleteWallpaperFromDB(url);
                                }
                              });
                            }}
                            label={url.startsWith('custom-') ? 'Local File' : (url.split('/').pop() || 'image')}
                            aspectClass="aspect-video"
                          />
                        ))}
                      </div>

                      {customDesktopWallpapers.length < 8 && (
                        <div className="flex gap-2 w-full mt-1">
                          <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-black/40 hover:bg-black/60 border border-white/10 border-dashed rounded-lg text-[9px] md:text-[10px] text-white/60 hover:text-white cursor-pointer transition-colors font-semibold">
                            <Plus className="w-3.5 h-3.5" /> File
                            <input
                              type="file" accept="image/*,video/*" className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 25 * 1024 * 1024) {
                                  showAlertModal('File Too Large', 'Maximum allowed file size is 25MB.');
                                  return;
                                }
                                const id = `custom-desktop-${Date.now()}`;
                                await saveWallpaperToDB(id, file);
                                setCustomDesktopWallpapers([...customDesktopWallpapers, id]);
                                if (activeDesktopCustomIndex === null) setActiveDesktopCustomIndex(customDesktopWallpapers.length);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true, title: 'Add Wallpaper URL', message: 'Enter direct image or video URL (https://...):', isPrompt: true, promptPlaceholder: 'https://...',
                                onConfirm: (url?: string) => {
                                  if (url && url.trim().startsWith('http')) {
                                    setCustomDesktopWallpapers([...customDesktopWallpapers, url.trim()]);
                                    if (activeDesktopCustomIndex === null) setActiveDesktopCustomIndex(customDesktopWallpapers.length);
                                  }
                                }
                              });
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-black/40 hover:bg-black/60 border border-white/10 rounded-lg text-[9px] md:text-[10px] text-white/60 hover:text-white transition-colors font-semibold"
                          >
                            <LinkIcon className="w-3.5 h-3.5" /> URL
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Mobile Wallpapers */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 md:p-4 flex flex-col gap-2.5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="font-bold text-[11px] md:text-xs text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5" /> Mobile
                        </h4>
                        {customMobileWallpapers.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Delete All Mobile Wallpapers',
                                message: 'Are you sure you want to delete all custom mobile wallpapers?',
                                isDestructive: true,
                                onConfirm: async () => {
                                  for (const url of customMobileWallpapers) {
                                    if (url.startsWith('custom-')) await deleteWallpaperFromDB(url).catch(() => { });
                                  }
                                  setCustomMobileWallpapers([]);
                                  setActiveMobileCustomIndex(null);
                                }
                              });
                            }}
                            className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20 cursor-pointer font-bold"
                          >
                            <Trash2 className="w-3 h-3" /> Delete All
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {customMobileWallpapers.map((url, i) => (
                          <CustomWallpaperPreview
                            key={`mobile-wp-${i}`}
                            url={url}
                            isActive={activeMobileCustomIndex === i}
                            onClick={() => setActiveMobileCustomIndex(i)}
                            onShowAlert={showAlertModal}
                            onDelete={async (e: React.MouseEvent) => {
                              e.stopPropagation();
                              setConfirmModal({
                                isOpen: true,
                                title: 'Remove Wallpaper',
                                message: 'Are you sure you want to remove this wallpaper?',
                                isDestructive: true,
                                onConfirm: async () => {
                                  const newUrls = [...customMobileWallpapers];
                                  newUrls.splice(i, 1);
                                  setCustomMobileWallpapers(newUrls);
                                  if (activeMobileCustomIndex === i) setActiveMobileCustomIndex(null);
                                  else if (activeMobileCustomIndex !== null && activeMobileCustomIndex > i) setActiveMobileCustomIndex(activeMobileCustomIndex - 1);
                                  if (url.startsWith('custom-')) await deleteWallpaperFromDB(url);
                                }
                              });
                            }}
                            label={url.startsWith('custom-') ? 'Local File' : (url.split('/').pop() || 'image')}
                            aspectClass="aspect-[9/16]"
                          />
                        ))}
                      </div>

                      {customMobileWallpapers.length < 8 && (
                        <div className="flex gap-2 w-full mt-1">
                          <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-black/40 hover:bg-black/60 border border-white/10 border-dashed rounded-lg text-[9px] md:text-[10px] text-white/60 hover:text-white cursor-pointer transition-colors font-semibold">
                            <Plus className="w-3.5 h-3.5" /> File
                            <input
                              type="file" accept="image/*,video/*" className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 25 * 1024 * 1024) {
                                  showAlertModal('File Too Large', 'Maximum allowed file size is 25MB.');
                                  return;
                                }
                                const id = `custom-mobile-${Date.now()}`;
                                await saveWallpaperToDB(id, file);
                                setCustomMobileWallpapers([...customMobileWallpapers, id]);
                                if (activeMobileCustomIndex === null) setActiveMobileCustomIndex(customMobileWallpapers.length);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true, title: 'Add Wallpaper URL', message: 'Enter direct image or video URL (https://...):', isPrompt: true, promptPlaceholder: 'https://...',
                                onConfirm: (url?: string) => {
                                  if (url && url.trim().startsWith('http')) {
                                    setCustomMobileWallpapers([...customMobileWallpapers, url.trim()]);
                                    if (activeMobileCustomIndex === null) setActiveMobileCustomIndex(customMobileWallpapers.length);
                                  }
                                }
                              });
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-black/40 hover:bg-black/60 border border-white/10 rounded-lg text-[9px] md:text-[10px] text-white/60 hover:text-white transition-colors font-semibold"
                          >
                            <LinkIcon className="w-3.5 h-3.5" /> URL
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reset selection */}
                  {(activeDesktopCustomIndex !== null || activeMobileCustomIndex !== null) && (
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={() => {
                          setActiveDesktopCustomIndex(null);
                          setActiveMobileCustomIndex(null);
                        }}
                        className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[10px] md:text-[11px] font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" /> Clear Active Selections
                      </button>
                    </div>
                  )}

                </div>
              )}

              {settingsActiveTab === 'focus' && (
                <div className="flex flex-col gap-3 md:gap-4 h-full pb-4">
                  <div className="flex items-start justify-between gap-2 px-1">
                    <div className="flex flex-col">
                      <h3 className="text-sm md:text-base font-bold text-white/90">Focus & Peek Mode</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Configure visibility shortcuts and custom peek backgrounds.</p>
                    </div>
                    <button onClick={() => setInfoModalKey('panic')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-colors shrink-0">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* SECTION 1: VISIBILITY SHORTCUTS & PEEK MODE */}
                  <div className="flex flex-col gap-2.5 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
                    <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5 px-1 pb-1 border-b border-white/5 break-words">
                      <EyeOff className="w-3.5 h-3.5" /> Visibility Shortcuts
                    </h4>

                    <div className="p-2 md:p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mt-1">
                      <p className="text-[9px] md:text-[10px] text-red-200/90 leading-relaxed break-words">
                        <strong className="text-red-400">Mobile Triggers:</strong> Tap the <strong className="text-white">Eye Icon</strong> on the right edge of your screen!
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Peek Mode Trigger */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3 shadow-inner">
                        <div className="flex flex-col min-w-0">
                          <p className="text-[11px] md:text-xs font-bold text-red-400 break-words">Peek Mode Trigger</p>
                          <p className="text-[9px] md:text-[10px] text-white/50 mt-0.5 leading-snug break-words">Hide all widgets instantly with this keyboard shortcut.</p>
                        </div>
                        <div className="flex items-start gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
                          <div className="flex flex-col items-center gap-1 flex-1 sm:flex-none">
                            <input
                              type="text"
                              value={formatShortcutText(panicShortcutKey)}
                              onKeyDown={(e) => handleShortcutCapture(e, setPanicShortcutKey)}
                              readOnly
                              placeholder="Keys..."
                              className="w-full sm:w-28 h-7 md:h-8 px-2 bg-black/60 border border-white/10 rounded-md text-center text-white/90 outline-none focus:border-red-400/50 font-bold uppercase text-[9px] md:text-[10px]"
                            />
                            <p className="text-[8px] text-white/40 italic break-words">Click & press keys</p>
                          </div>
                          <button
                            onClick={() => togglePanicHide()}
                            className="h-7 md:h-8 px-3 md:px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md border border-red-500/30 text-[9px] md:text-[10px] font-bold uppercase transition-colors shrink-0"
                          >
                            Trigger
                          </button>
                        </div>
                      </div>

                      {/* Focus Mode Trigger */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3 shadow-inner">
                        <div className="flex flex-col min-w-0">
                          <p className="text-[11px] md:text-xs font-bold text-blue-400 break-words">Focus Mode Trigger</p>
                          <p className="text-[9px] md:text-[10px] text-white/50 mt-0.5 leading-snug break-words">Hide selected widgets below with this keyboard shortcut.</p>
                        </div>
                        <div className="flex items-start gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
                          <div className="flex flex-col items-center gap-1 flex-1 sm:flex-none">
                            <input
                              type="text"
                              value={formatShortcutText(focusShortcutKey)}
                              onKeyDown={(e) => handleShortcutCapture(e, setFocusShortcutKey)}
                              readOnly
                              placeholder="Keys..."
                              className="w-full sm:w-28 h-7 md:h-8 px-2 bg-black/60 border border-white/10 rounded-md text-center text-white/90 outline-none focus:border-blue-400/50 font-bold uppercase text-[9px] md:text-[10px]"
                            />
                            <p className="text-[8px] text-white/40 italic break-words">Click & press keys</p>
                          </div>
                          <button
                            onClick={() => toggleHide()}
                            className="h-7 md:h-8 px-3 md:px-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-md border border-blue-500/30 text-[9px] md:text-[10px] font-bold uppercase transition-colors shrink-0"
                          >
                            Trigger
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3 mt-1">
                      <div className="flex items-start gap-2.5 min-w-0 pr-2">
                        <ImageIcon className="text-red-400 w-4 h-4 mt-0.5 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] md:text-xs font-bold text-white/90 break-words">Switch Wallpaper on Peek</span>
                          <span className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Change background image when Peek Mode is active.</span>
                        </div>
                      </div>
                      <button onClick={() => setPanicWallpaperSwitch(!panicWallpaperSwitch)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${panicWallpaperSwitch ? 'bg-red-500' : 'bg-white/20'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${panicWallpaperSwitch ? 'translate-x-4.5' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {/* Custom Peek Mode Background Setting */}
                    <div className="flex flex-col gap-2.5 p-2.5 md:p-3 rounded-lg bg-white/5 border border-white/10 mt-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <ImageIcon className="text-red-400 w-4 h-4 mt-0.5 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] md:text-xs font-bold text-red-300 break-words">Peek Mode Custom Background</span>
                            <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-0.5 break-words">Upload or choose a custom image/video for Peek Mode on this device.</p>
                          </div>
                        </div>
                        {peekModeWallpaper && (
                          <button
                            type="button"
                            onClick={() => setPeekModeWallpaper(null)}
                            className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-md text-[9px] md:text-[10px] font-bold border border-red-500/20 transition-colors shrink-0 self-start sm:self-auto"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>

                      {peekModeWallpaper && (
                        <div className="w-full max-w-[220px] mt-1">
                          <CustomWallpaperPreview
                            url={peekModeWallpaper}
                            isActive={true}
                            onClick={() => { }}
                            onShowAlert={showAlertModal}
                            onDelete={async (e) => {
                              e.stopPropagation();
                              if (peekModeWallpaper.startsWith('custom-')) {
                                await deleteWallpaperFromDB(peekModeWallpaper).catch(() => { });
                              }
                              setPeekModeWallpaper(null);
                            }}
                            label={peekModeWallpaper.startsWith('custom-') ? 'Local File' : 'URL Image'}
                            aspectClass="aspect-video"
                          />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 w-full mt-1">
                        <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 border-dashed rounded-lg text-[9px] md:text-[10px] text-red-200 cursor-pointer transition-colors font-semibold shadow-sm">
                          <Upload className="w-3.5 h-3.5" /> Upload Media
                          <input
                            type="file" accept="image/*,video/*" className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 25 * 1024 * 1024) {
                                showAlertModal('File Too Large', 'Maximum allowed file size is 25MB.');
                                return;
                              }
                              const id = `custom-peek-${Date.now()}`;
                              await saveWallpaperToDB(id, file);
                              setPeekModeWallpaper(id);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true, title: 'Add Peek Image/Video URL', message: 'Enter direct image or video URL (https://...):', isPrompt: true, promptPlaceholder: 'https://...',
                              onConfirm: (url?: string) => {
                                if (url && url.trim().startsWith('http')) setPeekModeWallpaper(url.trim());
                              }
                            });
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] md:text-[10px] text-white/70 hover:text-white transition-colors cursor-pointer font-semibold shadow-sm"
                        >
                          Add URL
                        </button>
                      </div>

                      {/* Quick Select from Gallery */}
                      {(() => {
                        const allWallpapers = Array.from(new Set([...(customDesktopWallpapers || []), ...(customMobileWallpapers || [])]));
                        if (allWallpapers.length === 0) return null;
                        return (
                          <div className="flex flex-col gap-1.5 mt-2 pt-2.5 border-t border-white/10">
                            <span className="text-[9px] md:text-[10px] text-white/50 font-bold tracking-wide uppercase break-words">Quick Select from Gallery</span>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                              {allWallpapers.map((url, idx) => (
                                <button
                                  key={`peek-pick-${idx}`} type="button" onClick={() => setPeekModeWallpaper(url)}
                                  className={`px-2.5 py-1.5 rounded-md text-[9px] font-mono border transition-all truncate max-w-[140px] shadow-sm ${peekModeWallpaper === url ? 'bg-red-500/20 text-red-200 border-red-500/40 font-bold' : 'bg-black/40 text-white/60 border-white/10 hover:text-white hover:bg-white/10'}`}
                                >
                                  {url.startsWith('custom-') ? `Local Media #${idx + 1}` : (url.split('/').pop() || `URL #${idx + 1}`)}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* SECTION 2: FOCUS SPECIFIC SETUP */}
                  <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-white/5">
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5 break-words">
                          <EyeOff className="w-3.5 h-3.5" /> Focus Specific Setup
                        </h4>
                        <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-1.5 break-words">Select which widgets to hide when Focus Mode is activated.</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 w-full lg:w-auto">
                        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 w-full sm:w-auto shadow-inner">
                          <button onClick={() => setFocusPlatform('desktop')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[9px] md:text-[10px] font-bold rounded-md transition-colors ${focusPlatform === 'desktop' ? 'bg-blue-500/20 text-blue-300 shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}>Desktop</button>
                          <button onClick={() => setFocusPlatform('mobile')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[9px] md:text-[10px] font-bold rounded-md transition-colors ${focusPlatform === 'mobile' ? 'bg-orange-500/20 text-orange-300 shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}>Mobile</button>
                        </div>
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <button onClick={() => focusPlatform === 'desktop' ? setHideAll(false) : setMobileHideAll(false)} className="flex-1 sm:flex-none px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] md:text-[10px] font-bold text-white/80 transition-colors shadow-sm">Keep All</button>
                          <button onClick={() => focusPlatform === 'desktop' ? setHideAll(true) : setMobileHideAll(true)} className="flex-1 sm:flex-none px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 text-[9px] md:text-[10px] font-bold transition-colors shadow-sm">Hide All</button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 md:gap-2 mt-1">
                      {Object.entries({
                        quote: 'Daily Quote', stats: 'Stats Modal', plans: 'Roadmap & Plans',
                        countdowns: 'Countdowns', tasks: 'Tasks', notes: 'Quick Notes',
                        calendar: 'Calendar', timetable: 'Timetable',
                        timer: 'Session Timer', dock: 'Bottom Dock', clock: 'Big Clock',
                        todayFocusPill: 'Focus Pill', timerPill: 'Timer Pill',
                        deadlineAlerts: 'Deadline Alerts', bgSwitcher: 'Bg Switcher', stopwatch: 'Stopwatch',
                        settingsBtn: 'Settings Btn',
                        manifestation: 'Manifestation Board'
                      }).map(([key, label]) => {
                        const isHidden = focusPlatform === 'desktop' ? hideConfig[key] : mobileHideConfig[key];
                        return (
                          <div key={key} className="flex items-center justify-between p-2 md:p-2.5 rounded-lg bg-black/40 border border-white/5 hover:bg-white/5 transition-colors shadow-inner">
                            <span className="text-[9px] md:text-[10px] font-bold text-white/80 break-words leading-tight pr-1.5 flex-1">{label}</span>
                            <button
                              onClick={() => focusPlatform === 'desktop' ? setHideConfig(key, !hideConfig[key]) : setMobileHideConfig(key, !mobileHideConfig[key])}
                              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors shrink-0 ${isHidden ? 'bg-red-500' : 'bg-blue-500/40'}`}
                            >
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${isHidden ? 'translate-x-4' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveTab === 'data' && (
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="flex items-start justify-between gap-2 px-1">
                    <div className="flex flex-col">
                      <h3 className="text-sm md:text-base font-bold text-white/90">Data & Backup</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Manage your local storage data safely.</p>
                    </div>
                    <button onClick={() => setInfoModalKey('backup')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-colors shrink-0">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <div className="bg-blue-500/20 p-1.5 rounded-lg shrink-0 mt-0.5">
                        <Activity className="text-blue-400 w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="font-bold text-[11px] md:text-xs text-blue-300 break-words">Important Recommendation</h4>
                        <p className="text-[9px] md:text-[10px] text-white/70 mt-1 leading-snug break-words">
                          Backup your data regularly. <strong className="text-white">Switch to a separate User Profile</strong> before importing a friend's plans to avoid overwriting your own tasks!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:gap-2.5 mt-1">
                    {/* Backup & Restore Items Generator */}
                    {[
                      { title: 'Global Backup', desc: 'Export/Import complete local JSON.', icon: UploadCloud, color: 'green', onBackup: handleExportData, onRestore: handleImportData },
                      { title: 'Plan Your Day', desc: 'Backup/Restore tasks & time intervals.', icon: UploadCloud, color: 'pink', onBackup: handleBackupPlanYourDay, onRestore: handleRestorePlanYourDay },
                      { title: 'Quick Notes', desc: 'Backup/Restore all your text notes.', icon: UploadCloud, color: 'yellow', onBackup: handleBackupNotes, onRestore: handleRestoreNotes },
                      { title: 'Settings', desc: 'Backup/Restore dashboard preferences.', icon: UploadCloud, color: 'blue', onBackup: handleBackupSettings, onRestore: handleRestoreSettings },
                      { title: 'Timetable', desc: 'Backup/Restore your weekly schedule.', icon: CalendarDays, color: 'violet', onBackup: handleBackupTimetable, onRestore: handleRestoreTimetable },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 gap-3 shadow-sm hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg bg-${item.color}-500/10 text-${item.color}-400 shrink-0 mt-0.5`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h4 className={`font-bold text-[11px] md:text-xs whitespace-nowrap text-${item.color}-300`}>{item.title}</h4>
                            <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                          <button
                            onClick={item.onBackup}
                            disabled={isProcessingBackup}
                            className="flex-1 sm:flex-none justify-center px-3 py-2 bg-black/40 hover:bg-black/60 rounded-lg text-[9px] md:text-[10px] font-bold border border-white/10 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                          >
                            <Download className="w-3.5 h-3.5 text-white/60" /> {isProcessingBackup ? '...' : 'Backup'}
                          </button>
                          <label className={`flex-1 sm:flex-none justify-center px-3 py-2 bg-${item.color}-500/10 hover:bg-${item.color}-500/20 text-${item.color}-200 rounded-lg text-[9px] md:text-[10px] font-bold border border-${item.color}-500/20 flex items-center gap-1.5 transition-all shadow-sm ${isProcessingBackup ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <Upload className="w-3.5 h-3.5" /> {isProcessingBackup ? '...' : 'Restore'}
                            <input type="file" className="hidden" accept=".json" onChange={(e) => { setIsProcessingBackup(true); item.onRestore(e); }} disabled={isProcessingBackup} />
                          </label>
                        </div>
                      </div>
                    ))}

                    <div className="my-1 border-t border-white/5" />

                    {/* Dangerous Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 gap-3 shadow-sm">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 shrink-0 mt-0.5">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h4 className="font-bold text-[11px] md:text-xs text-orange-300 break-words">Clear Tasks & Plans</h4>
                          <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Instantly delete all tasks and plans globally.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Clear Tasks & Plans',
                            message: 'Are you sure you want to completely clear all your tasks, tomorrow tasks, and plans? This action will permanently remove them from the cloud and cannot be undone.',
                            isDestructive: true,
                            onConfirm: () => {
                              useTaskStore.setState({ tasks: [], tomorrowTasks: [] });
                              pushTasksToDB({ tasks: [], tomorrowTasks: [] });
                              useDashboardStore.getState().forceInstantSave();
                              showAlertModal('Cleared Successfully', 'All tasks and plans have been deleted. Refreshing...');
                            }
                          });
                        }}
                        className="w-full sm:w-auto justify-center px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 rounded-lg text-[10px] font-bold border border-orange-500/40 flex items-center gap-1.5 whitespace-nowrap transition-colors shadow-sm"
                      >
                        Clear Tasks
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 gap-3 shadow-sm">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                          <CalendarDays className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h4 className="font-bold text-[11px] md:text-xs text-purple-300 break-words">Reset Timetable</h4>
                          <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Wipe existing schedule and colors to defaults.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Reset Timetable',
                            message: 'Are you sure you want to completely reset your Timetable to default? This cannot be undone.',
                            isDestructive: true,
                            onConfirm: () => {
                              useTimetableStore.getState().resetTimetable();
                              showAlertModal('Reset Complete', 'Timetable reset successfully');
                            }
                          });
                        }}
                        className="w-full sm:w-auto justify-center px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-lg text-[10px] font-bold border border-purple-500/40 flex items-center gap-1.5 whitespace-nowrap transition-colors shadow-sm"
                      >
                        Reset Schedule
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 gap-3 shadow-sm mt-1">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 shrink-0 mt-0.5">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h4 className="font-bold text-[11px] md:text-xs text-red-400 break-words">Factory Reset Profile</h4>
                          <p className="text-[9px] md:text-[10px] text-red-200/60 leading-snug break-words mt-0.5">Delete ALL tasks, notes, and history permanently.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Factory Reset Profile',
                            message: 'Are you absolutely sure you want to delete all tasks, notes, history, and settings? This action cannot be undone.',
                            requireText: 'delete all',
                            isDestructive: true,
                            onConfirm: async () => {
                              await clearAllData();
                            }
                          });
                        }}
                        className="w-full sm:w-auto justify-center px-4 py-2 bg-red-600/30 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold border border-red-500/50 flex items-center gap-1.5 whitespace-nowrap transition-all shadow-md active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Reset Everything
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveTab === 'about' && (
                <div className="flex flex-col gap-3 pb-4">
                  <div className="flex flex-col gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4 relative overflow-hidden shadow-lg">
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/20 blur-[60px] rounded-full mix-blend-screen pointer-events-none" />

                    <div className="flex flex-row items-center gap-4 w-full z-10">
                      <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 relative rounded-full overflow-hidden border-2 border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-black/50">
                        <img
                          src="/branding/author.jpeg"
                          alt="Gonaboyina Anand kumar"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>

                      <div className="flex flex-col flex-1 items-start text-left min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 w-full">
                          <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white break-words">Gonaboyina Anand kumar</h2>
                          <BadgeCheck className="text-blue-400 shrink-0 w-5 h-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        </div>
                        <p className="text-blue-300 font-bold tracking-wider uppercase text-[10px] md:text-xs">Full Stack MERN Developer</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start text-left z-10 w-full mt-2">
                      <p className="text-[10px] md:text-xs text-white/70 mb-3 md:mb-4 leading-relaxed break-words">
                        Have suggestions, feedback, or found a bug? I am actively updating this project. Reach out to me directly below!
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                        <a href="https://www.linkedin.com/in/anand-kumar-gonaboyina-b63946378" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/40 border border-[#0077b5]/30 rounded-xl p-2.5 hover:bg-[#0077b5]/10 hover:border-[#0077b5]/50 transition-all shadow-sm group">
                          <div className="p-2 bg-[#0077b5]/20 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0077b5] w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                          </div>
                          <div className="flex flex-col items-start min-w-0 flex-1">
                            <span className="text-[9px] md:text-[10px] text-white/50 w-full text-left uppercase font-bold tracking-wider">LinkedIn</span>
                            <span className="font-bold text-[11px] md:text-xs w-full text-left break-words text-white/90 group-hover:text-white">Message me</span>
                          </div>
                        </a>

                        <a href="https://t.me/gAnandKumar" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/40 border border-[#0088cc]/30 rounded-xl p-2.5 hover:bg-[#0088cc]/10 hover:border-[#0088cc]/50 transition-all shadow-sm group">
                          <div className="p-2 bg-[#0088cc]/20 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                            <Send className="text-[#0088cc] w-4 h-4" />
                          </div>
                          <div className="flex flex-col items-start min-w-0 flex-1">
                            <span className="text-[9px] md:text-[10px] text-white/50 w-full text-left uppercase font-bold tracking-wider">Telegram</span>
                            <span className="font-bold text-[11px] md:text-xs w-full text-left break-words text-white/90 group-hover:text-white">@gAnandKumar</span>
                          </div>
                        </a>

                        <a href="https://my-portfolio-silk-phi-78.vercel.app/" target="_blank" rel="noreferrer" className="sm:col-span-2 flex items-center gap-3 bg-black/40 border border-emerald-500/30 rounded-xl p-2.5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all shadow-sm group justify-center sm:justify-start">
                          <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                            <Briefcase className="text-emerald-400 w-4 h-4" />
                          </div>
                          <div className="flex flex-col items-start min-w-0 flex-1">
                            <span className="text-[9px] md:text-[10px] text-white/50 w-full text-left uppercase font-bold tracking-wider">Portfolio</span>
                            <span className="font-bold text-[11px] md:text-xs w-full text-left break-words text-white/90 group-hover:text-white">View my other projects</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Donation Section */}
                  <div className="flex flex-col p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-center items-center justify-center relative overflow-hidden shadow-lg mt-2">
                    <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-pink-500/10 blur-[50px] rounded-full pointer-events-none" />

                    <h3 className="text-base md:text-lg font-black mb-2 text-white/90 relative z-10 flex items-center gap-2">Support the Project <span className="animate-pulse">❤️</span></h3>
                    <p className="text-[10px] md:text-xs text-white/60 max-w-lg mx-auto mb-5 leading-relaxed px-1 break-words relative z-10">
                      Built with love, inspired by the pain of endless distractions and messy workspaces. It took many late nights to bring this vision to life. If this dashboard helps you reclaim your focus, consider supporting its continued development. A small tip goes a long way—and please leave a message, I'd love to hear how it's helping you!
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 mb-5 relative z-10">
                      {[
                        { amt: 50, label: 'Coffee' }, { amt: 100, label: 'Lunch' },
                        { amt: 200, label: 'Book' }, { amt: 500, label: 'Sponsor' },
                        { amt: null, label: 'Any' }
                      ].map(d => (
                        <button
                          key={d.label}
                          onClick={() => setDonationAmount(d.amt)}
                          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-[11px] font-bold border transition-all active:scale-95 ${donationAmount === d.amt ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'bg-black/40 text-white/60 border-white/10 hover:border-white/20 hover:bg-white/5 hover:text-white'}`}
                        >
                          {d.amt ? `₹${d.amt}` : 'Any'} {d.amt && <span className="opacity-60 font-medium hidden sm:inline ml-1">({d.label})</span>}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10 w-full sm:w-auto relative z-10 shadow-inner">
                      <div className="bg-white p-2 md:p-2.5 rounded-xl shadow-xl shrink-0 transition-transform hover:scale-105">
                        <QRCodeSVG
                          value={`upi://pay?pa=${upiId}&pn=Anand%20Kumar&cu=INR${donationAmount ? `&am=${donationAmount}` : ''}`}
                          size={90}
                          className="w-[100px] h-[100px] md:w-[120px] md:h-[120px]"
                          level="H"
                          includeMargin={false}
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>
                      <div className="flex flex-col text-center sm:text-left gap-1.5 md:gap-2 min-w-0">
                        <div>
                          <p className="text-[9px] md:text-[10px] text-white/50 uppercase font-black tracking-widest mb-0.5 break-words">Scan to Pay</p>
                          <p className="font-black text-lg md:text-xl text-white break-words">{donationAmount ? `₹${donationAmount}` : 'Any Amount'}</p>
                        </div>
                        <div className="h-px w-full bg-white/10 my-1 hidden sm:block" />
                        <div className="min-w-0">
                          <p className="text-[9px] md:text-[10px] text-white/50 uppercase font-black tracking-widest mb-0.5 break-words">UPI ID</p>
                          <p className="text-[10px] md:text-xs text-blue-300 font-mono break-words font-bold select-all bg-blue-500/10 px-2 py-1 rounded inline-block">{upiId}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Credits & Supporters Section */}
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/10">
                    <h3 className="text-sm md:text-base font-bold flex items-center gap-2 text-white/90">
                      <BadgeCheck className="text-pink-400 w-5 h-5" /> Credits & Supporters
                    </h3>

                    <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-3 md:p-4 flex flex-col gap-2 shadow-sm">
                      <p className="text-[10px] md:text-xs text-pink-200 font-medium leading-relaxed break-words">
                        I originally started building this out of pure frustration. I needed something to help me stay on track.
                      </p>
                      <p className="text-[10px] md:text-xs text-pink-300/80 leading-relaxed italic font-semibold break-words">
                        "A big thank you to everyone who believed in this project and tested it. Thanks for always having my back."
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      {/* Sathish Kumar */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 flex items-center text-left gap-3 shadow-sm hover:bg-white/10 transition-colors group">
                        <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-blue-400/50 transition-colors bg-black/40">
                          <img src="/sathish.jpeg" alt="Sathish" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <h4 className="text-xs md:text-sm font-bold text-white break-words">Sathish Kumar</h4>
                          <p className="text-[9px] md:text-[10px] text-white/60 font-bold uppercase tracking-wider mt-0.5 break-words"><span className="text-blue-300">EEE</span> • NIT Patna</p>
                          <p className="text-[10px] md:text-[11px] text-white/70 mt-1.5 leading-snug break-words">
                            Tested countless hours to identify bugs and provided invaluable UX suggestions.
                          </p>
                        </div>
                      </div>

                      {/* Jyothir Ganesh */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 flex items-center text-left gap-3 shadow-sm hover:bg-white/10 transition-colors group">
                        <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-blue-400/50 transition-colors bg-black/40">
                          <img src="/jyothir.png" alt="Jyothir" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <h4 className="text-xs md:text-sm font-bold text-white break-words">Jyothir Ganesh</h4>
                          <p className="text-[9px] md:text-[10px] text-white/60 font-bold uppercase tracking-wider mt-0.5 break-words"><span className="text-blue-300">ECE</span> • Vishnu Inst.</p>
                          <p className="text-[10px] md:text-[11px] text-white/70 mt-1.5 leading-snug break-words">
                            My strongest pillar of support. Always provides grounded, factual advice.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

