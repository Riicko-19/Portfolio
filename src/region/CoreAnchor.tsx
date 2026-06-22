"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { REGIONS, getNode } from "@/content";
import { useMind } from "@/state/store";

/**
 * Chanakya Core anchor (Blueprint §4/§11; Issue 4 — "extremely dominant").
 * The brightest object: a pulsing gold nucleus + additive halo at the brain's
 * centre. The world's north-star, focusable and the /brain/chanakya target.
 * NOT the Core interior (out of scope).
 */
export default function CoreAnchor() {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const center = REGIONS.core.center;
  const registerPositions = useMind((s) => s.registerPositions);
  const select = useMind((s) => s.select);
  const setHovered = useMind((s) => s.setHovered);

  useEffect(() => {
    registerPositions({ chanakya: center });
  }, [registerPositions, center]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 1.4) * 0.1;
    const sel = useMind.getState().selectedNodeId === "chanakya";
    if (meshRef.current) meshRef.current.scale.setScalar(1.6 * pulse * (sel ? 1.25 : 1));
    if (haloRef.current) haloRef.current.scale.setScalar(4.6 + Math.sin(t * 1.4) * 0.6);
  });

  const title = getNode("chanakya")?.title ?? "Chanakya Core";

  return (
    <group position={center}>
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
