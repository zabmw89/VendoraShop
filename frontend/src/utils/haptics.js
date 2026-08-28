const isVibrationSupported = () => {
  return typeof window !== "undefined" && typeof navigator !== "undefined" && "vibrate" in navigator;
};
const triggerOrderSuccessHaptic = () => {
  if (!isVibrationSupported()) return false;
  try {
    return navigator.vibrate([60, 40, 80, 50, 150]);
  } catch (err) {
    console.debug("[Haptics] Vibration failed:", err);
    return false;
  }
};
const triggerStepChangeHaptic = () => {
  if (!isVibrationSupported()) return false;
  try {
    return navigator.vibrate(25);
  } catch {
    return false;
  }
};
const triggerSelectionHaptic = () => {
  if (!isVibrationSupported()) return false;
  try {
    return navigator.vibrate(15);
  } catch {
    return false;
  }
};
const triggerSuccessHaptic = () => {
  if (!isVibrationSupported()) return false;
  try {
    return navigator.vibrate([40, 30, 80]);
  } catch {
    return false;
  }
};
const triggerErrorHaptic = () => {
  if (!isVibrationSupported()) return false;
  try {
    return navigator.vibrate([90, 60, 90]);
  } catch {
    return false;
  }
};
const triggerCustomHaptic = (pattern) => {
  if (!isVibrationSupported()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
};
export {
  isVibrationSupported,
  triggerCustomHaptic,
  triggerErrorHaptic,
  triggerOrderSuccessHaptic,
  triggerSelectionHaptic,
  triggerStepChangeHaptic,
  triggerSuccessHaptic
};
