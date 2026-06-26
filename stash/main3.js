import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 3;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Geometry (point cloud)
const count = 50000;
const positions = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 5;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

// Uniforms (data sent to GPU)
const uniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0, 0) },
};

// Material (custom shader)
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  // uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

// Points object
const points = new THREE.Points(geometry, material);
scene.add(points);

// Mouse tracking
const mouse = new THREE.Vector2();
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  uniforms.uTime.value = clock.getElapsedTime();
  uniforms.uMouse.value = mouse;

  renderer.render(scene, camera);
}

animate();