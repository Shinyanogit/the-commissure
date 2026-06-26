import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 0, 2 );

const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
scene.add( ambientLight );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Control
const controls = new OrbitControls(camera, renderer.domElement);

// Geometry
const gltfLoader = new GLTFLoader();
const fiberMaterial = new THREE.MeshStandardMaterial( { 
  color: 0x89FB4D,
  emissive: 0x89FB4D,
  emissiveIntensity: 0.5,
  transparent: true,
  opacity: 0.8,
} );
const spineMaterial = new THREE.MeshStandardMaterial( { 
  color: 0xE33824,
  emissive: 0xE33824,
  emissiveIntensity: 0.5,
  transparent: true,
  opacity: 0.8,
} );
const somaMaterial = new THREE.MeshStandardMaterial( { 
  color: 0x5157F6,
  emissive: 0x5157F6,
  emissiveIntensity: 0.5,
  transparent: true,
  opacity: 0.8,
} );
const nucleusMaterial = new THREE.MeshStandardMaterial( { 
  color: 0xEB6CF4,
  emissive: 0xEB6CF4,
  emissiveIntensity: 2,
} );
function showNeuron( path ) {
  gltfLoader.load(path, ( gltf ) => {
    const neuron = gltf.scene;
    neuron.traverse( ( child ) => {
      if ( child.isMesh ) {
        if (child.name.includes('dendrite') || child.name.includes('axon')) {
          child.material = fiberMaterial;
          return;
        }
        if (child.name.includes('spine')) {
          child.material = spineMaterial;
          child.scale.set(1.1, 1.1, 1.1);
          return;
        }
        if (child.name.includes('soma')) {
          child.material = somaMaterial;
          return;
        }
        if (child.name.includes('nucleus')) {
          child.material = nucleusMaterial;
          return;
        }
      }
    } );
    neuron.position.set(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5
    );
    neuron.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    scene.add( neuron );
  } );
}
for (let i = 0; i < 8; i++) {
  showNeuron('/neuron1.glb');
}
for (let i = 0; i < 8; i++) {
  showNeuron('/neuron2.glb');
}
for (let i = 0; i < 8; i++) {
  showNeuron('/neuron3.glb');
}

function animate( time ) {
  renderer.render( scene, camera );
}