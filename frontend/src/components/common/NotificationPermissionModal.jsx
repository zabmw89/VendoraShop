import { useState } from "react";
import {
  Bell,
  X,
  Check,
  Zap,
  Package,
  Smartphone
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { isVibrationSupported, triggerOrderSuccessHaptic } from "../../utils/haptics";
const NotificationPermissionModal = () => {
  const {
    permission,
    preferences,
    isPermissionModalOpen,
    closePermissionModal,
    requestPermission,
    updatePreferences,
    sendTestAlert
  } = useNotifications();
  const [isRequesting, setIsRequesting] = useState(false);
  const [testSent, setTestSent] = useState(false);
  if (!isPermissionModalOpen) return null;
  const handleEnableClick = async () => {
    setIsRequesting(true);
    try {
      await requestPermission();
    } finally {
      setIsRequesting(false);
    }
  };
  const handleTestNotification = () => {
    setTestSent(true);
    sendTestAlert();
    setTimeout(() => setTestSent(false), 3e3);
  };
  const handleTestHaptic = () => {
    triggerOrderSuccessHaptic();
  };
  return <div
    className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    onClick={closePermissionModal}
  >
      <div
    className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
    onClick={(e) => e.stopPropagation()}
    id="notification-permission-modal"
  >
        {
    /* Modal Header */
  }
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 text-white p-6 relative">
          <button
    onClick={closePermissionModal}
    className="absolute top-4 right-4 p-1.5 rounded-full text-blue-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
    aria-label="Close modal"
  >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 border border-white/20 shadow-inner">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Browser Alerts & Order Updates
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Never miss instant shipping checkpoints, flash sales, or price drops.
              </p>
            </div>
          </div>
        </div>

        {
    /* Modal Body */
  }
        <div className="p-6 space-y-5">
          {
    /* Permission Status Pill */
  }
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">Browser Permission:</span>
            <span
    className={`font-bold px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] ${permission === "granted" ? "bg-emerald-100 text-emerald-800" : permission === "denied" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}
  >
              {permission === "granted" ? "Active / Enabled" : permission === "denied" ? "Blocked in Browser" : "Pending Permission"}
            </span>
          </div>

          {
    /* Value propositions */
  }
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Notification Channels
            </h4>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
              <input
    type="checkbox"
    checked={preferences.orderUpdates}
    onChange={(e) => updatePreferences({ orderUpdates: e.target.checked })}
    className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
  />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Real-Time Order & Shipping Checkpoints</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Receive instant notifications when your order is confirmed, packed, and dispatched with carrier tracking.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
              <input
    type="checkbox"
    checked={preferences.flashSales}
    onChange={(e) => updatePreferences({ flashSales: e.target.checked })}
    className="mt-1 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
  />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Flash Sales & Limited-Time Deals</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Get first access to 24-hour flash promotions and clearance drops before items sell out.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
              <input
    type="checkbox"
    checked={preferences.hapticFeedback}
    onChange={(e) => updatePreferences({ hapticFeedback: e.target.checked })}
    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
  />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Tactile Haptic Feedback (Vibration API)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Enjoy subtle physical confirmation vibrations during mobile checkout and cart actions.
                </p>
              </div>
            </label>
          </div>

          {
    /* Test Buttons */
  }
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
            <button
    onClick={handleTestNotification}
    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
  >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{testSent ? "Notification Sent!" : "Send Test Alert"}</span>
            </button>

            {isVibrationSupported() && <button
    onClick={handleTestHaptic}
    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
  >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Test Haptic Pulse</span>
              </button>}
          </div>
        </div>

        {
    /* Modal Actions */
  }
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
    onClick={closePermissionModal}
    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
  >
            Done
          </button>

          {permission !== "granted" ? <button
    onClick={handleEnableClick}
    disabled={isRequesting}
    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
  >
              <Bell className="w-4 h-4" />
              <span>{isRequesting ? "Requesting..." : "Enable Notifications"}</span>
            </button> : <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-600" /> Notifications Active
            </span>}
        </div>
      </div>
    </div>;
};
export {
  NotificationPermissionModal
};
