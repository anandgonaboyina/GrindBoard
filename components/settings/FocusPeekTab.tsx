'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Info, EyeOff, Image as ImageIcon, Upload, LinkIcon, X } from 'lucide-react';
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

  // Optimized: Memoize the list of widgets so it doesn't rebuild on every render
  const focusWidgetsList = useMemo(() => [
    { key: 'quote', label: 'Daily Quote' },
    { key: 'stats', label: 'Stats Modal' },
    { key: 'plans', label: 'Roadmap & Plans' },
    { key: 'countdowns', label: 'Countdowns' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'notes', label: 'Quick Notes' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'timetable', label: 'Timetable' },
    { key: 'timer', label: 'Session Timer' },
    { key: 'dock', label: 'Bottom Dock' },
    { key: 'clock', label: 'Big Clock' },
    { key: 'todayFocusPill', label: 'Focus Pill' },
    { key: 'timerPill', label: 'Timer Pill' },
    { key: 'deadlineAlerts', label: 'Deadline Alerts' },
    { key: 'bgSwitcher', label: 'Bg Switcher' },
    { key: 'stopwatch', label: 'Stopwatch' },
    { key: 'settingsBtn', label: 'Settings Btn' },
    { key: 'manifestation', label: 'Manifestation Board' }
  ], []);

  const allWallpapers = useMemo(() => {
    return Array.from(new Set([...(customDesktopWallpapers || []), ...(customMobileWallpapers || [])]));
  }, [customDesktopWallpapers, customMobileWallpapers]);

  return (
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
            <strong className="text-blue-400">Mobile Triggers:</strong> Tap the <strong className="text-white">Eye Icon</strong> on the right edge of your screen! & to get out tap on the <strong className="text-white">Lock Icon</strong> button at bottom for mobile / again shortcut for pc
          </p>
        </div>
          <div className="p-2 md:p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-[9px] md:text-[10px] text-red-200/90 leading-relaxed break-words">
            <strong className="text-blue-400">Alt + f4</strong> shortcut to shutdown <strong className="text-white">not works</strong>  due to lively wallpaper shortcut keys you have to manually do <pre> <strong className="text-white">Tip :  once click on windows button and do alt+f4 it works</strong></pre>
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
                <p className="text-[8px] text-white/40 italic break-words">Click & press combination of keys</p>
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
                <p className="text-[8px] text-white/40 italic break-words">Click & press combination of keys</p>
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
              <LinkIcon className="w-3.5 h-3.5" /> Add URL
            </button>
          </div>

          {/* Quick Select from Gallery */}
          {allWallpapers.length > 0 && (
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
          )}
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
          {focusWidgetsList.map(({ key, label }) => {
            const isHidden = focusPlatform === 'desktop' ? hideConfig[key as keyof typeof hideConfig] : mobileHideConfig[key as keyof typeof mobileHideConfig];
            return (
              <div key={key} className="flex items-center justify-between p-2 md:p-2.5 rounded-lg bg-black/40 border border-white/5 hover:bg-white/5 transition-colors shadow-inner">
                <span className="text-[9px] md:text-[10px] font-bold text-white/80 break-words leading-tight pr-1.5 flex-1">{label}</span>
                <button
                  onClick={() => focusPlatform === 'desktop' ? setHideConfig(key as keyof typeof hideConfig, !isHidden) : setMobileHideConfig(key as keyof typeof mobileHideConfig, !isHidden)}
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
  );
});