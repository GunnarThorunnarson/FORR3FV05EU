// importa hluti fyrir hand tracking 
import { GestureRecognizer, FilesetResolver, DrawingUtils } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';

//importa hluti fyrir threejs
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

//animejs
import {animate} from './anime.esm.min.js';

//gera senu fyrir threejs
const scene = new THREE.Scene();

// containter fyrir threejs
const container = document.getElementById("three-container");

// myndavél
const camera3D = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);

//staðsetning og hvar myndavélin horfir
camera3D.position.set(0, 2, 10); 
camera3D.lookAt(0, 0, 0); 

// renderer fyrir senu
const renderer = new THREE.WebGLRenderer({ antialias: true });

//skuggar (þarf ekki)
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//svartan bakgrunn
renderer.setClearColor(0x000000);

//stærð rendererer
renderer.setSize(container.clientWidth, container.clientHeight);

//setir í renderer í container
container.appendChild(renderer.domElement);

// resizers rendweree hvert til þess að það passi container
function resizeRenderer() {

  // breyttir stærp
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height);

  // breyttir ascpect myndavél
  camera3D.aspect = width / height;
  camera3D.updateProjectionMatrix();
}

// hlustar á resize event
window.addEventListener("resize", resizeRenderer);

//ljós fyrir senu
const ljos = new THREE.SpotLight(0xffffff, 2000, 100, 0.5, 0.5);

//staðsetning ljós og hvar það horfir
ljos.position.set(0, 25, 0);
ljos.target.position.set(0, 0, 0);

//skuggar ljós
ljos.castShadow = true;
ljos.shadow.bias = -0.00001;

//bættir við ljós í senu
scene.add(ljos.target);
scene.add(ljos);


// Load model
const loader = new GLTFLoader().setPath('./asset/vin/');

// breyta sem munn vera global fyrir 3js object
let desktopVinyl;

// group fyrir threejs objeect (til þess að transform, scale og rotate virki)
const desktopGroup = new THREE.Group();

//loadereere
loader.load('scene.gltf', (gltf) => {

    // bætir við 3D hlutnum í senu
    desktopVinyl = gltf.scene;

    // bætir við skugga, doesnt really matter
    desktopVinyl.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    //staðsetning og stærð 3js object
    desktopVinyl.position.set(0, 10, 0);
    desktopVinyl.scale.set(10,10,10);

    // bætir við mesh model í group
    desktopGroup.add(desktopVinyl);

    // center mesh
    const box = new THREE.Box3().setFromObject(desktopVinyl);
    const center = box.getCenter(new THREE.Vector3());
    desktopVinyl.position.sub(center);

    // bætir við mesh í senu
    scene.add(desktopGroup);
});

// animate object 
function animater() {
  requestAnimationFrame(animater);
  renderer.render(scene, camera3D);
}
animater();

// fall sem munn sýna hvað gesture er sýnt með emoji og animation
function SynaEmoji(emoji) {
  gestureOutput.innerText = emoji;
  const animation = animate(gestureOutput, {
    scale: [1, 2],
    ease: 'outBounce',
    duration: 100,
  });
}

// breyta fyrir gesture recognition
let gestureRecognizer;

//hvernig það er captured gestures
let runningMode = 'IMAGE';

//takki til að kveikja 
let enableWebcamButton;

// breyta sem skoðar ef myndavél er í gangi
let webcamRunning = false;

// stærð fyrir video og canvas
const videoWidth = window.innerWidth;
const videoHeight = window.innerHeight;

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
createGestureRecognizer()


// Fyrir myndband og úttak frá gesture niðustöðum
const video = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureOutput = document.getElementById('gesture_output');
let lastGesture = null;

// event listener fyrir vefmyndavélatakka
enableWebcamButton = document.getElementById('webcamButton');
enableWebcamButton.addEventListener('click', enableCam);

// Fall til að kveikja/slökkva á vefmyndavél og byrja gesture recognition
function enableCam(event) {
  if (!gestureRecognizer) {
    alert('Please wait for gestureRecognizer to load');
    return;
  }

  // k'ikir ef `
  if (webcamRunning === true) {
    webcamRunning = false;
    let tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;


    canvasElement.style.display = "none";
    return;
  } else {
    webcamRunning = true;
  }

  // Fá aðgang að myndav'el og senta straum í video element og resize renderere
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      video.play();

      canvasElement.style.display = "block";

      video.addEventListener('loadeddata', predictWebcam);
      video.addEventListener("loadedmetadata", () => {
      resizeRenderer(); 
      });
    })

}

// breyta til að fylgjast með síðasta tíma í myndbandi
let lastVideoTime = -1;
let results = undefined;

// Fall til að greina gestures í myndbandsstraums myndavélar
async function predictWebcam() {

  // fá video element og webcam element
  const webcamElement = document.getElementById('webcam');

  // breyta stillingum ef það var í IMAGE mode
  if (runningMode === 'IMAGE') {
    runningMode = 'VIDEO';
    await gestureRecognizer.setOptions({ runningMode: 'VIDEO' });
  }

  // tími
  let nowInMs = Date.now();

  // aðeins senda nýja ramma ef tími hefur breyst
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = await gestureRecognizer.recognizeForVideo(video, nowInMs); 
  }

  // teikna niðurstöður
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // teikna
  const drawingUtils = new DrawingUtils(canvasCtx);

  // canvas sama stærp og video
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;


  // lita hönd 
  if (results && results.landmarks) {
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

  // output gesture
  if (results && results.gestures && results.gestures.length > 0) {
    gestureOutput.style.display = 'block';
    gestureOutput.style.width = videoWidth;
  } else {
    gestureOutput.style.display = 'none';
  }

  // endurtekning
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }

  // ef allt er að virka
  if (desktopVinyl && results && results.gestures && results.gestures.length > 0) {

  // gesture sem notandi er að gera
  const gesture = results.gestures[0][0].categoryName;

    // ef nýtt gesture, nýtt emoji og animation
    if (gesture !== lastGesture) {
      lastGesture = gesture;

      switch (lastGesture) {
        case "Open_Palm":   SynaEmoji("🖐️"); break;
        case "Closed_Fist": SynaEmoji("✊"); break;
        case "Pointing_Up": SynaEmoji("☝️"); break;
        case "Thumb_Up":    SynaEmoji("👍"); break;
        case "Thumb_Down":  SynaEmoji("👎"); break;
      }
    }

    // gera eftir havð er sýnt
    switch (gesture) {
        case "Open_Palm":
          desktopGroup.scale.multiplyScalar(1.01);
          break;
        case "Closed_Fist":
          desktopGroup.scale.multiplyScalar(0.99);
          break;
        case "Pointing_Up":
          desktopGroup.rotation.y += 0.01;
          break;
        case "Thumb_Up":
          desktopGroup.position.x += 0.05;
          break;
        case "Thumb_Down":
          desktopGroup.position.x -= 0.05;
          break;
      }
  }
}

