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
]);
export type RegionId = z.infer<typeof RegionId>;

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

export const NodeSchema = z.object({
  id: z.string(),
  type: NodeType.default("node"),
  kind: NodeKind.optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  parentId: z.string().nullable().default(null),
  region: RegionId,
  /** Drives node size, LOD priority, and visual weight. 0..1 */
  importance: z.number().min(0).max(1).default(0.5),
  tags: z.array(z.string()).default([]),
  /** Explicit, curated edges (node ids). */
  connections: z.array(z.string()).default([]),
  status: StatusSchema.optional(),
  links: z.array(LinkSchema).default([]),
  /** Body shown in the Information terminal (plain text / light markdown). */
  content: z.string().default(""),
  /** Powers the 2D fallback routes, search and crawlers. */
  fallback: z.object({
    summary: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

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
