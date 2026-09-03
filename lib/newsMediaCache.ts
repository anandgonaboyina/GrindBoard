import type { NewsPost } from '@/components/admin/News/AdminNewsManager';

const CACHE_NAME = 'grindboard-news-media-v1';

/**
 * Pre-caches news media (videos, images) into browser CacheStorage before the modal opens,
 * and automatically deletes cached files when their news cards are removed.
 */
export async function syncNewsMediaCache(newsPosts: NewsPost[]) {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cache = await caches.open(CACHE_NAME);

    // 1. Collect all active media URLs from currently active news posts
    const activeMediaUrls = new Set<string>();
    newsPosts.forEach(post => {
      if (post.media?.videoUrl) {
        activeMediaUrls.add(post.media.videoUrl.trim());
      }
      if (post.media?.imageUrl) {
        activeMediaUrls.add(post.media.imageUrl.trim());
      }
    });

    // 2. Pre-cache missing active media assets in background
    for (const url of Array.from(activeMediaUrls)) {
      try {
        const match = await cache.match(url);
        if (!match) {
          // Pre-fetch asset for instant offline & poor connection playback
          fetch(url, { mode: 'no-cors' })
            .then(res => {
              if (res.ok || res.type === 'opaque') {
                cache.put(url, res);
                console.log('[NewsCache] Successfully pre-cached news media:', url);
              }
            })
            .catch((e) => {
              // Silently handle offline/network errors
            });
        }
      } catch (err) {
        console.error('[NewsCache] Error pre-caching news media item:', err);
      }
    }

    // 3. Delete obsolete cached media when news card/post is removed
    const cachedRequests = await cache.keys();
    for (const request of cachedRequests) {
      if (!activeMediaUrls.has(request.url)) {
        await cache.delete(request);
        console.log('[NewsCache] Evicted removed news media asset:', request.url);
      }
    }
  } catch (e) {
    console.error('[NewsCache] Failed to sync news media cache:', e);
  }
}
