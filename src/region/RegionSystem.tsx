"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { REGION_LIST, type RegionMeta } from "@/content";
import { useMind } from "@/state/store";
import { bus } from "@/state/bus";

/**
 * Region System (Blueprint §3/§4; Issue 2). Answers "where am I?" without
 * opening a node: distance-faded labels for every region, hover proxies over
 * the empty lobes that brighten the matching brain particles, and click-to-
 * frame travel. The Core is handled separately by CoreAnchor.
 */
const HOVER_LOBES = new Set(["frontal", "parietal", "occipital", "temporal"]);

function RegionLabel({ region }: { region: RegionMeta }) {
  const ref = useRef<HTMLButtonElement>(null);
  const camera = useThree((s) => s.camera);
  const center = useMemo(() => new THREE.Vector3(...region.center), [region]);

  useFrame(() => {
    const el = ref.current;
    if (!el) return;
    const d = camera.position.distanceTo(center);
    // Fade in as you pull back (tier 0/1); fade out when focused on a node.
    let o = THREE.MathUtils.clamp((d - 12) / 14, 0, 1);
    if (useMind.getState().selectedNodeId) o *= 0.12;
    el.style.opacity = o.toFixed(3);
    el.style.pointerEvents = o > 0.45 ? "auto" : "none";
  });

  return (
    <Html
      position={region.center}
      center
      distanceFactor={46}
      zIndexRange={[12, 0]}
      style={{ pointerEvents: "none" }}
    >
      <button
        ref={ref}
        type="button"
        className="region-tag"
        style={{ borderColor: region.color }}
        onPointerEnter={() => useMind.getState().setHoveredRegion(region.id)}
        onPointerLeave={() => useMind.getState().setHoveredRegion(null)}
        onClick={() => bus.emit("camera:frameRegion", { regionId: region.id })}
      >
        <span className="region-tag-name" style={{ color: region.color }}>
          {region.name}
        </span>
        <span className="region-tag-domain">{region.domain}</span>
      </button>
    </Html>
  );
}

function RegionProxy({ region }: { region: RegionMeta }) {
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    useMind.getState().setHoveredRegion(region.id);
  };
  const onOut = () => {
    const s = useMind.getState();
    if (s.hoveredRegionId === region.id) s.setHoveredRegion(null);
  };
  return (
    <mesh position={region.center} onPointerOver={onOver} onPointerOut={onOut}>
      <sphereGeometry args={[region.radius * 0.95, 16, 12]} />
      {/* Invisible but still raycastable (opacity 0, no colour write). */}
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}

export default function RegionSystem() {
  const regions = REGION_LIST.filter((r) => r.id !== "core");
  return (
    <group>
      {regions
        .filter((r) => HOVER_LOBES.has(r.id))
        .map((r) => (
          <RegionProxy key={`p-${r.id}`} region={r} />
        ))}
      {regions.map((r) => (
        <RegionLabel key={`l-${r.id}`} region={r} />
      ))}
    </group>
  );
}
