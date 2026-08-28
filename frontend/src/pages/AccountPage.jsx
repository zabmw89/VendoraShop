import { useState, useEffect } from "react";
import {
  User,
  Package,
  MapPin,
  LogOut,
  Clock,
  CheckCircle2,
  Truck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  Heart,
  ShoppingBag,
  Trash2,
  Star,
  Check,
  AlertCircle,
  Zap,
  Award,
  Sparkles,
  Coins,
  TrendingUp,
  Gift,
  Shield,
  Download,
  ExternalLink,
  Search,
  X,
  Bell,
  Smartphone,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { OrderStatusTracker } from "../components/account/OrderStatusTracker";
import { AccountPageSkeleton } from "../components/skeletons/AccountPageSkeleton";
import { exportOrderToPDF, exportAllOrdersToPDF } from "../utils/pdfExport";
import { LazyImage } from "../components/common/LazyImage";
import { useNotifications } from "../context/NotificationContext";
import { triggerOrderSuccessHaptic, isVibrationSupported } from "../utils/haptics";

const getInitialAccountTab = (initialTab) => {
  const supportedTabs = ["tracking", "wishlist", "profile", "rewards"];
  return supportedTabs.includes(initialTab) ? initialTab : "orders";
};

const getTrackingProgress = (status) => {
  const progressByStatus = {
    delivered: [3, 100],
    out_for_delivery: [2, 80],
    shipped: [2, 60],
    processing: [1, 35]
  };
  return progressByStatus[status] || [0, 10];
};

const getStatusBadge = (status) => {
  const badges = {
    delivered: { color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2, label: "Delivered" },
    shipped: { color: "text-sky-700 bg-sky-50 border-sky-200", icon: Truck, label: "In Transit" },
    processing: { color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock, label: "Processing" },
    cancelled: { color: "text-rose-700 bg-rose-50 border-rose-200", label: "Cancelled" }
  };
  const badge = badges[status] || { color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock, label: "Pending" };
  const Icon = badge.icon;
  return <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${badge.color} border px-2 py-0.5 rounded`}>
    {Icon && <Icon className="w-3 h-3" />} {badge.label}
  </span>;
};

const getActiveOrdersCount = (orders) => orders.some((order) => order.status !== "delivered" && order.status !== "cancelled");

const getTrackingLabel = (tracking, order) => {
  if (tracking?.currentLocation) return tracking.currentLocation;
  if (tracking?.status) return tracking.status.replaceAll("_", " ");
  return `${order?.shippingAddress?.city || "Live"} Carrier Gateway Connected`;
};

const getStepTextClass = (isCurrent, isPastOrCurrent) => {
  if (isCurrent) return "text-blue-700 font-bold";
  if (isPastOrCurrent) return "text-slate-800";
  return "text-slate-400";
};

const getStepIconClass = (isCurrent, isPastOrCurrent) => {
  if (isCurrent) return "text-blue-600";
  if (isPastOrCurrent) return "text-slate-600";
  return "text-slate-300";
};

const getTransactionToneClass = (type) => {
  if (type === "earned") return "bg-emerald-50 text-emerald-600";
  if (type === "redeemed") return "bg-amber-50 text-amber-600";
  if (type === "bonus") return "bg-indigo-50 text-indigo-600";
  return "bg-indigo-50 text-indigo-600";
};

const AccountPage = ({ onNavigate, initialTab }) => {
  const { user, logout, updateProfile, changePassword, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { wishlist, removeFromWishlist, clearWishlist, isLoading: wishlistLoading } = useWishlist();
  const { addToCart, openDrawer } = useCart();
  const { permission, preferences, requestPermission, updatePreferences, sendFlashSaleAlert } = useNotifications();
  const [activeTab, setActiveTab] = useState(() => getInitialAccountTab(initialTab));
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [movingProductId, setMovingProductId] = useState(null);
  const [expandedTrackingOrderIds, setExpandedTrackingOrderIds] = useState({});
  const [orderTrackingMap, setOrderTrackingMap] = useState({});
  const [trackingSearchInput, setTrackingSearchInput] = useState("");
  const toggleTracking = (orderId) => {
    setExpandedTrackingOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };
  const handleClearTrackingSearch = () => {
    setTrackingSearchInput("");
  };
  const handleTrackingStatusUpdate = (orderId, updatedTracking) => {
    setOrderTrackingMap((prev) => ({
      ...prev,
      [orderId]: updatedTracking
    }));
    setOrders(
      (prevOrders) => prevOrders.map(
        (ord) => ord.id === orderId ? {
          ...ord,
          status: updatedTracking.status || ord.status,
          orderStatus: updatedTracking.status || ord.orderStatus
        } : ord
      )
    );
  };
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  useEffect(() => {
    setActiveTab(getInitialAccountTab(initialTab));
  }, [initialTab]);
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setStreet(user.address?.street || "");
      setCity(user.address?.city || "");
      setState(user.address?.state || "");
      setPostalCode(user.address?.postalCode || "");
      loadOrders();
      loadLoyalty();
    }
  }, [user]);
  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const data = await api.getUserOrders();
      setOrders(data);
      if (data.length > 0) {
        const initialExpanded = {};
        data.forEach((o, i) => {
          if (i === 0 && o.status !== "delivered") {
            initialExpanded[o.id] = true;
          }
        });
        setExpandedTrackingOrderIds(initialExpanded);
        Promise.all(
          data.map(async (order) => {
            try {
              const trk = await api.getShipmentTracking(order.id);
              return { orderId: order.id, tracking: trk };
            } catch {
              return null;
            }
          })
        ).then((results) => {
          const map = {};
          results.forEach((res) => {
            if (res?.tracking) {
              map[res.orderId] = res.tracking;
            }
          });
          setOrderTrackingMap((prev) => ({ ...prev, ...map }));
        });
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };
  const loadLoyalty = async () => {
    setIsLoadingLoyalty(true);
    try {
      const data = await api.getLoyaltyAccount();
      setLoyaltyAccount(data);
    } catch (err) {
      console.error("Failed to load loyalty account:", err);
    } finally {
      setIsLoadingLoyalty(false);
    }
  };
  if (authLoading) {
    return <AccountPageSkeleton />;
  }
  if (!user) {
    return <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Sign in to Access Your Account</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            View your complete order history, access your saved wishlist items, track live package shipments, and manage loyalty rewards.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
      type="button"
      onClick={() => onNavigate("auth", "login")}
      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
    >
            Sign In Now
          </button>
          <button
      type="button"
      onClick={() => onNavigate("auth", "register")}
      className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200"
    >
            Create an Account
          </button>
        </div>
      </div>;
  }
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({
        name,
        phone,
        address: {
          street,
          city,
          state,
          postalCode,
          country: "United States"
        }
      });
      setIsEditing(false);
      showToast("Profile updated successfully!", "success");
    } catch {
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully!", "success");
    } catch (err) {
      const msg = err?.data?.error || err?.data?.confirm_password || err?.message || "Failed to update password.";
      setPasswordError(typeof msg === "string" ? msg : JSON.stringify(msg));
      showToast("Failed to update password.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };
  const handleMoveToCart = async (product) => {
    if (product.stock < 1) {
      showToast("This item is currently out of stock.", "error");
      return;
    }
    setMovingProductId(product.id);
    const success = await addToCart(product, 1);
    setMovingProductId(null);
    if (success) {
      openDrawer();
    }
  };
  const handleMoveAllToCart = async () => {
    const available = wishlist.filter((p) => p.stock > 0);
    if (available.length === 0) {
      showToast("No in-stock items to add to cart.", "info");
      return;
    }
    for (const item of available) {
      await addToCart(item, 1);
    }
    showToast(`Added ${available.length} items from your wishlist to the cart.`, "success");
    openDrawer();
  };
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {
    /* Account Profile Header */
  }
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-xs">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
              {user.role === "admin" && <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  Administrator
                </span>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString(void 0, { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.role === "admin" && <button
    type="button"
    onClick={() => onNavigate("admin")}
    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
  >
              Admin Dashboard
            </button>}
          <button
    type="button"
    onClick={() => {
      logout();
      onNavigate("home");
    }}
    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
  >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {
    /* Tabs */
  }
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold overflow-x-auto">
        <button
    type="button"
    onClick={() => setActiveTab("orders")}
    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${activeTab === "orders" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
  >
          <Package className="w-4 h-4" />
          Order History ({orders.length})
        </button>

        <button
    type="button"
    onClick={() => setActiveTab("tracking")}
    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${activeTab === "tracking" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
  >
          <Truck className="w-4 h-4 text-blue-600" />
          Order Tracking
          {getActiveOrdersCount(orders) && <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full animate-pulse">
              {orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled").length} active
            </span>}
        </button>

        <button
    type="button"
    onClick={() => setActiveTab("rewards")}
    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${activeTab === "rewards" ? "border-amber-600 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
  >
          <Award className="w-4 h-4 text-amber-500" />
          Loyalty & Rewards
          {loyaltyAccount && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
              {loyaltyAccount.currentPoints.toLocaleString()} pts
            </span>}
        </button>

        <button
    type="button"
    onClick={() => setActiveTab("wishlist")}
    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${activeTab === "wishlist" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
  >
          <Heart className="w-4 h-4" />
          Wishlist ({wishlist.length})
        </button>

        <button
    type="button"
    onClick={() => setActiveTab("profile")}
    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${activeTab === "profile" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
  >
          <User className="w-4 h-4" />
          Profile & Address Settings
        </button>
      </div>

      {
    /* TAB CONTENT: Orders */
  }
      {activeTab === "orders" && <div className="space-y-4">
          {
    /* Header Actions for Orders */
  }
          {!isLoadingOrders && orders.length > 0 && <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Purchase History & Documentation
                </h3>
                <p className="text-[11px] text-slate-500">
                  Download official tax invoices and review shipment milestones for all {orders.length} orders.
                </p>
              </div>
              <button
    type="button"
    onClick={() => exportAllOrdersToPDF(orders, user.name, user.email)}
    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
    id="export-all-orders-pdf-btn"
  >
                <Download className="w-3.5 h-3.5" />
                <span>Export History (PDF)</span>
              </button>
            </div>}

          {
    /* Active Orders Live Step-by-Step Progress Spotlight */
  }
          {!isLoadingOrders && getActiveOrdersCount(orders) && <div className="bg-linear-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 rounded-2xl border-2 border-blue-200 p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
                    <Truck className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-blue-950">
                      Active Order Live Progress Timeline
                    </h3>
                    <p className="text-xs text-blue-700">
                      Real-time carrier tracking & milestone checkpoints for in-transit shipments
                    </p>
                  </div>
                </div>
                <button
    type="button"
    onClick={() => setActiveTab("tracking")}
    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs transition-colors cursor-pointer"
  >
                  <span>Open Tracking Hub</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").map((activeOrder) => <div key={activeOrder.id} className="space-y-3 bg-white rounded-xl p-4 border border-blue-100 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-slate-100">
                      <span className="text-slate-900 font-mono">Order #{activeOrder.id}</span>
                      <span className="text-slate-500">{(activeOrder.items || []).length} items • ${Number(activeOrder.total ?? activeOrder.total_amount ?? 0).toFixed(2)}</span>
                    </div>
                    <OrderStatusTracker
    orderId={activeOrder.id}
    trackingNumber={activeOrder.trackingNumber}
    onStatusUpdate={(trk) => handleTrackingStatusUpdate(activeOrder.id, trk)}
  />
                  </div>)}
            </div>}

          {isLoadingOrders ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading order history...
            </div> : orders.length === 0 ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900">No Orders Yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  When you purchase items from Vendora, your receipt and tracking codes will appear here.
                </p>
              </div>
              <button
    type="button"
    onClick={() => onNavigate("home")}
    className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
  >
                Explore Products
              </button>
            </div> : orders.map((order) => <div
    key={order.id}
    className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs"
  >
                {
    /* Order Summary Header */
  }
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        Order #{order.id}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Placed on {new Date(order.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-right mr-1">
                      <span className="text-sm font-bold text-slate-900">${Number(order.total ?? order.total_amount ?? 0).toFixed(2)}</span>
                      <p className="text-[10px] text-slate-400">{(order.items || []).length} items</p>
                    </div>

                    <button
    type="button"
    onClick={() => toggleTracking(order.id)}
    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${expandedTrackingOrderIds[order.id] ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"}`}
  >
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{expandedTrackingOrderIds[order.id] ? "Hide Tracking" : "Track Shipment"}</span>
                      {expandedTrackingOrderIds[order.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {
    /* Export to PDF Button */
  }
                    <button
    type="button"
    onClick={() => exportOrderToPDF(order, user.name, user.email)}
    className="px-3 py-2 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
    title="Download or Print PDF Tax Invoice"
    id={`export-pdf-order-${order.id}`}
  >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export to PDF</span>
                    </button>

                    <button
    type="button"
    onClick={() => onNavigate("confirmation", order.id)}
    className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
  >
                      Invoice <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {
    /* Items in this order */
  }
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {order.items.map((item) => <div
    key={item.productId}
    className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200/80"
  >
                      <img
    src={item.productImage}
    alt={item.productName}
    referrerPolicy="no-referrer"
    className="w-12 h-12 object-contain rounded bg-white shrink-0 border border-slate-200 p-1"
  />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.productName || item.name}</p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity} • ${Number(item.price ?? item.unit_price ?? 0).toFixed(2)}</p>
                      </div>
                    </div>)}
                </div>

                {
    /* Real-time Live Shipping Progress Overview */
  }
                {(() => {
    const trk = orderTrackingMap[order.id];
    const currentStatus = (trk?.status || order.status || "pending").toLowerCase();
    const [stepIndex, progressPct] = getTrackingProgress(currentStatus);
    const trackingLabel = getTrackingLabel(trk, order);
    const steps = [
      { label: "Placed", icon: Package },
      { label: "Processing", icon: Clock },
      { label: "In Transit", icon: Truck },
      { label: "Delivered", icon: CheckCircle2 }
    ];
    return <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="relative flex h-2 w-2">
                            {currentStatus !== "delivered" && currentStatus !== "cancelled" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStatus === "delivered" ? "bg-emerald-500" : "bg-blue-600"}`} />
                          </span>
                          <span className="font-bold text-slate-800">
                            {trk?.carrier || "Carrier"}: <span className="font-mono text-blue-600 font-semibold">{order.trackingNumber || trk?.trackingNumber || "Pending Sync"}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 font-medium">
                            {trackingLabel}
                          </span>
                        </div>

                        {trk?.estimatedDelivery && <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                            Est. Arrival: <strong className="text-slate-800">{new Date(trk.estimatedDelivery).toLocaleDateString(void 0, { month: "short", day: "numeric" })}</strong>
                          </span>}
                      </div>

                      {
      /* Visual Milestone Bar */
    }
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-slate-200">
                          <div
      style={{ width: `${progressPct}%` }}
      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${currentStatus === "delivered" ? "bg-emerald-500" : "bg-blue-600"}`}
    />
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 pt-2">
                          {steps.map((st, i) => {
      const isPastOrCurrent = i <= stepIndex;
      const isCurrent = i === stepIndex;
      const textClass = isCurrent ? "text-blue-700 font-bold" : isPastOrCurrent ? "text-slate-800" : "text-slate-400";
      const iconClass = isCurrent ? "text-blue-600" : isPastOrCurrent ? "text-slate-600" : "text-slate-300";
      return <div
        key={st.label}
        className={`flex items-center gap-1 ${getStepTextClass(isCurrent, isPastOrCurrent)}`}
      >
                                <st.icon className={`w-3 h-3 ${getStepIconClass(isCurrent, isPastOrCurrent)}`} />
                                <span>{st.label}</span>
                              </div>;
    })}
                        </div>
                      </div>
                    </div>;
  })()}

                {
    /* Real-time Shipment Tracking Component */
  }
                {expandedTrackingOrderIds[order.id] && <div className="pt-2">
                    <OrderStatusTracker
    orderId={order.id}
    trackingNumber={order.trackingNumber}
    onStatusUpdate={(updated) => handleTrackingStatusUpdate(order.id, updated)}
  />
                  </div>}

                {
    /* Shipping summary footer */
  }
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Delivering to: {order.shippingAddress.street}, {order.shippingAddress.city}</span>
                  </div>
                  {order.trackingNumber && <span className="text-blue-600 font-mono text-[11px] font-semibold">
                      Tracking: {order.trackingNumber}
                    </span>}
                </div>
              </div>)}
        </div>}

      {
    /* TAB CONTENT: Order Tracking Hub */
  }
      {activeTab === "tracking" && <div className="space-y-6">
          {
    /* Tracking Search & Status Hub Header */
  }
          <div className="bg-linear-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
                    <Truck className="w-5 h-5 text-blue-300" />
                  </span>
                  <h2 className="text-lg font-bold text-white">Live Order Tracking & Carrier Gateway</h2>
                </div>
                <p className="text-xs text-blue-200">
                  Track real-time shipment dispatch, transit milestones, courier checkpoints, and delivery ETA.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-200 bg-blue-800/60 px-3 py-1.5 rounded-lg border border-blue-700/50">
                  {orders.length} Registered Order{orders.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {
    /* Quick Search bar */
  }
            <form
    action="/search"
    onSubmit={(e) => e.preventDefault()}
    className="relative max-w-xl"
  >
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
    type="text"
    name="q"
    placeholder="Search by Order ID (e.g. ord-1) or Tracking Code (e.g. TRK-)..."
    value={trackingSearchInput}
    onChange={(e) => setTrackingSearchInput(e.target.value)}
    className="w-full pl-10 pr-20 py-2.5 bg-white/10 text-white placeholder-blue-200/60 rounded-xl text-xs border border-white/20 focus:border-blue-400 focus:bg-white/15 outline-none transition-all shadow-inner"
  />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
    type="submit"
    className="px-2 py-1 text-blue-100 hover:text-white text-xs font-semibold cursor-pointer"
  >
                  Search
                </button>
                {trackingSearchInput && <button
    type="button"
    onClick={handleClearTrackingSearch}
    className="p-1 text-blue-200 hover:text-white cursor-pointer"
    aria-label="Clear search"
  >
                    <X className="w-3.5 h-3.5" />
                  </button>}
              </div>
            </form>
          </div>

          {
    /* Orders Tracking List & Selected Detail */
  }
          {isLoadingOrders ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading real-time shipment status...
            </div> : orders.length === 0 ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Orders to Track</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Once you place an order, live shipping status and carrier milestone tracking will be available here.
              </p>
              <button
    type="button"
    onClick={() => onNavigate("home")}
    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
  >
                Start Shopping
              </button>
            </div> : <div className="space-y-6">
              {
    /* Order selector tabs if multiple orders */
  }
              {(() => {
    const filteredOrders = orders.filter((order) => {
      if (!trackingSearchInput) return true;
      const matchesOrderId = order.id.toLowerCase().includes(trackingSearchInput.toLowerCase());
      const matchesTrackingNumber = order.trackingNumber?.toLowerCase().includes(trackingSearchInput.toLowerCase());
      return matchesOrderId || matchesTrackingNumber;
    });
    if (filteredOrders.length === 0) {
      return <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                      No orders found matching "{trackingSearchInput}".
                    </div>;
    }
    return <div className="space-y-5">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5 sm:p-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono font-bold text-slate-900">
                                Order #{order.id}
                              </span>
                              {getStatusBadge(order.status)}
                              <span className="text-xs text-slate-500 font-medium">
                                ${Number(order.total ?? order.total_amount ?? 0).toFixed(2)} ({(order.items || []).length} item{(order.items || []).length === 1 ? "" : "s"})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Purchased on {new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })} • Destination: {order.shippingAddress?.city || order.city || "Online"}{order.shippingAddress?.state || order.state ? `, ${order.shippingAddress?.state || order.state}` : ""}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onNavigate("home");
                              showToast(`Browsing order details for #${order.id}`, "info");
                            }}
                            className="self-start sm:self-auto text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Receipt</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <OrderStatusTracker
                          orderId={order.id}
                          trackingNumber={order.trackingNumber}
                          onStatusUpdate={(updatedTracking) => handleTrackingStatusUpdate(order.id, updatedTracking)}
                        />
                      </div>
                    ))}
                  </div>;
  })()}
            </div>}
        </div>}

      {
    /* TAB CONTENT: Wishlist */
  }
      {activeTab === "wishlist" && <div className="space-y-6">
          {
    /* Wishlist Header Actions */
  }
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                Saved Wishlist Items ({wishlist.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Products you have saved for future purchases. Easily add them to your cart when you are ready.
              </p>
            </div>

            {wishlist.length > 0 && <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
    type="button"
    onClick={handleMoveAllToCart}
    className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
  >
                  <ShoppingBag className="w-3.5 h-3.5" /> Move All to Cart
                </button>
                <button
    type="button"
    onClick={clearWishlist}
    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
    title="Clear Wishlist"
  >
                  Clear
                </button>
              </div>}
          </div>

          {
    /* Wishlist Grid */
  }
          {wishlistLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => <div key={n} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
                  <div className="h-44 bg-slate-200 rounded-lg" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>)}
            </div> : wishlist.length === 0 ? <div className="bg-white rounded-xl border border-slate-200 p-14 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Wishlist is Empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click the heart icon on any product card or detail page to save items for quick access later.
                </p>
              </div>
              <button
    type="button"
    onClick={() => onNavigate("home")}
    className="px-6 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
  >
                Discover Products
              </button>
            </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((product) => {
    const discountPercent = product.originalPrice && product.originalPrice > product.price ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100) : 0;
    return <div
      key={product.id}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
    >
                    {
      /* Thumbnail area */
    }
                    <button
      type="button"
      onClick={() => onNavigate("product", product.id)}
      className="relative h-48 bg-slate-50 p-4 flex items-center justify-center cursor-pointer overflow-hidden w-full text-left"
    >
                      <LazyImage
      src={product.images[0]}
      alt={product.name}
      objectFit="contain"
      className="max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
      wrapperClassName="w-full h-full flex items-center justify-center bg-transparent"
    />

                      {discountPercent > 0 && <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                          -{discountPercent}%
                        </span>}

                      <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        removeFromWishlist(product.id);
      }}
      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-rose-500 hover:bg-white hover:scale-110 transition-all shadow-xs"
      title="Remove from Wishlist"
    >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </button>

                    {
      /* Content area */
    }
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">
                            {product.categoryName || "Product"}
                          </span>
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{product.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        <button
      type="button"
      onClick={() => onNavigate("product", product.id)}
      className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer text-left w-full bg-transparent p-0"
    >
                          {product.name}
                        </button>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {product.shortDescription}
                        </p>

                        {
      /* Stock indicator */
    }
                        <div className="pt-1">
                          {product.stock > 0 ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                              <Check className="w-3 h-3" /> In Stock ({product.stock})
                            </span> : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3" /> Out of Stock
                            </span>}
                        </div>
                      </div>

                      {
      /* Pricing & Add to Cart button */
    }
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-base font-bold text-slate-900">
                            ${product.price.toFixed(2)}
                          </div>
                          {product.originalPrice && product.originalPrice > product.price && <div className="text-xs text-slate-400 line-through">
                              ${product.originalPrice.toFixed(2)}
                            </div>}
                        </div>

                        <button
      type="button"
      onClick={() => handleMoveToCart(product)}
      disabled={product.stock === 0 || movingProductId === product.id}
      className="px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer shadow-xs"
    >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {movingProductId === product.id ? "Adding..." : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>;
  })}
            </div>}
        </div>}

      {
    /* TAB CONTENT: Profile & Address */
  }
      {activeTab === "profile" && <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500">Manage your shipping address and contact details.</p>
            </div>
            {!isEditing && <button
    type="button"
    onClick={() => setIsEditing(true)}
    className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
  >
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="account-full-name" className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
    id="account-full-name"
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
    disabled={!isEditing}
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 disabled:bg-slate-100 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
              </div>

              <div>
                <label htmlFor="account-email" className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
    id="account-email"
    type="email"
    value={user.email}
    disabled
    className="w-full px-3.5 py-2.5 text-xs bg-slate-100 text-slate-500 rounded-lg border border-slate-200 outline-none cursor-not-allowed"
  />
              </div>
            </div>

            <div>
              <label htmlFor="account-phone" className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
              <input
    id="account-phone"
    type="tel"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    disabled={!isEditing}
    placeholder="+1 (555) 000-0000"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 disabled:bg-slate-100 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Default Shipping Address</h4>

              <div>
                <label htmlFor="account-street" className="text-xs font-semibold text-slate-700 block mb-1">Street Address</label>
                <input
    id="account-street"
    type="text"
    value={street}
    onChange={(e) => setStreet(e.target.value)}
    disabled={!isEditing}
    placeholder="742 Evergreen Terrace"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 disabled:bg-slate-100 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="account-city" className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                  <input
    id="account-city"
    type="text"
    value={city}
    onChange={(e) => setCity(e.target.value)}
    disabled={!isEditing}
    placeholder="Seattle"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 disabled:bg-slate-100 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                </div>
                <div>
                  <label htmlFor="account-state" className="text-xs font-semibold text-slate-700 block mb-1">State</label>
                  <input
    id="account-state"
    type="text"
    value={state}
    onChange={(e) => setState(e.target.value)}
    disabled={!isEditing}
    placeholder="WA"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 disabled:bg-slate-100 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                </div>
                <div>
                  <label htmlFor="account-postal-code" className="text-xs font-semibold text-slate-700 block mb-1">Postal Code</label>
                  <input
    id="account-postal-code"
    type="text"
    value={postalCode}
    onChange={(e) => setPostalCode(e.target.value)}
    disabled={!isEditing}
    placeholder="98101"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 disabled:bg-slate-100 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                </div>
              </div>
            </div>

            {isEditing && <div className="pt-4 flex justify-end gap-3">
                <button
    type="button"
    onClick={() => setIsEditing(false)}
    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
  >
                  Cancel
                </button>
                <button
    type="submit"
    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
  >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>}
          </form>

          {/* Change Password Card */}
          <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Change Password</h4>
                <p className="text-xs text-slate-500">
                  Update your password to keep your Vendora account protected.
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isChangingPassword}
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isChangingPassword}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isChangingPassword}
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isChangingPassword}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Min 6 characters</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isChangingPassword}
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isChangingPassword}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black active:scale-98 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {
    /* Browser Notifications & Mobile Haptic Preferences Card */
  }
          <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Browser Notifications & Haptic Feedback
                  </h4>
                  <p className="text-xs text-slate-500">
                    Configure real-time delivery alerts, flash sale announcements, and mobile tactile feedback.
                  </p>
                </div>
              </div>

              {permission !== "granted" ? <button
    type="button"
    onClick={() => requestPermission()}
    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
  >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Browser Permission</span>
                </button> : <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Permission Granted</span>
                </span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <input
    aria-label="Order Updates"
    type="checkbox"
    checked={preferences.orderUpdates}
    onChange={(e) => updatePreferences({ orderUpdates: e.target.checked })}
    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
  />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900">Order Updates</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Shipping & delivery status
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <input
    aria-label="Flash Sales"
    type="checkbox"
    checked={preferences.flashSales}
    onChange={(e) => updatePreferences({ flashSales: e.target.checked })}
    className="mt-0.5 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
  />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900">Flash Sale Alerts</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Limited deals & discounts
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <input
    aria-label="Mobile Haptics"
    type="checkbox"
    checked={preferences.hapticFeedback}
    onChange={(e) => updatePreferences({ hapticFeedback: e.target.checked })}
    className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
  />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900">Mobile Haptics</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Vibration API checkout taps
                  </div>
                </div>
              </label>
            </div>

            {
    /* Test Actions */
  }
            <div className="flex flex-wrap gap-2 pt-2">
              <button
    type="button"
    onClick={() => sendFlashSaleAlert("Weekend Acoustics Drop", "30% OFF")}
    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
  >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Test Flash Sale Notification</span>
              </button>

              {isVibrationSupported() && <button
    type="button"
    onClick={() => triggerOrderSuccessHaptic()}
    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
  >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Test Mobile Vibration Pulse</span>
                </button>}
            </div>
          </div>
        </div>}

      {
    /* TAB CONTENT: Loyalty & Rewards */
  }
      {activeTab === "rewards" && <div className="space-y-6">
          {isLoadingLoyalty || !loyaltyAccount ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading loyalty points and rewards balance...
            </div> : <>
              {
    /* Rewards Overview Banner */
  }
              <div className="bg-linear-to-br from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                      <Award className="w-3.5 h-3.5" />
                      <span>{loyaltyAccount.tier.name} VIP Member</span>
                      <span className="text-amber-200/60">•</span>
                      <span>{loyaltyAccount.tier.multiplier}x Points Multiplier</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      {loyaltyAccount.currentPoints.toLocaleString()} <span className="text-lg font-normal text-amber-200">Points Available</span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Equivalent to <strong>${(loyaltyAccount.currentPoints / 20).toFixed(2)} USD</strong> in instant checkout savings.
                      Lifetime earned: <strong>{loyaltyAccount.lifetimePoints.toLocaleString()} pts</strong>.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
    type="button"
    onClick={() => onNavigate("home")}
    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
  >
                      <Sparkles className="w-4 h-4" />
                      Shop & Earn More
                    </button>
                    <button
    type="button"
    onClick={() => onNavigate("cart")}
    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
  >
                      <ShoppingBag className="w-4 h-4" />
                      Redeem at Checkout
                    </button>
                  </div>
                </div>

                {
    /* Tier Progress Bar */
  }
                {loyaltyAccount.nextTier && <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">
                        Progress to <strong className="text-amber-300">{loyaltyAccount.nextTier.tier.name} Tier</strong>
                      </span>
                      <span className="text-amber-300 font-semibold">
                        {loyaltyAccount.nextTier.pointsNeeded.toLocaleString()} pts needed ({loyaltyAccount.nextTier.progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
    className="bg-linear-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500"
    style={{ width: `${loyaltyAccount.nextTier.progressPercent}%` }}
  />
                    </div>
                  </div>}
              </div>

              {
    /* Tier Perks & How To Earn Cards */
  }
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {
    /* Active Tier Perks */
  }
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{loyaltyAccount.tier.name} Tier Privileges</h3>
                      <p className="text-[11px] text-slate-500">Your unlocked rewards and VIP benefits</p>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700">
                    {loyaltyAccount.tier.perks.map((perk) => <li key={perk} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </li>)}
                  </ul>
                </div>

                {
    /* Earning Rules */
  }
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">How to Earn Vendora Points</h3>
                      <p className="text-[11px] text-slate-500">Maximize your points and tier advancement</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-slate-500" />
                        <span className="font-semibold text-slate-900">Online Store Purchases</span>
                      </div>
                      <span className="font-bold text-blue-600">10 pts / $1.00</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold text-slate-900">Verified Product Review</span>
                      </div>
                      <span className="font-bold text-amber-600">+100 pts / review</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-slate-900">Account Anniversary Bonus</span>
                      </div>
                      <span className="font-bold text-indigo-600">+250 pts</span>
                    </div>
                  </div>
                </div>
              </div>

              {
    /* Points History Ledger */
  }
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Points Activity Ledger</h3>
                    <p className="text-[11px] text-slate-500">Audit trail of earned, redeemed, and bonus points</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {loyaltyAccount.transactions.length} entries
                  </span>
                </div>

                {loyaltyAccount.transactions.length === 0 ? <div className="py-8 text-center text-xs text-slate-400">
                    No points transactions recorded yet. Complete an order to earn points!
                  </div> : <div className="divide-y divide-slate-100">
                    {loyaltyAccount.transactions.map((tx) => {
    const isPositive = tx.points > 0;
    return <div key={tx.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${tx.type === "earned" ? "bg-emerald-50 text-emerald-600" : tx.type === "redeemed" ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"}`}
    >
                              {tx.type === "earned" && <TrendingUp className="w-4 h-4" />}
                              {tx.type === "redeemed" && <Coins className="w-4 h-4" />}
                              {tx.type === "bonus" && <Sparkles className="w-4 h-4" />}
                              {tx.type === "adjustment" && <Shield className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{tx.description}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                <span>{new Date(tx.timestamp).toLocaleString()}</span>
                                {tx.orderId && <>
                                    <span>•</span>
                                    <span className="font-mono text-slate-600 font-medium">#{tx.orderId}</span>
                                  </>}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
      className={`text-xs font-bold font-mono ${isPositive ? "text-emerald-600" : "text-amber-600"}`}
    >
                              {isPositive ? `+${tx.points.toLocaleString()}` : tx.points.toLocaleString()} pts
                            </span>
                            <p className="text-[10px] text-slate-400 capitalize">{tx.type}</p>
                          </div>
                        </div>;
  })}
                  </div>}
              </div>
            </>}
        </div>}
    </div>;
};
export {
  AccountPage
};
