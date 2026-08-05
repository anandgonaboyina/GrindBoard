"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { CalendarDays, Edit2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, Settings, Plus, Trash, Clock, ArrowUp, ArrowDown, X, Sun, Moon, Copy, ClipboardPaste, Download, Upload } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import ConfirmationModal from './ConfirmationModal';

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKENDS = ["Sat", "Sun"];

// Exact sizing to guarantee perfect alignment across columns
const CELL_HEIGHT = 40; // Tighter 32px per block height for ultra-compact views
const CELL_GAP = 4;     // 4px gap between blocks
const TOTAL_HEIGHT = CELL_HEIGHT + CELL_GAP;

// Upgraded to a richer palette with explicit Light and Dark mode variants
export const CELL_COLORS = [
  { name: 'default', bg: 'bg-white/5', lightBg: 'bg-black/5', active: 'bg-violet-500/30', lightActive: 'bg-violet-500/20', text: 'text-gray-300', lightText: 'text-slate-600', solidBg: 'bg-white/40', lightSolidBg: 'bg-black/20' },
  { name: 'red', bg: 'bg-rose-500/15', lightBg: 'bg-rose-500/20', active: 'bg-rose-500/30', lightActive: 'bg-rose-500/30', text: 'text-rose-300', lightText: 'text-rose-700', solidBg: 'bg-rose-500/80', lightSolidBg: 'bg-rose-500' },
  { name: 'blue', bg: 'bg-sky-500/15', lightBg: 'bg-sky-500/20', active: 'bg-sky-500/30', lightActive: 'bg-sky-500/30', text: 'text-sky-300', lightText: 'text-sky-700', solidBg: 'bg-sky-500/80', lightSolidBg: 'bg-sky-500' },
  { name: 'green', bg: 'bg-emerald-500/15', lightBg: 'bg-emerald-500/20', active: 'bg-emerald-500/30', lightActive: 'bg-emerald-500/30', text: 'text-emerald-300', lightText: 'text-emerald-700', solidBg: 'bg-emerald-500/80', lightSolidBg: 'bg-emerald-500' },
  { name: 'yellow', bg: 'bg-amber-500/15', lightBg: 'bg-amber-500/20', active: 'bg-amber-500/30', lightActive: 'bg-amber-500/30', text: 'text-amber-300', lightText: 'text-amber-700', solidBg: 'bg-amber-500/80', lightSolidBg: 'bg-amber-500' },
  { name: 'purple', bg: 'bg-violet-500/15', lightBg: 'bg-violet-500/20', active: 'bg-violet-500/30', lightActive: 'bg-violet-500/30', text: 'text-violet-300', lightText: 'text-violet-700', solidBg: 'bg-violet-500/80', lightSolidBg: 'bg-violet-500' },
  { name: 'orange', bg: 'bg-orange-500/15', lightBg: 'bg-orange-500/20', active: 'bg-orange-500/30', lightActive: 'bg-orange-500/30', text: 'text-orange-300', lightText: 'text-orange-700', solidBg: 'bg-orange-500/80', lightSolidBg: 'bg-orange-500' },
  { name: 'cyan', bg: 'bg-cyan-500/15', lightBg: 'bg-cyan-500/20', active: 'bg-cyan-500/30', lightActive: 'bg-cyan-500/30', text: 'text-cyan-300', lightText: 'text-cyan-700', solidBg: 'bg-cyan-500/80', lightSolidBg: 'bg-cyan-500' },
  { name: 'pink', bg: 'bg-fuchsia-500/15', lightBg: 'bg-fuchsia-500/20', active: 'bg-fuchsia-500/30', lightActive: 'bg-fuchsia-500/30', text: 'text-fuchsia-300', lightText: 'text-fuchsia-700', solidBg: 'bg-fuchsia-500/80', lightSolidBg: 'bg-fuchsia-500' },
];

