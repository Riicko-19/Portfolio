"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { getEdges } from "@/content";
import { useMind } from "@/state/store";

/**
 * Synaptic relationships (Blueprint §6; Issue 5). Reads node world-positions
 * from the store (so Core↔node edges render too). Gently CURVED pathways with
 * per-edge intensity: hovering/selecting a node ILLUMINATES its incident edges
 * and dims the rest (focus + context). Per-vertex colour, no shader.
 */
const SEG = 10;
const brainCenter = new THREE.Vector3(0, -2, 0);
const A = new THREE.Vector3();
const B = new THREE.Vector3();
const C = new THREE.Vector3();
const L1 = new THREE.Vector3();
const L2 = new THREE.Vector3();
const tmpCol = new THREE.Color();
const baseCol = new THREE.Color("#3fd0c9");
const hotCol = new THREE.Color("#9be8ff");

interface EdgeMeta {
  start: number;
  count: number;
  a: string;
  b: string;
}

export default function Synapses() {
  const nodePositions = useMind((s) => s.nodePositions);

  const built = useMemo(() => {
    const edges = getEdges().filter(
      (e) => nodePositions[e.a] && nodePositions[e.b],
    );
    const posArr: number[] = [];
    const meta: EdgeMeta[] = [];
    let vert = 0;
    for (const e of edges) {
      A.set(...nodePositions[e.a]);
      B.set(...nodePositions[e.b]);
      C.copy(A).add(B).multiplyScalar(0.5);
      C.addScaledVector(
        C.clone().sub(brainCenter).normalize(),
        A.distanceTo(B) * 0.18,
      ); // lift control point outward → gentle arc
      const start = vert;
      let px = 0,
        py = 0,
        pz = 0,
        has = false;
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        L1.copy(A).lerp(C, t);
        L2.copy(C).lerp(B, t);
        L1.lerp(L2, t); // quadratic bezier point
        if (has) {
          posArr.push(px, py, pz, L1.x, L1.y, L1.z);
          vert += 2;
        }
        px = L1.x;
        py = L1.y;
        pz = L1.z;
        has = true;
      }
      meta.push({ start, count: vert - start, a: e.a, b: e.b });
    }
    return { positions: new Float32Array(posArr), meta };
  }, [nodePositions]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(built.positions, 3),
    );
    g.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(new Float32Array(built.positions.length), 3),
    );
    return g;
  }, [built]);

  const intensity = useRef<number[]>([]);
  useEffect(() => {
    intensity.current = built.meta.map(() => 0);
  }, [built]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    const colAttr = geometry.getAttribute("color") as THREE.BufferAttribute;
    if (!colAttr) return;
    const { hoveredNodeId, selectedNodeId } = useMind.getState();
    const active = selectedNodeId ?? hoveredNodeId;
    const k = Math.min(1, dt * 8);
    built.meta.forEach((em, idx) => {
      const incident = active ? em.a === active || em.b === active : false;
      const target = active ? (incident ? 1 : 0.1) : 0.32;
      const cur =
        (intensity.current[idx] ?? 0) +
        (target - (intensity.current[idx] ?? 0)) * k;
      intensity.current[idx] = cur;
      tmpCol
        .copy(baseCol)
        .lerp(hotCol, incident ? 0.7 : 0)
        .multiplyScalar(cur);
      for (let v = em.start; v < em.start + em.count; v++) {
        colAttr.setXYZ(v, tmpCol.r, tmpCol.g, tmpCol.b);
      }
    });
    colAttr.needsUpdate = true;
  });

  if (built.positions.length === 0) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}
