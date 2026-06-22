"use client";

import { useEffect, useMemo } from "react";
import NodeField from "@/nodes/NodeField";
import { getRegionNodes } from "@/content";
import { layoutCerebellum } from "@/region/layout";
import { useMind } from "@/state/store";

/**
 * The Cerebellum — the one fully-built region for Phase 1 (Blueprint §4:
 * Skills, Tech Stack & Tools). Owns node layout and registers world-positions
 * for the Camera Director + Synapse system. Its label + synapses are now
 * provided by the Scene-level RegionSystem and Synapses.
 */
export default function Cerebellum() {
  const nodes = useMemo(() => getRegionNodes("cerebellum"), []);
  const positions = useMemo(
    () => layoutCerebellum(nodes.map((n) => n.id)),
    [nodes],
  );
  const registerPositions = useMind((s) => s.registerPositions);

  useEffect(() => {
    registerPositions(positions);
  }, [positions, registerPositions]);

  return <NodeField nodes={nodes} positions={positions} />;
}
