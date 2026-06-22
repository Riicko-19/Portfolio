import { NodeSchema, type Edge, type MindNode, type SearchDoc } from "./schema";
import { cerebellumRaw } from "./nodes.cerebellum";
import { coreRaw } from "./nodes.core";
import {
  REGION_LIST,
  REGION_ORDER,
  REGIONS,
  getRegion,
  regionIndex,
} from "./regions";

/**
 * Content API (Blueprint §16 `src/content`) — the ONLY module that reads raw
 * content. Everything else (3D world + 2D fallback) goes through these typed
 * accessors. Validation runs once at module load.
 */

// --- validate (Blueprint §5: Zod at load) -----------------------------------
const ALL_NODES: MindNode[] = NodeSchema.array().parse([
  ...cerebellumRaw,
  ...coreRaw,
]);

const NODE_BY_ID = new Map<string, MindNode>(ALL_NODES.map((n) => [n.id, n]));

// --- graph (Blueprint §6: precomputed, thresholded, undirected) -------------
function buildEdges(nodes: MindNode[]): Edge[] {
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const node of nodes) {
    for (const targetId of node.connections) {
      const target = NODE_BY_ID.get(targetId);
      if (!target) continue; // drop dangling edges
      const key = [node.id, targetId].sort().join("::");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        a: node.id,
        b: targetId,
        weight: (node.importance + target.importance) / 2,
      });
    }
  }
  return edges;
}

const ALL_EDGES: Edge[] = buildEdges(ALL_NODES);

// --- connection count per node (drives node hierarchy, Blueprint §4) --------
const DEGREE = new Map<string, number>();
for (const e of ALL_EDGES) {
  DEGREE.set(e.a, (DEGREE.get(e.a) ?? 0) + 1);
  DEGREE.set(e.b, (DEGREE.get(e.b) ?? 0) + 1);
}

export function getDegree(id: string): number {
  return DEGREE.get(id) ?? 0;
}

// --- search docs (Blueprint §8: client index source) ------------------------
const SEARCH_DOCS: SearchDoc[] = ALL_NODES.map((n) => ({
  id: n.id,
  title: n.title,
  subtitle: n.subtitle ?? "",
  kind: n.kind ?? "node",
  region: n.region,
  tags: n.tags.join(" "),
  summary: n.fallback.summary,
}));

// --- public accessors -------------------------------------------------------
export function getAllNodes(): MindNode[] {
  return ALL_NODES;
}

export function getNode(id: string): MindNode | undefined {
  return NODE_BY_ID.get(id);
}

export function getRegionNodes(regionId: string): MindNode[] {
  return ALL_NODES.filter((n) => n.region === regionId);
}

export function getEdges(): Edge[] {
  return ALL_EDGES;
}

/** Edges incident to a node — used to highlight a node's neighbourhood. */
export function getNeighbourIds(id: string): string[] {
  return ALL_EDGES.filter((e) => e.a === id || e.b === id).map((e) =>
    e.a === id ? e.b : e.a,
  );
}

export function getSearchDocs(): SearchDoc[] {
  return SEARCH_DOCS;
}

/** Regions that actually carry content (used by the world + the 2D index). */
export function getPopulatedRegions() {
  const ids = new Set(ALL_NODES.map((n) => n.region));
  return REGION_LIST.filter((r) => ids.has(r.id));
}

export { REGIONS, REGION_LIST, REGION_ORDER, getRegion, regionIndex };
export type { MindNode, Edge, SearchDoc };
export type { RegionId, RegionMeta } from "./schema";
