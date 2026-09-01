'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { saveWallpaperToDB, deleteWallpaperFromDB } from '@/lib/indexedDB';
import { CustomWallpaperPreview } from './CustomWallpaperPreview';
import { Sparkles, Flame, Trash2, Upload, Plus, X } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import ScrollableWithArrows from './ScrollableWithArrows';

interface ManifestationSettingsModalProps {
  onClose: () => void;
}

export default function ManifestationSettingsModal({ onClose }: ManifestationSettingsModalProps) {
  const {
    showManifestationBoard, setShowManifestationBoard,
    manifestationCustomQuotes, setManifestationCustomQuotes,
    addManifestationCustomQuote, deleteManifestationCustomQuote,
    manifestationDesktopPhotos, setManifestationDesktopPhotos,
    activeManifestationDesktopIndex, setActiveManifestationDesktopIndex,
    manifestationMobilePhotos, setManifestationMobilePhotos,
    activeManifestationMobileIndex, setActiveManifestationMobileIndex
  } = useDashboardStore();

  const [newManifestationQuoteText, setNewManifestationQuoteText] = useState('');
  const [showBulkAddManifestation, setShowBulkAddManifestation] = useState(false);
  const [bulkManifestationInput, setBulkManifestationInput] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    isPrompt?: boolean;
    promptPlaceholder?: string;
    isDestructive?: boolean;
    onConfirm: (val?: string) => void;
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
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
    });
  };

  const handleAddManifestationQuote = () => {
    if (!newManifestationQuoteText.trim()) return;
    if ((manifestationCustomQuotes?.length || 0) >= 30) {
      showAlertModal('Limit Reached', 'You can only add up to 30 custom quotes.');
      return;
    }
    addManifestationCustomQuote(newManifestationQuoteText.trim());
    setNewManifestationQuoteText('');
  };

  const handleBulkAddManifestationQuotes = () => {
    if (!bulkManifestationInput.trim()) return;
    try {
      let quotesToAdd: string[] = [];
      const trimmed = bulkManifestationInput.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        quotesToAdd = JSON.parse(trimmed);
        if (!Array.isArray(quotesToAdd)) throw new Error('Not an array');
        quotesToAdd = quotesToAdd.filter(q => typeof q === 'string').map(q => q.trim()).filter(q => q.length > 0);
      } else {
        quotesToAdd = trimmed.split('\n').map(q => q.trim()).filter(q => q.length > 0);
      }

      if (quotesToAdd.length === 0) {
        showAlertModal('Error', 'No valid quotes found.');
        return;
      }
      const newQuotes = [...(manifestationCustomQuotes || []), ...quotesToAdd].slice(0, 30);
      setManifestationCustomQuotes(newQuotes);
      setBulkManifestationInput('');
      setShowBulkAddManifestation(false);
      showAlertModal('Success', `Imported quotes. Total quotes: ${newQuotes.length}/30`);
    } catch (err) {
      showAlertModal('Invalid Format', 'Could not parse quotes. Make sure it is a valid JSON array or one quote per line.');
    }
  };

  // Reusable quotes list content to keep JSX DRY between Mobile and Desktop views
  const quotesListContent = manifestationCustomQuotes?.map((q, idx) => (
    <div key={`m-quote-${idx}`} className="flex justify-between items-center p-2 sm:p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg gap-2">
      <span className="text-xs sm:text-xs text-amber-100 font-medium truncate">&quot;{q}&quot;</span>
      <button
        onClick={() => deleteManifestationCustomQuote(idx)}
        className="p-1.5 text-amber-300/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  ));

  // Dynamic layout renderer allowing us to perfectly split mobile vs desktop UI rules
  const renderContent = (isMobile: boolean) => (
    <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-6'}`}>

      {/* 1. Dashboard Launcher Visibility Toggle */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-amber-500/20 shadow-[0_4px_20px_-10px_rgba(245,158,11,0.1)]">
        <div className="flex items-center gap-2.5 md:gap-4">
          <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[13px] sm:text-sm text-amber-200">Show Manifestation Button</span>
            <span className="text-[10px] md:text-xs text-white/50 mt-0.5">Toggle visibility on the dashboard</span>
          </div>
        </div>
        <button
          onClick={() => setShowManifestationBoard(!showManifestationBoard)}
          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors shrink-0 ${showManifestationBoard ? 'bg-amber-500' : 'bg-white/20'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showManifestationBoard ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* 2. Custom Manifestation Quotes Options */}
      <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl bg-white/5 border border-white/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30">
              <Flame className="w-4 h-4 md:w-5 md:h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-[13px] sm:text-sm text-amber-300">Custom Manifestation Quotes</h4>
              <p className="text-[10px] md:text-xs text-white/50">Add custom quotes (max 30, max 50 chars).</p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 mt-0.5 sm:mt-0">
            <button
              onClick={() => setShowBulkAddManifestation(!showBulkAddManifestation)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline transition-colors cursor-pointer"
            >
              {showBulkAddManifestation ? 'Hide Bulk' : 'Bulk Add Quotes'}
            </button>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-300 bg-black/40 px-2 py-1 sm:px-2.5 sm:py-1 rounded border border-amber-500/30">
              {(manifestationCustomQuotes || []).length} / 30
            </span>
          </div>
        </div>

        {showBulkAddManifestation && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 flex flex-col gap-2.5 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-300">Bulk Add Quotes</span>
              <span className="text-[10px] text-white/50">JSON array or 1 per line</span>
            </div>
            <textarea
              rows={isMobile ? 3 : 4}
              value={bulkManifestationInput}
              onChange={(e) => setBulkManifestationInput(e.target.value)}
              placeholder={'["Believe in yourself", "Focus creates reality"]\nOR one quote per line...'}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-amber-100 placeholder-white/30 font-mono outline-none focus:border-amber-400/60 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkAddManifestation(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-bold rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAddManifestationQuotes}
                className="px-3 py-1.5 sm:px-4 bg-amber-500 hover:bg-amber-400 text-black text-[11px] sm:text-xs font-bold rounded-md transition-colors"
              >
                Import Quotes
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add new custom manifestation quote..."
            value={newManifestationQuoteText}
            maxLength={50}
            onChange={(e) => setNewManifestationQuoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddManifestationQuote();
              }
            }}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-amber-400/60 placeholder:text-white/40 text-amber-100 font-medium"
          />
          <button
            onClick={handleAddManifestationQuote}
            className="bg-amber-500/80 hover:bg-amber-500 text-black px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer"
          >
            Add
          </button>
        </div>

        {/* Rendering Quotes List appropriately based on viewport */}
        <div className="flex flex-col gap-2 w-full">
          {(!manifestationCustomQuotes || manifestationCustomQuotes.length === 0) ? (
            <div className="text-center py-4 text-xs text-white/40 italic bg-black/20 rounded-lg border border-white/5">
              No custom quotes added. Default quotes will be used.
            </div>
          ) : (
            isMobile ? (
              // Mobile Native Smooth Scrolling
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1 w-full">
                {quotesListContent}
              </div>
            ) : (
              // Desktop Custom Arrow Scrolling
              <div className="h-[200px] overflow-hidden w-full">
                <ScrollableWithArrows className="h-full space-y-2 pr-2">
                  {quotesListContent}
                </ScrollableWithArrows>
              </div>
            )
          )}
        </div>
      </div>

      {/* 3. Vision Board Media (Photos & Videos) */}
      <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl bg-white/5 border border-white/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]">
        <h4 className="font-bold text-[13px] sm:text-base text-amber-300 flex items-center gap-2">
          <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> Vision Board Media
        </h4>
        <p className="text-[10px] md:text-xs text-amber-200/80 bg-amber-500/10 p-2 sm:p-3 rounded-lg border border-amber-500/20 leading-relaxed">
          💡 <strong>Pro Tip:</strong> Local file uploads stay saved in your current browser. For seamless auto-sync across all devices, use <strong>Direct URLs</strong>!
        </p>

        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-5 mt-1">

          {/* Desktop Vision Media */}
          <div className="bg-black/30 border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h5 className="font-semibold text-[11px] sm:text-sm text-amber-300">Desktop Format ({manifestationDesktopPhotos.length}/6)</h5>
              {manifestationDesktopPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Delete All Desktop Vision Media',
                      message: 'Are you sure you want to delete all desktop manifestation media?',
                      isDestructive: true,
                      onConfirm: async () => {
                        for (const url of manifestationDesktopPhotos) {
                          if (url.startsWith('custom-')) await deleteWallpaperFromDB(url).catch(() => { });
                        }
                        setManifestationDesktopPhotos([]);
                        setActiveManifestationDesktopIndex(null);
                      }
                    });
                  }}
                  className="flex items-center gap-1.5 text-[10px] md:text-xs px-2 py-1 sm:px-2.5 sm:py-1 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-100 transition-colors border border-red-500/30 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Delete All</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {manifestationDesktopPhotos.map((url, i) => (
                <CustomWallpaperPreview
                  key={`desktop-manif-${i}`}
                  url={url}
                  isActive={activeManifestationDesktopIndex === i}
                  onClick={() => setActiveManifestationDesktopIndex(i)}
                  onShowAlert={showAlertModal}
                  onDelete={async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setConfirmModal({
                      isOpen: true,
                      title: 'Remove Media',
                      message: 'Are you sure you want to remove this manifestation media item?',
                      isDestructive: true,
                      onConfirm: async () => {
                        const newUrls = [...manifestationDesktopPhotos];
                        newUrls.splice(i, 1);
                        setManifestationDesktopPhotos(newUrls);
                        if (activeManifestationDesktopIndex === i) setActiveManifestationDesktopIndex(null);
                        else if (activeManifestationDesktopIndex !== null && activeManifestationDesktopIndex > i) setActiveManifestationDesktopIndex(activeManifestationDesktopIndex - 1);
                        if (url.startsWith('custom-')) await deleteWallpaperFromDB(url);
                      }
                    });
                  }}
                  label={url.startsWith('custom-') ? 'Local File' : (url.split('/').pop() || 'media')}
                  aspectClass="aspect-video"
                />
              ))}
            </div>

            {manifestationDesktopPhotos.length < 6 && (
              <div className="flex gap-2 w-full mt-1">
                <label className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 sm:px-3 sm:py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 border-dashed rounded-lg text-[11px] sm:text-xs font-semibold text-amber-200 cursor-pointer transition-colors">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Upload
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 50 * 1024 * 1024) {
                        showAlertModal('File Too Large', 'Maximum allowed file size is 50MB.');
                        return;
                      }
                      const id = `custom-manifest-desktop-${Date.now()}`;
                      await saveWallpaperToDB(id, file);
                      setManifestationDesktopPhotos([...manifestationDesktopPhotos, id]);
                      if (activeManifestationDesktopIndex === null) setActiveManifestationDesktopIndex(manifestationDesktopPhotos.length);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Add Media URL',
                      message: 'Enter direct image or video URL (https://...):',
                      isPrompt: true,
                      promptPlaceholder: 'https://...',
                      onConfirm: (url?: string) => {
                        if (url && url.trim().startsWith('http')) {
                          setManifestationDesktopPhotos([...manifestationDesktopPhotos, url.trim()]);
                          if (activeManifestationDesktopIndex === null) setActiveManifestationDesktopIndex(manifestationDesktopPhotos.length);
                        }
                      }
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-1.5 px-2 py-2 sm:px-4 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] sm:text-xs font-semibold text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  Add URL
                </button>
              </div>
            )}
          </div>

          {/* Mobile Vision Media */}
          <div className="bg-black/30 border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h5 className="font-semibold text-[11px] sm:text-sm text-pink-300">Mobile Format ({manifestationMobilePhotos.length}/6)</h5>
              {manifestationMobilePhotos.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Delete All Mobile Vision Media',
                      message: 'Are you sure you want to delete all mobile manifestation media?',
                      isDestructive: true,
                      onConfirm: async () => {
                        for (const url of manifestationMobilePhotos) {
                          if (url.startsWith('custom-')) await deleteWallpaperFromDB(url).catch(() => { });
                        }
                        setManifestationMobilePhotos([]);
                        setActiveManifestationMobileIndex(null);
                      }
                    });
                  }}
                  className="flex items-center gap-1.5 text-[10px] md:text-xs px-2 py-1 sm:px-2.5 sm:py-1 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-100 transition-colors border border-red-500/30 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Delete All</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {manifestationMobilePhotos.map((url, i) => (
                <CustomWallpaperPreview
                  key={`mobile-manif-${i}`}
                  url={url}
                  isActive={activeManifestationMobileIndex === i}
                  onClick={() => setActiveManifestationMobileIndex(i)}
                  onShowAlert={showAlertModal}
                  onDelete={async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setConfirmModal({
                      isOpen: true,
                      title: 'Remove Media',
                      message: 'Are you sure you want to remove this manifestation media item?',
                      isDestructive: true,
                      onConfirm: async () => {
                        const newUrls = [...manifestationMobilePhotos];
                        newUrls.splice(i, 1);
                        setManifestationMobilePhotos(newUrls);
                        if (activeManifestationMobileIndex === i) setActiveManifestationMobileIndex(null);
                        else if (activeManifestationMobileIndex !== null && activeManifestationMobileIndex > i) setActiveManifestationMobileIndex(activeManifestationMobileIndex - 1);
                        if (url.startsWith('custom-')) await deleteWallpaperFromDB(url);
                      }
                    });
                  }}
                  label={url.startsWith('custom-') ? 'Local File' : (url.split('/').pop() || 'media')}
                  aspectClass="aspect-[9/16]"
                />
              ))}
            </div>

            {manifestationMobilePhotos.length < 6 && (
              <div className="flex gap-2 w-full mt-1">
                <label className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 sm:px-3 sm:py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 border-dashed rounded-lg text-[11px] sm:text-xs font-semibold text-pink-200 cursor-pointer transition-colors">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Upload
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 50 * 1024 * 1024) {
                        showAlertModal('File Too Large', 'Maximum allowed file size is 50MB.');
                        return;
                      }
                      const id = `custom-manifest-mobile-${Date.now()}`;
                      await saveWallpaperToDB(id, file);
                      setManifestationMobilePhotos([...manifestationMobilePhotos, id]);
                      if (activeManifestationMobileIndex === null) setActiveManifestationMobileIndex(manifestationMobilePhotos.length);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Add Media URL',
                      message: 'Enter direct image or video URL (https://...):',
                      isPrompt: true,
                      promptPlaceholder: 'https://...',
                      onConfirm: (url?: string) => {
                        if (url && url.trim().startsWith('http')) {
                          setManifestationMobilePhotos([...manifestationMobilePhotos, url.trim()]);
                          if (activeManifestationMobileIndex === null) setActiveManifestationMobileIndex(manifestationMobilePhotos.length);
                        }
                      }
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-1.5 px-2 py-2 sm:px-4 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] sm:text-xs font-semibold text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  Add URL
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-0 sm:p-4">
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-black/80 sm:bg-black/60 backdrop-blur-md sm:backdrop-blur-sm cursor-pointer"
          onClick={() => {
            useDashboardStore.getState().pushMediaToDB();
            onClose();
          }}
        />

        {/* Modal Container */}
        <div className="relative w-[92vw] max-w-[360px] sm:w-full sm:max-w-3xl max-h-[82vh] sm:max-h-[85vh] bg-[#0c0c0c] sm:bg-black/90 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">

          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 shrink-0 bg-black/40 sm:bg-transparent z-10">
            <h3 className="text-[15px] sm:text-base md:text-lg font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" /> Manifestation Settings
            </h3>
            <button
              onClick={() => {
                useDashboardStore.getState().pushMediaToDB();
                onClose();
              }}
              className="p-1.5 rounded-full bg-white/10 sm:bg-transparent hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Core Content Layout Area */}
          <div className="flex-1 overflow-hidden flex flex-col relative w-full">

            {/* Mobile Render (Native Smooth Scroll) */}
            <div className="md:hidden flex-1 overflow-y-auto w-full p-3 custom-scrollbar pb-6">
              {renderContent(true)}
            </div>

            {/* Desktop Render (ScrollableWithArrows plugin) */}
            <div className="hidden md:flex flex-1 overflow-hidden w-full p-6 flex-col">
              <ScrollableWithArrows className="flex-1 h-full pr-3">
                {renderContent(false)}
              </ScrollableWithArrows>
            </div>

          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isPrompt={confirmModal.isPrompt}
        promptPlaceholder={confirmModal.promptPlaceholder}
        isDestructive={confirmModal.isDestructive}
      />
    </>
  );
}