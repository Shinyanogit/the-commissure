import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { texture } from 'three/tsl';

export function initPcdfScene(mount, root, sceneCount, currentScene, setCurrentScene) {
    let disposed = false;
    const activeTimelines = new Set();
    const timeoutIds = new Set();
    const delay = (callback, ms) => {
        const id = window.setTimeout(() => {
            timeoutIds.delete(id);
            callback();
        }, ms);
        timeoutIds.add(id);
        return id;
    };

    // Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.up.set(0, 1, 0);
    camera.position.set( 0.2, 0.2, 0 );
    const cameraTarget = new THREE.Vector3(0, 0.2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild( renderer.domElement );
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
    loader.load('/background.webp', ( texture ) => {
        if (disposed) return;
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

    // Geometry
    let cranium = null;
    let c1Bone = null;
    let c2Bone = null;
    let c3Bone = null;
    let c4Bone = null;
    let c5Structure = [];
    let c6Bone = null;
    let c7Bone = null;
    let disk = [];
    let ligament = [];
    let nerve = [];
    let removedStructure = [];
    let screwShaft = [];
    let screwSaddle = [];
    let screwCap = [];
    let rod = [];
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('/Posterior Cervical Decompression and Fusion (PCDF) Light.glb', ( gltf ) => {
        if (disposed) return;
        const pcdf = gltf.scene;
        pcdf.traverse((child) => {
            if (child.isMesh) {
                if (child.name.includes('bone')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0xF0E6D4, 
                        transparent: false,
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
                        transparent: false,
                        opacity: 1
                    });
                    disk.push(child);
                } else if (child.name.includes('ligament')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xF5F2EB,
                        transparent: false,
                        opacity: 1
                    });
                    ligament.push(child);
                    if (child.name.includes('removed')) {
                        removedStructure.push(child);
                    }
                } else if (child.name.includes('nerve')) {
                    nerve.push(child);
                    if (child.name.includes('medulla')) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xBD9C46,
                            transparent: false,
                            opacity: 1
                        });
                    } else {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xFFDB58,
                            transparent: false,
                            opacity: 1
                        });
                    }
                    if (child.name.includes('c5')) {
                        c5Structure.push(child);
                    };
                } else if (child.name.includes('screw')) {
                    if (child.name.includes('shaft')) {
                        child.material = new THREE.MeshStandardMaterial({ 
                            color: 0xAAA9AD,
                            metalness: 0.5,
                            roughness: 0.5,
                            transparent: true,
                            opacity: 0
                        });
                        child.position.z -= 0.2;
                        screwShaft.push(child);
                    } else if (child.name.includes('saddle')) {
                        child.material = new THREE.MeshStandardMaterial({ 
                            color: 0x009DC4,
                            metalness: 0.5,
                            roughness: 0.5,
                            transparent: true,
                            opacity: 0
                        });
                        child.position.z -= 0.2;
                        screwSaddle.push(child);
                    } else if (child.name.includes('cap')) {
                        child.material = new THREE.MeshStandardMaterial({ 
                            color: 0xE5E4E2,
                            metalness: 0.5,
                            roughness: 0.5,
                            transparent: true,
                            opacity: 0
                        });
                        child.position.z -= 0.2;
                        screwCap.push(child);
                    }
                } else if (child.name.includes('rod')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0xAAA9AD ,
                        metalness: 0.5,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0
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

    // Wheel + touch swipe support
    let isAnimating = false;
    let touchStartY = null;
    const TOUCH_SWIPE_THRESHOLD = 40;
    const handleWheel = (event) => {
        if (isAnimating) return;
        isAnimating = true;
        if (event.deltaY > 0) {
            if (currentScene >= sceneCount - 1) {
                isAnimating = false;
                return;
            } else {
                currentScene++;
            }
            transferScene(currentScene);
        } else {
            delay(() => {
                isAnimating = false;
            }, 2000);
        }
    };
    const handleTouchStart = (event) => {
        if (event.touches.length !== 1) return;
        touchStartY = event.touches[0].clientY;
    };
    const handleTouchEnd = (event) => {
        if (isAnimating || touchStartY === null) {
            touchStartY = null;
            return;
        }
        const touchEndY = event.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        touchStartY = null;
        if (deltaY > TOUCH_SWIPE_THRESHOLD) {
            isAnimating = true;
            if (currentScene >= sceneCount - 1) {
                isAnimating = false;
                return;
            } else {
                currentScene++;
            }
            transferScene(currentScene);
        } else {
            delay(() => {
                isAnimating = false;
            }, 2000);
        }
    };
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    function transferScene(currentScene) {
        const sceneStartTime = Date.now();
        const tl = gsap.timeline({
            onComplete: () => {
                const sceneElapseTime = Date.now() - sceneStartTime;
                if (sceneElapseTime < 2000) {
                    delay(() => {
                        isAnimating = false;
                    }, 2000 - sceneElapseTime)
                } else {
                    isAnimating = false;
                }
            }
        });
        activeTimelines.add(tl);
        tl.to('.text', {
            opacity: 0,
            y: -10,
            duration: 0.5,
            ease: 'power2.inOut'
        });
        tl.add(() => {
            setCurrentScene(currentScene);
        });
        tl.add(() => {
            requestAnimationFrame(() => {
                tl.fromTo('.text',
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.inOut' }
                );
            })
        });
        if (currentScene === 1) {
            tl.to(camera.position, {
                x: 0,
                y: 0.4,
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
        } else if (currentScene === 2) {
            c5Structure.forEach((c5structure) => {
                tl.to(c5structure.position, {
                    z: '+=1',
                    duration: 1,
                    ease: 'power2.inOut'
                }, 0);
            });
            tl.to(camera.position, {
                x: -0.2,
                y: 0.2,
                z: 0,
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
            tl.to(camera.up, {
                x: 0,
                y: 1,
                z: 0,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
            tl.to(camera, {
                fov: 75,
                duration: 1,
                ease: 'power2.inOut',
                onUpdate: () => {
                    camera.updateProjectionMatrix();
                }
            }, 0);
            let cameraStartTime = tl.duration();
            tl.to(camera.position, {
                x: 0,
                y: 0.2,
                z: -0.2,
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
                removedstructure.material.transparent = true;
                removedstructure.material.needsUpdate = true;
                tl.to(removedstructure.material, {
                    opacity: 0,
                    duration: 1,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        removedstructure.visible = false;
                    }
                }, laminectomyStartTime);
            });
        } else if (currentScene === 3) {
            tl.to(camera.position, {
                x: 0.2,
                y: 0.2,
                z: 0,
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
            if (disk.length > 0) {
                disk.forEach(disk => {
                    disk.material.transparent = true;
                    disk.material.needsUpdate = true;
                    tl.to(disk.material, {
                        opacity: 0,
                        duration: 1,
                        ease: 'power2.inOut',
                    }, 0);
                });
            }
            if (ligament.length > 0) {
                ligament.forEach(ligament => {
                    ligament.material.transparent = true;
                    ligament.material.needsUpdate = true;
                    tl.to(ligament.material, {
                        opacity: 0,
                        duration: 1,
                        ease: 'power2.inOut',
                    }, 0);
                });
            }
            if (nerve.length > 0) {
                nerve.forEach(nerve => {
                    nerve.material.transparent = true;
                    nerve.material.needsUpdate = true;
                    tl.to(nerve.material, {
                        opacity: 0,
                        duration: 1,
                        ease: 'power2.inOut',
                    }, 0);
                });
            }
            let kyphosisStartTime = tl.duration();
            if (cranium) {
                tl.to(cranium.rotation, {
                    x: '+=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
                tl.to(cranium.position, {
                    z: '+=0.05',
                    y: '-=0.05',
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
            }
            if (c1Bone) {
                tl.to(c1Bone.rotation, {
                    x: '+=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
                tl.to(c1Bone.position, {
                    z: '+=0.045',
                    y: '-=0.01',
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
            }
            if (c2Bone) {
                tl.to(c2Bone.rotation, {
                    x: '+=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
                tl.to(c2Bone.position, {
                    z: '+=0.04',
                    y: '-=0.005',
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
            }
            if (c3Bone) {
                tl.to(c3Bone.rotation, {
                    x: '+=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
                tl.to(c3Bone.position, {
                    z: '+=0.023',
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
            }
            if (c4Bone) {
                tl.to(c4Bone.rotation, {
                    x: '+=' + Math.PI / 10,
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
                tl.to(c4Bone.position, {
                    z: '+=0.013',
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
            }
            if (c5Structure.length > 0) {
                tl.to(c5Structure[0].rotation, {
                    x: '+=' + Math.PI / 20,
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
                tl.to(c5Structure[0].position, {
                    z: '+=0.007',
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
            }
            if (c6Bone) {
                tl.to(c6Bone.rotation, {
                    x: '+=' + Math.PI / 40,
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
                tl.to(c6Bone.position, {
                    z: '+=0.004',
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
            }
            if (c7Bone) {
                tl.to(c7Bone.rotation, {
                    x: '+=' + Math.PI / 80,
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
                tl.to(c7Bone.position, {
                    z: '+=0.001',
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
            }
        } else if (currentScene === 4) {
            tl.to(camera.position, {
                x: 0,
                y: 0.2,
                z: -0.2,
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
            if (cranium) {
                tl.to(cranium.rotation, {
                    x: '-=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
                tl.to(cranium.position, {
                    z: '-=0.05',
                    y: '+=0.05',
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
            }
            if (c1Bone) {
                tl.to(c1Bone.rotation, {
                    x: '-=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
                tl.to(c1Bone.position, {
                    z: '-=0.045',
                    y: '+=0.01',
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
            }
            if (c2Bone) {
                tl.to(c2Bone.rotation, {
                    x: '-=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
                tl.to(c2Bone.position, {
                    z: '-=0.04',
                    y: '+=0.005',
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
            }
            if (c3Bone) {
                tl.to(c3Bone.rotation, {
                    x: '-=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
                tl.to(c3Bone.position, {
                    z: '-=0.023',
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
            }
            if (c4Bone) {
                tl.to(c4Bone.rotation, {
                    x: '-=' + Math.PI / 10,
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
                tl.to(c4Bone.position, {
                    z: '-=0.013',
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
            }
            if (c5Structure.length > 0) {
                tl.to(c5Structure[0].rotation, {
                    x: '-=' + Math.PI / 20,
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
                tl.to(c5Structure[0].position, {
                    z: '-=0.007',
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
            }
            if (c6Bone) {
                tl.to(c6Bone.rotation, {
                    x: '-=' + Math.PI / 40,
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
                tl.to(c6Bone.position, {
                    z: '-=0.004',
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
            }
            if (c7Bone) {
                tl.to(c7Bone.rotation, {
                    x: '-=' + Math.PI / 80,
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
                tl.to(c7Bone.position, {
                    z: '-=0.001',
                    duration: 2,
                    ease: 'power2.inOut'
                }, 0);
            }
            let visibleStartTime = tl.duration();
            if (disk.length > 0) {
                disk.forEach(disk => {
                    tl.to(disk.material, {
                        opacity: 1,
                        duration: 1,
                        ease: 'power2.inOut',
                        onComplete: () => {       
                            disk.material.transparent = false;
                            disk.material.needsUpdate = true;
                        }
                    }, visibleStartTime);
                });
            }
            if (ligament.length > 0) {
                ligament.forEach(ligament => {
                    tl.to(ligament.material, {
                        opacity: 1,
                        duration: 1,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            ligament.material.transparent = false;
                            ligament.material.needsUpdate = true;
                        }
                    }, visibleStartTime);
                });
            }
            if (nerve.length > 0) {
                nerve.forEach(nerve => {
                    tl.to(nerve.material, {
                        opacity: 1,
                        duration: 1,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            nerve.material.transparent = false;
                            nerve.material.needsUpdate = true;
                        }
                    }, visibleStartTime);
                });
            }
            let screwStartTime = tl.duration();
            if (screwShaft && screwSaddle) {
                screwShaft.forEach((shaft, index) => {
                    const saddle = screwSaddle[index];
                    shaft.material.needsUpdate = true;
                    tl.to(shaft.material, {
                        opacity: 1,
                        duration: 1,
                        ease: 'power2.inOut',
                        onComplete: () => {    
                            shaft.material.transparent = false;
                            shaft.material.needsUpdate = true;
                        }
                    }, screwStartTime + index * 0.1);
                    saddle.material.needsUpdate = true;
                    tl.to(saddle.material, {
                        opacity: 1,
                        duration: 1,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            saddle.material.transparent = false;
                            saddle.material.needsUpdate = true;
                        }
                    }, screwStartTime + index * 0.1);
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
            }
            let rodStartTime = tl.duration();
            if (rod) {
                rod.forEach((rod, index) => {
                    tl.to(rod.material, {
                        opacity: 1,
                        duration: 1,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            rod.material.transparent = false;
                            rod.material.needsUpdate = true;
                        }
                    }, rodStartTime + index * 0.1);
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
            }
            let capStartTime = tl.duration();
            if (screwCap) {
                screwCap.forEach((cap, index) => {
                    tl.to(cap.material, {
                        opacity: 1,
                        duration: 1,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            cap.material.transparent = false;
                            cap.material.needsUpdate = true;
                        }
                    }, capStartTime + index * 0.1);
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
        } else if (currentScene === 5) {
            tl.to(camera.position, {
                x: -0.2,
                y: 0.2,
                z: 0,
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
        }
    };

    // Resize
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        if (backgroundTexture) updateBackground(backgroundTexture)
    };
    window.addEventListener('resize', handleResize);

    // Animate
    function animate() {
        camera.lookAt(cameraTarget);
        renderer.render( scene, camera );
    }
    return () => {
        disposed = true;
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchstart', handleTouchStart, { passive: true });
        window.removeEventListener('touchend', handleTouchEnd, { passive: true });
        window.removeEventListener('resize', handleResize);
        timeoutIds.forEach((id) => window.clearTimeout(id));
        timeoutIds.clear();
        activeTimelines.forEach((tl) => tl.kill());
        activeTimelines.clear();
        renderer.setAnimationLoop(null);
        if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement);
        }
        if (typeof backgroundTexture !== 'undefined' && backgroundTexture) {
            backgroundTexture.dispose();
        }
        renderer.dispose();
    };
}