'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useWallpaperUrl } from '@/hooks/useWallpaperUrl';
import { saveWallpaperToDB, deleteWallpaperFromDB } from '@/lib/indexedDB';
import { prepareFileForStorage } from '@/lib/imageUtils';
import { Sparkles, ChevronLeft, ChevronRight, X, Plus, Trash2, Flame, Link as LinkIcon, Upload, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import Tooltip from './Tooltip';

const MANIFESTATION_QUOTES = [
    "Believe & Achieve.",
    "Visualize your success.",
    "Focus creates reality.",
    "Dream big, work daily.",
    "Your vision, your power.",
    "Turn dreams into goals.",
    "Consistency breeds results.",
    "Mindset is everything.",
    "Manifest your greatness.",
    "The future starts today."
];

const isVideoUrl = (url: string | null): boolean => {
    if (!url) return false;
    if (url.startsWith('data:video/')) return true;
    if (url.startsWith('data:image/')) return false;
    if (url.startsWith('blob:')) return false;
    const lower = url.toLowerCase().split('?')[0];
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.mov') || lower.endsWith('.m4v') || lower.includes('/video/') || lower.includes('format=mp4');
};

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
        manifestationCustomQuotes,
    } = useDashboardStore();

    const availableQuotes = (manifestationCustomQuotes && manifestationCustomQuotes.length > 0)
        ? manifestationCustomQuotes
        : MANIFESTATION_QUOTES;

    const [isMobile, setIsMobile] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('url');
    const [randomQuote, setRandomQuote] = useState("Believe & Achieve.");
    const [isMuted, setIsMuted] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isManifestationOpen) {
            const picked = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
            setRandomQuote(picked);
        }
    }, [isManifestationOpen, manifestationCustomQuotes]);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 768px)');
        setIsMobile(media.matches);
        const listener = () => setIsMobile(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    // Keep Mobile & Desktop manifestation lists 100% separate (exactly like wallpapers)
    const photoList = isMobile ? manifestationMobilePhotos : manifestationDesktopPhotos;

    const activeIndex = isMobile ? activeManifestationMobileIndex : activeManifestationDesktopIndex;
    const setActiveIndex = (idx: number | null) => {
        if (isMobile) {
            setActiveManifestationMobileIndex(idx);
        } else {
            setActiveManifestationDesktopIndex(idx);
        }
    };

    const effectiveIndex = (activeIndex !== null && activeIndex >= 0 && activeIndex < photoList.length)
        ? activeIndex
        : (photoList.length > 0 ? 0 : null);

    const currentRawUrl = effectiveIndex !== null ? photoList[effectiveIndex] : null;
    const { resolvedUrl, isMissing, isVideo: isWallpaperVideo } = useWallpaperUrl(currentRawUrl);
    const isVideo = currentRawUrl ? (currentRawUrl.startsWith('custom-') ? isWallpaperVideo : (isWallpaperVideo || isVideoUrl(resolvedUrl || currentRawUrl))) : false;

    useEffect(() => {
        if (isVideo && videoRef.current) {
            videoRef.current.muted = isMuted;
            videoRef.current.play().catch(() => { });
        }
    }, [isVideo, resolvedUrl, isMuted, isManifestationOpen]);

    const handleNext = useCallback(() => {
        if (photoList.length <= 1) return;
        const next = effectiveIndex === null ? 0 : (effectiveIndex + 1) % photoList.length;
        setActiveIndex(next);
    }, [photoList.length, effectiveIndex, isMobile]);

    const handlePrev = useCallback(() => {
        if (photoList.length <= 1) return;
        const prev = effectiveIndex === null ? 0 : (effectiveIndex - 1 + photoList.length) % photoList.length;
        setActiveIndex(prev);
    }, [photoList.length, effectiveIndex, isMobile]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            alert('Maximum allowed file size is 50MB.');
            return;
        }

        const prefix = isMobile ? 'custom-manifest-mobile-' : 'custom-manifest-desktop-';
        const id = `${prefix}${Date.now()}`;

        // Save file binary locally to IndexedDB
        try {
            await saveWallpaperToDB(id, file);
        } catch (err) {
            console.warn('IndexedDB save warning:', err);
        }

        if (isMobile) {
            const newMobile = Array.from(new Set([...manifestationMobilePhotos, id]));
            setManifestationMobilePhotos(newMobile);
            setActiveManifestationMobileIndex(newMobile.length - 1);
        } else {
            const newDesktop = Array.from(new Set([...manifestationDesktopPhotos, id]));
            setManifestationDesktopPhotos(newDesktop);
            setActiveManifestationDesktopIndex(newDesktop.length - 1);
        }

        setIsAddMenuOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const triggerFileInput = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAddUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const trimmed = urlInput.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
            if (isMobile) {
                const newMobile = Array.from(new Set([...manifestationMobilePhotos, trimmed]));
                setManifestationMobilePhotos(newMobile);
                setActiveManifestationMobileIndex(newMobile.length - 1);
            } else {
                const newDesktop = Array.from(new Set([...manifestationDesktopPhotos, trimmed]));
                setManifestationDesktopPhotos(newDesktop);
                setActiveManifestationDesktopIndex(newDesktop.length - 1);
            }

            setUrlInput('');
            setIsAddMenuOpen(false);
        } else {
            alert('Please enter a valid image or video URL starting with http:// or https://');
        }
    };

    const handleDeleteCurrent = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (effectiveIndex === null) return;
        const urlToDelete = photoList[effectiveIndex];

        if (isMobile) {
            const newMobile = manifestationMobilePhotos.filter(u => u !== urlToDelete);
            setManifestationMobilePhotos(newMobile);
            if (activeManifestationMobileIndex !== null && activeManifestationMobileIndex >= newMobile.length) {
                setActiveManifestationMobileIndex(newMobile.length > 0 ? newMobile.length - 1 : null);
            }
        } else {
            const newDesktop = manifestationDesktopPhotos.filter(u => u !== urlToDelete);
            setManifestationDesktopPhotos(newDesktop);
            if (activeManifestationDesktopIndex !== null && activeManifestationDesktopIndex >= newDesktop.length) {
                setActiveManifestationDesktopIndex(newDesktop.length > 0 ? newDesktop.length - 1 : null);
            }
        }

        if (urlToDelete && urlToDelete.startsWith('custom-')) {
            await deleteWallpaperFromDB(urlToDelete).catch(() => { });
        }
    };

    const isHidden = useDashboardStore((state) => state.isHidden);
    const isPanicHidden = useDashboardStore((state) => state.isPanicHidden);

    // Auto-close manifestation overlay whenever Peek mode or Panic mode is activated
    useEffect(() => {
        if ((isHidden || isPanicHidden) && isManifestationOpen) {
            setIsManifestationOpen(false);
        }
    }, [isHidden, isPanicHidden, isManifestationOpen, setIsManifestationOpen]);

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
        >
            {/* Hidden File Input element for upload */}
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileUpload}
                onClick={(e) => e.stopPropagation()}
            />



            {photoList.length > 0 && !isMissing && resolvedUrl && (
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center bg-black">
                    {isVideo ? (
                        <video
                            ref={videoRef}
                            key={resolvedUrl}
                            src={resolvedUrl}
                            autoPlay
                            loop
                            playsInline
                            muted={isMuted}
                            className="w-full h-full object-contain md:object-cover animate-in fade-in duration-700"
                        />
                    ) : (
                        <img
                            src={resolvedUrl}
                            alt="Manifestation Goal Background"
                            className="w-full h-full object-contain md:object-cover animate-in fade-in zoom-in-105 duration-700"
                        />
                    )}
                    {/* Subtle vignette gradient so header & controls are always legible */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/90" />
                </div>
            )}

            {/* TOP RIGHT CLOSE BUTTON */}
            <div className="fixed hidden md:block top-5 right-3 z-50 pointer-events-none">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsManifestationOpen(false);
                    }}
                    className="pointer-events-auto p-2 sm:px-3 sm:py-1.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/50 text-gray-800 dark:text-white/90 hover:bg-white/40 hover:border-white/70 hover:text-red-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider active:scale-95 group relative"
                >
                    <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    {/* Hidden on mobile, visible on small screens (sm) and up */}
                    <span className="hidden sm:inline">Close</span>
                    <Tooltip text="Close (ESC)" position="left" />
                </button>
            </div>



            {/* SMALL WIDTH PILL SIZE TOP HEADER (Z-30) */}
            <div className="w-full flex justify-center z-30 shrink-0 pt-1 pointer-events-none">
                <div
                    className="pointer-events-auto relative flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-amber-500/30 shadow-2xl max-w-fit"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Left Side: Sparkles + Title + Board ON/OFF Toggle Switch */}
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <div className="relative group min-w-0 flex items-center">
                            <span
                                className="text-xs font-semibold italic text-amber-200/90 tracking-wide truncate max-w-[160px] sm:max-w-[280px] cursor-pointer hover:text-amber-100 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const next = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
                                    setRandomQuote(next);
                                }}
                            >
                                "{randomQuote}"
                            </span>
                            <Tooltip text="Click for another quote" position="bottom" />
                        </div>
                    </div>

                    {/* Divider line */}
                    <div className="h-3.5 w-[1px] bg-white/20 shrink-0" />

                    {/* Right Side: Simple + Icon Button & Delete */}
                    <div className="relative flex items-center gap-1.5 shrink-0">
                        {/* Simple + Icon Button */}
                        <div className="relative group">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsAddMenuOpen(!isAddMenuOpen);
                                }}
                                className={`p-1.5 rounded-full border transition-all active:scale-95 cursor-pointer ${isAddMenuOpen
                                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                    : 'bg-white/10 hover:bg-amber-500/30 text-amber-300 border-white/15'
                                    }`}
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                            <Tooltip text="Add Vision Photo / Video (+)" position="bottom" />
                        </div>

                        {/* Delete Current Photo/Video Button */}
                        {photoList.length > 0 && effectiveIndex !== null && (
                            <div className="relative group">
                                <button
                                    onClick={handleDeleteCurrent}
                                    className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/80 border border-red-500/40 text-red-300 hover:text-white transition-all cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <Tooltip text="Delete Current Photo / Video" position="bottom" />
                            </div>
                        )}

                        {/* Floating Add Menu Popover (Triggered by + icon) */}
                        {isAddMenuOpen && (
                            <div
                                className="absolute top-10 right-0 w-72 p-3 rounded-2xl bg-black/90 backdrop-blur-2xl border border-amber-500/40 shadow-2xl z-40 animate-in slide-in-from-top-2 text-xs"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> Add Vision Photo / Video
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsAddMenuOpen(false);
                                        }}
                                        className="p-1 text-white/50 hover:text-white"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {/* Option 1: Upload Local Image/Video */}
                                    <button
                                        onClick={triggerFileInput}
                                        className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white font-bold transition-all text-left cursor-pointer"
                                    >
                                        <Upload className="w-4 h-4 text-amber-400" />
                                        <span>Upload Local Photo or Video</span>
                                    </button>

                                    {/* Option 2: Paste Direct Media URL */}
                                    <form onSubmit={handleAddUrlSubmit} className="flex flex-col gap-1.5 mt-1">
                                        <label className="text-[10px] text-white/60 font-medium">Or Paste Direct Photo / Video URL:</label>
                                        <div className="flex gap-1.5">
                                            <input
                                                type="url"
                                                value={urlInput}
                                                onChange={(e) => setUrlInput(e.target.value)}
                                                placeholder="https://example.com/media.mp4 or .jpg"
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
                <div className="ml-2 mt-2 md:hidden z-50 pointer-events-none">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsManifestationOpen(false);
                        }}
                        className="pointer-events-auto p-2 sm:px-3 sm:py-1.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/50 text-gray-800 dark:text-white/90 hover:bg-white/40 hover:border-white/70 hover:text-red-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider active:scale-95 group relative"
                    >
                        <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        <Tooltip text="Close (ESC)" position="left" />
                    </button>
                </div>
            </div>

            {/* CENTER LAYER (Z-10) */}
            <div
                className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center my-2 z-10 min-h-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* DEFAULT OPEN STATE WHEN NO MEDIA EXIST */}
                {photoList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border border-dashed border-amber-500/40 bg-black/80 backdrop-blur-2xl text-center max-w-md shadow-[0_0_60px_rgba(245,158,11,0.25)] animate-in zoom-in-95 my-auto">
                        <div className="p-3 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3 animate-bounce">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h2 className="text-base sm:text-xl font-extrabold text-white mb-1.5 tracking-wide">
                            Manifest Your Target Goals
                        </h2>
                        <p className="text-xs text-amber-200/80 mb-4 leading-relaxed">
                            No vision media set yet. Upload a local photo/video file or paste a direct media URL to set your vision board background.
                        </p>

                        {/* Tabs for Upload vs URL (Open by default) */}
                        <div className="w-full flex bg-white/10 p-1 rounded-xl mb-3 border border-white/10">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('url');
                                }}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'url' ? 'bg-amber-500 text-black shadow' : 'text-white/60 hover:text-white'
                                    }`}
                            >
                                <LinkIcon className="w-3.5 h-3.5" /> Paste URL
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('upload');
                                }}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'upload' ? 'bg-amber-500 text-black shadow' : 'text-white/60 hover:text-white'
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
                                    placeholder="Paste direct photo or video URL (https://...)"
                                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
                                >
                                    Set Vision Board Media URL
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={triggerFileInput}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Choose Local Photo or Video File</span>
                            </button>
                        )}
                    </div>
                ) : (
                    /* MEDIA EXIST - CENTER BOTTOM NAVIGATION PILL & AUDIO TOGGLE */
                    <div className="relative w-full h-full pointer-events-none">
                        {/* Audio Mute/Unmute Toggle Button (Positioned just above the navigation pill) */}
                        {isVideo && (
                            <div className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto z-30 ${photoList.length > 1 ? 'bottom-12 sm:bottom-20' : 'bottom-3'}`}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMuted(!isMuted);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black/90 text-amber-300 hover:text-amber-200 border border-amber-500/40 backdrop-blur-xl shadow-2xl transition-all active:scale-95 text-xs font-bold cursor-pointer"
                                >
                                    {isMuted ? (
                                        <>
                                            <VolumeX className="w-3.5 h-3.5 text-red-400" />
                                            <span>Muted</span>
                                        </>
                                    ) : (
                                        <>
                                            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                            <span>Unmuted</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {photoList.length > 1 && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 sm:p-1.5 rounded-full bg-black/80 backdrop-blur-2xl border border-white/20 shadow-2xl pointer-events-auto z-30">
                                <div className="relative group">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePrev();
                                        }}
                                        className="p-1 sm:p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <Tooltip text="Previous Item" position="top" />
                                </div>

                                <div className="px-2 py-0.5 text-[10px] sm:text-xs font-mono font-bold text-amber-300">
                                    {(effectiveIndex ?? 0) + 1} / {photoList.length}
                                </div>

                                <div className="relative group">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNext();
                                        }}
                                        className="p-1 sm:p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <Tooltip text="Next Item" position="top" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
