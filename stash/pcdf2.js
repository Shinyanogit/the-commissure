import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

// Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.set( 0.2, 0.2, 0 );

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
let cranium = null;
let c1 = null;
let c2 = null;
let c3 = null;
let c4 = null;
let c5 = null;
let c6 = null;
let c7 = null;
let removedBone = null;
let ligament = [];
let removedLigament = null;
let disk = [];
let nerve = [];
let screwShaft = [];
let screwSaddle = [];
let screwCap = [];
let rod = [];
gltfLoader.load('/posterior cervical decompression and fusion (PCDF).glb', ( gltf ) => {
    const pcdf = gltf.scene;
    pcdf.traverse((child) => {
        if (child.isMesh) {
            if (child.name.includes('disk')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xF2E9E4, transparent: true, opacity: 1 });
                disk.push(child);
            } else if (child.name.includes('ligament')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xF5F2EB, transparent: true, opacity: 1 });
                ligament.push(child);
            } else if (child.name.includes('nerve')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xFAD02C, transparent: true, opacity: 1 });
                nerve.push(child);
            } else if (child.name.includes('removed')) {
                child.visible = false;
            } else if (child.name.includes('bone')) {
                child.material = new THREE.MeshStandardMaterial({ color: 0xF0E6D4 });
                if (child.name.includes('c7')) {
                    c7 = child;
                    // child.rotateX(Math.PI / 80);
                    // child.position.z += 0.001;
                }
                if (child.name.includes('c6')) {
                    c6 = child;
                    // child.rotateX(Math.PI / 40);
                    // child.position.z += 0.004;
                }
                if (child.name.includes('c5')) {
                    c5 = child;
                    // child.rotateX(Math.PI / 20);
                    // child.position.z += 0.007;
                }
                if (child.name.includes('c4')) {
                    c4 = child;
                    // child.rotateX(Math.PI / 10);
                    // child.position.z += 0.013;
                }
                if (child.name.includes('c3')) {
                    c3 = child;
                    // child.rotateX(Math.PI / 5);
                    // child.position.z += 0.023;
                }
                if (child.name.includes('c2')) {
                    c2 = child;
                    // child.rotateX(Math.PI / 5);
                    // child.position.z += 0.04;
                    // child.position.y -= 0.005;
                }
                if (child.name.includes('c1')) {
                    c1 = child;
                    // child.rotateX(Math.PI / 5);
                    // child.position.z += 0.045;
                    // child.position.y -= 0.01;
                }
                if (child.name.includes('cranium')) {
                    cranium = child;
                    // child.rotateX(Math.PI / 5);
                    // child.position.z += 0.05;
                    // child.position.y -= 0.05;
                }
            } else if (child.name.includes('screw')) {
                child.visible = false;
            } else if (child.name.includes('rod')) {
                child.visible = false;
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
window.addEventListener( 'click', () => {
    if (nerve.length > 0) {
        nerve.forEach((nerve) => {
            gsap.to(nerve.material, {
                opacity: 0,
                duration: 1,
                ease: 'power2.inOut'
            });
        });
    }
    if (ligament.length > 0) {
        ligament.forEach((ligament) => {
            gsap.to(ligament.material, {
                opacity: 0,
                duration: 1,
                ease: 'power2.inOut'
            });
        });
    }
    if (disk.length > 0) {
        disk.forEach((disk) => {
            gsap.to(disk.material, {
                opacity: 0,
                duration: 1,
                ease: 'power2.inOut'
            });
        });
    }
    if (cranium) {
        gsap.to(cranium.rotation, {
            x: '+=' + Math.PI / 5,
            duration: 2,
            ease: 'power2.inOut'
        });
        gsap.to(cranium.position, {
            z: '+=0.05',
            y: '-=0.05',
            duration: 2,
            ease: 'power2.inOut'
        });
    }
    if (c1) {
        gsap.to(c1.rotation, {
            x: '+=' + Math.PI / 5,
            duration: 2,
            ease: 'power2.inOut'
        });
        gsap.to(c1.position, {
            z: '+=0.045',
            y: '-=0.01',
            duration: 2,
            ease: 'power2.inOut'
        });
    }
    if (c2) {
        gsap.to(c2.rotation, {
            x: '+=' + Math.PI / 5,
            duration: 2,
            ease: 'power2.inOut'
        });
        gsap.to(c2.position, {
            z: '+=0.04',
            y: '-=0.005',
            duration: 2,
            ease: 'power2.inOut'
        });
    }
    if (c3) {
        gsap.to(c3.rotation, {
            x: '+=' + Math.PI / 5,
            duration: 2,
            ease: 'power2.inOut'
        });
        gsap.to(c3.position, {
            z: '+=0.023',
            duration: 2,
            ease: 'power2.inOut'
        });
    }
    if (c4) {
        gsap.to(c4.rotation, {
            x: '+=' + Math.PI / 10,
            duration: 2,
            ease: 'power2.inOut'
        });
        gsap.to(c4.position, {
            z: '+=0.013',
            duration: 2,
            ease: 'power2.inOut'
        });
    }
    if (c5) {
        gsap.to(c5.rotation, {
            x: '+=' + Math.PI / 20,
            duration: 2,
            ease: 'power2.inOut'
        });
        gsap.to(c5.position, {
            z: '+=0.007',
            duration: 2,
            ease: 'power2.inOut'
        });
    }
    if (c6) {
        gsap.to(c6.rotation, {
            x: '+=' + Math.PI / 40,
            duration: 2,
            ease: 'power2.inOut'
        });
        gsap.to(c6.position, {
            z: '+=0.004',
            duration: 2,
            ease: 'power2.inOut'
        });
    }
    if (c7) {
        gsap.to(c7.rotation, {
            x: '+=' + Math.PI / 80,
            duration: 2,
            ease: 'power2.inOut'
        });
        gsap.to(c7.position, {
            z: '+=0.001',
            duration: 2,
            ease: 'power2.inOut'
        });
    }
});

// Animate
function animate() {
    camera.lookAt(0, 0.2, 0);
    renderer.render( scene, camera );
}