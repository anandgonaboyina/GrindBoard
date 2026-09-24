'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { 
  Info, EyeOff, Image as ImageIcon, Upload, LinkIcon, X, Eye, 
  Monitor, Smartphone, AlertTriangle, Quote, BarChart2, Map, 
  Hourglass, CheckSquare, StickyNote, Calendar, Table, Timer, 
  PanelBottom, Clock, Target, PlayCircle, BellRing, 
  TimerReset, Settings, Sparkles 
} from 'lucide-react';
import { saveWallpaperToDB, deleteWallpaperFromDB } from '@/lib/indexedDB';
import { CustomWallpaperPreview } from '../CustomWallpaperPreview';

interface FocusPeekTabProps {
  setInfoModalKey: (key: string) => void;
  showAlertModal: (title: string, message: React.ReactNode, onConfirm?: () => void) => void;
  setConfirmModal: (modal: any) => void;
}

export default React.memo(function FocusPeekTab({ setInfoModalKey, showAlertModal, setConfirmModal }: FocusPeekTabProps) {
  const [focusPlatform, setFocusPlatform] = useState<'desktop' | 'mobile'>('desktop');

  const {
    panicShortcutKey, setPanicShortcutKey,
    focusShortcutKey, setFocusShortcutKey,
    togglePanicHide, toggleHide,
    panicWallpaperSwitch, setPanicWallpaperSwitch,
    peekModeWallpaper, setPeekModeWallpaper,
    customDesktopWallpapers, customMobileWallpapers,
    hideConfig, setHideConfig, setHideAll,
    mobileHideConfig, setMobileHideConfig, setMobileHideAll
  } = useDashboardStore();

  const handleShortcutCapture = useCallback((e: React.KeyboardEvent<HTMLInputElement>, setter: (val: string) => void) => {
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
  }, []);

  const formatShortcutText = useCallback((shortcut: string) => {
    if (!shortcut) return '';
    let val = shortcut;
    if (!val.includes('+') && val.length === 1) val = 'ctrl+' + val;
    return val.toUpperCase().replace(/\+/g, ' + ');
  }, []);

  const focusWidgetsList = useMemo(() => [
    { key: 'quote', label: 'Daily Quote', icon: Quote },
    { key: 'stats', label: 'Stats Modal', icon: BarChart2 },
    { key: 'plans', label: 'Roadmap & Plans', icon: Map },
    { key: 'countdowns', label: 'Countdowns', icon: Hourglass },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare },
    { key: 'notes', label: 'Quick Notes', icon: StickyNote },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'timetable', label: 'Timetable', icon: Table },
    { key: 'timer', label: 'Session Timer', icon: Timer },
    { key: 'dock', label: 'Bottom Dock', icon: PanelBottom },
    { key: 'clock', label: 'Big Clock', icon: Clock },
    { key: 'todayFocusPill', label: 'Focus Pill', icon: Target },
    { key: 'timerPill', label: 'Timer Pill', icon: PlayCircle },
    { key: 'deadlineAlerts', label: 'Deadline Alerts', icon: BellRing },
    { key: 'bgSwitcher', label: 'Bg Switcher', icon: ImageIcon },
    { key: 'stopwatch', label: 'Stopwatch', icon: TimerReset },
    { key: 'settingsBtn', label: 'Settings Btn', icon: Settings },
    { key: 'manifestation', label: 'Manifestation Board', icon: Sparkles }
  ], []);

  const allWallpapers = useMemo(() => {
    return Array.from(new Set([...(customDesktopWallpapers || []), ...(customMobileWallpapers || [])]));
  }, [customDesktopWallpapers, customMobileWallpapers]);

  return (
    <div className="flex flex-col gap-3 md:gap-4 h-full pb-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-bold text-white tracking-tight">Focus & Peek Mode</h3>
          <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Configure visibility shortcuts and custom peek backgrounds.</p>
        </div>
        <button onClick={() => setInfoModalKey('panic')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all hover:scale-105 shrink-0 shadow-sm">
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info Banners */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 shadow-inner">
        <div className="flex gap-2 items-start">
          <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[9px] md:text-[10px] text-blue-200/90 leading-relaxed break-words">
            <strong className="text-blue-300">Mobile Triggers:</strong> Tap the <strong className="text-white font-bold">Eye Icon</strong> on the right edge of your screen! To exit, tap the <strong className="text-white font-bold">Lock Icon</strong> at the bottom (or use the PC shortcut again).
          </p>
        </div>
        <div className="w-full h-px bg-blue-500/20 my-0.5" />
        <div className="flex gap-2 items-start">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-[9px] md:text-[10px] text-orange-200/90 leading-relaxed break-words">
            <strong className="text-orange-300">Desktop Warning:</strong> <strong>Alt + F4</strong> to shutdown <strong>does not work</strong> directly due to lively wallpaper shortcuts. <br />
            <span className="text-white/70 italic mt-0.5 inline-block">Tip: Click the Windows button first, then press Alt + F4.</span>
          </p>
        </div>
      </div>

      {/* SECTION 1: VISIBILITY SHORTCUTS & PEEK MODE */}
      <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.02] border border-white/10 shadow-sm">
        <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/80 flex items-center gap-1.5 pb-1.5 border-b border-white/5 break-words">
          <EyeOff className="w-3.5 h-3.5 text-red-400" /> Visibility Shortcuts
        </h4>

        <div className="flex flex-col gap-1.5 mt-0.5">
          {/* Peek Mode Trigger */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3 hover:border-white/10 transition-colors">
            <div className="flex flex-col min-w-0">
              <p className="text-[11px] md:text-xs font-bold text-red-400 break-words">Peek Mode Trigger</p>
              <p className="text-[9px] md:text-[10px] text-white/50 mt-0.5 leading-snug break-words">Hide all widgets instantly with this keyboard shortcut.</p>
            </div>
            <div className="flex items-start gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto mt-1 sm:mt-0">
              <div className="flex flex-col items-center gap-1 flex-1 sm:flex-none">
                <input
                  type="text"
                  value={formatShortcutText(panicShortcutKey)}
                  onKeyDown={(e) => handleShortcutCapture(e, setPanicShortcutKey)}
                  readOnly
                  placeholder="Press Keys..."
                  className="w-full sm:w-28 h-7 md:h-8 px-2 bg-black/60 border border-white/10 rounded-md text-center text-white/90 outline-none focus:border-red-400/50 font-bold uppercase text-[9px] md:text-[10px] shadow-inner cursor-pointer hover:bg-black/80 transition-colors"
                />
                <p className="text-[8px] md:text-[9px] text-white/40 italic break-words text-center leading-tight">
                  Click box & press keys<br className="sm:hidden" /> (e.g. Ctrl + Shift + H)
                </p>
              </div>
              <button
                onClick={() => togglePanicHide()}
                className="h-7 md:h-8 px-3 md:px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md border border-red-500/30 text-[9px] md:text-[10px] font-bold uppercase transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                Trigger
              </button>
            </div>
          </div>

          {/* Focus Mode Trigger */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3 hover:border-white/10 transition-colors">
            <div className="flex flex-col min-w-0">
              <p className="text-[11px] md:text-xs font-bold text-blue-400 break-words">Focus Mode Trigger</p>
              <p className="text-[9px] md:text-[10px] text-white/50 mt-0.5 leading-snug break-words">Hide selected widgets below with this keyboard shortcut.</p>
            </div>
            <div className="flex items-start gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto mt-1 sm:mt-0">
              <div className="flex flex-col items-center gap-1 flex-1 sm:flex-none">
                <input
                  type="text"
                  value={formatShortcutText(focusShortcutKey)}
                  onKeyDown={(e) => handleShortcutCapture(e, setFocusShortcutKey)}
                  readOnly
                  placeholder="Press Keys..."
                  className="w-full sm:w-28 h-7 md:h-8 px-2 bg-black/60 border border-white/10 rounded-md text-center text-white/90 outline-none focus:border-blue-400/50 font-bold uppercase text-[9px] md:text-[10px] shadow-inner cursor-pointer hover:bg-black/80 transition-colors"
                />
                <p className="text-[8px] md:text-[9px] text-white/40 italic break-words text-center leading-tight">
                  Click box & press keys<br className="sm:hidden" /> (e.g. Alt + F)
                </p>
              </div>
              <button
                onClick={() => toggleHide()}
                className="h-7 md:h-8 px-3 md:px-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-md border border-blue-500/30 text-[9px] md:text-[10px] font-bold uppercase transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                Trigger
              </button>
            </div>
          </div>
        </div>

        {/* Peek Wallpaper Toggle */}
        <div className="flex flex-row items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3 mt-1 hover:border-white/10 transition-colors cursor-pointer" onClick={() => setPanicWallpaperSwitch(!panicWallpaperSwitch)}>
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <ImageIcon className="text-red-400 w-4 h-4 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] md:text-[11px] font-bold text-white/90 break-words">Switch Wallpaper on Peek</span>
              <span className="text-[9px] text-white/50 leading-snug break-words">Change background image when Peek Mode is active.</span>
            </div>
          </div>
          <button className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors shrink-0 outline-none ${panicWallpaperSwitch ? 'bg-red-500' : 'bg-white/10'}`}>
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${panicWallpaperSwitch ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Custom Peek Mode Background Setting */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10 mt-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <ImageIcon className="text-white/80 w-4 h-4 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] md:text-[11px] font-bold text-white/90 break-words">Peek Mode Background</span>
                <p className="text-[9px] text-white/50 leading-snug break-words">Custom image/video for Peek Mode on this device.</p>
              </div>
            </div>
            {peekModeWallpaper && (
              <button
                type="button"
                onClick={() => setPeekModeWallpaper(null)}
                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-[9px] font-bold border border-red-500/20 transition-all hover:scale-105 shrink-0 self-start sm:self-auto"
              >
                Clear Selection
              </button>
            )}
          </div>

          {peekModeWallpaper && (
            <div className="w-full max-w-[200px] mt-1.5 rounded-lg overflow-hidden border border-white/10 shadow-lg">
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
          <div className="flex gap-2 w-full mt-1.5">
            <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 border-dashed rounded-lg text-[9px] md:text-[10px] text-blue-300 cursor-pointer transition-all hover:scale-[1.02] font-semibold shadow-sm">
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
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] md:text-[10px] text-white/80 hover:text-white transition-all hover:scale-[1.02] cursor-pointer font-semibold shadow-sm"
            >
              <LinkIcon className="w-3.5 h-3.5" /> Add URL
            </button>
          </div>

          {/* Quick Select from Gallery */}
          {allWallpapers.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/10">
              <span className="text-[9px] text-white/50 font-bold tracking-widest uppercase break-words">Quick Select</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {allWallpapers.map((url, idx) => (
                  <button
                    key={`peek-pick-${idx}`} type="button" onClick={() => setPeekModeWallpaper(url)}
                    className={`px-2.5 py-1.5 rounded-md text-[9px] font-mono border transition-all truncate max-w-[140px] shadow-sm ${peekModeWallpaper === url ? 'bg-blue-500/20 text-blue-200 border-blue-500/40 font-bold' : 'bg-black/40 text-white/60 border-white/10 hover:text-white hover:bg-white/10'}`}
                  >
                    {url.startsWith('custom-') ? `Local Media #${idx + 1}` : (url.split('/').pop() || `URL #${idx + 1}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: FOCUS SPECIFIC SETUP */}
      <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.02] border border-white/10 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-white/5">
          <div className="flex flex-col min-w-0">
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/80 flex items-center gap-1.5 break-words">
              <Eye className="w-3.5 h-3.5 text-blue-400" /> Focus Specific Setup
            </h4>
            <p className="text-[9px] md:text-[10px] text-white/50 leading-snug mt-1 break-words">
              Select which widgets to <strong className="text-white/80">Show</strong> when Focus Mode is activated.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 w-full lg:w-auto">
            {/* Platform Tabs */}
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 w-full sm:w-auto shadow-inner">
              <button 
                onClick={() => setFocusPlatform('desktop')} 
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-[9px] md:text-[10px] font-bold rounded-md transition-all ${focusPlatform === 'desktop' ? 'bg-blue-500/20 text-blue-300 shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
              >
                <Monitor className="w-3 h-3" /> Desktop
              </button>
              <button 
                onClick={() => setFocusPlatform('mobile')} 
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-[9px] md:text-[10px] font-bold rounded-md transition-all ${focusPlatform === 'mobile' ? 'bg-orange-500/20 text-orange-300 shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
              >
                <Smartphone className="w-3 h-3" /> Mobile
              </button>
            </div>
            
            {/* Show/Hide All Buttons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button onClick={() => focusPlatform === 'desktop' ? setHideAll(false) : setMobileHideAll(false)} className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/20 text-[9px] md:text-[10px] font-bold transition-all hover:scale-105 active:scale-95 shadow-sm">
                Show All
              </button>
              <button onClick={() => focusPlatform === 'desktop' ? setHideAll(true) : setMobileHideAll(true)} className="flex-1 sm:flex-none px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg border border-white/10 text-[9px] md:text-[10px] font-bold transition-all hover:scale-105 active:scale-95 shadow-sm">
                Hide All
              </button>
            </div>
          </div>
        </div>

        {/* Toggles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5 md:gap-2 mt-1.5">
          {focusWidgetsList.map(({ key, label, icon: Icon }) => {
            const isHidden = focusPlatform === 'desktop' ? hideConfig[key as keyof typeof hideConfig] : mobileHideConfig[key as keyof typeof mobileHideConfig];
            const isShowing = !isHidden; // UI is inverted: Active means SHOWING.

            return (
              <div 
                key={key} 
                onClick={() => focusPlatform === 'desktop' ? setHideConfig(key as keyof typeof hideConfig, !isHidden) : setMobileHideConfig(key as keyof typeof mobileHideConfig, !isHidden)}
                className={`group flex items-center justify-between p-2 md:p-2.5 rounded-lg border cursor-pointer transition-all duration-200 shadow-sm ${isShowing ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20' : 'bg-black/40 border-white/5 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                  <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isShowing ? 'text-blue-400' : 'text-white/30 group-hover:text-white/50'}`} />
                  <span className={`text-[9px] md:text-[10px] font-bold break-words leading-tight transition-colors ${isShowing ? 'text-blue-100' : 'text-white/40 group-hover:text-white/60'}`}>
                    {label}
                  </span>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors shrink-0 outline-none ${isShowing ? 'bg-blue-500' : 'bg-white/10 group-hover:bg-white/20'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${isShowing ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});