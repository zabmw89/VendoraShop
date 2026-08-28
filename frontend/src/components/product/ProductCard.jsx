import React from "react";
import { Star, ShoppingBag, Eye, Check, AlertCircle, Heart, Columns3 } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useComparison } from "../../context/ComparisonContext";
import { LazyImage } from "../common/LazyImage";
const ProductCard = ({ product, onSelect, viewMode = "grid" }) => {
  const { addToCart, isLoading: isCartLoading } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare } = useComparison();
  const [isAdding, setIsAdding] = React.useState(false);
  const [isWishlistAnimating, setIsWishlistAnimating] = React.useState(false);
  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);
  const discountPercent = product.originalPrice && product.originalPrice > product.price ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100) : 0;
  const handleQuickAdd = async (e) => {
    e.stopPropagation();
    if (product.stock < 1) return;
    setIsAdding(true);
    await addToCart(product, 1);
    setTimeout(() => setIsAdding(false), 1200);
  };
  const handleWishlistClick = async (e) => {
    e.stopPropagation();
    setIsWishlistAnimating(true);
    await toggleWishlist(product);
    setTimeout(() => setIsWishlistAnimating(false), 400);
  };
  const handleCompareClick = (e) => {
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };
  if (viewMode === "list") {
    return <div
      onClick={() => onSelect(product.id)}
      id={`product-card-${product.id}`}
      className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md active:scale-95 transition-all duration-150 p-4 flex flex-col sm:flex-row items-center gap-5 cursor-pointer relative select-none"
    >
        <div className="relative w-full sm:w-44 h-44 shrink-0 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
          <LazyImage
      src={product.images[0]}
      alt={product.name}
      objectFit="cover"
      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
      wrapperClassName="w-full h-full flex items-center justify-center"
    />
          {discountPercent > 0 && <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              -{discountPercent}%
            </span>}

          {
      /* Heart toggle on mobile/card image */
    }
          <button
      onClick={handleWishlistClick}
      id={`wishlist-btn-${product.id}`}
      aria-label={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
      className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-xs transition-all duration-200 shadow-xs z-10 ${inWishlist ? "bg-white text-rose-500 scale-105 shadow-rose-100" : "bg-white/80 text-slate-500 hover:text-rose-500 hover:bg-white"} ${isWishlistAnimating ? "scale-125" : ""}`}
    >
            <Heart
      className={`w-4 h-4 transition-colors ${inWishlist ? "fill-rose-500 text-rose-500" : "stroke-current"}`}
    />
          </button>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-tight">
              {product.categoryName || "Product"}
            </span>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({product.reviewCount})</span>
            </div>
          </div>

          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          <div className="flex items-center gap-3 pt-1">
            {product.stock > 5 && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                <Check className="w-3 h-3" /> In Stock ({product.stock})
              </span>}
            {product.stock > 0 && product.stock <= 5 && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Only {product.stock} left
              </span>}
            {product.stock === 0 && <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                Out of Stock
              </span>}
          </div>
        </div>

        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div>
            <div className="text-xl font-bold text-slate-900">
              ${product.price.toFixed(2)}
            </div>
            {product.originalPrice && product.originalPrice > product.price && <div className="text-xs text-slate-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </div>}
          </div>

          <div className="flex items-center gap-2">
            <button
      onClick={handleCompareClick}
      id={`compare-list-btn-${product.id}`}
      title={inCompare ? "Remove from Comparison" : "Add to Comparison"}
      className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 ${inCompare ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200"}`}
    >
              <Columns3 className="w-4 h-4" />
              <span className="hidden sm:inline">{inCompare ? "Comparing" : "Compare"}</span>
            </button>

            <button
      onClick={handleWishlistClick}
      id={`wishlist-list-btn-${product.id}`}
      title={inWishlist ? "Saved in Wishlist" : "Add to Wishlist"}
      className={`p-2 rounded-lg border transition-all ${inWishlist ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-600 hover:text-rose-500 hover:border-rose-200"}`}
    >
              <Heart className={`w-4 h-4 ${inWishlist ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>

            <button
      onClick={handleQuickAdd}
      disabled={product.stock === 0 || isAdding || isCartLoading}
      className={`px-4 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 shadow-xs ${product.stock === 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : isAdding ? "bg-emerald-600 text-white" : "bg-slate-900 hover:bg-blue-600 text-white active:scale-95"}`}
    >
              {isAdding ? <>
                  <Check className="w-3.5 h-3.5" /> Added
                </> : <>
                  <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                </>}
            </button>
          </div>
        </div>
      </div>;
  }
  return <div
    onClick={() => onSelect(product.id)}
    id={`product-card-${product.id}`}
    className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md active:scale-95 transition-all duration-150 flex flex-col cursor-pointer relative select-none"
  >
      {
    /* Product Image Stage */
  }
      <div className="h-48 bg-slate-50 flex items-center justify-center p-3 relative overflow-hidden">
        <LazyImage
    src={product.images[0]}
    alt={product.name}
    objectFit="contain"
    className="max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
    wrapperClassName="w-full h-full flex items-center justify-center bg-transparent"
  />

        {
    /* Overlay Badges */
  }
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {discountPercent > 0 && <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
              -{discountPercent}%
            </span>}
          {product.featured && <span className="bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
              Featured
            </span>}
        </div>

        {
    /* Action Buttons on Card Top-Right */
  }
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
          {
    /* Compare toggle button */
  }
          <button
    onClick={handleCompareClick}
    id={`compare-card-btn-${product.id}`}
    aria-label={inCompare ? "Remove from Comparison" : "Compare Specifications"}
    title={inCompare ? "In comparison" : "Compare with other products"}
    className={`p-2 rounded-full backdrop-blur-xs transition-all duration-200 shadow-xs ${inCompare ? "bg-blue-600 text-white scale-105 shadow-blue-200" : "bg-white/85 text-slate-500 hover:text-blue-600 hover:bg-white hover:scale-110"}`}
  >
            <Columns3 className="w-3.5 h-3.5" />
          </button>

          {
    /* Heart Wishlist Toggle Button */
  }
          <button
    onClick={handleWishlistClick}
    id={`wishlist-card-btn-${product.id}`}
    aria-label={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    className={`p-2 rounded-full backdrop-blur-xs transition-all duration-200 shadow-xs ${inWishlist ? "bg-white text-rose-500 scale-105 shadow-rose-100" : "bg-white/85 text-slate-500 hover:text-rose-500 hover:bg-white hover:scale-110"} ${isWishlistAnimating ? "scale-125" : ""}`}
  >
            <Heart
    className={`w-4 h-4 transition-colors ${inWishlist ? "fill-rose-500 text-rose-500" : "stroke-current"}`}
  />
          </button>
        </div>

        {
    /* Quick View Button on Hover */
  }
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-slate-800 text-xs font-semibold shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" /> Quick View
          </span>
        </div>
      </div>

      {
    /* Product Information */
  }
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-tight truncate">
              {product.categoryName || "Product"}
            </span>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-slate-400 text-[10px]">({product.reviewCount})</span>
            </div>
          </div>

          <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm leading-snug">
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {product.shortDescription}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <div className="text-lg font-bold text-slate-900">
              ${product.price.toFixed(2)}
            </div>
            {product.originalPrice && product.originalPrice > product.price && <div className="text-xs text-slate-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </div>}
          </div>

          <button
    onClick={handleQuickAdd}
    disabled={product.stock === 0 || isAdding || isCartLoading}
    className={`p-2 rounded-lg transition-colors flex items-center justify-center shadow-xs ${product.stock === 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : isAdding ? "bg-emerald-600 text-white" : "bg-slate-900 hover:bg-blue-600 text-white active:scale-95"}`}
    title="Add to Shopping Cart"
    id={`add-to-cart-btn-${product.id}`}
  >
            {isAdding ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>;
};
export {
  ProductCard
};
