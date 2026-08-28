import { describe, it, expect, vi, beforeEach } from "vitest";
import { triggerCelebrationConfetti, triggerFireworkShow } from "../utils/confetti";
vi.mock("canvas-confetti", () => {
  return {
    default: vi.fn()
  };
});
describe("Canvas Confetti Animations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("triggers celebration confetti without errors", () => {
    expect(() => triggerCelebrationConfetti()).not.toThrow();
  });
  it("triggers firework show without errors", () => {
    expect(() => triggerFireworkShow(100)).not.toThrow();
  });
});
