import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Move
} from "lucide-react";
import { LazyImage } from "../common/LazyImage";
const ProductImageGallery = ({
  images,
  productName,
  discountPercent = 0,
  featured = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const safeImages = images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80"];
  const activeImage = safeImages[selectedIndex] || safeImages[0];
  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % safeImages.length);
    setZoomScale(1);
  }, [safeImages.length]);
  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    setZoomScale(1);
  }, [safeImages.length]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isZoomModalOpen) return;
      if (e.key === "Escape") {
        setIsZoomModalOpen(false);
        setZoomScale(1);
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "+" || e.key === "=") {
        setZoomScale((prev) => Math.min(prev + 0.5, 4));
      } else if (e.key === "-") {
        setZoomScale((prev) => Math.max(prev - 0.5, 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomModalOpen, handleNext, handlePrev]);
  const openModal = (index) => {
    if (typeof index === "number") {
      setSelectedIndex(index);
    }
    setZoomScale(1.5);
    setIsZoomModalOpen(true);
  };
  const closeModal = () => {
    setIsZoomModalOpen(false);
    setZoomScale(1);
  };
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => setZoomScale(1);
  return <div className="space-y-4">
      {
    /* Main Image Showcase Stage */
  }
      <div
    className="group relative aspect-4/3 sm:aspect-square bg-slate-50/90 rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex items-center justify-center p-4 sm:p-6 select-none cursor-pointer"
    onClick={() => openModal()}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
        {
    /* Active Main Image with Blur-Up Lazy Loading */
  }
        <div className="w-full h-full flex items-center justify-center relative">
          <LazyImage
    src={activeImage}
    alt={`${productName} view ${selectedIndex + 1}`}
    objectFit="contain"
    className="group-hover:scale-105 transition-transform duration-500 max-h-full max-w-full"
    wrapperClassName="w-full h-full flex items-center justify-center"
    priority={true}
  />
        </div>

        {
    /* Badges */
  }
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discountPercent > 0 && <span className="bg-rose-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
              -{discountPercent}% OFF
            </span>}
          {featured && <span className="bg-slate-900/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Featured
            </span>}
        </div>

        {
    /* Image Counter Pill */
  }
        <div className="absolute bottom-3 left-3 bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-xs pointer-events-none">
          {selectedIndex + 1} / {safeImages.length}
        </div>

        {
    /* Interactive Zoom Overlay CTA */
  }
        <div className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-xl shadow-md border border-slate-200/80 backdrop-blur-xs transition-all flex items-center gap-1.5 text-xs font-semibold">
          <Maximize2 className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Click to Zoom</span>
        </div>

        {
    /* Next / Prev Image Controls (On Stage Hover) */
  }
        {safeImages.length > 1 && <>
            <button
    onClick={(e) => {
      e.stopPropagation();
      handlePrev();
    }}
    aria-label="Previous Image"
    className={`absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 transition-all ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90 sm:opacity-75"}`}
  >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
    onClick={(e) => {
      e.stopPropagation();
      handleNext();
    }}
    aria-label="Next Image"
    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 transition-all ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90 sm:opacity-75"}`}
  >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>}
      </div>

      {
    /* Multiple Image View Thumbnails */
  }
      {safeImages.length > 1 && <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {safeImages.map((img, idx) => <button
    key={idx}
    onClick={() => {
      setSelectedIndex(idx);
      setZoomScale(1);
    }}
    className={`relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all p-1 bg-white cursor-pointer ${selectedIndex === idx ? "border-blue-600 ring-2 ring-blue-500/20 shadow-xs" : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"}`}
  >
              <LazyImage
    src={img}
    alt={`${productName} thumbnail ${idx + 1}`}
    objectFit="contain"
    className="w-full h-full"
    wrapperClassName="w-full h-full rounded-lg overflow-hidden bg-slate-50"
  />
              {selectedIndex === idx && <div className="absolute inset-0 border-2 border-blue-600 rounded-xl pointer-events-none" />}
            </button>)}
        </div>}

      {
    /* Custom Modal for Interactive High-Resolution Image Zoom */
  }
      <AnimatePresence>
        {isZoomModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
            {
    /* Backdrop */
  }
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={closeModal}
    className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
  />

            {
    /* Modal Container */
  }
            <motion.div
    initial={{ opacity: 0, scale: 0.94 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.94 }}
    transition={{ type: "spring", damping: 25, stiffness: 300 }}
    className="relative w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10"
  >
              {
    /* Header Bar with Product Title & Controls */
  }
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4 z-20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                    Detail Zoom
                  </span>
                  <h3 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                    {productName}
                  </h3>
                  <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    {selectedIndex + 1} / {safeImages.length}
                  </span>
                </div>

                {
    /* Floating Zoom & Close Controls */
  }
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
    onClick={handleZoomOut}
    disabled={zoomScale <= 1}
    title="Zoom Out (-)"
    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <div className="px-2.5 py-1 text-xs font-mono font-bold text-blue-400 bg-slate-800/80 rounded-xl min-w-13 text-center">
                    {Math.round(zoomScale * 100)}%
                  </div>

                  <button
    onClick={handleZoomIn}
    disabled={zoomScale >= 4}
    title="Zoom In (+)"
    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
    onClick={handleResetZoom}
    title="Reset Zoom (1x)"
    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <div className="w-px h-6 bg-slate-800 mx-1" />

                  <button
    onClick={closeModal}
    title="Close (Esc)"
    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all cursor-pointer"
  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {
    /* Central Zoom Canvas / Stage */
  }
              <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden p-4 select-none">
                {
    /* Navigation Arrows */
  }
                {safeImages.length > 1 && <>
                    <button
    onClick={handlePrev}
    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-800/80 hover:bg-blue-600 text-white shadow-lg backdrop-blur-md transition-all cursor-pointer"
    title="Previous (Left Arrow)"
  >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
    onClick={handleNext}
    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-800/80 hover:bg-blue-600 text-white shadow-lg backdrop-blur-md transition-all cursor-pointer"
    title="Next (Right Arrow)"
  >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>}

                {
    /* Drag / Pan hint when zoomed */
  }
                {zoomScale > 1 && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-800/90 border border-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md pointer-events-none">
                    <Move className="w-3.5 h-3.5 text-blue-400" />
                    <span>Drag image to pan around details</span>
                  </div>}

                {
    /* Zoomable & Draggable Image */
  }
                <motion.div
    drag={zoomScale > 1}
    dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
    dragElastic={0.1}
    className={`w-full h-full flex items-center justify-center ${zoomScale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
    onClick={() => {
      if (zoomScale === 1) {
        setZoomScale(2);
      }
    }}
    onDoubleClick={() => {
      setZoomScale((prev) => prev > 1 ? 1 : 2.5);
    }}
  >
                  <motion.img
    key={activeImage}
    src={activeImage}
    alt={productName}
    referrerPolicy="no-referrer"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{
      opacity: 1,
      scale: zoomScale
    }}
    transition={{
      opacity: { duration: 0.25 },
      scale: { type: "spring", damping: 20, stiffness: 220 }
    }}
    className="max-h-[72vh] max-w-[85vw] object-contain select-none"
    draggable={false}
  />
                </motion.div>
              </div>

              {
    /* Bottom Filmstrip Thumbnails in Modal */
  }
              {safeImages.length > 1 && <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-center gap-2 overflow-x-auto z-20">
                  {safeImages.map((img, idx) => <button
    key={idx}
    onClick={() => {
      setSelectedIndex(idx);
      setZoomScale(1);
    }}
    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-slate-900 ${selectedIndex === idx ? "border-blue-500 scale-105 shadow-md shadow-blue-500/20" : "border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700"}`}
  >
                      <img
    src={img}
    alt=""
    referrerPolicy="no-referrer"
    className="w-full h-full object-contain"
  />
                    </button>)}
                </div>}
            </motion.div>
          </div>}
      </AnimatePresence>
    </div>;
};
export {
  ProductImageGallery
};
