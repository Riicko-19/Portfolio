"use client";

import { useRef } from "react";
import { CameraControls, Stats } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import BrainFormation from "@/brain/BrainFormation";
import Cerebellum from "@/region/Cerebellum";
import CameraDirector from "@/camera/CameraDirector";

/**
 * Scene assembly (inside the Canvas). Background, depth haze, the camera rig +
 * Director, the brain body, and the one populated region.
 */
export default function Scene({ perf }: { perf: boolean }) {
  const controls = useRef<CameraControlsImpl>(null);

  return (
    <>
      <color attach="background" args={["#070912"]} />
      <fogExp2 attach="fog" args={["#070912", 0.016]} />

      {/* Emissive-driven look (§12); minimal lights for any lit materials. */}
      <ambientLight intensity={0.3} color="#5ea8ff" />
      <pointLight position={[0, 2, 0]} intensity={6} color="#ffc76b" distance={34} />

      <CameraControls ref={controls} makeDefault />
      <CameraDirector controls={controls} />

      <BrainFormation />
      <Cerebellum />

      {perf && <Stats />}
    </>
  );
}
