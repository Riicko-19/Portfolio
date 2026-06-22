"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type CameraControls from "camera-controls";
import { useMind } from "@/state/store";
import { CAMERA_TUNING } from "@/camera/modes";
import { getRegion } from "@/content";
import { bus } from "@/state/bus";

/**
 * Camera Director (Blueprint §7) — the SOLE authority over the camera.
 * Other systems express *intent* via store state or the bus; the Director
 * arbitrates and drives the camera-controls rig with a premium, weighty feel
 * (momentum, dolly-to-cursor, eased transitions). Phase 1: Orbit + Focus
 * (+ region framing as an orientation helper).
 */
const brainCenter = new THREE.Vector3(0, -2, 0);
const target = new THREE.Vector3();
const camPos = new THREE.Vector3();
const outward = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

export default function CameraDirector({
  controls,
}: {
  controls: RefObject<CameraControls | null>;
}) {
  const phase = useMind((s) => s.phase);
  const cameraMode = useMind((s) => s.cameraMode);
  const selectedNodeId = useMind((s) => s.selectedNodeId);
  const configured = useRef(false);

  const frameOrbit = (transition: boolean) => {
    const c = controls.current;
    if (!c) return;
    const [px, py, pz] = CAMERA_TUNING.homePosition;
    const [tx, ty, tz] = CAMERA_TUNING.homeTarget;
    void c.setLookAt(px, py, pz, tx, ty, tz, transition);
  };

  const frameRegion = (regionId: string) => {
    const c = controls.current;
    if (!c) return;
    const r = getRegion(regionId);
    if (!r) return;
    target.set(...r.center);
    outward.copy(target).sub(brainCenter);
    if (outward.lengthSq() < 0.01) outward.set(0.6, 0.25, 0.85);
    outward.normalize();
    const dist = r.radius * 3.0 + 10;
    camPos
      .copy(target)
      .addScaledVector(outward, dist)
      .addScaledVector(up, r.radius * 0.4);
    void c.setLookAt(
      camPos.x,
      camPos.y,
      camPos.z,
      target.x,
      target.y,
      target.z,
      true,
    );
  };

  // Premium rig configuration (Issue 3) + interactivity gating.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (!configured.current) {
      c.minDistance = 4;
      c.maxDistance = 92;
      c.smoothTime = 0.42; // momentum / weight on programmatic moves
      c.draggingSmoothTime = 0.14; // inertia while dragging
      c.dollyToCursor = true; // Google-Earth-style zoom toward cursor
      c.dollySpeed = 0.7;
      c.azimuthRotateSpeed = 0.85;
      c.polarRotateSpeed = 0.85;
      // Clamp the pitch so the camera never flips over/under (disorienting).
      c.minPolarAngle = 0.32;
      c.maxPolarAngle = Math.PI * 0.74;
      configured.current = true;
    }
    c.enabled = phase === "ready";
  }, [phase, controls]);

  // Frame the world as it appears.
  useEffect(() => {
    if (phase === "forming" || phase === "ready") frameOrbit(phase === "ready");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // React to camera intent (Orbit ⇄ Focus).
  useEffect(() => {
    const c = controls.current;
    if (!c || phase !== "ready") return;
    if (cameraMode === "focus" && selectedNodeId) {
      const pos = useMind.getState().nodePositions[selectedNodeId];
      if (pos) {
        const dist =
          selectedNodeId === "chanakya"
            ? CAMERA_TUNING.focusDistance + 4
            : CAMERA_TUNING.focusDistance;
        target.set(pos[0], pos[1], pos[2]);
        outward.copy(target).sub(brainCenter).normalize();
        camPos.copy(target).addScaledVector(outward, dist).addScaledVector(up, 1.6);
        void c.setLookAt(
          camPos.x,
          camPos.y,
          camPos.z,
          target.x,
          target.y,
          target.z,
          true,
        );
        return;
      }
    }
    frameOrbit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraMode, selectedNodeId, phase]);

  // Orientation intents from the bus.
  useEffect(() => bus.on("camera:recenter", () => frameOrbit(true)), []);
  useEffect(
    () => bus.on("camera:frameRegion", ({ regionId }) => frameRegion(regionId)),
    [],
  );

  return null;
}
