import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Package,
  Printer,
  ArrowRight,
  MapPin,
  Calendar,
  AlertCircle,
  PartyPopper
} from "lucide-react";
import { api } from "../services/api";
import { OrderStatusTracker } from "../components/account/OrderStatusTracker";
import { OrderConfirmationSkeleton } from "../components/skeletons/OrderConfirmationSkeleton";
import { triggerCelebrationConfetti, triggerFireworkShow } from "../utils/confetti";
import { triggerOrderSuccessHaptic } from "../utils/haptics";
const OrderConfirmationPage = ({ orderId, onNavigate }) => {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function loadOrder() {
      setIsLoading(true);
      try {
        const data = await api.getOrderById(orderId);
        setOrder(data);
        triggerCelebrationConfetti();
        triggerOrderSuccessHaptic();
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);
  const handleCelebrate = () => {
    triggerFireworkShow(2500);
    triggerOrderSuccessHaptic();
  };
  if (isLoading) {
    return <OrderConfirmationSkeleton />;
  }
  if (!order) {
    return <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Order Information Unavailable</h2>
        <p className="text-xs text-slate-500">We couldn't retrieve this order record.</p>
        <button
      onClick={() => onNavigate("home")}
      className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-medium cursor-pointer"
    >
          Return to Store
        </button>
      </div>;
  }
  const handlePrint = () => {
    window.print();
  };
  return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 print:p-0">
      {
    /* Header Banner */
  }
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-10 text-center space-y-4 shadow-xs relative overflow-hidden">
        {
    /* Subtle decorative glow */
  }
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-linear-to-b from-green-50/80 to-transparent pointer-events-none" />

        <button
    onClick={handleCelebrate}
    className="w-16 h-16 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50 hover:ring-green-100 transition-all cursor-pointer transform hover:scale-105 active:scale-95 shadow-xs relative z-10"
    title="Click to celebrate again!"
    aria-label="Trigger confetti celebration"
  >
          <CheckCircle2 className="w-9 h-9" />
        </button>

        <div className="space-y-1 relative z-10">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded uppercase tracking-wider border border-green-200/60">
              Order Confirmed & Paid
            </span>
            <button
    onClick={handleCelebrate}
    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200/80 transition-colors cursor-pointer"
    title="Re-launch festive confetti explosion"
  >
              <PartyPopper className="w-3.5 h-3.5 text-amber-500" />
              <span>Celebrate Again</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 pt-2">
            Thank you, {order.customerName || order.full_name || "Valued Customer"}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Your order has been authorized and dispatched to our logistics center. A confirmation receipt has been sent to <strong>{order.customerEmail || order.email || "your email"}</strong>.
          </p>
        </div>

        {
    /* Order Meta Bar */
  }
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100 text-left">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Order ID</span>
            <p className="text-xs font-bold text-slate-900 font-mono">{order.id}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Tracking Number</span>
            <p className="text-xs font-bold text-blue-600 font-mono">{order.trackingNumber || `VDR-${order.id}-US`}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Date Placed</span>
            <p className="text-xs font-bold text-slate-900">
              {new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Status</span>
            <p className="text-xs font-bold text-green-600 capitalize">{order.orderStatus || order.status || "Processing"}</p>
          </div>
        </div>
      </div>

      {
    /* Real-time Order Tracking Status */
  }
      <OrderStatusTracker
    orderId={order.id}
    trackingNumber={order.trackingNumber || `VDR-${order.id}-US`}
    onStatusUpdate={(updated) => {
      setOrder((prev) => prev ? { ...prev, status: updated.status || prev.status, orderStatus: updated.status || prev.orderStatus } : null);
    }}
  />

      {
    /* Itemized Order Breakdown */
  }
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Itemized Receipt
        </h3>

        <div className="divide-y divide-slate-100">
          {(order.items || []).map((item, idx) => {
            const itemPrice = Number(item.price ?? item.unit_price ?? 0);
            const itemQty = Number(item.quantity ?? 1);
            const itemTotal = Number(item.subtotal ?? (itemPrice * itemQty));
            const itemImg = item.productImage || item.product_image || (item.product && item.product.images && item.product.images[0]) || "";
            const itemName = item.productName || item.product_name || item.product?.name || "Product";
            const itemKey = item.productId || item.product_id || item.id || idx;

            return (
              <div key={itemKey} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {itemImg ? (
                    <img
                      src={itemImg}
                      alt={itemName}
                      className="w-14 h-14 object-contain rounded-lg bg-slate-50 border border-slate-200 shrink-0 p-1"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {itemName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Quantity: {itemQty} × ${itemPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 shrink-0">
                  ${itemTotal.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        {
    /* Calculation totals */
  }
        <div className="space-y-2 text-xs text-slate-600 pt-4 border-t border-slate-100 max-w-xs ml-auto">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">${Number(order.subtotal ?? order.subtotal_amount ?? 0).toFixed(2)}</span>
          </div>
          {Number(order.discount ?? order.discount_amount ?? 0) > 0 && <div className="flex justify-between text-green-700 font-semibold">
              <span>Promo Discount</span>
              <span>-${Number(order.discount ?? order.discount_amount ?? 0).toFixed(2)}</span>
            </div>}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{Number(order.shippingFee ?? order.shipping_amount ?? 0) === 0 ? <strong className="text-green-600">FREE</strong> : `$${Number(order.shippingFee ?? order.shipping_amount ?? 0).toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between">
            <span>Sales Tax</span>
            <span className="font-semibold text-slate-900">${Number(order.tax ?? order.tax_amount ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Paid</span>
            <span className="text-blue-600">${Number(order.total ?? order.total_amount ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {
    /* Shipping Address & Delivery Schedule */
  }
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Shipping Destination
          </h4>
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">{order.shippingAddress?.fullName || order.customerName || order.full_name}</p>
            <p>{order.shippingAddress?.street || order.shipping_address || ""}</p>
            <p>{order.shippingAddress?.city || order.city || ""}{order.state || order.shippingAddress?.state ? `, ${order.shippingAddress?.state || order.state}` : ""} {order.shippingAddress?.postalCode || order.zip_code || ""}</p>
            <p>{order.shippingAddress?.country || "United States"}</p>
            <p className="pt-1 text-slate-500">Phone: {order.shippingAddress?.phone || order.phone || ""}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Estimated Delivery Date
          </h4>
          <div className="text-xs text-slate-600 space-y-2">
            <p className="text-sm font-bold text-blue-900">
              {order.estimatedDelivery || "In 2-4 business days"}
            </p>
            <p className="text-slate-500">
              Carrier: <strong>Vendora Express Ground</strong>
            </p>
            <p className="text-[11px] text-slate-400">
              You will receive live GPS transit updates as soon as the package departs our distribution hub.
            </p>
          </div>
        </div>
      </div>

      {
    /* Action CTAs */
  }
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 print:hidden">
        <button
    onClick={handlePrint}
    className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
  >
          <Printer className="w-4 h-4" /> Print Invoice
        </button>

        <div className="flex items-center gap-3">
          <button
    onClick={() => onNavigate("account", "orders")}
    className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
  >
            View Order History
          </button>
          <button
    onClick={() => onNavigate("home")}
    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
  >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>;
};
export {
  OrderConfirmationPage
};
