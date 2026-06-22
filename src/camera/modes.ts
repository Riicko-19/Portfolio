/**
 * Camera mode definitions (Blueprint §7 Camera Architecture).
 * Phase 1 implements ONLY Orbit + Focus. Travel / NeuralPath / FreeFly are
 * declared as the contract for Phase 2 but intentionally NOT implemented.
 */
export const CAMERA_MODES = ["orbit", "focus"] as const;
export type CameraMode = (typeof CAMERA_MODES)[number];

/** Tuning constants for the Director's framing math. */
export const CAMERA_TUNING = {
  /** Distance the camera sits from a focused node. */
  focusDistance: 9,
  /** Min/max dolly while orbiting (keeps the user inside the tier). */
  orbitMin: 14,
  orbitMax: 80,
  /** Default world point the orbit looks at when nothing is selected. */
  homeTarget: [0, -2, -4] as [number, number, number],
  /** Default camera position for the initial "ready" framing (pulled back so
   * the additive particle field reads as a brain, not an overexposed blob). */
  homePosition: [24, 8, 34] as [number, number, number],
} as const;
