"use client";

import { useEffect, useRef } from "react";
import { useMind } from "@/state/store";
import { getNode } from "@/content";

/**
 * Deep linking (Blueprint §1/§8; Issue 10). Reads the node from EITHER the
 * `/brain/<id>` path or `?node=<id>` on ready, and reflects selection back to
 * the URL (path style on /brain, query style elsewhere). Back/forward works.
 */
function readNodeFromUrl(): string | null {
  const m = window.location.pathname.match(/^\/brain\/([^/]+)/);
  if (m) return decodeURIComponent(m[1]);
  return new URLSearchParams(window.location.search).get("node");
}

function writeNodeToUrl(id: string | null) {
  if (window.location.pathname.startsWith("/brain")) {
    window.history.replaceState(null, "", id ? `/brain/${id}` : "/brain");
    return;
  }
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("node", id);
  else url.searchParams.delete("node");
  window.history.replaceState(null, "", url.toString());
}

export default function DeepLink() {
  const phase = useMind((s) => s.phase);
  const applied = useRef(false);

  // Apply the URL's node once the world is interactive.
  useEffect(() => {
    if (phase !== "ready" || applied.current) return;
    applied.current = true;
    const id = readNodeFromUrl();
    if (id && getNode(id)) useMind.getState().select(id);
  }, [phase]);

  // Reflect selection → URL (no full navigation).
  useEffect(() => {
    let prev = useMind.getState().selectedNodeId;
    return useMind.subscribe((s) => {
      if (s.selectedNodeId === prev) return;
      prev = s.selectedNodeId;
      writeNodeToUrl(s.selectedNodeId);
    });
  }, []);

  // Back/forward.
  useEffect(() => {
    const onPop = () => {
      const id = readNodeFromUrl();
      const s = useMind.getState();
      if (id && getNode(id)) s.select(id);
      else s.select(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return null;
}
