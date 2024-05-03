import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
// ↓---------------------------------Three.js---------------------------------↓
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
document.querySelector('.TheCube').appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);

var material = [
  new THREE.MeshBasicMaterial({ color: 0xFF0000 }),
  new THREE.MeshBasicMaterial({ color: 0xFFFF00 }),
  new THREE.MeshBasicMaterial({ color: 0xFF7F00 }),
  new THREE.MeshBasicMaterial({ color: 0x00FF00 }),
  new THREE.MeshBasicMaterial({ color: 0x0000FF }),
  new THREE.MeshBasicMaterial({ color: 0x9400D3 })
];
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// ↑---------------------------------Three.js---------------------------------↑

// Breytur fyrir gesture recognition
let gestureRecognizer;
let runningMode = 'IMAGE';
let enableWebcamButton;
let webcamRunning = false;

const videoHeight = '360px';
const videoWidth = '480px';

// Setja upp gesture recognizer með sjálfgefnar stillingar
const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU'
      },
      runningMode: runningMode
  });
};
createGestureRecognizer();

// Setja upp HTML stak fyrir myndbanda og gesture frálagsgögn
const video = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureOutput = document.getElementById('gesture_output');
const gestureOutputSymbol = document.getElementById('gesture_output_symbol');
const xOutput = document.getElementById('x_output');
const yOutput = document.getElementById('y_output');

// event listener fyrir vefmyndavéla takkann
enableWebcamButton = document.getElementById('webcamButton');
enableWebcamButton.addEventListener('click', enableCam);

// Fall til að kveikja/slökkva á vefmyndavél og byrja gesture recognition
function enableCam(event) {
  if (!gestureRecognizer) {
      alert('Please wait for gestureRecognizer to load');
      return;
  }
  // Tjékkar ef að vefmyndavélin er nú þegar í gangi áður en það kveikir/slökkvir
  if (webcamRunning === true) {
      webcamRunning = false;
  }
  else {
      webcamRunning = true;
  }
  // „getUsermedia“ stiki
  const constraints = {
      video: true
  };
  // Ná í myndbandsstraum vefmyndavélarinnar
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      video.srcObject = stream;
      video.addEventListener('loadeddata', predictWebcam);
  });
}
let lastVideoTime = -1;
let results = undefined;
// Fall til að greina gestures í myndbandsstraums vefmyndavélarinnar
async function predictWebcam() {
  const webcamElement = document.getElementById('webcam');
  if (runningMode === 'IMAGE') {
      runningMode = 'VIDEO';
      await gestureRecognizer.setOptions({ runningMode: 'VIDEO' });
  }

  let nowInMs = Date.now();

  if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  // Teiknar landmark og tengingar á frálags-canvas
  const drawingUtils = new DrawingUtils(canvasCtx);
  canvasElement.style.height = videoHeight;
  webcamElement.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  webcamElement.style.width = videoWidth;

  if (results.landmarks) {
      for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
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
  // Byrtir gesture frálagsgögn
  if (results.gestures.length > 0) {
      gestureOutput.style.display = 'block'; // Myndavélastraum stíll
      gestureOutput.style.width = videoWidth; // Myndavélastraum breydd
      gestureOutput.innerText = results.gestures[0][0].categoryName; // Gesture úttaksheiti

      parseFloat(xOutput.innerText = results.landmarks[0][0].x.toFixed(2)); // Gesture X gildi
      parseFloat(yOutput.innerText = results.landmarks[0][0].y.toFixed(2)); // Gesture Y gildi

      console.log(gestureOutput.innerText)
  }
  else {
      gestureOutput.style.display = 'none';
  }
  // Kallar á „predictWebcam“ endurkvæmt, til að halda áfram að greina gestures
  if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
  }
}
// breytir stærð og Snýr 3D cube model-inu út frá greindum gestures
function animate() {
  requestAnimationFrame(animate);
  // ______________________________X______________________________
  if (results.gestures[0][0].categoryName === "Thumb_Up") {
      gestureOutputSymbol.innerText = "↑👍";
      cube.rotation.x += 0.01;
  } else if (results.gestures[0][0].categoryName === "Thumb_Down") {
      gestureOutputSymbol.innerText = "↓👎";
      cube.rotation.x -= 0.01;
  }
  // ______________________________Y______________________________
  if (results.gestures[0][0].categoryName === "Victory") {
      gestureOutputSymbol.innerText = "←✌️";
      cube.rotation.y += 0.01;
  } else if (results.gestures[0][0].categoryName === "ILoveYou") {
      gestureOutputSymbol.innerText = "→🤟";
      cube.rotation.y -= 0.01;
  }
  // ______________________________scale______________________________
  if (results.gestures[0][0].categoryName === "Open_Palm") {
      gestureOutputSymbol.innerText = "↔✋";
      cube.scale.x += 0.01;
      cube.scale.y += 0.01;
      cube.scale.z += 0.01;
  } else if (results.gestures[0][0].categoryName === "Closed_Fist") {
      gestureOutputSymbol.innerText = "→←✊";
      cube.scale.x -= 0.01;
      cube.scale.y -= 0.01;
      cube.scale.z -= 0.01;
  }

  renderer.render(scene, camera);
}

animate();