import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";

export const BrandLoadingOverlay = ({ isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto"
        >
          {/* Subtle Ambient Background Light Glow */}
          <div className="absolute w-72 h-72 rounded-full bg-blue-600/20 filter blur-3xl animate-pulse pointer-events-none" />

          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-5 text-center relative z-10 max-w-xs mx-4"
          >
            {/* Animated Brand Logo Icon */}
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute -inset-2 rounded-2xl bg-linear-to-tr from-blue-600 via-indigo-500 to-cyan-400 opacity-70 blur-xs"
              />
              <div className="relative w-14 h-14 bg-linear-to-tr from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <span className="text-2xl font-black tracking-tight">V</span>
              </div>
            </div>

            {/* Brand Title */}
            <div>
              <div className="text-xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1">
                <span>Vendora</span>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-300">
                  Shop
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
                <Sparkles className="w-3 h-3 text-blue-400 animate-spin" />
                <span>Loading destination...</span>
              </div>
            </div>

            {/* Smooth Linear Progress Cue */}
            <div className="w-36 h-1 bg-slate-800 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 0.9,
                  ease: "easeInOut"
                }}
                className="w-1/2 h-full bg-linear-to-r from-blue-500 to-cyan-400 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
