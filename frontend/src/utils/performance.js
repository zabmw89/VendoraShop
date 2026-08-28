let isInitialized = false;
async function reportPerformanceMetric(metric) {
  try {
    const payload = {
      url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : void 0,
      ...metric
    };
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("vendora_auth_token") : null;
    const headers = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    await fetch("/api/logs/performance/", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (err) {
    console.debug("[PerformanceTelemetry] Skipped sending metric:", err);
  }
}
function initPerformanceMonitoring() {
  if (typeof window === "undefined" || isInitialized) {
    return () => {
    };
  }
  isInitialized = true;
  const disconnectCallbacks = [];
  try {
    const handleLoad = () => {
      setTimeout(() => {
        try {
          const navEntries = performance.getEntriesByType("navigation");
          if (navEntries && navEntries.length > 0) {
            const nav = navEntries[0];
            const loadTime = nav.loadEventEnd > 0 ? Math.round(nav.loadEventEnd - nav.startTime) : Math.round(performance.now());
            const ttfb = Math.round(nav.responseStart - nav.requestStart);
            const domComplete = nav.domComplete > 0 ? Math.round(nav.domComplete - nav.startTime) : void 0;
            reportPerformanceMetric({
              pageLoadTime: loadTime,
              ttfb: ttfb > 0 ? ttfb : void 0,
              domComplete,
              deviceMemory: navigator.deviceMemory,
              effectiveConnectionType: navigator.connection?.effectiveType
            });
          } else if (performance.timing) {
            const t = performance.timing;
            const loadTime = t.loadEventEnd > 0 ? t.loadEventEnd - t.navigationStart : Math.round(performance.now());
            const ttfb = t.responseStart > 0 && t.requestStart > 0 ? t.responseStart - t.requestStart : void 0;
            reportPerformanceMetric({
              pageLoadTime: Math.max(10, loadTime),
              ttfb: ttfb && ttfb > 0 ? ttfb : void 0
            });
          }
        } catch (e) {
          console.debug("[PerformanceTelemetry] Navigation timing error:", e);
        }
      }, 500);
    };
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad, { once: true });
    }
    if ("PerformanceObserver" in window) {
      try {
        const paintObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.name === "first-contentful-paint") {
              const value = Math.round(entry.startTime);
              reportPerformanceMetric({
                fcp: value
              });
            }
          }
        });
        paintObserver.observe({ type: "paint", buffered: true });
        disconnectCallbacks.push(() => paintObserver.disconnect());
      } catch {
      }
      try {
        let maxLcp = 0;
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries.at(-1);
          if (lastEntry) {
            maxLcp = Math.round(lastEntry.startTime);
          }
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
        disconnectCallbacks.push(() => {
          if (maxLcp > 0) {
            reportPerformanceMetric({
              lcp: maxLcp
            });
          }
          lcpObserver.disconnect();
        });
        const handleVisibilityChange = () => {
          if (document.visibilityState === "hidden" && maxLcp > 0) {
            reportPerformanceMetric({
              lcp: maxLcp
            });
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        disconnectCallbacks.push(() => document.removeEventListener("visibilitychange", handleVisibilityChange));
      } catch {
      }
      try {
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          }
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });
        disconnectCallbacks.push(() => {
          const roundedCls = Math.round(clsScore * 1e3) / 1e3;
          reportPerformanceMetric({
            cls: roundedCls
          });
          clsObserver.disconnect();
        });
      } catch {
      }
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const delay = Math.round(entry.processingStart - entry.startTime);
            reportPerformanceMetric({
              fid: delay,
              inp: delay
            });
          }
        });
        fidObserver.observe({ type: "first-input", buffered: true });
        disconnectCallbacks.push(() => fidObserver.disconnect());
      } catch {
      }
    }
  } catch (err) {
    console.debug("[PerformanceTelemetry] Initialization failed:", err);
  }
  return () => {
    disconnectCallbacks.forEach((cb) => {
      try {
        cb();
      } catch {
      }
    });
  };
}
export {
  initPerformanceMonitoring,
  reportPerformanceMetric
};
