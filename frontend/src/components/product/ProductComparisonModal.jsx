import { useState, useMemo, useEffect } from "react";
import {
  X,
  Star,
  Check,
  ShoppingBag,
  Plus,
  Trash2,
  Columns3,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  Search
} from "lucide-react";
import { useComparison } from "../../context/ComparisonContext";
import { useCart } from "../../context/CartContext";
import { api } from "../../services/api";
import { LazyImage } from "../common/LazyImage";
const ProductComparisonModal = ({ onNavigate }) => {
  const {
    comparedProducts,
    removeFromCompare,
    clearCompare,
    addToCompare,
    isCompareModalOpen,
    closeCompareModal
  } = useComparison();
  const { addToCart } = useCart();
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [addingSlotIndex, setAddingSlotIndex] = useState(null);
  const [allCatalogProducts, setAllCatalogProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedIds, setAddedIds] = useState({});
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (addingSlotIndex !== null) {
          setAddingSlotIndex(null);
        } else {
          closeCompareModal();
        }
      }
    };
    if (isCompareModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isCompareModalOpen, addingSlotIndex, closeCompareModal]);
  useEffect(() => {
    if (isCompareModalOpen && allCatalogProducts.length === 0) {
      api.getProducts({ limit: 40 }).then((res) => {
        setAllCatalogProducts(res.items);
      }).catch(console.error);
    }
  }, [isCompareModalOpen, allCatalogProducts.length]);
  const allSpecKeys = useMemo(() => {
    const keysSet = /* @__PURE__ */ new Set();
    comparedProducts.forEach((p) => {
      if (p.specs) {
        Object.keys(p.specs).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet);
  }, [comparedProducts]);
  const isRowDifferent = (getValue) => {
    if (comparedProducts.length <= 1) return false;
    const firstVal = JSON.stringify(getValue(comparedProducts[0]));
    return comparedProducts.some((p) => JSON.stringify(getValue(p)) !== firstVal);
  };
  const handleAddToCart = async (product) => {
    if (product.stock < 1) return;
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    await addToCart(product, 1);
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };
  const availableToAdd = useMemo(() => {
    return allCatalogProducts.filter(
      (p) => !comparedProducts.some((cp) => cp.id === p.id) && (searchQuery.trim() === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allCatalogProducts, comparedProducts, searchQuery]);
  if (!isCompareModalOpen) return null;
  return <div
    className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200"
    onClick={() => {
      if (addingSlotIndex !== null) setAddingSlotIndex(null);
      else closeCompareModal();
    }}
  >
      <div
    className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
    onClick={(e) => e.stopPropagation()}
    id="product-comparison-modal"
  >
        {
    /* Modal Header */
  }
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Columns3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Side-by-Side Product Comparison
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  {comparedProducts.length}/3 Selected
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Compare specifications, pricing, ratings, and features side-by-side.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {
    /* Highlight Differences Toggle */
  }
            {comparedProducts.length > 1 && <button
    onClick={() => setHighlightDifferences(!highlightDifferences)}
    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${highlightDifferences ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
    title="Toggle highlighting of differing specifications"
  >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Highlight Differences</span>
              </button>}

            {comparedProducts.length > 0 && <button
    onClick={clearCompare}
    className="text-xs text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1"
    title="Clear all compared items"
  >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>}

            <button
    onClick={closeCompareModal}
    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
    aria-label="Close comparison modal"
  >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {
    /* Empty State */
  }
        {comparedProducts.length === 0 ? <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Columns3 className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-800">No Products in Comparison</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click the "Compare" checkbox or button on any product card or product details page to view detailed technical specifications side by side.
              </p>
            </div>
            <button
    onClick={() => {
      closeCompareModal();
      if (onNavigate) onNavigate("home");
    }}
    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
  >
              Browse Product Catalog
            </button>
          </div> : <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {
    /* Top Product Cards Grid */
  }
            <div className="p-6 bg-slate-50/40">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {
    /* Render Selected Products */
  }
                {comparedProducts.map((product) => {
    const discount = product.originalPrice && product.originalPrice > product.price ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100) : 0;
    return <div
      key={product.id}
      className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs relative group"
    >
                      {
      /* Remove Button */
    }
                      <button
      onClick={() => removeFromCompare(product.id)}
      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors z-10"
      title={`Remove ${product.name}`}
      aria-label={`Remove ${product.name} from comparison`}
    >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        {
      /* Image */
    }
                        <div
      className="w-full h-40 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center p-2 mb-3 cursor-pointer relative"
      onClick={() => {
        closeCompareModal();
        if (onNavigate) onNavigate("product-details", product.id);
      }}
    >
                          <LazyImage
      src={product.images[0]}
      alt={product.name}
      objectFit="contain"
      className="max-h-full max-w-full group-hover:scale-105 transition-transform duration-200"
      wrapperClassName="w-full h-full flex items-center justify-center bg-transparent"
    />
                          {discount > 0 && <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                              -{discount}%
                            </span>}
                        </div>

                        {
      /* Category & Title */
    }
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                          {product.categoryName || "Catalog Item"}
                        </span>
                        <h4
      onClick={() => {
        closeCompareModal();
        if (onNavigate) onNavigate("product-details", product.id);
      }}
      className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer mb-2"
    >
                          {product.name}
                        </h4>

                        {
      /* Rating */
    }
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold mb-3">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{product.rating.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">
                            ({product.reviewCount} reviews)
                          </span>
                        </div>

                        {
      /* Price */
    }
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-xl font-extrabold text-slate-900">
                            ${product.price.toFixed(2)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && <span className="text-xs text-slate-400 line-through">
                              ${product.originalPrice.toFixed(2)}
                            </span>}
                        </div>
                      </div>

                      {
      /* Add to Cart CTA */
    }
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <button
      onClick={() => handleAddToCart(product)}
      disabled={product.stock === 0 || addedIds[product.id]}
      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${product.stock === 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : addedIds[product.id] ? "bg-emerald-600 text-white" : "bg-slate-900 hover:bg-blue-600 text-white active:scale-98"}`}
    >
                          {addedIds[product.id] ? <>
                              <Check className="w-3.5 h-3.5" /> Added to Cart
                            </> : <>
                              <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                            </>}
                        </button>

                        <button
      onClick={() => {
        closeCompareModal();
        if (onNavigate) onNavigate("product-details", product.id);
      }}
      className="w-full py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1"
    >
                          <span>Full Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>;
  })}

                {
    /* Empty Slots to Add More (up to 3 total) */
  }
                {Array.from({ length: 3 - comparedProducts.length }).map((_, idx) => {
    const slotNum = comparedProducts.length + idx + 1;
    const isPickerOpen = addingSlotIndex === slotNum;
    return <div
      key={`empty-slot-${slotNum}`}
      className="rounded-xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-85 bg-slate-50/50 relative"
    >
                      {isPickerOpen ? <div className="w-full h-full flex flex-col space-y-2">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-700">
                              Select Product to Compare
                            </span>
                            <button
      onClick={() => setAddingSlotIndex(null)}
      className="p-1 text-slate-400 hover:text-slate-600"
    >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search products..."
      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
      autoFocus
    />
                          </div>

                          <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-slate-100 text-left">
                            {availableToAdd.slice(0, 10).map((cand) => <button
      key={cand.id}
      onClick={() => {
        addToCompare(cand);
        setAddingSlotIndex(null);
        setSearchQuery("");
      }}
      className="w-full p-2 hover:bg-blue-50 flex items-center gap-2.5 text-left transition-colors rounded-lg"
    >
                                <div className="w-8 h-8 shrink-0 rounded bg-slate-100 p-0.5 overflow-hidden">
                                  <LazyImage
      src={cand.images[0]}
      alt={cand.name}
      objectFit="contain"
      className="w-full h-full"
      wrapperClassName="w-full h-full bg-transparent"
    />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-slate-800 truncate">
                                    {cand.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium">
                                    ${cand.price.toFixed(2)}
                                  </div>
                                </div>
                                <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              </button>)}
                            {availableToAdd.length === 0 && <div className="p-4 text-center text-xs text-slate-400">
                                No matching products found.
                              </div>}
                          </div>
                        </div> : <>
                          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                            <Plus className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-700">
                              Slot {slotNum} Empty
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Add another item to compare specifications
                            </p>
                          </div>
                          <button
      onClick={() => {
        setAddingSlotIndex(slotNum);
        setSearchQuery("");
      }}
      className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
    >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Select Product</span>
                          </button>
                        </>}
                    </div>;
  })}
              </div>
            </div>

            {
    /* Specifications Comparison Table Section */
  }
            <div className="p-6 space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Technical Specifications & Feature Matrix</span>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 font-bold text-slate-700 w-1/4">Specification</th>
                      {comparedProducts.map((prod) => <th key={`th-${prod.id}`} className="py-3 px-4 font-bold text-slate-800 w-1/4">
                          {prod.name}
                        </th>)}
                      {Array.from({ length: 3 - comparedProducts.length }).map((_, i) => <th
    key={`th-empty-${i}`}
    className="py-3 px-4 font-normal text-slate-400 italic w-1/4"
  >
                          Slot {comparedProducts.length + i + 1}
                        </th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {
    /* General Specs */
  }
                    {
    /* Brand */
  }
                    <tr
    className={`hover:bg-slate-50/80 transition-colors ${highlightDifferences && isRowDifferent((p) => p.brand) ? "bg-amber-50/60 font-medium" : ""}`}
  >
                      <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">Brand</td>
                      {comparedProducts.map((p) => <td key={`brand-${p.id}`} className="py-3 px-4 text-slate-800">
                          {p.brand || "Vendora Precision"}
                        </td>)}
                      {Array.from({ length: 3 - comparedProducts.length }).map((_, i) => <td key={`b-emp-${i}`} className="py-3 px-4 text-slate-300">-</td>)}
                    </tr>

                    {
    /* Category */
  }
                    <tr
    className={`hover:bg-slate-50/80 transition-colors ${highlightDifferences && isRowDifferent((p) => p.categoryId) ? "bg-amber-50/60 font-medium" : ""}`}
  >
                      <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">Category</td>
                      {comparedProducts.map((p) => <td key={`cat-${p.id}`} className="py-3 px-4 text-slate-800">
                          {p.categoryName || "Standard"}
                        </td>)}
                      {Array.from({ length: 3 - comparedProducts.length }).map((_, i) => <td key={`c-emp-${i}`} className="py-3 px-4 text-slate-300">-</td>)}
                    </tr>

                    {
    /* Stock Status */
  }
                    <tr
    className={`hover:bg-slate-50/80 transition-colors ${highlightDifferences && isRowDifferent((p) => p.stock > 0) ? "bg-amber-50/60 font-medium" : ""}`}
  >
                      <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">Availability</td>
                      {comparedProducts.map((p) => <td key={`stock-${p.id}`} className="py-3 px-4">
                          {p.stock > 5 ? <span className="inline-flex items-center gap-1 text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded">
                              <Check className="w-3 h-3" /> In Stock ({p.stock} units)
                            </span> : p.stock > 0 ? <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                              Low Stock ({p.stock} remaining)
                            </span> : <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                              Out of Stock
                            </span>}
                        </td>)}
                      {Array.from({ length: 3 - comparedProducts.length }).map((_, i) => <td key={`s-emp-${i}`} className="py-3 px-4 text-slate-300">-</td>)}
                    </tr>

                    {
    /* Dynamic Product Specs */
  }
                    {allSpecKeys.map((key) => {
    const isDiff = isRowDifferent((p) => p.specs?.[key] || "N/A");
    return <tr
      key={`spec-row-${key}`}
      className={`hover:bg-slate-50/80 transition-colors ${highlightDifferences && isDiff ? "bg-amber-50/70 font-medium" : ""}`}
    >
                          <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">
                            {key}
                          </td>
                          {comparedProducts.map((p) => <td key={`spec-${p.id}-${key}`} className="py-3 px-4 text-slate-800">
                              {p.specs?.[key] || <span className="text-slate-400 italic">Not specified</span>}
                            </td>)}
                          {Array.from({ length: 3 - comparedProducts.length }).map((_, i) => <td key={`spec-emp-${i}-${key}`} className="py-3 px-4 text-slate-300">
                              -
                            </td>)}
                        </tr>;
  })}

                    {
    /* Key Tags / Features */
  }
                    <tr
    className={`hover:bg-slate-50/80 transition-colors ${highlightDifferences && isRowDifferent((p) => p.tags) ? "bg-amber-50/60 font-medium" : ""}`}
  >
                      <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">Key Tags</td>
                      {comparedProducts.map((p) => <td key={`tags-${p.id}`} className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {p.tags.map((t) => <span
    key={t}
    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
  >
                                #{t}
                              </span>)}
                          </div>
                        </td>)}
                      {Array.from({ length: 3 - comparedProducts.length }).map((_, i) => <td key={`t-emp-${i}`} className="py-3 px-4 text-slate-300">-</td>)}
                    </tr>

                    {
    /* Description */
  }
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">Overview</td>
                      {comparedProducts.map((p) => <td key={`desc-${p.id}`} className="py-3 px-4 text-slate-600 leading-relaxed text-[11px]">
                          {p.shortDescription}
                        </td>)}
                      {Array.from({ length: 3 - comparedProducts.length }).map((_, i) => <td key={`d-emp-${i}`} className="py-3 px-4 text-slate-300">-</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>}

        {
    /* Modal Footer */
  }
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {comparedProducts.length > 0 ? `${comparedProducts.length} of 3 comparison slots used` : "Add products from the catalog to compare"}
          </div>
          <button
    onClick={closeCompareModal}
    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
  >
            Close Comparison
          </button>
        </div>
      </div>
    </div>;
};
export {
  ProductComparisonModal
};
