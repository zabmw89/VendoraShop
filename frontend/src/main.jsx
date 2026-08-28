import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
serviceWorkerRegistration.register();
if (typeof window !== "undefined") {
  const isResizeObserverError = (err) => {
    if (!err) return false;
    const str = typeof err === "string" ? err : err?.message || String(err);
    return str.includes("ResizeObserver loop completed with undelivered notifications") || str.includes("ResizeObserver loop limit exceeded") || str.toLowerCase().includes("resizeobserver");
  };
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (isResizeObserverError(message) || isResizeObserverError(error)) {
      return true;
    }
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };
  window.addEventListener(
    "error",
    (event) => {
      if (isResizeObserverError(event.message) || isResizeObserverError(event.error)) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
