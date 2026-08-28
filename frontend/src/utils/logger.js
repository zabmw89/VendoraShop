const recentErrorsCache = /* @__PURE__ */ new Map();
const DEDUP_WINDOW_MS = 4e3;
function isBenignError(err) {
  if (!err) return true;
  let str;
  if (typeof err === "string") {
    str = err;
  } else if (err instanceof Error) {
    str = `${err.name} ${err.message}`;
  } else {
    str = JSON.stringify(err);
  }
  const lower = str.toLowerCase();
  return lower.includes("websocket") || lower.includes("failed to connect to websocket") || lower.includes("websocket closed without opened") || lower.includes("resizeobserver") || lower.includes("aborterror") || lower.includes("the user aborted a request") || lower.includes("script error.") || lower.includes("vite") || lower.includes("connection refused");
}
function getErrorDetails(error) {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  if (typeof error === "string") {
    return { message: error, name: "Error", stack: void 0 };
  }
  if (error && typeof error === "object") {
    return {
      message: error.message || error.error || JSON.stringify(error),
      name: error.name || "ObjectError",
      stack: error.stack
    };
  }
  return { message: "Unknown Error", name: "Error", stack: void 0 };
}
function isRecentlyReported(dedupKey, now) {
  const lastReported = recentErrorsCache.get(dedupKey);
  if (lastReported && now - lastReported < DEDUP_WINDOW_MS) return true;
  recentErrorsCache.set(dedupKey, now);
  if (recentErrorsCache.size > 100) {
    for (const [key, time] of recentErrorsCache.entries()) {
      if (now - time > DEDUP_WINDOW_MS * 2) recentErrorsCache.delete(key);
    }
  }
  return false;
}
async function logError(error, context = {}) {
  try {
    if (isBenignError(error)) {
      return { success: true };
    }
    const { message, name, stack } = getErrorDetails(error);
    if (isBenignError(message)) {
      return { success: true };
    }
    const dedupKey = `${name}:${message}:${context.componentStack || ""}:${context.url || window.location.href}`;
    const now = Date.now();
    if (isRecentlyReported(dedupKey, now)) return { success: true };
    const payload = {
      message,
      name,
      stack,
      componentStack: context.componentStack,
      url: context.url || window.location.href,
      userAgent: navigator.userAgent,
      errorType: context.errorType || "custom",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      metadata: context.metadata
    };
    const token = localStorage.getItem("vendora_auth_token");
    const headers = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch("/api/logs/error/", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      keepalive: true
    });
    if (!res.ok) {
      console.warn(`[ErrorLogger] Failed to transmit error log (status: ${res.status})`);
      return { success: false };
    }
    const data = await res.json().catch(() => ({}));
    return { success: true, logId: data.logId };
  } catch (loggingErr) {
    console.warn("[ErrorLogger] Internal logger exception:", loggingErr);
    return { success: false };
  }
}
function initGlobalErrorLogging() {
  if (typeof window === "undefined") return;
  window.addEventListener(
    "error",
    (event) => {
    if (isBenignError(event.message) || (event.error && isBenignError(event.error))) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }
    logError(event.error || event.message, {
      errorType: "unhandled_error",
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    },
    true
  );
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = event.reason;
      if (isBenignError(reason)) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return;
      }
      logError(reason || "Unhandled Promise Rejection", {
        errorType: "unhandled_rejection"
      });
    },
    true
  );
}
export {
  initGlobalErrorLogging,
  isBenignError,
  logError
};
