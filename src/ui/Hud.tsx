"use client";

import { useMind } from "@/state/store";
import { getNode } from "@/content";

/**
 * Minimal HUD (Blueprint §3 orientation + §8 fast-lane affordance). A location
 * breadcrumb (doubles as deep-link feedback), a Search button, and a controls
 * hint. The full compass/minimap is Phase 2 and intentionally not built here.
 */
export default function Hud() {
  const phase = useMind((s) => s.phase);
  const selected = useMind((s) => s.selectedNodeId);
  const setSpotlight = useMind((s) => s.setSpotlight);
  if (phase !== "ready") return null;
  const node = selected ? getNode(selected) : null;

  return (
    <>
      <div className="hud-top">
        <span className="hud-loc">
          Brain <span className="sep">▸</span> Cerebellum
          {node && (
            <>
              {" "}
              <span className="sep">▸</span>{" "}
              <span className="hud-node">{node.title}</span>
            </>
          )}
        </span>
      </div>
      <button className="hud-search" onClick={() => setSpotlight(true)}>
        <kbd>⌘K</kbd> Search the mind
      </button>
      <div className="hud-hint">
        drag to orbit · scroll to zoom · click a node · esc to release · H to
        recenter
      </div>
    </>
  );
}
