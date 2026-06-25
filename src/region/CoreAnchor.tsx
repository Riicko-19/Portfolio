"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { REGIONS, getNode } from "@/content";
import { useMind } from "@/state/store";

/**
 * Chanakya Core — the Artificial Neural Sun (Blueprint §4/§11; Phase 2.5).
 * The source of cognition: a pulsing gold nucleus wrapped in differentially-
 * rotating engineered shells, a corona, and pulse rings that are emitted
 * outward on a heartbeat — incoming/outgoing neural traffic made visible. Gold
 * is the world's ONE warm light. NOT the Core interior (out of scope).
 */
const RINGS = 3;

export default function CoreAnchor() {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const shellA = useRef<THREE.Mesh>(null);
  const shellB = useRef<THREE.Mesh>(null);
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);
  const center = REGIONS.core.center;
  const registerPositions = useMind((s) => s.registerPositions);
  const select = useMind((s) => s.select);
  const setHovered = useMind((s) => s.setHovered);

  // Pre-create reusable material refs for the emitted pulse rings.
  const ringMats = useMemo(
    () =>
      Array.from(
        { length: RINGS },
        () =>
          new THREE.MeshBasicMaterial({
            color: "#ffd49a",
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
            side: THREE.DoubleSide,
          }),
      ),
    [],
  );

  useEffect(() => {
    registerPositions({ chanakya: center });
  }, [registerPositions, center]);

  useEffect(() => () => ringMats.forEach((m) => m.dispose()), [ringMats]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 1.4) * 0.1;
    const sel = useMind.getState().selectedNodeId === "chanakya";
    if (meshRef.current)
      meshRef.current.scale.setScalar(1.6 * pulse * (sel ? 1.25 : 1));
    if (haloRef.current)
      haloRef.current.scale.setScalar(4.6 + Math.sin(t * 1.4) * 0.6);

    // Differentially-rotating engineered shells.
    if (shellA.current) {
      shellA.current.rotation.y = t * 0.25;
      shellA.current.rotation.x = t * 0.12;
    }
    if (shellB.current) {
      shellB.current.rotation.y = -t * 0.17;
      shellB.current.rotation.z = t * 0.21;
    }

    // Emitted pulse rings: each ring expands and fades on a staggered cycle.
    const PERIOD = 3.2;
    for (let i = 0; i < RINGS; i++) {
      const local = ((t + (i * PERIOD) / RINGS) % PERIOD) / PERIOD; // 0..1
      const m = pulseRefs.current[i];
      if (!m) continue;
      const s = 2 + local * 11;
      m.scale.setScalar(s);
      m.lookAt(state.camera.position);
      ringMats[i].opacity = (1 - local) * 0.5 * (1 - local);
    }
  });

  const title = getNode("chanakya")?.title ?? "Chanakya Core";

  return (
    <group position={center}>
      {/* Corona halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ffc76b"
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Engineered energy shells (differential rotation) */}
      <mesh ref={shellA} scale={2.6}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#ffcf8a"
          wireframe
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={shellB} scale={3.4}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#ffe6b0"
          wireframe
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Emitted pulse rings (outgoing neural traffic) */}
      {ringMats.map((mat, i) => (
        <mesh
          key={i}
          ref={(el) => {
            pulseRefs.current[i] = el;
          }}
          material={mat}
        >
          <ringGeometry args={[0.9, 1, 48]} />
        </mesh>
      ))}

      {/* The nucleus */}
      <mesh
        ref={meshRef}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered("chanakya");
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = "auto";
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          select("chanakya");
        }}
      >
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#ffe6b0" toneMapped={false} />
      </mesh>

      <Html
        position={[0, -3.4, 0]}
        center
        distanceFactor={52}
        zIndexRange={[14, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="core-label">{title}</div>
      </Html>
    </group>
  );
}
