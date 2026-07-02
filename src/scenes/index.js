import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';

export function initHomeScene(mount) {
    let disposed = false;
    const getViewportSize = () => ({
        width: window.visualViewport?.width ?? window.innerWidth,
        height: window.visualViewport?.height ?? window.innerHeight,
    });
    const getPixelRatio = () => Math.min(window.devicePixelRatio || 1, window.innerWidth <= 768 ? 1.5 : 2);
    let renderFrameId = 0;
    let scrollFrameId = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    let lastPixelRatio = 0;

    // Camera
    const scene = new THREE.Scene();
    const { width, height } = getViewportSize();
    const camera = new THREE.PerspectiveCamera( 15, width / height, 0.01, 100 );
    camera.up.set(0, 1, 0);
    camera.position.set( 0, 0, -0.7 );

    const render = () => {
        if (disposed) return;
        camera.lookAt( 0, camera.position.y, 0 );
        renderer.render( scene, camera );
    };

    const requestRender = () => {
        if (disposed || renderFrameId) return;
        renderFrameId = window.requestAnimationFrame(() => {
            renderFrameId = 0;
            render();
        });
    };

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize( width, height );
    renderer.setPixelRatio(getPixelRatio());
    mount.appendChild( renderer.domElement );
    lastWidth = width;
    lastHeight = height;
    lastPixelRatio = getPixelRatio();

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0xffffff, 5);
    pointLight1.position.set(2, 1, -1);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0xffffff, 5);
    pointLight2.position.set(-2, 1, -1);
    scene.add(pointLight2);

    // Geometry
    const blueGlassMaterial = new THREE.MeshPhysicalMaterial({
        transmission: 1,
        thickness: 5,
        roughness: 0.4,
        transparent: true,
        opacity: 1,
        attenuationColor: new THREE.Color(0x009B9E),
        attenuationDistance: 1,
    });
    const nerveMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        transparent: false,
        wireframe: true
    });
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('/Spine Disection.glb', ( gltf ) => {
        if (disposed) return;
        const spine = gltf.scene;
        spine.traverse((child) => {
            if (child.isMesh) {
                if (child.name.includes('bone')) {
                    child.material = blueGlassMaterial;
                } else if (child.name.includes('nerve')) {
                    child.material = nerveMaterial;
                }
            }
        })
        spine.position.set(0, 0, 0);
        scene.add( spine );
        requestRender();
    });

    // Scroll
    let progress = 0;
    const handleScroll = () => {
        if (disposed || scrollFrameId) return;
        scrollFrameId = window.requestAnimationFrame(() => {
            scrollFrameId = 0;
            const scrollTop = window.scrollY;
            const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            const nextProgress = THREE.MathUtils.clamp(scrollTop / maxScroll, 0, 1);
            if (nextProgress === progress) return;
            progress = nextProgress;
            camera.position.y = -0.3 * progress;
            requestRender();
        });
    };
    window.addEventListener('scroll', handleScroll);

    // Resize
    const handleResize = () => {
        const { width: viewportWidth, height: viewportHeight } = getViewportSize();
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
    };
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);

    requestRender();
    return () => {
        disposed = true;
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        window.visualViewport?.removeEventListener('resize', handleResize);
        if (scrollFrameId) {
            window.cancelAnimationFrame(scrollFrameId);
            scrollFrameId = 0;
        }
        if (renderFrameId) {
            window.cancelAnimationFrame(renderFrameId);
            renderFrameId = 0;
        }
        if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };
}