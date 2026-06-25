"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useMind } from "@/state/store";

/**
 * Bridges live camera transform out to the store (throttled) so the DOM HUD
 * (compass / minimap) can read it without touching the render loop.
 */
export default function CameraReporter() {
  const camera = useThree((s) => s.camera);
  const acc = useRef(0);

  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 0.09) return;
    acc.current = 0;
    const p = camera.position;
    useMind.getState().setCameraInfo({
      x: p.x,
      y: p.y,
      z: p.z,
      azimuth: Math.atan2(p.x, p.z),
    });
  });

  return null;
}
