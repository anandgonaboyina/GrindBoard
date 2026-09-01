'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useWallpaperUrl } from '@/hooks/useWallpaperUrl';
import { saveWallpaperToDB, deleteWallpaperFromDB } from '@/lib/indexedDB';
import { Sparkles, ChevronLeft, ChevronRight, Maximize2, X, Plus, Trash2, Image as ImageIcon, Flame, Link as LinkIcon, Upload } from 'lucide-react';

export default function ManifestationBoard() {
    const {
        showManifestationBoard,
        isManifestationOpen,
        setIsManifestationOpen,
        manifestationDesktopPhotos,
        setManifestationDesktopPhotos,
        activeManifestationDesktopIndex,
        setActiveManifestationDesktopIndex,
        manifestationMobilePhotos,
        setManifestationMobilePhotos,
        activeManifestationMobileIndex,
        setActiveManifestationMobileIndex,
    } = useDashboardStore();

    const [isMobile, setIsMobile] = useState(false);
    const [isAddingUrl, setIsAddingUrl] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 768px)');
        setIsMobile(media.matches);
        const listener = () => setIsMobile(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    const photoList = isMobile ? manifestationMobilePhotos : manifestationDesktopPhotos;
    const setPhotoList = isMobile ? setManifestationMobilePhotos : setManifestationDesktopPhotos;
    const activeIndex = isMobile ? activeManifestationMobileIndex : activeManifestationDesktopIndex;
    const setActiveIndex = isMobile ? setActiveManifestationMobileIndex : setActiveManifestationDesktopIndex;

    const effectiveIndex = (activeIndex !== null && activeIndex >= 0 && activeIndex < photoList.length)
        ? activeIndex
        : (photoList.length > 0 ? 0 : null);

    const currentRawUrl = effectiveIndex !== null ? photoList[effectiveIndex] : null;
    const { resolvedUrl } = useWallpaperUrl(currentRawUrl);

    const handleNext = useCallback(() => {
        if (photoList.length <= 1) return;
        const next = effectiveIndex === null ? 0 : (effectiveIndex + 1) % photoList.length;
        setActiveIndex(next);
    }, [photoList.length, effectiveIndex, setActiveIndex]);

    const handlePrev = useCallback(() => {
        if (photoList.length <= 1) return;
        const prev = effectiveIndex === null ? 0 : (effectiveIndex - 1 + photoList.length) % photoList.length;
        setActiveIndex(prev);
    }, [photoList.length, effectiveIndex, setActiveIndex]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 25 * 1024 * 1024) {
            alert('Maximum allowed file size is 25MB.');
            return;
        }

        const prefix = isMobile ? 'custom-manifest-mobile-' : 'custom-manifest-desktop-';
        const id = `${prefix}${Date.now()}`;
        await saveWallpaperToDB(id, file);

        const updated = [...photoList, id];
        setPhotoList(updated);
        setActiveIndex(updated.length - 1);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = urlInput.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            const updated = [...photoList, trimmed];
            setPhotoList(updated);
            setActiveIndex(updated.length - 1);
            setUrlInput('');
            setIsAddingUrl(false);
        } else {
            alert('Please enter a valid image URL starting with http:// or https://');
        }
    };

    const handleDeleteCurrent = async () => {
        if (effectiveIndex === null) return;
        const urlToDelete = photoList[effectiveIndex];
        const updated = photoList.filter((_, idx) => idx !== effectiveIndex);
        setPhotoList(updated);

        if (updated.length === 0) {
            setActiveIndex(null);
        } else if (effectiveIndex >= updated.length) {
            setActiveIndex(updated.length - 1);
        }

        if (urlToDelete.startsWith('custom-')) {
            await deleteWallpaperFromDB(urlToDelete).catch(() => {});
        }
    };

    // Keyboard shortcuts for Fullscreen modal
    useEffect(() => {
        if (!isManifestationOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsManifestationOpen(false);
            } else if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isManifestationOpen, setIsManifestationOpen, handleNext, handlePrev]);

    if (!showManifestationBoard && !isManifestationOpen) return null;

    return (
        <>
            {/* Draggable Widget Card on Dashboard (when enabled) */}
            {showManifestationBoard && !isManifestationOpen && (
                <div
                    onClick={() => setIsManifestationOpen(true)}
                    className="group relative flex flex-col p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl glass-panel border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:border-amber-400/50 transition-all duration-300 w-[240px] sm:w-[280px] md:w-[320px] pointer-events-auto select-none cursor-pointer"
                >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-white/10 mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-amber-200 uppercase truncate">
                                Manifestation Board
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            {photoList.length > 0 && (
                                <div className="flex items-center gap-0.5 bg-black/40 border border-white/10 rounded-lg px-1.5 py-0.5 text-[9px] font-mono text-amber-300">
                                    <span>{(effectiveIndex ?? 0) + 1}</span>
                                    <span className="opacity-40">/</span>
                                    <span>{photoList.length}</span>
                                </div>
                            )}

                            <div className="p-1 rounded-lg bg-white/5 group-hover:bg-amber-500/20 text-white/70 group-hover:text-amber-300 transition-colors">
                                <Maximize2 className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>

                    {/* Preview Image Card or Empty Card */}
                    {photoList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-amber-500/30 bg-black/30 text-center gap-1.5">
                            <div className="p-2 rounded-full bg-amber-500/20 text-amber-400">
                                <Flame className="w-5 h-5 animate-pulse" />
                            </div>
                            <p className="text-xs font-bold text-white">No Dream Photos Added</p>
                            <p className="text-[10px] text-amber-200/80">Click to open full screen & add goals ✨</p>
                        </div>
                    ) : (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/15 bg-black/40 group/photo shadow-lg">
                            {resolvedUrl ? (
                                <img
                                    src={resolvedUrl}
                                    alt="Manifestation Goal"
                                    className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                                    Loading...
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-medium shadow-xl">
                                    <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Expand Full Screen</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Hidden File Input element for upload */}
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* IMMERSIVE FULL SCREEN MANIFESTATION OVERLAY */}
            {isManifestationOpen && (
                <div
                    className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-300 select-none"
                    onClick={() => setIsManifestationOpen(false)}
                >
                    {/* Top Header Bar with Corner Controls */}
                    <div
                        className="w-full max-w-6xl flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl z-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Left Title */}
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Sparkles className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                                    <span>Manifestation Vision Board</span>
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-normal">
                                        {isMobile ? 'Mobile Mode' : 'Desktop Mode'}
                                    </span>
                                </h3>
                                <p className="text-[10px] sm:text-xs text-amber-200/80">
                                    Offline Local Storage • Daily Goal Focus
                                </p>
                            </div>
                        </div>

                        {/* Right Action Corner: Add Image (+), Delete, Close (X) */}
                        <div className="flex items-center gap-2">
                            {/* Add Photo (+) Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg"
                                title="Upload Local Photo (+)"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Photo</span>
                            </button>

                            {/* Add URL Button */}
                            <button
                                onClick={() => setIsAddingUrl(!isAddingUrl)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white text-xs font-medium transition-all active:scale-95 cursor-pointer"
                                title="Add Image URL"
                            >
                                <LinkIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Add URL</span>
                            </button>

                            {/* Delete Current Photo Button */}
                            {photoList.length > 0 && effectiveIndex !== null && (
                                <button
                                    onClick={handleDeleteCurrent}
                                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/80 border border-red-500/30 text-red-300 hover:text-white transition-all cursor-pointer"
                                    title="Delete Current Photo"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={() => setIsManifestationOpen(false)}
                                className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white transition-colors cursor-pointer ml-1"
                                title="Close Full Screen (ESC)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Add URL Drawer Input */}
                    {isAddingUrl && (
                        <div
                            className="w-full max-w-xl my-2 p-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-amber-500/40 shadow-2xl z-30 animate-in slide-in-from-top-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={handleAddUrlSubmit} className="flex gap-2">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="Enter direct image URL (https://...)"
                                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
                                >
                                    Add
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div
                        className="relative flex-1 w-full max-w-6xl flex items-center justify-center my-2 sm:my-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* CASE 1: NO PHOTOS ADDED YET */}
                        {photoList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border border-dashed border-amber-500/40 bg-black/40 backdrop-blur-xl text-center max-w-lg shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-in zoom-in-95">
                                <div className="p-4 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4 animate-bounce">
                                    <Sparkles className="w-10 h-10" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 tracking-wide">
                                    No Manifestation Photos Added Yet
                                </h2>
                                <p className="text-xs sm:text-sm text-amber-200/80 mb-6 leading-relaxed">
                                    Upload high-res photos of your dream car, dream home, career goals, or motivational quotes. Everything is saved 100% offline on your device!
                                </p>

                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>+ Upload Local Photo</span>
                                    </button>

                                    <button
                                        onClick={() => setIsAddingUrl(true)}
                                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <LinkIcon className="w-4 h-4 text-amber-300" />
                                        <span>Add Image URL</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* CASE 2: IMAGES EXIST - DISPLAY FULLSCREEN PHOTO & CORNER NAVIGATION */
                            <div className="relative w-full h-full flex items-center justify-center">
                                {resolvedUrl ? (
                                    <img
                                        src={resolvedUrl}
                                        alt="Manifestation Goal"
                                        className="max-w-[95vw] max-h-[82vh] object-contain rounded-2xl border border-white/20 shadow-[0_0_70px_rgba(245,158,11,0.3)] animate-in zoom-in-95 duration-300"
                                    />
                                ) : (
                                    <div className="text-white/50 text-sm">Loading photo...</div>
                                )}

                                {/* Corner Navigation Controls (Corner Pill overlay inside Full Screen) */}
                                {photoList.length > 1 && (
                                    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 p-1.5 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/20 shadow-2xl z-30">
                                        <button
                                            onClick={handlePrev}
                                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                                            title="Previous Photo (Left Arrow)"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        <div className="px-3 py-1 text-xs font-mono font-bold text-amber-300">
                                            {(effectiveIndex ?? 0) + 1} / {photoList.length}
                                        </div>

                                        <button
                                            onClick={handleNext}
                                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                                            title="Next Photo (Right Arrow)"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                {/* Side Large Arrow Navigation for Easy Desktop/Touch Swiping */}
                                {photoList.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrev}
                                            className="absolute left-2 sm:left-6 p-3 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/80 border border-white/20 text-white hover:scale-110 transition-all cursor-pointer shadow-2xl"
                                            title="Previous Photo"
                                        >
                                            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="absolute right-2 sm:right-6 p-3 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/80 border border-white/20 text-white hover:scale-110 transition-all cursor-pointer shadow-2xl"
                                            title="Next Photo"
                                        >
                                            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom Inspirational Footer */}
                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 z-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                        <span>Visualize daily to manifest your targets into reality.</span>
                    </div>
                </div>
            )}
        </>
    );
}
