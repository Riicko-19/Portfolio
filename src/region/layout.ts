import { REGIONS } from "@/content";
import type { Vec3 } from "@/state/store";

/**
 * Deterministic node layout for any region (Blueprint §5; Phase 2 generic
 * rendering). Fibonacci shell just outside the region centre so nodes read as
 * a cluster. Pure + deterministic so renderer and Camera Director agree.
 */
export function layoutRegion(
  regionId: string,
  nodeIds: string[],
): Record<string, Vec3> {
  const r = REGIONS[regionId];
  if (!r) return {};
  const rad = r.radius + 1.4;
  const rx = rad;
  const ry = rad * 0.74;
  const rz = rad * 0.84;
  const n = Math.max(1, nodeIds.length);
  const golden = Math.PI * (3 - Math.sqrt(5));

  const out: Record<string, Vec3> = {};
  nodeIds.forEach((id, i) => {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    out[id] = [
      r.center[0] + Math.cos(theta) * radial * rx,
      r.center[1] + y * ry,
      r.center[2] + Math.sin(theta) * radial * rz,
    ];
  });
  return out;
}
