"use client";

import { useRef } from "react";
import { CameraControls, Stats } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import Backdrop from "@/world/Backdrop";
import AmbientField from "@/world/AmbientField";
import BrainFormation from "@/brain/BrainFormation";
import RegionSystem from "@/region/RegionSystem";
import CoreAnchor from "@/region/CoreAnchor";
import Cerebellum from "@/region/Cerebellum";
import Synapses from "@/nodes/Synapses";
import CameraDirector from "@/camera/CameraDirector";

/**
 * Scene assembly (inside the Canvas). Cosmic backdrop + dust for scale,
 * the camera rig + Director, the brain body, region geography, the Core
 * anchor, and the one populated region.
 */
export default function Scene({ perf }: { perf: boolean }) {
  const controls = useRef<CameraControlsImpl>(null);

  return (
    <>
      <color attach="background" args={["#070912"]} />
      {/* Lighter fog so the far dust still reads (depth without hiding it). */}
      <fogExp2 attach="fog" args={["#070912", 0.006]} />

      <ambientLight intensity={0.3} color="#5ea8ff" />
      <pointLight position={[0, 2, 0]} intensity={6} color="#ffc76b" distance={36} />

      <Backdrop />
      <AmbientField />

      <CameraControls ref={controls} makeDefault />
      <CameraDirector controls={controls} />

      <BrainFormation />
      <RegionSystem />
      <CoreAnchor />
      <Cerebellum />
      <Synapses />

      {perf && <Stats />}
    </>
  );
}
