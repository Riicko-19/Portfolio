"use client";

import { useEffect, useMemo } from "react";
import NodeField from "@/nodes/NodeField";
import { getRegionNodes } from "@/content";
import { layoutRegion } from "@/region/layout";
import { useMind } from "@/state/store";

/**
 * Generic region node renderer (Phase 2 — Full World). Lays out a region's
 * nodes, registers their world-positions for the Camera Director + Synapses,
 * and renders them as one InstancedMesh. The Core anchor node is excluded
 * (CoreAnchor renders it); its subsystems still render here.
 */
export default function RegionNodes({ regionId }: { regionId: string }) {
  const nodes = useMemo(
    () => getRegionNodes(regionId).filter((n) => n.type !== "core"),
    [regionId],
  );
  const positions = useMemo(
    () => layoutRegion(regionId, nodes.map((n) => n.id)),
    [regionId, nodes],
  );
  const registerPositions = useMind((s) => s.registerPositions);

  useEffect(() => {
    registerPositions(positions);
  }, [positions, registerPositions]);

  if (nodes.length === 0) return null;
  return <NodeField nodes={nodes} positions={positions} />;
}
