const isServiceWorkerSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator;

const getServiceWorkerUrl = () => `${import.meta.env.BASE_URL}sw.js`;

async function unregister() {
  if (!isServiceWorkerSupported()) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch (error) {
    console.error("[Service Worker] Failed to unregister:", error);
  }
}

function register(config) {
  if (!isServiceWorkerSupported()) return;

  // Service workers cache module requests and interfere with Vite's HMR graph.
  // Remove a previously-installed worker while developing, then enable it only
  // in production builds where the generated assets are immutable.
  if (import.meta.env.DEV) {
    unregister();
    return;
  }

  window.addEventListener("load", () => {
    const swUrl = getServiceWorkerUrl();
    navigator.serviceWorker.register(swUrl).then((registration) => {
        console.log("[Service Worker] Registered successfully with scope:", registration.scope);
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("[Service Worker] New content available; will update upon reload.");
                if (config?.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                console.log("[Service Worker] Content cached for offline use.");
                if (config?.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
    }).catch((error) => {
      console.warn("[Service Worker] Registration note:", error.message);
    });
  });
}
export {
  register,
  unregister
};
