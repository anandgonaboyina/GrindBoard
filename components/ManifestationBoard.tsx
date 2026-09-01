'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useWallpaperUrl } from '@/hooks/useWallpaperUrl';
import { Sparkles, ChevronLeft, ChevronRight, Maximize2, X, Settings, Flame } from 'lucide-react';

export default function ManifestationBoard() {
    const {
        showManifestationBoard,
        manifestationDesktopPhotos,
        activeManifestationDesktopIndex,
        setActiveManifestationDesktopIndex,
        manifestationMobilePhotos,
        activeManifestationMobileIndex,
        setActiveManifestationMobileIndex,
        toggleSettings,
        setSettingsActiveTab,
    } = useDashboardStore();

    const [isMobile, setIsMobile] = useState(false);
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 768px)');
        setIsMobile(media.matches);
        const listener = () => setIsMobile(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    const photoList = isMobile ? manifestationMobilePhotos : manifestationDesktopPhotos;
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

    // Keyboard shortcuts for Fullscreen modal
    useEffect(() => {
        if (!isFullscreenOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsFullscreenOpen(false);
            } else if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreenOpen, handleNext, handlePrev]);

    if (!showManifestationBoard) return null;

    return (
        <>
            {/* Widget Card on Dashboard */}
            <div className="group relative flex flex-col p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl glass-panel border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:shadow-[0_0_40px_rgba(245,158,11,0.25)] transition-all duration-300 w-[240px] sm:w-[280px] md:w-[320px] pointer-events-auto select-none">
                {/* Header Control Bar */}
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
                        {photoList.length > 1 && (
                            <div className="flex items-center gap-0.5 bg-black/40 border border-white/10 rounded-lg px-1 py-0.5 text-[9px] font-mono text-white/70">
                                <span>{(effectiveIndex ?? 0) + 1}</span>
                                <span className="opacity-40">/</span>
                                <span>{photoList.length}</span>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setSettingsActiveTab('wallpaper');
                                toggleSettings();
                            }}
                            className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                            title="Manage Manifestation Photos"
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {photoList.length === 0 ? (
                    <div
                        onClick={() => {
                            setSettingsActiveTab('wallpaper');
                            toggleSettings();
                        }}
                        className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-amber-500/30 bg-black/30 hover:bg-black/40 text-center cursor-pointer transition-all gap-2 group/empty"
                    >
                        <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover/empty:scale-110 transition-transform">
                            <Flame className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-white/90">No Manifestation Photos</p>
                        <p className="text-[10px] text-amber-200/70 leading-tight">
                            Click here to add your dream photos & goals offline ⚙️
                        </p>
                    </div>
                ) : (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/15 bg-black/40 group/photo cursor-pointer shadow-lg">
                        {/* Manifestation Photo */}
                        {resolvedUrl ? (
                            <img
                                src={resolvedUrl}
                                alt="Manifestation Goal"
                                className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500"
                                onClick={() => setIsFullscreenOpen(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                                Loading photo...
                            </div>
                        )}

                        {/* Hover Overlay Hint & Expand Btn */}
                        <div
                            onClick={() => setIsFullscreenOpen(true)}
                            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                        >
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-medium shadow-xl transform scale-90 group-hover/photo:scale-100 transition-transform">
                                <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                                <span>Full Screen View</span>
                            </div>
                        </div>

                        {/* Slide Next / Prev Controls inside image card */}
                        {photoList.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrev();
                                    }}
                                    className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/80 border border-white/20 text-white/80 hover:text-white transition-all opacity-0 group-hover/photo:opacity-100 cursor-pointer"
                                    title="Previous Photo"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNext();
                                    }}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/80 border border-white/20 text-white/80 hover:text-white transition-all opacity-0 group-hover/photo:opacity-100 cursor-pointer"
                                    title="Next Photo"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* FULLSCREEN IMMERSIVE MANIFESTATION LIGHTBOX MODAL */}
            {isFullscreenOpen && resolvedUrl && (
                <div
                    className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-300"
                    onClick={() => setIsFullscreenOpen(false)}
                >
                    {/* Top Floating Control Bar */}
                    <div
                        className="w-full max-w-4xl flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Sparkles className="w-4 h-4 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                                    Manifest Your Vision
                                </h3>
                                <p className="text-[10px] sm:text-xs text-amber-200/80">
                                    Offline Local Storage • Dream & Focus Mode
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {photoList.length > 1 && (
                                <div className="px-2.5 py-1 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-amber-200">
                                    {(effectiveIndex ?? 0) + 1} / {photoList.length}
                                </div>
                            )}

                            <button
                                onClick={() => setIsFullscreenOpen(false)}
                                className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white transition-colors cursor-pointer"
                                title="Close Full Screen (ESC)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Middle Image Container */}
                    <div
                        className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-3 sm:my-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={resolvedUrl}
                            alt="Full Screen Manifestation Goal"
                            className="max-w-[95vw] max-h-[82vh] object-contain rounded-2xl border border-white/20 shadow-[0_0_60px_rgba(245,158,11,0.3)] animate-in zoom-in-95 duration-300"
                        />

                        {/* Navigation Arrows for Fullscreen */}
                        {photoList.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-2 sm:left-6 p-3 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 border border-white/20 text-white hover:scale-110 transition-all cursor-pointer shadow-2xl"
                                    title="Previous Dream Photo"
                                >
                                    <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="absolute right-2 sm:right-6 p-3 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 border border-white/20 text-white hover:scale-110 transition-all cursor-pointer shadow-2xl"
                                    title="Next Dream Photo"
                                >
                                    <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Bottom Motivational Footer */}
                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                        <span>Visualize daily to turn your intentions into reality.</span>
                    </div>
                </div>
            )}
        </>
    );
}
