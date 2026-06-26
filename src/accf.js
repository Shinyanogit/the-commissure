import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { or, rotate, texture } from 'three/tsl';

// Navigation
const hamburger = document.querySelector('.hamburger');
const navList = document.querySelector('.nav-list');
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navList.classList.toggle('active');
});

// Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e2841);
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 100 );
camera.up.set(0, 1, 0);
camera.position.set( 0.2, 0.2, 0 );
const cameraTarget = new THREE.Vector3(0, 0.2, 0);

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
const scene6 = document.querySelectorAll('.scene6');
scene0.forEach(text => {
    text.style.opacity = 1;
    text.style.display = 'block';
});

// Geometry
let c5Structure = [];
let c5Transparent = [];
let removedBone = [];
let removedDisc = [];
let cage = [];
let shaft = null;
let plate = null;
let screw = [];
const gltfLoader = new GLTFLoader();
gltfLoader.load('/Anterior Cervical Corpectomy and Fusion (ACCF).glb', ( gltf ) => {
    const accf = gltf.scene;
    accf.traverse((child) => {
        if (child.isMesh) {
            if (child.name.includes('bone')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0xF0E6D4, 
                    transparent: false,
                    opacity: 1
                });
                if (child.name.includes('c5')) {
                    c5Structure.push(child);
                    if (child.name.includes('transparent')) {
                        c5Transparent.push(child);
                    }
                };
                if (child.name.includes('removed')) {
                    removedBone.push(child);
                };
            } else if (child.name.includes('disk')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xF2E9E4,
                    transparent: false,
                    opacity: 1
                });
                if (child.name.includes('c4-c5') | child.name.includes('c5-c6')) {
                    c5Structure.push(child);
                    removedDisc.push(child);
                }
            } else if (child.name.includes('pulposus')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xD4EBF2,
                    transparent: false,
                    opacity: 1,
                    roughness: 0.5,
                    metalness: 0.5
                });
                if (child.name.includes('c4-c5') | child.name.includes('c5-c6')) {
                    c5Structure.push(child);
                    removedDisc.push(child);
                }
            } else if (child.name.includes('ligament')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xF5F2EB,
                    transparent: false,
                    opacity: 1
                });
            } else if (child.name.includes('nerve')) {
                if (child.name.includes('medulla')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xBD9C46,
                        transparent: false,
                        opacity: 1
                    });
                    c5Structure.push(child);
                } else {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xFFDB58,
                        transparent: false,
                        opacity: 1
                    });
                    if (child.name.includes('c5')) {
                       c5Structure.push(child); 
                    };
                }
            } else if (child.name.includes('cage')) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xD9DAD9,
                    metalness: 0.5,
                    roughness: 0.5,
                    transparent: true,
                    opacity: 0
                });
                child.position.z += 0.4
                cage.push(child);
                if (child.name.includes('shaft')) {
                    shaft = child;
                }
            } else if (child.name.includes('plate')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0xAAA9AD ,
                    metalness: 0.5,
                    roughness: 0.5,
                    transparent: true,
                    opacity: 0
                });
                child.position.z += 0.2
                plate = child;
            } else if (child.name.includes('screw')) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0xC11C84,
                    metalness: 0.5,
                    roughness: 0.5,
                    transparent: true,
                    opacity: 0
                });
                child.position.z += 0.2
                screw.push(child);
            };
        }
    });
    screw.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)[0]);
        const numB = parseInt(b.name.match(/\d+/)[0]);
        return numA - numB;
    });
    accf.position.set(0, 0, 0);
    scene.add( accf );
});

