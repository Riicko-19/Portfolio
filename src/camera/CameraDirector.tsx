"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type CameraControls from "camera-controls";
import { useMind } from "@/state/store";
import { CAMERA_TUNING } from "@/camera/modes";
import { bus } from "@/state/bus";

/**
 * Camera Director (Blueprint §7) — the SOLE authority over the camera.
 * Other systems express *intent* via store state (cameraMode + selectedNodeId)
 * or the bus; the Director arbitrates and drives the camera-controls rig.
 * Phase 1 implements only Orbit + Focus.
 */
const brainCenter = new THREE.Vector3(0, -2, 0);
const targetVec = new THREE.Vector3();
const camVec = new THREE.Vector3();
const outward = new THREE.Vector3();

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

  // One-time rig configuration + interactivity gating.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (!configured.current) {
      c.minDistance = 4;
      c.maxDistance = 90;
      c.smoothTime = 0.5;
      c.draggingSmoothTime = 0.18;
      configured.current = true;
    }
    c.enabled = phase === "ready";
  }, [phase, controls]);

  // Frame the world as it appears.
  useEffect(() => {
    if (phase === "forming" || phase === "ready") {
      frameOrbit(phase === "ready");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // React to camera intent (Orbit ⇄ Focus).
  useEffect(() => {
    const c = controls.current;
    if (!c || phase !== "ready") return;
    if (cameraMode === "focus" && selectedNodeId) {
      const pos = useMind.getState().nodePositions[selectedNodeId];
      if (pos) {
        targetVec.set(pos[0], pos[1], pos[2]);
        outward.copy(targetVec).sub(brainCenter).normalize();
        camVec
          .copy(targetVec)
          .addScaledVector(outward, CAMERA_TUNING.focusDistance)
          .add(new THREE.Vector3(0, 1.6, 0));
        void c.setLookAt(
          camVec.x,
          camVec.y,
          camVec.z,
          targetVec.x,
          targetVec.y,
          targetVec.z,
          true,
        );
        return;
      }
    }
    frameOrbit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraMode, selectedNodeId, phase]);

  // Recenter pulse (H key) via the event bus.
  useEffect(() => bus.on("camera:recenter", () => frameOrbit(true)), []);

  return null;
}
