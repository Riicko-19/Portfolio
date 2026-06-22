import * as THREE from "three";

/**
 * Procedural brain point-cloud generator (Blueprint §3 / §12 formation).
 * Produces target positions (the formed brain), scattered start positions
 * (pre-formation), and a per-point seed for staggered assembly + variation.
 * Runs once on mount; ~6.8k points, well within the §15 particle budget.
 */
export interface BrainPointData {
  count: number;
  targets: Float32Array;
  starts: Float32Array;
  seeds: Float32Array;
}

const dir = new THREE.Vector3();

function randDir(): THREE.Vector3 {
  // Uniform point on the unit sphere.
  const u = Math.random() * 2 - 1;
  const t = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return dir.set(r * Math.cos(t), u, r * Math.sin(t));
}

interface Lobe {
  n: number;
  center: [number, number, number];
  radii: [number, number, number];
  fold: number; // gyrification noise amplitude
  freq: number; // fold frequency
}

const LOBES: Lobe[] = [
  { n: 2200, center: [-4.5, 2, 0.5], radii: [8, 7.5, 11], fold: 0.1, freq: 7 }, // left hemi
  { n: 2200, center: [4.5, 2, 0.5], radii: [8, 7.5, 11], fold: 0.1, freq: 7 }, // right hemi
  { n: 1500, center: [0, -6.5, -8], radii: [6, 3.6, 4.6], fold: 0.14, freq: 14 }, // cerebellum
  { n: 500, center: [0, -8, -4], radii: [1.6, 5, 1.8], fold: 0.05, freq: 6 }, // stem
];

export function generateBrainPoints(): BrainPointData {
  const count = LOBES.reduce((s, l) => s + l.n, 0);
  const targets = new Float32Array(count * 3);
  const starts = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  let i = 0;
  for (const lobe of LOBES) {
    for (let k = 0; k < lobe.n; k++) {
      const d = randDir();
      // Surface of the ellipsoid + gyrification displacement.
      const gyri =
        Math.sin(d.x * lobe.freq + d.y * lobe.freq * 0.7) *
        Math.cos(d.z * lobe.freq + d.y * lobe.freq * 0.5);
      const disp = 1 + gyri * lobe.fold;
      const shell = 1 - Math.random() * 0.12; // a little thickness
      const x = lobe.center[0] + d.x * lobe.radii[0] * disp * shell;
      const y = lobe.center[1] + d.y * lobe.radii[1] * disp * shell;
      const z = lobe.center[2] + d.z * lobe.radii[2] * disp * shell;

      const i3 = i * 3;
      targets[i3] = x;
      targets[i3 + 1] = y;
      targets[i3 + 2] = z;

      // Scattered start — a loose cloud around the brain.
      const s = randDir();
      const sr = 18 + Math.random() * 12;
      starts[i3] = s.x * sr;
      starts[i3 + 1] = s.y * sr * 0.7 - 1;
      starts[i3 + 2] = s.z * sr;

      seeds[i] = Math.random();
      i++;
    }
  }

  return { count, targets, starts, seeds };
}
