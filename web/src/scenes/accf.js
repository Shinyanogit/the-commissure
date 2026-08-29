import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { or, rotate, texture } from 'three/tsl';
import { createSceneNavigator } from './createSceneNavigator.js';
import { createProcedureOrbitControls } from './createProcedureOrbitControls.js';
import { updateProcedureCameraView } from './updateProcedureCameraView.js';

export function initAccfScene(mount, root, sceneCount, currentScene, setCurrentScene, sceneControllerRef, onSceneReady) {
    let disposed = false;
    const activeTimelines = new Set();
    const timeoutIds = new Set();
    const getPixelRatio = () => Math.min(window.devicePixelRatio || 1, window.innerWidth <= 768 ? 1.5 : 2);
    let renderFrameId = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    let lastPixelRatio = 0;

    // Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.001, 100 );
    camera.up.set(0, 1, 0);
    camera.position.set( 0.2, 0.2, 0 );
    const cameraTarget = new THREE.Vector3(0, 0.2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio(getPixelRatio());
    mount.appendChild( renderer.domElement );
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;
    lastPixelRatio = getPixelRatio();

    const render = () => {
        if (disposed) return;
        orbitController.syncTarget();
        renderer.render( scene, camera );
    };

    const requestRender = () => {
        if (disposed || renderFrameId) return;
        renderFrameId = window.requestAnimationFrame(() => {
            renderFrameId = 0;
            render();
        });
    };

    const orbitController = createProcedureOrbitControls({
        camera,
        domElement: renderer.domElement,
        cameraTarget,
        requestRender,
    });

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
        if (disposed) {
            texture.dispose();
            return;
        }
        backgroundTexture = texture;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.matrixAutoUpdate = false;
        updateBackground(texture);
        scene.background = texture;
        requestRender();
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
    let c5Transparent = [];
    let removedBone = [];
    let removedDisc = [];
    let cage = [];
    let shaft = null;
    let plate = null;
    let screw = [];
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('/Anterior Cervical Corpectomy and Fusion (ACCF) Light.glb', ( gltf ) => {
        if (disposed) return;
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
        sceneNavigator.capture(0);
        requestRender();
        onSceneReady?.();
    });

    let isAnimating = false;
    const sceneNavigator = createSceneNavigator({
        scene,
        camera,
        cameraTarget,
        sceneCount,
        getCurrentScene: () => currentScene,
        selectScene: (sceneIndex) => {
            currentScene = sceneIndex;
            setCurrentScene(sceneIndex);
        },
        getIsAnimating: () => isAnimating,
        setIsAnimating: (value) => {
            isAnimating = value;
        },
        playForward: transferScene,
        requestRender,
        orbitControls: orbitController.controls,
    });
    if (sceneControllerRef) sceneControllerRef.current = sceneNavigator.controller;

    function transferScene(currentScene) {
        sceneNavigator.beginForward(currentScene);
        const tl = gsap.timeline({
            onComplete: () => {
                activeTimelines.delete(tl);
                sceneNavigator.completeForward(currentScene);
                isAnimating = false;
            }
        });
        tl.eventCallback('onUpdate', render);
        activeTimelines.add(tl);
        sceneNavigator.track(currentScene, tl);
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
        } else if (currentScene === 3) {
            c5Transparent.forEach((c5transparent) => {
                tl.to(c5transparent.material, {
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.inOut'
                }, 0);
            });
            let cameraStartTime = tl.duration();
            c5Structure.forEach((c5structure) => {
                tl.to(c5structure.position, {
                    z: '+=1',
                    duration: 1,
                    ease: 'power2.inOut'
                }, cameraStartTime);
            });
            tl.to(camera.position, {
                x: 0.2,
                y: 0.2,
                z: 0,
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
                fov: 75,
                duration: 1,
                ease: 'power2.inOut',
                onUpdate: () => {
                    camera.updateProjectionMatrix();
                }
            }, cameraStartTime);
            let zoomStartTime = tl.duration();
            tl.to(camera.position, {
                x: 0,
                y: 0.1,
                z: 0.2,
                duration: 1,
                ease: 'power2.inOut'
            }, zoomStartTime);
            tl.to(cameraTarget, {
                x: 0,
                y: 0.2,
                z: 0,
                duration: 1,
                ease: 'power2.inOut'
            }, zoomStartTime);
            tl.to(camera, {
                fov: 25,
                duration: 1,
                ease: 'power2.inOut',
                onUpdate: () => {
                    camera.updateProjectionMatrix();
                }
            }, zoomStartTime);
            let discectomyStartTime = tl.duration();
            if (removedDisc.length > 0) {
                removedDisc.forEach(disc => {
                    disc.material.transparent = true;
                    disc.material.needsUpdate = true;
                    tl.to(disc.material, {
                        opacity: 0,
                        duration: 1,
                        ease: 'power2.inOut',
                    }, discectomyStartTime);
                });
            };
            let corpectomyStartTime = tl.duration();
            if (removedBone.length > 0) {
                removedBone.forEach(bone => {
                    bone.material.transparent = true;
                    bone.material.needsUpdate = true;
                    tl.to(bone.material, {
                        opacity: 0,
                        duration: 1,
                        ease: 'power2.inOut'
                    }, corpectomyStartTime);
                });
            };
        } else if (currentScene === 4) {
            tl.to(camera.position, {
                x: -0.1,
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
            if (cage.length > 0) {
                cage.forEach(instrument => {
                    instrument.material.transparent = true;
                    instrument.material.needsUpdate = true;
                    tl.to(instrument.material, {
                        opacity: 1,
                        duration: 0,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            instrument.material.transparent = false;
                            instrument.material.needsUpdate = true;
                        }
                    }, 0);
                    tl.to(instrument.position, {
                        z: '-=0.4',
                        duration: 1,
                        ease: 'power2.inOut'
                    }, 0);
                });
            };
            let extensionStartTime = tl.duration();
            if (shaft) {
                tl.to(shaft.position, {
                    y: '+=0.0025',
                    z: '+=0.00125',
                    duration: 1,
                    ease: 'power2.inOut'
                }, extensionStartTime);
            }
        }
        else if (currentScene === 5) {
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
        } else if (currentScene === 6) {
            tl.to(camera.position, {
                x: -0.1,
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
        };
    };

    // Resize
    const handleResize = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const pixelRatio = getPixelRatio();
        updateProcedureCameraView(camera, root);
        if (viewportWidth === lastWidth && viewportHeight === lastHeight && pixelRatio === lastPixelRatio) {
            requestRender();
            return;
        }

        renderer.setSize(viewportWidth, viewportHeight);
        renderer.setPixelRatio(pixelRatio);
        lastWidth = viewportWidth;
        lastHeight = viewportHeight;
        lastPixelRatio = pixelRatio;
        requestRender();
        if (backgroundTexture) updateBackground(backgroundTexture)
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('procedure-layout-change', handleResize);
    handleResize();

    return () => {
        disposed = true;
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('procedure-layout-change', handleResize);
        orbitController.dispose();
        if (sceneControllerRef?.current === sceneNavigator.controller) sceneControllerRef.current = null;
        sceneNavigator.dispose();
        timeoutIds.forEach((id) => window.clearTimeout(id));
        timeoutIds.clear();
        activeTimelines.forEach((tl) => tl.kill());
        activeTimelines.clear();
        if (renderFrameId) {
            window.cancelAnimationFrame(renderFrameId);
            renderFrameId = 0;
        }
        if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement);
        }
        if (backgroundTexture) {
            backgroundTexture.dispose();
        }
        renderer.dispose();
    };
}
