"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useMind } from "@/state/store";

/**
 * Neural Swarm (Phase 2.5) — a field of ambient consciousness particles that
 * drift slowly through the brain volume and are magnetically pulled toward the
 * ACTIVE node (hover/select), accumulating into a glowing volumetric cloud that
 * supports the label — the "gravitational sink". Particles warm from deep teal
 * to gold as they concentrate (chrominance via activity). CPU-updated Points,
 * capped + a single draw call (§15 budget).
 */
const COUNT = 700;
const teal = new THREE.Color("#1d6f7a");
const gold = new THREE.Color("#ffcf8a");
const tmp = new THREE.Vector3();
const tmpC = new THREE.Color();

function makeSprite(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(170,220,255,0.5)");
  g.addColorStop(1, "rgba(170,220,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

export default function NeuralSwarm() {
  const ptsRef = useRef<THREE.Points>(null);
  const sprite = useMemo(
    () => (typeof document !== "undefined" ? makeSprite() : null),
    [],
  );

  // Per-particle: ambient "home" position, current position, drift phase, and
  // how strongly it responds to the gravity sink.
  const data = useMemo(() => {
    const homes = new Float32Array(COUNT * 3);
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const pull = new Float32Array(COUNT);
    const phase = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = 8 + Math.random() * 22;
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(1 - u * u);
      const x = rr * Math.cos(th) * r;
      const y = u * r * 0.72 - 2;
      const z = rr * Math.sin(th) * r;
      homes[i * 3] = positions[i * 3] = x;
      homes[i * 3 + 1] = positions[i * 3 + 1] = y;
      homes[i * 3 + 2] = positions[i * 3 + 2] = z;
      colors[i * 3] = teal.r;
      colors[i * 3 + 1] = teal.g;
      colors[i * 3 + 2] = teal.b;
      pull[i] = 0.4 + Math.random() * 0.6;
      phase[i] = Math.random() * 6.2831;
    }
    return { homes, positions, colors, pull, phase };
  }, []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    return g;
  }, [data]);

  useEffect(
    () => () => {
      geometry.dispose();
      sprite?.dispose();
    },
    [geometry, sprite],
  );

  useFrame((state, dt) => {
    const pts = ptsRef.current;
    if (!pts) return;
    const { hoveredNodeId, selectedNodeId, nodePositions } = useMind.getState();
    const activeId = selectedNodeId ?? hoveredNodeId;
    const ap = activeId ? nodePositions[activeId] : null;
    const t = state.clock.elapsedTime;
    const k = Math.min(1, dt * 2.2);
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geometry.getAttribute("color") as THREE.BufferAttribute;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      // Ambient home with a slow organic drift.
      const ph = data.phase[i];
      const hx = data.homes[ix] + Math.sin(t * 0.3 + ph) * 0.6;
      const hy = data.homes[ix + 1] + Math.cos(t * 0.26 + ph) * 0.6;
      const hz = data.homes[ix + 2] + Math.sin(t * 0.22 + ph * 1.3) * 0.6;

      let tx = hx,
        ty = hy,
        tz = hz,
        warm = 0;
      if (ap) {
        tmp.set(ap[0], ap[1], ap[2]);
        const px = data.positions[ix],
          py = data.positions[ix + 1],
          pz = data.positions[ix + 2];
        const d = Math.hypot(tmp.x - px, tmp.y - py, tmp.z - pz);
        // Only particles within reach are recruited into the sink; nearer ones
        // are pulled harder and form a tighter, brighter accretion cloud.
        const reach = THREE.MathUtils.clamp(1 - d / 16, 0, 1);
        const w = reach * reach * data.pull[i];
        if (w > 0.01) {
          // Swirl around the node so it reads as orbiting energy, not collapse.
          const ang = t * 1.6 + ph;
          const orbit = 1.6 + (1 - reach) * 2;
          tx = tmp.x + Math.cos(ang) * orbit;
          ty = tmp.y + Math.sin(ang * 0.8) * orbit * 0.6;
          tz = tmp.z + Math.sin(ang) * orbit;
          tx = THREE.MathUtils.lerp(hx, tx, w);
          ty = THREE.MathUtils.lerp(hy, ty, w);
          tz = THREE.MathUtils.lerp(hz, tz, w);
          warm = w;
        }
      }

      data.positions[ix] += (tx - data.positions[ix]) * k;
      data.positions[ix + 1] += (ty - data.positions[ix + 1]) * k;
      data.positions[ix + 2] += (tz - data.positions[ix + 2]) * k;
      posAttr.setXYZ(
        i,
        data.positions[ix],
        data.positions[ix + 1],
        data.positions[ix + 2],
      );

      tmpC.copy(teal).lerp(gold, warm).multiplyScalar(0.5 + warm * 1.6);
      colAttr.setXYZ(i, tmpC.r, tmpC.g, tmpC.b);
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  if (!sprite) return null;

  return (
    <points ref={ptsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={sprite}
        size={0.5}
        sizeAttenuation
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        toneMapped={false}
      />
    </points>
  );
}
