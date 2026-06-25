"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "@/three/Scene";
import BootTerminal from "@/terminal/BootTerminal";
import WindowManager from "@/terminal/WindowManager";
import SpotlightTerminal from "@/terminal/SpotlightTerminal";
import Hud from "@/ui/Hud";
import Compass from "@/navigation/Compass";
import Minimap from "@/navigation/Minimap";
import TravelHud from "@/navigation/TravelHud";
import GlobalHotkeys from "@/navigation/GlobalHotkeys";
import DeepLink from "@/navigation/DeepLink";
import { useMind } from "@/state/store";
import { CAMERA_TUNING } from "@/camera/modes";

/**
 * The 3D experience client island (Blueprint §14). Canvas + the DOM overlays
 * (terminals, spotlight, HUD, compass, minimap, travel HUD) + the keyboard /
 * deep-link / persistence controllers.
 */
export default function Experience() {
  const perf =
    typeof window !== "undefined" && window.location.search.includes("perf");

  useEffect(() => {
    useMind.getState().loadDiscovered();
  }, []);

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
      <Compass />
      <Minimap />
      <TravelHud />
      <GlobalHotkeys />
      <DeepLink />
    </div>
  );
}
