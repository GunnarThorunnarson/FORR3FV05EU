// 1. Initial Setup
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

let container;
let controller;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;




const canvas = document.querySelector('#c');
container = document.getElementById('container');

// scene
const scene = new THREE.Scene();


// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
renderer.setAnimationLoop(animate);

container.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

// camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(-1, 3, -3);
controls.update();

// AmbientLight
const color = 0x353b7f;
const intensity = 1;
const light = new THREE.AmbientLight(color, intensity);
scene.add(light);
// DirectionLight
const directionalLight = new THREE.DirectionalLight(0xFFC9AF, 4);
directionalLight.position.set(1, 15, 1); //default; light shining from top
directionalLight.castShadow = true; // default false
scene.add(directionalLight);
// DirectionLight shadow
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 100;

const xrScene = scene.clone();


// scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));
// const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
// scene.add(helper);

//obj
const diffuse = new THREE.TextureLoader().load('./Assets/Textures/Dry_Riverbed_Rock/textures/dry_riverbed_rock_diff_2k.jpg');
const normalMap = new THREE.TextureLoader().load('./Assets/Textures/Dry_Riverbed_Rock/textures/dry_riverbed_rock_nor_gl_2k.jpg');
const aoMap = new THREE.TextureLoader().load('./Assets/Textures/Dry_Riverbed_Rock/textures/dry_riverbed_rock_arm_2k.jpg');
const roughMap = new THREE.TextureLoader().load('./Assets/Textures/Dry_Riverbed_Rock/textures/dry_riverbed_rock_arm_2k.jpg');
const metalMap = new THREE.TextureLoader().load('./Assets/Textures/Dry_Riverbed_Rock/textures/dry_riverbed_rock_arm_2k.jpg');

const geometry = new THREE.BoxGeometry(10, 10, 10);
const material = new THREE.MeshStandardMaterial(
  {
    map: diffuse,
    aoMap: aoMap,
    roughnessMap: roughMap,
    metalnessMap: metalMap,
    normalMap: normalMap
  }
);

const mesh = new THREE.Mesh(geometry, material);
mesh.receiveShadow = true;
scene.add(mesh);
mesh.position.x = 0;
mesh.position.y = -10;


// GLTF
const gltfLoader = new GLTFLoader();
gltfLoader.load('./Assets/Barrel/scene.gltf', (gltf) => {

  gltf.scene.traverse(function (child) {

    if (child.isMesh) {

      child.castShadow = true;
      child.receiveShadow = true;
    }

  });

  gltf.scene.scale.set(5, 5, 5);
  gltf.scene.position.y = -5;
  scene.add(gltf.scene)
})
gltfLoader.load('./Assets/BeerStein/3DModel_LowPoly.gltf', (gltf) => {
  gltf.scene.traverse(function (child) {

    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  gltf.scene.rotation.x = -0.28;
  gltf.scene.rotation.z = -0.1;



  gltf.scene.position.y = 0.15;
  gltf.scene.scale.set(6, 6, 6);

  scene.add(gltf.scene);

  anime({
    targets: [gltf.scene.position],
    y: 1,
    easing: "easeInOutSine",
    duration: 8000,
    direction: "alternate",
    loop: true
  });

  anime({
    targets: [gltf.scene.rotation],
    y: 3, x: 0.5, z: 0.5,
    easing: "easeInOutSine",
    duration: 8000,
    direction: "alternate",
    loop: true
  });
});


function onSelect() {

  if (reticle.visible) {
    gltfLoader.load('./Assets/BeerStein/3DModel_LowPoly.gltf', (gltf) => {
      gltf.scene.traverse(function (child) {
    
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      gltf.scene.rotation.x = -0.28;
      gltf.scene.rotation.z = -0.1;
    
    
    
      gltf.scene.position.y = 0.15;
      gltf.scene.scale.set(6, 6, 6);
    
      reticle.matrix.decompose(gltf.scene.position, gltf.scene.quaternion, gltf.scene.scale);
      xrScene.add(gltf.scene);
    
    });

    

  }

}

controller = renderer.xr.getController(0);
controller.addEventListener('select', onSelect);
xrScene.add(controller);

reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
  new THREE.MeshBasicMaterial()
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
xrScene.add(reticle);


// animation
function animate(time, frame) {

  if (frame) {

    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {

      session.requestReferenceSpace('viewer').then(function (referenceSpace) {

        session.requestHitTestSource({ space: referenceSpace }).then(function (source) {

          hitTestSource = source;

        });

      });

      session.addEventListener('end', function () {

        hitTestSourceRequested = false;
        hitTestSource = null;

      });

      hitTestSourceRequested = true;

    }

    if (hitTestSource) {

      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length) {

        const hit = hitTestResults[0];

        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

      } else {

        reticle.visible = false;

      }
    }
    renderer.render(xrScene, camera);
  }
  else {
    renderer.render(scene, camera);
    controls.update();
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  
  
}



function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

