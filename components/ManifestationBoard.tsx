'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useWallpaperUrl } from '@/hooks/useWallpaperUrl';
import { saveWallpaperToDB, deleteWallpaperFromDB } from '@/lib/indexedDB';
import { Sparkles, ChevronLeft, ChevronRight, X, Plus, Trash2, Flame, Link as LinkIcon, Upload } from 'lucide-react';

export default function ManifestationBoard() {
    const {
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

    // Keyboard shortcuts for Fullscreen overlay
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

    if (!isManifestationOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-300 select-none w-screen h-screen"
            onClick={() => setIsManifestationOpen(false)}
        >
            {/* Hidden File Input element for upload */}
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Top Header Bar with Corner Controls */}
            <div
                className="w-full max-w-6xl flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl z-20 shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Title */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5 sm:gap-2 truncate">
                            <span className="truncate">Manifestation Board</span>
                            <span className="text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-mono font-normal shrink-0">
                                {isMobile ? 'Mobile' : 'Desktop'}
                            </span>
                        </h3>
                        <p className="text-[9px] sm:text-xs text-amber-200/80 truncate">
                            Offline Local Storage • Daily Goal Focus
                        </p>
                    </div>
                </div>

                {/* Right Action Corner: Add Image (+), Delete, Close (X) */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Add Photo (+) Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg"
                        title="Upload Local Photo (+)"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Photo</span>
                    </button>

                    {/* Add URL Button */}
                    <button
                        onClick={() => setIsAddingUrl(!isAddingUrl)}
                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white text-xs font-medium transition-all active:scale-95 cursor-pointer"
                        title="Add Image URL"
                    >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add URL</span>
                    </button>

                    {/* Delete Current Photo Button */}
                    {photoList.length > 0 && effectiveIndex !== null && (
                        <button
                            onClick={handleDeleteCurrent}
                            className="p-1.5 sm:p-2 rounded-xl bg-red-500/10 hover:bg-red-500/80 border border-red-500/30 text-red-300 hover:text-white transition-all cursor-pointer"
                            title="Delete Current Photo"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={() => setIsManifestationOpen(false)}
                        className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white transition-colors cursor-pointer ml-1"
                        title="Close Full Screen (ESC)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Add URL Drawer Input */}
            {isAddingUrl && (
                <div
                    className="w-full max-w-xl my-2 p-3 rounded-2xl bg-black/90 backdrop-blur-xl border border-amber-500/40 shadow-2xl z-30 animate-in slide-in-from-top-4 shrink-0"
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
                            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                        >
                            Add
                        </button>
                    </form>
                </div>
            )}

            {/* Main Full-Screen Display Area */}
            <div
                className="relative flex-1 w-full max-w-6xl flex items-center justify-center my-2 sm:my-4 min-h-0 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* CASE 1: NO PHOTOS ADDED YET */}
                {photoList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 sm:p-12 rounded-3xl border border-dashed border-amber-500/40 bg-black/50 backdrop-blur-xl text-center max-w-lg shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-in zoom-in-95 my-auto">
                        <div className="p-3.5 sm:p-4 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3 sm:mb-4 animate-bounce">
                            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <h2 className="text-lg sm:text-2xl font-extrabold text-white mb-2 tracking-wide">
                            No Manifestation Photos Added Yet
                        </h2>
                        <p className="text-xs sm:text-sm text-amber-200/80 mb-5 leading-relaxed max-w-sm">
                            Upload photos of your dream goals, dream car, home, or vision board. Everything is saved 100% offline locally on your device!
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                <span>+ Upload Local Photo</span>
                            </button>

                            <button
                                onClick={() => setIsAddingUrl(true)}
                                className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <LinkIcon className="w-4 h-4 text-amber-300" />
                                <span>Add Image URL</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* CASE 2: IMAGES EXIST - DIRECT FULL SCREEN IMAGE & CORNER CONTROLS */
                    <div className="relative w-full h-full flex items-center justify-center">
                        {resolvedUrl ? (
                            <img
                                src={resolvedUrl}
                                alt="Manifestation Goal"
                                className="max-w-[98vw] max-h-[82vh] object-contain rounded-2xl border border-white/20 shadow-[0_0_80px_rgba(245,158,11,0.3)] animate-in zoom-in-95 duration-300"
                            />
                        ) : (
                            <div className="text-white/50 text-sm">Loading photo...</div>
                        )}

                        {/* Corner Navigation Controls (Corner Pill in Bottom-Right Corner) */}
                        {photoList.length > 1 && (
                            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl z-30">
                                <button
                                    onClick={handlePrev}
                                    className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                                    title="Previous Photo (Left Arrow)"
                                >
                                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>

                                <div className="px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
                                    {(effectiveIndex ?? 0) + 1} / {photoList.length}
                                </div>

                                <button
                                    onClick={handleNext}
                                    className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                                    title="Next Photo (Right Arrow)"
                                >
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        )}

                        {/* Side Arrow Navigation */}
                        {photoList.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-1 sm:left-4 p-2.5 sm:p-3 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 border border-white/20 text-white hover:scale-110 transition-all cursor-pointer shadow-2xl"
                                    title="Previous Photo"
                                >
                                    <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="absolute right-1 sm:right-4 p-2.5 sm:p-3 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 border border-white/20 text-white hover:scale-110 transition-all cursor-pointer shadow-2xl"
                                    title="Next Photo"
                                >
                                    <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Quote Bar */}
            <div
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs text-white/90 z-20 shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-bounce" />
                <span>Visualize daily to manifest your target goals into reality.</span>
            </div>
        </div>
    );
}
