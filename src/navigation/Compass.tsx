"use client";

import { useMind } from "@/state/store";

/**
 * Neural compass (Phase 2 §1 orientation). Always points toward the Chanakya
 * Core — the world's north star — so you can never lose the center.
 */
export default function Compass() {
  const phase = useMind((s) => s.phase);
  const cam = useMind((s) => s.cameraInfo);
  if (phase !== "ready") return null;

  // Bearing from the camera toward the Core (origin) in the XZ plane.
  const bearingDeg = (Math.atan2(-cam.x, -cam.z) * 180) / Math.PI;

  return (
    <div className="compass" title="Bearing to Chanakya Core">
      <div className="compass-ring">
        <span className="compass-n">N</span>
        <div
          className="compass-needle"
          style={{ transform: `rotate(${bearingDeg}deg)` }}
        >
          <span className="compass-tip" />
        </div>
      </div>
      <div className="compass-label">CORE</div>
    </div>
  );
}
