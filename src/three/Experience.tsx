"use client";

import { Canvas } from "@react-three/fiber";
import Scene from "@/three/Scene";
import BootTerminal from "@/terminal/BootTerminal";
import WindowManager from "@/terminal/WindowManager";
import SpotlightTerminal from "@/terminal/SpotlightTerminal";
import Hud from "@/ui/Hud";
import GlobalHotkeys from "@/navigation/GlobalHotkeys";
import DeepLink from "@/navigation/DeepLink";
import { CAMERA_TUNING } from "@/camera/modes";

/**
 * The 3D experience client island (Blueprint §14 — dynamically imported with
 * ssr:false). The Canvas renders the world; the DOM overlays (terminals,
 * spotlight, HUD) and the keyboard/deep-link controllers are siblings.
 */
export default function Experience() {
  const perf =
    typeof window !== "undefined" && window.location.search.includes("perf");

  return (
    <div className="experience-root">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{
          position: CAMERA_TUNING.homePosition,
          fov: 50,
          near: 0.1,
          far: 400,
        }}
      >
        <Scene perf={perf} />
      </Canvas>

      <BootTerminal />
      <WindowManager />
      <SpotlightTerminal />
      <Hud />
      <GlobalHotkeys />
      <DeepLink />
    </div>
  );
}
