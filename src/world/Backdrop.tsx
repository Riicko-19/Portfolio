"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Atmospheric backdrop (Blueprint §12; Issue 8). A large camera-locked sphere
 * with a soft vertical gradient + faint horizon band — replaces the flat void
 * with cosmic depth. Always behind everything (renderOrder/depthTest off).
 */
const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vDir = normalize(wp.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 deep = vec3(0.022, 0.029, 0.060);
    vec3 glow = vec3(0.060, 0.078, 0.165);
    float g = smoothstep(0.55, -0.55, h);
    vec3 c = mix(deep, glow, g * 0.85);
    c += glow * 0.18 * smoothstep(0.20, 0.0, abs(h)); // faint horizon band
    gl_FragColor = vec4(c, 1.0);
  }
`;

export default function Backdrop() {
  const ref = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    if (ref.current) ref.current.position.copy(camera.position);
  });

  return (
    <mesh ref={ref} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[260, 32, 24]} />
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
