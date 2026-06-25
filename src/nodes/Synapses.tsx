"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { getEdges, getNode } from "@/content";
import { useMind } from "@/state/store";

/**
 * Synaptic relationships + AMBIENT CONSCIOUSNESS (Blueprint §6; Phase 2.5).
 * The network is never dormant: every fibre carries continuously-firing signal
 * packets with per-edge variable speed/frequency, REGION PERSONALITY (research
 * & core hyper-active, temporal slow & reflective, frontal regular/deliberate),
 * and periodic core-broadcast ripples that spread outward like a thought. On
 * top of that, hovering/selecting a node fully illuminates its incident edges.
 * All per-vertex colour on one merged line geometry — one draw call, no shader.
 */
const SEG = 12;
const brainCenter = new THREE.Vector3(0, -2, 0);
const A = new THREE.Vector3();
const B = new THREE.Vector3();
const C = new THREE.Vector3();
const L1 = new THREE.Vector3();
const L2 = new THREE.Vector3();
const tmpCol = new THREE.Color();
const baseCol = new THREE.Color("#2f9fb0"); // resting fibre (cool teal)
const hotCol = new THREE.Color("#a6ecff"); // firing signal (bright cyan-white)
const warmCol = new THREE.Color("#ffd49a"); // core-broadcast front (the one warm)

// Region personality → firing rate & cadence (Phase 2.5 "Region Personality").
const REGION_RATE: Record<string, number> = {
  core: 2.1,
  research: 1.8,
  projects: 1.45,
  occipital: 1.2,
  parietal: 1.1,
  frontal: 1.0,
  cerebellum: 1.0,
  stem: 0.85,
  temporal: 0.6, // reflective, slower pulses
};

interface EdgeMeta {
  start: number;
  count: number;
  a: string;
  b: string;
  speed: number; // packet traversal speed
  freq: number; // gating oscillator → variable firing frequency
  phase: number; // desync between edges
  regular: boolean; // frontal = deliberate, evenly-paced
  dist: number; // mid-point distance from core (for broadcast ripple)
}

// Cheap deterministic pseudo-random so the firing pattern is stable per build.
function hash(i: number): number {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
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
    edges.forEach((e, ei) => {
      A.set(...nodePositions[e.a]);
      B.set(...nodePositions[e.b]);
      C.copy(A).add(B).multiplyScalar(0.5);
      const outwardLen = A.distanceTo(B) * 0.18;
      C.addScaledVector(C.clone().sub(brainCenter).normalize(), outwardLen);
      // Organic irregularity (Phase 2.5): wobble the control point off-axis so
      // fibres branch and bend like dendrites rather than reading as graph arcs.
      const wob = (hash(ei) - 0.5) * outwardLen * 1.6;
      C.x += wob;
      C.z += (hash(ei + 7) - 0.5) * outwardLen * 1.6;
      C.y += (hash(ei + 19) - 0.5) * outwardLen * 1.2;

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
      const ra = REGION_RATE[getNode(e.a)?.region ?? ""] ?? 1;
      const rb = REGION_RATE[getNode(e.b)?.region ?? ""] ?? 1;
      const rate = (ra + rb) * 0.5;
      const regular =
        getNode(e.a)?.region === "frontal" || getNode(e.b)?.region === "frontal";
      C.copy(A).add(B).multiplyScalar(0.5);
      meta.push({
        start,
        count: vert - start,
        a: e.a,
        b: e.b,
        speed: (0.28 + hash(ei + 3) * 0.4) * (0.7 + rate * 0.35),
        freq: (0.18 + hash(ei + 11) * 0.4) * rate,
        phase: hash(ei + 5) * 6.2831,
        regular,
        dist: C.distanceTo(brainCenter),
      });
    });
    let maxDist = 1;
    for (const m of meta) maxDist = Math.max(maxDist, m.dist);
    return { positions: new Float32Array(posArr), meta, maxDist };
  }, [nodePositions]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(built.positions, 3),
    );
    g.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(
        new Float32Array(built.positions.length),
        3,
      ),
    );
    return g;
  }, [built]);

  const intensity = useRef<number[]>([]);
  useEffect(() => {
    intensity.current = built.meta.map(() => 0);
  }, [built]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, dt) => {
    const colAttr = geometry.getAttribute("color") as THREE.BufferAttribute;
    if (!colAttr) return;
    const { hoveredNodeId, selectedNodeId } = useMind.getState();
    const active = selectedNodeId ?? hoveredNodeId;
    const t = state.clock.elapsedTime;
    const k = Math.min(1, dt * 8);

    // Core broadcast: a thought ripples outward from the Core every ~7.5s.
    const SURGE = 7.5;
    const front = ((t % SURGE) / SURGE) * (built.maxDist + 6);

    built.meta.forEach((em, idx) => {
      const incident = active ? em.a === active || em.b === active : false;
      // Idle firing gate (variable frequency): frontal edges fire on a steady
      // cadence; everywhere else the gate breathes irregularly.
      const osc = em.regular
        ? 0.5 + 0.5 * Math.sin(t * em.freq * 2.0 + em.phase)
        : Math.sin(t * em.freq + em.phase) *
          Math.sin(t * em.freq * 0.37 + em.phase * 1.7);
      const gate = THREE.MathUtils.clamp(osc, 0, 1);
      const ambient = 0.12 + gate * 0.32;
      const target = active ? (incident ? 1 : 0.07) : ambient;
      const cur =
        (intensity.current[idx] ?? 0) +
        (target - (intensity.current[idx] ?? 0)) * k;
      intensity.current[idx] = cur;

      // Traveling signal packet position along the fibre (0..1).
      const flow = (t * em.speed + em.phase) % 1;
      // Core-broadcast ripple brightness at this edge's distance.
      let d = Math.abs(em.dist - front);
      d = Math.min(d, built.maxDist + 6 - d);
      const ripple = Math.exp(-d * d * 0.06);

      const lit = incident && active;
      for (let j = 0; j < em.count; j++) {
        const u = j / em.count;
        let pd = Math.abs(u - flow);
        pd = Math.min(pd, 1 - pd);
        const pulse = Math.exp(-pd * pd * (lit ? 55 : 90));
        const mix = lit ? 0.7 : 0.45 + gate * 0.25;
        tmpCol.copy(baseCol).lerp(hotCol, mix);
        // The broadcast front warms slightly toward gold as it passes.
        if (ripple > 0.01 && !lit) tmpCol.lerp(warmCol, ripple * 0.55);
        const power =
          cur * (0.45 + pulse * (lit ? 1.7 : 1.25)) + ripple * 0.9 * cur;
        tmpCol.multiplyScalar(power);
        colAttr.setXYZ(em.start + j, tmpCol.r, tmpCol.g, tmpCol.b);
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
