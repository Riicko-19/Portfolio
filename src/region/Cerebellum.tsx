"use client";

import { useEffect, useMemo } from "react";
import { Html } from "@react-three/drei";
import NodeField from "@/nodes/NodeField";
import Synapses from "@/nodes/Synapses";
import { getRegionNodes, getEdges, REGIONS } from "@/content";
import { layoutCerebellum } from "@/region/layout";
import { useMind } from "@/state/store";

/**
 * The Cerebellum — the one fully-built region for the Phase 1 slice
 * (Blueprint §4: Skills, Tech Stack & Tools). Owns layout, registers node
 * world-positions for the Camera Director, and renders the node field +
 * synapses + region label.
 */
export default function Cerebellum() {
  const nodes = useMemo(() => getRegionNodes("cerebellum"), []);
  const positions = useMemo(
    () => layoutCerebellum(nodes.map((n) => n.id)),
    [nodes],
  );
  const edges = useMemo(
    () => getEdges().filter((e) => positions[e.a] && positions[e.b]),
    [positions],
  );
  const registerPositions = useMind((s) => s.registerPositions);

  useEffect(() => {
    registerPositions(positions);
  }, [positions, registerPositions]);

  const c = REGIONS.cerebellum.center;

  return (
    <group>
      <NodeField nodes={nodes} positions={positions} />
      <Synapses edges={edges} positions={positions} />
      <Html
        position={[c[0], c[1] - 6, c[2]]}
        center
        distanceFactor={48}
        style={{ pointerEvents: "none" }}
        zIndexRange={[10, 0]}
      >
        <div className="region-label">CEREBELLUM</div>
      </Html>
    </group>
  );
}
