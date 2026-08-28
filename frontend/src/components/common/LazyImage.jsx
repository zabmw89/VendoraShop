import { useState, useEffect, useRef } from "react";
import { ImageOff } from "lucide-react";

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80";

const LazyImage = ({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  aspectRatio,
  objectFit = "cover",
  onClick,
  priority = false,
  blurDataUrl,
  draggable = false,
  fallback = DEFAULT_FALLBACK_IMAGE
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallback);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [attemptedFallback, setAttemptedFallback] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const targetSrc = src || fallback;
    setImageSrc(targetSrc);
    setHasError(false);
    setAttemptedFallback(false);

    // If image is already in browser cache and complete, mark loaded immediately
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src, fallback]);

  const fitClasses = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none"
  }[objectFit] || "object-cover";

  const handleImageError = () => {
    if (!attemptedFallback && fallback && imageSrc !== fallback) {
      setAttemptedFallback(true);
      setImageSrc(fallback);
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-slate-100 ${
        aspectRatio ? `aspect-[${aspectRatio}]` : ""
      } ${wrapperClassName}`}
    >
      {/* Placeholder / Shimmer Backdrop */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-linear-to-tr from-slate-200 via-slate-100 to-slate-200 flex items-center justify-center z-0 animate-pulse">
          {blurDataUrl ? (
            <img
              src={blurDataUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover filter blur-lg scale-110 opacity-70"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-300/60 animate-ping" />
          )}
        </div>
      )}

      {/* Error state */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center z-10">
          <ImageOff className="w-6 h-6 mb-1 text-slate-400" />
          <span className="text-[10px] text-slate-400 font-medium line-clamp-1">
            Image unavailable
          </span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          draggable={draggable}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full ${fitClasses} transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
        />
      )}
    </div>
  );
};

export { LazyImage };
