import { useState } from "react";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Truck
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { LazyImage } from "../common/LazyImage";
const CartDrawer = ({ onNavigate }) => {
  const {
    isDrawerOpen,
    closeDrawer,
    items,
    itemCount,
    subtotal,
    shippingFee,
    tax,
    discount,
    total,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    cart,
    isLoading
  } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const freeShippingThreshold = 75;
  const freeShippingProgress = Math.min(100, subtotal / freeShippingThreshold * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    try {
      setIsApplyingCoupon(true);
      await applyCoupon(couponInput.trim());
      setCouponInput("");
    } catch {
    } finally {
      setIsApplyingCoupon(false);
    }
  };
  const handleCheckoutClick = () => {
    closeDrawer();
    onNavigate("checkout");
  };
  const handleViewCart = () => {
    closeDrawer();
    onNavigate("cart");
  };
  if (!isDrawerOpen) return null;
  return <dialog open className="fixed inset-0 z-50 overflow-hidden">
      {
    /* Backdrop */
  }
      <div
    onClick={closeDrawer}
    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
  />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {
    /* Header */
  }
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Shopping Cart ({itemCount})
              </h2>
            </div>
            <button
    onClick={closeDrawer}
    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
    aria-label="Close cart"
  >
              <X className="w-5 h-5" />
            </button>
          </div>

          {
    /* Free Shipping Progress Indicator */
  }
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4 text-blue-600" />
                {subtotal >= freeShippingThreshold ? <span className="text-green-700 font-bold">You unlocked FREE Shipping!</span> : <span>Add <strong className="text-blue-600">${remainingForFreeShipping.toFixed(2)}</strong> more for Free Delivery</span>}
              </span>
              <span className="text-slate-400">{Math.round(freeShippingProgress)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
    className={`h-full transition-all duration-500 rounded-full ${subtotal >= freeShippingThreshold ? "bg-green-500" : "bg-blue-600"}`}
    style={{ width: `${freeShippingProgress}%` }}
  />
            </div>
          </div>

          {
    /* Items List */
  }
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100 space-y-4">
            {items.length === 0 ? <div className="text-center py-16 px-4 space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Explore our curated collection and add items to your bag.
                  </p>
                </div>
                <button
    onClick={() => {
      closeDrawer();
      onNavigate("home");
    }}
    className="px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
  >
                  Start Browsing
                </button>
              </div> : items.map((item) => <div key={item.productId} className="pt-4 first:pt-0 flex gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <LazyImage
    src={item.product.images[0]}
    alt={item.product.name}
    objectFit="cover"
    className="w-full h-full"
    wrapperClassName="w-full h-full"
  />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4
    onClick={() => {
      closeDrawer();
      onNavigate("product", item.productId);
    }}
    className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-blue-600 cursor-pointer truncate"
  >
                          {item.product.name}
                        </h4>
                        <button
    onClick={() => removeItem(item.productId)}
    className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
    title="Remove item"
  >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 mt-0.5">
                        ${item.product.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {
    /* Quantity Stepper */
  }
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
    disabled={isLoading}
    className="p-1 px-2 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
    aria-label="Decrease quantity"
  >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
    disabled={isLoading || item.quantity >= item.product.stock}
    className="p-1 px-2 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
    aria-label="Increase quantity"
  >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>)}
          </div>

          {
    /* Footer & Order Summary */
  }
          {items.length > 0 && <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/70 space-y-3">
              {
    /* Coupon Field */
  }
              {cart?.appliedCoupon ? <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-green-600" />
                    <span>Promo: <strong>{cart.appliedCoupon.code}</strong> applied</span>
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
    placeholder="Promo code (e.g. WELCOME10)"
    value={couponInput}
    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
    className="w-full pl-8 pr-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <button
    type="submit"
    disabled={isApplyingCoupon || !couponInput.trim()}
    className="px-3 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
  >
                    Apply
                  </button>
                </form>}

              {
    /* Price Calculation Breakdown */
  }
              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && <div className="flex justify-between text-green-700 font-medium">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span>{shippingFee === 0 ? <strong className="text-green-600">FREE</strong> : `$${shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8.25%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {
    /* Checkout Action CTAs */
  }
              <div className="space-y-2 pt-1">
                <button
    onClick={handleCheckoutClick}
    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
    id="drawer-checkout-btn"
  >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
                <button
    onClick={handleViewCart}
    className="w-full py-2 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors text-center cursor-pointer"
  >
                  View Full Cart Details
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <span>256-Bit SSL Encrypted & Guaranteed Safe Checkout</span>
              </div>
            </div>}
        </div>
      </div>
    </dialog>;
};
export {
  CartDrawer
};
