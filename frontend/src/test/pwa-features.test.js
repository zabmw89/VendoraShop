import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  triggerCustomHaptic,
  triggerOrderSuccessHaptic,
  triggerStepChangeHaptic,
  triggerErrorHaptic,
  isVibrationSupported
} from "../utils/haptics";
import {
  getBrowserNotificationPermission,
  sendOrderConfirmedNotification,
  sendFlashSaleNotification
} from "../utils/notifications";
describe("Vibration & Haptics API utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  it("detects vibration API support accurately", () => {
    const originalVibrate = navigator.vibrate;
    try {
      Object.defineProperty(navigator, "vibrate", {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
        writable: true
      });
      expect(isVibrationSupported()).toBe(true);
      const res = triggerCustomHaptic([50, 50, 100]);
      expect(res).toBe(true);
      expect(navigator.vibrate).toHaveBeenCalledWith([50, 50, 100]);
    } finally {
      Object.defineProperty(navigator, "vibrate", {
        value: originalVibrate,
        configurable: true,
        writable: true
      });
    }
  });
  it("triggers step change, order success, and error haptic patterns", () => {
    const vibrateSpy = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "vibrate", {
      value: vibrateSpy,
      configurable: true,
      writable: true
    });
    triggerStepChangeHaptic();
    expect(vibrateSpy).toHaveBeenCalledWith(25);
    triggerOrderSuccessHaptic();
    expect(vibrateSpy).toHaveBeenCalledWith([60, 40, 80, 50, 150]);
    triggerErrorHaptic();
    expect(vibrateSpy).toHaveBeenCalledWith([90, 60, 90]);
  });
});
describe("Browser Notification API utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  it("checks notification support in execution context", () => {
    expect(typeof getBrowserNotificationPermission()).toBe("string");
  });
  it("handles sendOrderConfirmedNotification and sendFlashSaleNotification gracefully", () => {
    const orderResult = sendOrderConfirmedNotification("ord_test_123", 149.99);
    expect(typeof orderResult).toBe("boolean");
    const flashResult = sendFlashSaleNotification("Midnight Audio Sale", "40% OFF");
    expect(typeof flashResult).toBe("boolean");
  });
});
