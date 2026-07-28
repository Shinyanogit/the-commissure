uniform float uTime;
uniform vec2 uMouse;

void main() {
  vec3 pos = position;

  // subtle wave motion
  // pos.x += sin(uTime + pos.y * 2.0) * 0.05;

  // mouse repulsion
  // float dist = distance(pos.xy, uMouse);
  // pos.xy += normalize(pos.xy - uMouse) * 0.1 / (dist + 0.1);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // size scales with distance
  gl_PointSize = 4.0 * (1.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}