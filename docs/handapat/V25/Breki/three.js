import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';


// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 500 / 500, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("threeCanvas"), alpha: true });
renderer.setSize(500, 500); // Match the container size

document.getElementById("modelContainer").appendChild(renderer.domElement);

const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
light.position.set( 0.5, 1, 0.5 );


scene.add( light );

const loader = new GLTFLoader();
let model;

// Load 3D model
loader.load("./cube/cube.gltf", function (gltf) {
    model = gltf.scene;
    scene.add(model);
    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);
}, undefined, function (error) {
    console.error("Error loading 3D model:", error);
});

// Set camera position
camera.position.z = 3;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Function to rotate model based on gestures
export function rotateModel(gesture) {
    if (!model) return;

    switch (gesture) {
        case "Open_Palm":
            model.rotation.y += 0.1; // Rotate right
            break;
        case "Closed_Fist":
            model.rotation.y -= 0.1; // Rotate left
            break;
        case "Thumb_Up":
            model.rotation.x += 0.1; // Tilt up
            break;
        case "Thumb_Down":
            model.rotation.x -= 0.1; // Tilt down
            break;
        case "Victory":
            model.rotation.z += 0.1; // Rotate around Z-axis
            break;
        case "ILoveYou":
            model.rotation.z -= 0.1; // Rotate back around Z-axis
            break;
    }
}
