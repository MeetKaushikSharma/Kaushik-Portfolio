precision highp float;

uniform float uProgress;     // 0.0 to 1.0 transition progress
uniform float uTime;         // elapsed time in seconds
uniform vec2 uResolution;    // viewport resolution
uniform float uDirection;    // +1 down/forward, -1 up/backward
uniform sampler2D tDiffuse;  // input texture buffer (optional)

varying vec2 vUv;

// Cheap pseudo-random generator
float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// 2D simplex-style noise
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = fract((i.y + vec3(0.0, i1.y, 1.0)) * 0.034 + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * 45.1) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;

  // Digital glitch slice offset
  float slice = step(0.96, sin(uv.y * 80.0 + uTime * 20.0));
  float glitchOffset = (rand(vec2(uTime, floor(uv.y * 30.0))) - 0.5) * 0.06 * slice * uProgress;
  uv.x += glitchOffset;

  // Vertical wave distortion
  float wave = sin(uv.y * 12.0 + uTime * 6.0) * 0.02 * uProgress;
  uv.x += wave;

  // Scanline effect
  float scanline = sin(uv.y * uResolution.y * 0.75) * 0.08 * uProgress;

  // Vignette mask based on progress
  float dist = distance(uv, vec2(0.5));
  float vignette = smoothstep(0.8 - uProgress * 0.4, 0.2, dist);

  // Cybernetic grid lines during transition
  float gridX = step(0.98, fract(uv.x * 20.0));
  float gridY = step(0.98, fract(uv.y * 20.0));
  float grid = max(gridX, gridY) * 0.15 * uProgress;

  vec3 color = vec3(0.0);
  color += vec3(grid);
  color += vec3(scanline);

  // Digital cyan accent flash on glitch edges
  color.g += abs(glitchOffset) * 2.0;
  color.b += abs(glitchOffset) * 3.0;

  float alpha = clamp((uProgress * 0.85) + (glitchOffset * 2.0), 0.0, 0.95);

  gl_FragColor = vec4(color, alpha);
}
