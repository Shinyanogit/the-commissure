import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

// Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.up.set(0, 1, 0);
camera.position.set( 0.2, 0.2, 0 );
const cameraTarget = new THREE.Vector3(0, 0.2, 0);

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
let cranium = null;
let c1Bone = null;
let c2Bone = null;
let c3Bone = null;
let c4Bone = null;
let c5Structure = [];
let c6Bone = null;
let c7Bone = null;
let removedStructure = [];
const gltfLoader = new GLTFLoader();
gltfLoader.load('/posterior cervical decompression and fusion (PCDF).glb', ( gltf ) => {
    const pcdf = gltf.scene;
    pcdf.traverse((child) => {
        if (child.isMesh) {
            if (child.name.includes('bone')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0xF0E6D4, 
                    transparent: true,
                    opacity: 1
                });
                if (child.name.includes('cranium')) {
                    cranium = child;
                } else if (child.name.includes('c1')) {
                    c1Bone = child;
                } else if (child.name.includes('c2')) {
                    c2Bone = child;
                } else if (child.name.includes('c3')) {
                    c3Bone = child;
                } else if (child.name.includes('c4')) {
                    c4Bone = child;
                } else if (child.name.includes('c5') && !child.name.includes('removed')) {
                    c5Structure.push(child);
                } else if (child.name.includes('c5') && child.name.includes('removed')) {
                    c5Structure.push(child);
                } else if (child.name.includes('c6')) {
                    c6Bone = child;
                } else if (child.name.includes('c7')) {
                    c7Bone = child;
                }
                if (child.name.includes('removed')) {
                    removedStructure.push(child);
                }
            } else if (child.name.includes('disk')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xF2E9E4,
                    transparent: true,
                    opacity: 1
                });
            } else if (child.name.includes('ligament')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xF5F2EB,
                    transparent: true,
                    opacity: 1
                });
                if (child.name.includes('removed')) {
                    removedStructure.push(child);
                }
            } else if (child.name.includes('nerve')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xFFDB58,
                    transparent: true,
                    opacity: 1
                });
                if (child.name.includes('c5')) {
                    c5Structure.push(child);
                }
            } else if (child.name.includes('screw')) {
                if (child.name.includes('shaft')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0xAAA9AD,
                        metalness: 0.5,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0
                     });
                } else if (child.name.includes('saddle')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0x009DC4,
                        metalness: 0.5,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0
                    });
                } else if (child.name.includes('cap')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0xE5E4E2,
                        metalness: 0.5,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0
                    });
                }
            } else if (child.name.includes('rod')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0xAAA9AD ,
                    metalness: 0.5,
                    roughness: 0.5,
                    transparent: true,
                    opacity: 0
                });
            }
        }
    });
    pcdf.position.set(0, 0, 0);
    scene.add( pcdf );
});

// Click
let clickCount = 0;
window.addEventListener( 'click', () => {
    clickCount++;
    const tl = gsap.timeline();
    if (clickCount === 1) {
        let cameraStartTime = tl.duration();
        tl.to(camera.position, {
            x: 0,
            y: 0.2,
            z: -0.5,
            duration: 1,
            ease: 'power2.inOut'
        }, cameraStartTime);
        tl.to(cameraTarget, {
            x: 0,
            y: 0.2,
            z: 0,
            duration: 1,
            ease: 'power2.inOut'
        }, cameraStartTime);
        let laminectomyStartTime = tl.duration();
        removedStructure.forEach(removedstructure => {
            tl.to(removedstructure.material, {
                opacity: 0,
                duration: 1,
                ease: 'power2.inOut'
            }, laminectomyStartTime);
        });
    }
});

// Animate
const dummy = new THREE.Object3D();
function animate() {
    camera.lookAt(cameraTarget);
    renderer.render( scene, camera );
}