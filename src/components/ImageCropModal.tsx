import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crop,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  title?: string;
  initialShape?: 'circle' | 'square' | 'document';
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  title = 'ফটো Crop কৰক (Crop Photo)',
  initialShape = 'circle',
}) => {
  const [zoomPercent, setZoomPercent] = useState(0); // 0% to 100%
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseStart, setMouseStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 400, height: 400 });
  const [aspectShape, setAspectShape] = useState<'circle' | 'square' | 'document'>(initialShape);
  const [isPinching, setIsPinching] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Multi-touch tracking ref for 2-finger pinch and 1-finger drag
  const touchState = useRef<{
    isPinch: boolean;
    initialDistance: number;
    initialZoomPercent: number;
    initialPan: { x: number; y: number };
    startCenter: { x: number; y: number };
    isDrag: boolean;
    startPoint: { x: number; y: number };
  }>({
    isPinch: false,
    initialDistance: 0,
    initialZoomPercent: 0,
    initialPan: { x: 0, y: 0 },
    startCenter: { x: 0, y: 0 },
    isDrag: false,
    startPoint: { x: 0, y: 0 },
  });

  const CROP_BOX_W = aspectShape === 'document' ? 280 : 260;
  const CROP_BOX_H = aspectShape === 'document' ? 185 : 260;

  // 0% -> 1.0 (100% full original photo visible), 100% -> 3.5 (zoom in up to 3.5x)
  const zoomScale = 1 + (zoomPercent / 100) * 2.5;

  // Calculate base dimensions so the entire original photo fits at 0% zoom
  const nw = naturalDimensions.width || 400;
  const nh = naturalDimensions.height || 400;
  const isSideways = rotation % 180 !== 0;
  const effectiveWidth = isSideways ? nh : nw;
  const effectiveHeight = isSideways ? nw : nh;
  const baseFitScale = Math.min(CROP_BOX_W / effectiveWidth, CROP_BOX_H / effectiveHeight);
  const baseW = Math.round(nw * baseFitScale);
  const baseH = Math.round(nh * baseFitScale);

  // Reset parameters whenever a new image is loaded or modal opened
  useEffect(() => {
    if (!isOpen) return;

    setZoomPercent(0);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setLoadError(false);
    setAspectShape(initialShape);
    setIsPinching(false);

    if (!imageSrc || imageSrc.trim() === '') {
      setImageLoaded(false);
      setLoadError(true);
      return;
    }

    // Check if image is already cached / complete in DOM
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setNaturalDimensions({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      });
      setImageLoaded(true);
      return;
    }

    setImageLoaded(false);

    // Probe image with background loader to guarantee detection
    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.onload = () => {
      if (probe.naturalWidth && probe.naturalHeight) {
        setNaturalDimensions({
          width: probe.naturalWidth,
          height: probe.naturalHeight,
        });
      }
      setImageLoaded(true);
      setLoadError(false);
    };
    probe.onerror = () => {
      setLoadError(true);
    };
    probe.src = imageSrc;

    if (probe.complete && probe.naturalWidth > 0) {
      setNaturalDimensions({
        width: probe.naturalWidth,
        height: probe.naturalHeight,
      });
      setImageLoaded(true);
    }

    const timer = setTimeout(() => {
      if (imgRef.current && imgRef.current.naturalWidth > 0) {
        setImageLoaded(true);
      } else if (!probe.complete) {
        setLoadError(true);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      probe.onload = null;
      probe.onerror = null;
    };
  }, [isOpen, imageSrc, initialShape]);

  // TOUCH GESTURE HANDLING: Multi-touch pinch-to-zoom and drag
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Two fingers: Pinch to zoom in / zoom out
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      touchState.current = {
        isPinch: true,
        initialDistance: Math.max(10, dist),
        initialZoomPercent: zoomPercent,
        initialPan: { ...pan },
        startCenter: center,
        isDrag: false,
        startPoint: { x: 0, y: 0 },
      };
      setIsPinching(true);
    } else if (e.touches.length === 1) {
      // Single finger: Drag / pan photo
      const t = e.touches[0];
      touchState.current = {
        isPinch: false,
        initialDistance: 0,
        initialZoomPercent: zoomPercent,
        initialPan: { ...pan },
        startCenter: { x: 0, y: 0 },
        isDrag: true,
        startPoint: { x: t.clientX - pan.x, y: t.clientY - pan.y },
      };
      setIsPinching(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchState.current.isPinch) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const distanceRatio = currentDist / touchState.current.initialDistance;

      // Map touch distance ratio smoothly to zoom percentage (0% - 100%)
      const deltaPercent = (distanceRatio - 1) * 90;
      const nextZoom = Math.min(100, Math.max(0, touchState.current.initialZoomPercent + deltaPercent));
      setZoomPercent(Math.round(nextZoom));

      // Dual-finger panning
      const currentCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      const dx = currentCenter.x - touchState.current.startCenter.x;
      const dy = currentCenter.y - touchState.current.startCenter.y;
      setPan({
        x: Math.round(touchState.current.initialPan.x + dx),
        y: Math.round(touchState.current.initialPan.y + dy),
      });
    } else if (e.touches.length === 1 && touchState.current.isDrag) {
      e.preventDefault();
      const t = e.touches[0];
      setPan({
        x: Math.round(t.clientX - touchState.current.startPoint.x),
        y: Math.round(t.clientY - touchState.current.startPoint.y),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchState.current.isPinch = false;
      setIsPinching(false);
    }
    if (e.touches.length === 0) {
      touchState.current.isDrag = false;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      touchState.current.isDrag = true;
      touchState.current.startPoint = { x: t.clientX - pan.x, y: t.clientY - pan.y };
    }
  };

  // MOUSE DESKTOP DRAG
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMouseDown(true);
    setMouseStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown) return;
    setPan({
      x: e.clientX - mouseStart.x,
      y: e.clientY - mouseStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    setZoomPercent((prev) => Math.min(100, Math.max(0, prev + delta)));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoomPercent(0);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Perform precise off-screen canvas crop
  const executeCrop = useCallback(() => {
    const img = imgRef.current;
    
    // Safety: If img is not loaded or missing dimensions, fallback to original image
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      if (imageSrc) {
        onCropComplete(imageSrc);
      }
      onClose();
      return;
    }

    try {
      const outputW = aspectShape === 'document' ? 640 : 400;
      const outputH = aspectShape === 'document' ? 424 : 400;

      const canvas = document.createElement('canvas');
      canvas.width = outputW;
      canvas.height = outputH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (imageSrc) onCropComplete(imageSrc);
        onClose();
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Center origin on output canvas
      ctx.translate(outputW / 2, outputH / 2);

      // Fill neutral dark canvas background
      ctx.fillStyle = '#020617';
      ctx.fillRect(-outputW / 2, -outputH / 2, outputW, outputH);

      // Scaling ratio between preview box and export resolution
      const scaleFactor = outputW / CROP_BOX_W;

      // 1. Pan offset matching preview screen space
      ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);

      // 2. Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // 3. Scale canvas according to zoomScale
      ctx.scale(zoomScale * scaleFactor, zoomScale * scaleFactor);

      // 4. Draw base fitted image centered
      ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedDataUrl);
      onClose();
    } catch {
      // Fallback on any canvas security/taint error
      if (imageSrc) {
        onCropComplete(imageSrc);
      }
      onClose();
    }
  }, [rotation, zoomScale, pan, CROP_BOX_W, CROP_BOX_H, baseW, baseH, imageSrc, aspectShape, onCropComplete, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Crop className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{title}</h3>
                <p className="text-[11px] text-slate-400">Drag to move • Pinch/Slider to zoom</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pinch-to-zoom interactive prompt banner */}
          <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-center text-[11px] text-amber-300 font-medium flex items-center justify-center gap-1.5">
            <span>👆 দুটা আঙুলিৰে Zoom In / Out কৰক (Pinch to zoom)</span>
          </div>

          {/* Crop Viewport */}
          <div className="p-4 flex flex-col items-center select-none">
            <div
              ref={containerRef}
              style={{ width: CROP_BOX_W, height: CROP_BOX_H }}
              className="relative overflow-hidden bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* Image being dragged/zoomed/rotated */}
              {imageSrc && (
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={(e) => {
                    const target = e.currentTarget;
                    if (target.naturalWidth && target.naturalHeight) {
                      setNaturalDimensions({
                        width: target.naturalWidth,
                        height: target.naturalHeight,
                      });
                    }
                    setImageLoaded(true);
                    setLoadError(false);
                  }}
                  onError={() => {
                    setLoadError(true);
                  }}
                  draggable={false}
                  style={{
                    width: `${baseW}px`,
                    height: `${baseH}px`,
                    minWidth: `${baseW}px`,
                    minHeight: `${baseH}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoomScale})`,
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    opacity: imageLoaded ? 1 : 0,
                  }}
                  className="transition-opacity duration-150 will-change-transform"
                />
              )}

              {/* Floating Zoom Indicator while pinching or adjusting */}
              {imageLoaded && (
                <div
                  className={`absolute top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/85 border border-amber-400/80 text-amber-300 font-mono text-[10px] font-bold shadow-md pointer-events-none transition-all duration-150 flex items-center gap-1 backdrop-blur-sm z-20 ${
                    isPinching ? 'scale-110 ring-2 ring-amber-400' : 'opacity-90'
                  }`}
                >
                  <ZoomIn className="w-3 h-3 text-amber-400" />
                  <span>{zoomScale.toFixed(1)}x</span>
                  <span className="text-amber-400/70">({zoomPercent}%)</span>
                </div>
              )}

              {/* Crop Overlay Mask (Circular, Square, or Document Rectangle) */}
              {imageLoaded && (
                <div
                  className={`absolute inset-0 pointer-events-none border-2 border-amber-400/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.74)] ${
                    aspectShape === 'circle'
                      ? 'rounded-full'
                      : aspectShape === 'document'
                      ? 'rounded-lg'
                      : 'rounded-xl'
                  }`}
                >
                  {/* Rule of Thirds grid lines inside crop mask */}
                  <div className="w-full h-full relative opacity-25">
                    <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-white/70" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-white/70" />
                    <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-white/70" />
                    <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-white/70" />
                  </div>
                </div>
              )}

              {/* Loading State Spinner */}
              {!imageLoaded && !loadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-slate-300 text-xs gap-2.5 p-4 text-center">
                  <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                  <span className="font-medium">ফটো প্ৰস্তুত কৰা হৈছে...</span>
                  <span className="text-[10px] text-slate-400">Loading photo preview</span>
                  {/* Quick fallback button if user doesn't want to wait */}
                  <button
                    type="button"
                    onClick={() => {
                      if (imageSrc) onCropComplete(imageSrc);
                      onClose();
                    }}
                    className="mt-2 text-[11px] text-amber-300 underline hover:text-amber-200 cursor-pointer"
                  >
                    ক্ৰপ নকৰাকৈ ব্যৱহাৰ কৰক
                  </button>
                </div>
              )}

              {/* Error State with Graceful Recovery */}
              {loadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-slate-300 text-xs gap-2 p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <span className="font-semibold text-white">ফটো প্ৰিভিউ ল'ড কৰাত সমস্যা হৈছে</span>
                  <p className="text-[11px] text-slate-400 max-w-[220px]">
                    আপুনি ফটোখন ক্ৰপ নকৰাকৈ পোনে পোনে ব্যৱহাৰ কৰিব পাৰে:
                  </p>
                  <div className="flex flex-col gap-2 mt-2 w-full px-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (imageSrc) onCropComplete(imageSrc);
                        onClose();
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      মূল ফটোখন সংৰক্ষণ কৰক
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                    >
                      বাতিল কৰক
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shape toggles: Circular (Avatar), Square, or Document */}
            <div className="flex items-center gap-1.5 mt-3">
              <button
                type="button"
                onClick={() => setAspectShape('circle')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  aspectShape === 'circle'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Circle (প্ৰফাইল)
              </button>
              <button
                type="button"
                onClick={() => setAspectShape('square')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  aspectShape === 'square'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Square (বৰ্গাকাৰ)
              </button>
              <button
                type="button"
                onClick={() => setAspectShape('document')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  aspectShape === 'document'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Doc (আয়তাকাৰ)
              </button>
            </div>
          </div>

          {/* Controls: Zoom & Rotate */}
          <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800/80 space-y-3">
            {/* Zoom Slider (0% to 100%) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoomPercent((prev) => Math.max(0, prev - 10))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={zoomPercent}
                  onChange={(e) => setZoomPercent(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-[11px] font-mono text-amber-300/90 font-medium w-10 text-right">
                  {zoomPercent}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => setZoomPercent((prev) => Math.min(100, prev + 10))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions: Rotate 90° & Reset */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Rotate 90° ({rotation}°)</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: Apply / Cancel */}
          <div className="p-4 border-t border-slate-800 flex gap-2.5 bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="button"
              onClick={executeCrop}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              ফটো Crop কৰক (Done)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

