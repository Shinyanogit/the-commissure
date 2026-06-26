void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);

  // make points circular
  if (dist > 0.5) discard;

  // base falloff
  float intensity = 1.0 - dist * 2.0;

  // specular highlight (fake reflection)
  float spec = pow(intensity, 10.0);

  vec3 color = vec3(0.2, 0.6, 1.0) * intensity + vec3(1.0) * spec;

  gl_FragColor = vec4(color, 1.0);
}