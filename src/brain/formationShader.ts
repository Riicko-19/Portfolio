/**
 * Particle assembly shader (Blueprint §12; Issues 1 + 7).
 * GLSL ES 1.00 for THREE.ShaderMaterial. Each point eases from a scattered
 * start to its formed position with a per-point delay (staggered assembly),
 * stays MONOCHROME blue during assembly, then its REGION colour saturates in
 * near the end ("outline → colored brain"). Region hover boosts brightness.
 */
export const formationVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uHoverRegion;
  attribute vec3 aStart;
  attribute float aSeed;
  attribute vec3 aColor;
  attribute float aRegion;
  varying float vAlpha;
  varying float vSeed;
  varying vec3 vColor;

  float easeOutCubic(float x){ return 1.0 - pow(1.0 - x, 3.0); }

  void main() {
    float delay = aSeed * 0.45;
    float local = clamp((uProgress - delay) / 0.55, 0.0, 1.0);
    float e = easeOutCubic(local);

    vec3 pos = mix(aStart, position, e);
    pos.y += sin(uTime * 0.35 + aSeed * 6.2831) * 0.06 * e;
    pos.x += cos(uTime * 0.30 + aSeed * 6.2831) * 0.05 * e;

    // Region hover highlight (Issue 2): brighten the matching region.
    float hov = step(abs(aRegion - uHoverRegion), 0.5);

    // Stage colour: monochrome neural-blue during assembly, region colour in
    // at the end (Issue 7 — "outline" then "colored brain").
    vec3 baseCol = vec3(0.30, 0.55, 0.95);
    float colorize = smoothstep(0.55, 1.0, uProgress);
    vec3 c = mix(baseCol, aColor, colorize);

    // Idle neural activity (Phase 2.5): once formed, brightness bands travel
    // through the tissue and points flicker — the brain "thinks" while idle.
    float formed = smoothstep(0.95, 1.0, uProgress);
    float wave = sin(pos.y * 0.22 + pos.x * 0.12 - uTime * 1.1 + aSeed * 6.2831);
    float flick = 0.5 + 0.5 * sin(uTime * (1.4 + aSeed * 2.0) + aSeed * 40.0);
    float activity = formed * (0.28 * smoothstep(0.35, 1.0, wave) + 0.10 * flick);

    vColor = c * mix(1.0, 1.7, hov) * (1.0 + activity * 1.5);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.5 + aSeed * 0.9) * uPixelRatio * (95.0 / -mv.z) * mix(1.0, 1.25, hov) * (1.0 + activity * 0.5);

    vAlpha = e * mix(1.0, 1.5, hov) * (1.0 + activity * 0.5);
    vSeed = aSeed;
  }
`;

export const formationFragment = /* glsl */ `
  precision mediump float;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vSeed;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, glow * vAlpha * uOpacity);
  }
`;
