import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Flame,
  Zap,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
  Star,
  Percent
} from "lucide-react";
import { api } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { LazyImage } from "./LazyImage";
import { triggerStepChangeHaptic } from "../../utils/haptics";
const MultiIndexScrollingBanner = ({
  onNavigate,
  products: initialProducts
}) => {
  const { addToCart, openDrawer } = useCart();
  const { showToast } = useToast();
  const [activeProducts, setActiveProducts] = useState(initialProducts || []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  useEffect(() => {
    if (!initialProducts || initialProducts.length === 0) {
      api.getProducts({ limit: 40 }).then((res) => {
        if (res.items && res.items.length > 0) {
          setActiveProducts(res.items);
        }
      }).catch(console.error);
    } else {
      setActiveProducts(initialProducts);
    }
  }, [initialProducts]);
  const indices = [
    {
      id: "flash-deals",
      title: "Flash Deals & Discounts",
      shortTitle: "Flash Deals",
      badge: "Up to 40% OFF",
      icon: Zap,
      accentColor: "from-amber-500 to-rose-500",
      bgGradient: "bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent",
      badgeColor: "bg-amber-500/15 text-amber-800 border-amber-500/30",
      offerHeadline: "Flash Sale: Limited Inventory Drops",
      offerSubtext: "Save instantly on verified customer favorites before quantities run out.",
      promoCode: "FLASH25",
      filterFn: (p) => p.originalPrice !== void 0 && p.originalPrice > p.price || p.price < 150
    },
    {
      id: "best-sellers",
      title: "Trending Best Sellers",
      shortTitle: "Best Sellers",
      badge: "4.8+ Stars Rated",
      icon: Flame,
      accentColor: "from-blue-600 to-indigo-600",
      bgGradient: "bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent",
      badgeColor: "bg-blue-500/15 text-blue-800 border-blue-500/30",
      offerHeadline: "Top Performing Flagship Tech",
      offerSubtext: "The most popular acoustics, displays, and workstation accessories this month.",
      promoCode: "TRENDING10",
      filterFn: (p) => p.rating >= 4.7 || !!p.featured
    },
    {
      id: "vip-rewards",
      title: "VIP & 2x Points Exclusives",
      shortTitle: "VIP Perks",
      badge: "Double Rewards",
      icon: Award,
      accentColor: "from-purple-600 to-pink-600",
      bgGradient: "bg-gradient-to-r from-purple-600/10 via-pink-600/5 to-transparent",
      badgeColor: "bg-purple-500/15 text-purple-800 border-purple-500/30",
      offerHeadline: "Earn Double Loyalty Credits",
      offerSubtext: "Members receive 2x points on premium gear toward instant checkout discounts.",
      promoCode: "VIPDOUBLE",
      filterFn: (p) => p.price >= 100
    },
    {
      id: "spring-releases",
      title: "New Spring 2026 Arrivals",
      shortTitle: "New Arrivals",
      badge: "Fresh Stock",
      icon: Sparkles,
      accentColor: "from-emerald-500 to-teal-600",
      bgGradient: "bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent",
      badgeColor: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30",
      offerHeadline: "Next-Gen Industrial Design",
      offerSubtext: "Engineered with tactile materials, active noise cancellation, and minimal footprints.",
      promoCode: "SPRING2026",
      filterFn: (p) => p.tags.some((t) => ["new", "audio", "smart", "wireless", "accessories"].includes(t.toLowerCase())) || true
    },
    {
      id: "budget-picks",
      title: "Under $100 Essentials",
      shortTitle: "Under $100",
      badge: "Value Picks",
      icon: Percent,
      accentColor: "from-cyan-500 to-blue-600",
      bgGradient: "bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent",
      badgeColor: "bg-cyan-500/15 text-cyan-800 border-cyan-500/30",
      offerHeadline: "High Quality Everyday Value",
      offerSubtext: "Pocket-friendly premium tech, chargers, cables, and protective accessories.",
      promoCode: "VALUE15",
      filterFn: (p) => p.price < 100
    }
  ];
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % indices.length);
    }, 8500);
    return () => clearInterval(interval);
  }, [isAutoPlay, indices.length]);
  const currentIndex = indices[activeIndex] || indices[0];
  const displayedItems = React.useMemo(() => {
    let filtered = activeProducts.filter(currentIndex.filterFn);
    if (filtered.length < 4) {
      filtered = activeProducts;
    }
    return filtered.slice(0, 8);
  }, [activeProducts, currentIndex]);
  const checkScrollBounds = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };
  useEffect(() => {
    checkScrollBounds();
    const timer = setTimeout(checkScrollBounds, 250);
    window.addEventListener("resize", checkScrollBounds);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScrollBounds);
    };
  }, [displayedItems, activeIndex]);
  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollDistance = scrollContainerRef.current.clientWidth * 0.75;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollDistance : scrollDistance,
        behavior: "smooth"
      });
      setTimeout(checkScrollBounds, 350);
    }
  };
  const handleIndexChange = (index) => {
    triggerStepChangeHaptic();
    setActiveIndex(index);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };
  const handleAddToCart = async (e, item) => {
    e.stopPropagation();
    setAddingId(item.id);
    try {
      await addToCart(item, 1);
      showToast(`Added "${item.name}" to cart`, "success");
      openDrawer();
    } catch {
      showToast("Failed to add item to cart", "error");
    } finally {
      setAddingId(null);
    }
  };
  return <div
    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4"
    id="multi-index-scrolling-showcase"
    onMouseEnter={() => setIsAutoPlay(false)}
    onMouseLeave={() => setIsAutoPlay(true)}
  >
      {
    /* Top Index Navigation Selector */
  }
      <div className="border-b border-slate-100 bg-slate-50/70 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {
    /* Index Tabs */
  }
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {indices.map((idx, i) => {
    const Icon = idx.icon;
    const isActive = activeIndex === i;
    return <button
      key={idx.id}
      onClick={() => handleIndexChange(i)}
      className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${isActive ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 ring-2 ring-blue-500/10" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
      id={`banner-index-tab-${idx.id}`}
    >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span className="hidden md:inline">{idx.title}</span>
                  <span className="md:hidden">{idx.shortTitle}</span>
                  <span
      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${idx.badgeColor} hidden lg:inline-block`}
    >
                    {idx.badge}
                  </span>
                  {isActive && <motion.div
      layoutId="active-index-pill"
      className="absolute inset-0 rounded-xl border border-blue-500/30 pointer-events-none"
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    />}
                </button>;
  })}
          </div>

          {
    /* Quick Track Controls */
  }
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
    onClick={() => handleScroll("left")}
    disabled={!canScrollLeft}
    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
    aria-label="Previous showcase items"
  >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
    onClick={() => handleScroll("right")}
    disabled={!canScrollRight}
    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
    aria-label="Next showcase items"
  >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {
    /* Dynamic Sub-header Offer Highlight */
  }
      <div className={`px-4 sm:px-6 py-2.5 ${currentIndex.bgGradient} flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${currentIndex.accentColor} text-white flex items-center justify-center shadow-xs shrink-0`}>
            {React.createElement(currentIndex.icon, { className: "w-4 h-4" })}
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>{currentIndex.offerHeadline}</span>
              {currentIndex.promoCode && <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                  CODE: {currentIndex.promoCode}
                </span>}
            </div>
            <p className="text-[11px] text-slate-600 hidden sm:block">
              {currentIndex.offerSubtext}
            </p>
          </div>
        </div>

        <button
    onClick={() => onNavigate("home")}
    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0 cursor-pointer self-end md:self-auto"
  >
          <span>View All in Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {
    /* Horizontal Scrolling Product Cards Track */
  }
      <div className="px-4 sm:px-6 pb-5">
        <div
    ref={scrollContainerRef}
    onScroll={checkScrollBounds}
    className="flex items-stretch gap-4 overflow-x-auto scroll-smooth pb-2 pt-1 scrollbar-none snap-x snap-mandatory"
    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
  >
          {displayedItems.map((item, idx) => {
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
    const discountPct = hasDiscount ? Math.round((item.originalPrice - item.price) / item.originalPrice * 100) : 0;
    return <motion.div
      key={`${currentIndex.id}-${item.id}-${idx}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, delay: idx * 0.04 }}
      className="w-64 sm:w-72 shrink-0 snap-start bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group cursor-pointer"
      onClick={() => onNavigate("product", item.id)}
    >
                {
      /* Product Image Area */
    }
                <div className="relative p-4 bg-white flex items-center justify-center h-44 overflow-hidden border-b border-slate-100">
                  <LazyImage
      src={item.images[0]}
      alt={item.name}
      className="max-h-36 w-full object-contain transition-transform duration-300 group-hover:scale-105"
    />

                  {
      /* Promo Badges */
    }
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    {hasDiscount ? <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md shadow-2xs">
                        {discountPct}% OFF
                      </span> : item.featured ? <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md shadow-2xs">
                        Spotlight
                      </span> : <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md shadow-2xs">
                        In Stock
                      </span>}
                  </div>

                  {
      /* Rating Pill */
    }
                  <div className="absolute bottom-2 right-2.5 bg-white/95 backdrop-blur-sm border border-slate-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-2xs">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                </div>

                {
      /* Card Content & Details */
    }
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {item.brand || item.categoryName || "Vendora Gear"}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors mt-0.5">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.shortDescription}
                    </p>
                  </div>

                  {
      /* Price & Action Row */
    }
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900">
                          ${item.price.toFixed(2)}
                        </span>
                        {hasDiscount && <span className="text-xs text-slate-400 line-through">
                            ${item.originalPrice?.toFixed(2)}
                          </span>}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium block">
                        Free Express Delivery
                      </span>
                    </div>

                    <button
      onClick={(e) => handleAddToCart(e, item)}
      disabled={addingId === item.id || item.stock <= 0}
      className="p-2 sm:px-3 sm:py-1.5 bg-slate-900 hover:bg-blue-600 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
      title="Add to shopping bag"
      aria-label={`Add ${item.name} to cart`}
    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {addingId === item.id ? "Adding..." : "Add"}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>;
  })}
        </div>
      </div>
    </div>;
};
export {
  MultiIndexScrollingBanner
};
