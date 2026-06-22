"use client";

import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { MindNode } from "@/content";
import type { Vec3 } from "@/state/store";
import { useMind } from "@/state/store";

/**
 * Node System (Blueprint §5) — every node of the region in ONE InstancedMesh
 * (§15 instancing). Per-instance colour by kind, per-instance animated scale
 * for hover/select/breathing, pop-in on "ready". Raycast picks resolve to the
 * owning node id via the ordered id list.
 */
const dummy = new THREE.Object3D();
const AMBER = new THREE.Color("#e0a23c");
const SKILL = new THREE.Color("#ffd98a");

export default function NodeField({
  nodes,
  positions,
}: {
  nodes: MindNode[];
  positions: Record<string, Vec3>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const ids = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const baseSizes = useMemo(
    () => nodes.map((n) => 0.38 + n.importance * 0.5),
    [nodes],
  );
  const colors = useMemo(
    () =>
      nodes.map((n) => {
        const c = (n.kind === "skill" ? SKILL : AMBER).clone();
        return c.multiplyScalar(0.75 + n.importance * 0.45);
      }),
    [nodes],
  );
  const scales = useRef<number[]>(nodes.map(() => 0));

  const setHovered = useMind((s) => s.setHovered);
  const select = useMind((s) => s.select);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    ids.forEach((_, i) => mesh.setColorAt(i, colors[i]));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [ids, colors]);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { phase, hoveredNodeId, selectedNodeId } = useMind.getState();
    const ready = phase === "ready";
    const t = state.clock.elapsedTime;
    const k = Math.min(1, dt * 9);

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const p = positions[id];
      if (!p) continue;
      let target = ready ? baseSizes[i] : 0;
      if (ready && id === selectedNodeId) target = baseSizes[i] * 1.5;
      else if (ready && id === hoveredNodeId) target = baseSizes[i] * 1.28;
      scales.current[i] += (target - scales.current[i]) * k;
      const breathe = 1 + Math.sin(t * 0.9 + i * 1.7) * 0.04;
      dummy.position.set(p[0], p[1], p[2]);
      dummy.scale.setScalar(scales.current[i] * breathe);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
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
