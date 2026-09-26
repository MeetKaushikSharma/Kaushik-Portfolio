precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
uniform float uReduced; // 0 or 1

varying vec2 vUv;

// Hash-based value noise (cheap, no texture lookups)
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1, 0));
  float c = hash(i + vec2(0, 1));
  float d = hash(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian motion for layered grain
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;

  // Slow drifting grain
  float grain = fbm(uv * 3.0 + uTime * 0.05);
  grain = (grain - 0.5) * 0.12;

  // Radial vignette — darker at edges, draws eye to centre
  vec2 centered = uv - 0.5;
  float vig = 1.0 - dot(centered, centered) * 0.55;

  // Subtle vertical gradient (lighter top, darker bottom) for depth
  float grad = 0.5 + 0.5 * (1.0 - uv.y) * 0.15;

  // Chromatic offset on the grain for a "cathode" feel
  float rGrain = fbm(uv * 3.0 + uTime * 0.05 + 0.7);
  float bGrain = fbm(uv * 3.0 + uTime * 0.05 - 0.7);
  vec3 col = vec3(
    grain + (rGrain - 0.5) * 0.04,
    grain,
    grain + (bGrain - 0.5) * 0.04
  );

  col *= vig * grad * uIntensity;

  // When reduced motion is on, drop to near-zero (still renders, just static)
  col *= (1.0 - uReduced) * 0.5 + 0.5 * uReduced * 0.05;

  gl_FragColor = vec4(col, 0.0);
}