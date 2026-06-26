import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Camera Trajectory
const spiralPoints = [];
const turns = 2;
const height = 60;
const radius = 5;
const pointCount = 200;
for (let i = 0; i < pointCount; i++) {
    const t = (i / pointCount) * turns * Math.PI * 2;
    const x = radius * Math.cos(t);
    const y = (i / pointCount) * height - height / 2;
    const z = radius * Math.sin(t);
    spiralPoints.push(new THREE.Vector3(x, y, z));
}
const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);

// Scroll-based Camera Movement
let scrollProgress = 0;
window.addEventListener('wheel', (e) => {
    scrollProgress += 0.001 * e.deltaY;
    scrollProgress = Math.max(0, Math.min(1, scrollProgress));
} );

// Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.set( 0, 0, 2 );

// Light
const pointLight = new THREE.PointLight(0xffffff, 1000);
const pointLight2 = new THREE.PointLight(0xffffff, 1000);
pointLight.position.set(5, 0, 5);
pointLight2.position.set(-5, 40, -5);
scene.add(pointLight, pointLight2);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Geometry
const whiteMaterial = new THREE.MeshStandardMaterial( { 
    color: 0xffffff,
} );
const gltfLoader = new GLTFLoader();
gltfLoader.load('/spine machine light.glb', ( gltf ) => {
    const laboratory = gltf.scene;
    laboratory.position.set(0, 0, 0);
    laboratory.traverse( ( child ) => {
        if ( child.isMesh ) {
            const edges = new THREE.EdgesGeometry( child.geometry );
            const edgeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
            const edgeLines = new THREE.LineSegments( edges, edgeMaterial );
            child.add( edgeLines );
            child.material = whiteMaterial;
        }
    } );
    scene.add( laboratory );
} );

// Animate
function animate() {
    const point = spiralCurve.getPoint(scrollProgress);
    camera.position.copy(point);
    camera.lookAt(0, camera.position.y + 1, 0);
  renderer.render( scene, camera );
}