import { REGIONS } from "@/content";
import type { Vec3 } from "@/state/store";

/**
 * Deterministic node layout for the Cerebellum (Blueprint §5 — "auto-laid-out
 * at build time"). Distributes nodes on a Fibonacci shell just outside the
 * region's particle body so they read as raised studs on the surface.
 * Pure + deterministic so the world renderer and the Camera Director derive
 * identical positions from the same node order.
 */
export function layoutCerebellum(nodeIds: string[]): Record<string, Vec3> {
  const { center, radius } = REGIONS.cerebellum;
  const r = radius + 1.5;
  const rx = r;
  const ry = r * 0.72;
  const rz = r * 0.82;
  const n = Math.max(1, nodeIds.length);
  const golden = Math.PI * (3 - Math.sqrt(5));

  const out: Record<string, Vec3> = {};
  nodeIds.forEach((id, i) => {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2; // 1 .. -1
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const px = Math.cos(theta) * rad;
    const pz = Math.sin(theta) * rad;
    out[id] = [center[0] + px * rx, center[1] + y * ry, center[2] + pz * rz];
  });
  return out;
}
