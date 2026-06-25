"use client";

import { create } from "zustand";
import type { CameraMode } from "@/camera/modes";

/**
 * Global state spine (Blueprint §2 / §14 — Zustand sliced store).
 * The integration surface between systems. Camera *transform* is NOT here
 * (it lives on the three object, read transiently); only camera *intent* is.
 */

export type Phase = "boot" | "forming" | "ready";

export type Vec3 = [number, number, number];

export interface TerminalWindow {
  id: string;
  kind: "info";
  nodeId: string;
  x: number;
  y: number;
  z: number;
  minimized: boolean;
}

const MAX_WINDOWS = 3; // Blueprint §9 — window cap to prevent clutter.

interface MindState {
  // --- lifecycle ---
  phase: Phase;
  setPhase: (p: Phase) => void;

  // --- selection / hover ---
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  setHovered: (id: string | null) => void;
  /** Select a node: focuses the camera and opens its Information terminal. */
  select: (id: string | null) => void;

  // --- region orientation (Blueprint §3/§4) ---
  hoveredRegionId: string | null;
  setHoveredRegion: (id: string | null) => void;

  // --- camera intent (Director is the sole executor) ---
  cameraMode: CameraMode;

  // --- neural travel (Phase 2B) ---
  traveling: boolean;
  travelFrom: string | null;
  travelTo: string | null;
  travelProgress: number;
  /** Ride the synapse from the current node to `toId`; falls back to select. */
  beginTravel: (toId: string) => void;
  endTravel: () => void;

  // --- camera readout for the HUD (compass / minimap) ---
  cameraInfo: { x: number; y: number; z: number; azimuth: number };
  setCameraInfo: (info: {
    x: number;
    y: number;
    z: number;
    azimuth: number;
  }) => void;

  // --- discovery (Phase 2B) ---
  discovered: Record<string, true>;
  markDiscovered: (id: string) => void;
  loadDiscovered: () => void;

  // --- node world positions, registered by the region on mount ---
  nodePositions: Record<string, Vec3>;
  registerPositions: (positions: Record<string, Vec3>) => void;

  // --- spotlight ---
  spotlightOpen: boolean;
  setSpotlight: (open: boolean) => void;
  toggleSpotlight: () => void;

  // --- window manager (Blueprint §9) ---
  windows: TerminalWindow[];
  topZ: number;
  openInfo: (nodeId: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;

  // --- accessibility ---
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}

export const useMind = create<MindState>((set, get) => ({
  phase: "boot",
  setPhase: (phase) => set({ phase }),

  hoveredNodeId: null,
  selectedNodeId: null,
  setHovered: (hoveredNodeId) => set({ hoveredNodeId }),

  hoveredRegionId: null,
  setHoveredRegion: (hoveredRegionId) => set({ hoveredRegionId }),

  select: (id) => {
    if (id === null) {
      set({ selectedNodeId: null, cameraMode: "orbit" });
      return;
    }
    set({ selectedNodeId: id, cameraMode: "focus" });
    get().openInfo(id);
    get().markDiscovered(id);
  },

  cameraMode: "orbit",

  traveling: false,
  travelFrom: null,
  travelTo: null,
  travelProgress: 0,
  beginTravel: (toId) => {
    const { selectedNodeId, nodePositions } = get();
    const from = selectedNodeId;
    if (!from || from === toId || !nodePositions[from] || !nodePositions[toId]) {
      get().select(toId);
      return;
    }
    set({ traveling: true, travelFrom: from, travelTo: toId, travelProgress: 0 });
  },
  endTravel: () => {
    const toId = get().travelTo;
    set({ traveling: false, travelProgress: 1 });
    if (toId) get().select(toId);
  },

  cameraInfo: { x: 27, y: 10, z: 40, azimuth: 0 },
  setCameraInfo: (cameraInfo) => set({ cameraInfo }),

  discovered: {},
  markDiscovered: (id) =>
    set((s) => {
      if (s.discovered[id]) return s;
      const discovered = { ...s.discovered, [id]: true as const };
      try {
        localStorage.setItem(
          "itm-discovered",
          JSON.stringify(Object.keys(discovered)),
        );
      } catch {
        /* ignore */
      }
      return { discovered };
    }),
  loadDiscovered: () => {
    try {
      const raw = localStorage.getItem("itm-discovered");
      if (!raw) return;
      const ids: string[] = JSON.parse(raw);
      const discovered: Record<string, true> = {};
      ids.forEach((id) => (discovered[id] = true));
      set({ discovered });
    } catch {
      /* ignore */
    }
  },

  nodePositions: {},
  registerPositions: (positions) =>
    set((s) => ({ nodePositions: { ...s.nodePositions, ...positions } })),

  spotlightOpen: false,
  setSpotlight: (spotlightOpen) => set({ spotlightOpen }),
  toggleSpotlight: () => set((s) => ({ spotlightOpen: !s.spotlightOpen })),

  windows: [],
  topZ: 1,
  openInfo: (nodeId) => {
    const { windows, topZ } = get();
    const existing = windows.find((w) => w.nodeId === nodeId);
    const nextZ = topZ + 1;
    if (existing) {
      set({
        topZ: nextZ,
        windows: windows.map((w) =>
          w.id === existing.id ? { ...w, z: nextZ, minimized: false } : w,
        ),
      });
      return;
    }
    // Enforce the cap: drop the least-recently-focused (lowest z) window.
    let pruned = windows;
    if (windows.length >= MAX_WINDOWS) {
      const oldest = [...windows].sort((a, b) => a.z - b.z)[0];
      pruned = windows.filter((w) => w.id !== oldest.id);
    }
    const offset = pruned.length * 26;
    set({
      topZ: nextZ,
      windows: [
        ...pruned,
        {
          id: `win-${nodeId}-${Date.now()}`,
          kind: "info",
          nodeId,
          x: 64 + offset,
          y: 96 + offset,
          z: nextZ,
          minimized: false,
        },
      ],
    });
  },
  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),
  focusWindow: (id) =>
    set((s) => {
      const nextZ = s.topZ + 1;
      // Only raise z-order. Restoring is owned solely by the minimize toggle,
      // so the two don't fight over `minimized`.
      return {
        topZ: nextZ,
        windows: s.windows.map((w) => (w.id === id ? { ...w, z: nextZ } : w)),
      };
    }),
  // Pure toggle reading fresh state — no reliance on a stale render closure.
  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: !w.minimized } : w,
      ),
    })),
  moveWindow: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  reducedMotion: false,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
