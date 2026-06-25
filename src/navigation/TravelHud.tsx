"use client";

import { useMind } from "@/state/store";
import { getNode } from "@/content";

/**
 * Neural-travel HUD (Phase 2 §11; ref: Neural Travel System — function only,
 * bespoke visual). Shows the destination + the lock → transit → arrive phase
 * while riding a synapse.
 */
export default function TravelHud() {
  const traveling = useMind((s) => s.traveling);
  const toId = useMind((s) => s.travelTo);
  const progress = useMind((s) => s.travelProgress);
  if (!traveling) return null;

  const dest = toId ? getNode(toId)?.title ?? "" : "";
  const phase =
    progress < 0.15 ? "LOCK ON" : progress < 0.85 ? "DATA TRANSIT" : "ARRIVAL";

  return (
    <div className="travel-hud">
      <div className="travel-top">
        <span className="travel-phase">{phase}</span>
        <span className="travel-dest">→ {dest}</span>
      </div>
      <div className="travel-bar">
        <div
          className="travel-fill"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
