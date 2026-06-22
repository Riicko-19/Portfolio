"use client";

import * as THREE from "three";
import { useEffect, useMemo } from "react";
import type { Edge } from "@/content";
import type { Vec3 } from "@/state/store";

/**
 * Static synapse lines (Blueprint §6). Phase 1 renders the precomputed graph
 * as a single dim LineSegments draw — NO signal-flow/animation/traversal
 * (those are Phase 2 Neural Network Design, intentionally out of scope here).
 */
export default function Synapses({
  edges,
  positions,
}: {
  edges: Edge[];
  positions: Record<string, Vec3>;
}) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (const e of edges) {
      const a = positions[e.a];
      const b = positions[e.b];
      if (!a || !b) continue;
      pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [edges, positions]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#3fd0c9"
        transparent
        opacity={0.13}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
}
