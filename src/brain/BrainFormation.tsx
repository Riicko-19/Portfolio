"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { generateBrainPoints } from "./brainPoints";
import { formationVertex, formationFragment } from "./formationShader";
import { useMind } from "@/state/store";

/**
 * The brain's physical body (Blueprint §6/§12). Stays mounted after formation
 * as the persistent ambient structure. Drives the boot→ready handoff: when
 * the assembly completes it flips the global phase to "ready".
 */
const FORMATION_SECONDS = 3.0;

export default function BrainFormation() {
  const data = useMemo(() => generateBrainPoints(), []);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const progress = useRef(0);
  const setPhase = useMind((s) => s.setPhase);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.targets, 3));
    g.setAttribute("aStart", new THREE.BufferAttribute(data.starts, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.seeds, 1));
    return g;
  }, [data]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 7 },
      uPixelRatio: {
        value: Math.min(
          typeof window !== "undefined" ? window.devicePixelRatio : 1,
          2,
        ),
      },
      uColorA: { value: new THREE.Color("#3fd0c9") },
      uColorB: { value: new THREE.Color("#5ea8ff") },
      uOpacity: { value: 0.62 },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value += dt;

    const phase = useMind.getState().phase;
    if (phase === "forming") {
      progress.current = Math.min(1, progress.current + dt / FORMATION_SECONDS);
      m.uniforms.uProgress.value = progress.current;
      if (progress.current >= 1) setPhase("ready");
    } else if (phase === "ready") {
      m.uniforms.uProgress.value = 1;
    } else {
      m.uniforms.uProgress.value = 0;
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={formationVertex}
        fragmentShader={formationFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
