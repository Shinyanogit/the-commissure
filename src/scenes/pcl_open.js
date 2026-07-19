import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { or, rotate, texture } from 'three/tsl';

export function initPcl_openScene(mount, root, sceneCount, currentScene, setCurrentScene) {
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
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 100 );
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
        camera.lookAt(cameraTarget);
        renderer.render( scene, camera );
    };

    const requestRender = () => {
        if (disposed || renderFrameId) return;
        renderFrameId = window.requestAnimationFrame(() => {
            renderFrameId = 0;
            render();
        });
    };

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
    let removedHinge = [];
    let removedOpen = [];
    let c3456Lamina = [];
    let c3456LaminaAfter = [];
    let boneSpacer = [];
    let plate = [];
    let screw = [];
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('/Posterior Cervical Laminoplasty (Open Door).glb', ( gltf ) => {
        if (disposed) return;
        const pcl_open = gltf.scene;
        pcl_open.traverse((child) => {
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
                        removedHinge.push(child);
                    } else if (child.name.includes('open')) {
                        removedOpen.push(child);
                    } else if (child.name.includes('lamina')) {
                        if (child.name.includes('before')) {
                            c3456Lamina.push(child);
                        } else if (child.name.includes('after')) {
                            child.material.transparent = true;
                            child.material.opacity = 0;
                            child.material.needsUpdate = true;
                            c3456LaminaAfter.push(child);
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
        c3456Lamina.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        c3456LaminaAfter.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        removedHinge.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]);
            const numB = parseInt(b.name.match(/\d+/)[0]);
            return numA - numB;
        });
        removedOpen.sort((a, b) => {
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
        pcl_open.position.set(0, 0, 0);
        scene.add( pcl_open );
        requestRender();
    });

    // Wheel + touch swipe support for mobile
    let lastWheelTime = 0;
    let isAnimating = false;
    let touchStartY = null;
    const TOUCH_SWIPE_THRESHOLD = 40;
    const handleWheel = (event) => {
        const now = performance.now();
        if (now - lastWheelTime < 2000) return;
        lastWheelTime = now;
        if (event.target.closest(".procedure-paragraph.open")) return;
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
        };
    };

    const handleTouchStart = (event) => {
        if (event.target.closest(".procedure-paragraph.open")) return;
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
        };
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    function transferScene(currentScene) {
        const tl = gsap.timeline({
            onComplete: () => {
                activeTimelines.delete(tl);
                isAnimating = false;
            }
        });
        tl.eventCallback('onUpdate', render);
        activeTimelines.add(tl);
        tl.add(() => {
            setCurrentScene(currentScene);
        }, 0);
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
            tl.to(camera.position, {
                x: 0,
                y: 0.18,
                z: -0.2,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
            tl.to(cameraTarget, {
                x: 0,
                y: 0.205,
                z: 0,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);
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
            c3456Structure.forEach((c3456structure) => {
                tl.to(c3456structure.position, {
                    z: '+=1',
                    duration: 1,
                    ease: 'power2.inOut'
                }, 0);
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
            }, 0);
            let hingeStartTime = tl.duration();
            removedHinge.forEach((removedhinge, index) => {
                tl.to(removedhinge.position, {
                    z: '-=0.2',
                    duration: 1,
                    ease: 'power2.inOut'
                }, hingeStartTime + index * 0.1);
            });
        } else if (currentScene === 3) {
            removedOpen.forEach((removedopen, index) => {
                tl.to(removedopen.position, {
                    z: '-=0.2',
                    duration: 1,
                    ease: 'power2.inOut'
                }, index * 0.1);
            });
        } else if (currentScene === 4) {
            c3456Lamina.forEach((lamina, index) => {
                lamina.material.transparent = true;
                lamina.material.needsUpdate = true;
                tl.to(lamina.material, {
                    opacity: 0,
                    duration: 0.5,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        lamina.visible = false;
                    }
                }, index * 0.1);
            });
            c3456LaminaAfter.forEach((laminaafter, index) => {
                tl.to(laminaafter.material, {
                    opacity: 1,
                    duration: 0.5,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        laminaafter.material.transparent = false;
                        laminaafter.material.needsUpdate = true;
                    }
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
        if (viewportWidth === lastWidth && viewportHeight === lastHeight && pixelRatio === lastPixelRatio) return;

        camera.aspect = viewportWidth / viewportHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(viewportWidth, viewportHeight);
        renderer.setPixelRatio(pixelRatio);
        lastWidth = viewportWidth;
        lastHeight = viewportHeight;
        lastPixelRatio = pixelRatio;
        requestRender();
        if (backgroundTexture) updateBackground(backgroundTexture)
    };
    window.addEventListener('resize', handleResize);
    requestRender();

    // Animate
    function animate() {
        camera.lookAt(cameraTarget);
        renderer.render( scene, camera );
    }
    return () => {
        disposed = true;
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('resize', handleResize);
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
