import { useState, useEffect } from "react";
import {
  RotateCcw,
  SlidersHorizontal,
  Check,
  X,
  Star,
  Tag,
  Search as SearchIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { api } from "../../services/api";
const PRICE_PRESETS = [
  { label: "All Prices", min: void 0, max: void 0 },
  { label: "Under $50", min: void 0, max: 50 },
  { label: "$50 to $150", min: 50, max: 150 },
  { label: "$150 to $300", min: 150, max: 300 },
  { label: "$300 to $600", min: 300, max: 600 },
  { label: "$600 & Above", min: 600, max: void 0 }
];
const RATING_TIERS = [
  { rating: 4.5, label: "4.5 & up" },
  { rating: 4, label: "4.0 & up" },
  { rating: 3.5, label: "3.5 & up" },
  { rating: 3, label: "3.0 & up" }
];
const FALLBACK_BRANDS = [
  "AeroAcoustics",
  "NovaTech",
  "Chronos Labs",
  "Lumina Studio",
  "Vagabond Gear",
  "SonicWave",
  "ErgoLine",
  "Nordic Thread",
  "PixelView",
  "PulseFlow",
  "Aura Ring",
  "NomadTech"
];
const ProductFiltersComponent = ({
  categories,
  filters,
  onFilterChange,
  onReset,
  totalResults
}) => {
  const [brands, setBrands] = useState(FALLBACK_BRANDS);
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);
  useEffect(() => {
    api.getBrands().then((data) => {
      if (data && data.length > 0) {
        setBrands(data);
      }
    }).catch((err) => console.error("Failed to load brands:", err));
  }, []);
  const brandList = (Array.isArray(brands) ? brands : []).map(b => typeof b === 'string' ? b : (b.name || b.slug || String(b)));
  const filteredBrands = brandList.filter(
    (b) => b.toLowerCase().includes(brandSearch.toLowerCase())
  );
  const displayedBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 6);
  const isBrandSelected = (brandName) => {
    if (filters.brand === brandName) return true;
    if (filters.brands?.includes(brandName)) return true;
    return false;
  };
  const handleToggleBrand = (brandName) => {
    const currentBrands = filters.brands ? [...filters.brands] : filters.brand ? [filters.brand] : [];
    let updatedBrands;
    if (currentBrands.includes(brandName)) {
      updatedBrands = currentBrands.filter((b) => b !== brandName);
    } else {
      updatedBrands = [...currentBrands, brandName];
    }
    if (updatedBrands.length === 0) {
      onFilterChange({ brand: void 0, brands: void 0, page: 1 });
    } else if (updatedBrands.length === 1) {
      onFilterChange({ brand: updatedBrands[0], brands: updatedBrands, page: 1 });
    } else {
      onFilterChange({ brand: void 0, brands: updatedBrands, page: 1 });
    }
  };
  const isPresetActive = (min, max) => {
    if (min === void 0 && max === void 0) {
      return filters.minPrice === void 0 && (filters.maxPrice === void 0 || filters.maxPrice >= 1500);
    }
    return filters.minPrice === min && filters.maxPrice === max;
  };
  const handlePricePreset = (min, max) => {
    onFilterChange({
      minPrice: min,
      maxPrice: max,
      page: 1
    });
  };
  const hasActiveFilters = Boolean(
    filters.category || filters.search || filters.brand || filters.brands && filters.brands.length > 0 || filters.minRating || filters.onSaleOnly || filters.inStockOnly || filters.minPrice !== void 0 || filters.maxPrice !== void 0 && filters.maxPrice < 1500
  );
  return <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-col gap-6 shadow-xs">
      {
    /* Header */
  }
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Catalog Filters</h3>
        </div>
        {hasActiveFilters && <button
    onClick={onReset}
    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
    title="Reset all filters"
  >
            <RotateCcw className="w-3 h-3" /> Reset All
          </button>}
      </div>

      {
    /* Active Filter Chips */
  }
      {hasActiveFilters && <div className="space-y-2 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Filters
            </span>
            <span className="text-[11px] text-blue-600 font-semibold">{totalResults} matched</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.search && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-medium">
                "{filters.search}"
                <X
    className="w-3 h-3 cursor-pointer hover:text-rose-600"
    onClick={() => onFilterChange({ search: void 0, page: 1 })}
  />
              </span>}

            {filters.category && filters.category !== "all" && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                Category: {categories.find((c) => c.slug === filters.category || c.id === filters.category)?.name || filters.category}
                <X
    className="w-3 h-3 cursor-pointer hover:text-rose-600"
    onClick={() => onFilterChange({ category: void 0, page: 1 })}
  />
              </span>}

            {
    /* Brands chips */
  }
            {filters.brands && filters.brands.length > 0 ? filters.brands.map((b) => <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                  Brand: {b}
                  <X
    className="w-3 h-3 cursor-pointer hover:text-rose-600"
    onClick={() => handleToggleBrand(b)}
  />
                </span>) : filters.brand ? <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                Brand: {filters.brand}
                <X
    className="w-3 h-3 cursor-pointer hover:text-rose-600"
    onClick={() => onFilterChange({ brand: void 0, page: 1 })}
  />
              </span> : null}

            {filters.minRating && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md text-xs font-medium">
                ★ {filters.minRating}+ Stars
                <X
    className="w-3 h-3 cursor-pointer hover:text-rose-600"
    onClick={() => onFilterChange({ minRating: void 0, page: 1 })}
  />
              </span>}

            {(filters.minPrice !== void 0 || filters.maxPrice !== void 0 && filters.maxPrice < 1500) && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-medium">
                {filters.minPrice !== void 0 && filters.maxPrice !== void 0 ? `$${filters.minPrice} - $${filters.maxPrice}` : filters.minPrice !== void 0 ? `From $${filters.minPrice}` : `Up to $${filters.maxPrice}`}
                <X
    className="w-3 h-3 cursor-pointer hover:text-rose-600"
    onClick={() => onFilterChange({ minPrice: void 0, maxPrice: void 0, page: 1 })}
  />
              </span>}

            {filters.inStockOnly && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium">
                In Stock Only
                <X
    className="w-3 h-3 cursor-pointer hover:text-rose-600"
    onClick={() => onFilterChange({ inStockOnly: false, page: 1 })}
  />
              </span>}

            {filters.onSaleOnly && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md text-xs font-medium">
                On Sale Deals
                <X
    className="w-3 h-3 cursor-pointer hover:text-rose-600"
    onClick={() => onFilterChange({ onSaleOnly: false, page: 1 })}
  />
              </span>}
          </div>
        </div>}

      {
    /* Categories List */
  }
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Categories
        </h4>
        <div className="flex flex-col gap-1.5">
          <button
    onClick={() => onFilterChange({ category: void 0, page: 1 })}
    className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition-colors text-left cursor-pointer ${!filters.category || filters.category === "all" ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
  >
            <span>All Categories</span>
            <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${!filters.category || filters.category === "all" ? "bg-blue-100/60 text-blue-700" : "bg-slate-100 text-slate-400"}`}>
              {totalResults}
            </span>
          </button>

          {categories.map((cat) => {
    const isSelected = filters.category === cat.slug || filters.category === cat.id;
    return <button
      key={cat.id}
      onClick={() => onFilterChange({ category: cat.slug, page: 1 })}
      className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition-colors text-left cursor-pointer ${isSelected ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
    >
                <span className="truncate">{cat.name}</span>
                {cat.productCount !== void 0 && <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${isSelected ? "bg-blue-100/60 text-blue-700" : "bg-slate-100 text-slate-400"}`}>
                    {cat.productCount}
                  </span>}
              </button>;
  })}
        </div>
      </div>

      {
    /* Brand Filters */
  }
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Brand
          </h4>
          {(filters.brand || filters.brands && filters.brands.length > 0) && <button
    onClick={() => onFilterChange({ brand: void 0, brands: void 0, page: 1 })}
    className="text-[11px] text-slate-400 hover:text-blue-600 cursor-pointer"
  >
              Clear
            </button>}
        </div>

        {
    /* Brand search input if many brands */
  }
        {brands.length > 6 && <div className="relative">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
    type="text"
    placeholder="Search brands..."
    value={brandSearch}
    onChange={(e) => setBrandSearch(e.target.value)}
    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white text-slate-800"
  />
          </div>}

        {
    /* Brands Checkbox List */
  }
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {displayedBrands.length === 0 ? <p className="text-xs text-slate-400 py-1">No brands matching "{brandSearch}"</p> : displayedBrands.map((brandName) => {
    const checked = isBrandSelected(brandName);
    return <label
      key={brandName}
      onClick={() => handleToggleBrand(brandName)}
      className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer select-none group"
    >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${checked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white group-hover:border-slate-400"}`}>
                      {checked && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                    <span className={`text-xs truncate ${checked ? "text-blue-600 font-semibold" : "text-slate-700"}`}>
                      {brandName}
                    </span>
                  </div>
                </label>;
  })}
        </div>

        {filteredBrands.length > 6 && <button
    onClick={() => setShowAllBrands(!showAllBrands)}
    className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1 cursor-pointer pt-1"
  >
            {showAllBrands ? <>Show Less <ChevronUp className="w-3.5 h-3.5" /></> : <>Show All ({filteredBrands.length}) <ChevronDown className="w-3.5 h-3.5" /></>}
          </button>}
      </div>

      {
    /* Price Ranges Filter */
  }
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Price Range
          </h4>
          {(filters.minPrice !== void 0 || filters.maxPrice !== void 0 && filters.maxPrice < 1500) && <button
    onClick={() => onFilterChange({ minPrice: void 0, maxPrice: void 0, page: 1 })}
    className="text-[11px] text-slate-400 hover:text-blue-600 cursor-pointer"
  >
              Clear
            </button>}
        </div>

        {
    /* Quick Range Presets */
  }
        <div className="grid grid-cols-2 gap-1.5">
          {PRICE_PRESETS.map((preset) => {
    const active = isPresetActive(preset.min, preset.max);
    return <button
      key={preset.label}
      onClick={() => handlePricePreset(preset.min, preset.max)}
      className={`px-2.5 py-1.5 text-xs rounded-lg text-left transition-all cursor-pointer truncate ${active ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"}`}
    >
                {preset.label}
              </button>;
  })}
        </div>

        {
    /* Granular Slider */
  }
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Max Price:</span>
            <span className="text-blue-600 font-bold">${filters.maxPrice || 1500}</span>
          </div>
          <input
    type="range"
    min={20}
    max={1600}
    step={20}
    value={filters.maxPrice || 1500}
    onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value), page: 1 })}
    className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
  />
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>$0</span>
            <span>$800</span>
            <span>$1,600+</span>
          </div>
        </div>
      </div>

      {
    /* Customer Rating Tiers */
  }
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Customer Rating
          </h4>
          {filters.minRating && <button
    onClick={() => onFilterChange({ minRating: void 0, page: 1 })}
    className="text-[11px] text-slate-400 hover:text-blue-600 cursor-pointer"
  >
              Clear
            </button>}
        </div>

        <div className="space-y-1">
          {RATING_TIERS.map((tier) => {
    const isSelected = filters.minRating === tier.rating;
    return <button
      key={tier.rating}
      onClick={() => onFilterChange({
        minRating: isSelected ? void 0 : tier.rating,
        page: 1
      })}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${isSelected ? "bg-amber-50 text-amber-900 font-bold border border-amber-200" : "text-slate-700 hover:bg-slate-50"}`}
    >
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => <Star
      key={i}
      className={`w-3.5 h-3.5 ${i < Math.floor(tier.rating) ? "fill-amber-400 text-amber-400" : i < tier.rating ? "fill-amber-400/50 text-amber-400" : "text-slate-200"}`}
    />)}
                  </div>
                  <span className="font-semibold">{tier.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-3" />}
              </button>;
  })}
        </div>
      </div>

      {
    /* Special Deals & Availability */
  }
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Deals & Availability
        </h4>

        {
    /* On Sale */
  }
        <label
    onClick={() => onFilterChange({ onSaleOnly: !filters.onSaleOnly, page: 1 })}
    className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 hover:text-slate-900 py-1"
  >
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filters.onSaleOnly ? "bg-rose-600 border-rose-600 text-white" : "border-slate-300 bg-white"}`}>
            {filters.onSaleOnly && <Check className="w-3 h-3 stroke-3" />}
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-rose-500" />
            <span className={filters.onSaleOnly ? "font-semibold text-rose-700" : ""}>
              On Sale / Special Deals
            </span>
          </div>
        </label>

        {
    /* In Stock */
  }
        <label
    onClick={() => onFilterChange({ inStockOnly: !filters.inStockOnly, page: 1 })}
    className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 hover:text-slate-900 py-1"
  >
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filters.inStockOnly ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"}`}>
            {filters.inStockOnly && <Check className="w-3 h-3 stroke-3" />}
          </div>
          <span className={filters.inStockOnly ? "font-semibold text-blue-600" : ""}>
            In Stock Only
          </span>
        </label>
      </div>
    </div>;
};
export {
  ProductFiltersComponent
};
