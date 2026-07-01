import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

export function initHomeScene(mount) {
    let disposed = false;
    const activeTimelines = new Set();
    const timeoutIds = new Set();
    const getViewportSize = () => ({
        width: window.visualViewport?.width ?? window.innerWidth,
        height: window.visualViewport?.height ?? window.innerHeight,
    });
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
    const { width, height } = getViewportSize();
    const camera = new THREE.PerspectiveCamera( 15, width / height, 0.01, 100 );
    camera.up.set(0, 1, 0);
    camera.position.set( 0, 0, -0.7 );

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( width, height );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild( renderer.domElement );
    renderer.setAnimationLoop( animate );

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
    });

    // Scroll
    let progress = 0;
    const handleScroll = (event) => {
        const scrollTop = window.scrollY;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - getViewportSize().height);
        progress = THREE.MathUtils.clamp(scrollTop / maxScroll, 0, 1);
        camera.position.y = - 0.3 * progress;
    };
    window.addEventListener('scroll', handleScroll);

    gsap.registerPlugin(ScrollTrigger);
    const sections = [
        '.hero',
        '.article',
        '.news',
        '.about',
        '.authors'
    ];
    sections.forEach((section, index) => {
        if (index > 0) {
            gsap.to(sections[index - 1], {
                opacity: 0,
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start: 'top center',
                    end: 'top top',
                    scrub: true,
                },
            });
        }
    });

    // Resize
    const handleResize = () => {
        const { width: viewportWidth, height: viewportHeight } = getViewportSize();
        camera.aspect = viewportWidth / viewportHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(viewportWidth, viewportHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);

    // Animate
    function animate() {
        camera.lookAt( 0, camera.position.y, 0 );
        renderer.render( scene, camera );
    }
    return () => {
        disposed = true;
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        window.visualViewport?.removeEventListener('resize', handleResize);
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
