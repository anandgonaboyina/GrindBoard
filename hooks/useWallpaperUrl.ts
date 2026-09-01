'use client';

import { useState, useEffect } from 'react';
import { getWallpaperFromDB } from '@/lib/indexedDB';

export function useWallpaperUrl(url: string | null | undefined) {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [isVideo, setIsVideo] = useState<boolean>(false);

  useEffect(() => {
    let objectUrl = '';
    
    if (!url) {
      setResolvedUrl('');
      setIsVideo(false);
      return;
    }

    // Direct support for data and blob URLs
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      setResolvedUrl(url);
      setIsVideo(url.startsWith('data:video/') ? true : false);
      return;
    }

    // Fallback for regular URLs
    setIsVideo(url.match(/\.(mp4|webm)$/i) ? true : false);

    if (url.startsWith('custom-')) {
      getWallpaperFromDB(url).then(blob => {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setResolvedUrl(objectUrl);
          setIsVideo(blob.type.startsWith('video/'));
        } else {
          // If a custom local file is synced from another device but doesn't exist here, use fallback
          const isMobile = window.innerWidth <= 768;
          setResolvedUrl(isMobile ? "/wallpapers/defaultWallpaper2.jpeg" : "/wallpapers/naruto.webp");
          setIsVideo(false);
        }
      });
    } else {
      setResolvedUrl(url);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { resolvedUrl, isVideo };
}
