"use client";

import { useEffect } from "react";
import { useMind } from "@/state/store";
import { bus } from "@/state/bus";

/**
 * Global keyboard layer (Blueprint §9). ⌘K / Ctrl+K toggles spotlight,
 * Escape releases (close spotlight → deselect), H recenters the camera.
 * Ignores keystrokes while typing in an input.
 */
export default function GlobalHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        useMind.getState().toggleSpotlight();
        return;
      }
      if (typing) return;

      if (e.key === "Escape") {
        const s = useMind.getState();
        if (s.spotlightOpen) s.setSpotlight(false);
        else if (s.selectedNodeId) s.select(null);
        return;
      }
      if (e.key === "h" || e.key === "H") {
        useMind.getState().select(null);
        bus.emit("camera:recenter", undefined);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
