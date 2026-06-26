import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 0, 1 );

const pointLight = new THREE.PointLight(0xffffff, 10);
pointLight.position.set(2, 2, 2);
scene.add(pointLight);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Control
const controls = new OrbitControls(camera, renderer.domElement);

// Geometry
const textureLoader = new THREE.TextureLoader();
const waterNormalMap = textureLoader.load('/water.jpg');
const customMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  // uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const gltfLoader = new GLTFLoader();
let statue;
let instancedMesh;
let basePosition = [];
gltfLoader.load('/flower.glb', ( gltf ) => {
    statue = gltf.scene;
    statue.position.set(0, -0.5, 0);
    scene.add( statue );
} );

function animate() {
    renderer.render( scene, camera );
}