// Wheel
let isAnimating = false;
let sceneCount = 0;
window.addEventListener('wheel', (event) => {
    if (isAnimating) return
    isAnimating = true;
    if (event.deltaY > 0) {
        sceneCount++;
        transferScene(sceneCount);
    } else {
        setTimeout(() => {
            isAnimating = false;
        }, 2000);
    }
});
function transferScene(sceneCount) {
    const sceneStartTime = Date.now();
    const tl = gsap.timeline({
        onComplete: () => {
            const sceneElapseTime = Date.now() - sceneStartTime;
            if (sceneElapseTime < 2000) {
                setTimeout(() => {
                    isAnimating = false;
                }, 2000 - sceneElapseTime)
            } else {
                isAnimating = false;
            }
        }
    });
    if (sceneCount === 1) {
        tl.to(camera.position, {
            x: 0,
            y: 0.4,
            z: -0.9,
            duration: 1,
            ease: 'power2.inOut'
        }, 0);
        tl.to(cameraTarget, {
            x: 0,
            y: 0.2,
            z: -1,
            duration: 1,
            ease: 'power2.inOut'
        }, 0);
        tl.to(camera.up, {
            x: 0,
            y: 0,
            z: -1,
            duration: 1,
            ease: 'power2.inOut'
        }, 0);
        tl.to(camera, {
            fov: 25,
            duration: 1,
            ease: 'power2.inOut',
            onUpdate: () => {
                camera.updateProjectionMatrix();
            }
        }, 0);
        c5Structure.forEach((c5structure) => {
            tl.to(c5structure.position, {
                z: '-=1',
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
        });
    } else if (sceneCount === 2) {
        tl.to(camera.position, {
            x: 0.2,
            y: 0.2,
            z: -1,
            duration: 1,
            ease: 'power2.inOut'
        }, 0);
        tl.to(cameraTarget, {
            x: 0,
            y: 0.2,
            z: -1,
            duration: 1,
            ease: 'power2.inOut'
        }, 0);
        tl.to(camera.up, {
            x: 0,
            y: 1,
            z: 0,
            duration: 1,
            ease: 'power2.inOut'
        }, 0);
        let transparentStartTime = tl.duration();
        c5Transparent.forEach((c5transparent) => {
            c5transparent.material.transparent = true;
            c5transparent.material.needsUpdate = true;
            tl.to(c5transparent.material, {
                opacity: 0,
                duration: 1,
                ease: 'power2.inOut'
            }, transparentStartTime);
        });
    }
    // if (sceneCount === 1) {
    //     tl.to(camera.position, {
    //         x: 0,
    //         y: 0.1,
    //         z: 0.2,
    //         duration: 1,
    //         ease: 'power2.inOut'
    //     }, 0);
    //     tl.to(cameraTarget, {
    //         x: 0,
    //         y: 0.2,
    //         z: 0,
    //         duration: 1,
    //         ease: 'power2.inOut'
    //     }, 0);
    //     tl.to(camera, {
    //         fov: 25,
    //         duration: 1,
    //         ease: 'power2.inOut',
    //         onUpdate: () => {
    //             camera.updateProjectionMatrix();
    //         }
    //     }, 0);
    //     let discectomyStartTime = tl.duration();
    //     if (removedDisc.length > 0) {
    //         removedDisc.forEach(disc => {
    //             disc.material.transparent = true;
    //             disc.material.needsUpdate = true;
    //             tl.to(disc.material, {
    //                 opacity: 0,
    //                 duration: 1,
    //                 ease: 'power2.inOut',
    //             }, discectomyStartTime);
    //         });
    //     };
    //     let corpectomyStartTime = tl.duration();
    //     if (removedBone.length > 0) {
    //         removedBone.forEach(bone => {
    //             bone.material.transparent = true;
    //             bone.material.needsUpdate = true;
    //             tl.to(bone.material, {
    //                 opacity: 0,
    //                 duration: 1,
    //                 ease: 'power2.inOut'
    //             }, corpectomyStartTime);
    //         });
    //     };
    // }
    // else if (sceneCount == 2) {
    //     tl.to(camera.position, {
    //         x: -0.1,
    //         y: 0.1,
    //         z: 0.2,
    //         duration: 1,
    //         ease: 'power2.inOut'
    //     }, 0);
    //     tl.to(cameraTarget, {
    //         x: 0,
    //         y: 0.2,
    //         z: 0,
    //         duration: 1,
    //         ease: 'power2.inOut'
    //     }, 0);
    //     if (cage.length > 0) {
    //         cage.forEach(instrument => {
    //             instrument.material.transparent = true;
    //             instrument.material.needsUpdate = true;
    //             tl.to(instrument.material, {
    //                 opacity: 1,
    //                 duration: 0,
    //                 ease: 'power2.inOut',
    //                 onComplete: () => {
    //                     instrument.material.transparent = false;
    //                     instrument.material.needsUpdate = true;
    //                 }
    //             }, 0);
    //             tl.to(instrument.position, {
    //                 z: '-=0.4',
    //                 duration: 1,
    //                 ease: 'power2.inOut'
    //             }, 0);
    //         });
    //     };
    //     let extensionStartTime = tl.duration();
    //     if (shaft) {
    //         tl.to(shaft.position, {
    //             y: '+=0.0025',
    //             z: '+=0.00125',
    //             duration: 2,
    //             ease: 'power2.inOut'
    //         }, extensionStartTime);
    //     }
    // } 
    else if (sceneCount == 3) {
        tl.to(camera.position, {
            x: 0.2,
            y: 0.2,
            z: 0.4,
            duration: 1,
            ease: 'power2.inOut'
        }, 0);
        tl.to(cameraTarget, {
            x: 0,
            y: 0.2,
            z: 0,
            duration: 1,
            ease: 'power2.inOut'
        }, 0);
        tl.to(camera, {
            fov: 15,
            duration: 1,
            ease: 'power2.inOut',
            onUpdate: () => {
                camera.updateProjectionMatrix();
            }
        }, 0);
        let plateStartTime = tl.duration();
        if (plate) {
            tl.to(plate.material, {
                opacity: 1,
                duration: 1,
                ease: 'power2.inOut',
                onComplete: () => {
                    plate.material.transparent = false;
                    plate.material.needsUpdate = true;
                }
            }, plateStartTime);
            tl.to(plate.position, {
                z: '-=0.2',
                duration: 1,
                ease: 'power2.inOut'
            }, plateStartTime)
        }
        let screwStartTime = tl.duration();
        if (screw.length > 0) {
            screw.forEach((screw, index) => {
                tl.to(screw.material, {
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        screw.material.transparent = false;
                        screw.material.needsUpdate = true;
                    }
                }, screwStartTime + index * 0.1);
                tl.to(
                    screw.position, 
                    {
                        z: '-=0.2',
                        duration: 1,
                        ease: 'power2.inOut'
                    },
                    screwStartTime + index * 0.1
                );
            })
        }
    } else if (sceneCount == 4) {
        tl.to(camera.position, {
            x: -0.2,
            y: 0.1,
            z: 0.2,
            duration: 1,
            ease: 'power2.inOut'
        }, 0);
        tl.to(cameraTarget, {
            x: 0,
            y: 0.2,
            z: 0,
            duration: 1,
            ease: 'power2.inOut'
        }, 0);
        tl.to(camera, {
            fov: 25,
            duration: 1,
            ease: 'power2.inOut',
            onUpdate: () => {
                camera.updateProjectionMatrix();
            }
        }, 0);
        // tl.to(camera.position, {
        //     x: -0.1,
        //     y: 0.1,
        //     z: 0.2,
        //     duration: 1,
        //     ease: 'power2.inOut'
        // }, 0);
        // tl.to(cameraTarget, {
        //     x: 0,
        //     y: 0.2,
        //     z: 0,
        //     duration: 1,
        //     ease: 'power2.inOut'
        // }, 0);
    };
};

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (backgroundTexture) updateBackground(backgroundTexture)
});

// Animate
function animate() {
    camera.lookAt(cameraTarget);
    renderer.render( scene, camera );
}