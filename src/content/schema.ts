import { z } from "zod";

/**
 * Content contract (Blueprint §5 Node Architecture).
 * Single source of truth, validated at load. Consumed by BOTH the 3D world
 * and the SSR 2D fallback — no system invents content, they render this.
 */

export const RegionId = z.enum([
  "frontal",
  "parietal",
  "occipital",
  "temporal",
  "cerebellum",
  "stem",
  "core",
  "projects",
  "research",
]);
export type RegionId = z.infer<typeof RegionId>;

/** Node hierarchy levels (Phase 2 §3). Drives size + glow. */
export const TierSchema = z.enum(["legendary", "major", "standard", "minor"]);
export type Tier = z.infer<typeof TierSchema>;

const TIER_IMPORTANCE: Record<Tier, number> = {
  legendary: 1,
  major: 0.82,
  standard: 0.6,
  minor: 0.4,
};

export const NodeKind = z.enum([
  "project",
  "skill",
  "tech",
  "memory",
  "research",
  "goal",
  "about",
  "contact",
]);
export type NodeKind = z.infer<typeof NodeKind>;

export const NodeType = z.enum(["core", "region", "cluster", "node"]);
export type NodeType = z.infer<typeof NodeType>;

export const StatusSchema = z.enum(["live", "wip", "archived", "concept"]);

const LinkSchema = z.object({
  label: z.string(),
  url: z.string(),
});

export const NodeSchema = z
  .object({
    id: z.string(),
    type: NodeType.default("node"),
    kind: NodeKind.optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    parentId: z.string().nullable().default(null),
    region: RegionId,
    /** Optional sub-grouping within a region (e.g. "Languages"). */
    cluster: z.string().optional(),
    /** Hierarchy level — the primary weighting (Phase 2 §3). */
    tier: TierSchema.optional(),
    /** 0..1 weight; auto-derived from `tier` when tier is set. */
    importance: z.number().min(0).max(1).default(0.5),
    tags: z.array(z.string()).default([]),
    /** Explicit, curated edges (node ids). */
    connections: z.array(z.string()).default([]),
    status: StatusSchema.optional(),
    links: z.array(LinkSchema).default([]),
    /** Body shown in the Information terminal (plain text / light markdown). */
    content: z.string().default(""),
    /** Powers the 2D fallback routes, search and crawlers. Auto-filled. */
    fallback: z
      .object({
        summary: z.string(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
      })
      .optional(),
  })
  // Keep authoring terse: derive importance from tier, and a fallback summary
  // from content/title when omitted.
  .transform((n) => ({
    ...n,
    importance: n.tier ? TIER_IMPORTANCE[n.tier] : n.importance,
    fallback: n.fallback ?? { summary: n.content || n.title },
  }));

export type MindNode = z.infer<typeof NodeSchema>;

/** A precomputed relationship edge (Blueprint §6). */
export interface Edge {
  a: string;
  b: string;
  weight: number;
}

/** Region descriptor — spatial + theming metadata. */
export interface RegionMeta {
  id: RegionId;
  name: string;
  color: string;
  blurb: string;
  /** Short cognitive-geography label, e.g. "Skills · Tech Stack". */
  domain: string;
  /** Macro hemisphere grouping (Blueprint §4 duality). */
  hemisphere: "left" | "right" | "central";
  /** World-space center of the region (Blueprint §3 coordinate model). */
  center: [number, number, number];
  /** Approximate region radius in world units, for layout + framing. */
  radius: number;
}

/** Lightweight document shape for the client search index (Blueprint §8). */
export interface SearchDoc {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
  region: RegionId;
  tags: string;
  summary: string;
}
