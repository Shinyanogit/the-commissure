import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

// Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.set( 0, 0.2, -0.2 );

// Scroll-based Camera Movement
let scrollProgress = 0;
window.addEventListener('wheel', (e) => {
    scrollProgress += 0.001 * e.deltaY;
    scrollProgress = Math.max(0, Math.min(1, scrollProgress));
} );

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Controls
const controls = new OrbitControls( camera, renderer.domElement );

// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const pointLight1 = new THREE.PointLight(0xffffff, 5);
pointLight1.position.set(1, 1, -1);
scene.add(pointLight1);
const pointLight2 = new THREE.PointLight(0xffffff, 5);
pointLight2.position.set(-1, 1, 1);
scene.add(pointLight2);

// Background
const loader = new THREE.TextureLoader();
loader.load('/background.jpeg', ( texture ) => {
    scene.background = texture;
} );

// Geometry
const gltfLoader = new GLTFLoader();
let removedStructes = [];
gltfLoader.load('/posterior cervical decompression and fusion (PCDF).glb', ( gltf ) => {
    const pcdf = gltf.scene;
    pcdf.traverse((child) => {
        if (child.isMesh) {
            if (child.name.includes('disk')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xF2E9E4, transparent: false, opacity: 1 });
            } else if (child.name.includes('ligament')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xF5F2EB, transparent: false, opacity: 1 });
                if (child.name.includes('removed')) {
                    removedStructes.push(child);
                }
            } else if (child.name.includes('nerve')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xFAD02C, transparent: false, opacity: 1 });
            } else if (child.name.includes('bone')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xF0E6D4, transparent: false, opacity: 1 });
                if (child.name.includes('removed')) {
                    removedStructes.push(child);
                }
            }
        }
    });
    pcdf.position.set(0, 0, 0);
    scene.add(pcdf);
});
window.addEventListener( 'click', () => {
    if (removedStructes.length > 0) {
        removedStructes.forEach(structure => {
            structure.material.transparent = true;
            structure.material.needsUpdate = true;
            gsap.to(structure.material, {
                opacity: 0,
                duration: 1,
                ease: 'power2.inOut'
            });
        });
    }
    console.log('Clicked!')
});

// Animate
function animate() {
    camera.lookAt(0, 0.2, 0);
    renderer.render( scene, camera );
}