// Utility to format minutes into h:mm AM/PM
const formatTime = (totalMins: number) => {
  let h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const parseMins = (tStr: string) => {
  if (!tStr) return 0;
  const m = tStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const ampm = m[3].toUpperCase();
  if (h === 12 && ampm === "AM") h = 0;
  if (h !== 12 && ampm === "PM") h += 12;
  return h * 60 + min;
};

export default function Timetable() {
  const {
    theme: globalTheme,
    timetableThemeOverride,
    setTimetableThemeOverride,
    timetableGrid: myTimetableGrid,
    // ...
    timetableColors: myTimetableColors,
    weekdayTimes: myWeekdayTimes,
    weekendTimes: myWeekendTimes,
    timetableStartTime: myTimetableStartTime,
    timetableWeekendStartTime: myTimetableWeekendStartTime,
    setTimetableStartTime,
    setTimetableWeekendStartTime,
    updateTimetableCell, updateTimetableColor,
    updateTimetableTime, addTimetableRow, deleteTimetableRow,
    useTimetableRange, toggleTimetableRange, renameTimetableKeys,
    viewingFriend, setViewingFriend
  } = useDashboardStore();

  const effectiveTheme = timetableThemeOverride || (globalTheme === 'light' ? 'light' : 'dark');
  const isDark = effectiveTheme === 'dark';

  const timetableGrid = viewingFriend ? (viewingFriend.stats.timetableGrid || {}) : myTimetableGrid;
  const timetableColors = viewingFriend ? (viewingFriend.stats.timetableColors || {}) : myTimetableColors;
  const weekdayTimes = viewingFriend ? (viewingFriend.stats.weekdayTimes || ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"]) : myWeekdayTimes;
  const weekendTimes = viewingFriend ? (viewingFriend.stats.weekendTimes || ["10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM"]) : myWeekendTimes;
  const friendStartTime = viewingFriend ? (viewingFriend.stats.timetableStartTime ?? 540) : myTimetableStartTime;
  const friendWeekendStartTime = viewingFriend ? (viewingFriend.stats.timetableWeekendStartTime ?? 540) : myTimetableWeekendStartTime;

  const [currentDayIndex, setCurrentDayIndex] = useState(() => new Date().getDay());
  const [viewMode, setViewMode] = useState<"weekdays" | "weekends">(
    () => (new Date().getDay() === 0 || new Date().getDay() === 6) ? "weekends" : "weekdays"
  );
  const [editingCell, setEditingCell] = useState<{ day: string, time: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [globalEditingIndex, setGlobalEditingIndex] = useState<number | null>(null);
  const [copiedDay, setCopiedDay] = useState<string | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    hideCancel?: boolean;
    onCancel?: () => void;
    onConfirm: () => void;
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }
  });

  // Scroll logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setStartY(e.pageY - (scrollContainerRef.current?.offsetTop || 0));
    setScrollTop(scrollContainerRef.current?.scrollTop || 0);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const y = e.pageY - scrollContainerRef.current.offsetTop;
    const walkY = (y - startY) * 1.5;
    scrollContainerRef.current.scrollTop = scrollTop - walkY;

    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walkX = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
  };

  const [isEditingStartTime, setIsEditingStartTime] = useState(false);

  // Sync legacy local storage to Zustand on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedWdStart = localStorage.getItem('timetable_start_weekday');
      const storedWeStart = localStorage.getItem('timetable_start_weekend');
      if (storedWdStart) {
        setTimetableStartTime(parseInt(storedWdStart));
        localStorage.removeItem('timetable_start_weekday'); // Migrate to cloud
      }
      if (storedWeStart) {
        setTimetableWeekendStartTime(parseInt(storedWeStart));
        localStorage.removeItem('timetable_start_weekend'); // Migrate to cloud
      }
    }
    const day = new Date().getDay();
    setCurrentDayIndex(day);
    if (day === 0 || day === 6) setViewMode("weekends");
    else setViewMode("weekdays");
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTimetableThemeOverride(newTheme);
  };

  const executeCopy = (sourceDay: string, targetDay: string) => {
    if (viewingFriend) return;

    // Create new maps to avoid mutation
    const newGrid = { ...myTimetableGrid };
    const newColors = { ...myTimetableColors };

    // Copy content
    if (myTimetableGrid[sourceDay]) {
      newGrid[targetDay] = { ...myTimetableGrid[sourceDay] };
    } else {
      delete newGrid[targetDay];
    }

    // Copy colors
    if (myTimetableColors[sourceDay]) {
      newColors[targetDay] = { ...myTimetableColors[sourceDay] };
    } else {
      delete newColors[targetDay];
    }

    useDashboardStore.setState({
      timetableGrid: newGrid,
      timetableColors: newColors
    });
  };

  const isWeekendMode = viewMode === "weekends";
  const activeDays = isWeekendMode ? WEEKENDS : WEEKDAYS;
  const rawTimes = isWeekendMode ? weekendTimes : weekdayTimes;
  const startTime = isWeekendMode ? friendWeekendStartTime : friendStartTime;

  const handleSetStartTime = (mins: number, skipRename = false) => {
    if (!skipRename) {
      const diff = mins - startTime;
      if (diff !== 0) {
        let oldAccumulated = startTime;
        let newAccumulated = mins;
        const keyMap: Record<string, string> = {};

        for (let i = 0; i < durations.length; i++) {
          const oldStr = formatTime(oldAccumulated);
          const newStr = formatTime(newAccumulated);
          if (oldStr !== newStr) {
            keyMap[oldStr] = newStr;
          }
          oldAccumulated += durations[i];
          newAccumulated += durations[i];
        }
        renameTimetableKeys(isWeekendMode, keyMap);
      }
    }

    if (viewMode === "weekdays") {
      setTimetableStartTime(mins);
    } else {
      setTimetableWeekendStartTime(mins);
    }
    setIsEditingStartTime(false);
  };

  // Map old string times to durations (60 mins default) to safely migrate
  const durations = rawTimes.length > 0 ? rawTimes.map((t: any) => {
    if (typeof t === 'number') return t;
    return 60;
  }) : [60, 60, 60, 60, 60, 60, 60, 60, 60];

  // Calculate actual absolute TIMES based on Start Time + cumulative Durations

  let currentAccumulatedMins = startTime;
  const generatedTimes: { startStr: string, endStr: string, startMins: number, endMins: number, duration: number }[] = [];

  for (let i = 0; i < durations.length; i++) {
    const dur = durations[i];
    const startStr = formatTime(currentAccumulatedMins);
    const endStr = formatTime(currentAccumulatedMins + dur);
    generatedTimes.push({
      startStr, endStr, startMins: currentAccumulatedMins, endMins: currentAccumulatedMins + dur, duration: dur
    });
    currentAccumulatedMins += dur;
  }

  // Active Time Detection
  const [activeTimeIndex, setActiveTimeIndex] = useState(-1);
  useEffect(() => {
    const checkActiveTime = () => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();

      let activeIdx = -1;
      for (let i = 0; i < generatedTimes.length; i++) {
        const block = generatedTimes[i];
        let isActive = false;
        if (block.endMins < block.startMins) {
          // Crosses midnight
          isActive = nowMins >= block.startMins || nowMins < block.endMins;
        } else {
          isActive = nowMins >= block.startMins && nowMins < block.endMins;
        }
        if (isActive) {
          activeIdx = i;
          break;
        }
      }
      setActiveTimeIndex(activeIdx);
    };

    checkActiveTime();
    const interval = setInterval(checkActiveTime, 60000);
    return () => clearInterval(interval);
  }, [generatedTimes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  const handleBackup = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Timetable Backup',
      message: (
        <div className="flex flex-col gap-3 text-sm text-white/80">
          <p>Your backup file (<code className="text-orange-300 text-xs px-1 bg-black/30 rounded">timetable_backup.json</code>) will be saved to your PC's <strong>Downloads</strong> folder.</p>
          <p>To use this backup later or on another device, click the <strong>Restore</strong> button and select the downloaded file.</p>
          {typeof window !== 'undefined' && ((window as any).chrome?.webview !== undefined || navigator.userAgent.includes('wv') || navigator.userAgent.includes('Lively')) && (
            <p className="text-[11px] text-blue-300 bg-blue-500/10 p-2 rounded mt-1 border border-blue-500/20">
              ℹ️ A new tab will briefly open to process the download securely.
            </p>
          )}
        </div>
      ),
      confirmText: 'Download',
      cancelText: 'Cancel',
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
      onConfirm: () => {
        const backupData = {
          timetableGrid: myTimetableGrid,
          timetableColors: myTimetableColors,
          weekdayTimes: myWeekdayTimes,
          weekendTimes: myWeekendTimes,
          timetableStartTime: myTimetableStartTime,
          timetableWeekendStartTime: myTimetableWeekendStartTime,
        };
        
        // Check if we are running in Lively Wallpaper (WebView2)
        const isWebView2 = typeof window !== 'undefined' && ((window as any).chrome?.webview !== undefined || navigator.userAgent.includes('wv') || navigator.userAgent.includes('Lively'));
        
        if (isWebView2) {
          fetch('/api/download-echo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: JSON.stringify(backupData, null, 2),
              name: 'timetable_backup.json',
              type: 'Timetable Backup'
            })
          }).then(res => res.json()).then(result => {
            if (result.success && result.id) {
              window.open(window.location.origin + '/api/download-echo?id=' + result.id, '_blank');
              showToast("Opening browser to download backup...");
            } else {
              showToast("Failed to prepare download.");
            }
          }).catch(() => showToast("Error connecting to download server."));
        } else {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", "timetable_backup.json");
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
          showToast("Backup download triggered!");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (parsed.timetableGrid) {
          useDashboardStore.setState({
            timetableGrid: parsed.timetableGrid || {},
            timetableColors: parsed.timetableColors || {},
            weekdayTimes: parsed.weekdayTimes || [],
            weekendTimes: parsed.weekendTimes || [],
            timetableStartTime: parsed.timetableStartTime || 540,
            timetableWeekendStartTime: parsed.timetableWeekendStartTime || 540,
          });
          showToast("Timetable restored successfully!");
        } else {
          showToast("Invalid backup file.");
        }
      } catch (err) {
        showToast("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    setShowSettings(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateDuration = (idx: number, newDur: number) => {
    let oldAccumulated = startTime;
    const oldTimesStrs: string[] = [];
    for (let i = 0; i < durations.length; i++) {
      oldTimesStrs.push(formatTime(oldAccumulated));
      oldAccumulated += durations[i];
    }

    const newDurations = [...durations];
    newDurations[idx] = newDur;

    let newAccumulated = startTime;
    const newTimesStrs: string[] = [];
    for (let i = 0; i < newDurations.length; i++) {
      newTimesStrs.push(formatTime(newAccumulated));
      newAccumulated += newDurations[i];
    }

    const keyMap: Record<string, string> = {};
    for (let i = 0; i < oldTimesStrs.length; i++) {
      if (oldTimesStrs[i] !== newTimesStrs[i]) {
        keyMap[oldTimesStrs[i]] = newTimesStrs[i];
      }
    }

    updateTimetableTime(isWeekendMode, idx, newDur as any, keyMap);
  };

  // --- SMART ROW MANAGEMENT ---
  const handleAddTopRow = () => {
    const newStart = startTime - 60;
    if (newStart < 0) {
      alert("Cannot start before midnight!");
      return;
    }
    handleSetStartTime(newStart, true); // skip key renaming
    addTimetableRow(isWeekendMode, true);
    setShowSettings(false);
  };

  const handleDeleteTopRow = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Top Row',
      message: 'Delete the top row?',
      isDestructive: true,
      onConfirm: () => {
        const durationToRemove = generatedTimes[0]?.duration || 60;
        const newStart = startTime + durationToRemove;
        handleSetStartTime(newStart, true); // skip key renaming
        deleteTimetableRow(isWeekendMode, 0);
        setShowSettings(false);
      }
    });
  };

  return (
    <div suppressHydrationWarning className={` transition-colors duration-500 rounded-[20px] md:rounded-[24px] p-1.5 md:p-2.5 w-full max-w-[100vw] md:w-fit overflow-hidden md:overflow-visible relative mx-auto
        ${isDark ? 'bg-gradient-to-br from-[#12121a] to-[#0a0a0c] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-white/90'
        : 'bg-gradient-to-br from-slate-50 to-slate-100 border border-black/10 shadow-[0_8px_30px_rgb(0,0,0,0.1)] text-slate-800'}`}>

      {/* Start Time Modal Overlay */}
      {isEditingStartTime && (
        <StartTimeEditor currentMins={startTime} isDark={isDark} onSave={handleSetStartTime} onCancel={() => setIsEditingStartTime(false)} />
      )}

      {/* Header Area */}
      <div className={`flex items-center justify-between mb-1.5 md:mb-2 pb-1.5 border-b px-1 min-w-0 md:min-w-[400px] lg:min-w-[700px]  ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setViewMode(viewMode === "weekdays" ? "weekends" : "weekdays")}
            className={`p-1 active:scale-95 rounded-lg transition-all shrink-0 ${isDark ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'}`}
            title="Previous view"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={toggleTheme}
            className={`p-1 active:scale-95 rounded-lg transition-all shrink-0 ${isDark ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/5 text-slate-400 hover:text-slate-800'}`}
            title="Toggle Theme"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        <div className="flex items-center gap-1 md:gap-1.5 relative" ref={settingsRef}>
          <CalendarDays className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
          <span className={`font-bold tracking-widest uppercase text-[10px] md:text-[11px] text-center truncate ${isDark ? 'text-gray-100' : 'text-slate-800'}`}>
            {viewMode === "weekdays" ? "Weekly Schedule" : "Weekend Schedule"}
          </span>
          {!viewingFriend && (
            <button onClick={() => setShowSettings(!showSettings)} className={`p-0.5 md:p-1 rounded-md transition-all hover:rotate-90 ml-0.5 shrink-0 ${isDark ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/5 text-slate-500 hover:text-slate-900'}`}>
              <Settings size={12} />
            </button>
          )}

          {showSettings && (
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 rounded-xl shadow-2xl py-1 z-50 flex flex-col min-w-[160px] animate-in slide-in-from-top-2 fade-in duration-200 backdrop-blur-xl border ${isDark ? 'bg-gray-900/95 border-white/10' : 'bg-white/95 border-black/10'}`}>
              <div className={`px-2 py-1 text-[8px] uppercase tracking-wider font-bold border-b mb-0.5 ${isDark ? 'text-white/40 border-white/5' : 'text-slate-400 border-black/5'}`}>Row Management</div>
              <button onClick={handleAddTopRow} className={`px-2 py-1.5 text-[10px] flex items-center justify-between transition-colors w-full text-left ${isDark ? 'hover:bg-white/10 text-white/80' : 'hover:bg-black/5 text-slate-700'}`}>
                <span className="flex items-center gap-1.5"><ArrowUp size={12} className={isDark ? "text-emerald-400" : "text-emerald-600"} /> Add Top Row</span>
              </button>
              <button onClick={() => { addTimetableRow(isWeekendMode); setShowSettings(false); }} className={`px-2 py-1.5 text-[10px] flex items-center justify-between transition-colors w-full text-left border-b pb-2 mb-0.5 ${isDark ? 'hover:bg-white/10 text-white/80 border-white/5' : 'hover:bg-black/5 text-slate-700 border-black/5'}`}>
                <span className="flex items-center gap-1.5"><ArrowDown size={12} className={isDark ? "text-sky-400" : "text-sky-600"} /> Add Bottom Row</span>
              </button>
              <button onClick={handleDeleteTopRow} className={`px-2 py-1.5 text-[10px] flex items-center gap-1.5 transition-colors w-full text-left ${isDark ? 'hover:bg-rose-500/10 text-rose-400' : 'hover:bg-rose-100 text-rose-600'}`}>
                <Trash size={12} /> Delete Top Row
              </button>
              <button onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Delete Bottom Row',
                  message: 'Delete the bottom row?',
                  isDestructive: true,
                  onConfirm: () => {
                    deleteTimetableRow(isWeekendMode, generatedTimes.length - 1);
                    setShowSettings(false);
                  }
                });
              }} className={`px-2 py-1.5 text-[10px] flex items-center gap-1.5 transition-colors w-full text-left ${isDark ? 'hover:bg-rose-500/10 text-rose-400' : 'hover:bg-rose-100 text-rose-600'}`}>
                <Trash size={12} /> Delete Bottom Row
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setViewMode(viewMode === "weekdays" ? "weekends" : "weekdays")}
          className={`p-1 active:scale-95 rounded-lg transition-all shrink-0 ${isDark ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'}`}
          title="Next view"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Compact Start Time Trigger & Copy Mode Toggle */}
      <div className="mb-2 flex flex-wrap justify-center items-center gap-1.5 md:gap-2 w-full px-1">
        {!viewingFriend && (
          <>
            <button
              onClick={handleBackup}
              className={`text-[8px] md:text-[9px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 font-semibold shadow-sm active:scale-95 ${isDark ? 'text-violet-300 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20 hover:shadow-[0_0_10px_rgba(139,92,246,0.15)]' : 'text-violet-700 bg-violet-100 border-violet-200 hover:bg-violet-200'}`}
            >
              <Download size={10} /> <span className="whitespace-nowrap">Backup</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`text-[8px] md:text-[9px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 font-semibold shadow-sm active:scale-95 ${isDark ? 'text-violet-300 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20 hover:shadow-[0_0_10px_rgba(139,92,246,0.15)]' : 'text-violet-700 bg-violet-100 border-violet-200 hover:bg-violet-200'}`}
            >
              <Upload size={10} /> <span className="whitespace-nowrap">Restore</span>
            </button>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestore} className="hidden" />
          </>
        )}

        <button
          onClick={() => !viewingFriend && setIsEditingStartTime(true)}
          className={`text-[8px] md:text-[9px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 font-semibold shadow-sm ${viewingFriend ? 'cursor-default' : 'active:scale-95'} ${isDark ? 'text-sky-300 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20 hover:shadow-[0_0_10px_rgba(14,165,233,0.15)]' : 'text-sky-700 bg-sky-100 border-sky-200 hover:bg-sky-200'}`}
        >
          <Clock size={10} /> <span className="whitespace-nowrap">Day Starts: {formatTime(startTime)}</span>
        </button>

        {!viewingFriend && (
          <button
            onClick={() => {
              const newMode = !isCopyMode;
              setIsCopyMode(newMode);
              setCopiedDay(null);
              if (newMode) {
                setConfirmModal({
                  isOpen: true,
                  title: 'How to Copy a Day',
                  message: (
                    <div className="flex flex-col gap-2 text-sm">
                      <p><strong>1.</strong> Click the <Copy size={12} className="inline mx-1"/> icon on the day you want to copy.</p>
                      <p><strong>2.</strong> Click the <ClipboardPaste size={12} className="inline mx-1"/> icon on another day to paste the schedule there.</p>
                    </div>
                  ),
                  confirmText: 'Got it!',
                  hideCancel: true,
                  onConfirm: () => {}
                });
              }
            }}
            className={`text-[8px] md:text-[9px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 font-semibold shadow-sm active:scale-95 ${isCopyMode ? (isDark ? 'text-white bg-red-500 border-red-500' : 'text-white bg-red-500 border-red-600') : (isDark ? 'text-white/40 bg-white/5 border-white/10 hover:bg-white/10' : 'text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200')}`}
            title="Toggle Copy Mode"
          >
            <Copy size={10} className="shrink-0" />
            <span className="whitespace-nowrap">{!isCopyMode ? 'Copy Day' : 'Cancel Copy'}</span>
          </button>
        )}
      </div>

      {/* Timetable Grid Area */}
      <div
        className="relative overflow-auto custom-scrollbar pb-1 px-0.5 w-full max-h-[50vh] md:max-h-[60vh] cursor-grab active:cursor-grabbing"
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {toastMessage && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-blue-500 text-white text-[10px] md:text-xs px-3 py-1.5 rounded-full shadow-lg font-semibold animate-in fade-in slide-in-from-top-4 pointer-events-none">
            {toastMessage}
          </div>
        )}
        <div
          className={`grid gap-x-1 ${viewMode === "weekdays" ? "min-w-[420px] md:min-w-[500px] grid-cols-[55px_repeat(5,1fr)] md:grid-cols-[120px_repeat(5,1fr)]" : "min-w-[200px] md:min-w-[260px] grid-cols-[55px_repeat(2,1fr)] md:grid-cols-[120px_repeat(2,1fr)]"}`}
        >
          {/* Time Column */}
          <div className={`sticky left-0 z-40 md:min-w-[120px] backdrop-blur-md flex flex-col rounded-lg pr-0.5 md:pr-1 ${isDark ? 'bg-[#0f0f13]/90 shadow-[4px_0_10px_-3px_rgba(0,0,0,0.5)]' : 'bg-slate-50/90 shadow-[4px_0_10px_-3px_rgba(0,0,0,0.1)]'}`}>
            <div className={`h-6 md:h-8 flex items-center justify-center text-center font-bold uppercase tracking-widest text-[8px] md:text-[9px] mb-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Time</div>

            {generatedTimes.map((block, index) => {
              return (
                <div key={index} style={{ height: `${CELL_HEIGHT}px`, marginBottom: `${CELL_GAP}px` }} className="relative w-full">
                  <DurationCell
                    block={block}
                    index={index}
                    isDark={isDark}
                    onUpdate={(newDur) => handleUpdateDuration(index, newDur)}
                    isActive={activeTimeIndex === index}
                    isRange={useTimetableRange}
                    isEditingOverride={globalEditingIndex === index}
                    setEditingOverride={(state) => !viewingFriend && setGlobalEditingIndex(state ? index : null)}
                    isReadOnly={!!viewingFriend}
                  />
                </div>
              )
            })}
          </div>

          {/* Day Columns */}
          {activeDays.map((day) => {
            const dayIndexMap: Record<string, number> = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
            const isToday = currentDayIndex === dayIndexMap[day];

            const colorMap: Record<string, { dark: string, light: string }> = {
              "Mon": { dark: "text-rose-300 border-rose-400/20 bg-rose-500/10", light: "text-rose-700 border-rose-400/30 bg-rose-500/20" },
              "Tue": { dark: "text-orange-300 border-orange-400/20 bg-orange-500/10", light: "text-orange-700 border-orange-400/30 bg-orange-500/20" },
              "Wed": { dark: "text-amber-300 border-amber-400/20 bg-amber-500/10", light: "text-amber-700 border-amber-400/30 bg-amber-500/20" },
              "Thu": { dark: "text-emerald-300 border-emerald-400/20 bg-emerald-500/10", light: "text-emerald-700 border-emerald-400/30 bg-emerald-500/20" },
              "Fri": { dark: "text-sky-300 border-sky-400/20 bg-sky-500/10", light: "text-sky-700 border-sky-400/30 bg-sky-500/20" },
              "Sat": { dark: "text-violet-300 border-violet-400/20 bg-violet-500/10", light: "text-violet-700 border-violet-400/30 bg-violet-500/20" },
              "Sun": { dark: "text-fuchsia-300 border-fuchsia-400/20 bg-fuchsia-500/10", light: "text-fuchsia-700 border-fuchsia-400/30 bg-fuchsia-500/20" }
            };

            const headerStyle = isDark
              ? (isToday ? 'bg-violet-500/20 text-violet-200 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.15)]' : colorMap[day].dark)
              : (isToday ? 'bg-violet-100 text-violet-800 border-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]' : colorMap[day].light);

            return (
              <div key={day} className={`flex flex-col p-0.5 rounded-xl transition-all duration-300 ${isToday ? (isDark ? 'bg-white/[0.04] border border-white/5 shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]' : 'bg-slate-200/50 border border-slate-300/50') : ''}`}>
                <div className={`relative h-6 md:h-8 flex items-center justify-center text-center font-bold uppercase tracking-widest text-[9px] md:text-[10px] mb-1 rounded-lg border backdrop-blur-sm ${headerStyle}`}>
                  {day}
                  {!viewingFriend && isCopyMode && (
                    copiedDay === day ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCopiedDay(null);
                          setIsCopyMode(!isCopyMode);
                        }}
                        className={`absolute right-1 p-0.5 rounded transition-all hover:scale-110 active:scale-95 ${isDark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-500/10'}`}
                        title="Cancel copy"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    ) : copiedDay ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmModal({
                            isOpen: true,
                            title: 'Paste Schedule',
                            message: `Are you sure you want to paste ${copiedDay}'s schedule to ${day}? This will overwrite the existing schedule for ${day}.`,
                            onConfirm: () => {
                              executeCopy(copiedDay, day);
                              setCopiedDay(null);
                            }
                          });
                        }}
                        className={`absolute right-1 p-0.5 rounded transition-all hover:scale-110 active:scale-95 animate-pulse ${isDark ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-emerald-600 hover:bg-emerald-500/10'}`}
                        title={`Paste ${copiedDay}'s schedule here`}
                      >
                        <ClipboardPaste size={10} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCopiedDay(day);
                          showToast(`Copied ${day}. Click on another column to paste there.`);
                        }}
                        className={`absolute right-1 p-0.5 rounded transition-all hover:scale-110 active:scale-95 ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/30 hover:text-black hover:bg-black/10'}`}
                        title={`Copy ${day}'s schedule`}
                      >
                        <Copy size={10} />
                      </button>
                    )
                  )}
                </div>

                {/* We map the exact same height containers to ensure perfect alignment */}
                {generatedTimes.map((block, index) => {
                  const gridKey = block.startStr;
                  const subject = timetableGrid?.[day]?.[gridKey] || "";
                  const customColorName = timetableColors?.[day]?.[gridKey];
                  const customColor = CELL_COLORS.find(c => c.name === customColorName) || CELL_COLORS[0];

                  const prevKey = index > 0 ? generatedTimes[index - 1].startStr : null;
                  const prevSubject = prevKey ? (timetableGrid?.[day]?.[prevKey] || "") : "";
                  const nextKey = index < generatedTimes.length - 1 ? generatedTimes[index + 1].startStr : null;
                  const nextSubject = nextKey ? (timetableGrid?.[day]?.[nextKey] || "") : "";

                  const isContinuation = subject === prevSubject;
                  const isContinuedByNext = subject === nextSubject;

                  let spanCount = 1;
                  if (!isContinuation && isContinuedByNext) {
                    for (let j = index + 1; j < generatedTimes.length; j++) {
                      if ((timetableGrid?.[day]?.[generatedTimes[j].startStr] || "") === subject) {
                        spanCount++;
                      } else {
                        break;
                      }
                    }
                  }

                  const isDayFocused = editingCell?.day === day;
                  const isActiveBlock = isToday && activeTimeIndex === index;

                  let isSpanActive = false;
                  if (!isContinuation && spanCount > 1) {
                    for (let j = index; j < index + spanCount; j++) {
                      if (isToday && activeTimeIndex === j) isSpanActive = true;
                    }
                  }

                  const showOverlay = !isContinuation && spanCount > 1 && !isDayFocused;
                  const overlayHeightPx = spanCount * TOTAL_HEIGHT - CELL_GAP; // Perfect exact overlay size

                  // If covered by overlay or we are the continuation cell under an overlay, we hide the actual cell contents
                  let cellBgClass = isDark ? customColor.bg : customColor.lightBg;
                  let cellBorderClass = customColor.name === 'default' ? (isDark ? 'border-white/5' : 'border-black/5') : 'border-transparent';
                  let cellTextClass = isDark ? customColor.text : customColor.lightText;

                  if (!isDayFocused && (showOverlay || isContinuation)) {
                    cellBgClass = 'bg-transparent';
                    cellBorderClass = 'border-transparent';
                    cellTextClass = 'text-transparent';
                  } else if (isActiveBlock && !isDayFocused) {
                    cellBgClass = isDark ? customColor.active : customColor.lightActive;
                    cellBorderClass = isDark ? 'border-violet-400/60 shadow-[0_0_10px_rgba(139,92,246,0.3)] z-20' : 'border-violet-500/60 shadow-[0_0_10px_rgba(139,92,246,0.2)] z-20';
                  } else if (isDayFocused) {
                    cellBorderClass = isDark ? 'border-white/10' : 'border-black/10';
                  }

                  const isEditingThisCell = editingCell?.day === day && editingCell?.time === gridKey;

                  return (
                    <div
                      key={index}
                      style={{ height: `${CELL_HEIGHT}px`, marginBottom: `${CELL_GAP}px` }}
                      onDoubleClick={() => !viewingFriend && setEditingCell({ day, time: gridKey })}
                      className={`relative group flex items-center justify-center border transition-all z-10 rounded-[6px] ${cellBorderClass} ${!viewingFriend && !isContinuation && !showOverlay ? (isDark ? 'hover:brightness-125' : 'hover:brightness-95') : ''} ${isEditingThisCell ? `ring-2 ring-violet-500 z-50 shadow-lg ${isDark ? 'bg-black/60' : 'bg-white/80'}` : cellBgClass}`}
                    >
                      {/* The Floating Overlay for Merged Cells */}
                      {showOverlay && (
                        <div
                          style={{ height: `${overlayHeightPx}px` }}
                          className={`absolute top-0 left-0 w-full pointer-events-none flex items-center justify-center z-30 rounded-[6px] border backdrop-blur-sm transition-all duration-200 ${isSpanActive
                            ? (isDark ? 'bg-violet-600/40 border-violet-400/60 shadow-[0_0_12px_rgba(139,92,246,0.3)]' : 'bg-violet-400/30 border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.2)]')
                            : `${isDark ? customColor.bg : customColor.lightBg} border-transparent`
                            }`}
                        >
                          <span className={`px-1 text-center break-words text-[9px] md:text-[10px] font-semibold tracking-wide ${isSpanActive ? (isDark ? 'text-white scale-105 drop-shadow-md' : 'text-violet-900 scale-105') : (isDark ? customColor.text : customColor.lightText)}`}>
                            {subject || "Free"}
                          </span>
                        </div>
                      )}

                      {/* Actual Cell Content (Hidden if under overlay, visible if single or editing) */}
                      <div className={`w-full h-full flex items-center justify-center overflow-hidden break-words px-0.5 cursor-pointer select-none ${isEditingThisCell ? 'opacity-30' : ''}`}>
                        <span className={`w-full text-center ${cellTextClass} text-[9px] md:text-[10px] font-medium leading-tight tracking-wide`}>
                          {subject || ((showOverlay || isContinuation) && !isDayFocused ? "" : "Free")}
                        </span>
                      </div>

                      {/* Edit Icon for single cells */}
                      {!viewingFriend && !isEditingThisCell && !showOverlay && !isContinuation && (
                        <Edit2 size={8} className={`absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 pointer-events-none ${cellTextClass} z-20 transition-opacity`} />
                      )}

                      {/* Active indicator dot */}
                      {isActiveBlock && !isEditingThisCell && (
                        <div className="absolute top-1 right-1 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_6px_rgba(139,92,246,1)] z-40" />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Centered Cell Editor Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setEditingCell(null)}>
          <div className={`border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-4 w-full max-w-[260px] flex flex-col gap-3 relative animate-in zoom-in-95 duration-200 ${isDark ? 'bg-gray-900/95 backdrop-blur-xl border-white/10' : 'bg-white/95 backdrop-blur-xl border-black/10'}`} onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingCell(null)} className={`absolute top-2.5 right-2.5 p-1 transition-all rounded-full active:scale-95 ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-800 hover:bg-black/5'}`}><X size={14} /></button>

            <div className="text-center mt-1">
              <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-100' : 'text-slate-800'}`}>{editingCell.day} <span className={isDark ? 'text-white/30 mx-1' : 'text-black/20 mx-1'}>•</span> <span className={isDark ? 'text-violet-300' : 'text-violet-600'}>{editingCell.time}</span></h3>
              <p className={`text-[9px] mt-0.5 uppercase font-semibold tracking-wide ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Edit Subject & Color</p>
            </div>

            <textarea
              value={timetableGrid?.[editingCell.day]?.[editingCell.time] || ""}
              onChange={(e) => updateTimetableCell(editingCell.day, editingCell.time, e.target.value)}
              autoFocus
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setEditingCell(null);
                }
              }}
              rows={2}
              placeholder="e.g. Math, Free, Break..."
              spellCheck={false}
              className={`w-full text-center rounded-xl outline-none text-xs leading-snug resize-none overflow-hidden break-words p-2.5 transition-all shadow-inner ${isDark ? 'bg-black/30 border border-white/10 text-white focus:bg-black/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-white/20' : 'bg-slate-100 border border-black/10 text-slate-900 focus:bg-white focus:border-violet-400 focus:ring-1 focus:ring-violet-400 placeholder:text-slate-400'}`}
            />

            <div className={`flex flex-wrap gap-1.5 rounded-lg justify-center mx-auto p-1.5 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-100 border border-black/5'}`}>
              {CELL_COLORS.map(c => {
                const isActive = (timetableColors?.[editingCell.day]?.[editingCell.time] || 'default') === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => updateTimetableColor(editingCell.day, editingCell.time, c.name)}
                    title={c.name}
                    className={`w-6 h-6 rounded-full ${isDark ? c.solidBg : c.lightSolidBg} ${isActive ? `ring-2 ring-white ring-offset-1 scale-110 shadow-lg ${isDark ? 'ring-offset-[#111827]' : 'ring-offset-[#ffffff]'}` : 'opacity-80 hover:scale-110 hover:opacity-100'} transition-all duration-200 flex items-center justify-center shrink-0`}
                  >
                    {isActive && <Check size={12} className="text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>

            <button onClick={() => setEditingCell(null)} className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95">
              Save Changes
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}

// -------------------------------------------------------------
// Component for editing Start Time (Modal Overlay)
// -------------------------------------------------------------
function StartTimeEditor({ currentMins, isDark, onSave, onCancel }: { currentMins: number, isDark: boolean, onSave: (mins: number) => void, onCancel: () => void }) {
  const initialH = Math.floor(currentMins / 60) % 24;
  const initialM = currentMins % 60;

  const [timeValue, setTimeValue] = useState(
    `${initialH.toString().padStart(2, '0')}:${initialM.toString().padStart(2, '0')}`
  );

  const save = () => {
    if (!timeValue) {
      onCancel();
      return;
    }
    const [hStr, mStr] = timeValue.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    onSave(h * 60 + m);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`backdrop-blur-xl border rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] p-5 flex flex-col items-center gap-4 w-full max-w-[220px] animate-in zoom-in-95 duration-200 ${isDark ? 'bg-gray-900/95 border-white/10' : 'bg-white/95 border-black/10'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-full mb-0.5">
            <Clock size={16} />
          </div>
          <h3 className={`font-bold text-xs tracking-wide ${isDark ? 'text-gray-100' : 'text-slate-800'}`}>Set Day Start Time</h3>
        </div>

        <input
          type="time"
          value={timeValue}
          onChange={e => setTimeValue(e.target.value)}
          className={`w-full rounded-xl px-3 py-2 text-lg font-medium tracking-wider text-center outline-none transition-all cursor-pointer shadow-inner ${isDark ? 'bg-black/30 border border-white/10 text-white focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 [color-scheme:dark]' : 'bg-slate-100 border border-black/10 text-slate-900 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 [color-scheme:light]'}`}
        />

        <div className="flex w-full gap-2 mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-black/5 hover:bg-black/10 text-slate-600 hover:text-slate-900'}`}
          >
            Cancel
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); save(); }}
            className="flex-1 py-2 bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-bold rounded-lg shadow-[0_0_10px_rgba(14,165,233,0.3)] transition-all active:scale-95"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component for editing Duration
// -------------------------------------------------------------
function DurationCell({
  block,
  index,
  isDark,
  onUpdate,
  isActive,
  isRange,
  isEditingOverride,
  setEditingOverride,
  isReadOnly
}: {
  block: { startStr: string, endStr: string, duration: number },
  index: number,
  isDark: boolean,
  onUpdate: (dur: number) => void,
  isActive?: boolean,
  isRange: boolean,
  isEditingOverride: boolean,
  setEditingOverride: (s: boolean) => void,
  isReadOnly?: boolean
}) {
  const [durStr, setDurStr] = useState(block.duration.toString());

  useEffect(() => {
    if (isEditingOverride) {
      setDurStr(block.duration.toString());
    }
  }, [isEditingOverride, block.duration]);

  const save = () => {
    const d = parseInt(durStr);
    if (!isNaN(d) && d > 0 && d <= 1440) {
      onUpdate(d);
    }
    setEditingOverride(false);
  };

  const adjust = (delta: number) => {
    let d = parseInt(durStr) || 60;
    d += delta;
    if (d < 15) d = 15; // Minimum 15 min block
    setDurStr(d.toString());
  };

  return (
    <div className={`relative group w-full h-full flex items-center justify-center rounded-[6px] border transition-all duration-300 ${isActive ? (isDark ? 'bg-violet-600/20 border-violet-500/50 shadow-[inset_0_0_10px_rgba(139,92,246,0.15)] z-20' : 'bg-violet-200 border-violet-400 z-20') : (isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/5' : 'bg-slate-200/50 border-black/5 hover:border-black/10 hover:bg-slate-200')}`}>
      {isEditingOverride ? (
        <div className={`absolute inset-0 z-[60] backdrop-blur-md border rounded-[6px] shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex items-center justify-center px-0.5 scale-[1.15] animate-in zoom-in-95 duration-150 ${isDark ? 'bg-gray-900/95 border-violet-500/50' : 'bg-white/95 border-violet-400'}`}>
          <div className={`flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <div className="flex flex-col items-center">
              <button onClick={() => adjust(15)} className="hover:text-violet-500 p-px transition-colors"><ChevronUp size={10} /></button>
              <div className={`flex items-baseline px-1 rounded border ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-black/10'}`}>
                <input
                  value={durStr}
                  onChange={e => setDurStr(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && save()}
                  className="w-5 text-center bg-transparent outline-none text-[10px] font-bold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className={`text-[7px] -ml-0.5 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>m</span>
              </div>
              <button onClick={() => adjust(-15)} className="hover:text-violet-500 p-px transition-colors"><ChevronDown size={10} /></button>
            </div>
            <button onClick={save} className="p-1 bg-violet-600 hover:bg-violet-500 text-white rounded transition-all active:scale-90 shadow-sm"><Check size={10} /></button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditingOverride(true)}
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors leading-none"
        >
          <div className={`absolute top-1 flex flex-col md:flex-row items-center justify-center gap-[1px] md:gap-0.5 text-[8px] md:text-[12px] tracking-tight font-semibold font-mono select-none w-full px-0.5 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            <span className="transition-colors group-hover:text-violet-400">
              {block.startStr.replace(" AM", "AM").replace(" PM", "PM")}
            </span>
            <span className={`hidden md:inline ${isDark ? 'text-white/20' : 'text-slate-400'}`}>-</span>
            <span className={`transition-colors group-hover:text-violet-400 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              {block.endStr.replace(" AM", "AM").replace(" PM", "PM")}
            </span>
          </div>

          <span className={`absolute bottom-[2px] text-[8px] md:text-[10px] font-bold uppercase tracking-wider group-hover:text-violet-500 transition-colors ${isDark ? 'text-violet-300/60' : 'text-violet-600/70'}`}>
            {block.duration > 60 ? Math.floor(block.duration / 60) + "hr " + block.duration % 60 + "m" : block.duration + "m"}
          </span>
        </div>
      )}
    </div>
  );
}