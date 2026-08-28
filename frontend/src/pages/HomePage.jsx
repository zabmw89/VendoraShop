import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Home,
  Folder,
  X,
  Star,
  Zap,
  TrendingUp,
  Tag,
  Columns3,
  MoveHorizontal,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../services/api";
import { ProductCard } from "../components/product/ProductCard";
import { ProductFiltersComponent } from "../components/product/ProductFilters";
import { ProductGridSkeleton } from "../components/skeletons/ProductGridSkeleton";
import { HomePageSkeleton } from "../components/skeletons/HomePageSkeleton";
import { HeroImage } from "../components/common/HeroImage";
import { MultiIndexScrollingBanner } from "../components/common/MultiIndexScrollingBanner";
import { SortFilterDropdown } from "../components/product/SortFilterDropdown";
const HomePage = ({ onNavigate, initialQuery }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const initialFilters = useMemo(() => {
    const f = { page: 1, limit: 9, sortBy: "featured" };
    if (initialQuery) {
      const params = new URLSearchParams(initialQuery);
      if (params.get("search")) f.search = params.get("search");
      if (params.get("category")) f.category = params.get("category");
      if (params.get("sortBy")) f.sortBy = params.get("sortBy");
    }
    return f;
  }, [initialQuery]);
  const [filters, setFilters] = useState(initialFilters);
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await api.getProducts(filters);
        setProducts(res.items);
        setTotalProducts(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [filters]);
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const checkCategoryScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };
  useEffect(() => {
    checkCategoryScroll();
    window.addEventListener("resize", checkCategoryScroll);
    return () => window.removeEventListener("resize", checkCategoryScroll);
  }, [categories]);
  const scrollCategorySlider = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkCategoryScroll, 300);
    }
  };
  const productScrollRef = useRef(null);
  const [canProductScrollLeft, setCanProductScrollLeft] = useState(false);
  const [canProductScrollRight, setCanProductScrollRight] = useState(true);
  const checkProductScroll = () => {
    if (productScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = productScrollRef.current;
      setCanProductScrollLeft(scrollLeft > 6);
      setCanProductScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };
  const mobileGridScrollRef = useRef(null);
  const [canMobileGridScrollLeft, setCanMobileGridScrollLeft] = useState(false);
  const [canMobileGridScrollRight, setCanMobileGridScrollRight] = useState(true);
  const checkMobileGridScroll = () => {
    if (mobileGridScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mobileGridScrollRef.current;
      setCanMobileGridScrollLeft(scrollLeft > 6);
      setCanMobileGridScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };
  useEffect(() => {
    if (viewMode === "carousel") {
      checkProductScroll();
      const timer = setTimeout(checkProductScroll, 200);
      window.addEventListener("resize", checkProductScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", checkProductScroll);
      };
    } else if (viewMode === "grid") {
      checkMobileGridScroll();
      const timer = setTimeout(checkMobileGridScroll, 200);
      window.addEventListener("resize", checkMobileGridScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", checkMobileGridScroll);
      };
    }
  }, [products, viewMode]);
  const scrollProducts = (direction) => {
    if (productScrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      productScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkProductScroll, 350);
    }
  };
  const scrollMobileGrid = (direction) => {
    if (mobileGridScrollRef.current) {
      const scrollAmount = direction === "left" ? -290 : 290;
      mobileGridScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkMobileGridScroll, 350);
    }
  };
  const handleFilterUpdate = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };
  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 9, sortBy: "featured" });
  };
  const featuredProduct = products.find((p) => p.featured) || products[0];

  // Helper to find next category for end-of-section guidance
  const currentCatIndex = categories.findIndex(
    (c) => c.slug === filters.category || c.id === filters.category
  );
  const nextCategory =
    currentCatIndex >= 0 && currentCatIndex < categories.length - 1
      ? categories[currentCatIndex + 1]
      : categories[0];

  return <div className="space-y-10 pb-12 snap-y-proximity">
      {
    /* Dynamic Hero Banner with section snap */
  }
      {!filters.search && (!filters.category || filters.category === "all") && (
        <section id="hero-section" className="section-snap-start scroll-mt-20 space-y-4">
          <HeroImage
            variant="home"
            badgeText="Curated Spring 2026 Collection"
            title="Next-Generation Gear for Modern Living"
            subtitle="Discover flagship wireless acoustics, precision workstations, biometric wearables, and minimalist travel essentials backed by 30-day risk-free guarantees."
            primaryActionText="Explore Collection"
            onPrimaryAction={() => {
              const elem = document.getElementById("product-catalog-grid");
              elem?.scrollIntoView({ behavior: "smooth" });
            }}
            secondaryActionText="Browse Audio Gear"
            onSecondaryAction={() => onNavigate("home", "category=cat_audio")}
            highlightCard={featuredProduct ? {
              title: featuredProduct.name,
              subtitle: `$${featuredProduct.price.toFixed(2)}`,
              price: featuredProduct.price,
              image: featuredProduct.images?.[0],
              badge: "Spotlight Pick",
              onClick: () => onNavigate("product", featuredProduct.id)
            } : void 0}
          />
        </section>
      )}

      {
    /* Multi-Index Horizontal Scrolling Showcase Banner */
  }
      <section id="showcase-section" className="section-snap-start scroll-mt-20">
        <MultiIndexScrollingBanner
          onNavigate={onNavigate}
          products={products}
        />
      </section>

      {
    /* Main Catalog View Container with scroll snapping */
  }
      <section id="product-catalog-grid" className="section-snap-start scroll-mt-20 space-y-6">
        {
    /* Breadcrumb Navigation Trail */
  }
        <nav
    aria-label="Breadcrumb"
    className="flex items-center justify-between gap-3 text-xs bg-white/90 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200/90 shadow-xs transition-all overflow-x-auto scrollbar-none"
  >
          <div className="flex items-center flex-nowrap gap-1.5 sm:gap-2 shrink-0">
            {
    /* Home Button */
  }
            <button
    onClick={() => handleResetFilters()}
    className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 px-2.5 py-1 rounded-lg hover:bg-slate-100/90 transition-all cursor-pointer"
  >
              <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Home</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {
    /* Categories Root Button */
  }
            <button
    onClick={() => handleFilterUpdate({ category: void 0, page: 1 })}
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${!filters.category || filters.category === "all" ? "bg-slate-100 text-slate-900 font-bold" : "font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100/90"}`}
  >
              <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>All Departments</span>
            </button>

            {
    /* Selected Category Pill */
  }
            {filters.category && filters.category !== "all" && <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-xl border border-blue-200/80 shadow-2xs">
                  <Tag className="w-3 h-3 text-blue-600" />
                  <span className="capitalize">
                    {categories.find((c) => c.slug === filters.category || c.id === filters.category)?.name || filters.category}
                  </span>
                  <button
    onClick={() => handleFilterUpdate({ category: void 0, page: 1 })}
    className="hover:bg-blue-200/70 text-blue-600 hover:text-blue-900 p-0.5 rounded-full transition-colors cursor-pointer ml-0.5"
    title="Clear category filter"
    aria-label="Remove category filter"
  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </>}

            {
    /* Search Filter Pill */
  }
            {filters.search && <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 font-semibold px-3 py-1 rounded-xl border border-amber-200/80 shadow-2xs">
                  <Search className="w-3 h-3 text-amber-600" />
                  <span>"{filters.search}"</span>
                  <button
    onClick={() => handleFilterUpdate({ search: void 0, page: 1 })}
    className="hover:bg-amber-200/70 text-amber-800 hover:text-amber-950 p-0.5 rounded-full transition-colors cursor-pointer ml-0.5"
    title="Clear search query"
    aria-label="Remove search query"
  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </>}
          </div>

          {
    /* Right-aligned Trail Badges & Quick Reset */
  }
          <div className="hidden sm:flex items-center gap-2.5 shrink-0 pl-2">
            {(filters.category || filters.search || filters.sortBy && filters.sortBy !== "featured") && <button
    onClick={handleResetFilters}
    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 px-2 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
    title="Reset all active filters"
  >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>}
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200/80">
              {totalProducts} {totalProducts === 1 ? "result" : "results"}
            </span>
          </div>
        </nav>

        {
    /* Category Horizontal Slider Bar */
  }
        <div className="relative group">
          {
    /* Left Scroll Button */
  }
          {canScrollLeft && <button
    onClick={() => scrollCategorySlider("left")}
    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-700 hover:text-blue-600 flex items-center justify-center transition-all hover:scale-105 cursor-pointer backdrop-blur-xs"
    aria-label="Scroll categories left"
  >
              <ChevronLeft className="w-4 h-4" />
            </button>}

          {
    /* Left Fade Gradient */
  }
          {canScrollLeft && <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-slate-50 to-transparent pointer-events-none z-5" />}

          {
    /* Sliding Category Items Container */
  }
          <div
    ref={categoryScrollRef}
    onScroll={checkCategoryScroll}
    className="flex items-center gap-2 overflow-x-auto py-1 px-1 scroll-smooth scrollbar-none select-none"
  >
            <button
    onClick={() => handleFilterUpdate({ category: void 0, page: 1 })}
    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${!filters.category || filters.category === "all" ? "bg-blue-600 text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs"}`}
  >
              <Tag className="w-3.5 h-3.5" />
              <span>All Products</span>
              {(!filters.category || filters.category === "all") && <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">
                  {totalProducts}
                </span>}
            </button>

            {categories.map((cat) => {
    const isSelected = filters.category === cat.slug || filters.category === cat.id;
    return <button
      key={cat.id}
      onClick={() => handleFilterUpdate({ category: isSelected ? void 0 : cat.slug, page: 1 })}
      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${isSelected ? "bg-blue-600 text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs"}`}
    >
                  <span>{cat.name}</span>
                  {cat.productCount !== void 0 && <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {cat.productCount}
                    </span>}
                </button>;
  })}

            {
    /* Quick Collection Filters for extra variety in the horizontal slider */
  }
            <button
    onClick={() => handleFilterUpdate({ sortBy: "rating", page: 1 })}
    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${filters.sortBy === "rating" ? "bg-amber-500 text-white shadow-xs" : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200 shadow-2xs"}`}
  >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Top Rated</span>
            </button>

            <button
    onClick={() => handleFilterUpdate({ sortBy: "newest", page: 1 })}
    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${filters.sortBy === "newest" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 shadow-2xs"}`}
  >
              <Zap className="w-3.5 h-3.5" />
              <span>New Arrivals</span>
            </button>

            <button
    onClick={() => handleFilterUpdate({ sortBy: "featured", page: 1 })}
    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${filters.sortBy === "featured" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 shadow-2xs"}`}
  >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Featured Picks</span>
            </button>
          </div>

          {
    /* Right Scroll Button */
  }
          {canScrollRight && <button
    onClick={() => scrollCategorySlider("right")}
    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-700 hover:text-blue-600 flex items-center justify-center transition-all hover:scale-105 cursor-pointer backdrop-blur-xs"
    aria-label="Scroll categories right"
  >
              <ChevronRight className="w-4 h-4" />
            </button>}

          {
    /* Right Fade Gradient */
  }
          {canScrollRight && <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-slate-50 to-transparent pointer-events-none z-5" />}
        </div>

        {
    /* Catalog Header & View Controls */
  }
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              {filters.category && filters.category !== "all" ? <span className="capitalize">{categories.find((c) => c.slug === filters.category || c.id === filters.category)?.name || filters.category}</span> : filters.search ? <span>Search results for "{filters.search}"</span> : <span>All Products</span>}
              <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-md px-2 py-0.5">
                {totalProducts} items
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing page {filters.page || 1} of {totalPages}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {
    /* Mobile Filter Trigger */
  }
            <button
    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
    className="lg:hidden px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5"
  >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> Filters
            </button>

            {
    /* Filter by Category Select Dropdown */
  }
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 hidden md:inline">
                Category:
              </label>
              <select
    value={filters.category || "all"}
    onChange={(e) => handleFilterUpdate({ category: e.target.value === "all" ? void 0 : e.target.value, page: 1 })}
    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    aria-label="Filter by category"
  >
                <option value="all">All Categories</option>
                {categories.map((cat) => <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>)}
              </select>
            </div>

            {
    /* Prominent Dropdown Sort Filter Component */
  }
            <div className="flex items-center gap-2">
              <SortFilterDropdown
                value={filters.sortBy || "featured"}
                onChange={(sortBy) => handleFilterUpdate({ sortBy, page: 1 })}
              />
            </div>

            {
    /* Grid vs Horizontal Swipe vs List View Modes */
  }
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
    onClick={() => setViewMode("grid")}
    className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white shadow-xs text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-900"}`}
    title="Grid View"
    aria-label="Grid View"
  >
                <LayoutGrid className="w-4 h-4" />
              </button>

              <button
    onClick={() => setViewMode("carousel")}
    className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "carousel" ? "bg-white shadow-xs text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-900"}`}
    title="Horizontal Swipe Carousel View"
    aria-label="Horizontal Swipe Carousel View"
  >
                <Columns3 className="w-4 h-4" />
              </button>

              <button
    onClick={() => setViewMode("list")}
    className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? "bg-white shadow-xs text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-900"}`}
    title="List View"
    aria-label="List View"
  >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {
    /* Mobile Filters Dropdown Container */
  }
        {isMobileFilterOpen && <div className="lg:hidden mt-4 mb-6">
            <ProductFiltersComponent
    categories={categories}
    filters={filters}
    onFilterChange={handleFilterUpdate}
    onReset={handleResetFilters}
    totalResults={totalProducts}
  />
          </div>}

        {
    /* Catalog Body: Sidebar + Grid Layout */
  }
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
          {
    /* Desktop Filter Sidebar */
  }
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28">
              <ProductFiltersComponent
    categories={categories}
    filters={filters}
    onFilterChange={handleFilterUpdate}
    onReset={handleResetFilters}
    totalResults={totalProducts}
  />
            </div>
          </div>

          {
    /* Product Items Grid / List / Horizontal Carousel with Framer Motion */
  }
          <div className="lg:col-span-3 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
    key={`${filters.category || "all"}-${filters.search || ""}-${filters.page || 1}-${filters.sortBy || "featured"}-${viewMode}`}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    className="min-w-0"
  >
                {isLoading ? (
                  <ProductGridSkeleton count={filters.limit || 9} viewMode={viewMode} />
                ) : products.length === 0 ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Search className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Try adjusting your keyword search, removing price filters, or clearing the selected department.
                      </p>
                    </div>
                    <button
    onClick={handleResetFilters}
    className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors cursor-pointer"
  >
                      Clear All Filters
                    </button>
                  </div> : viewMode === "carousel" ? (
    /* Horizontal Swipe & Scroll Layout with Smooth Overflow Handling */
    <div className="relative group/carousel">
                    {
      /* Left Scroll Navigation Button */
    }
                    {canProductScrollLeft && <button
      onClick={() => scrollProducts("left")}
      className="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-700 hover:text-blue-600 active:scale-90 flex items-center justify-center transition-all hover:scale-105 cursor-pointer backdrop-blur-xs"
      aria-label="Scroll products left"
    >
                        <ChevronLeft className="w-5 h-5" />
                      </button>}

                    {
      /* Left Overflow Edge Fade Gradient */
    }
                    {canProductScrollLeft && <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-linear-to-r from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10" />}

                    {
      /* Horizontal Scroll Track with Snap Physics & Custom Thin Rounded Scrollbar */
    }
                    <div
      ref={productScrollRef}
      onScroll={checkProductScroll}
      className="flex items-stretch gap-5 overflow-x-auto snap-x-mandatory snap-x snap-mandatory py-2 px-1 scroll-smooth select-none scroll-px-1 sm:scroll-px-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100/90 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full"
      style={{
        WebkitOverflowScrolling: "touch",
        scrollSnapType: "x mandatory",
        scrollPadding: "0 4px"
      }}
    >
                      {products.map((product, idx) => <motion.div
      key={product.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
      className="w-70 sm:w-77.5 shrink-0 snap-align-start snap-start snap-always flex flex-col active:scale-95 transition-transform duration-150"
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
                          <ProductCard
      product={product}
      onSelect={(id) => onNavigate("product", id)}
      viewMode="grid"
    />
                        </motion.div>)}
                    </div>

                    {
      /* Right Scroll Navigation Button */
    }
                    {canProductScrollRight && <button
      onClick={() => scrollProducts("right")}
      className="absolute -right-2.5 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-700 hover:text-blue-600 active:scale-90 flex items-center justify-center transition-all hover:scale-105 cursor-pointer backdrop-blur-xs"
      aria-label="Scroll products right"
    >
                        <ChevronRight className="w-5 h-5" />
                      </button>}

                    {
      /* Right Overflow Edge Fade Gradient */
    }
                    {canProductScrollRight && <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-linear-to-l from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10" />}

                    {
      /* Horizontal Scroll Helper & Touch Indicator Bar */
    }
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <MoveHorizontal className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                        <span className="hidden sm:inline">Swipe horizontally or use arrows to view all products</span>
                        <span className="sm:hidden">Swipe or use arrows to browse</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                          {products.length} items
                        </span>
                        <div className="sm:hidden flex items-center gap-1">
                          <button
      onClick={() => scrollProducts("left")}
      disabled={!canProductScrollLeft}
      className="p-1 rounded bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200 active:scale-90"
      aria-label="Scroll Left"
    >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
      onClick={() => scrollProducts("right")}
      disabled={!canProductScrollRight}
      className="p-1 rounded bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200 active:scale-90"
      aria-label="Scroll Right"
    >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
  ) : <>
                    <div className="relative group/mobilegrid">
                      {
    /* Left Navigation Arrow Indicator for Mobile Touch Scrolling */
  }
                      {canMobileGridScrollLeft && <button
    onClick={() => scrollMobileGrid("left")}
    className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-700 hover:text-blue-600 active:scale-90 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
    aria-label="Scroll products left"
  >
                          <ChevronLeft className="w-4 h-4" />
                        </button>}

                      {
    /* Mobile Left Edge Gradient Fade */
  }
                      {canMobileGridScrollLeft && <div className="sm:hidden absolute left-0 top-0 bottom-0 w-10 bg-linear-to-r from-slate-50 to-transparent pointer-events-none z-10" />}

                      {
    /* Main Product Container with CSS Scroll Snap & Thin Rounded Scrollbar */
  }
                      <div
    ref={mobileGridScrollRef}
    onScroll={checkMobileGridScroll}
    className={viewMode === "grid" ? "flex sm:grid sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 overflow-x-auto sm:overflow-x-visible snap-x-mandatory snap-x snap-mandatory sm:snap-none pb-4 sm:pb-0 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 scroll-px-4 sm:scroll-px-0 select-none sm:select-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100/90 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full" : "space-y-4"}
    style={viewMode === "grid" ? {
      WebkitOverflowScrolling: "touch",
      scrollSnapType: "x mandatory",
      scrollPadding: "0 16px"
    } : void 0}
  >
                        {products.map((product, idx) => <motion.div
    key={product.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
    className={viewMode === "grid" ? "w-[78vw] max-w-72.5 shrink-0 snap-align-start snap-start snap-always sm:w-auto sm:max-w-none sm:shrink flex flex-col active:scale-95 transition-transform duration-150" : "w-full active:scale-95 transition-transform duration-150"}
    style={viewMode === "grid" ? { scrollSnapAlign: "start", scrollSnapStop: "always" } : void 0}
  >
                            <ProductCard
    product={product}
    onSelect={(id) => onNavigate("product", id)}
    viewMode={viewMode}
  />
                          </motion.div>)}
                      </div>

                      {
    /* Right Navigation Arrow Indicator for Mobile Touch Scrolling */
  }
                      {canMobileGridScrollRight && <button
    onClick={() => scrollMobileGrid("right")}
    className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-700 hover:text-blue-600 active:scale-90 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
    aria-label="Scroll products right"
  >
                          <ChevronRight className="w-4 h-4" />
                        </button>}

                      {
    /* Mobile Right Edge Gradient Fade */
  }
                      {canMobileGridScrollRight && <div className="sm:hidden absolute right-0 top-0 bottom-0 w-10 bg-linear-to-l from-slate-50 to-transparent pointer-events-none z-10" />}
                    </div>

                    {
    /* Mobile Touch Navigation Guide & Indicator Controls */
  }
                    {viewMode === "grid" && <div className="sm:hidden mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-1">
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <MoveHorizontal className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                          <span>Swipe or tap arrows to navigate</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                            {products.length} items
                          </span>
                          <div className="flex items-center gap-1">
                            <button
    onClick={() => scrollMobileGrid("left")}
    disabled={!canMobileGridScrollLeft}
    className="p-1 rounded bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200 active:scale-90"
    aria-label="Scroll Left"
  >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
    onClick={() => scrollMobileGrid("right")}
    disabled={!canMobileGridScrollRight}
    className="p-1 rounded bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200 active:scale-90"
    aria-label="Scroll Right"
  >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>}
                  </>}
              </motion.div>
            </AnimatePresence>

            {
    /* Pagination Controls Matching Professional Polish theme */
  }
            {totalPages > 1 && <div className="mt-10 flex items-center justify-center">
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                  <button
    onClick={() => handleFilterUpdate({ page: Math.max(1, (filters.page || 1) - 1) })}
    disabled={(filters.page || 1) <= 1}
    className="w-9 h-9 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-colors cursor-pointer"
    aria-label="Previous Page"
  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => <button
    key={pageNum}
    onClick={() => handleFilterUpdate({ page: pageNum })}
    className={`w-9 h-9 rounded-md text-sm font-semibold transition-all flex items-center justify-center cursor-pointer ${(filters.page || 1) === pageNum ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 font-medium"}`}
  >
                      {pageNum}
                    </button>)}

                  <button
    onClick={() => handleFilterUpdate({ page: Math.min(totalPages, (filters.page || 1) + 1) })}
    disabled={(filters.page || 1) >= totalPages}
    className="w-9 h-9 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-colors cursor-pointer"
    aria-label="Next Page"
  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>}
          </div>
        </div>
      </section>
    </div>;
};
export {
  HomePage
};
