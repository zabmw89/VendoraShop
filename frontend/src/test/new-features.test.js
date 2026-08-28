import { describe, it, expect } from "vitest";
import {
  formatPhoneNumber,
  formatCardNumber,
  formatCardExpiry,
  formatCardCvc
} from "../utils/masking";

describe("Input Masking Utilities", () => {
  describe("formatPhoneNumber", () => {
    it("formats 10 digits as (XXX) XXX-XXXX", () => {
      expect(formatPhoneNumber("5551234567")).toBe("(555) 123-4567");
    });

    it("formats partial input gracefully", () => {
      expect(formatPhoneNumber("55")).toBe("(55");
      expect(formatPhoneNumber("555")).toBe("(555) ");
      expect(formatPhoneNumber("555123")).toBe("(555) 123");
      expect(formatPhoneNumber("5551234")).toBe("(555) 123-4");
    });

    it("formats US international phone numbers with +1", () => {
      expect(formatPhoneNumber("+15551234567")).toBe("+1 (555) 123-4567");
    });

    it("returns empty string for empty input", () => {
      expect(formatPhoneNumber("")).toBe("");
    });
  });

  describe("formatCardNumber", () => {
    it("formats digits in 4-character blocks", () => {
      expect(formatCardNumber("4532890123456789")).toBe("4532 8901 2345 6789");
    });

    it("strips non-digits and truncates to 16 digits", () => {
      expect(formatCardNumber("4532-8901-2345-6789-999")).toBe("4532 8901 2345 6789");
    });

    it("handles partial input", () => {
      expect(formatCardNumber("45328")).toBe("4532 8");
    });
  });

  describe("formatCardExpiry", () => {
    it("formats 4 digits as MM/YY", () => {
      expect(formatCardExpiry("0828")).toBe("08/28");
    });

    it("auto-formats single digit > 1 as 0M/", () => {
      expect(formatCardExpiry("5")).toBe("05/");
    });

    it("strips non-digits and limits length", () => {
      expect(formatCardExpiry("12/2699")).toBe("12/26");
    });
  });

  describe("formatCardCvc", () => {
    it("keeps digits only up to max length", () => {
      expect(formatCardCvc("842")).toBe("842");
      expect(formatCardCvc("842a")).toBe("842");
      expect(formatCardCvc("84219")).toBe("8421");
    });
  });
});
