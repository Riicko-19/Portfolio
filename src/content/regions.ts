import type { RegionMeta } from "./schema";

/**
 * Region metadata (Blueprint §4 Brain Geography).
 * Coordinate model (§3): X = left(-)/right(+), Y = up, Z = front(+)/back(-).
 * Phase 1 only populates the Cerebellum; the others are declared for the
 * world map + future phases but carry no nodes yet.
 */
export const REGIONS: Record<string, RegionMeta> = {
  frontal: {
    id: "frontal",
    name: "Frontal Lobe",
    color: "#7c6cff",
    blurb: "Vision & Goals — roadmap and where the engineer is headed.",
    center: [0, 5, 11],
    radius: 9,
  },
  parietal: {
    id: "parietal",
    name: "Parietal Lobe",
    color: "#4fb6c9",
    blurb: "Navigation & Systems thinking — how problems get approached.",
    center: [0, 8, -2],
    radius: 8,
  },
  occipital: {
    id: "occipital",
    name: "Occipital Lobe",
    color: "#e85c9a",
    blurb: "Visual & Creative — design, visualization, generative work.",
    center: [0, 3, -12],
    radius: 7,
  },
  temporal: {
    id: "temporal",
    name: "Temporal Lobe",
    color: "#8fb84e",
    blurb: "Memory & Journey — milestones and formative moments.",
    center: [9, -3, 0],
    radius: 7,
  },
  cerebellum: {
    id: "cerebellum",
    name: "Cerebellum",
    color: "#e0a23c",
    blurb: "Skills, Tech Stack & Tools — the technical arsenal.",
    center: [0, -6.5, -8],
    radius: 6,
  },
  stem: {
    id: "stem",
    name: "Brain Stem",
    color: "#2c7a6b",
    blurb: "Fundamentals — CS core, DSA, OS, the load-bearing base.",
    center: [0, -11, -4],
    radius: 3,
  },
  core: {
    id: "core",
    name: "Chanakya Core",
    color: "#ffc76b",
    blurb: "Identity & Connection — the nucleus of the mind.",
    center: [0, -1, 0],
    radius: 2,
  },
};

export const REGION_LIST: RegionMeta[] = Object.values(REGIONS);

export function getRegion(id: string): RegionMeta | undefined {
  return REGIONS[id];
}
