/**
 * Input masking utilities for checkout and payment forms
 */

/**
 * Format raw input as a clean US/International phone number: (XXX) XXX-XXXX or +1 (XXX) XXX-XXXX
 * @param {string} value
 * @returns {string}
 */
export const formatPhoneNumber = (value = "") => {
  if (!value) return "";
  
  // Clean all non-digit characters except leading plus
  const hasPlus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "");
  
  if (digits.length === 0) return hasPlus ? "+" : "";

  // If starts with 1 and length > 10, format as +1 (XXX) XXX-XXXX
  if (digits.startsWith("1") && digits.length > 10) {
    const d = digits.slice(1, 11);
    let formatted = "+1 (";
    formatted += d.slice(0, 3);
    if (d.length >= 3) formatted += ") ";
    if (d.length > 3) formatted += d.slice(3, 6);
    if (d.length > 6) formatted += "-";
    if (d.length > 6) formatted += d.slice(6, 10);
    return formatted;
  }

  // Standard 10-digit format: (XXX) XXX-XXXX
  const d = digits.slice(0, 10);
  let formatted = "";
  if (d.length > 0) {
    formatted = "(" + d.slice(0, 3);
  }
  if (d.length > 3) {
    formatted += ") " + d.slice(3, 6);
  } else if (d.length === 3) {
    formatted += ") ";
  }
  if (d.length > 6) {
    formatted += "-" + d.slice(6, 10);
  }
  return formatted;
};

/**
 * Format raw card number into 4-digit grouped blocks: XXXX XXXX XXXX XXXX
 * @param {string} value
 * @returns {string}
 */
export const formatCardNumber = (value = "") => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ");
};

/**
 * Format expiration date as MM/YY
 * @param {string} value
 * @returns {string}
 */
export const formatCardExpiry = (value = "") => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    // If first digit > 1, auto prepend 0 (e.g. 5 -> 05)
    if (digits.length === 1 && Number.parseInt(digits, 10) > 1) {
      return `0${digits}/`;
    }
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
};

/**
 * Format security code (CVC/CVV) to digits only with max length of 4
 * @param {string} value
 * @param {number} [maxLength=4]
 * @returns {string}
 */
export const formatCardCvc = (value = "", maxLength = 4) => {
  if (!value) return "";
  return value.replace(/\D/g, "").slice(0, maxLength);
};
