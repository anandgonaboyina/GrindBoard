'use client';

import React from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { MonitorPlay, Monitor, Smartphone, Trash2, Plus, LinkIcon, X } from 'lucide-react';
import { saveWallpaperToDB, deleteWallpaperFromDB } from '@/lib/indexedDB';
import { CustomWallpaperPreview } from '../CustomWallpaperPreview';

interface WallpaperTabProps {
  setConfirmModal: (modal: any) => void;
  showAlertModal: (title: string, message: React.ReactNode, onConfirm?: () => void) => void;
  setIsWallpaperTutorialOpen: (isOpen: boolean) => void;
}

export default React.memo(function WallpaperTab({ setConfirmModal, showAlertModal, setIsWallpaperTutorialOpen }: WallpaperTabProps) {
  const {
    customDesktopWallpapers, setCustomDesktopWallpapers,
    activeDesktopCustomIndex, setActiveDesktopCustomIndex,
    customMobileWallpapers, setCustomMobileWallpapers,
    activeMobileCustomIndex, setActiveMobileCustomIndex
  } = useDashboardStore();

  return (
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
  );
});