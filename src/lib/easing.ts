/** Shared easing curves (Blueprint §12 — organic, never linear). */

export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

export const easeInOutCubic = (x: number): number =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

export const clamp = (x: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, x));

export const damp = (
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number => current + (target - current) * (1 - Math.exp(-lambda * dt));
