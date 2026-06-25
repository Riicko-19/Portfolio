"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { getTier, REGIONS, type MindNode } from "@/content";
import type { Vec3 } from "@/state/store";
import { useMind } from "@/state/store";

/**
 * Node System (Blueprint §5) — every node of the region in ONE InstancedMesh
 * (§15 instancing). Per-instance colour by kind, per-instance animated scale
 * for hover/select/breathing, pop-in on "ready". Raycast picks resolve to the
 * owning node id via the ordered id list.
 */
const dummy = new THREE.Object3D();
const halo = new THREE.Object3D();
const tmpColor = new THREE.Color();
const WHITE = new THREE.Color("#ffffff");
// 4-tier hierarchy (Phase 2 §3): base radius + brightness lift toward white.
const TIER_SIZE: Record<string, number> = {
  legendary: 1.7,
  major: 1.06,
  standard: 0.72,
  minor: 0.5,
};
const TIER_BRIGHT: Record<string, number> = {
  legendary: 0.5,
  major: 0.28,
  standard: 0.16,
  minor: 0.08,
};
// Breathing amplitude per tier (Phase 2.5 "neuron behaviour"): legendary
// neurons pulse with substantially more activity than minor ones.
const TIER_AMP: Record<string, number> = {
  legendary: 0.3,
  major: 0.18,
  standard: 0.12,
  minor: 0.08,
};
// Region personality → idle pulse cadence (mirrors Synapses).
const REGION_PULSE: Record<string, number> = {
  core: 2.0,
  research: 1.7,
  projects: 1.4,
  occipital: 1.2,
  parietal: 1.05,
  frontal: 0.95,
  cerebellum: 1.0,
  stem: 0.8,
  temporal: 0.6,
};

export default function NodeField({
  nodes,
  positions,
}: {
  nodes: MindNode[];
  positions: Record<string, Vec3>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const ids = useMemo(() => nodes.map((n) => n.id), [nodes]);
  // Node hierarchy (Phase 2 §3): size by tier (legendary→minor).
  const baseSizes = useMemo(
    () => nodes.map((n) => TIER_SIZE[getTier(n)] ?? 0.7),
    [nodes],
  );
  const tiers = useMemo(() => nodes.map((n) => getTier(n)), [nodes]);
  // Region pulse cadence per node (Phase 2.5 region personality).
  const rates = useMemo(
    () => nodes.map((n) => REGION_PULSE[n.region] ?? 1),
    [nodes],
  );
  // Region colour, brightened toward white by tier.
  const colors = useMemo(
    () =>
      nodes.map((n) => {
        const c = new THREE.Color(REGIONS[n.region]?.color ?? "#3fd0c9");
        return c.lerp(WHITE, TIER_BRIGHT[getTier(n)] ?? 0.1);
      }),
    [nodes],
  );
  const scales = useRef<number[]>(nodes.map(() => 0));
  // Per-node firing envelope: spikes to 1 on select, decays back to rest.
  const fire = useRef<number[]>(nodes.map(() => 0));
  const lastSel = useRef<string | null>(null);

  const setHovered = useMind((s) => s.setHovered);
  const select = useMind((s) => s.select);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    const halos = haloRef.current;
    if (!mesh) return;
    const { phase, hoveredNodeId, selectedNodeId, discovered } =
      useMind.getState();
    const ready = phase === "ready";
    const t = state.clock.elapsedTime;
    const k = Math.min(1, dt * 9);

    // Detect a fresh selection → trigger the firing discharge.
    if (selectedNodeId !== lastSel.current) {
      const i = ids.indexOf(selectedNodeId ?? "");
      if (i >= 0) fire.current[i] = 1;
      lastSel.current = selectedNodeId;
    }

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const p = positions[id];
      if (!p) continue;
      const amp = TIER_AMP[tiers[i]] ?? 0.12;
      const seen = discovered[id];

      // Scale: pop-in, hover/select lift, undiscovered shimmer.
      let target = ready ? baseSizes[i] : 0;
      if (ready && id === selectedNodeId) target = baseSizes[i] * 1.5;
      else if (ready && id === hoveredNodeId) target = baseSizes[i] * 1.28;
      else if (ready && !seen)
        target = baseSizes[i] * (0.6 + Math.sin(t * 1.6 + i * 2.1) * 0.07);
      scales.current[i] += (target - scales.current[i]) * k;

      // Neuron breathing: emissive glow oscillation paced by region.
      const f = (fire.current[i] = Math.max(0, fire.current[i] - dt * 1.6));
      const breathePulse = 1 + Math.sin(t * rates[i] + i * 1.7) * amp;
      const breatheScale = 1 + Math.sin(t * rates[i] * 0.9 + i * 1.7) * 0.04;

      dummy.position.set(p[0], p[1], p[2]);
      dummy.scale.setScalar(scales.current[i] * breatheScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Colour brightness: discovery + breathing + hover/fire discharge.
      let bright = (seen ? 1 : 0.4) * breathePulse;
      if (id === selectedNodeId) bright += 0.45;
      else if (id === hoveredNodeId) bright += 0.2;
      bright += f * f * 1.6; // firing flash
      tmpColor.copy(colors[i]).multiplyScalar(bright);
      mesh.setColorAt(i, tmpColor);

      // Additive glow halo: soft energy field around each neuron.
      if (halos) {
        const glow =
          (seen ? 1 : 0.45) *
          (0.7 + Math.sin(t * rates[i] + i * 1.7) * 0.3 + f * 1.4);
        halo.position.set(p[0], p[1], p[2]);
        halo.scale.setScalar(scales.current[i] * (2.4 + amp * 2) * breatheScale);
        halo.updateMatrix();
        halos.setMatrixAt(i, halo.matrix);
        tmpColor.copy(colors[i]).multiplyScalar(glow);
        halos.setColorAt(i, tmpColor);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (halos) {
      halos.instanceMatrix.needsUpdate = true;
      if (halos.instanceColor) halos.instanceColor.needsUpdate = true;
    }
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId == null) return;
    setHovered(ids[e.instanceId]);
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    setHovered(null);
    document.body.style.cursor = "auto";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId != null) select(ids[e.instanceId]);
  };

  const hovered = useMind((s) => s.hoveredNodeId);
  const selected = useMind((s) => s.selectedNodeId);
  const labelIds = useMemo(
    () => [hovered, selected].filter((v, i, a) => v && a.indexOf(v) === i),
    [hovered, selected],
  );

  return (
    <>
      {/* Soft additive energy halo around every neuron (one draw call). */}
      <instancedMesh
        ref={haloRef}
        args={[undefined, undefined, nodes.length]}
        raycast={() => null}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, nodes.length]}
        onPointerMove={onMove}
        onPointerOut={onOut}
        onClick={onClick}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {labelIds.map((id) => {
        if (!id || !positions[id]) return null;
        const node = nodes.find((n) => n.id === id);
        return (
          <Html
            key={id}
            position={positions[id]}
            center
            distanceFactor={24}
            style={{ pointerEvents: "none" }}
            zIndexRange={[20, 0]}
          >
            <div className={`node-label ${id === selected ? "is-selected" : ""}`}>
              {node?.title}
            </div>
          </Html>
        );
      })}
    </>
  );
}
