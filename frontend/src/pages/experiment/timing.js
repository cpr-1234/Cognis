// ─────────────────────────────────────────────────────────────────
// High-Resolution Precision Timing Engine
// Uses window.performance.now() for sub-millisecond accuracy
// Never use Date.now() for reaction time measurement
// ─────────────────────────────────────────────────────────────────

export const getHighResTime = () => {
  return window.performance.now();
};

export const calculateReactionTime = (onsetMs, respondedAtMs) => {
  if (onsetMs == null || respondedAtMs == null) return null;
  return Math.round((respondedAtMs - onsetMs) * 10) / 10;
};

/**
 * requestAnimationFrame synchronization to guarantee timing
 * starts exactly when the screen paints the stimulus
 */
export const syncWithScreenPaint = (callback) => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const onset = window.performance.now();
      callback(onset);
    });
  });
};

export const formatRT = (ms) => {
  if (ms == null) return "—";
  return `${Math.round(ms)} ms`;
};
