import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { or, rotate, texture } from 'three/tsl';
import { createSceneNavigator } from './createSceneNavigator.js';
import { createProcedureOrbitControls } from './createProcedureOrbitControls.js';
import { updateProcedureCameraView } from './updateProcedureCameraView.js';

export function initPcl_doubleScene(mount, root, sceneCount, currentScene, setCurrentScene, sceneControllerRef, onSceneReady) {
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
    camera.position.set( 0.2, 0.205, 0 );
    const cameraTarget = new THREE.Vector3(0, 0.205, 0);

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
    let c3456Structure = [];
    let transparentStructure = [];
    let removedLigament = null;
    let leftHinge = [];
    let rightHinge = [];
    let leftLaminaBefore = [];
    let leftLaminaAfter = [];
    let rightLaminaBefore = [];
    let rightLaminaAfter = [];
    let removedOpen = [];
    let boneSpacer = [];
    let plate = [];
    let screw = [];
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('/Posterior Cervical Laminoplasty (Double Door).glb', ( gltf ) => {
        if (disposed) return;
        const pcl_double = gltf.scene;
        pcl_double.traverse((child) => {
            if (child.isMesh) {
                if (child.name.includes('bone')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0xF0E6D4, 
                        transparent: false,
                        opacity: 1
                    });
                    if (child.name.includes('c3')||child.name.includes('c4')||child.name.includes('c5')||child.name.includes('c6')) {
                        c3456Structure.push(child);
                        if (child.name.includes('transparent')) {
                            transparentStructure.push(child);
                        };
                    };
                    if (child.name.includes('spacer')) {
                        child.material.transparent = true;
                        child.material.opacity = 0;
                        child.material.needsUpdate = true;
                        child.position.z -= 0.2;
                        boneSpacer.push(child);
                    } else if (child.name.includes('hinge')) {
                        if (child.name.includes('left')) {
                            leftHinge.push(child);
                        } else if (child.name.includes('right')) {
                            rightHinge.push(child);
                        }
                    } else if (child.name.includes('lamina')) {
                        if (child.name.includes('before')) {
                            if (child.name.includes('left')) {
                                leftLaminaBefore.push(child);
                            }
                            else if (child.name.includes('right')) {
                                rightLaminaBefore.push(child);
                            }
                        } else if (child.name.includes('after')) {
                            child.material.transparent = true;
                            child.material.opacity = 0;
                            child.visible = false;
                            child.material.needsUpdate = true;
                            if (child.name.includes('left')) {
                                leftLaminaAfter.push(child);
                            }
                            else if (child.name.includes('right')) {
                                rightLaminaAfter.push(child);
                            }
                        }
                    }
                } else if (child.name.includes('disk')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xF2E9E4,
                        transparent: false,
                        opacity: 1
                    });
                    if (child.name.includes('c3-c4')||child.name.includes('c4-c5')||child.name.includes('c5-c6')) {
                        c3456Structure.push(child);
                        if (child.name.includes('transparent')) {
                            transparentStructure.push(child);
                        };
                    }
                } else if (child.name.includes('pulposus')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xD4EBF2,
                        transparent: false,
                        opacity: 1,
                        roughness: 0.5,
                        metalness: 0.5
                    });
                    if (child.name.includes('c3-c4')||child.name.includes('c4-c5')||child.name.includes('c5-c6')) {
                        c3456Structure.push(child);
                        if (child.name.includes('transparent')) {
                            transparentStructure.push(child);
                        }
                    };
                } else if (child.name.includes('ligament')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xF5F2EB,
                        transparent: false,
                        opacity: 1
                    });
                    if (child.name.includes('removed')) {
                        removedLigament = child;
                    };
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
                    if (child.name.includes('c3456')) {
                        c3456Structure.push(child);
                    };
                } else if (child.name.includes('plate')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0x3CA8AB,
                        metalness: 0.5,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0
                    });
                    child.position.z -= 0.2;
                    plate.push(child);
                } else if (child.name.includes('screw')) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0x8A00C2,
                        metalness: 0.5,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0
                    });
                    child.position.z -= 0.2;
                    screw.push(child)
                };
            }
        });
        leftHinge.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        rightHinge.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        leftLaminaBefore.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        rightLaminaBefore.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        leftLaminaAfter.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        rightLaminaAfter.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        boneSpacer.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        plate.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        screw.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        pcl_double.position.set(0, 0, 0);
        scene.add( pcl_double );
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
                x: 0.2,
                y: 0.205,
                z: -1,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
            tl.to(cameraTarget, {
                x: 0,
                y: 0.205,
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
            tl.to(camera, {
                fov: 30,
                duration: 1,
                ease: 'power2.inOut',
                onUpdate: () => {
                    camera.updateProjectionMatrix();
                }
            }, 0);
            c3456Structure.forEach((c3456structure) => {
                tl.to(c3456structure.position, {
                    z: '-=1',
                    duration: 1,
                    ease: 'power2.inOut'
                }, 0);
            });
            let transparentStartTime = tl.duration();
            transparentStructure.forEach((transparentstructure) => {
                transparentstructure.material.transparent = true;
                transparentstructure.material.needsUpdate = true;
                tl.to(transparentstructure.material, {
                    opacity: 0,
                    duration: 1,
                    ease: 'power2.inOut'
                }, transparentStartTime);
            });
        } else if (currentScene === 2) {
            transparentStructure.forEach((transparentstructure) => {
                tl.to(transparentstructure.material, {
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        transparentstructure.material.transparent = false;
                        transparentstructure.material.needsUpdate = true;
                    }
                }, 0);
            });
            let cameraStartTime = tl.duration();
            tl.to(camera.position, {
                x: 0,
                y: 0.18,
                z: -0.2,
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
            c3456Structure.forEach((c3456structure) => {
                tl.to(c3456structure.position, {
                    z: '+=1',
                    duration: 1,
                    ease: 'power2.inOut'
                }, cameraStartTime);
            });
            removedLigament.material.transparent = true;
            removedLigament.material.needsUpdate = true;
            tl.to(removedLigament.material, {
                opacity: 0,
                duration: 1,
                ease: 'power2.inOut',
                onComplete: () => {
                    removedLigament.visible = false;
                }
            }, cameraStartTime);
            let hingeStartTime = tl.duration();
            leftHinge.forEach((hinge, index) => {
                tl.to(hinge.position, {
                    z: '-=0.2',
                    duration: 1,
                    ease: 'power2.inOut'
                }, hingeStartTime + index * 0.1);
            });
        } else if (currentScene === 3) {
            rightHinge.forEach((hinge, index) => {
                tl.to(hinge.position, {
                    z: '-=0.2',
                    duration: 1,
                    ease: 'power2.inOut'
                }, index * 0.1);
            });
        } else if (currentScene === 4) {
            leftLaminaBefore.forEach((lamina, index) => {
                tl.to(lamina.position, {
                    x: leftLaminaAfter[index].position.x,
                    y: leftLaminaAfter[index].position.y,
                    z: leftLaminaAfter[index].position.z,
                    duration: 1,
                    ease: 'power2.inOut'
                }, index * 0.1);
                tl.to(lamina.rotation, {
                    x: leftLaminaAfter[index].rotation.x,
                    y: leftLaminaAfter[index].rotation.y,
                    z: leftLaminaAfter[index].rotation.z,
                    duration: 1,
                    ease: 'power2.inOut'
                }, index * 0.1);
            });
            rightLaminaBefore.forEach((lamina, index) => {
                tl.to(lamina.position, {
                    x: rightLaminaAfter[index].position.x,
                    y: rightLaminaAfter[index].position.y,
                    z: rightLaminaAfter[index].position.z,
                    duration: 1,
                    ease: 'power2.inOut'
                }, index * 0.1);
                tl.to(lamina.rotation, {
                    x: rightLaminaAfter[index].rotation.x,
                    y: rightLaminaAfter[index].rotation.y,
                    z: rightLaminaAfter[index].rotation.z,
                    duration: 1,
                    ease: 'power2.inOut'
                }, index * 0.1);
            });
            let spacerStartTime = tl.duration();
            boneSpacer.forEach((spacer, index) => {
                tl.to(spacer.material, {
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        spacer.material.transparent = false;
                        spacer.material.needsUpdate = true;
                    }
                }, spacerStartTime + index * 0.1);
                tl.to(spacer.position, {
                    z: '+=0.2',
                    duration: 1,
                    ease: 'power2.inOut'
                }, spacerStartTime + index * 0.1);
            });
        } else if (currentScene === 5) {
            plate.forEach((plateMesh, index) => {
                tl.to(plateMesh.material, {
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        plateMesh.material.transparent = false;
                        plateMesh.material.needsUpdate = true;
                    }
                }, index * 0.1);
                tl.to(plateMesh.position, {
                    z: '+=0.2',
                    duration: 1,
                    ease: 'power2.inOut'
                }, index * 0.1);
            });
            let screwStartTime = tl.duration();
            screw.forEach((screwMesh, index) => {
                tl.to(screwMesh.material, {
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        screwMesh.material.transparent = false;
                        screwMesh.material.needsUpdate = true;
                    }
                }, screwStartTime + index * 0.05);
                tl.to(screwMesh.position, {
                    z: '+=0.2',
                    duration: 1,
                    ease: 'power2.inOut'
                }, screwStartTime + index * 0.05);
            });
        } else if (currentScene === 6) {   
            tl.to(camera.position, {
                x: -0.1,
                y: 0.205,
                z: -0.2,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
        }
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
