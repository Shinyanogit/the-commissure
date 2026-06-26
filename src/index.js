import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

// Navigation
const hamburger = document.querySelector('.hamburger');
const navList = document.querySelector('.nav-list');
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navList.classList.toggle('active');
});

// Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 0.01, 100 );
camera.up.set(0, 1, 0);
camera.position.set( 0, 0, -0.7 );

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild( renderer.domElement );
renderer.setAnimationLoop( animate );

// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const pointLight1 = new THREE.PointLight(0xffffff, 5);
pointLight1.position.set(2, 1, -1);
scene.add(pointLight1);
const pointLight2 = new THREE.PointLight(0xffffff, 5);
pointLight2.position.set(-2, 1, -1);
scene.add(pointLight2);

// Geometry
const blueGlassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 5,
    roughness: 0.4,
    transparent: true,
    opacity: 1,
    attenuationColor: new THREE.Color(0x009B9E),
    attenuationDistance: 1,
});
const nerveMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    transparent: false,
    wireframe: true
});
const gltfLoader = new GLTFLoader();
gltfLoader.load('/Spine Disection.glb', ( gltf ) => {
    const spine = gltf.scene;
    spine.traverse((child) => {
        if (child.isMesh) {
            if (child.name.includes('bone')) {
                child.material = blueGlassMaterial;
            } else if (child.name.includes('nerve')) {
                child.material = nerveMaterial;
            }
        }
    })
    spine.position.set(0, 0, 0);
    scene.add( spine );
});

// Scroll
let progress = 0;
window.addEventListener('scroll', (event) => {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = THREE.MathUtils.clamp(scrollTop / maxScroll, 0, 1);
    camera.position.y = - 0.3 * progress;
});

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animate
function animate() {
    camera.lookAt( 0, camera.position.y, 0 );
    renderer.render( scene, camera );
}