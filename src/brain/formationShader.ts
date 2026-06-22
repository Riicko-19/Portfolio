/**
 * Particle assembly shader (Blueprint §12 — formation sequence).
 * GLSL ES 1.00 for THREE.ShaderMaterial. Three injects `position`,
 * `projectionMatrix` and `modelViewMatrix`; we add `aStart` + `aSeed`.
 * Each point eases from its scattered start to its formed `position`, with a
 * per-point delay so the brain assembles in a staggered wave.
 */
export const formationVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute vec3 aStart;
  attribute float aSeed;
  varying float vAlpha;
  varying float vSeed;

  float easeOutCubic(float x){ return 1.0 - pow(1.0 - x, 3.0); }

  void main() {
    float delay = aSeed * 0.45;
    float local = clamp((uProgress - delay) / 0.55, 0.0, 1.0);
    float e = easeOutCubic(local);

    vec3 pos = mix(aStart, position, e);
    // Subtle idle drift once settled — the brain breathes (§12 motion).
    pos.y += sin(uTime * 0.35 + aSeed * 6.2831) * 0.06 * e;
    pos.x += cos(uTime * 0.30 + aSeed * 6.2831) * 0.05 * e;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.5 + aSeed * 0.9) * uPixelRatio * (95.0 / -mv.z);

    vAlpha = e;
    vSeed = aSeed;
  }
`;

export const formationFragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uColorA, uColorB, vSeed);
    gl_FragColor = vec4(col, glow * vAlpha * uOpacity);
  }
`;
