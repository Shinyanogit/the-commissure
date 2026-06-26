import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { texture } from 'three/tsl';

// Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 0.01, 100 );
camera.position.set( 0.12, 0.34, 0.04 );

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild( renderer.domElement );
renderer.setAnimationLoop( animate );

// Control
const controls = new OrbitControls(camera, renderer.domElement);

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
let backgroundTexture;
loader.load('/background.jpg', ( texture ) => {
    backgroundTexture = texture;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.matrixAutoUpdate = false;
    updateBackground(texture);
    scene.background = texture;
} );
function updateBackground(texture) {
    const screenAspect = window.innerWidth / window.innerHeight;
    const imageAspect = texture.image.width / texture.image.height;
    if (screenAspect < imageAspect) {
        texture.matrix.setUvTransform(
            (1 - screenAspect / imageAspect) / 2,
            0,
            screenAspect / imageAspect,
            1,
            0,
            0,
            0
        );
    } else {
        texture.matrix.setUvTransform(
            0,
            (1 - imageAspect / screenAspect) / 2,
            1,
            imageAspect / screenAspect,
            0,
            0,
            0
        );
    }
};

// Text
const scene0 = document.querySelectorAll('.scene0');
const scene1 = document.querySelectorAll('.scene1');
const scene2 = document.querySelectorAll('.scene2');
const scene3 = document.querySelectorAll('.scene3');
const scene4 = document.querySelectorAll('.scene4');
const scene5 = document.querySelectorAll('.scene5');
scene0.forEach(text => {
    text.style.opacity = 1;
    text.style.display = 'block';
});

// Geometry
let c5Structure = [];
let c5Disc = [];
let spacer = null;
let fixationPlate =[];
let fixationScrew = [];
const gltfLoader = new GLTFLoader();
gltfLoader.load('/Anterior Cervical Discectomy and Fusion (ACDF).glb', ( gltf ) => {
    const pcdf = gltf.scene;
    pcdf.traverse((child) => {
        if (child.isMesh) {
            if (child.name.includes('bone')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0xF0E6D4, 
                    transparent: true,
                    opacity: 0
                });
                if (child.name.includes('c5')) {
                    c5Structure.push(child);
                };
            } else if (child.name.includes('disk')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xF2E9E4,
                    transparent: true,
                    opacity: 0
                });
                if (child.name.includes('c4-c5')) {
                    c5Structure.push(child);
                    c5Disc.push(child);
                };
            } else if (child.name.includes('pulposus')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xD4EBF2,
                    transparent: true,
                    opacity: 0,
                    roughness: 0.5,
                    metalness: 0.5
                });
                c5Structure.push(child);
                c5Disc.push(child);
            } else if (child.name.includes('ligament')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xF5F2EB,
                    transparent: true,
                    opacity: 0
                });
            } else if (child.name.includes('nerve')) {
                if (child.name.includes('medulla')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xBD9C46,
                        transparent: true,
                        opacity: 0
                    });
                } else {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xFFDB58,
                        transparent: true,
                        opacity: 0
                    });
                }
                if (child.name.includes('c5')) {
                    c5Structure.push(child);
                };
            } else if (child.name.includes('spacer')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xD9DAD9,
                    metalness: 0.5,
                    roughness: 0.5,
                    transparent: false,
                    opacity: 1
                });
                child.rotateX(- 2 * Math.PI / 9);
                child.position.z += 0.2;
                spacer = child;
            } else if (child.name.includes('screw')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0x29AB87,
                    metalness: 0.5,
                    roughness: 0.5,
                    transparent: true,
                    opacity: 1
                });
                fixationScrew.push(child);
            } else if (child.name.includes('plate')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0xAAA9AD ,
                    metalness: 0.5,
                    roughness: 0.5,
                    transparent: true,
                    opacity: 1
                });
                fixationPlate.push(child);
            }
        }
    });
    fixationScrew.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)[0]);
        const numB = parseInt(b.name.match(/\d+/)[0]);
        return numA - numB;
    });
    pcdf.position.set(0, 0, 0);
    scene.add( pcdf );
});

// Animate
function animate() {
    camera.lookAt(0, 0.2, 0.22);
    renderer.render( scene, camera );
}