import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 0, 1 );

const pointLight = new THREE.PointLight(0xffffff, 10);
pointLight.position.set(2, 2, 2);
scene.add(pointLight);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Control
const controls = new OrbitControls(camera, renderer.domElement);

// Geometry
const textureLoader = new THREE.TextureLoader();
const waterNormalMap = textureLoader.load('/water.jpg');
const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xFFFFFF,
    transmission: 1.3,
    metalness: 0,
    roughness: 0.2,
    ior: 1.5,
    thickness: 5,
    specularIntensity: 1,
    specularColor: 0xFFFFFF,
    dispersion: 5,
    normalMap: waterNormalMap,
});
const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    metalness: 0,
    roughness: 0.5,
});
const gltfLoader = new GLTFLoader();
let statue;
let instancedMesh;
let basePosition = [];
let isHovered = false;
gltfLoader.load('/statue.glb', ( gltf ) => {
    statue = gltf.scene;
    statue.position.set(0, -0.5, 0);
    // scene.add(statue);
    statue.traverse( ( child ) => {
        if ( child.isMesh ) {
            const positionAttribute = child.geometry.attributes.position;
            const vertexCount = positionAttribute.count;
            const sphereGeometry = new THREE.SphereGeometry(0.01, 8, 8);
            instancedMesh = new THREE.InstancedMesh(sphereGeometry, whiteMaterial, vertexCount);
            const dummy = new THREE.Object3D();
            const position = new THREE.Vector3();
            const worldPosition = new THREE.Vector3();
            for (let i = 0; i < vertexCount; i++) {
                position.set(positionAttribute.getX(i), positionAttribute.getY(i), positionAttribute.getZ(i));
                worldPosition.copy(position);
                child.localToWorld(worldPosition);

                basePosition.push(worldPosition.clone());

                dummy.position.copy(worldPosition);
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(i, dummy.matrix);
            }
            scene.add(instancedMesh);
        }
    } );
} );

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('mousemove', (event) => {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
} );

const dummy = new THREE.Object3D();
const influenceRadius = 0.2;
const strength = 0.5;
function animate() {
    renderer.render( scene, camera );
}