import { useState } from "react";
import { WifiOff, RefreshCw, X, CheckCircle } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
const OfflineBanner = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      window.location.reload();
    }, 600);
  };
  if (isOnline && wasOffline && !dismissed) {
    return <aside
      aria-label="Online connection restored"
      className="bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-between shadow-md transition-all animate-in slide-in-from-top duration-300 z-50 relative"
    >
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="font-semibold">
              Internet connection restored. Live catalog and checkout are active.
            </span>
          </div>
          <button
      onClick={() => setDismissed(true)}
      className="p-1 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer"
      aria-label="Dismiss banner"
    >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>;
  }
  if (!isOnline && !dismissed) {
    return <aside
      aria-label="Offline Mode Active"
      className="bg-amber-600 text-white text-xs py-2.5 px-4 shadow-md transition-all animate-in slide-in-from-top duration-300 z-50 sticky top-0"
    >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-1 bg-amber-700/80 rounded-md">
              <WifiOff className="w-4 h-4 text-amber-100 shrink-0" />
            </span>
            <div>
              <span className="font-bold">Offline Mode Active:</span>{" "}
              <span className="text-amber-100">
                You are currently offline. Viewing cached products & store content.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
      onClick={handleRetry}
      disabled={isRetrying}
      className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 active:scale-95 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-50"
    >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
              <span>{isRetrying ? "Checking..." : "Retry Connection"}</span>
            </button>
            <button
      onClick={() => setDismissed(true)}
      className="p-1 hover:bg-amber-700 rounded transition-colors text-amber-200 hover:text-white cursor-pointer"
      title="Dismiss banner"
    >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>;
  }
  return null;
};
export {
  OfflineBanner
};
