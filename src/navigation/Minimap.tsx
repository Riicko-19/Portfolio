"use client";

import { REGION_LIST } from "@/content";
import { useMind } from "@/state/store";
import { bus } from "@/state/bus";

/**
 * Connectome minimap (Phase 2 §1 orientation; ref: Connectome Interior — used
 * for FUNCTION only, bespoke visual). Top-down schematic of the regions with a
 * live camera marker; click a region to fast-travel there.
 */
const RX = 17;
const RZ = 16;
const SIZE = 148;

function project(x: number, z: number) {
  const left = Math.max(4, Math.min(SIZE - 4, ((x / RX) * 0.5 + 0.5) * SIZE));
  const top = Math.max(4, Math.min(SIZE - 4, ((-z / RZ) * 0.5 + 0.5) * SIZE));
  return { left, top };
}

export default function Minimap() {
  const phase = useMind((s) => s.phase);
  const cam = useMind((s) => s.cameraInfo);
  if (phase !== "ready") return null;

  let nearest = "";
  let best = Infinity;
  for (const r of REGION_LIST) {
    const dx = r.center[0] - cam.x;
    const dz = r.center[2] - cam.z;
    const d = dx * dx + dz * dz;
    if (d < best) {
      best = d;
      nearest = r.id;
    }
  }
  const camP = project(cam.x, cam.z);
  const here = REGION_LIST.find((r) => r.id === nearest);

  return (
    <div className="minimap">
      <div className="minimap-title">Connectome</div>
      <div className="minimap-plot" style={{ width: SIZE, height: SIZE }}>
        {REGION_LIST.map((r) => {
          const p = project(r.center[0], r.center[2]);
          return (
            <button
              key={r.id}
              className={`mm-region ${r.id === nearest ? "is-here" : ""}`}
              style={{ left: p.left, top: p.top, background: r.color }}
              title={r.name}
              onClick={() =>
                r.id === "core"
                  ? bus.emit("camera:recenter", undefined)
                  : bus.emit("camera:frameRegion", { regionId: r.id })
              }
            />
          );
        })}
        <div className="mm-cam" style={{ left: camP.left, top: camP.top }} />
      </div>
      <div className="minimap-here">{here?.name ?? ""}</div>
    </div>
  );
}
