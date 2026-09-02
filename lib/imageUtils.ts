/**
 * Utility for preparing uploaded media files for local storage.
 *
 * IMPORTANT: Local file uploads are stored ONLY in the browser's IndexedDB.
 * We NEVER save base64/data-URL strings to Zustand state or the cloud DB —
 * those payloads are too large (MBs) and would bloat MongoDB and break sync.
 * Only remote http(s) URLs are allowed in the cloud-synced arrays.
 */
export async function prepareFileForStorage(file: File, prefix: string = 'custom'): Promise<{
  id: string;
  dataUrl?: string;
  isDataUrl: boolean;
}> {
  const timestamp = Date.now();
  const id = `${prefix}-${timestamp}`;

  // Always store as local IndexedDB key — never as a base64 data URL in the store.
  return {
    id,
    isDataUrl: false,
  };
}

/**
 * Compress an image File to a lightweight WebP Data URL string
 */
export function compressImageToDataUrl(
  file: File,
  maxWidth: number = 1280,
  maxHeight: number = 720,
  quality: number = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        resolve(webpDataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
