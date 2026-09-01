/**
 * Utility for compressing images for cross-device cloud sync and IndexedDB backup
 */
export async function prepareFileForStorage(file: File, prefix: string = 'custom'): Promise<{
  id: string;
  dataUrl?: string;
  isDataUrl: boolean;
}> {
  const timestamp = Date.now();
  const id = `${prefix}-${timestamp}`;

  // If it's an image, compress to lightweight WebP Data URL for universal cloud sync
  if (file.type.startsWith('image/')) {
    try {
      const dataUrl = await compressImageToDataUrl(file, 1280, 720, 0.6);
      // Ensure dataUrl is under 400KB to keep cloud sync fast and avoid Vercel/localStorage quota crashes
      if (dataUrl && dataUrl.length < 400 * 1024) {
        return {
          id,
          dataUrl,
          isDataUrl: true,
        };
      }
    } catch (err) {
      console.warn('Image compression warning, falling back to local ID:', err);
    }
  }

  // For videos or large files, return the IndexedDB key
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
