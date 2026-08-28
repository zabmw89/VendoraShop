import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Award } from "lucide-react";
import homeHeroImg from "../../assets/images/homepage_hero_banner_1787123505764.jpg";
import productHeroImg from "../../assets/images/product_detail_hero_1787123518366.jpg";

const FALLBACK_HOME_HERO = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80";
const FALLBACK_PRODUCT_HERO = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80";

const HeroImage = ({
  variant = "home",
  src,
  badgeText,
  title,
  subtitle,
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  highlightCard,
  className = "",
  compact = false
}) => {
  const defaultImage = variant === "product-details" 
    ? (productHeroImg || FALLBACK_PRODUCT_HERO) 
    : (homeHeroImg || FALLBACK_HOME_HERO);

  const [imageSource, setImageSource] = useState(src || defaultImage);

  useEffect(() => {
    setImageSource(src || defaultImage);
  }, [src, defaultImage]);

  const defaultBadge = variant === "product-details" ? "Precision Studio Series" : "Curated Spring 2026 Collection";
  const defaultTitle = variant === "product-details" ? "Engineered for Performance & Aesthetic Clarity" : "Next-Generation Gear for Modern Living";
  const defaultSubtitle = variant === "product-details" 
    ? "Explore meticulously crafted studio equipment and lifestyle essentials with verified 2-year warranty coverage." 
    : "Discover flagship wireless acoustics, precision workstations, biometric wearables, and minimalist travel essentials.";

  const displayBadge = badgeText || defaultBadge;
  const displayTitle = title || defaultTitle;
  const displaySubtitle = subtitle || defaultSubtitle;

  const handleHeroImageError = () => {
    const fallback = variant === "product-details" ? FALLBACK_PRODUCT_HERO : FALLBACK_HOME_HERO;
    if (imageSource !== fallback) {
      setImageSource(fallback);
    }
  };

  const cardImage = highlightCard?.image || imageSource;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-2xl bg-slate-950 text-white ${className}`}
    >
      {/* Background Image Container with Gradient & Ambient Lighting */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.img
          src={imageSource}
          alt={displayTitle}
          referrerPolicy="no-referrer"
          onError={handleHeroImageError}
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.42 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />

        {/* Ambient layered overlays for readable text and brand contrast */}
        <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/85 to-transparent sm:w-3/4 z-10" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-10" />
      </div>

      {/* Content Layout */}
      <div
        className={`relative z-20 max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 ${highlightCard ? "lg:grid-cols-12" : "lg:grid-cols-10"} gap-8 items-center ${compact ? "py-8 sm:py-10" : "py-12 sm:py-16 lg:py-20"}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={`${highlightCard ? "lg:col-span-7" : "lg:col-span-8"} space-y-5`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-300 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{displayBadge}</span>
          </div>

          {/* Heading */}
          <h1
            className={`font-extrabold tracking-tight leading-[1.12] text-white ${compact ? "text-2xl sm:text-3xl lg:text-4xl" : "text-3xl sm:text-4xl lg:text-5xl"}`}
          >
            {displayTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            {displaySubtitle}
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>2-Year Full Warranty</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>Fast Express Dispatch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Authenticity Guaranteed</span>
            </div>
          </div>

          {/* Actions */}
          {(onPrimaryAction || onSecondaryAction) && (
            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              {onPrimaryAction && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onPrimaryAction}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{primaryActionText || "Explore Now"}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}

              {onSecondaryAction && (
                <button
                  onClick={onSecondaryAction}
                  className="px-5 py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-medium rounded-xl border border-slate-700 backdrop-blur-sm transition-colors cursor-pointer"
                >
                  {secondaryActionText || "Learn More"}
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Optional Right Column Highlight Card */}
        {highlightCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div
              onClick={highlightCard.onClick}
              className={`w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-5 shadow-2xl transition-all duration-300 ${highlightCard.onClick ? "cursor-pointer hover:scale-102 hover:border-white/30 hover:bg-white/15" : ""}`}
            >
              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 shadow-inner">
                <img
                  src={cardImage}
                  alt={highlightCard.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.src = FALLBACK_PRODUCT_HERO;
                  }}
                  className="w-full h-full object-cover filter brightness-95"
                />
                {highlightCard.badge && (
                  <div className="absolute top-2.5 left-2.5 bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                    {highlightCard.badge}
                  </div>
                )}
              </div>

              <div className="mt-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white truncate max-w-50">
                    {highlightCard.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">{highlightCard.subtitle}</p>
                </div>
                {highlightCard.price !== void 0 && (
                  <div className="text-right">
                    <span className="text-base font-extrabold text-white">
                      ${highlightCard.price.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export { HeroImage };
