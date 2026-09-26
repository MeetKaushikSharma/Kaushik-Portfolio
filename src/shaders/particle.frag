precision highp float;

varying vec3 vColor;
varying float vLife;
varying float vAlpha;

void main() {
  // Soft circular point sprite with anti-aliased edge
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  float core = smoothstep(0.5, 0.0, dist);
  float halo = smoothstep(0.5, 0.15, dist) * 0.35;

  // Subtle chromatic fringing on the halo for "digital" feel
  vec3 col = vColor * (core + halo);
  col.r *= 1.05;
  col.b *= 0.95;

  float a = (core + halo) * vAlpha;
  if (a < 0.01) discard;

  gl_FragColor = vec4(col, a);
}