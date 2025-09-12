// 1. Initial Setup
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HandLandmarker, GestureRecognizer, FilesetResolver, DrawingUtils } from 'mediapipe';


//
let handLandmarker
let gestureRecognizer;
let runningMode = 'IMAGE';
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = '480px';
const videoHeight = '360px';

let yangle = 0;
let xangle = 0;
let pointVector = {
  x: 0,
  y: 0,
  z: 0
};
// Setja upp gesture recognizer með sjálfgefnar stillingar
const createGestureRecognizer = async () => {
  // configure WASM binary loading
  const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
  // create gesture recognition
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'GPU'
    },
    runningMode: runningMode  // IMAGE (default) eða Video
  });

};
createGestureRecognizer();

const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
      delegate: 'GPU'
    },
    numHands: 2,
    runningMode: runningMode,
  });
};
createHandLandmarker();


// Fyrir myndband og úttak frá gesture niðustöðum
const video = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureOutput = document.getElementById('gesture_output');


// event listener fyrir vefmyndavélatakka
enableWebcamButton = document.getElementById('webcamButton');
enableWebcamButton.addEventListener('click', enableCam);
// Fall til að kveikja/slökkva á vefmyndavél og byrja gesture recognition
function enableCam(event) {
  if (!gestureRecognizer || !handLandmarker) {
    alert('Please wait for gestureRecognizer to load');
    return;
  }
  // Athugar ef að vefmyndavélin er nú þegar í gangi áður en það kveikir/slökkvir
  if (webcamRunning === true) {
    webcamRunning = false;
  }
  else {
    webcamRunning = true;
  }
  // getUsermedia parameters.
  const constraints = {
    video: true
  };
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  });
}
let lastVideoTime = -1;
let gestureResults = undefined;
let handResults = undefined;
// Fall til að greina gestures í myndbandsstraums myndavélar
async function predictWebcam() {
  const webcamElement = document.getElementById('webcam');
  // Now let's start detecting the stream.
  if (runningMode === 'IMAGE') {
    runningMode = 'VIDEO';
    await gestureRecognizer.setOptions({ runningMode: 'VIDEO' });
    await handLandmarker.setOptions({ runningMode: 'VIDEO' });
  }

  let nowInMs = Date.now();

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    // run gesture recognition on video
    gestureResults = gestureRecognizer.recognizeForVideo(video, nowInMs);
    handResults = handLandmarker.detectForVideo(video, nowInMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Teikna landmark og tengingar
  const drawingUtils = new DrawingUtils(canvasCtx);
  canvasElement.style.height = videoHeight;
  webcamElement.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  webcamElement.style.width = videoWidth;
  // teikna í canvas hnitin
  if (handResults.landmarks) {
    for (const landmarks of handResults.landmarks) {
      drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 5
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: '#FF0000',
        lineWidth: 2
      });
    }
  }

  canvasCtx.restore();
  // vinna með greininganiðurstöður
  if (gestureResults.gestures.length > 0) {
    gestureOutput.style.display = 'block';
    gestureOutput.style.width = videoWidth;
    // birta niðurstöður
    gestureOutput.innerText = gestureResults.gestures[0][0].categoryName;  // model
  }
  else {
    gestureOutput.style.display = 'none';
    gestureOutput.innerText = ''
  }
  // Kallar á endurkvæmt, til að halda áfram að greina gestures
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
  if (handResults.landmarks.length > 0) {
    const thumb = handResults.landmarks[0][4];
    const index = handResults.landmarks[0][8];
    pointVector = calculatePointingVector(thumb, index);
    
  }
  else {
    pointVector = {
      x: 0,
      y: 0,
      z: 0
    };
  }
  console.log(pointVector);
}

function calculatePointingVector(p1, p2) {
  let vector = {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
    z: p2.z - p1.z
  };
  let magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
  let normalizedVector = {
      x: vector.x / magnitude,
      y: vector.y / magnitude,
      z: vector.z / magnitude
  };
  return normalizedVector;
}



const canvas = document.querySelector('#c');
// scene
const scene = new THREE.Scene();


// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
renderer.setAnimationLoop(animate);

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
let beerStein;
gltfLoader.load('./Assets/BeerStein/3DModel_LowPoly.gltf', (gltf) => {
  beerStein = gltf
  gltf.scene.traverse(function (child) {

    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  gltf.scene.rotation.x = 0;
  gltf.scene.rotation.z = 0;



  gltf.scene.position.y = 0.4;
  gltf.scene.scale.set(6, 6, 6);

  scene.add(gltf.scene);
});



// animation
function animate(time) {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  if (handLandmarker != undefined && gestureResults != undefined && beerStein) {
    switch (gestureOutput.innerText) {
      case "Closed_Fist":
        console.log("Closed_Fist");
        beerStein.scene.rotation.y += 0.01;
        break;
      case "Open_Palm":
        console.log("Open_Palm");
        beerStein.scene.rotation.y -= 0.01;
        break;
      case "Thumb_Down":
        console.log("Thumb_Down");
        beerStein.scene.rotation.x += 0.01;
        break;
      case "Thumb_Up":
        console.log("Thumb_Up");
        beerStein.scene.rotation.x -= 0.01;
        break;
      case "Victory":
        console.log("Victory");
        beerStein.scene.rotation.z += 0.01;
        break;
      case "Pointing_Up":
        console.log("Pointing_Up");
        beerStein.scene.rotation.z -= 0.01;
        break;
      case "None":
      case "":
      default:
          beerStein.scene.position.x += pointVector.x / 100;
          beerStein.scene.position.y -= pointVector.y / 100;
          beerStein.scene.position.z -= pointVector.z / 100;
        break;
    }
  }
  
  renderer.render(scene, camera);
  controls.update();

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
