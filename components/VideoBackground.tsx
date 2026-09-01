"use client";
import { useState, useEffect } from 'react';
import { useDashboardStore } from "@/store/dashboardStore";
import { useWallpaperUrl } from "@/hooks/useWallpaperUrl";

export default function VideoBackground() {
  const isPanicHidden = useDashboardStore((state) => state.isPanicHidden);
  const isHidden = useDashboardStore((state) => state.isHidden);
  const panicWallpaperSwitch = useDashboardStore((state) => state.panicWallpaperSwitch);
  const peekModeWallpaper = useDashboardStore((state) => state.peekModeWallpaper);
  const { 
    customDesktopWallpapers, 
    activeDesktopCustomIndex, 
    customMobileWallpapers, 
    activeMobileCustomIndex,
    wallpaper
  } = useDashboardStore();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => window.innerWidth <= 768;

    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine standard active source
  let bgSrc = isMobile ? "/wallpapers/defaultWallpaper2.jpeg" : (wallpaper || "/wallpapers/naruto.webp");
  
  if (isMobile && activeMobileCustomIndex !== null && customMobileWallpapers[activeMobileCustomIndex]) {
    bgSrc = customMobileWallpapers[activeMobileCustomIndex];
  } else if (!isMobile && activeDesktopCustomIndex !== null && customDesktopWallpapers[activeDesktopCustomIndex]) {
    bgSrc = customDesktopWallpapers[activeDesktopCustomIndex];
  }

  // Handle Peek / Panic Mode Wallpaper Fallback
  const isPeekActive = isHidden || isPanicHidden;
  let activePeekWallpaper: string | null = null;

  if (isPeekActive) {
    if (peekModeWallpaper && peekModeWallpaper.trim() !== '') {
      activePeekWallpaper = peekModeWallpaper;
    } else if (panicWallpaperSwitch) {
      activePeekWallpaper = isMobile ? "/wallpapers/defaultWallpaper2.jpeg" : "/wallpapers/naruto.webp";
    }
  }

  const effectiveBgSrc = activePeekWallpaper || bgSrc;
  const { resolvedUrl, isVideo, isMissing } = useWallpaperUrl(effectiveBgSrc);
  const fallbackUrl = isMobile ? "/wallpapers/defaultWallpaper2.jpeg" : (wallpaper || "/wallpapers/naruto.webp");

  const finalUrl = (isMissing || !resolvedUrl) ? fallbackUrl : resolvedUrl;
  const finalIsVideo = (isMissing || !resolvedUrl) ? Boolean(fallbackUrl.match(/\.(mp4|webm)$/i)) : isVideo;

  return (
    <>
      {finalIsVideo ? (
        <video
          key={finalUrl}
          src={finalUrl}
          autoPlay
          muted
          loop
          playsInline
          className="fixed inset-0 w-full h-full object-cover -z-20 transition-opacity duration-1000 opacity-100"
        />
      ) : (
        <img
          key={finalUrl}
          src={finalUrl}
          alt="Wallpaper"
          className="fixed inset-0 w-full h-full object-cover -z-20 transition-opacity duration-1000 opacity-100"
        />
      )}
    </>
  );
}
