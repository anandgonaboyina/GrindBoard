'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useWallpaperUrl } from '@/hooks/useWallpaperUrl';
import { saveWallpaperToDB, deleteWallpaperFromDB } from '@/lib/indexedDB';
import { Sparkles, ChevronLeft, ChevronRight, X, Plus, Trash2, Flame, Link as LinkIcon, Upload } from 'lucide-react';

export default function ManifestationBoard() {
    const {
        showManifestationBoard,
        setShowManifestationBoard,
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
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('url');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 768px)');
        setIsMobile(media.matches);
        const listener = () => setIsMobile(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    // Combine photos so URLs are shared seamlessly between mobile & desktop
    const currentDeviceList = isMobile ? manifestationMobilePhotos : manifestationDesktopPhotos;
    const otherDeviceList = isMobile ? manifestationDesktopPhotos : manifestationMobilePhotos;

    // Extract web URLs from other device list if not already present
    const sharedUrls = otherDeviceList.filter(url => 
        (url.startsWith('http://') || url.startsWith('https://')) && !currentDeviceList.includes(url)
    );

    const photoList = Array.from(new Set([...currentDeviceList, ...sharedUrls]));
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

        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) return;

            const prefix = isMobile ? 'custom-manifest-mobile-' : 'custom-manifest-desktop-';
            const id = `${prefix}${Date.now()}`;
            
            try {
                await saveWallpaperToDB(id, file);
                const updated = [...photoList, id];
                setPhotoList(updated);
                setActiveIndex(updated.length - 1);
            } catch (err) {
                const updated = [...photoList, dataUrl];
                setPhotoList(updated);
                setActiveIndex(updated.length - 1);
            }

            setIsAddMenuOpen(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsDataURL(file);
    };

    const handleAddUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = urlInput.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
            // Save URL to BOTH desktop and mobile lists so it works across all devices
            const newDesktop = Array.from(new Set([...manifestationDesktopPhotos, trimmed]));
            const newMobile = Array.from(new Set([...manifestationMobilePhotos, trimmed]));
            setManifestationDesktopPhotos(newDesktop);
            setManifestationMobilePhotos(newMobile);

            setActiveIndex(photoList.length);
            setUrlInput('');
            setIsAddMenuOpen(false);
        } else {
            alert('Please enter a valid image URL starting with http:// or https://');
        }
    };

    const handleDeleteCurrent = async () => {
        if (effectiveIndex === null) return;
        const urlToDelete = photoList[effectiveIndex];
        
        const newDesktop = manifestationDesktopPhotos.filter(u => u !== urlToDelete);
        const newMobile = manifestationMobilePhotos.filter(u => u !== urlToDelete);
        setManifestationDesktopPhotos(newDesktop);
        setManifestationMobilePhotos(newMobile);

        const updated = photoList.filter((_, idx) => idx !== effectiveIndex);

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
            className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between p-2 sm:p-4 animate-in fade-in duration-300 select-none w-screen h-screen overflow-hidden"
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

            {/* FULL SCREEN BACKGROUND IMAGE LAYER */}
            {photoList.length > 0 && resolvedUrl && (
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <img
                        src={resolvedUrl}
                        alt="Manifestation Goal Background"
                        className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-700"
                    />
                    {/* Subtle vignette gradient so header & controls are always legible */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/90" />
                </div>
            )}

            {/* ULTRA NARROW TOP HEADER (Z-30) */}
            <div
                className="w-full max-w-6xl mx-auto flex items-center justify-between px-3 py-1 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-xl z-30 shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Side: Sparkles + Title + Board ON/OFF Toggle Switch */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide truncate">
                        Manifestation Board
                    </span>

                    {/* Board ON/OFF Toggle Switch */}
                    <button
                        onClick={() => {
                            const nextState = !showManifestationBoard;
                            setShowManifestationBoard(nextState);
                            if (!nextState) setIsManifestationOpen(false);
                        }}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
                            showManifestationBoard
                                ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 hover:bg-amber-500/40'
                                : 'bg-white/10 text-white/50 border-white/15 hover:bg-white/20'
                        }`}
                        title="Toggle Manifestation Board ON/OFF"
                    >
                        <span className={`w-2 h-2 rounded-full ${showManifestationBoard ? 'bg-amber-400 animate-pulse' : 'bg-white/40'}`} />
                        <span>{showManifestationBoard ? 'ON' : 'OFF'}</span>
                    </button>
                </div>

                {/* Right Side: Simple + Icon Button, Delete, and Close X */}
                <div className="relative flex items-center gap-1.5 shrink-0">
                    {/* Simple + Icon Button */}
                    <button
                        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                        className={`p-1.5 rounded-full border transition-all active:scale-95 cursor-pointer ${
                            isAddMenuOpen
                                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                : 'bg-white/10 hover:bg-amber-500/30 text-amber-300 border-white/15'
                        }`}
                        title="Add Image (+)"
                    >
                        <Plus className="w-4 h-4" />
                    </button>

                    {/* Delete Current Photo Button */}
                    {photoList.length > 0 && effectiveIndex !== null && (
                        <button
                            onClick={handleDeleteCurrent}
                            className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/80 border border-red-500/40 text-red-300 hover:text-white transition-all cursor-pointer"
                            title="Delete Current Photo"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Close (X) Button */}
                    <button
                        onClick={() => setIsManifestationOpen(false)}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-colors cursor-pointer ml-1"
                        title="Close (ESC)"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Floating Add Menu Popover (Triggered by + icon) */}
                    {isAddMenuOpen && (
                        <div
                            className="absolute top-9 right-0 w-72 p-3 rounded-2xl bg-black/90 backdrop-blur-2xl border border-amber-500/40 shadow-2xl z-40 animate-in slide-in-from-top-2 text-xs"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" /> Add Vision Photo
                                </span>
                                <button
                                    onClick={() => setIsAddMenuOpen(false)}
                                    className="p-1 text-white/50 hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                {/* Option 1: Upload Local Image */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white font-bold transition-all text-left cursor-pointer"
                                >
                                    <Upload className="w-4 h-4 text-amber-400" />
                                    <span>Upload Local Image</span>
                                </button>

                                {/* Option 2: Paste Image URL */}
                                <form onSubmit={handleAddUrlSubmit} className="flex flex-col gap-1.5 mt-1">
                                    <label className="text-[10px] text-white/60 font-medium">Or Paste Direct Image URL:</label>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="url"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="flex-1 px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                                        />
                                        <button
                                            type="submit"
                                            className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-white/40 leading-tight">
                                        URLs work across both mobile & desktop devices automatically.
                                    </p>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CENTER LAYER (Z-10) */}
            <div
                className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center my-2 z-10 min-h-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* DEFAULT OPEN STATE WHEN NO PHOTOS EXIST */}
                {photoList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border border-dashed border-amber-500/40 bg-black/80 backdrop-blur-2xl text-center max-w-md shadow-[0_0_60px_rgba(245,158,11,0.25)] animate-in zoom-in-95 my-auto">
                        <div className="p-3 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3 animate-bounce">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h2 className="text-base sm:text-xl font-extrabold text-white mb-1.5 tracking-wide">
                            Manifest Your Target Goals
                        </h2>
                        <p className="text-xs text-amber-200/80 mb-4 leading-relaxed">
                            No vision images set yet. Upload a local file or paste an image URL to set your vision board background.
                        </p>

                        {/* Tabs for Upload vs URL (Open by default) */}
                        <div className="w-full flex bg-white/10 p-1 rounded-xl mb-3 border border-white/10">
                            <button
                                onClick={() => setActiveTab('url')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    activeTab === 'url' ? 'bg-amber-500 text-black shadow' : 'text-white/60 hover:text-white'
                                }`}
                            >
                                <LinkIcon className="w-3.5 h-3.5" /> Paste URL
                            </button>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    activeTab === 'upload' ? 'bg-amber-500 text-black shadow' : 'text-white/60 hover:text-white'
                                }`}
                            >
                                <Upload className="w-3.5 h-3.5" /> Upload File
                            </button>
                        </div>

                        {activeTab === 'url' ? (
                            <form onSubmit={handleAddUrlSubmit} className="w-full flex flex-col gap-2">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="Paste direct image URL (https://...)"
                                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
                                >
                                    Set Vision Board URL
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Choose Local Photo File</span>
                            </button>
                        )}
                    </div>
                ) : (
                    /* CASE 2: IMAGES EXIST - FLOATING NAVIGATION OVER FULL SCREEN BACKGROUND */
                    <div className="relative w-full h-full flex items-center justify-between pointer-events-none">
                        {/* Side Left Navigation Arrow */}
                        {photoList.length > 1 && (
                            <button
                                onClick={handlePrev}
                                className="p-2.5 sm:p-3.5 rounded-full bg-black/60 backdrop-blur-xl hover:bg-amber-500/80 border border-white/20 text-white hover:text-black hover:scale-110 transition-all cursor-pointer shadow-2xl pointer-events-auto ml-1 sm:ml-3"
                                title="Previous Photo"
                            >
                                <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
                            </button>
                        )}

                        <div className="flex-1" />

                        {/* Side Right Navigation Arrow */}
                        {photoList.length > 1 && (
                            <button
                                onClick={handleNext}
                                className="p-2.5 sm:p-3.5 rounded-full bg-black/60 backdrop-blur-xl hover:bg-amber-500/80 border border-white/20 text-white hover:text-black hover:scale-110 transition-all cursor-pointer shadow-2xl pointer-events-auto mr-1 sm:mr-3"
                                title="Next Photo"
                            >
                                <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
                            </button>
                        )}

                        {/* Corner Navigation Counter Pill (Bottom Right) */}
                        {photoList.length > 1 && (
                            <div className="absolute bottom-1.5 right-1.5 sm:bottom-3 sm:right-3 flex items-center gap-1.5 p-1 sm:p-1.5 rounded-full bg-black/80 backdrop-blur-2xl border border-white/20 shadow-2xl pointer-events-auto z-30">
                                <button
                                    onClick={handlePrev}
                                    className="p-1 sm:p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                                    title="Previous Photo"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>

                                <div className="px-2 py-0.5 text-[10px] sm:text-xs font-mono font-bold text-amber-300">
                                    {(effectiveIndex ?? 0) + 1} / {photoList.length}
                                </div>

                                <button
                                    onClick={handleNext}
                                    className="p-1 sm:p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                                    title="Next Photo"
                                >
                                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* BOTTOM INSPIRATION BAR (Z-20) */}
            <div
                className="w-full max-w-fit mx-auto flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-[9px] sm:text-xs text-white/90 z-20 shrink-0 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-bounce" />
                <span>Visualize daily to manifest your target goals into reality.</span>
            </div>
        </div>
    );
}
