// ─────────────────────────────────────────────────────────────────
// Common Experiment Randomizer & Trial Utilities
// ─────────────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle for unbiased trial order
 */
export const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Uniform random integer between min and max (inclusive)
 */
export const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Random element from an array
 */
export const randomChoice = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};
