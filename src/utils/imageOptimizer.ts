/**
 * Image processing and optimization utility
 * Ensures photos selected from mobile cameras (10MB-50MB / high-resolution)
 * are downscaled safely and converted to web-standard format to prevent
 * memory crashes, infinite loading, and lag in the crop modal and avatar rendering.
 */

export async function optimizeImageForCrop(file: File | Blob | string, maxDimension = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      let objectUrlToRevoke: string | null = null;
      let src = '';

      if (typeof file === 'string') {
        src = file;
      } else {
        objectUrlToRevoke = URL.createObjectURL(file);
        src = objectUrlToRevoke;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const nw = img.naturalWidth || img.width;
          const nh = img.naturalHeight || img.height;

          // If image is already reasonably sized, return a data URL directly or clean jpeg
          if (nw <= maxDimension && nh <= maxDimension && typeof file === 'string' && file.startsWith('data:image/')) {
            if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
            resolve(file);
            return;
          }

          // Calculate downscaled dimensions preserving aspect ratio
          let targetW = nw;
          let targetH = nh;

          if (nw > maxDimension || nh > maxDimension) {
            if (nw >= nh) {
              targetW = maxDimension;
              targetH = Math.round((nh * maxDimension) / nw);
            } else {
              targetH = maxDimension;
              targetW = Math.round((nw * maxDimension) / nh);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, targetW);
          canvas.height = Math.max(1, targetH);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
            // Fallback to FileReader if canvas context fails
            if (typeof file === 'string') {
              resolve(file);
            } else {
              const reader = new FileReader();
              reader.onload = (e) => resolve((e.target?.result as string) || '');
              reader.onerror = () => reject(new Error('Failed to read image'));
              reader.readAsDataURL(file);
            }
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve(optimizedDataUrl);
        } catch (err) {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          // In case canvas conversion errors, fallback to raw data URL
          if (typeof file === 'string') {
            resolve(file);
          } else {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          }
        }
      };

      img.onerror = () => {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        // If createObjectURL fails or format is unsupported, fallback to FileReader
        if (typeof file !== 'string') {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        } else {
          resolve(file);
        }
      };

      img.src = src;
    } catch (e) {
      // Safe fallback
      if (typeof file === 'string') {
        resolve(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      }
    }
  });
}
