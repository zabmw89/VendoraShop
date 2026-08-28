const PREFS_KEY = "vendora_notification_preferences";
const getDefaultPreferences = () => ({
  orderUpdates: true,
  flashSales: true,
  promotions: false,
  hapticFeedback: true
});
const getSavedNotificationPreferences = () => {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) {
      return { ...getDefaultPreferences(), ...JSON.parse(saved) };
    }
  } catch {
  }
  return getDefaultPreferences();
};
const saveNotificationPreferences = (prefs) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error("[Notifications] Failed to save preferences:", err);
  }
};
const getBrowserNotificationPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
};
const requestBrowserNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn("[Notifications] Permission request error:", err);
    return Notification.permission;
  }
};
const sendBrowserNotification = (title, options = {}) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission !== "granted") {
    return false;
  }
  try {
    const defaultIcon = "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=128&auto=format&fit=crop&q=80";
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          icon: options.icon || defaultIcon,
          badge: options.badge || defaultIcon,
          body: options.body || "",
          tag: options.tag,
          data: options.data,
          ...options
        });
      }).catch(() => {
        new Notification(title, {
          icon: options.icon || defaultIcon,
          body: options.body || "",
          tag: options.tag,
          ...options
        });
      });
      return true;
    }
    const notification = new Notification(title, {
      icon: options.icon || defaultIcon,
      body: options.body || "",
      tag: options.tag,
      ...options
    });
    notification.onclick = () => {
      window.focus();
      if (options.data?.url) {
        window.location.href = options.data.url;
      }
    };
    return true;
  } catch (err) {
    console.warn("[Notifications] Failed to send notification:", err);
    return false;
  }
};
const sendOrderConfirmedNotification = (orderId, totalAmount) => {
  const prefs = getSavedNotificationPreferences();
  if (!prefs.orderUpdates) return false;
  return sendBrowserNotification(`Order #${orderId} Confirmed! \u{1F389}`, {
    body: `Thank you! Your order of $${totalAmount.toFixed(2)} is being processed and prepared for shipping.`,
    tag: `order-${orderId}`,
    data: { orderId, type: "order_status" }
  });
};
const sendOrderShippedNotification = (orderId, trackingNumber) => {
  const prefs = getSavedNotificationPreferences();
  if (!prefs.orderUpdates) return false;
  return sendBrowserNotification(`Order #${orderId} has Shipped! \u{1F69A}`, {
    body: trackingNumber ? `Your package is on its way with tracking number: ${trackingNumber}.` : `Your package is on the way! Tap to track delivery progress.`,
    tag: `order-shipped-${orderId}`,
    data: { orderId, type: "order_tracking" }
  });
};
const sendFlashSaleNotification = (dealTitle, discountText, categoryName = "Exclusive Collection") => {
  const prefs = getSavedNotificationPreferences();
  if (!prefs.flashSales) return false;
  return sendBrowserNotification(`\u26A1 Flash Sale Alert: ${discountText}!`, {
    body: `${dealTitle} - Limited quantities available in ${categoryName}. Don't miss out!`,
    tag: "flash-sale-alert",
    requireInteraction: false,
    data: { type: "flash_sale", dealTitle }
  });
};
const sendPriceDropNotification = (productName, newPrice, oldPrice) => {
  const prefs = getSavedNotificationPreferences();
  if (!prefs.flashSales && !prefs.promotions) return false;
  const dropText = oldPrice ? `Price dropped from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}!` : `Price dropped to $${newPrice.toFixed(2)}!`;
  return sendBrowserNotification(`\u{1F4C9} Price Drop Alert: ${productName}`, {
    body: `Great news! ${dropText} Grab it before stock runs out.`,
    tag: `price-drop-${productName.toLowerCase().replace(/\s+/g, "-")}`,
    data: { type: "price_drop", productName, newPrice }
  });
};
export {
  getBrowserNotificationPermission,
  getDefaultPreferences,
  getSavedNotificationPreferences,
  requestBrowserNotificationPermission,
  saveNotificationPreferences,
  sendBrowserNotification,
  sendFlashSaleNotification,
  sendOrderConfirmedNotification,
  sendOrderShippedNotification,
  sendPriceDropNotification
};
