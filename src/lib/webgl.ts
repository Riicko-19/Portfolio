/**
 * Capability gate (Blueprint §15 — "if below threshold, offer the 2D experience
 * instead of a janky 3D one"). Cheap, synchronous, runs once before the Canvas
 * mounts.
 */
export interface Capability {
  supported: boolean;
  reason?: string;
}

export function detectWebGL(): Capability {
  if (typeof window === "undefined") {
    return { supported: false, reason: "server" };
  }
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) {
      return { supported: false, reason: "no-webgl" };
    }
    return { supported: true };
  } catch {
    return { supported: false, reason: "exception" };
  }
}

/** Coarse device hint — phones route to the fallback (Blueprint: desktop+tablet). */
export function isLikelyPhone(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 600;
  return coarse && narrow;
}
