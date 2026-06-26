import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 0, 1 );

const pointLight = new THREE.PointLight(0xffffff, 10);
pointLight.position.set(0, 2, 0);
scene.add(pointLight);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Control
const controls = new OrbitControls(camera, renderer.domElement);

// Geometry
const gltfLoader = new GLTFLoader();
gltfLoader.load('/head.glb', ( gltf ) => {
    const head = gltf.scene;
    head.scale.set(3, 3, 3);
    head.traverse( ( child ) => {
        if ( child.isMesh ) {
            if ( child.name.includes('Skin') ) {
                const headAttribute = child.geometry.attributes.position;
                const vertexCount = headAttribute.count;
                const sphereGeometry = new THREE.SphereGeometry(0.01, 8, 8);
                const material = new THREE.MeshStandardMaterial( { 
                    color: 0XFFFFFF,
                } );
                const instancedMesh = new THREE.InstancedMesh(sphereGeometry, material, vertexCount);
                const dummy = new THREE.Object3D();
                const position = new THREE.Vector3();
                const worldPosition = new THREE.Vector3();
                for (let i = 0; i < vertexCount; i++) {
                    position.set(headAttribute.getX(i), headAttribute.getY(i), headAttribute.getZ(i));
                    worldPosition.copy(position);
                    child.localToWorld(worldPosition);
                    dummy.position.copy(worldPosition);
                    dummy.updateMatrix();
                    instancedMesh.setMatrixAt(i, dummy.matrix);
                }
                scene.add(instancedMesh);
                console.log('Added Instance')
            } else {
                scene.add(child);
                console.log('Cranium')
            }
        }
    } );
} );

function animate( time ) {
    renderer.render( scene, camera );
}