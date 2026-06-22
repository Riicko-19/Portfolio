"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Ambient neural dust (Blueprint §12; Issue 8). A large, sparse, slowly
 * drifting point field surrounding the brain — gives parallax, depth and a
 * sense of vast scale so the experience reads as a world, not an object.
 * Capped + tiny sprites to respect the fill-rate budget (§15).
 */
function makeSprite(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(150,190,255,0.55)");
  g.addColorStop(1, "rgba(150,190,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

export default function AmbientField({ count = 3000 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const sprite = useMemo(
    () => (typeof document !== "undefined" ? makeSprite() : null),
    [],
  );

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 42 + Math.pow(Math.random(), 0.6) * 95; // biased far for depth
      const u = Math.random() * 2 - 1;
      const t = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(1 - u * u);
      positions[i * 3] = rr * Math.cos(t) * r;
      positions[i * 3 + 1] = u * r * 0.7;
      positions[i * 3 + 2] = rr * Math.sin(t) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      sprite?.dispose();
    },
    [geometry, sprite],
  );

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.004;
  });

  if (!sprite) return null;

  return (
    <group ref={group}>
      <points geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          map={sprite}
          size={1.15}
          sizeAttenuation
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#86b2ff"
        />
      </points>
    </group>
  );
}
