import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { triggerStepChangeHaptic, triggerSuccessHaptic } from "../../utils/haptics";

const ScrollProgressBar = ({
  className = "",
  position = "fixed",
  showTooltip = true,
  showPercent = false,
  fadeThreshold = 15
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(null);
  const [activeMilestone, setActiveMilestone] = useState(null);
  const passed50Ref = useRef(false);
  const passed100Ref = useRef(false);
  const barRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const scrollHeight =
            document.documentElement.scrollHeight - document.documentElement.clientHeight;
          if (scrollHeight > 0) {
            const progress = (scrollTop / scrollHeight) * 100;
            const clamped = Math.min(100, Math.max(0, progress));
            setScrollProgress(clamped);
            setIsVisible(scrollTop > fadeThreshold);

            // Milestone 50% check
            if (clamped >= 50 && !passed50Ref.current && clamped < 95) {
              passed50Ref.current = true;
              triggerStepChangeHaptic();
              setActiveMilestone(50);
              setTimeout(() => setActiveMilestone(null), 1200);
            } else if (clamped < 40) {
              passed50Ref.current = false;
            }

            // Milestone 100% check
            if (clamped >= 98 && !passed100Ref.current) {
              passed100Ref.current = true;
              triggerSuccessHaptic();
              setActiveMilestone(100);
              setTimeout(() => setActiveMilestone(null), 1400);
            } else if (clamped < 90) {
              passed100Ref.current = false;
            }
          } else {
            setScrollProgress(0);
            setIsVisible(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [fadeThreshold]);

  const dynamicHueStart = Math.round(242 - (scrollProgress / 100) * (242 - 160));
  const dynamicHueEnd = Math.round(230 - (scrollProgress / 100) * (230 - 150));
  const barGradient = `linear-gradient(90deg, hsl(${dynamicHueStart}, 82%, 56%) 0%, hsl(${dynamicHueEnd}, 85%, 48%) 100%)`;
  const glowColor =
    scrollProgress > 75
      ? "rgba(16, 185, 129, 0.6)"
      : scrollProgress > 40
      ? "rgba(13, 148, 136, 0.5)"
      : "rgba(79, 70, 229, 0.5)";

  const handleMouseMove = (e) => {
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      setHoverPosition(Math.max(10, Math.min(rect.width - 10, relativeX)));
    }
  };

  const handleBarClick = (e) => {
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const scrollHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      window.scrollTo({
        top: ratio * scrollHeight,
        behavior: "smooth"
      });
    }
  };

  if (position === "sticky") {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`sticky top-16 z-30 w-full h-[3.5px] bg-slate-200/70 rounded-full overflow-hidden backdrop-blur-xs shadow-2xs ${className}`}
            role="progressbar"
            aria-label="Main container scroll progress"
            aria-valuenow={Math.round(scrollProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            id="main-container-scroll-progress"
          >
            <div
              className={`h-full rounded-full transition-all duration-150 ease-out ${
                activeMilestone ? "animate-pulse" : ""
              }`}
              style={{
                width: `${scrollProgress}%`,
                background: barGradient,
                boxShadow: activeMilestone
                  ? `0 0 16px rgba(59, 130, 246, 0.9), 0 0 8px ${glowColor}`
                  : `0 0 10px ${glowColor}`
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={barRef}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setHoverPosition(null);
          }}
          onMouseMove={handleMouseMove}
          onClick={handleBarClick}
          className={`fixed top-0 left-0 right-0 z-70 h-1 hover:h-1.75 cursor-pointer transition-all duration-200 group ${className}`}
          role="progressbar"
          aria-label="Page scroll progress"
          aria-valuenow={Math.round(scrollProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          id="global-scroll-progress-bar"
        >
          {/* Subtle Background Track */}
          <div className="w-full h-full bg-slate-200/50 backdrop-blur-xs relative overflow-hidden">
            {/* Dynamic Color Shift Fill Bar (Indigo -> Emerald) */}
            <div
              className={`h-full transition-all duration-150 ease-out relative ${
                activeMilestone ? "animate-pulse" : ""
              }`}
              style={{
                width: `${scrollProgress}%`,
                background: barGradient,
                boxShadow: activeMilestone
                  ? `0 0 18px rgba(59, 130, 246, 1), 0 0 10px ${glowColor}`
                  : `0 0 10px ${glowColor}`
              }}
            >
              {/* Milestone Pulse Bubble Animation */}
              {activeMilestone && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white/90 rounded-full animate-ping pointer-events-none" />
              )}
            </div>
          </div>

          {/* Interactive Hover Tooltip */}
          {showTooltip && isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{ duration: 0.15 }}
              style={{
                left: hoverPosition !== null ? `${hoverPosition}px` : `${scrollProgress}%`,
                transform: "translateX(-50%)"
              }}
              className="absolute top-3 pointer-events-none z-50 flex flex-col items-center"
            >
              <div className="bg-slate-900/95 text-white text-[11px] font-semibold font-mono px-2.5 py-1 rounded-lg shadow-lg border border-slate-700/60 backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap">
                <span>{Math.round(scrollProgress)}% scrolled</span>
                {scrollProgress >= 98 && (
                  <span className="text-[10px] text-emerald-400 font-bold">✓ End</span>
                )}
              </div>
              <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-l border-t border-slate-700/60" />
            </motion.div>
          )}

          {/* Milestone Toast Cue */}
          {activeMilestone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -4 }}
              className="absolute right-6 top-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1.5 pointer-events-none animate-bounce"
            >
              <span>{activeMilestone}% Milestone Reached</span>
            </motion.div>
          )}

          {/* Optional Persistent Badge */}
          {showPercent && (
            <div className="absolute right-4 top-2.5 text-[10px] font-mono font-bold text-slate-800 bg-white/95 px-2 py-0.5 rounded-full border border-slate-200 shadow-xs backdrop-blur-xs pointer-events-none">
              {Math.round(scrollProgress)}%
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { ScrollProgressBar };
