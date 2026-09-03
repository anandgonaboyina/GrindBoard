"use client";
import { useState, useEffect } from 'react';
import { useDashboardStore } from "@/store/dashboardStore";
import { useWallpaperUrl } from "@/hooks/useWallpaperUrl";
import { getWallpaperFromDB } from "@/lib/indexedDB";

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

  // Auto-fallback: If the active custom wallpaper is missing (e.g. it's a local file from another device),
  // automatically switch to an existing local wallpaper on this device.
  // We do NOT fallback to a URL wallpaper automatically, to prevent unwanted defaults.
  useEffect(() => {
    if (isMissing && !isPeekActive) {
      const arr = isMobile ? customMobileWallpapers : customDesktopWallpapers;
      const currentIndex = isMobile ? activeMobileCustomIndex : activeDesktopCustomIndex;
      
      if (currentIndex !== null && currentIndex >= 0 && currentIndex < arr.length) {
        const findValidIndex = async () => {
          try {
            // Try to find an existing local wallpaper on this device
            for (let i = 0; i < arr.length; i++) {
               if (i === currentIndex || !arr[i].startsWith('custom-')) continue;
               try {
                 const exists = await getWallpaperFromDB(arr[i]);
                 if (exists) {
                    if (isMobile) useDashboardStore.getState().setActiveMobileCustomIndex(i);
                    else useDashboardStore.getState().setActiveDesktopCustomIndex(i);
                    return;
                 }
               } catch (e) {
                 console.warn("Error checking local wallpaper fallback", e);
               }
            }
          } catch (err) {
            console.error("Error in wallpaper fallback", err);
          }
        };
        
        findValidIndex();
      }
    }
  }, [isMissing, isPeekActive, isMobile, activeMobileCustomIndex, activeDesktopCustomIndex, customMobileWallpapers, customDesktopWallpapers]);

  // Dedicated Peek Mode Wallpaper Auto-Fallback:
  // If Peek Mode is active and the assigned peek wallpaper is missing on this device,
  // automatically find another available custom photo/video on this device and point peekModeWallpaper to it.
  useEffect(() => {
    if (isMissing && isPeekActive) {
      const arr = isMobile ? customMobileWallpapers : customDesktopWallpapers;

      const findValidPeekFallback = async () => {
        try {
          // Try to find any other uploaded custom wallpaper present in this device's IndexedDB
          for (const item of arr) {
            if (item && typeof item === 'string' && item.startsWith('custom-') && item !== peekModeWallpaper) {
              try {
                const exists = await getWallpaperFromDB(item);
                if (exists) {
                  useDashboardStore.getState().setPeekModeWallpaper(item);
                  return;
                }
              } catch (e) {
                console.warn("Error checking local peek wallpaper fallback", e);
              }
            }
          }
        } catch (err) {
          console.error("Error in peek mode wallpaper auto-fallback", err);
        }
      };

      findValidPeekFallback();
    }
  }, [isMissing, isPeekActive, peekModeWallpaper, isMobile, customMobileWallpapers, customDesktopWallpapers, bgSrc]);


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
