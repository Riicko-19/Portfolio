"use client";

import { useEffect, useRef } from "react";
import { useMind } from "@/state/store";
import { getNode } from "@/content";

/**
 * Deep linking (Blueprint §1/§8) — the URL reflects the selected node so the
 * 3D world is shareable and back/forward works. `?node=<id>` is read on ready
 * and written on selection change; canonical crawlable pages live at
 * `/explore/<id>`.
 */
export default function DeepLink() {
  const phase = useMind((s) => s.phase);
  const applied = useRef(false);

  // Apply ?node= once the world is interactive.
  useEffect(() => {
    if (phase !== "ready" || applied.current) return;
    applied.current = true;
    const id = new URLSearchParams(window.location.search).get("node");
    if (id && getNode(id)) useMind.getState().select(id);
  }, [phase]);

  // Reflect selection → URL (no full navigation).
  useEffect(() => {
    let prev = useMind.getState().selectedNodeId;
    return useMind.subscribe((s) => {
      if (s.selectedNodeId === prev) return;
      prev = s.selectedNodeId;
      const url = new URL(window.location.href);
      if (s.selectedNodeId) url.searchParams.set("node", s.selectedNodeId);
      else url.searchParams.delete("node");
      window.history.replaceState(null, "", url.toString());
    });
  }, []);

  // Back/forward.
  useEffect(() => {
    const onPop = () => {
      const id = new URLSearchParams(window.location.search).get("node");
      const s = useMind.getState();
      if (id && getNode(id)) s.select(id);
      else s.select(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return null;
}
