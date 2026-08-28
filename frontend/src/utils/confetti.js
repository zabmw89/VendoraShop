import confetti from "canvas-confetti";
const FESTIVE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#e11d48"];
function triggerCelebrationConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.55 },
      colors: FESTIVE_COLORS,
      ticks: 200,
      gravity: 1.1,
      scalar: 1.05,
      disableForReducedMotion: true
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 65,
        origin: { x: 0.05, y: 0.7 },
        colors: FESTIVE_COLORS,
        ticks: 240,
        startVelocity: 45,
        disableForReducedMotion: true
      });
    }, 200);
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 65,
        origin: { x: 0.95, y: 0.7 },
        colors: FESTIVE_COLORS,
        ticks: 240,
        startVelocity: 45,
        disableForReducedMotion: true
      });
    }, 400);
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 120,
        origin: { y: 0.45 },
        colors: ["#fbbf24", "#f59e0b", "#60a5fa", "#34d399"],
        ticks: 280,
        gravity: 0.8,
        scalar: 0.85,
        disableForReducedMotion: true
      });
    }, 650);
  } catch (err) {
    console.debug("[Confetti] Animation notice:", err);
  }
}
function triggerFireworkShow(durationMs = 2e3) {
  try {
    const animationEnd = Date.now() + durationMs;
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 40 * (timeLeft / durationMs);
      confetti({
        particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: FESTIVE_COLORS,
        disableForReducedMotion: true
      });
      confetti({
        particleCount,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: FESTIVE_COLORS,
        disableForReducedMotion: true
      });
    }, 250);
  } catch (err) {
    console.debug("[Confetti] Firework notice:", err);
  }
}
export {
  triggerCelebrationConfetti,
  triggerFireworkShow
};
