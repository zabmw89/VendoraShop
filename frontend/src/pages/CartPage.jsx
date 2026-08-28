import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Truck,
  ArrowLeft,
  CheckCircle2,
  Heart,
  Bookmark
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { CartPageSkeleton } from "../components/skeletons/CartPageSkeleton";
const SAVED_FOR_LATER_STORAGE_KEY = "vendora_saved_for_later_v1";
const CartPage = ({ onNavigate }) => {
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    tax,
    discount,
    total,
    updateQuantity,
    removeItem,
    addToCart,
    applyCoupon,
    removeCoupon,
    clearCart,
    cart,
    isLoading
  } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [savedForLater, setSavedForLater] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_FOR_LATER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_FOR_LATER_STORAGE_KEY, JSON.stringify(savedForLater));
    } catch (e) {
      console.error("Failed to persist saved for later items:", e);
    }
  }, [savedForLater]);
  const freeShippingThreshold = 75;
  const freeShippingProgress = Math.min(100, subtotal / freeShippingThreshold * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      setIsApplying(true);
      await applyCoupon(couponCode.trim());
      setCouponCode("");
    } catch {
    } finally {
      setIsApplying(false);
    }
  };
  const handleMoveToWishlist = async (product) => {
    try {
      if (!isInWishlist(product.id)) {
        await toggleWishlist(product);
      }
      await removeItem(product.id);
      showToast(`Moved "${product.name}" to your Wishlist.`, "success");
    } catch (err) {
      showToast("Failed to move item to Wishlist.", "error");
    }
  };
  const handleSaveForLater = async (product) => {
    try {
      setSavedForLater((prev) => {
        const filtered = prev.filter((item) => item.productId !== product.id);
        return [
          {
            productId: product.id,
            product,
            savedAt: (/* @__PURE__ */ new Date()).toISOString()
          },
          ...filtered
        ];
      });
      await removeItem(product.id);
      showToast(`"${product.name}" saved for later.`, "info");
    } catch (err) {
      showToast("Failed to save item for later.", "error");
    }
  };
  const handleMoveSavedToCart = async (item) => {
    try {
      await addToCart(item.product, 1);
      setSavedForLater((prev) => prev.filter((i) => i.productId !== item.productId));
      showToast(`Moved "${item.product.name}" back into your Cart.`, "success");
    } catch (err) {
      showToast("Failed to move item to Cart.", "error");
    }
  };
  const handleMoveSavedToWishlist = async (item) => {
    try {
      if (!isInWishlist(item.productId)) {
        await toggleWishlist(item.product);
      }
      setSavedForLater((prev) => prev.filter((i) => i.productId !== item.productId));
      showToast(`Moved "${item.product.name}" to your Wishlist.`, "success");
    } catch (err) {
      showToast("Failed to move item to Wishlist.", "error");
    }
  };
  const handleRemoveSaved = (productId) => {
    setSavedForLater((prev) => prev.filter((i) => i.productId !== productId));
    showToast("Item removed from Saved for Later.", "info");
  };
  if (isLoading) {
    return <CartPageSkeleton />;
  }
  if (items.length === 0 && savedForLater.length === 0) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Your Shopping Cart is Empty</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You haven't added any products to your bag yet. Explore our curated collections and discover flagship technology.
          </p>
        </div>
        <button
      onClick={() => onNavigate("home")}
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-sm font-semibold shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
    >
          <ArrowLeft className="w-4 h-4" /> Start Shopping
        </button>
      </div>;
  }
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {
    /* Title & Actions */
  }
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            Shopping Cart
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your chosen items, move products to your wishlist, or save items for later.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
    onClick={() => onNavigate("home")}
    className="text-xs font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
  >
            <ArrowLeft className="w-4 h-4" /> Continue Browsing
          </button>
          {items.length > 0 && <button
    onClick={clearCart}
    className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
  >
              <Trash2 className="w-3.5 h-3.5" /> Clear Cart
            </button>}
        </div>
      </div>

      {
    /* Free Shipping Progress Indicator (Only if there are items in active cart) */
  }
      {items.length > 0 && <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              {subtotal >= freeShippingThreshold ? <span className="text-green-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Congratulations! You qualified for Free Express Shipping.
                </span> : <span>
                  Add <strong className="text-blue-600">${remainingForFreeShipping.toFixed(2)}</strong> more to enjoy Free Shipping
                </span>}
            </span>
            <span className="text-slate-400">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
    className={`h-full transition-all duration-500 rounded-full ${subtotal >= freeShippingThreshold ? "bg-green-500" : "bg-blue-600"}`}
    style={{ width: `${freeShippingProgress}%` }}
  />
          </div>
        </div>}

      {
    /* Main Grid: Cart Items List + Order Summary */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {
    /* Left Column: Active Cart Items + Saved for Later */
  }
        <div className="lg:col-span-8 space-y-8">
          {
    /* Active Cart Items */
  }
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>Cart Items ({items.length})</span>
              </h2>
            </div>

            {items.length === 0 ? <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <p>There are currently no active items in your cart.</p>
                <p className="text-slate-400">Items you saved for later are listed below.</p>
              </div> : <div className="divide-y divide-slate-100">
                {items.map((item) => <div
    key={item.productId}
    className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center gap-5"
  >
                    <img
    src={item.product.images[0]}
    alt={item.product.name}
    className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg bg-slate-50 border border-slate-200 shrink-0 cursor-pointer p-2 hover:opacity-90 transition-opacity"
    onClick={() => onNavigate("product", item.productId)}
  />

                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                        {item.product.categoryName || "Product"}
                      </span>
                      <h3
    onClick={() => onNavigate("product", item.productId)}
    className="text-sm font-semibold text-slate-800 hover:text-blue-600 cursor-pointer truncate"
  >
                        {item.product.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">
                        Unit Price: ${item.product.price.toFixed(2)}
                      </p>

                      {
    /* Management Action Links: Move to Wishlist & Save for Later */
  }
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
    onClick={() => handleMoveToWishlist(item.product)}
    className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer group"
    id={`move-wishlist-${item.productId}`}
  >
                          <Heart className="w-3.5 h-3.5 group-hover:fill-rose-500 text-slate-400 group-hover:text-rose-500" />
                          <span>Move to Wishlist</span>
                        </button>

                        <span className="text-slate-300">|</span>

                        <button
    onClick={() => handleSaveForLater(item.product)}
    className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
    id={`save-later-${item.productId}`}
  >
                          <Bookmark className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
                          <span>Save for Later</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                      {
    /* Quantity Stepper */
  }
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
    disabled={isLoading}
    className="p-1.5 px-3 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40"
    aria-label="Decrease quantity"
  >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
    disabled={isLoading || item.quantity >= item.product.stock}
    className="p-1.5 px-3 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
    aria-label="Increase quantity"
  >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {
    /* Line Total */
  }
                      <div className="text-right min-w-20">
                        <span className="text-sm font-bold text-slate-900">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {
    /* Delete Button */
  }
                      <button
    onClick={() => removeItem(item.productId)}
    className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
    title="Remove from cart"
    aria-label="Remove item"
  >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>)}
              </div>}
          </div>

          {
    /* Dedicated 'Saved for Later' Section */
  }
          {savedForLater.length > 0 && <div
    className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs"
    id="saved-for-later-section"
  >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Bookmark className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Saved for Later ({savedForLater.length})
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Items you have set aside to purchase in a future session.
                    </p>
                  </div>
                </div>

                <button
    onClick={() => {
      setSavedForLater([]);
      showToast("Saved for later list cleared.", "info");
    }}
    className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
  >
                  Clear All
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {savedForLater.map((item) => <div
    key={item.productId}
    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <img
    src={item.product.images[0]}
    alt={item.product.name}
    className="w-16 h-16 object-contain rounded-lg bg-slate-50 border border-slate-200 shrink-0 p-1.5 cursor-pointer"
    onClick={() => onNavigate("product", item.productId)}
  />
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                          {item.product.categoryName || "Product"}
                        </span>
                        <h4
    onClick={() => onNavigate("product", item.productId)}
    className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-blue-600 cursor-pointer truncate max-w-sm"
  >
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-900">
                            ${item.product.price.toFixed(2)}
                          </span>
                          {item.product.stock > 0 ? <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                              In Stock
                            </span> : <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                              Out of stock
                            </span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                      <button
    onClick={() => handleMoveSavedToCart(item)}
    disabled={item.product.stock === 0}
    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:bg-slate-200 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
    id={`move-cart-saved-${item.productId}`}
  >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Cart</span>
                      </button>

                      <button
    onClick={() => handleMoveSavedToWishlist(item)}
    className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 bg-white text-slate-600 hover:text-rose-600 transition-colors"
    title="Move to Wishlist"
    aria-label="Move to Wishlist"
  >
                        <Heart className="w-4 h-4" />
                      </button>

                      <button
    onClick={() => handleRemoveSaved(item.productId)}
    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors"
    title="Remove from saved list"
    aria-label="Delete saved item"
  >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>)}
              </div>
            </div>}
        </div>

        {
    /* Right Column: Summary Card */
  }
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs sticky top-24">
            <h2 className="text-base font-bold text-slate-900">Order Summary</h2>

            {
    /* Coupon Code Section */
  }
            {cart?.appliedCoupon ? <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-bold">{cart.appliedCoupon.code}</p>
                    <p className="text-[11px] text-green-600">{cart.appliedCoupon.description}</p>
                  </div>
                </div>
                <button
    onClick={removeCoupon}
    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
  >
                  Remove
                </button>
              </div> : <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <input
    type="text"
    placeholder="Promo code (WELCOME10)"
    value={couponCode}
    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none uppercase font-mono"
  />
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <button
    type="submit"
    disabled={isApplying || !couponCode.trim()}
    className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
  >
                  Apply
                </button>
              </form>}

            {
    /* Breakdown */
  }
            <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && <div className="flex justify-between text-green-700 font-semibold">
                  <span>Promotional Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span>
                  {shippingFee === 0 ? <strong className="text-green-600">FREE</strong> : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Sales Tax (8.25%)</span>
                <span className="font-semibold text-slate-900">${tax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-blue-600 text-lg">${total.toFixed(2)}</span>
              </div>
            </div>

            {
    /* Checkout Action Button */
  }
            <button
    onClick={() => onNavigate("checkout")}
    disabled={items.length === 0}
    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
    id="cart-page-checkout-btn"
  >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Encrypted Checkout with Money-Back Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export {
  CartPage
};
