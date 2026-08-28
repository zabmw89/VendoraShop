import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
const ToastContext = createContext(void 0);
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "success") => {
    const id = `toast_${crypto.randomUUID()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  const contextValue = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={contextValue}>
      {children}
      {
    /* Toast Render Area with Fluid Motion Animations */
  }
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => <motion.div
    key={toast.id}
    id={toast.id}
    layout
    initial={{ opacity: 0, y: 24, scale: 0.92 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.88, y: 12, transition: { duration: 0.2, ease: "easeOut" } }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 28,
      mass: 0.8
    }}
    className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border text-sm font-medium transition-shadow ${toast.type === "success" ? "bg-slate-950/95 text-white border-emerald-500/40 shadow-emerald-950/20 backdrop-blur-md" : toast.type === "error" ? "bg-slate-950/95 text-white border-rose-500/40 shadow-rose-950/20 backdrop-blur-md" : toast.type === "warning" ? "bg-slate-950/95 text-white border-amber-500/40 shadow-amber-950/20 backdrop-blur-md" : "bg-slate-950/95 text-white border-sky-500/40 shadow-sky-950/20 backdrop-blur-md"}`}
  >
              {toast.type === "success" && <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>}
              {toast.type === "error" && <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                </div>}
              {toast.type === "warning" && <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>}
              {toast.type === "info" && <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-sky-400" />
                </div>}
              <p className="flex-1 text-xs sm:text-sm leading-snug text-slate-100">{toast.message}</p>
              <button
    onClick={() => removeToast(toast.id)}
    className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer shrink-0"
    aria-label="Close notification"
  >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>)}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>;
};
function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
export {
  ToastProvider,
  useToast
};
