import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

// Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.set( 0, 0, 0.2 );

// Camera Trajectory
const spiralPoints = [];
const turns = 0.5;
const height = 0.2;
const radius = 0.2;
const pointCount = 100;
for (let i = 0; i < pointCount; i++) {
    const t = - (i / pointCount) * turns * Math.PI * 2 + Math.PI / 2;
    const x = radius * Math.cos(t);
    const y = (i / pointCount) * height - height / 2;
    const z = radius * Math.sin(t);
    spiralPoints.push(new THREE.Vector3(x, y + 0.1, z));
}
const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(spiralCurve.getPoints(100)),
    new THREE.LineBasicMaterial({ color: 0xff0000 })
));

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
let removedBone = null;
let removedLigament = null;
let screwShaft = [];
let screwSaddle = [];
let screwCap = [];
let rod = [];
gltfLoader.load('/posterior cervical decompression and fusion (PCDF).glb', ( gltf ) => {
    const pcdf = gltf.scene;
    pcdf.traverse((child) => {
        if (child.isMesh) {
            if (child.name.includes('disk')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xF2E9E4 });
            } else if (child.name.includes('nerve')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xFAD02C });
            } else if (child.name.includes('removed') && child.name.includes('bone')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xF0E6D4 });
                removedBone = child;
            } else if (child.name.includes('removed') && child.name.includes('ligament')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xF5F2EB });
                removedLigament = child;
            } else if (child.name.includes('bone')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xF0E6D4 });
            } else if (child.name.includes('shaft')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0xAAA9AD,
                    metalness: 0.5,
                    roughness: 0.5
                });
                child.position.z -= 0.2;
                screwShaft.push(child);
            } else if (child.name.includes('saddle')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0x009DC4,
                    metalness: 0.5,
                    roughness: 0.5
                });
                child.position.z -= 0.2;
                screwSaddle.push(child);
            } else if (child.name.includes('cap')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0xE5E4E2,
                    metalness: 0.5,
                    roughness: 0.5
                });
                child.position.z -= 0.2;
                screwCap.push(child);
            } else if (child.name.includes('rod')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0xAAA9AD ,
                    metalness: 0.5,
                    roughness: 0.5
                });
                child.position.y -= 0.2;
                rod.push(child);
            }
        }
    });
    screwShaft.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)[0]);
        const numB = parseInt(b.name.match(/\d+/)[0]);
        return numA - numB;
    });
    screwSaddle.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)[0]);
        const numB = parseInt(b.name.match(/\d+/)[0]);
        return numA - numB;
    });
    screwCap.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)[0]);
        const numB = parseInt(b.name.match(/\d+/)[0]);
        return numA - numB;
    });
    rod.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)[0]);
        const numB = parseInt(b.name.match(/\d+/)[0]);
        return numA - numB;
    });
    pcdf.position.set(0, 0, 0);
    scene.add( pcdf );
});

const progress = { t: 0 };
window.addEventListener( 'click', () => {
    const tl = gsap.timeline();
    tl.to(progress, {
        t: 1,
        duration: 1,
        ease: 'power2.inOut',
        onUpdate: () => {
            const point = spiralCurve.getPoint(progress.t);
            camera.position.copy(point);
        }
    });
    if (removedBone && removedLigament) {
        tl.to([removedBone.position, removedLigament.position], {
            z: '-=0.2',
            duration: 1,
            ease: 'power2.inOut'
        });
    }
    if (screwShaft && screwSaddle && screwCap && rod) {
        let screwStartTime = tl.duration();
        screwShaft.forEach((shaft, index) => {
            const saddle = screwSaddle[index];
            tl.to(
                [shaft.position, saddle.position], 
                {
                    z: '+=0.2',
                    duration: 1,
                    ease: 'power2.inOut'
                },
                screwStartTime + index * 0.1
            );
        });
        let rodStartTime = tl.duration();
        rod.forEach((rod, index) => {
            tl.to(
                rod.position, 
                {
                    y: '+=0.2',
                    duration: 1,
                    ease: 'power2.inOut'
                }, 
                rodStartTime + index * 0.1
            );
        });
        let capStartTime = tl.duration();
        screwCap.forEach((cap, index) => {
            tl.to(
                cap.position, 
                {
                    z: '+=0.2',
                    duration: 1,
                    ease: 'power2.inOut'
                },
                capStartTime + index * 0.1
            );
        });
    }
});

// Animate
function animate() {
    camera.lookAt(0, 0.2, 0);
    renderer.render( scene, camera );
}