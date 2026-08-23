'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useDashboardStore } from '@/store/dashboardStore';
import { X, Upload, BookOpen, Trash2, Image as ImageIcon, Settings as SettingsIcon, Sliders, MonitorPlay, Clock, Users, Plus, Eye, EyeOff, Download, UploadCloud, Activity, MessageSquare, Timer as TimerIcon, Hourglass, Film, User, BadgeCheck, Send, Briefcase, Calendar, CheckSquare, Flame, ChevronUp, ChevronDown, ChevronLeft, Database, Bell, RefreshCw, AlertTriangle, CheckCircle, BarChart2, Map, StickyNote, CalendarDays, Layout, Globe, Star, Info, Play, Pause, Music, Volume2 } from 'lucide-react';
import ConnectTab from './ConnectTab';
import UserManualModal from './UserManualModal';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';

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

const CustomWallpaperPreview = ({ url, isActive, onClick, onDelete, label, aspectClass = "aspect-video" }: any) => {
  const { resolvedUrl, isVideo } = useWallpaperUrl(url);
  return (
    <div className={`relative group ${aspectClass} rounded-md border overflow-hidden transition-all ${isActive ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-white/10 hover:border-white/40'}`}>
      <div className="absolute inset-0 cursor-pointer bg-black/40" onClick={onClick}>
        {resolvedUrl ? (
          isVideo ? (
            <video src={resolvedUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted loop autoPlay playsInline />
          ) : (
            <img src={resolvedUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Custom wp" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/40 bg-black/20">Loading...</div>
        )}
      </div>
      <div className="absolute inset-0 flex flex-col justify-between p-1.5 pointer-events-none">
        <div className="flex justify-end w-full">
          {isActive && <div className="bg-purple-500/90 rounded-full p-0.5"><BadgeCheck className="text-white w-3 h-3" /></div>}
        </div>
        <div className="flex justify-between items-end w-full">
          <div className="text-[8px] md:text-[8px] px-1 py-0.5 bg-black/70 backdrop-blur-md rounded border border-white/10 text-white/90 max-w-[70%] truncate">
            {label}
          </div>
          <div className="flex gap-1 pointer-events-auto">
            {!url.startsWith('custom-') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(url);
                  alert('URL copied to clipboard!');
                }}
                className="p-1 bg-black/70 border border-white/10 text-white/80 hover:text-blue-400 rounded transition-colors"
                title="Copy URL"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            )}
            <button
              onClick={onDelete}
              className="p-1 bg-black/70 border border-white/10 text-white/80 hover:text-red-400 rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SettingsModal() {
  const { settingsActiveTab, setSettingsActiveTab, isSettingsOpen, toggleSettings, connectInitialTab, is24HourClock, toggle24HourClock, clockScale, setClockScale, currentBgSrc, hiddenWallpapers, toggleWallpaperVisibility, showQuote, showTimer, showCountdowns, showVideoControls, showClock, showTasks, showCalendar, showTodayWork, showStats, showPlans, showNotes, showTimetable, showDock, showDeadlineAlerts, showBgSwitcher, showSettingsBtn, showStopwatch, toggleVisibility, isSlideshowEnabled, setIsSlideshowEnabled, slideshowIntervalMins, setSlideshowIntervalMins, lockedWidgets, toggleWidgetLock, resetAllOffsets, clearOldData, clearAllData, lockedWallpaper, setLockedWallpaper, deadlineAlertDays, setDeadlineAlertDays, hideConfig, setHideConfig, setHideAll, mobileHideConfig, setMobileHideConfig, setMobileHideAll, rightWidgetsOffset, setRightWidgetsOffset, alarmSound, setAlarmSound, customAlarmSounds, addCustomAlarmSound, deleteCustomAlarmSound, alarmDurationSecs, setAlarmDurationSecs, alarmVolume, setAlarmVolume, enableAlarmSound, setEnableAlarmSound, enableAlarmVibration, setEnableAlarmVibration, toggleHide, panicShortcutKey, setPanicShortcutKey, focusShortcutKey, setFocusShortcutKey, togglePanicHide, panicWallpaperSwitch, setPanicWallpaperSwitch, timetableGrid, resetTimetable, panicButtonMode, setPanicButtonMode, customDesktopWallpapers, setCustomDesktopWallpapers, activeDesktopCustomIndex, setActiveDesktopCustomIndex, customMobileWallpapers, setCustomMobileWallpapers, activeMobileCustomIndex, setActiveMobileCustomIndex, theme, setTheme, customQuotes, setCustomQuotes, useCustomQuotes, setUseCustomQuotes, taskIntervalAlertMins, setTaskIntervalAlertMins, taskIntervalRingSecs, setTaskIntervalRingSecs } = useDashboardStore();

  const [focusPlatform, setFocusPlatform] = useState<'desktop' | 'mobile'>('desktop');

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
      alert("Maximum 3 custom ringtones allowed. Please delete an existing custom ringtone first.");
      return;
    }

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      alert("Please select a valid audio file (MP3, WAV, OGG, M4A).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large. Please select an audio file under 10MB.");
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
    onConfirm: (val?: string) => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });
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

  const handleAddQuote = () => {
    if (!newQuoteText.trim()) return;
    const author = newQuoteAuthor.trim() || 'Unknown';
    if (customQuotes.length >= 50) return alert('Maximum 50 custom quotes allowed.');
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
      if (validQuotes.length === 0) return alert('No valid quotes found in JSON.');
      const newQuotes = [...customQuotes, ...validQuotes].slice(0, 50);
      setCustomQuotes(newQuotes);
      setShowBulkAddModal(false);
      setBulkQuotesJson('');
      alert(`Successfully added ${validQuotes.length} quotes! (Max 50)`);
    } catch (err) {
      alert('Invalid JSON format. Please provide an array of objects like: [{"text": "Quote", "author": "Author"}]');
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

  useEffect(() => {
    const handleOpenLeaderboard = () => {
      setSettingsActiveTab('connect');
      setIsMobileDetailView(true);
    };
    const handleOpenConnect = () => {
      setSettingsActiveTab('connect');
      setIsMobileDetailView(true);
    };
    window.addEventListener('open-leaderboard', handleOpenLeaderboard);
    window.addEventListener('open-connect', handleOpenConnect);
    return () => {
      window.removeEventListener('open-leaderboard', handleOpenLeaderboard);
      window.removeEventListener('open-connect', handleOpenConnect);
    };
  }, [setSettingsActiveTab]);

  const processBackupDownload = (data: any, filename: string, typeName: string) => {
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
          alert('Failed to prepare download.');
        }
      }).catch(() => {
        const encoded = encodeURIComponent(JSON.stringify(data, null, 2));
        const url = new URL(window.location.origin + '/download.html');
        url.searchParams.set('data', encoded);
        url.searchParams.set('name', filename.replace('.json', ''));
        url.searchParams.set('type', typeName);
        window.open(url.toString(), '_blank');
      });
    } else {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", filename);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
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
        const state = useDashboardStore.getState();
        return {
          tasks: state.tasks || [],
          tomorrowTasks: state.tomorrowTasks || [],
          tasksDate: state.tasksDate,
          taskIntervalAlertMins: state.taskIntervalAlertMins || 10,
          taskIntervalRingSecs: state.taskIntervalRingSecs || 10,
          isTaskIntervalAlertEnabled: state.isTaskIntervalAlertEnabled || false,
          taskGroupNames: state.taskGroupNames || ['Tab 1', 'Tab 2', 'Tab 3']
        };
      }
    );
  };

  const handleRestorePlanYourDay = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        useDashboardStore.setState({
          tasks: data.tasks || [],
          tomorrowTasks: data.tomorrowTasks || [],
          tasksDate: data.tasksDate || new Date().toISOString().split('T')[0],
          taskIntervalAlertMins: data.taskIntervalAlertMins || 10,
          taskIntervalRingSecs: data.taskIntervalRingSecs || 10,
          isTaskIntervalAlertEnabled: data.isTaskIntervalAlertEnabled || false,
          taskGroupNames: data.taskGroupNames || ['Tab 1', 'Tab 2', 'Tab 3']
        });
        alert('Plan Your Day restored successfully!');
      } catch (err) {
        alert('Failed to parse backup file.');
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
      () => useDashboardStore.getState().notes || []
    );
  };

  const handleRestoreNotes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          useDashboardStore.setState({ notes: data });
          alert('Notes restored successfully!');
        } else {
          alert('Invalid format.');
        }
      } catch (err) {
        alert('Failed to parse backup file.');
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
        alert('Settings restored successfully!');
      } catch (err) {
        alert('Failed to parse backup file.');
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
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.timetableGrid) {
          useDashboardStore.setState({
            timetableGrid: data.timetableGrid || {},
            timetableColors: data.timetableColors || {},
            weekdayTimes: data.weekdayTimes || [],
            weekendTimes: data.weekendTimes || [],
            timetableStartTime: data.timetableStartTime || 540,
            timetableWeekendStartTime: data.timetableWeekendStartTime || 540,
          });
          alert('Timetable restored successfully!');
        } else {
          alert('Invalid backup file format for Timetable.');
        }
      } catch (err) {
        alert('Failed to parse backup file.');
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
        alert('You must be logged in to import data. Please login via the Connect tab.');
        e.target.value = '';
        return;
      }

      const text = await file.text();
      const parsed = JSON.parse(text);

      if (typeof parsed !== 'object' || parsed === null || !('state' in parsed)) {
        alert('Invalid backup file. Missing required dashboard data structure.');
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
          if (isMerge) {
            const currentState = useDashboardStore.getState();
            finalData = {
              version: parsed.version || 2,
              state: {
                ...currentState,
                ...parsed.state,
                tasks: [...(currentState.tasks || []), ...(parsed.state.tasks || [])].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i),
                countdowns: [...(currentState.countdowns || []), ...(parsed.state.countdowns || [])].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i),
                deadlines: [...(currentState.deadlines || []), ...(parsed.state.deadlines || [])].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i),
                notes: [...(currentState.notes || []), ...(parsed.state.notes || [])].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i),
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
            alert('Import successful! Reloading...');
            window.location.reload();
          } else {
            alert('Import failed. Server rejected the data.');
          }
        } catch (err) {
          console.error(err);
          alert('Invalid JSON file format.');
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
      alert('Invalid JSON file format.');
    }
    e.target.value = '';
  };

  const handleTabClick = (tab: string) => {
    setSettingsActiveTab(tab as any);
    setIsMobileDetailView(true);
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          stopPreviewAudio();
          toggleSettings();
          setIsMobileDetailView(false); // Reset to menu on close
        }}
      />

      {/* Changed max-w-4xl to max-w-3xl for compact styling */}
      <div className="relative w-full max-w-3xl h-[80vh] md:h-[80vh] flex flex-col bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden text-white animate-in zoom-in-95 duration-200">

        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes continuous-glass-sweep {
            0% { left: -100%; }
            100% { left: 200%; }
          }
          .glass-sweep-anim {
            animation: continuous-glass-sweep 3s infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
        ` }} />
        {/* Header - scaled down padding and text */}
        <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 border-b border-white/10 bg-black/20 shrink-0 gap-1.5 md:gap-3">
          <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0 flex-1 pr-1">
            {isMobileDetailView && (
              <button
                onClick={() => setIsMobileDetailView(false)}
                className="md:hidden p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 border border-white/10 bg-white/5 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <SettingsIcon className={`${isMobileDetailView ? 'hidden md:block' : 'block'} text-blue-400 w-4 h-4 md:w-5 md:h-5 shrink-0`} />
            <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-wide leading-tight flex items-center gap-1 md:gap-2 min-w-0 truncate">
              {isMobileDetailView ? (
                <span className="md:hidden capitalize truncate">
                  {settingsActiveTab === "about" ? "About Dev" : settingsActiveTab === "connect" ? "Connect & Ranks" : settingsActiveTab + " Settings"}
                </span>
              ) : null}
              <span className={isMobileDetailView ? 'hidden md:inline truncate' : 'inline truncate'}>
                <span className="md:hidden">Settings</span>
                <span className="hidden md:inline">Dashboard Settings</span>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setInfoModalKey('dragControls'); }}
                className={`${isMobileDetailView ? 'hidden md:flex' : 'flex'} p-1 text-blue-400 hover:text-blue-300 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0`}
                title="View Drag Controls"
              >
                <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </h2>
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <div className="flex items-center gap-1 md:gap-2 mr-0.5 md:mr-2 border-r border-white/10 pr-1.5 md:pr-3 shrink-0">
              <div className="relative group mt-1.5 md:mt-0">
                <span className="absolute -top-2 left-2 px-1 bg-[#1a1b26]/90 backdrop-blur-md rounded-md text-[7px] md:text-[8px] font-bold tracking-widest text-white/50 uppercase pointer-events-none z-10 transition-colors group-hover:text-blue-300 whitespace-nowrap">Apply / Update</span>
                <button
                  onClick={() => window.location.reload()}
                  className="flex flex-row items-center justify-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-2.5 md:py-1.5 hover:bg-blue-500/20 hover:border-blue-500/50 rounded-lg transition-all border border-white/10 bg-black/40 shrink-0 whitespace-nowrap"
                  title="Refresh the app to apply changes or fix wallpaper bugs"
                >
                  <RefreshCw className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 text-blue-400 group-hover:rotate-180 transition-transform duration-500 shrink-0" />
                  <span className="text-[9px] sm:text-[9.5px] md:text-[10px] font-semibold text-white/90 leading-none mt-0.5">Refresh App</span>
                </button>
              </div>
            </div>
            {isMobileDetailView && ['preferences', 'sound', 'focus', 'wallpaper', 'data'].includes(settingsActiveTab) && (
              <button
                onClick={() => setInfoModalKey(settingsActiveTab === 'wallpaper' ? 'wallpapers' : settingsActiveTab === 'focus' ? 'panic' : settingsActiveTab === 'data' ? 'backup' : settingsActiveTab)}
                className="md:hidden p-1.5 hover:bg-white/10 rounded-xl transition-colors text-blue-400 bg-white/5 border border-white/10 shadow-sm"
              >
                <Info className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => {
                stopPreviewAudio();
                toggleSettings();
                setIsMobileDetailView(false);
              }}
              className="p-1.5 md:p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full">
          {/* Sidebar Tabs - Narrowed to w-48 on desktop */}
          <div className={`${isMobileDetailView ? 'hidden md:flex' : 'flex h-full'} flex-col w-full md:w-48 bg-black/20 border-r-0 md:border-r border-white/10 relative group shrink-0`}>

            <ScrollableWithArrows className="flex-1 p-3 flex flex-col gap-2 h-full pb-10">
              <button
                onClick={() => handleTabClick('preferences')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs md:text-xs font-medium ${settingsActiveTab === 'preferences' && !isMobileDetailView ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent bg-black/40 md:bg-transparent'}`}
              >
                <Sliders className="w-4 h-4" /> Preferences
              </button>
              <button
                onClick={() => handleTabClick('wallpaper')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs md:text-xs font-medium ${settingsActiveTab === 'wallpaper' && !isMobileDetailView ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent bg-black/40 md:bg-transparent'}`}
              >
                <ImageIcon className="w-4 h-4" /> Wallpapers
              </button>
              <button
                onClick={() => handleTabClick('quotes')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs md:text-xs font-medium ${settingsActiveTab === 'quotes' && !isMobileDetailView ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent bg-black/40 md:bg-transparent'}`}
              >
                <MessageSquare className="w-4 h-4" /> Quotes Settings
              </button>
              <button
                onClick={() => handleTabClick('sound')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs md:text-xs font-medium ${settingsActiveTab === 'sound' && !isMobileDetailView ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent bg-black/40 md:bg-transparent'}`}
              >
                <Bell className="w-4 h-4" /> Sound Settings
              </button>

              <button
                onClick={() => handleTabClick('focus')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs md:text-xs font-medium ${settingsActiveTab === 'focus' && !isMobileDetailView ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent bg-black/40 md:bg-transparent'}`}
              >
                <EyeOff className="w-4 h-4" /> Focus / Peek
              </button>
              <button
                onClick={() => handleTabClick('data')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs md:text-xs font-medium ${settingsActiveTab === 'data' && !isMobileDetailView ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent bg-black/40 md:bg-transparent'}`}
              >
                <Database className="w-4 h-4" /> Data & Backup
              </button>
              <button
                onClick={() => handleTabClick('connect')}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs md:text-xs font-medium ${settingsActiveTab === 'connect' && !isMobileDetailView ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent bg-black/40 md:bg-transparent'}`}
              >
                <Globe className={`w-4 h-4 ${settingsActiveTab === 'connect' ? 'text-blue-400 animate-pulse' : ''}`} /> Connect & Ranks
              </button>
              <button
                onClick={() => handleTabClick('about')}
                className={`relative overflow-hidden group flex flex-row w-full min-h-[76px] md:min-h-[84px] items-center justify-between gap-3 px-3 py-2 md:py-3 rounded-xl transition-all ${settingsActiveTab === 'about' && !isMobileDetailView ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg' : 'bg-black/40 md:bg-black/20 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20 border border-white/5 md:hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md'}`}
              >
                <div className="absolute top-0 bottom-0 w-[200%] bg-gradient-to-r from-transparent via-white/25 via-blue-300/20 to-transparent pointer-events-none glass-sweep-anim" style={{ left: '-100%' }} />
                <img
                  src="/branding/author.jpeg"
                  alt="Developer"
                  className="w-16 h-16 md:w-14 md:h-14 rounded-full object-cover shadow-lg border-2 border-white/30 relative z-10 shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<svg class="w-8 h-8 relative z-10" ... />');
                  }}
                />
                <div className="flex flex-col items-start md:items-start text-left relative z-10 min-w-0 flex-1 pl-1">
                  <span className="text-[11px] md:text-[11px] font-bold tracking-wide leading-tight text-white block">Support Developer</span>
                  <span className="text-[9.5px] md:text-[9px] text-blue-300 font-semibold uppercase mt-0.5 tracking-wider block truncate w-full">
                    <pre>Anand kumar</pre>
                  </span>
                </div>
              </button>

              <button
                onClick={() => setIsUserManualOpen(true)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-medium bg-black/40 md:bg-transparent text-white/60 hover:bg-white/5 hover:text-white border border-transparent mb-2`}
              >
                <BookOpen className="w-4 h-4 text-blue-400" /> User Manual
              </button>

            </ScrollableWithArrows>
          </div>

          {/* Content Area */}
          <div className={`relative flex-1 overflow-hidden flex-col group/content ${isMobileDetailView ? 'flex' : 'hidden md:flex'}`}>


            <ScrollableWithArrows className="flex-1 p-2 pt-4 pb-8 md:p-4 md:pb-8 md:pt-4 h-full pr-1">

              {settingsActiveTab === 'connect' && (
                <ConnectTab />
              )}

              {settingsActiveTab === 'preferences' && (
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm md:text-base font-semibold">General Preferences</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] md:mt-0.5 px-1">Customize how your dashboard looks and feels.</p>
                    </div>
                    <button onClick={() => setInfoModalKey('preferences')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors mr-1">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 md:gap-2">
                    {/* Theme Toggle */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 md:p-2.5 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-1.5 sm:gap-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="p-1 md:p-1.5 bg-white/5 rounded-md shrink-0">
                          <Layout className="text-purple-400 w-4 h-4" />
                        </div>
                        <div className="min-w-0 pr-2">
                          <h4 className="font-medium text-xs md:text-sm whitespace-nowrap">Dashboard Theme</h4>
                          <p className="text-[9px] md:text-[10px] text-white/50 leading-tight">Auto switches based on day time (6 AM to 6 PM is light).</p>
                        </div>
                      </div>
                      <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5 self-end sm:self-auto shrink-0">
                        {(['dark', 'auto', 'light'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={`px-3 py-1 text-[10px] md:text-xs font-medium rounded-md capitalize transition-all ${theme === t ? 'bg-purple-500 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Toggle 24-hour clock */}
                    <div className="flex items-center justify-between p-2 md:p-2.5 rounded-lg md:rounded-xl bg-black/20 border border-white/5">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="p-1 md:p-1.5 bg-white/5 rounded-md shrink-0">
                          <Clock className="text-blue-300 w-4 h-4" />
                        </div>
                        <div className="min-w-0 pr-2">
                          <h4 className="font-medium text-xs md:text-sm whitespace-nowrap">24-Hour Clock Format</h4>
                          <p className="text-[9px] md:text-[10px] text-white/50 leading-tight">Military time (14:00 instead of 2:00 PM)</p>
                        </div>
                      </div>
                      <button
                        onClick={toggle24HourClock}
                        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors shrink-0 ${is24HourClock ? 'bg-blue-500' : 'bg-white/20'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${is24HourClock ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    {/* Clock Size Settings */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 md:p-2.5 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-1.5 sm:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="p-1 md:p-1.5 bg-white/5 rounded-md shrink-0">
                          <Clock className="text-blue-400 w-4 h-4" />
                        </div>
                        <div className="min-w-0 pr-2">
                          <h4 className="font-medium text-xs md:text-sm whitespace-nowrap">Big Clock Size</h4>
                          <p className="text-[9px] md:text-[10px] text-white/50 leading-tight truncate">Scale the clock for your screen.</p>
                        </div>
                      </div>
                      <p className="text-[9px] md:text-[10px] text-white/50 leading-tight truncate">current size : {Math.round((clockScale) * 100)}%</p>
                      <div className="flex items-center gap-2 w-full sm:w-40 shrink-0 self-end sm:self-auto mt-1 sm:mt-0">
                        <span className="text-[9px] md:text-[10px] text-white/40">50%</span>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={clockScale}
                          onChange={(e) => setClockScale(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                        />
                        <span className="text-[9px] md:text-[10px] text-white/40">150%</span>
                      </div>
                    </div>

                    {/* Deadline Alerts */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 md:p-2.5 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-1.5 sm:gap-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="p-1 md:p-1.5 bg-white/5 rounded-md shrink-0">
                          <Bell className="text-yellow-400 w-4 h-4" />
                        </div>
                        <div className="min-w-0 pr-2">
                          <h4 className="font-medium text-xs md:text-sm whitespace-nowrap">Deadline Alerts</h4>
                          <p className="text-[9px] md:text-[10px] text-white/50 leading-tight">Show a popup as deadlines approach.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto pl-7 sm:pl-0">
                        <span className="text-white/60 text-[9px] md:text-[11px] whitespace-nowrap">Alert me</span>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={deadlineAlertDays}
                          onChange={(e) => setDeadlineAlertDays(parseInt(e.target.value) || 0)}
                          className="w-10 md:w-12 bg-black/40 border border-white/10 rounded-md px-1 py-0.5 text-center text-white outline-none focus:border-yellow-400 font-medium text-[10px] md:text-xs"
                        />
                        <span className="text-white/60 text-[9px] md:text-[11px] whitespace-nowrap">days before</span>
                      </div>
                    </div>

                    {/* Right Toolbar Position */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 md:p-2.5 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-1.5 sm:gap-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="p-1 md:p-1.5 bg-white/5 rounded-md shrink-0">
                          <Layout className="text-cyan-400 w-4 h-4" />
                        </div>
                        <div className="min-w-0 pr-2">
                          <h4 className="font-medium text-xs md:text-sm whitespace-nowrap">Right Toolbar Position</h4>
                          <p className="text-[9px] md:text-[10px] text-white/50 leading-tight">Adjust the height of right-side widgets.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 bg-black/40 border border-white/10 rounded-md p-1 self-end sm:self-auto">
                        <button
                          onClick={() => setRightWidgetsOffset(Math.max(0, rightWidgetsOffset - 10))}
                          className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-[10px] md:text-xs w-6 md:w-8 text-center text-cyan-300">{rightWidgetsOffset}</span>
                        <button
                          onClick={() => setRightWidgetsOffset(rightWidgetsOffset + 10)}
                          className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Widget Layout & Positioning */}
                    <div className="flex flex-col p-2.5 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5 mt-1">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 md:mb-3 gap-2">
                        <h4 className="font-medium text-xs md:text-sm">Widget Drag Locking</h4>
                        <button
                          onClick={() => {
                            if (currentBgSrc) resetAllOffsets(currentBgSrc);
                          }}
                          className="px-2 py-1 md:px-3 md:py-1 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-md transition-colors border border-red-500/30 font-medium text-[9px] md:text-[11px] whitespace-nowrap"
                        >
                          Reset Default Positions
                        </button>
                      </div>
                      <p className="text-[9px] md:text-[10px] text-white/50 mb-2 md:mb-3">Lock elements so they cannot be dragged.</p>

                      <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                        {[
                          { key: 'clock', icon: Clock, label: 'Clock', color: 'text-blue-300' },
                        ].map(({ key, icon: Icon, label, color }) => (
                          <div key={key} className="flex items-center justify-between p-2 md:p-2 rounded-md bg-white/5">
                            <div className="flex items-center gap-1.5 md:gap-2 min-w-0 pr-1">
                              <Icon className={`${color} w-3.5 h-3.5 shrink-0`} />
                              <span className="text-[9px] md:text-[11px] font-medium truncate">{label}</span>
                            </div>
                            <button onClick={() => toggleWidgetLock(key as any)} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0 ${lockedWidgets.includes(key as any) ? 'bg-blue-500' : 'bg-white/20'}`}>
                              <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${lockedWidgets.includes(key as any) ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Widget Visibility */}
                    <div className="flex flex-col p-2.5 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5 mt-1">
                      <h4 className="font-medium text-xs md:text-sm mb-2 md:mb-3">Widget Visibility</h4>

                      <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                        {[

                          { key: 'showQuote', icon: MessageSquare, label: 'Quote', color: 'text-purple-400', state: showQuote },
                          { key: 'showTimer', icon: TimerIcon, label: 'Timer', color: 'text-yellow-400', state: showTimer },
                          { key: 'showStopwatch', icon: Clock, label: 'Stopwatch', color: 'text-blue-400', state: showStopwatch },
                          { key: 'showCountdowns', icon: Hourglass, label: 'Countdowns', color: 'text-blue-400', state: showCountdowns },
                          { key: 'showVideoControls', icon: Film, label: 'Video Ctrl', color: 'text-green-400', state: showVideoControls },
                          { key: 'showTodayWork', icon: Flame, label: 'Today Focus', color: 'text-orange-400', state: showTodayWork },
                          { key: 'showTasks', icon: CheckSquare, label: 'Tasks', color: 'text-orange-400', state: showTasks },
                          { key: 'showCalendar', icon: Calendar, label: 'Calendar', color: 'text-pink-400', state: showCalendar },
                          { key: 'showStats', icon: BarChart2, label: 'Stats Modal', color: 'text-emerald-400', state: showStats },
                          { key: 'showPlans', icon: Map, label: 'Roadmap', color: 'text-indigo-400', state: showPlans },
                          { key: 'showNotes', icon: StickyNote, label: 'Quick Notes', color: 'text-yellow-300', state: showNotes },
                          { key: 'showTimetable', icon: CalendarDays, label: 'Timetable', color: 'text-purple-400', state: showTimetable },
                          { key: 'showDock', icon: Layout, label: 'Bottom Dock', color: 'text-cyan-300', state: showDock },
                          { key: 'showDeadlineAlerts', icon: Bell, label: 'Alerts', color: 'text-red-400', state: showDeadlineAlerts },
                          { key: 'showBgSwitcher', icon: ImageIcon, label: 'Bg Switcher', color: 'text-green-300', state: showBgSwitcher },
                        ].map(({ key, icon: Icon, label, color, state }) => (
                          <div key={key} className="flex items-center justify-between p-2 md:p-2 rounded-md bg-white/5">
                            <div className="flex items-center gap-1.5 md:gap-2 min-w-0 pr-1">
                              <Icon className={`${color} w-3.5 h-3.5 shrink-0`} />
                              <span className="text-[9px] md:text-[11px] font-medium truncate">{label}</span>
                            </div>
                            <button onClick={() => toggleVisibility(key as any)} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0 ${state ? 'bg-blue-500' : 'bg-white/20'}`}>
                              <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${state ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        ))}

                        <div className="flex flex-col justify-center p-2 md:p-2 rounded-md bg-white/5 col-span-2 sm:col-span-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <Clock className="text-cyan-400 w-3.5 h-3.5 shrink-0" />
                              <span className="text-[9px] md:text-[11px] font-medium">Big Clock</span>
                            </div>
                            <button onClick={() => toggleVisibility('showClock')} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0 ${showClock ? 'bg-blue-500' : 'bg-white/20'}`}>
                              <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${showClock ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                          <p className="text-[8px] md:text-[9px] text-white/40 mt-1 leading-tight italic">
                            * Permanently hidden on mobile space to save area.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveTab === 'sound' && (
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm md:text-base font-semibold">Sound Settings</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] md:mt-0.5 px-1">Configure audio for alarms and timers.</p>
                    </div>
                    <button onClick={() => setInfoModalKey('sound')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors mr-1">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-3 md:p-4 flex flex-col gap-4 md:gap-6">

                    {/* Choose Default Alarm Sound (Dropdown Style) */}
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-xs md:text-sm font-semibold text-white/90 flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-blue-400" />
                          <span>Choose Default Alarm Sound</span>
                        </label>
                        <p className="text-[9px] md:text-[10px] text-white/50 mt-0.5">Select a ringtone from our built-in default library.</p>
                      </div>

                      {/* Dropdown Header & Trigger */}
                      {(() => {
                        const activeDefault = DEFAULT_ALARM_SOUNDS.find(s => s.url === alarmSound || (s.url === '/ringtones/narutoBGM.mp3' && alarmSound === '/ringtones/alarm.mp3'));
                        const isCustomActive = !activeDefault && (customAlarmSounds || []).some(s => s.url === alarmSound);
                        const isPreviewingActive = activeDefault && previewingAudioUrl === activeDefault.url;

                        return (
                          <div className="flex flex-col gap-1.5">
                            <div
                              onClick={() => setIsDefaultDropdownOpen(!isDefaultDropdownOpen)}
                              className={`flex items-center justify-between p-2.5 md:p-3 rounded-lg border transition-all cursor-pointer select-none ${
                                isDefaultDropdownOpen
                                  ? 'bg-blue-500/20 border-blue-500/60 shadow-lg shadow-blue-500/10'
                                  : 'bg-black/30 border-white/15 hover:border-white/30 hover:bg-black/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${activeDefault ? 'border-blue-400 bg-blue-500/20' : 'border-white/30'}`}>
                                  {activeDefault && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                </div>
                                <span className="text-xs md:text-sm font-medium text-white truncate">
                                  {activeDefault ? activeDefault.name : isCustomActive ? 'Custom Ringtone Active' : 'Select Default Alarm...'}
                                </span>
                                {activeDefault && (
                                  <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 font-semibold shrink-0">Default Active</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {activeDefault && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTogglePreviewAudio(activeDefault.url);
                                    }}
                                    className="p-1 md:p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors text-[9px]"
                                    title="Preview sound"
                                  >
                                    {isPreviewingActive ? <Pause className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                                <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${isDefaultDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
                              </div>
                            </div>

                            {/* Dropdown Options List */}
                            {isDefaultDropdownOpen && (
                              <div className="mt-1 bg-[#161619] border border-white/15 rounded-xl p-1.5 shadow-2xl space-y-1 animate-in fade-in-50 zoom-in-95 duration-150 max-h-60 overflow-y-auto arrow-scrollbar">
                                {DEFAULT_ALARM_SOUNDS.map((sound) => {
                                  const isActive = alarmSound === sound.url || (sound.url === '/ringtones/narutoBGM.mp3' && alarmSound === '/ringtones/alarm.mp3');
                                  const isPreviewing = previewingAudioUrl === sound.url;

                                  return (
                                    <div
                                      key={sound.id}
                                      onClick={() => {
                                        stopPreviewAudio();
                                        setAlarmSound(sound.url);
                                        setIsDefaultDropdownOpen(false);
                                      }}
                                      className={`flex items-center justify-between p-2 md:p-2.5 rounded-lg border transition-all cursor-pointer ${
                                        isActive
                                          ? 'bg-blue-600/25 border-blue-500/60 text-white'
                                          : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 text-white/80 hover:text-white'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isActive ? 'border-blue-400' : 'border-white/30'}`}>
                                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                        </div>
                                        <span className="text-[11px] md:text-xs font-medium truncate" title={sound.name}>{sound.name}</span>
                                        {isActive && (
                                          <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 font-semibold shrink-0">Selected</span>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTogglePreviewAudio(sound.url);
                                        }}
                                        className="p-1 md:p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0 flex items-center gap-1 text-[9px]"
                                        title="Preview sound"
                                      >
                                        {isPreviewing ? <Pause className="w-3 h-3 text-yellow-300 animate-pulse" /> : <Play className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Custom Ringtones (Separately below) */}
                    <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <label className="text-xs md:text-sm font-semibold text-white/80">Custom Ringtones</label>
                          <p className="text-[9px] md:text-[10px] text-white/50">Upload max 3 custom ringtones saved in your local settings.</p>
                        </div>

                        <input
                          type="file"
                          ref={audioFileInputRef}
                          onChange={handleAudioUpload}
                          accept="audio/*"
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => audioFileInputRef.current?.click()}
                          disabled={(customAlarmSounds || []).length >= 3}
                          className={`flex items-center gap-1.5 px-2 py-1 md:px-2.5 md:py-1.5 rounded-md text-[9px] md:text-[10px] font-medium transition-all border shrink-0 ${(customAlarmSounds || []).length >= 3
                            ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                            : 'bg-purple-600/30 hover:bg-purple-600/50 border-purple-500/40 text-purple-200 hover:text-white'
                            }`}
                        >
                          <Upload className="w-3 h-3 shrink-0" />
                          <span>Upload ({(customAlarmSounds || []).length}/3)</span>
                        </button>
                      </div>

                      <div className="grid gap-1.5 md:gap-2">
                        {(customAlarmSounds || []).length === 0 ? (
                          <div className="p-3 text-center border border-dashed border-white/10 rounded-md text-white/40 text-[10px] md:text-[11px]">
                            No custom ringtones uploaded yet.
                          </div>
                        ) : (
                          (customAlarmSounds || []).map((sound) => {
                            const isActive = alarmSound === sound.url;
                            const isPreviewing = previewingAudioUrl === sound.url;
                            return (
                              <div
                                key={sound.id}
                                className={`flex items-center justify-between p-2 md:p-2.5 rounded-md border transition-all ${isActive
                                  ? 'bg-purple-500/20 border-purple-500/50'
                                  : 'bg-black/20 border-white/10 hover:border-white/30'
                                  }`}
                              >
                                <div
                                  className="flex items-center gap-2 md:gap-2.5 cursor-pointer flex-1 min-w-0 pr-2"
                                  onClick={() => {
                                    stopPreviewAudio();
                                    setAlarmSound(sound.url);
                                  }}
                                >
                                  <div className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isActive ? 'border-purple-400' : 'border-white/30'}`}>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                                  </div>
                                  <span className="text-[10px] md:text-[11px] font-medium truncate" title={sound.name}>{sound.name}</span>
                                  <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold shrink-0">Custom</span>
                                  {isActive && (
                                    <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300 font-semibold shrink-0">Active</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePreviewAudio(sound.url)}
                                    className="p-1 md:p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors flex items-center gap-1 text-[9px]"
                                    title="Preview sound"
                                  >
                                    {isPreviewing ? <Pause className="w-3 h-3 text-yellow-300 animate-pulse" /> : <Play className="w-3 h-3" />}
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
                                    className="p-1 md:p-1.5 rounded bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition-colors"
                                    title="Delete custom ringtone"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:gap-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs md:text-sm font-semibold text-white/80">Auto Stop Timer</label>
                        <span className="text-[9px] md:text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">{alarmDurationSecs} Secs</span>
                      </div>
                      <p className="text-[8px] md:text-[10px] text-white/40 leading-tight">How long should the sound ring?</p>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={alarmDurationSecs || 60}
                        onChange={(e) => setAlarmDurationSecs(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 mt-1"
                      />
                      <div className="flex justify-between text-[8px] md:text-[9px] text-white/40">
                        <span>5s</span>
                        <span>1m</span>
                        <span>2m</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 md:p-2.5 rounded-md bg-white/5">
                      <div className="flex flex-col pr-2 min-w-0">
                        <span className="text-[10px] md:text-[11px] font-medium text-white/80 whitespace-nowrap">Enable Alarm Sound</span>
                        <p className="text-[8px] md:text-[9px] text-white/40 leading-tight truncate">Play alarm sound when finished</p>
                      </div>
                      <button
                        onClick={() => setEnableAlarmSound(!enableAlarmSound)}
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0 ${enableAlarmSound ? 'bg-blue-500' : 'bg-white/20'}`}
                      >
                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${enableAlarmSound ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 md:p-2.5 rounded-md bg-white/5">
                      <div className="flex flex-col pr-2 min-w-0">
                        <span className="text-[10px] md:text-[11px] font-medium text-white/80 whitespace-nowrap">Enable Device Vibrate</span>
                        <p className="text-[8px] md:text-[9px] text-white/40 leading-tight truncate">Vibrate device when finished</p>
                      </div>
                      <button
                        onClick={() => setEnableAlarmVibration(!enableAlarmVibration)}
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0 ${enableAlarmVibration ? 'bg-blue-500' : 'bg-white/20'}`}
                      >
                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${enableAlarmVibration ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 md:gap-3 bg-white/5 border border-white/10 rounded-md p-3 md:p-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs md:text-sm font-semibold text-white/80">Task Timer Interval Alert</label>
                        <span className="text-[9px] md:text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">{taskIntervalAlertMins} Mins</span>
                      </div>
                      <p className="text-[8px] md:text-[10px] text-white/40 leading-tight">Plays a short beep every X minutes while a task timer is actively running to keep you focused.</p>
                      <input
                        type="range"
                        min="1"
                        max="60"
                        step="1"
                        value={taskIntervalAlertMins || 10}
                        onChange={(e) => setTaskIntervalAlertMins(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 mt-1"
                      />
                      <div className="flex justify-between text-[8px] md:text-[9px] text-white/40">
                        <span>1m</span>
                        <span>30m</span>
                        <span>60m</span>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <label className="text-xs md:text-sm font-semibold text-white/80">Interval Beep Duration</label>
                        <span className="text-[9px] md:text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">{taskIntervalRingSecs} Secs</span>
                      </div>
                      <p className="text-[8px] md:text-[10px] text-white/40 leading-tight">How long the interval alert should ring before automatically stopping.</p>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={taskIntervalRingSecs || 10}
                        onChange={(e) => setTaskIntervalRingSecs(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 mt-1"
                      />
                      <div className="flex justify-between text-[8px] md:text-[9px] text-white/40">
                        <span>1s</span>
                        <span>15s</span>
                        <span>30s</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveTab === 'quotes' && (
                <div className="flex flex-col gap-3 md:gap-4 min-h-[60vh]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm md:text-base font-semibold">Quotes Settings</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] md:mt-0.5 px-1">Manage your custom motivational quotes.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1 md:p-1.5 bg-white/5 rounded-md">
                        <MessageSquare className="text-pink-400 w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs md:text-sm text-white/90">Use Custom Quotes</span>
                        <span className="text-[9px] md:text-[10px] text-white/50">Show custom list instead of defaults</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setUseCustomQuotes(!useCustomQuotes)}
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors shrink-0 ${useCustomQuotes ? 'bg-pink-500' : 'bg-white/20'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useCustomQuotes ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {useCustomQuotes && (
                    <div className="flex flex-col gap-3">
                      <div className="bg-black/30 border border-white/10 rounded-lg p-2.5 md:p-3 flex flex-col gap-2">
                        <h4 className="text-[10px] md:text-xs font-semibold text-white/80">Add New Quote</h4>
                        <input
                          type="text"
                          placeholder="Quote text..."
                          value={newQuoteText}
                          onChange={(e) => setNewQuoteText(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-[10px] md:text-xs outline-none focus:border-pink-500/50 placeholder:text-white/40"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Author (optional)"
                            value={newQuoteAuthor}
                            onChange={(e) => setNewQuoteAuthor(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-[10px] md:text-xs outline-none focus:border-pink-500/50 placeholder:text-white/40"
                          />
                          <button onClick={handleAddQuote} className="bg-pink-500/80 hover:bg-pink-500 text-white px-3 py-1.5 rounded text-[10px] md:text-xs font-medium transition-colors">Add</button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] md:text-xs font-medium text-white/60">Your Quotes ({customQuotes.length}/50)</span>
                        <button onClick={() => setShowBulkAddModal(true)} className="text-[10px] md:text-xs text-pink-400 hover:text-pink-300 font-medium">Bulk Add JSON</button>
                      </div>

                      <div className="flex flex-col gap-2 h-[30vh]">
                        <ScrollableWithArrows>
                          <div className="flex flex-col gap-2">
                            {customQuotes.length === 0 ? (
                              <div className="text-center py-4 text-[10px] md:text-xs text-white/40 italic bg-black/20 rounded-lg">No custom quotes added.</div>
                            ) : (
                              customQuotes.map((q, idx) => (
                                <div key={idx} className="flex justify-between items-start p-2 bg-white/5 border border-white/10 rounded-lg gap-2">
                                  <div className="flex flex-col min-w-0 pointer-events-none">
                                    <span className="text-[10px] md:text-[11px] text-white/90 break-words leading-snug">"{q.text}"</span>
                                    <span className="text-[8px] md:text-[9px] text-pink-300 mt-0.5">- {q.author}</span>
                                  </div>
                                  <button onClick={() => handleDeleteQuote(idx)} className="p-1 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors shrink-0">
                                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollableWithArrows>
                      </div>
                    </div>
                  )}

                  {showBulkAddModal && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col p-4 md:rounded-r-3xl">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold">Bulk Add Quotes (JSON)</h4>
                        <button onClick={() => setShowBulkAddModal(false)} className="p-1 text-white/60 hover:text-white bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
                      </div>
                      <p className="text-[10px] text-white/60 mb-2">Format: <code>{`[{"text": "Quote here", "author": "Author Name"}]`}</code></p>
                      <textarea
                        value={bulkQuotesJson}
                        onChange={(e) => setBulkQuotesJson(e.target.value)}
                        className="flex-1 bg-black/60 border border-white/20 rounded-lg p-3 text-[10px] md:text-xs font-mono outline-none focus:border-pink-500/50 text-white/80 resize-none"
                        placeholder='[\n  {"text": "Stay hungry, stay foolish.", "author": "Steve Jobs"}\n]'
                      />
                      <button onClick={handleBulkAddQuotes} className="mt-3 bg-pink-500/80 hover:bg-pink-500 text-white py-2 rounded-lg text-xs font-bold transition-colors">Import JSON</button>
                    </div>
                  )}
                </div>
              )}

              {settingsActiveTab === 'wallpaper' && (
                <div className="flex flex-col gap-4 md:gap-6 h-full pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm md:text-base font-semibold">Custom Wallpapers</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] md:mt-0.5 px-1">Upload a photo/video or provide an external image URL to set your wallpaper.</p>

                      <button
                        onClick={() => setInfoModalKey('liveWallpaper')}
                        className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 rounded border border-blue-500/30 text-[10px] transition-colors"
                      >
                        <MonitorPlay size={12} />
                        Set Grind Board as Desktop Wallpaper
                      </button>
                    </div>
                    <button onClick={() => setInfoModalKey('wallpapers')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4">
                    {/* Desktop Wallpapers */}
                    <div className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-3 md:p-4 flex flex-col gap-2.5 md:gap-3">
                      <h4 className="font-medium text-[10px] md:text-[11px] text-blue-300 border-b border-white/10 pb-1.5">Desktop Wallpapers</h4>

                      <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                        {customDesktopWallpapers.map((url, i) => (
                          <CustomWallpaperPreview
                            key={`desktop-wp-${i}`}
                            url={url}
                            isActive={activeDesktopCustomIndex === i}
                            onClick={() => setActiveDesktopCustomIndex(i)}
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

                      {customDesktopWallpapers.length < 4 && (
                        <div className="flex gap-2 w-full">
                          <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 mt-1 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded text-[9px] md:text-[10px] text-white/60 hover:text-white cursor-pointer transition-colors">
                            <Plus className="w-3 h-3" /> Upload File
                            <input
                              type="file"
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 25 * 1024 * 1024) {
                                  alert("File is too large! Maximum allowed is 25MB.");
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
                                isOpen: true,
                                title: 'Add Wallpaper URL',
                                message: 'Enter a direct image or video URL (https://...):',
                                isPrompt: true,
                                promptPlaceholder: 'https://...',
                                onConfirm: (url?: string) => {
                                  if (url && url.trim().startsWith('http')) {
                                    setCustomDesktopWallpapers([...customDesktopWallpapers, url.trim()]);
                                    if (activeDesktopCustomIndex === null) setActiveDesktopCustomIndex(customDesktopWallpapers.length);
                                  }
                                }
                              });
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 mt-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] md:text-[10px] text-white/60 hover:text-white transition-colors"
                          >
                            Add URL
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Mobile Wallpapers */}
                    <div className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-3 md:p-4 flex flex-col gap-2.5 md:gap-3">
                      <h4 className="font-medium text-[10px] md:text-[11px] text-pink-300 border-b border-white/10 pb-1.5">Mobile Wallpapers</h4>

                      <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                        {customMobileWallpapers.map((url, i) => (
                          <CustomWallpaperPreview
                            key={`mobile-wp-${i}`}
                            url={url}
                            isActive={activeMobileCustomIndex === i}
                            onClick={() => setActiveMobileCustomIndex(i)}
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

                      {customMobileWallpapers.length < 4 && (
                        <div className="flex gap-2 w-full">
                          <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 mt-1 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded text-[9px] md:text-[10px] text-white/60 hover:text-white cursor-pointer transition-colors">
                            <Plus className="w-3 h-3" /> Upload File
                            <input
                              type="file"
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 25 * 1024 * 1024) {
                                  alert("File is too large! Maximum allowed is 25MB.");
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
                                isOpen: true,
                                title: 'Add Wallpaper URL',
                                message: 'Enter a direct image or video URL (https://...):',
                                isPrompt: true,
                                promptPlaceholder: 'https://...',
                                onConfirm: (url?: string) => {
                                  if (url && url.trim().startsWith('http')) {
                                    setCustomMobileWallpapers([...customMobileWallpapers, url.trim()]);
                                    if (activeMobileCustomIndex === null) setActiveMobileCustomIndex(customMobileWallpapers.length);
                                  }
                                }
                              });
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 mt-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] md:text-[10px] text-white/60 hover:text-white transition-colors"
                          >
                            Add URL
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reset selection */}
                  {(activeDesktopCustomIndex !== null || activeMobileCustomIndex !== null) && (
                    <div className="flex justify-center mt-1 md:mt-2">
                      <button
                        onClick={() => {
                          setActiveDesktopCustomIndex(null);
                          setActiveMobileCustomIndex(null);
                        }}
                        className="px-3 py-1.5 md:px-3 md:py-1.5 bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white rounded text-[10px] md:text-[11px] font-bold transition-all border border-red-500/30"
                      >
                        Clear Active Selections
                      </button>
                    </div>
                  )}
                </div>
              )}

              {settingsActiveTab === 'focus' && (
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm md:text-base font-semibold">Focus & Peek Mode</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] md:mt-0.5 px-1">Configure visibility shortcuts.</p>
                    </div>
                    <button onClick={() => setInfoModalKey('panic')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors mr-1">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col p-2.5 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-2 md:gap-3">
                    <h4 className="font-medium text-[11px] md:text-xs">Visibility Shortcuts</h4>

                    <div className="flex items-center justify-between p-2 md:p-2.5 rounded-md bg-white/5">
                      <div className="flex flex-col pr-1 min-w-0">
                        <span className="text-[10px] md:text-[11px] font-medium leading-tight whitespace-nowrap">Peek Action</span>
                        <p className="text-[8px] md:text-[9px] text-white/50 mt-0.5 leading-tight truncate">Action on clicking eye icon.</p>
                      </div>
                      <div className="flex bg-black/40 p-0.5 rounded border border-white/10 shrink-0">
                        <button
                          onClick={() => setPanicButtonMode('redirect')}
                          className={`px-2 py-1 md:px-3 md:py-1 text-[8px] md:text-[9px] font-bold rounded-sm transition-all ${panicButtonMode === 'redirect' ? 'bg-red-500/20 text-red-400' : 'text-white/40 hover:text-white/80'}`}
                        >
                          Redirect
                        </button>
                        <button
                          onClick={() => setPanicButtonMode('hide')}
                          className={`px-2 py-1 md:px-3 md:py-1 text-[8px] md:text-[9px] font-bold rounded-sm transition-all ${panicButtonMode === 'hide' ? 'bg-blue-500/20 text-blue-400' : 'text-white/40 hover:text-white/80'}`}
                        >
                          Hide UI
                        </button>
                      </div>
                    </div>

                    <div className="p-2 md:p-2 rounded-md bg-red-500/10 border border-red-500/20 flex flex-col gap-1">
                      <p className="text-[8px] md:text-[9px] text-red-300 leading-relaxed">
                        <strong className="text-red-400">Mobile Peek:</strong> Tap the <strong className="text-white">Eye Icon</strong> right side to trigger!
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-white/5 p-2 md:p-2.5 rounded-md">
                      <div>
                        <p className="text-[10px] md:text-[11px] font-bold text-red-400">Peek Mode</p>
                        <p className="text-[8px] md:text-[9px] text-white/50 mt-0.5">Hide all widgets instantly.</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={formatShortcutText(panicShortcutKey)}
                            onKeyDown={(e) => handleShortcutCapture(e, setPanicShortcutKey)}
                            readOnly
                            placeholder="Keys..."
                            className="w-24 md:w-32 h-6 md:h-7 px-1.5 bg-black/40 border border-white/10 rounded text-center text-white outline-none focus:border-red-400 font-bold uppercase text-[9px] md:text-[10px]"
                          />
                          <button
                            onClick={() => togglePanicHide()}
                            className="px-2 py-1 md:px-2.5 md:py-1 bg-red-500/20 text-red-300 rounded border border-red-500/30 text-[9px] md:text-[10px] font-bold uppercase"
                          >
                            Trigger
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 md:p-2.5 rounded-md bg-white/5">
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <ImageIcon className="text-red-400 w-3.5 h-3.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] md:text-[11px] font-medium block leading-tight truncate">Switch Wallpaper on Peek</span>
                        </div>
                      </div>
                      <button onClick={() => setPanicWallpaperSwitch(!panicWallpaperSwitch)} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0 ${panicWallpaperSwitch ? 'bg-red-500' : 'bg-white/20'}`}>
                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${panicWallpaperSwitch ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-white/5 p-2 md:p-2.5 rounded-md">
                      <div>
                        <p className="text-[10px] md:text-[11px] font-bold text-blue-400">Focus Mode</p>
                        <p className="text-[8px] md:text-[9px] text-white/50 mt-0.5">Hide selected widgets below.</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={formatShortcutText(focusShortcutKey)}
                            onKeyDown={(e) => handleShortcutCapture(e, setFocusShortcutKey)}
                            readOnly
                            placeholder="Keys..."
                            className="w-24 md:w-32 h-6 md:h-7 px-1.5 bg-black/40 border border-white/10 rounded text-center text-white outline-none focus:border-blue-400 font-bold uppercase text-[9px] md:text-[10px]"
                          />
                          <button
                            onClick={() => toggleHide()}
                            className="px-2 py-1 md:px-2.5 md:py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 text-[9px] md:text-[10px] font-bold uppercase"
                          >
                            Trigger
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Focus Mode Configuration */}
                  <div className="flex flex-col p-2.5 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5">
                    <div className="flex flex-col sm:flex-row justify-between mb-2 md:mb-3 gap-2">
                      <div>
                        <h4 className="font-medium text-[11px] md:text-xs text-red-400 leading-tight">Focus Specific Setup</h4>
                        <div className="flex bg-black/40 p-0.5 rounded border border-white/10 mt-1.5 w-fit">
                          <button
                            onClick={() => setFocusPlatform('desktop')}
                            className={`px-2 py-1 md:px-3 md:py-1 text-[8px] md:text-[9px] font-bold rounded-sm ${focusPlatform === 'desktop' ? 'bg-blue-500/20 text-blue-400' : 'text-white/40'}`}
                          >
                            Desktop
                          </button>
                          <button
                            onClick={() => setFocusPlatform('mobile')}
                            className={`px-2 py-1 md:px-3 md:py-1 text-[8px] md:text-[9px] font-bold rounded-sm ${focusPlatform === 'mobile' ? 'bg-orange-500/20 text-orange-400' : 'text-white/40'}`}
                          >
                            Mobile
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => focusPlatform === 'desktop' ? setHideAll(false) : setMobileHideAll(false)}
                          className="px-2 py-1 md:px-2.5 md:py-1 bg-white/10 rounded text-[8px] md:text-[10px]"
                        >
                          Keep All
                        </button>
                        <button
                          onClick={() => focusPlatform === 'desktop' ? setHideAll(true) : setMobileHideAll(true)}
                          className="px-2 py-1 md:px-2.5 md:py-1 bg-red-500/20 text-red-300 rounded border border-red-500/30 text-[8px] md:text-[10px]"
                        >
                          Hide All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 md:gap-2.5">
                      {Object.entries({
                        quote: 'Daily Quote', stats: 'Stats Modal', plans: 'Roadmap & Plans',
                        countdowns: 'Countdowns', tasks: 'Tasks', notes: 'Quick Notes',
                        calendar: 'Calendar', timetable: 'Timetable',
                        timer: 'Session Timer', dock: 'Bottom Dock', clock: 'Big Clock',
                        todayFocusPill: 'Focus Pill', timerPill: 'Timer Pill',
                        deadlineAlerts: 'Alerts', bgSwitcher: 'Bg Switcher', stopwatch: 'Stopwatch',
                        settingsBtn: 'Settings Btn', videoControls: 'Video Ctrl'
                      }).map(([key, label]) => {
                        const isHidden = focusPlatform === 'desktop' ? hideConfig[key] : mobileHideConfig[key];
                        return (
                          <div key={key} className="flex items-center justify-between p-1.5 md:p-2 rounded bg-white/5 border border-white/5">
                            <span className="text-[8px] md:text-[10px] text-white/80 line-clamp-1 pr-1">{label}</span>
                            <button
                              onClick={() => focusPlatform === 'desktop' ? setHideConfig(key, !hideConfig[key]) : setMobileHideConfig(key, !mobileHideConfig[key])}
                              className={`relative inline-flex h-3 w-6 items-center rounded-full transition-colors shrink-0 ${isHidden ? 'bg-red-500' : 'bg-blue-500/50'}`}
                            >
                              <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${isHidden ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm md:text-base font-semibold">Data & Backup</h3>
                      <p className="text-white/50 text-[10px] md:text-[11px] md:mt-0.5 px-1">Manage local data.</p>
                    </div>
                    <button onClick={() => setInfoModalKey('backup')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors mr-1">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-2.5 md:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg md:rounded-xl">
                    <div className="flex items-start gap-2 md:gap-2.5">
                      <Activity className="text-blue-400 w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-[10px] md:text-[11px] text-blue-300">Important Recommendation</h4>
                        <p className="text-[9px] md:text-[10px] text-white/80 mt-1 leading-relaxed">
                          Backup data regularly. <strong>Switch to a separate User Profile</strong> before importing friend's plans to avoid overwrites!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 md:gap-3">
                    {/* Backup & Restore */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-2 md:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <UploadCloud className="text-green-400 w-4 h-4 shrink-0" />
                        <div className="min-w-0 pr-1">
                          <h4 className="font-medium text-[10px] md:text-sm whitespace-nowrap">Backup & Restore</h4>
                          <p className="text-[8px] md:text-[10px] text-white/50 leading-tight">Export/Import local JSON.</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={handleExportData}
                          className="flex-1 sm:flex-none justify-center px-2 py-1 md:px-3 md:py-1.5 bg-white/10 rounded text-[9px] md:text-[10px] font-medium border border-white/10 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Export
                        </button>
                        <label className="flex-1 sm:flex-none justify-center cursor-pointer px-2 py-1 md:px-3 md:py-1.5 bg-blue-500/20 text-blue-300 rounded text-[9px] md:text-[10px] font-medium border border-blue-500/30 flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Import
                          <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
                        </label>
                      </div>
                    </div>

                    {/* Plan Your Day Backup & Restore */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-2 md:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <UploadCloud className="text-pink-400 w-4 h-4 shrink-0" />
                        <div className="min-w-0 pr-1">
                          <h4 className="font-medium text-[10px] md:text-sm whitespace-nowrap">Plan Your Day Backup</h4>
                          <p className="text-[8px] md:text-[10px] text-white/50 leading-tight">Backup/Restore tasks & intervals.</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={handleBackupPlanYourDay}
                          className="flex-1 sm:flex-none justify-center px-2 py-1 md:px-3 md:py-1.5 bg-white/10 rounded text-[9px] md:text-[10px] font-medium border border-white/10 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Backup
                        </button>
                        <label className="flex-1 sm:flex-none justify-center cursor-pointer px-2 py-1 md:px-3 md:py-1.5 bg-pink-500/20 text-pink-300 rounded text-[9px] md:text-[10px] font-medium border border-pink-500/30 flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Restore
                          <input type="file" className="hidden" accept=".json" onChange={handleRestorePlanYourDay} />
                        </label>
                      </div>
                    </div>

                    {/* Notes Backup & Restore */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-2 md:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <UploadCloud className="text-yellow-400 w-4 h-4 shrink-0" />
                        <div className="min-w-0 pr-1">
                          <h4 className="font-medium text-[10px] md:text-sm whitespace-nowrap">Notes Backup</h4>
                          <p className="text-[8px] md:text-[10px] text-white/50 leading-tight">Backup/Restore all your notes.</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={handleBackupNotes}
                          className="flex-1 sm:flex-none justify-center px-2 py-1 md:px-3 md:py-1.5 bg-white/10 rounded text-[9px] md:text-[10px] font-medium border border-white/10 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Backup
                        </button>
                        <label className="flex-1 sm:flex-none justify-center cursor-pointer px-2 py-1 md:px-3 md:py-1.5 bg-yellow-500/20 text-yellow-300 rounded text-[9px] md:text-[10px] font-medium border border-yellow-500/30 flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Restore
                          <input type="file" className="hidden" accept=".json" onChange={handleRestoreNotes} />
                        </label>
                      </div>
                    </div>

                    {/* Settings Backup & Restore */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-2 md:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <UploadCloud className="text-blue-400 w-4 h-4 shrink-0" />
                        <div className="min-w-0 pr-1">
                          <h4 className="font-medium text-[10px] md:text-sm whitespace-nowrap">Settings Backup</h4>
                          <p className="text-[8px] md:text-[10px] text-white/50 leading-tight">Backup/Restore your preferences.</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={handleBackupSettings}
                          className="flex-1 sm:flex-none justify-center px-2 py-1 md:px-3 md:py-1.5 bg-white/10 rounded text-[9px] md:text-[10px] font-medium border border-white/10 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Backup
                        </button>
                        <label className="flex-1 sm:flex-none justify-center cursor-pointer px-2 py-1 md:px-3 md:py-1.5 bg-blue-500/20 text-blue-300 rounded text-[9px] md:text-[10px] font-medium border border-blue-500/30 flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Restore
                          <input type="file" className="hidden" accept=".json" onChange={handleRestoreSettings} />
                        </label>
                      </div>
                    </div>

                    {/* Timetable Backup & Restore */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-2 md:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <CalendarDays className="text-violet-400 w-4 h-4 shrink-0" />
                        <div className="min-w-0 pr-1">
                          <h4 className="font-medium text-[10px] md:text-sm whitespace-nowrap text-violet-300">Timetable Backup</h4>
                          <p className="text-[8px] md:text-[10px] text-white/50 leading-tight">Backup/Restore your weekly schedule.</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={handleBackupTimetable}
                          className="flex-1 sm:flex-none justify-center px-2 py-1 md:px-3 md:py-1.5 bg-white/10 rounded text-[9px] md:text-[10px] font-medium border border-white/10 flex items-center gap-1 text-violet-100"
                        >
                          <Download className="w-3 h-3" /> Backup
                        </button>
                        <label className="flex-1 sm:flex-none justify-center cursor-pointer px-2 py-1 md:px-3 md:py-1.5 bg-violet-500/20 text-violet-300 rounded text-[9px] md:text-[10px] font-medium border border-violet-500/30 flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Restore
                          <input type="file" className="hidden" accept=".json" onChange={handleRestoreTimetable} />
                        </label>
                      </div>
                    </div>

                    {/* Reset Timetable */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl bg-black/20 border border-white/5 gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <CalendarDays className="text-purple-400 w-4 h-4 shrink-0" />
                        <div className="min-w-0 pr-1">
                          <h4 className="font-medium text-[10px] md:text-sm whitespace-nowrap text-purple-300">Reset Timetable</h4>
                          <p className="text-[8px] md:text-[10px] text-white/50 leading-tight">Wipe existing schedule and colors.</p>
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
                              resetTimetable();
                              alert('Timetable reset successfully.');
                            }
                          });
                        }}
                        className="w-full sm:w-auto justify-center px-2 py-1 md:px-3 md:py-1.5 bg-purple-500/20 text-purple-300 rounded text-[9px] md:text-[10px] font-bold border border-purple-500/50 flex items-center gap-1 whitespace-nowrap"
                      >
                        Reset Schedule
                      </button>
                    </div>

                    {/* Danger Zone: Delete All Data */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl bg-red-500/10 border border-red-500/30 gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <Trash2 className="text-red-400 w-4 h-4 shrink-0" />
                        <div className="min-w-0 pr-1">
                          <h4 className="font-medium text-[10px] md:text-sm text-red-300 whitespace-nowrap">Factory Reset Profile</h4>
                          <p className="text-[8px] md:text-[10px] text-white/60 leading-tight">Delete ALL tasks, notes, history.</p>
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
                        className="w-full sm:w-auto justify-center px-2 py-1 md:px-3 md:py-1.5 bg-red-500/20 text-red-300 rounded text-[9px] md:text-[10px] font-bold border border-red-500/50 flex items-center gap-1 whitespace-nowrap"
                      >
                        <Trash2 className="w-3 h-3" /> Reset All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveTab === 'about' && (
                <div className="flex flex-col gap-2 md:gap-0 pb-4">

                  <div className="flex flex-col gap-2.5 md:gap-3 bg-black/30 border border-white/10 rounded-lg md:rounded-2xl p-3 md:p-4 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-48 h-48 md:w-64 md:h-64 bg-blue-500/30 blur-3xl rounded-full mix-blend-screen pointer-events-none" />

                    <div className="flex flex-row items-center justify-between gap-3 md:gap-4 w-full z-10">
                      <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 relative rounded-full overflow-hidden border-2 border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <img
                          src="/branding/author.jpeg"
                          alt="Gonaboyina Anand kumar"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>

                      <div className="flex flex-col flex-1 items-start text-left min-w-0 pl-1">
                        <div className="flex items-center gap-1.5 mb-0.5 w-full">
                          <h2 className="text-base md:text-lg font-extrabold tracking-tight text-white truncate">Gonaboyina Anand kumar</h2>
                          <BadgeCheck className="text-blue-400 shrink-0 w-4 h-4 md:w-5 md:h-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        </div>
                        <p className="text-blue-300 font-semibold tracking-wide uppercase text-[9px] md:text-[11px]">Full Stack MERN Developer</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start text-left z-10 w-full">
                      <p className="text-[9px] md:text-[11px] text-white/60 mb-2 md:mb-3 leading-relaxed max-w-xl">
                        Have suggestions, feedback, or found a bug? Click on LinkedIn below to message me directly!
                      </p>

                      <div className="grid grid-cols-2 gap-1.5 md:gap-1.5 w-full mb-1">
                        <a href="https://www.linkedin.com/in/anand-kumar-gonaboyina-b63946378" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 md:gap-2 bg-white/5 border border-[#0077b5]/30 rounded-md p-1.5 md:p-2 hover:bg-white/10 transition-colors">
                          <div className="p-1 md:p-1.5 bg-[#0077b5]/20 rounded shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0077b5] w-3 h-3"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                          </div>
                          <div className="flex flex-col items-start min-w-0 w-full">
                            <span className="text-[7px] md:text-[9px] text-white/50 w-full text-left">LinkedIn</span>
                            <span className="font-semibold text-[8px] md:text-[10px] w-full text-left truncate">Message me</span>
                          </div>
                        </a>

                        <a href="https://t.me/gAnandKumar" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 md:gap-2 bg-white/5 border border-white/10 rounded-md p-1.5 md:p-2 hover:bg-white/10 transition-colors">
                          <div className="p-1 md:p-1.5 bg-[#0088cc]/20 rounded shrink-0">
                            <Send className="text-[#0088cc] w-3 h-3" />
                          </div>
                          <div className="flex flex-col items-start min-w-0">
                            <span className="text-[7px] md:text-[9px] text-white/50 w-full text-left">Telegram</span>
                            <span className="font-semibold text-[8px] md:text-[10px] w-full text-left truncate">@gAnandKumar</span>
                          </div>
                        </a>

                        <a href="https://my-portfolio-silk-phi-78.vercel.app/" target="_blank" rel="noreferrer" className="col-span-2 justify-self-center w-1/2 min-w-[140px] md:min-w-[180px] flex items-center gap-1.5 md:gap-2 bg-white/5 border border-white/10 rounded-md p-1.5 md:p-2 hover:bg-white/10 transition-colors">
                          <div className="p-1 md:p-1.5 bg-[#0088cc]/20 rounded shrink-0">
                            <Briefcase className="text-[#0088cc] w-3 h-3" />
                          </div>
                          <div className="flex flex-col items-start min-w-0">
                            <span className="text-[7px] md:text-[9px] text-white/50 w-full text-left">Portfolio</span>
                            <span className="font-semibold text-[8px] md:text-[10px] w-full text-left truncate">View other projects</span>
                          </div>
                        </a>
                      </div>

                    </div>
                  </div>


                  {/* Donation Section */}
                  <div className="flex flex-col p-3 md:p-3 bg-black/20 border border-white/5 rounded-lg md:rounded-2xl text-center items-center justify-center relative overflow-hidden md:mt-4 ">
                    <h3 className="text-sm md:text-base font-bold mb-0 md:mb-1.5 md:mt-1">Support the Project ❤️</h3>
                    <p className="text-[9px] md:text-[10px] text-white/60 max-w-md mx-auto mb-2.5 md:mb-4 leading-relaxed px-1">
                      Built with love, but inspired by the pain of endless distractions and messy workspaces. It took many late nights to bring this vision to life. If this dashboard helps you reclaim your focus, consider supporting its continued development. A small tip goes a long way—and please leave a message, I'd love to hear how it's helping you!
                    </p>

                    <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 mb-3 md:mb-4">
                      {[
                        { amt: 50, label: 'Coffee' }, { amt: 100, label: 'Lunch' },
                        { amt: 200, label: 'Book' }, { amt: 500, label: 'Sponsor' },
                        { amt: null, label: 'Any' }
                      ].map(d => (
                        <button
                          key={d.label}
                          onClick={() => setDonationAmount(d.amt)}
                          className={`px-2 py-1 md:px-3 md:py-1.5 rounded text-[8px] md:text-[9px] font-bold border ${donationAmount === d.amt ? 'bg-pink-500/20 text-pink-300 border-pink-500/50' : 'bg-black/40 text-white/50 border-white/5'}`}
                        >
                          {d.amt ? `₹${d.amt}` : 'Any'} {d.amt && `(${d.label})`}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-row items-center gap-3 md:gap-4 bg-white/5 p-2 md:p-2.5 rounded-lg md:rounded-xl border border-white/10 w-full sm:w-auto">
                      <div className="bg-[#ffffff] p-1.5 md:p-2 rounded shadow-xl shrink-0">
                        <QRCodeSVG
                          value={`upi://pay?pa=${upiId}&pn=Anand%20Kumar&cu=INR${donationAmount ? `&am=${donationAmount}` : ''}`}
                          size={70}
                          className="md:w-[90px] md:h-[90px]"
                          level="H"
                          includeMargin={false}
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>
                      <div className="flex flex-col text-left gap-1 md:gap-2 min-w-0 pr-2">
                        <div>
                          <p className="text-[8px] md:text-[9px] text-white/70 uppercase font-semibold mb-0.5 whitespace-nowrap">Scan to Pay</p>
                          <p className="font-bold text-xs md:text-sm text-white">{donationAmount ? `₹${donationAmount}` : 'Any Amount'}</p>
                        </div>
                        <div className="h-px w-full bg-white/10 my-0.5" />
                        <div className="min-w-0">
                          <p className="text-[8px] md:text-[9px] text-white/50 uppercase font-semibold mb-0.5">UPI ID</p>
                          <p className="text-[9px] md:text-[10px] text-blue-300 font-mono truncate">{upiId}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Credits & Supporters Section */}
                  <div className="flex flex-col gap-3 md:gap-4 mt-1 md:mt-6 pt-3 md:pt-4 border-t border-white/10">
                    <h3 className="text-xs md:text-sm font-semibold flex items-center gap-1.5 md:gap-2">
                      <BadgeCheck className="text-pink-400 w-4 h-4 md:w-5 md:h-5" /> Credits & Supporters
                    </h3>

                    <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-2.5 md:p-3 flex flex-col gap-1.5">
                      <p className="text-[9px] md:text-[10px] text-pink-300 font-medium leading-relaxed">
                        I originally started building this out of pure frustration. I needed something to help me stay on track.
                      </p>
                      <p className="text-[8px] md:text-[9px] text-pink-200/80 leading-relaxed italic">
                        "A big thank you to everyone who believed in this project and tested it. Thanks for always having my back."
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {/* Sathish Kumar */}
                      <div className="bg-black/20 border border-white/5 rounded-lg p-3 md:p-4 flex items-center text-left gap-3">
                        <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full overflow-hidden border-2 border-white/10">
                          <img src="/sathish.jpeg" alt="Sathish" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <h4 className="text-sm md:text-sm font-bold text-white truncate">Sathish Kumar</h4>
                          <p className="text-[8px] md:text-[9px] text-white/60 font-semibold uppercase mt-0.5 truncate"><span className="text-blue-300">EEE</span> • NIT Patna</p>
                          <p className=" text-[10px] md:text-[10px] text-white/60 mt-1.5 leading-relaxed">
                            Tested countless hours to identify bugs and provided invaluable UX suggestions.
                          </p>
                        </div>
                      </div>

                      {/* Jyothir Ganesh */}
                      <div className="bg-black/20 border border-white/5 rounded-lg p-3 md:p-4 flex items-center text-left gap-3">
                        <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full overflow-hidden border-2 border-white/10">
                          <img src="/jyothir.png" alt="Jyothir" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <h4 className="text-sm md:text-sm font-bold text-white truncate">Jyothir Ganesh</h4>
                          <p className="text-[8px] md:text-[9px] text-white/60 font-semibold uppercase mt-0.5 truncate"><span className="text-blue-300">ECE</span> • Vishnu Inst.</p>
                          <p className=" text-[10px] md:text-[10px] text-white/60 mt-1.5 leading-relaxed">
                            My strongest pillar of support. Always provides grounded, factual advice.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </ScrollableWithArrows>

            {/* Content Scroll Down Button */}

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
      />
    </div>
  );
}

