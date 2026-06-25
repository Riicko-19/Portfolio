import type { RegionId, RegionMeta } from "./schema";

/**
 * Region metadata (Blueprint §4 Brain Geography) + cognitive geography.
 * Coordinate model (§3): X = left(-)/right(+), Y = up, Z = front(+)/back(-).
 * Phase 1 only populates the Cerebellum; the others are visible geography
 * (color, label, hover) but unpopulated until Phase 2.
 */
export const REGIONS: Record<string, RegionMeta> = {
  frontal: {
    id: "frontal",
    name: "Frontal Lobe",
    color: "#7c6cff",
    blurb: "Goals, vision and where the engineer is headed.",
    domain: "Goals · Future Vision",
    hemisphere: "central",
    center: [0, 6, 12],
    radius: 9,
  },
  parietal: {
    id: "parietal",
    name: "Parietal Lobe",
    color: "#4fb6c9",
    blurb: "Logic, reasoning and systems thinking.",
    domain: "Logic · Systems",
    hemisphere: "right",
    center: [6, 9, -2],
    radius: 8,
  },
  occipital: {
    id: "occipital",
    name: "Occipital Lobe",
    color: "#e85c9a",
    blurb: "Research, visualization and creative processing.",
    domain: "Research · Visualization",
    hemisphere: "right",
    center: [3, 3, -13],
    radius: 7,
  },
  temporal: {
    id: "temporal",
    name: "Temporal Lobe",
    color: "#8fb84e",
    blurb: "Memory, journey and personal history.",
    domain: "Memory · Journey",
    hemisphere: "left",
    center: [-9, -2, 1],
    radius: 7,
  },
  cerebellum: {
    id: "cerebellum",
    name: "Cerebellum",
    color: "#e0a23c",
    blurb: "Skills, tech stack and the technical arsenal.",
    domain: "Skills · Tech Stack",
    hemisphere: "left",
    center: [0, -6.5, -8],
    radius: 6,
  },
  stem: {
    id: "stem",
    name: "Brain Stem",
    color: "#2c7a6b",
    blurb: "Fundamentals — CS core, the load-bearing base.",
    domain: "Fundamentals · Core Systems",
    hemisphere: "central",
    center: [0, -11, -4],
    radius: 3,
  },
  core: {
    id: "core",
    name: "Chanakya Core",
    color: "#ffc76b",
    blurb: "The nucleus of the mind — identity and intelligence.",
    domain: "Identity · Nucleus",
    hemisphere: "central",
    center: [0, -1, 0],
    radius: 3.2,
  },
  // Node-cluster regions embedded in the brain volume (not particle lobes).
  projects: {
    id: "projects",
    name: "Projects",
    color: "#3ddc97",
    blurb: "Flagship builds — the things made real.",
    domain: "Flagship Builds",
    hemisphere: "right",
    center: [9, 0, 4],
    radius: 5.5,
  },
  research: {
    id: "research",
    name: "Research",
    color: "#6f8cff",
    blurb: "Open questions and the frontier being explored.",
    domain: "Frontier Topics",
    hemisphere: "right",
    center: [-6, 6, -10],
    radius: 5.5,
  },
};

export const REGION_LIST: RegionMeta[] = Object.values(REGIONS);

/** Stable ordering → numeric index passed to the brain shader for tinting. */
export const REGION_ORDER: RegionId[] = [
  "frontal",
  "parietal",
  "occipital",
  "temporal",
  "cerebellum",
  "stem",
  "core",
  "projects",
  "research",
];

export function regionIndex(id: RegionId): number {
  return REGION_ORDER.indexOf(id);
}

export function getRegion(id: string): RegionMeta | undefined {
  return REGIONS[id];
}
