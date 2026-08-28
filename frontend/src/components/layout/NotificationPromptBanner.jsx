import { useState, useEffect } from "react";
import { Zap, X } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
const NotificationPromptBanner = () => {
  const { permission, requestPermission, openPermissionModal } = useNotifications();
  const [isDismissed, setIsDismissed] = useState(true);
  useEffect(() => {
    const dismissed = sessionStorage.getItem("vendora_notif_banner_dismissed");
    if (!dismissed && permission === "default") {
      const timer = setTimeout(() => setIsDismissed(false), 2e3);
      return () => clearTimeout(timer);
    }
  }, [permission]);
  if (isDismissed || permission !== "default") {
    return null;
  }
  const handleEnable = async () => {
    await requestPermission();
    setIsDismissed(true);
    sessionStorage.setItem("vendora_notif_banner_dismissed", "true");
  };
  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("vendora_notif_banner_dismissed", "true");
  };
  return <aside
    aria-label="Browser notification opt-in prompt"
    className="bg-slate-900 text-white text-xs py-2 px-4 border-b border-slate-800 animate-in slide-in-from-top duration-300 relative z-30"
  >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="p-1 rounded-md bg-blue-600/30 text-blue-400 border border-blue-500/30 shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </span>
          <span className="text-slate-300">
            Enable browser notifications for <strong className="text-white">order tracking updates</strong> and <strong className="text-white">exclusive flash sales</strong>.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
    onClick={handleEnable}
    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer"
  >
            Allow Alerts
          </button>
          <button
    onClick={openPermissionModal}
    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
  >
            Options
          </button>
          <button
    onClick={handleDismiss}
    className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
    aria-label="Dismiss notification prompt"
  >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>;
};
export {
  NotificationPromptBanner
};
