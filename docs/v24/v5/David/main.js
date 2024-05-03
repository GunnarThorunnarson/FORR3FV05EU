import * as THREE from "three";

function calculateYawAngle(point1, point2, point3) {
  // Calculate the vectors v1 and v2
  let v1 = {
    x: point2.x - point1.x,
    y: point2.y - point1.y,
    z: point2.z - point1.z,
  };

  let v2 = {
    x: point3.x - point1.x,
    y: point3.y - point1.y,
    z: point3.z - point1.z,
  };

  // Calculate the cross product of v1 and v2 to get the normal vector N
  let N = {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };

  // Normalize the normal vector
  let magnitude = Math.sqrt(N.x * N.x + N.y * N.y + N.z * N.z);
  let normalizedN = {
    x: N.x / magnitude,
    y: N.y / magnitude,
    z: N.z / magnitude,
  };

  // Calculate the yaw angle using atan2
  let yawRadians = Math.atan2(normalizedN.x, normalizedN.z);

  // Convert radians to degrees
  let yawDegrees = yawRadians * (180 / Math.PI);

  // Ensure the angle is in the range [0, 360)
  if (yawDegrees < 0) {
    yawDegrees += 360;
  }

  return yawDegrees;
}

let results = undefined;
let alpha = 1;

// Variables to store the previous smoothed landmarks

let yangle = 0;
let xangle = 0;

// Get a reference to the container element that will hold our scene
const container = document.querySelector("#scene-container");
// Create a Scene
const scene = new THREE.Scene();

// Set the background color
scene.background = new THREE.Color("white");

// Create a camera
const fov = 35; // AKA Field of View
const aspect = container.clientWidth / container.clientHeight;
const near = 0.1; // the near clipping plane
const far = 100; // the far clipping plane

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

// Move the camera back so we can view the scene
camera.position.set(0, 10, 30);

const cubematerial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0xcd9933),
});
const cubegeometry = new THREE.BoxGeometry(4, 4, 4);
const cube = new THREE.Mesh(cubegeometry, cubematerial);

const donutmaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x0064c6),
});
const ballgeometry = new THREE.SphereGeometry(2, 32, 32);
const ball = new THREE.Mesh(ballgeometry, donutmaterial);
ball.position.set(0, 4, 0);

// Create the renderer
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  preserveDrawingBuffer: true,
  precision: "lowp",
  antialias: true,
}); // canvas: canvas

// Next, set the renderer to the same size as our container element
renderer.setSize(container.clientWidth, container.clientHeight);

// Finally, set the pixel ratio so that our scene will look good on HiDPI displays
renderer.setPixelRatio(window.devicePixelRatio);

// Add the automatically created <canvas> element to the page
container.append(renderer.domElement);

const group = new THREE.Group();
group.add(cube);
group.add(ball);

scene.add(group);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
directionalLight.target = cube;
scene.add(directionalLight);

camera.lookAt(cube.position);

const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

function onWindowResize() {
  location.reload();
}
window.addEventListener("resize", onWindowResize);

let webcamRunning = false;

function animate() {
  //   group.rotation.y += 0.01;
  console.log("alpha", alpha);
  if (alpha > 2) {
    alpha = 2;
  } else if (alpha < 1) {
    alpha = 1;
  }

  if (true) {
    group.rotation.x = (xangle * Math.PI) / 180; // Convert to radians
    group.rotation.y = (yangle * Math.PI) / 180; // Convert to radians

    const newCubeGeometry = new THREE.BoxGeometry(
      4 * alpha,
      4 * alpha,
      4 * alpha
    ); // Example: smaller cube
    cube.geometry.dispose(); // Dispose the current geometry to free up memory
    cube.geometry = newCubeGeometry; // Assign the new geometry to the cube
    cube.updateMatrix();

    const newballGeometry = new THREE.SphereGeometry(
      2 * alpha,
      32 * alpha,
      32 * alpha
    ); // Example: smaller cube
    ball.geometry.dispose(); // Dispose the current geometry to free up memory
    ball.geometry = newballGeometry; // Assign the new geometry to the cube
    ball.updateMatrix();
  }

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

animate();

import {
  GestureRecognizer,
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

let gestureRecognizer;
let handLandmarker;
let runningMode = "IMAGE";
let enableWebcamButtonrecognition;
let enableWebcamButtonrotation;
// let webcamRunning = false;
const videoWidth = "380px";
const videoHeight = "292px";

const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: runningMode,
  });
};
createGestureRecognizer();

