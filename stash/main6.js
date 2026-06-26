import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.set( 0, 0, 1 );

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Controls
// const controls = new OrbitControls( camera, renderer.domElement );

// Light
const pointLight = new THREE.PointLight(0xffffff, 100);
pointLight.position.set(1, 1, 1);
scene.add(pointLight);

// Background
const loader = new THREE.TextureLoader();
loader.load('/background.jpeg', ( texture ) => {
    scene.background = texture;
} );

// Geometry
const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const gltfLoader = new GLTFLoader();
const spineMeshes = [];
let progress = 0;
let targetProgress = 0;

gltfLoader.load('/spine fusion.glb', ( gltf ) => {
    const spine = gltf.scene;
    spine.position.set(0, 0, 0);
    spine.traverse((child) => {
        if (child.isMesh) {
            // const edges = new THREE.EdgesGeometry( child.geometry );
            // const edgeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
            // const edgeLines = new THREE.LineSegments( edges, edgeMaterial );
            // child.add( edgeLines );
            child.material = whiteMaterial;
            child.userData.originalPosition = child.position.clone();
            child.userData.originalRotation = child.rotation.clone();
            spineMeshes.push(child);
        }
    });
    spineMeshes.sort((a, b) => a.position.y - b.position.y);
    spineMeshes.forEach((mesh, index) => {
        const angle = (Math.PI * 2 / 25) * index;
        mesh.rotation.y = angle + Math.PI / 2;
        mesh.position.x = Math.cos(angle) * 0.5;
        mesh.position.z = Math.sin(angle) * 0.5;
        mesh.userData.spiralPosition = mesh.position.clone();
        mesh.userData.spiralRotation = mesh.rotation.clone();
    });
    scene.add( spine );
    window.addEventListener('wheel', (e) => {
        targetProgress += e.deltaY * 0.001;
        targetProgress = THREE.MathUtils.clamp(targetProgress, 0, 1);
    });
});

// Animate
function animate() {
    progress = THREE.MathUtils.lerp(progress, targetProgress, 0.08);
    if (spineMeshes) {
        spineMeshes.forEach((mesh, index) => {
            mesh.position.lerpVectors(mesh.userData.spiralPosition, mesh.userData.originalPosition, progress);
            mesh.rotation.y = THREE.MathUtils.lerp(mesh.userData.spiralRotation.y, mesh.userData.originalRotation.y, progress);
        });
    }
    renderer.render( scene, camera );
}