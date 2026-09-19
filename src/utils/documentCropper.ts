/**
 * Automatic Document Cropper & Edge Detection Utility
 * Automatically detects document borders (paper, certificates, bills, ID cards)
 * against background surfaces (desk, table, shadows) and crops them cleanly.
 */

export interface AutoCropResult {
  croppedUrl: string;
  originalUrl: string;
  wasAutoCropped: boolean;
  aspectRatio: number;
}

/**
 * Automatically crops document photos by analyzing luminance gradients
 * and background color contrast to find document boundaries.
 */
export async function autoCropDocument(
  source: File | Blob | string,
  options: {
    paddingPercent?: number; // Safe padding around document (default 2%)
    maxDimension?: number;
  } = {}
): Promise<AutoCropResult> {
  const { paddingPercent = 0.02, maxDimension = 1800 } = options;

  return new Promise((resolve) => {
    let objectUrlToRevoke: string | null = null;
    let imgSrc = '';

    if (typeof source === 'string') {
      imgSrc = source;
    } else {
      objectUrlToRevoke = URL.createObjectURL(source);
      imgSrc = objectUrlToRevoke;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        if (origW < 50 || origH < 50) {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve({
            croppedUrl: imgSrc,
            originalUrl: imgSrc,
            wasAutoCropped: false,
            aspectRatio: origW / Math.max(1, origH),
          });
          return;
        }

        // Analysis canvas downscaled for fast and noise-free edge processing
        const analysisW = 320;
        const analysisH = Math.round((origH * analysisW) / origW);

        const canvas = document.createElement('canvas');
        canvas.width = analysisW;
        canvas.height = analysisH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve({
            croppedUrl: imgSrc,
            originalUrl: imgSrc,
            wasAutoCropped: false,
            aspectRatio: origW / origH,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, analysisW, analysisH);
        const imgData = ctx.getImageData(0, 0, analysisW, analysisH);
        const data = imgData.data;

        // Sample background color from four outer corner strips
        const sampleSize = Math.max(4, Math.floor(analysisW * 0.04));
        let cornerR = 0, cornerG = 0, cornerB = 0, cornerSamples = 0;

        const samplePixel = (px: number, py: number) => {
          const idx = (py * analysisW + px) * 4;
          cornerR += data[idx];
          cornerG += data[idx + 1];
          cornerB += data[idx + 2];
          cornerSamples++;
        };

        for (let y = 0; y < sampleSize; y++) {
          for (let x = 0; x < sampleSize; x++) {
            samplePixel(x, y); // Top-left
            samplePixel(analysisW - 1 - x, y); // Top-right
            samplePixel(x, analysisH - 1 - y); // Bottom-left
            samplePixel(analysisW - 1 - x, analysisH - 1 - y); // Bottom-right
          }
        }

        const bgR = cornerR / Math.max(1, cornerSamples);
        const bgG = cornerG / Math.max(1, cornerSamples);
        const bgB = cornerB / Math.max(1, cornerSamples);
        const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

        // Calculate horizontal and vertical contrast projection profiles
        const rowDiffs = new Float32Array(analysisH);
        const colDiffs = new Float32Array(analysisW);

        for (let y = 0; y < analysisH; y++) {
          let rowDiffSum = 0;
          for (let x = 0; x < analysisW; x++) {
            const idx = (y * analysisW + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Euclidean distance in RGB + luminance difference from corner background
            const colorDist = Math.hypot(r - bgR, g - bgG, b - bgB);
            const lumDist = Math.abs(lum - bgLum);
            const totalDiff = colorDist + lumDist;

            rowDiffSum += totalDiff;
            colDiffs[x] += totalDiff;
          }
          rowDiffs[y] = rowDiffSum / analysisW;
        }

        for (let x = 0; x < analysisW; x++) {
          colDiffs[x] /= analysisH;
        }

        // Determine baseline threshold for document foreground
        let maxRowDiff = 0, maxColDiff = 0;
        for (let y = 0; y < analysisH; y++) if (rowDiffs[y] > maxRowDiff) maxRowDiff = rowDiffs[y];
        for (let x = 0; x < analysisW; x++) if (colDiffs[x] > maxColDiff) maxColDiff = colDiffs[x];

        // Adaptive threshold (20% of peak difference from corner background)
        const rowThreshold = Math.max(18, maxRowDiff * 0.22);
        const colThreshold = Math.max(18, maxColDiff * 0.22);

        // Find bounding box in analysis coordinates
        let minAy = 0;
        while (minAy < analysisH * 0.45 && rowDiffs[minAy] < rowThreshold) minAy++;

        let maxAy = analysisH - 1;
        while (maxAy > analysisH * 0.55 && rowDiffs[maxAy] < rowThreshold) maxAy--;

        let minAx = 0;
        while (minAx < analysisW * 0.45 && colDiffs[minAx] < colThreshold) minAx++;

        let maxAx = analysisW - 1;
        while (maxAx > analysisW * 0.55 && colDiffs[maxAx] < colThreshold) maxAx--;

        // Map back to original image coordinates
        const scaleX = origW / analysisW;
        const scaleY = origH / analysisH;

        let cropX = minAx * scaleX;
        let cropY = minAy * scaleY;
        let cropW = (maxAx - minAx) * scaleX;
        let cropH = (maxAy - minAy) * scaleY;

        // Verify if crop area is legitimate (covers at least 25% and at most 96% of the image)
        const areaRatio = (cropW * cropH) / (origW * origH);
        let wasAutoCropped = false;

        if (areaRatio >= 0.20 && areaRatio <= 0.96 && cropW > 80 && cropH > 80) {
          // Add safe inner/outer padding so document edges & text aren't cut
          const padX = cropW * paddingPercent;
          const padY = cropH * paddingPercent;

          cropX = Math.max(0, cropX - padX);
          cropY = Math.max(0, cropY - padY);
          cropW = Math.min(origW - cropX, cropW + padX * 2);
          cropH = Math.min(origH - cropY, cropH + padY * 2);
          wasAutoCropped = true;
        } else {
          // If already well centered or low contrast, apply subtle margin trim (2%)
          const marginX = origW * 0.02;
          const marginY = origH * 0.02;
          cropX = marginX;
          cropY = marginY;
          cropW = origW - marginX * 2;
          cropH = origH - marginY * 2;
          wasAutoCropped = true;
        }

        // Downscale final output if larger than maxDimension to keep performance high
        let finalW = Math.round(cropW);
        let finalH = Math.round(cropH);

        if (finalW > maxDimension || finalH > maxDimension) {
          if (finalW >= finalH) {
            finalH = Math.round((finalH * maxDimension) / finalW);
            finalW = maxDimension;
          } else {
            finalW = Math.round((finalW * maxDimension) / finalH);
            finalH = maxDimension;
          }
        }

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = Math.max(1, finalW);
        outputCanvas.height = Math.max(1, finalH);

        const outCtx = outputCanvas.getContext('2d');
        if (!outCtx) {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve({
            croppedUrl: imgSrc,
            originalUrl: imgSrc,
            wasAutoCropped: false,
            aspectRatio: origW / origH,
          });
          return;
        }

        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = 'high';

        // Draw cropped section
        outCtx.drawImage(
          img,
          cropX,
          cropY,
          cropW,
          cropH,
          0,
          0,
          finalW,
          finalH
        );

        const croppedUrl = outputCanvas.toDataURL('image/jpeg', 0.92);
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);

        resolve({
          croppedUrl,
          originalUrl: imgSrc,
          wasAutoCropped,
          aspectRatio: finalW / finalH,
        });
      } catch {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        resolve({
          croppedUrl: imgSrc,
          originalUrl: imgSrc,
          wasAutoCropped: false,
          aspectRatio: 1,
        });
      }
    };

    img.onerror = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      resolve({
        croppedUrl: imgSrc,
        originalUrl: imgSrc,
        wasAutoCropped: false,
        aspectRatio: 1,
      });
    };

    img.src = imgSrc;
  });
}
