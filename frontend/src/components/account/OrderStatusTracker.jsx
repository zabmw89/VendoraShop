import { useState, useEffect } from "react";
import {
  Truck,
  Clock,
  MapPin,
  RefreshCw,
  Copy,
  Check,
  Zap,
  ShieldCheck
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";
const OrderStatusTracker = ({
  orderId,
  trackingNumber,
  initialTracking,
  onStatusUpdate,
  compact = false
}) => {
  const { showToast } = useToast();
  const [tracking, setTracking] = useState(initialTracking || null);
  const [isLoading, setIsLoading] = useState(!initialTracking);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [copied, setCopied] = useState(false);
  const fetchTracking = async (showLoadingState = false) => {
    if (showLoadingState) setIsRefreshing(true);
    try {
      const data = await api.getOrderTracking(orderId);
      setTracking(data);
      if (onStatusUpdate) onStatusUpdate(data);
    } catch (err) {
      console.error("Failed to fetch tracking data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  useEffect(() => {
    if (!initialTracking) {
      fetchTracking();
    }
  }, [orderId]);
  const handleCopyTrackingNumber = () => {
    const code = tracking?.trackingNumber || trackingNumber;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      showToast("Tracking number copied to clipboard", "info");
      setTimeout(() => setCopied(false), 2e3);
    }
  };
  const handleAdvanceTracking = async () => {
    setIsAdvancing(true);
    try {
      const res = await api.advanceOrderTracking(orderId);
      setTracking(res.tracking);
      if (onStatusUpdate) onStatusUpdate(res.tracking);
      showToast(res.message || "Shipment status updated", "success");
    } catch (err) {
      showToast(err.message || "Could not update shipment status", "error");
    } finally {
      setIsAdvancing(false);
    }
  };
  if (isLoading) {
    return <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-6 flex flex-col items-center justify-center space-y-3 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Connecting to carrier tracking gateway...</p>
      </div>;
  }
  if (!tracking) {
    return <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-center space-y-2">
        <p className="text-xs text-slate-600 font-medium">Tracking data not yet synced for this order.</p>
        <button
      onClick={() => fetchTracking(true)}
      className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
    >
          Check Again
        </button>
      </div>;
  }
  const getStepIcon = (milestone, index) => {
    if (milestone.completed) {
      return <Check className="w-3.5 h-3.5 text-white stroke-3" />;
    }
    if (milestone.current) {
      return <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
        </span>;
    }
    return <span className="text-[11px] font-bold text-slate-400">{index + 1}</span>;
  };
  return <div className="bg-linear-to-b from-white to-slate-50/50 rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
      {
    /* Tracker Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Truck className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              Real-Time Shipment Progress
            </h4>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tracking.status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : tracking.status === "shipped" ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
              {tracking.statusText}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
            <span>Carrier: <strong className="text-slate-700 font-semibold">{tracking.carrier}</strong></span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span>Tracking:</span>
              <span className="font-mono text-slate-800 font-semibold">{tracking.trackingNumber}</span>
              <button
    onClick={handleCopyTrackingNumber}
    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
    title="Copy tracking code"
  >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {
    /* Action Buttons */
  }
        <div className="flex items-center gap-2 shrink-0">
          <button
    onClick={() => fetchTracking(true)}
    disabled={isRefreshing}
    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
    title="Refresh tracking status"
  >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
    onClick={handleAdvanceTracking}
    disabled={isAdvancing}
    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
    title="Advance status to test real-time state transitions"
  >
            <Zap className={`w-3.5 h-3.5 text-amber-300 ${isAdvancing ? "animate-bounce" : ""}`} />
            <span>{isAdvancing ? "Updating..." : "Advance Status"}</span>
          </button>
        </div>
      </div>

      {
    /* Progress Bar & Status Pill */
  }
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600">Shipment Route</span>
          <span className="text-blue-600">{tracking.progressPercent}% Complete</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${tracking.progressPercent}%` }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className={`h-full rounded-full ${tracking.status === "delivered" ? "bg-emerald-500" : "bg-linear-to-r from-blue-600 via-indigo-600 to-blue-500"}`}
  />
        </div>
      </div>

      {
    /* Interactive Milestone Timeline */
  }
      <div className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2 relative">
          {tracking.milestones.map((milestone, idx) => {
    const isCompleted = milestone.completed;
    const isCurrent = milestone.current;
    return <div
      key={milestone.id}
      className={`relative rounded-xl p-3.5 border transition-all ${isCurrent ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs" : isCompleted ? "bg-white border-slate-200 shadow-2xs" : "bg-slate-50/40 border-slate-200/60 opacity-60"}`}
    >
                {
      /* Status Dot / Check */
    }
                <div className="flex items-center gap-2 mb-2">
                  <div
      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0 ${isCompleted ? "bg-emerald-600 shadow-xs" : isCurrent ? "bg-white border-2 border-blue-600 text-blue-600 shadow-xs" : "bg-slate-100 border border-slate-300 text-slate-400"}`}
    >
                    {getStepIcon(milestone, idx)}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Step {idx + 1}
                  </span>
                </div>

                {
      /* Milestone Details */
    }
                <div className="space-y-1">
                  <h5 className={`text-xs font-bold ${isCurrent ? "text-blue-900" : isCompleted ? "text-slate-900" : "text-slate-500"}`}>
                    {milestone.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {milestone.description}
                  </p>
                  <div className="pt-1.5 flex flex-col gap-0.5 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1 truncate text-slate-600">
                      <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">{milestone.location}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span>{milestone.timestamp}</span>
                    </span>
                  </div>
                </div>
              </div>;
  })}
        </div>
      </div>

      {
    /* Shipment Meta Footer */
  }
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Estimated Delivery:{" "}
            <strong className="font-semibold text-slate-900">
              {new Date(tracking.estimatedDelivery).toLocaleDateString(void 0, {
    weekday: "short",
    month: "short",
    day: "numeric"
  })}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Current Location: <strong className="text-slate-600 font-medium">{tracking.currentLocation}</strong></span>
          <span>•</span>
          <span>Last Checked: {new Date(tracking.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    </div>;
};
export {
  OrderStatusTracker
};
