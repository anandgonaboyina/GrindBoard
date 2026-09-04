'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useWallpaperUrl } from '@/hooks/useWallpaperUrl';
import { saveWallpaperToDB, deleteWallpaperFromDB, getWallpaperFromDB } from '@/lib/indexedDB';
import { prepareFileForStorage } from '@/lib/imageUtils';
import { Sparkles, ChevronLeft, ChevronRight, X, Flame, Volume2, VolumeX, Settings, Copy, Check } from 'lucide-react';
import Tooltip from './Tooltip';
import ManifestationSettingsModal from './ManifestationSettingsModal';

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
    const [randomQuote, setRandomQuote] = useState("Believe & Achieve.");
    const [isMuted, setIsMuted] = useState(true);
    const [availablePhotos, setAvailablePhotos] = useState<string[]>([]);
    const [isLoadingAvailable, setIsLoadingAvailable] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
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

    useEffect(() => {
        let isSubscribed = true;
        const checkAvailability = async () => {
            setIsLoadingAvailable(true);
            const filtered = [];
            for (const url of photoList) {
                if (url.startsWith('custom-')) {
                    let blob = await getWallpaperFromDB(url);
                    if (!blob) {
                        await new Promise(r => setTimeout(r, 200));
                        blob = await getWallpaperFromDB(url);
                    }
                    if (blob) {
                        filtered.push(url);
                    }
                } else {
                    filtered.push(url);
                }
            }
            if (isSubscribed) {
                setAvailablePhotos(filtered);
                setIsLoadingAvailable(false);
            }
        };
        if (isManifestationOpen) {
            checkAvailability();
        }
    }, [photoList, isManifestationOpen]);

    const activeIndex = isMobile ? activeManifestationMobileIndex : activeManifestationDesktopIndex;
    const setActiveIndex = (idx: number | null) => {
        if (isMobile) {
            setActiveManifestationMobileIndex(idx);
        } else {
            setActiveManifestationDesktopIndex(idx);
        }
    };

    const effectiveIndex = (activeIndex !== null && activeIndex >= 0 && activeIndex < availablePhotos.length)
        ? activeIndex
        : (availablePhotos.length > 0 ? 0 : null);

    const currentRawUrl = effectiveIndex !== null ? availablePhotos[effectiveIndex] : null;
    const { resolvedUrl, isMissing, isVideo: isWallpaperVideo } = useWallpaperUrl(currentRawUrl);
    const isVideo = currentRawUrl ? (currentRawUrl.startsWith('custom-') ? isWallpaperVideo : (isWallpaperVideo || isVideoUrl(resolvedUrl || currentRawUrl))) : false;

    useEffect(() => {
        if (isVideo && videoRef.current) {
            videoRef.current.muted = isMuted;
            videoRef.current.play().catch(() => { });
        }
    }, [isVideo, resolvedUrl, isMuted, isManifestationOpen]);

    const handleNext = useCallback(() => {
        if (availablePhotos.length <= 1) return;
        const next = effectiveIndex === null ? 0 : (effectiveIndex + 1) % availablePhotos.length;
        setActiveIndex(next);
    }, [availablePhotos.length, effectiveIndex, isMobile]);

    const handlePrev = useCallback(() => {
        if (availablePhotos.length <= 1) return;
        const prev = effectiveIndex === null ? 0 : (effectiveIndex - 1 + availablePhotos.length) % availablePhotos.length;
        setActiveIndex(prev);
    }, [availablePhotos.length, effectiveIndex, isMobile]);

    const handleCopyQuote = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(randomQuote);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

    const dashboardScale = useDashboardStore((state) => state.dashboardScale || 1);
    const mobileDashboardScale = useDashboardStore((state) => state.mobileDashboardScale || 1);
    const activeDashboardScale = isMobile ? mobileDashboardScale : dashboardScale;
    const inverseScale = activeDashboardScale > 0 ? (1 / activeDashboardScale) : 1;

    if (!isManifestationOpen) return null;

    return (
        <div
            style={{ zoom: inverseScale }}
            className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between p-2 sm:p-4 animate-in fade-in duration-300 select-none w-screen h-screen overflow-hidden"
        >
            {availablePhotos.length > 0 && !isMissing && resolvedUrl && (
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

            {/* TOP RIGHT CLOSE BUTTON & SETTINGS (DESKTOP ONLY) */}
            <div className="fixed hidden md:flex items-center gap-2 top-5 right-3 z-50 pointer-events-none">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSettingsOpen(true);
                    }}
                    className="pointer-events-auto p-2 sm:px-3 sm:py-1.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/50 text-gray-800 dark:text-white/90 hover:bg-white/40 hover:border-white/70 hover:text-amber-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider active:scale-95 group relative"
                >
                    <Settings className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Settings</span>
                </button>
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

            {/* BOTTOM CLOSE & SETTINGS (MOBILE ONLY) */}
            <div className="fixed bottom-5 px-4 w-full flex justify-between md:hidden z-50 pointer-events-none">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSettingsOpen(true);
                    }}
                    className="pointer-events-auto p-2.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/50 text-white/90 hover:bg-white/40 hover:text-amber-500 shadow-md transition-all flex items-center justify-center"
                >
                    <Settings className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsManifestationOpen(false);
                    }}
                    className="pointer-events-auto p-2.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/50 text-white/90 hover:bg-white/40 hover:text-red-500 shadow-md transition-all flex items-center justify-center"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>


            {/* SMALL WIDTH PILL SIZE TOP HEADER (Z-30) */}
            <div className="w-full flex flex-col items-center justify-center gap-2 z-30 shrink-0 pt-2 sm:pt-1 pointer-events-none">
                {/* QUOTE PILL */}
                <div
                    className="pointer-events-auto relative flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-amber-500/30 shadow-2xl max-w-[95%] sm:max-w-fit"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <div className="relative group min-w-0 flex items-center">
                            <span
                                className="text-xs font-semibold italic text-amber-200/90 tracking-wide max-w-[220px] sm:max-w-[400px] md:max-w-[500px] cursor-pointer hover:text-amber-100 transition-colors truncate sm:whitespace-normal"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const next = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
                                    setRandomQuote(next);
                                }}
                            >
                                "{randomQuote}"
                            </span>

                            {/* Copy Quote Button directly inside the pill */}
                            <button
                                onClick={handleCopyQuote}
                                className="ml-1.5 p-1 rounded-md hover:bg-amber-500/20 transition-colors pointer-events-auto shrink-0 flex items-center justify-center"
                                title="Copy quote"
                            >
                                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-amber-400/80" />}
                            </button>

                            <Tooltip text="Click text for another quote" position="bottom" />
                        </div>
                    </div>
                </div>
            </div>

            {/* CENTER LAYER (Z-10) */}
            <div
                className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center my-2 z-10 min-h-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* DEFAULT OPEN STATE WHEN NO MEDIA EXIST */}
                {isLoadingAvailable ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-white/50 bg-black/80 backdrop-blur-md rounded-3xl border border-white/10 max-w-sm">
                        <Sparkles className="w-6 h-6 animate-spin text-amber-500/50 mb-2" />
                        <span className="text-xs">Loading vision board...</span>
                    </div>
                ) : availablePhotos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border border-dashed border-amber-500/40 bg-black/80 backdrop-blur-2xl text-center max-w-md shadow-[0_0_60px_rgba(245,158,11,0.25)] animate-in zoom-in-95 my-auto">
                        <div className="p-3 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3 animate-bounce">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h2 className="text-base sm:text-xl font-extrabold text-white mb-1.5 tracking-wide">
                            Manifest Your Target Goals
                        </h2>
                        <p className="text-xs text-amber-200/80 mb-6 leading-relaxed">
                            No vision media set yet. Open settings to upload local photos/videos or paste direct URLs for your background.
                        </p>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsSettingsOpen(true);
                            }}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Open Manifestation Settings</span>
                        </button>
                    </div>
                ) : (
                    /* MEDIA EXIST - CENTER BOTTOM NAVIGATION PILL & AUDIO TOGGLE */
                    <div className="relative w-full h-full pointer-events-none">
                        {/* Audio Mute/Unmute Toggle Button (Positioned just above the navigation pill) */}
                        {isVideo && (
                            <div className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto z-30 ${availablePhotos.length > 1 ? 'bottom-14 sm:bottom-22' : 'bottom-10'}`}>
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

                        {availablePhotos.length > 1 && (
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 sm:p-1.5 rounded-full bg-black/80 backdrop-blur-2xl border border-white/20 shadow-2xl pointer-events-auto z-30">
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
                                    {(effectiveIndex ?? 0) + 1} / {availablePhotos.length}
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
            {isSettingsOpen && (
                <ManifestationSettingsModal onClose={() => setIsSettingsOpen(false)} />
            )}
        </div>
    );
}