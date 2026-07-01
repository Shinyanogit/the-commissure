import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { texture } from 'three/tsl';

export function initAcdfScene(mount, root, sceneCount, currentScene, setCurrentScene) {
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
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 100 );
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
    let c5Structure = [];
    let c5Disc = [];
    let spacer = null;
    let fixationPlate =[];
    let fixationScrew = [];
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('/Anterior Cervical Discectomy and Fusion (ACDF) Light.glb', ( gltf ) => {
        if (disposed) return;
        const acdf = gltf.scene;
        acdf.traverse((child) => {
            if (child.isMesh) {
                if (child.name.includes('bone')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0xF0E6D4, 
                        transparent: false,
                        opacity: 1
                    });
                    if (child.name.includes('c5')) {
                        c5Structure.push(child);
                    };
                } else if (child.name.includes('disk')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xF2E9E4,
                        transparent: false,
                        opacity: 1
                    });
                    if (child.name.includes('c4-c5')) {
                        c5Structure.push(child);
                        c5Disc.push(child);
                    };
                } else if (child.name.includes('pulposus')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xD4EBF2,
                        transparent: false,
                        opacity: 1,
                        roughness: 0.5,
                        metalness: 0.5
                    });
                    c5Structure.push(child);
                    c5Disc.push(child);
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
                } else if (child.name.includes('spacer')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xD9DAD9,
                        metalness: 0.5,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0
                    });
                    child.rotateX(- 2 * Math.PI / 9);
                    child.position.z += 0.4;
                    spacer = child;
                } else if (child.name.includes('screw')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0x29AB87,
                        metalness: 0.5,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0
                    });
                    child.position.z += 0.2;
                    fixationScrew.push(child);
                } else if (child.name.includes('plate')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0xAAA9AD ,
                        metalness: 0.5,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0
                    });
                    child.position.z += 0.2;
                    fixationPlate.push(child);
                }
            }
        });
        fixationScrew.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        acdf.position.set(0, 0, 0);
        scene.add( acdf );
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
                z: 0.2,
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
            tl.to(camera.up, {
                x: 0,
                y: 1,
                z: 0,
                duration: 1,
                ease: 'power2.inOut'
            }, cameraStartTime);
            tl.to(camera, {
                fov: 15,
                duration: 1,
                ease: 'power2.inOut',
                onUpdate: () => {
                    camera.updateProjectionMatrix();
                }
            }, cameraStartTime);
            let discectomyStartTime = tl.duration();
            if (c5Disc.length > 0) {
                c5Disc.forEach(disc => {
                    disc.material.transparent = true;
                    disc.material.needsUpdate = true;
                    tl.to(disc.material, {
                        opacity: 0,
                        duration: 1,
                        ease: 'power2.inOut',
                    }, discectomyStartTime);
                });
            };
        } else if (currentScene === 3) {
            tl.to(camera.position, {
                x: 0.2,
                y: 0.3,
                z: 0.3,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
            tl.to(cameraTarget, {
                x: 0,
                y: 0.2,
                z: 0.42,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
            if (spacer) {
                tl.to(spacer.material, {
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        spacer.material.transparent = false;
                        spacer.material.needsUpdate = true;
                    }
                }, 0);
            };
        } else if (currentScene === 4) {
            tl.to(camera.position, {
                x: 0.12,
                y: 0.2,
                z: 0.42,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
            tl.to(cameraTarget, {
                x: 0,
                y: 0.2,
                z: 0.42,
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
            if (spacer) {
                tl.to(spacer.rotation, {
                    x: '+=' + 2 * Math.PI / 9,
                    duration: 1,
                    ease: 'power2.inOut',
                }, 0);
            };
            let spacerStartTime = tl.duration();
            tl.to(camera.position, {
                x: 0.12,
                y: 0.2,
                z: 0.02,
                duration: 1,
                ease: 'power2.inOut'
            }, spacerStartTime);
            tl.to(cameraTarget, {
                x: 0,
                y: 0.2,
                z: 0.02,
                duration: 1,
                ease: 'power2.inOut'
            }, spacerStartTime);
            if (spacer) {
                tl.to(spacer.position, {
                    z: '-=0.4',
                    duration: 1,
                    ease: 'power2.inOut',
                }, spacerStartTime);
            }
        } else if (currentScene === 5) {
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
            if (fixationPlate.length > 0) {
                fixationPlate.forEach(plate => {
                    tl.to(plate.material, {
                        opacity: 1,
                        duration: 1,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            plate.material.transparent = false;
                            plate.material.needsUpdate = true;
                        }
                    }, 0);
                    tl.to(
                        plate.position, 
                        {
                            z: '-=0.2',
                            duration: 1,
                            ease: 'power2.inOut'
                        },
                        0
                    );
                })
            }
            let screwStartTime = tl.duration();
            if (fixationScrew.length > 0) {
                fixationScrew.forEach((screw, index) => {
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
        } else if (currentScene === 6) {
            tl.to(camera.position, {
                x: -0.2,
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