const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
      // modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',

      delegate: "GPU",
    },
    numHands: 2,
    runningMode: runningMode,
  });
};

createHandLandmarker();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
const iconconV = document.getElementById("iconconV");
const iconconH = document.getElementById("iconconH");
enableWebcamButtonrotation = document.getElementById("webcamButtonrotation");
enableWebcamButtonrotation.addEventListener("click", enableCamrotation);

enableWebcamButtonrecognition = document.getElementById(
  "webcamButtonrecognition"
);
enableWebcamButtonrecognition.addEventListener("click", enableCamrrcognition);

function enableCamrotation(event) {
  if (!handLandmarker) {
    alert("Wait for handLandmarker to load before clicking!");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    location.reload();
  } else {
    webcamRunning = true;
  }
  // getUsermedia parameters.
  const constraints = {
    video: true,
  };
  iconconV.style.display = "block";
  iconconH.style.display = "block";
  container.style.display = "block";
  enableWebcamButtonrecognition.style.display = "none";
  enableWebcamButtonrotation.innerText = "Go Back";

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcamrotation);
  });
}
let lastVideoTime = -1;

async function predictWebcamrotation() {
  const webcamElement = document.getElementById("webcam");

  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await handLandmarker.setOptions({ runningMode: "VIDEO" });
  }

  let nowInMs = Date.now();

  let startTimeMs = performance.now();

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;

    results = handLandmarker.detectForVideo(video, startTimeMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);
  canvasElement.style.height = videoHeight;
  webcamElement.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  webcamElement.style.width = videoWidth;

  if (results.landmarks.length > 0) {
    let r = null;
    let l = null;
    let telj = 0;
    for (const hendi of results.handednesses) {
      if (hendi[0].displayName == "Right") {
        r = telj;
      } else {
        l = telj;
      }
      telj += 1;
    }

    if (l != null) {
      const p1 = results.landmarks[l][5];
      const p2 = results.landmarks[l][17];
      const p3 = results.landmarks[l][0];
      yangle = calculateYawAngle(p1, p2, p3);
      const mid_tip = results.landmarks[l][12];
      const thumb_tip = results.landmarks[l][4];

      alpha = Math.abs(mid_tip.y - thumb_tip.y) * 10;
    }
    if (r != null) {
      const p21 = results.landmarks[r][5];
      const p22 = results.landmarks[r][17];
      const p23 = results.landmarks[r][0];
      xangle = calculateYawAngle(p21, p22, p23);
      const mid_tip = results.landmarks[r][12];
      const thumb_tip = results.landmarks[r][4];

      alpha = Math.abs(mid_tip.y - thumb_tip.y) * 10;
    }

    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );

      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
    }
  }

  canvasCtx.restore();

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcamrotation);
  }
}

function enableCamrrcognition(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    location.reload();
  } else {
    webcamRunning = true;
  }

  // getUsermedia parameters.
  const constraints = {
    video: true,
  };
  iconconV.style.display = "none";
  iconconH.style.display = "none";
  container.style.display = "none";
  enableWebcamButtonrotation.style.display = "none";
  enableWebcamButtonrecognition.innerText = "Go Back";
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcamrecognition);
  });
}

async function predictWebcamrecognition() {
  const webcamElement = document.getElementById("webcam");
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
  }

  let nowInMs = Date.now();

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);
  canvasElement.style.height = videoHeight;
  webcamElement.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  webcamElement.style.width = videoWidth;

  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
    }
  }

  canvasCtx.restore();
  if (results?.gestures?.length > 0) {
    gestureOutput.style.display = "block";
    gestureOutput.style.width = videoWidth;
    gestureOutput.innerText = results.gestures[0][0].categoryName;

    // parseFloat((xOutput.innerText = results.landmarks[0][0].x.toFixed(2)));
    // parseFloat((yOutput.innerText = results.landmarks[0][0].y.toFixed(2)));

    console.log(gestureOutput.innerText);
  } else {
    gestureOutput.style.display = "none";
  }

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcamrecognition);
  }
}
