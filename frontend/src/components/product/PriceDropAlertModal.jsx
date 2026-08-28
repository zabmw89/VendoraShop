import { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  TrendingDown,
  Check,
  X,
  Loader2,
  Mail,
  Trash2,
  Zap
} from "lucide-react";
import { api } from "../../services/api";
import { useNotifications } from "../../context/NotificationContext";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { triggerSuccessHaptic, triggerSelectionHaptic } from "../../utils/haptics";
const PriceDropAlertModal = ({
  isOpen,
  onClose,
  product,
  onPriceUpdated
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { permission, requestPermission, sendPriceDropAlert } = useNotifications();
  const [email, setEmail] = useState("");
  const [targetPercentage, setTargetPercentage] = useState(10);
  const [customPrice, setCustomPrice] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAlert, setExistingAlert] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);
  useEffect(() => {
    if (isOpen && product) {
      const emailOrUser = user?.email || user?.id;
      if (emailOrUser) {
        api.getPriceAlerts(emailOrUser).then((alerts) => {
          const found = alerts.find((a) => a.productId === product.id && a.status === "active");
          if (found) {
            setExistingAlert(found);
            if (found.targetPrice) {
              setCustomPrice(found.targetPrice.toFixed(2));
              setIsCustom(true);
            }
          } else {
            setExistingAlert(null);
          }
        }).catch(() => setExistingAlert(null));
      }
    }
  }, [isOpen, product, user]);
  if (!isOpen) return null;
  const currentPrice = product.price;
  const calculatedTarget = isCustom && customPrice ? Number.parseFloat(customPrice) : Number((currentPrice * (1 - targetPercentage / 100)).toFixed(2));
  const handlePresetSelect = (percent) => {
    setIsCustom(false);
    setTargetPercentage(percent);
    triggerSelectionHaptic();
  };
  const handleCustomPriceChange = (val) => {
    setIsCustom(true);
    setCustomPrice(val);
  };
  const handleSaveAlert = async (e) => {
    e.preventDefault();
    if (!email?.includes("@")) {
      showToast("Please provide a valid email address.", "error");
      return;
    }
    if (Number.isNaN(calculatedTarget) || calculatedTarget <= 0 || calculatedTarget >= currentPrice) {
      showToast(`Target price must be less than the current price of $${currentPrice.toFixed(2)}.`, "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      if (permission === "default") {
        await requestPermission();
      }
      const res = await api.createPriceAlert(product.id, {
        email,
        targetPrice: calculatedTarget
      });
      setExistingAlert(res.alert);
      triggerSuccessHaptic();
      showToast(res.message || `Price drop alert activated at $${calculatedTarget.toFixed(2)}!`, "success");
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to set price alert.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteAlert = async () => {
    if (!existingAlert) return;
    setIsSubmitting(true);
    try {
      await api.deletePriceAlert(existingAlert.id);
      setExistingAlert(null);
      showToast("Price drop alert cancelled.", "info");
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to remove alert.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSimulateDrop = async () => {
    setIsSimulating(true);
    try {
      const dropPct = targetPercentage || 15;
      const res = await api.simulatePriceDrop(product.id, dropPct);
      sendPriceDropAlert(product.name, res.newPrice, res.oldPrice);
      if (onPriceUpdated) {
        onPriceUpdated(res.newPrice, res.oldPrice);
      }
      showToast(`\u26A1 Price drop simulated! New price: $${res.newPrice.toFixed(2)} (Was $${res.oldPrice.toFixed(2)})`, "success");
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to simulate price drop.", "error");
    } finally {
      setIsSimulating(false);
    }
  };
  return <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    onClick={onClose}
  >
      <div
    className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200"
    onClick={(e) => e.stopPropagation()}
    id="price-drop-alert-modal"
  >
        {
    /* Header */
  }
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-2xs">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>Price Drop Alert</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Instant Watch
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Get notified the exact moment the price decreases
              </p>
            </div>
          </div>
          <button
    onClick={onClose}
    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
    aria-label="Close"
  >
            <X className="w-4 h-4" />
          </button>
        </div>

        {
    /* Product Snapshot Card */
  }
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <img
    src={product.images?.[0]}
    alt={product.name}
    referrerPolicy="no-referrer"
    className="w-14 h-14 object-contain rounded-lg bg-white border border-slate-200/80 p-1 shrink-0"
  />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{product.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-slate-900">${currentPrice.toFixed(2)}</span>
              <span className="text-[11px] text-slate-500 font-medium">Current Price</span>
            </div>
          </div>
        </div>

        {
    /* Active Alert Banner if exists */
  }
        {existingAlert && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Alert active at <strong>${existingAlert.targetPrice?.toFixed(2)}</strong> ({existingAlert.email})
              </span>
            </div>
            <button
    onClick={handleDeleteAlert}
    disabled={isSubmitting}
    className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
    title="Remove alert"
  >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>}

        <form onSubmit={handleSaveAlert} className="space-y-4">
          {
    /* Target Price Presets */
  }
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Notify Me When Price Drops By:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((pct) => {
    const priceAtPct = (currentPrice * (1 - pct / 100)).toFixed(2);
    const isSelected = !isCustom && targetPercentage === pct;
    return <button
      key={pct}
      type="button"
      onClick={() => handlePresetSelect(pct)}
      className={`py-2 px-2 rounded-xl text-center border transition-all cursor-pointer ${isSelected ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold" : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"}`}
    >
                    <div className="text-xs font-bold">{pct}% OFF</div>
                    <div className={`text-[10px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                      ${priceAtPct}
                    </div>
                  </button>;
  })}
            </div>
          </div>

          {
    /* Custom Price Input Option */
  }
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Or Set Custom Target Price ($):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                $
              </span>
              <input
    type="number"
    step="0.01"
    min="1"
    max={currentPrice - 0.01}
    placeholder={`e.g. ${(currentPrice * 0.85).toFixed(2)}`}
    value={customPrice}
    onChange={(e) => handleCustomPriceChange(e.target.value)}
    className="w-full pl-7 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
  />
            </div>
            <p className="text-[11px] text-slate-500">
              Target alert threshold:{" "}
              <strong className="text-slate-900">${Number.isNaN(calculatedTarget) ? "\u2014" : calculatedTarget.toFixed(2)}</strong>{" "}
              (Save ${Number.isNaN(calculatedTarget) ? "\u2014" : (currentPrice - calculatedTarget).toFixed(2)})
            </p>
          </div>

          {
    /* Email Notification Channel */
  }
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Alert Destination Email:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
    type="email"
    required
    placeholder="name@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
  />
            </div>
          </div>

          {
    /* Browser Notification Status Banner */
  }
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                Browser Push Alert
              </span>
              <span
    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permission === "granted" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
  >
                {permission === "granted" ? "Enabled" : "Permission Required"}
              </span>
            </div>
            {permission !== "granted" && <button
    type="button"
    onClick={() => requestPermission()}
    className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200"
  >
                <BellRing className="w-3.5 h-3.5" />
                <span>Enable Browser Alerts</span>
              </button>}
          </div>

          {
    /* Action Buttons */
  }
          <div className="space-y-2 pt-2">
            <button
    type="submit"
    disabled={isSubmitting}
    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
    id="submit-price-alert-btn"
  >
              {isSubmitting ? <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Alert...</span>
                </> : <>
                  <Bell className="w-4 h-4" />
                  <span>{existingAlert ? "Update Price Drop Alert" : "Notify Me When Price Drops"}</span>
                </>}
            </button>

            {
    /* Test Simulation Button */
  }
            <button
    type="button"
    onClick={handleSimulateDrop}
    disabled={isSimulating}
    className="w-full py-2 px-3 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
    title="Test the live price drop alert with browser notification"
    id="simulate-price-drop-btn"
  >
              {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-600" />}
              <span>Simulate Live Price Drop (Test Alert)</span>
            </button>
          </div>
        </form>
      </div>
    </div>;
};
export {
  PriceDropAlertModal
};
