import { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  getSavedNotificationPreferences,
  saveNotificationPreferences,
  sendOrderConfirmedNotification,
  sendOrderShippedNotification,
  sendFlashSaleNotification,
  sendPriceDropNotification,
  sendBrowserNotification
} from "../utils/notifications";
import { triggerOrderSuccessHaptic, triggerStepChangeHaptic } from "../utils/haptics";
const NotificationContext = createContext(void 0);
function getDefaultPrefs() {
  return getSavedNotificationPreferences();
}
const NotificationProvider = ({ children }) => {
  const [permission, setPermission] = useState("default");
  const [preferences, setPreferences] = useState(getDefaultPrefs);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  useEffect(() => {
    setPermission(getBrowserNotificationPermission());
    setPreferences(getSavedNotificationPreferences());
  }, []);
  const requestPermission = async () => {
    const result = await requestBrowserNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      sendBrowserNotification("Notifications Enabled! \u{1F389}", {
        body: "You'll now receive timely updates for your orders, shipment tracking, and flash sales."
      });
    }
    return result;
  };
  const updatePreferences = (newPrefs) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    saveNotificationPreferences(updated);
  };
  const sendOrderConfirmedAlert = (orderId, total) => {
    if (preferences.hapticFeedback) {
      triggerOrderSuccessHaptic();
    }
    if (preferences.orderUpdates && permission === "granted") {
      sendOrderConfirmedNotification(orderId, total);
    }
  };
  const sendOrderShippedAlert = (orderId, trackingNumber) => {
    if (preferences.orderUpdates && permission === "granted") {
      sendOrderShippedNotification(orderId, trackingNumber);
    }
  };
  const sendFlashSaleAlert = (dealTitle = "Spring Audio & Wearables Flash Deal", discountText = "25% OFF") => {
    if (preferences.flashSales && permission === "granted") {
      sendFlashSaleNotification(dealTitle, discountText, "Flagship Acoustics");
    }
  };
  const sendPriceDropAlert = (productName, newPrice, oldPrice) => {
    if (preferences.hapticFeedback) {
      triggerStepChangeHaptic();
    }
    if ((preferences.flashSales || preferences.promotions) && permission === "granted") {
      sendPriceDropNotification(productName, newPrice, oldPrice);
    }
  };
  const sendTestAlert = () => {
    if (permission !== "granted") {
      requestPermission();
      return;
    }
    if (preferences.hapticFeedback) {
      triggerStepChangeHaptic();
    }
    sendBrowserNotification("\u26A1 Flash Sale: 20% Off Storewide!", {
      body: "Limited time flash sale is now active on all curated electronics & travel gear.",
      tag: "flash-sale-test"
    });
  };
  const contextValue = useMemo(() => ({
      permission,
      preferences,
      isPermissionModalOpen,
      openPermissionModal: () => setIsPermissionModalOpen(true),
      closePermissionModal: () => setIsPermissionModalOpen(false),
      requestPermission,
      updatePreferences,
      sendOrderConfirmedAlert,
      sendOrderShippedAlert,
      sendFlashSaleAlert,
      sendPriceDropAlert,
      sendTestAlert
    }), [permission, preferences, isPermissionModalOpen]);
  return <NotificationContext.Provider
    value={contextValue}
  >
      {children}
    </NotificationContext.Provider>;
};
const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
export {
  NotificationProvider,
  useNotifications
};
