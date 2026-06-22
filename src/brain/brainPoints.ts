import * as THREE from "three";
import { REGIONS, regionIndex } from "@/content/regions";
import type { RegionId } from "@/content/schema";

/**
 * Procedural brain point-cloud (Blueprint §3/§12). Each point carries a
 * REGION colour + region index so the cloud reads as anatomy at a glance
 * (Issue 1): frontal violet, parietal cyan, occipital magenta, temporal
 * green-gold, cerebellum amber, stem teal — with a widened midline fissure
 * and subtle hemisphere tint (left cool / right warm).
 */
export interface BrainPointData {
  count: number;
  targets: Float32Array;
  starts: Float32Array;
  seeds: Float32Array;
  colors: Float32Array;
  regions: Float32Array; // region index per point
}

const dir = new THREE.Vector3();
const col = new THREE.Color();
const leftTint = new THREE.Color("#5ea8ff");
const rightTint = new THREE.Color("#b46cff");

function randDir(): THREE.Vector3 {
  const u = Math.random() * 2 - 1;
  const t = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return dir.set(r * Math.cos(t), u, r * Math.sin(t));
}

/** Classify a cerebrum point into a lobe by position (relative to brain). */
function classifyLobe(x: number, y: number, z: number): RegionId {
  if (z > 4) return "frontal";
  if (z < -6.5) return "occipital";
  if (y > 5) return "parietal";
  return "temporal";
}

interface Blob {
  n: number;
  center: [number, number, number];
  radii: [number, number, number];
  fold: number;
  freq: number;
  kind: "cerebrum" | "fixed";
  region?: RegionId;
}

const BLOBS: Blob[] = [
  // Two cerebral hemispheres (lobe colour assigned per-point by position).
  { n: 2500, center: [-5.2, 2, 0.5], radii: [7.6, 7.6, 11.2], fold: 0.1, freq: 7, kind: "cerebrum" },
  { n: 2500, center: [5.2, 2, 0.5], radii: [7.6, 7.6, 11.2], fold: 0.1, freq: 7, kind: "cerebrum" },
  // Cerebellum + stem (fixed region colour).
  { n: 1500, center: [0, -6.5, -8], radii: [6, 3.6, 4.6], fold: 0.14, freq: 14, kind: "fixed", region: "cerebellum" },
  { n: 520, center: [0, -8, -4], radii: [1.6, 5, 1.8], fold: 0.05, freq: 6, kind: "fixed", region: "stem" },
];

export function generateBrainPoints(): BrainPointData {
  const count = BLOBS.reduce((s, b) => s + b.n, 0);
  const targets = new Float32Array(count * 3);
  const starts = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const regions = new Float32Array(count);

  let i = 0;
  for (const blob of BLOBS) {
    for (let k = 0; k < blob.n; k++) {
      const d = randDir();
      const gyri =
        Math.sin(d.x * blob.freq + d.y * blob.freq * 0.7) *
        Math.cos(d.z * blob.freq + d.y * blob.freq * 0.5);
      const disp = 1 + gyri * blob.fold;
      const shell = 1 - Math.random() * 0.12;
      let x = blob.center[0] + d.x * blob.radii[0] * disp * shell;
      const y = blob.center[1] + d.y * blob.radii[1] * disp * shell;
      const z = blob.center[2] + d.z * blob.radii[2] * disp * shell;

      // Resolve region + colour.
      let region: RegionId;
      if (blob.kind === "cerebrum") {
        // Widen the longitudinal fissure: push each hemisphere outward.
        x += Math.sign(blob.center[0]) * 1.4;
        region = classifyLobe(x, y, z);
        col.set(REGIONS[region].color);
        // Subtle hemisphere tint.
        col.lerp(x < 0 ? leftTint : rightTint, 0.16);
      } else {
        region = blob.region as RegionId;
        col.set(REGIONS[region].color);
      }

      const i3 = i * 3;
      targets[i3] = x;
      targets[i3 + 1] = y;
      targets[i3 + 2] = z;

      const s = randDir();
      const sr = 18 + Math.random() * 12;
      starts[i3] = s.x * sr;
      starts[i3 + 1] = s.y * sr * 0.7 - 1;
      starts[i3 + 2] = s.z * sr;

      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      seeds[i] = Math.random();
      regions[i] = regionIndex(region);
      i++;
    }
  }

  return { count, targets, starts, seeds, colors, regions };
}

/**
 * A sparse "synaptic network" of short lines between nearby brain points —
 * used as the mid-formation stage (Issue 7) and a faint persistent web that
 * adds structure + scale. Indices chosen near each other so segments are short.
 */
export function buildNeuralWeb(targets: Float32Array, max = 520): Float32Array {
  const pts: number[] = [];
  const n = targets.length / 3;
  let added = 0;
  let guard = 0;
  while (added < max && guard < max * 12) {
    guard++;
    const i = Math.floor(Math.random() * n);
    const j = Math.min(n - 1, i + 1 + Math.floor(Math.random() * 36));
    const ax = targets[i * 3], ay = targets[i * 3 + 1], az = targets[i * 3 + 2];
    const bx = targets[j * 3], by = targets[j * 3 + 1], bz = targets[j * 3 + 2];
    const dist = Math.hypot(ax - bx, ay - by, az - bz);
    if (dist > 5.5) continue;
    pts.push(ax, ay, az, bx, by, bz);
    added++;
  }
  return new Float32Array(pts);
}
