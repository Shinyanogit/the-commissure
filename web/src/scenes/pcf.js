import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { texture } from 'three/tsl';
import { createSceneNavigator } from './createSceneNavigator.js';
import { createProcedureOrbitControls } from './createProcedureOrbitControls.js';
import { updateProcedureCameraView } from './updateProcedureCameraView.js';

export function initPcfScene(mount, root, sceneCount, currentScene, setCurrentScene, sceneControllerRef, onSceneReady) {
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
        if (disposed) return;
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
    let cranium = null;
    let c1Bone = null;
    let c2Bone = null;
    let c3Bone = null;
    let c4Bone = null;
    let c5Bone = null;
    let c5Structure = [];
    let c5Pulposus = [];
    let c6Bone = null;
    let c7Bone = null;
    let disk = [];
    let ligament = [];
    let nerve = [];
    let removedStructure = [];
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('/Posterior Cervical Foraminotomy (PCF) Light.glb', ( gltf ) => {
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
                    if (child.name.includes('cranial')) {
                        cranium = child;
                    } else if (child.name.includes('c1')) {
                        c1Bone = child;
                    } else if (child.name.includes('c2')) {
                        c2Bone = child;
                    } else if (child.name.includes('c3')) {
                        c3Bone = child;
                    } else if (child.name.includes('c4') && !child.name.includes('removed')) {
                        c4Bone = child;
                    } else if (child.name.includes('c5') && !child.name.includes('removed')) {
                        c5Structure.push(child);
                        c5Bone = child;
                    } else if (child.name.includes('c5') && child.name.includes('removed')) {
                        c5Structure.push(child);
                    } else if (child.name.includes('c6')) {
                        c6Bone = child;
                    } else if (child.name.includes('c7')) {
                        c7Bone = child;
                    }
                    if (child.name.includes('removed')) {
                        removedStructure.push(child);
                    };
                } else if (child.name.includes('disk')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xF2E9E4,
                        transparent: false,
                        opacity: 1
                    });
                    if (child.name.includes('c4-c5')) {
                        c5Structure.push(child);
                    };
                    disk.push(child);
                } else if (child.name.includes('pulposus')) {
                    if (child.name.includes('herniated')) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xD4EBF2,
                            transparent: false,
                            opacity: 1,
                            roughness: 0.5,
                            metalness: 0.5
                        });
                    } else if (child.name.includes('normal')) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xD4EBF2,
                            transparent: true,
                            opacity: 0,
                            roughness: 0.5,
                            metalness: 0.5
                        });
                    }
                    c5Structure.push(child);
                    c5Pulposus.push(child);
                } else if (child.name.includes('ligament')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xF5F2EB,
                        transparent: false,
                        opacity: 1
                    });
                    if (child.name.includes('removed')) {
                        removedStructure.push(child);
                    };
                    ligament.push(child);
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
                    nerve.push(child);
                }
            }
        });
        acdf.position.set(0, 0, 0);
        scene.add( acdf );
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
                z: -0.1,
                duration: 1,
                ease: 'power2.inOut'
            }, cameraStartTime);
            tl.to(cameraTarget, {
                x: 0,
                y: 0.205,
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
            let zoomStartTime = tl.duration();
            tl.to(camera.position, {
                x: 0.045,
                y: 0.205,
                z: -0.1,
                duration: 1,
                ease: 'power2.inOut'
            }, zoomStartTime);
            tl.to(cameraTarget, {
                x: 0.015,
                y: 0.205,
                z: 0,
                duration: 1,
                ease: 'power2.inOut'
            }, zoomStartTime);
            tl.to(camera, {
                fov: 20,
                duration: 1,
                ease: 'power2.inOut',
                onUpdate: () => {
                    camera.updateProjectionMatrix();
                }
            }, zoomStartTime);
            let framinotomyStartTime = tl.duration();
            if (removedStructure.length > 0) {
                removedStructure.forEach(removedstructure => {
                    removedstructure.material.transparent = true;
                    removedstructure.material.needsUpdate = true;
                    tl.to(removedstructure.material, {
                        opacity: 0,
                        duration: 1.5,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            removedstructure.visible = false;
                        }
                    }, framinotomyStartTime);
                });
            };
        } else if (currentScene == 3) {
            let discectomyStartTime = tl.duration();
            if (c5Pulposus.length > 0) {
                c5Pulposus.forEach(pulposus => {
                    pulposus.material.transparent = true;
                    pulposus.material.needsUpdate = true;
                    tl.to(pulposus.material, {
                        opacity: 0,
                        duration: 1,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            pulposus.visible = false;
                        }
                    }, discectomyStartTime);
                });
            };
        } else if (currentScene == 4) {
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
            tl.to(camera, {
                fov: 75,
                duration: 1,
                ease: 'power2.inOut',
                onUpdate: () => {
                    camera.updateProjectionMatrix();
                }
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
            if (c5Bone) {
                tl.to(c5Bone.rotation, {
                    x: '+=' + Math.PI / 20,
                    duration: 2,
                    ease: 'power2.inOut'
                }, kyphosisStartTime);
                tl.to(c5Bone.position, {
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
            let lordosisStartTime = tl.duration();
            if (cranium) {
                tl.to(cranium.rotation, {
                    x: '-=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
                tl.to(cranium.position, {
                    z: '-=0.05',
                    y: '+=0.05',
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
            }
            if (c1Bone) {
                tl.to(c1Bone.rotation, {
                    x: '-=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
                tl.to(c1Bone.position, {
                    z: '-=0.045',
                    y: '+=0.01',
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
            }
            if (c2Bone) {
                tl.to(c2Bone.rotation, {
                    x: '-=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
                tl.to(c2Bone.position, {
                    z: '-=0.04',
                    y: '+=0.005',
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
            }
            if (c3Bone) {
                tl.to(c3Bone.rotation, {
                    x: '-=' + Math.PI / 5,
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
                tl.to(c3Bone.position, {
                    z: '-=0.023',
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
            }
            if (c4Bone) {
                tl.to(c4Bone.rotation, {
                    x: '-=' + Math.PI / 10,
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
                tl.to(c4Bone.position, {
                    z: '-=0.013',
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
            }
            if (c5Bone) {
                tl.to(c5Bone.rotation, {
                    x: '-=' + Math.PI / 20,
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
                tl.to(c5Bone.position, {
                    z: '-=0.007',
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
            }
            if (c6Bone) {
                tl.to(c6Bone.rotation, {
                    x: '-=' + Math.PI / 40,
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
                tl.to(c6Bone.position, {
                    z: '-=0.004',
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
            }
            if (c7Bone) {
                tl.to(c7Bone.rotation, {
                    x: '-=' + Math.PI / 80,
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
                tl.to(c7Bone.position, {
                    z: '-=0.001',
                    duration: 2,
                    ease: 'power2.inOut'
                }, lordosisStartTime);
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
        } else if (currentScene == 5) {
            tl.to(camera.position, {
                x: 0.045,
                y: 0.205,
                z: -0.1,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
            tl.to(cameraTarget, {
                x: 0.015,
                y: 0.205,
                z: 0,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
            tl.to(camera, {
                fov: 35,
                duration: 1,
                ease: 'power2.inOut',
                onUpdate: () => {
                    camera.updateProjectionMatrix();
                }
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
        if (typeof backgroundTexture !== 'undefined' && backgroundTexture) {
            backgroundTexture.dispose();
        }
        renderer.dispose();
    };
}
