"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type CameraControls from "camera-controls";
import { useMind } from "@/state/store";
import { CAMERA_TUNING } from "@/camera/modes";
import { getRegion } from "@/content";
import { bus } from "@/state/bus";
import { easeInOutCubic } from "@/lib/easing";

/**
 * Camera Director (Blueprint §7) — the SOLE authority over the camera.
 * Phase 2: Orbit + Focus + Region framing + the NEURAL TRAVEL System
 * (lock → ride the synapse curve → arrive), a premium weighty feel.
 */
const brainCenter = new THREE.Vector3(0, -2, 0);
const target = new THREE.Vector3();
const camPos = new THREE.Vector3();
const outward = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

// Reusable vectors for travel sampling.
const tLook = new THREE.Vector3();
const tAhead = new THREE.Vector3();
const tTan = new THREE.Vector3();

function quadBezier(
  out: THREE.Vector3,
  a: THREE.Vector3,
  c: THREE.Vector3,
  b: THREE.Vector3,
  t: number,
) {
  const it = 1 - t;
  out.set(
    it * it * a.x + 2 * it * t * c.x + t * t * b.x,
    it * it * a.y + 2 * it * t * c.y + t * t * b.y,
    it * it * a.z + 2 * it * t * c.z + t * t * b.z,
  );
  return out;
}

interface TravelState {
  a: THREE.Vector3;
  b: THREE.Vector3;
  c: THREE.Vector3;
  t: number;
}

export default function CameraDirector({
  controls,
}: {
  controls: RefObject<CameraControls | null>;
}) {
  const phase = useMind((s) => s.phase);
  const cameraMode = useMind((s) => s.cameraMode);
  const selectedNodeId = useMind((s) => s.selectedNodeId);
  const traveling = useMind((s) => s.traveling);
  const configured = useRef(false);
  const travel = useRef<TravelState | null>(null);
  const savedSmooth = useRef<number | null>(null);
  const camera = useThree((s) => s.camera);

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
    camPos.copy(target).addScaledVector(outward, dist).addScaledVector(up, r.radius * 0.4);
    void c.setLookAt(camPos.x, camPos.y, camPos.z, target.x, target.y, target.z, true);
  };

  // Premium rig configuration + interactivity gating.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (!configured.current) {
      c.minDistance = 4;
      c.maxDistance = 92;
      c.smoothTime = 0.42;
      c.draggingSmoothTime = 0.14;
      c.dollyToCursor = true;
      c.dollySpeed = 0.7;
      c.azimuthRotateSpeed = 0.85;
      c.polarRotateSpeed = 0.85;
      c.minPolarAngle = 0.32;
      c.maxPolarAngle = Math.PI * 0.74;
      configured.current = true;
    }
    c.enabled = phase === "ready" && !traveling;
  }, [phase, traveling, controls]);

  // Frame the world as it appears.
  useEffect(() => {
    if (phase === "forming" || phase === "ready") frameOrbit(phase === "ready");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // React to focus intent (skipped while travelling — travel owns the camera).
  useEffect(() => {
    const c = controls.current;
    if (!c || phase !== "ready" || useMind.getState().traveling) return;
    if (cameraMode === "focus" && selectedNodeId) {
      const pos = useMind.getState().nodePositions[selectedNodeId];
      if (pos) {
        const dist =
          selectedNodeId === "chanakya"
            ? CAMERA_TUNING.focusDistance + 5
            : CAMERA_TUNING.focusDistance;
        target.set(pos[0], pos[1], pos[2]);
        outward.copy(target).sub(brainCenter).normalize();
        camPos.copy(target).addScaledVector(outward, dist).addScaledVector(up, 1.6);
        void c.setLookAt(camPos.x, camPos.y, camPos.z, target.x, target.y, target.z, true);
        return;
      }
    }
    frameOrbit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraMode, selectedNodeId, phase]);

  // Set up a neural-travel ride when `traveling` flips on.
  useEffect(() => {
    if (!traveling) {
      travel.current = null;
      return;
    }
    const s = useMind.getState();
    const a = s.travelFrom ? s.nodePositions[s.travelFrom] : null;
    const b = s.travelTo ? s.nodePositions[s.travelTo] : null;
    const c = controls.current;
    if (!a || !b || !c) {
      s.endTravel();
      return;
    }
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const C = A.clone().add(B).multiplyScalar(0.5);
    C.addScaledVector(C.clone().sub(brainCenter).normalize(), A.distanceTo(B) * 0.18);
    travel.current = { a: A, b: B, c: C, t: 0 };
    savedSmooth.current = c.smoothTime;
    c.smoothTime = 0.12; // snappy so the camera tracks the moving path goal
  }, [traveling, controls]);

  // Drive the ride.
  useFrame((state, dt) => {
    const tr = travel.current;
    const c = controls.current;

    // Camera turbulence (Phase 2.5): a continuous, low-amplitude pseudo-noise
    // drift so the camera always "breathes" — even when locked on a target or
    // riding a synapse. Applied AFTER camera-controls has written this frame's
    // transform (this component mounts after <CameraControls>), so it layers on
    // top without accumulating — the rig overwrites position next frame.
    if (useMind.getState().phase === "ready") {
      const t = state.clock.elapsedTime;
      const A = 0.16;
      camera.position.x +=
        (Math.sin(t * 0.43) + Math.sin(t * 0.91 + 1.3) * 0.5) * A;
      camera.position.y +=
        (Math.sin(t * 0.37 + 2.1) + Math.sin(t * 0.71) * 0.5) * A * 0.7;
      camera.position.z +=
        (Math.cos(t * 0.39 + 0.6) + Math.cos(t * 0.83 + 2.4) * 0.5) * A;
    }

    if (!tr || !c) return;
    tr.t = Math.min(1, tr.t + dt / 1.7);
    const e = easeInOutCubic(tr.t);
    quadBezier(tLook, tr.a, tr.c, tr.b, e);
    quadBezier(tAhead, tr.a, tr.c, tr.b, Math.min(1, e + 0.06));
    tTan.copy(tAhead).sub(tLook);
    if (tTan.lengthSq() < 1e-6) tTan.copy(tLook).sub(brainCenter);
    tTan.normalize();
    outward.copy(tLook).sub(brainCenter).normalize();
    camPos
      .copy(tLook)
      .addScaledVector(tTan, -5.5)
      .addScaledVector(outward, 3)
      .addScaledVector(up, 1.4);
    void c.setLookAt(camPos.x, camPos.y, camPos.z, tAhead.x, tAhead.y, tAhead.z, false);
    useMind.setState({ travelProgress: tr.t });
    if (tr.t >= 1) {
      travel.current = null;
      if (savedSmooth.current != null) c.smoothTime = savedSmooth.current;
      c.enabled = true;
      useMind.getState().endTravel();
    }
  });

  // Orientation intents from the bus.
  useEffect(() => bus.on("camera:recenter", () => frameOrbit(true)), []);
  useEffect(
    () => bus.on("camera:frameRegion", ({ regionId }) => frameRegion(regionId)),
    [],
  );

  return null;
}
