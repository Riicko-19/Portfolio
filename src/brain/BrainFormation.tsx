"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { generateBrainPoints, buildNeuralWeb } from "./brainPoints";
import { formationVertex, formationFragment } from "./formationShader";
import { useMind } from "@/state/store";
import { regionIndex } from "@/content";
import type { RegionId } from "@/content";

/**
 * The brain's physical body + staged formation (Blueprint §6/§12; Issue 7).
 * Stages, driven by uProgress: scattered Particles → settling Neural Points →
 * Synaptic Network (web fades in) → Outline → Colored Brain. On completion it
 * flips the global phase to "ready".
 */
const FORMATION_SECONDS = 4.2;

export default function BrainFormation() {
  const data = useMemo(() => generateBrainPoints(), []);
  const web = useMemo(() => buildNeuralWeb(data.targets), [data]);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const webRef = useRef<THREE.LineBasicMaterial>(null);
  const progress = useRef(0);
  const setPhase = useMind((s) => s.setPhase);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.targets, 3));
    g.setAttribute("aStart", new THREE.BufferAttribute(data.starts, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.seeds, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(data.colors, 3));
    g.setAttribute("aRegion", new THREE.BufferAttribute(data.regions, 1));
    return g;
  }, [data]);

  const webGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(web, 3));
    return g;
  }, [web]);

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
      uOpacity: { value: 0.62 },
      uHoverRegion: { value: -1 },
    }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      webGeometry.dispose();
    },
    [geometry, webGeometry],
  );

  useFrame((_, dt) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value += dt;

    const { phase, hoveredRegionId } = useMind.getState();
    if (phase === "forming") {
      progress.current = Math.min(1, progress.current + dt / FORMATION_SECONDS);
      m.uniforms.uProgress.value = progress.current;
      if (progress.current >= 1) setPhase("ready");
    } else if (phase === "ready") {
      m.uniforms.uProgress.value = 1;
    } else {
      m.uniforms.uProgress.value = 0;
    }

    // Region hover highlight.
    m.uniforms.uHoverRegion.value = hoveredRegionId
      ? regionIndex(hoveredRegionId as RegionId)
      : -1;

    // Neural-web stage: fade in mid-formation, settle to a faint web.
    if (webRef.current) {
      const p = m.uniforms.uProgress.value;
      const fadeIn = THREE.MathUtils.smoothstep(p, 0.4, 0.62);
      const settle = THREE.MathUtils.smoothstep(p, 0.78, 1.0);
      webRef.current.opacity = fadeIn * (0.22 - settle * 0.16);
    }
  });

  return (
    <group>
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
      <lineSegments geometry={webGeometry} frustumCulled={false}>
        <lineBasicMaterial
          ref={webRef}
          color="#5ea8ff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}
