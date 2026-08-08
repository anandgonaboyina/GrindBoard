'use client';

import { useState, useEffect } from 'react';
import { getAudioFromDB } from '@/lib/indexedDB';

export function useAudioUrl(url: string | null | undefined) {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');

  useEffect(() => {
    let objectUrl = '';

    if (!url) {
      setResolvedUrl('');
      return;
    }

    if (url.startsWith('custom-audio-')) {
      getAudioFromDB(url).then(blob => {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setResolvedUrl(objectUrl);
        } else {
          // Fallback to default ringtone if missing on local device
          setResolvedUrl('/ringtones/narutoBGM.mp3');
        }
      });
    } else {
      setResolvedUrl(url);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return resolvedUrl;
}

export async function getResolvedAudioUrl(url: string | null | undefined): Promise<string> {
  if (!url) return '';
  if (url.startsWith('custom-audio-')) {
    try {
      const blob = await getAudioFromDB(url);
      if (blob) {
        return URL.createObjectURL(blob);
      }
    } catch (_) {}
    return '/ringtones/narutoBGM.mp3';
  }
  return url;
}
