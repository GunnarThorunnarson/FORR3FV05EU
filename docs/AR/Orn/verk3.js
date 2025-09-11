import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas, alpha: true });
renderer.xr.enabled = true;
document.getElementById('ar-button-container').appendChild(
    ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
    })
);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 10);
camera.position.set(0, 1, 3);
const light = new THREE.DirectionalLight(0xFFFFFF, 3);
light.position.set(-1, 2, 4);
scene.add(light);
const loader = new GLTFLoader();
let model;
let box;
let hittest = null;
let hittestrq = false;
let nonARObjects = [];
let arObjects = [];

function noneAR() {
    const boxGeometry = new THREE.BoxGeometry(5, 2, 3);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('wood_table_worn_diff_4k.jpg'); 
    const material = new THREE.MeshStandardMaterial({ map: texture });
    box = new THREE.Mesh(boxGeometry, material);
    box.position.set(0, -1, 0);
    scene.add(box);
    nonARObjects.push(box);

    loader.load('./kfclast/scene.gltf', (gltf) => {
        const wingModel = gltf.scene;
        scene.add(wingModel);
        wingModel.position.set(0, 19.5, 8);
        wingModel.scale.set(10, 10, 10);
        nonARObjects.push(wingModel);
    }, undefined, (error) => {
        console.error('FUCKING WORK WHERE ARE YOU', error);
    });
}


// this is from old code could prob just make it the same place as the other model but am to lazy to do it
function placeModel() {
    loader.load('./kentucky_chicken_bucket/scene.gltf', (gltf) => {
        model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        scene.add(model);
        model.position.set(-1, 0, 0);
    }, undefined, (error) => {
        console.error('why brake ', error);
    });
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI / 2;

function sizeRend() {
    if (renderer.xr.isPresenting) return; //this was so anyoing took me some time thank you chatgpt

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = renderer.domElement.width !== width || renderer.domElement.height !== height;

    if (needResize) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}

renderer.setAnimationLoop((timestamp, frame) => {
    sizeRend();
    controls.update();

    if (model) {
        model.rotation.y += 0.01;
    }
    //this took long time did need help with
    if (hittest && frame) {
        try {
            const hitTestResults = frame.getHitTestResults(hittest);
            
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const referenceSpace = renderer.xr.getReferenceSpace();
                const pose = hit.getPose(referenceSpace);

                if (pose && model) {
                    model.position.set(
                        pose.transform.position.x,
                        pose.transform.position.y,
                        pose.transform.position.z
                    );
                }
            }
        } catch (error) {
            console.error("Error in hit test processing:", error);
        }
    }
    renderer.render(scene, camera);
});

renderer.xr.addEventListener('sessionstart', async () => {
    model.position.set(0, 0, 0);
    removeNonARModels();

    model.scale.set(0.1, 0.1, 0.1);
    console.log("size:", model.scale);

    const session = renderer.xr.getSession();
    if (session.requestReferenceSpace && session.requestHitTestSource) {
        try {
            const referenceSpace = await session.requestReferenceSpace('viewer');
            hittest = await session.requestHitTestSource({ space: referenceSpace });
            hittestrq = true;
            session.addEventListener('select', onSelect);
        } catch (error) {
            console.error(error);
        }
    } else {
        console.warn("brake hit");
    }
});

renderer.xr.addEventListener('sessionend', () => {
    console.log("stop ar");
    removeARModels();
    noneAR();
    model.position.set(-1,0,0);
    model.scale.set(0.5,0.5,0.5);
});


function removeNonARModels() {
    nonARObjects.forEach(object => {
        scene.remove(object);
    });
    nonARObjects = []; 
}


function removeARModels() {
    arObjects.forEach(object => {
        scene.remove(object);
    });
    arObjects = [];
}

// this took so long used chatgpt to try to fix it hours of truble shooting to find out just needed to wait a bit
function onSelect(event) {
    console.log("AR Select Triggered");

    if (!hittest) { 
        console.log("test1"); 
        return; 
    }

    const frame = event.frame;
    if (!frame) { 
        console.log("test2"); 
        return; 
    }

    const hitTestResults = frame.getHitTestResults(hittest);

    if (hitTestResults.length > 0) {
        console.log("test3");
        const hit = hitTestResults[0];
        const pose = hit.getPose(renderer.xr.getReferenceSpace());

        if (pose) {
            console.log("test4 work please");
            loader.load('./kentucky_chicken_bucket/scene.gltf', (gltf) => {
                const newModel = gltf.scene;
                newModel.scale.set(0.1, 0.1, 0.1);
                newModel.position.set(
                    pose.transform.position.x,
                    pose.transform.position.y,
                    pose.transform.position.z
                );
                scene.add(newModel);
                arObjects.push(newModel);
            }, undefined, (error) => {
                console.error('Model Load Error:', error);
            });
        }
    }
}

noneAR();
placeModel();
