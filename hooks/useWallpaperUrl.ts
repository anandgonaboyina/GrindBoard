'use client';

import { useState, useEffect } from 'react';
import { getWallpaperFromDB } from '@/lib/indexedDB';

export function useWallpaperUrl(url: string | null | undefined) {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isMissing, setIsMissing] = useState<boolean>(false);

  useEffect(() => {
    let objectUrl = '';
    let isSubscribed = true;
    
    if (!url) {
      setResolvedUrl('');
      setIsVideo(false);
      setIsMissing(false);
      return;
    }

    // Direct support for data and blob URLs
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      setResolvedUrl(url);
      setIsVideo(url.startsWith('data:video/') ? true : false);
      setIsMissing(false);
      return;
    }

    // Fallback for regular URLs
    setIsVideo(url.match(/\.(mp4|webm)$/i) ? true : false);

    if (url.startsWith('custom-')) {
      const loadCustomBlob = async () => {
        let blob = await getWallpaperFromDB(url);
        if (!blob) {
          // Retry once after 200ms in case IndexedDB transaction is finishing
          await new Promise((r) => setTimeout(r, 200));
          blob = await getWallpaperFromDB(url);
        }
        
        if (!isSubscribed) return;

        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setResolvedUrl(objectUrl);
          setIsVideo(blob.type.startsWith('video/'));
          setIsMissing(false);
        } else {
          setResolvedUrl('');
          setIsVideo(false);
          setIsMissing(true);
        }
      };
      loadCustomBlob();
    } else {
      setResolvedUrl(url);
      setIsMissing(false);
    }

    return () => {
      isSubscribed = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { resolvedUrl, isVideo, isMissing };
}
