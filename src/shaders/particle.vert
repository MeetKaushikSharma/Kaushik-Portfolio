precision highp float;

uniform float uTime;
uniform float uPixelRatio;
uniform float uScrollY;
uniform float uScrollVel;
uniform vec2 uResolution;
uniform float uIntensity;

attribute vec3 aPosition;
attribute vec3 aColor;
attribute float aLife;       // 0..1
attribute float aSize;
attribute float aSeed;

varying vec3 vColor;
varying float vLife;
varying float vAlpha;

// 2D random hash
float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// 3D noise (cheap value noise)
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = rand(i.xy);
  float n100 = rand(i.xy + vec2(1, 0));
  float n010 = rand(i.xy + vec2(0, 1));
  float n110 = rand(i.xy + vec2(1, 1));
  float n001 = rand(i.xy + i.z);
  float n101 = rand(i.xy + vec2(1, 0) + i.z);
  float n011 = rand(i.xy + vec2(0, 1) + i.z);
  float n111 = rand(i.xy + vec2(1, 1) + i.z);
  float nx00 = mix(n000, n100, f.x);
  float nx01 = mix(n010, n110, f.x);
  float nx10 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx01, f.y);
  float nxy1 = mix(nx10, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

void main() {
  // Slow drifting motion driven by noise + time
  vec3 drift = vec3(
    noise3(aPosition * 0.5 + uTime * 0.05) - 0.5,
    noise3(aPosition * 0.5 + uTime * 0.05 + 100.0) - 0.5,
    noise3(aPosition * 0.5 + uTime * 0.05 + 200.0) - 0.5
  ) * 0.6;

  // Scroll pushes particles in a slow vertical stream
  vec3 pos = aPosition + drift + vec3(0.0, uScrollVel * 0.05, 0.0);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size: perspective-correct, pulsing with life
  float pulse = 0.7 + 0.3 * sin(uTime * 2.0 + aSeed * 6.2831);
  float size = aSize * uPixelRatio * (220.0 / -mvPosition.z) * pulse * uIntensity;

  gl_PointSize = clamp(size, 1.0, 24.0);

  vColor = aColor;
  vLife = aLife;
  vAlpha = smoothstep(0.0, 0.25, aLife) * smoothstep(0.0, 0.4, 1.0 - aLife);
}