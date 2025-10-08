import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

// ----- DOM Elements -----
const webcam = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement?.getContext("2d");
const enableWebcamButton = document.getElementById("webcamButton");

// Debug DOM
console.log("DOM elements:", { webcam: !!webcam, canvas: !!canvasElement, btn: !!enableWebcamButton });

// ----- Configuration -----
const DRAW_LANDMARKS = true;
const MIRROR_X = false; // Set true if webcam/canvas is CSS mirrored
const MODEL_PATH = "./models/pokemon/3DModel.gltf";        
const TASK_PATH  = "./models/hand_landmarker.task";        
const SMOOTH_ALPHA = 0.55;          // 0..1: higher = snappier, lower = smoother
const TRANSLATE_GAIN = 2.2;         // tune how far the model moves per hand move

// --- Y-rotation from wrist twist
const ROTATE_Y_GAIN = 1.0;   // radians multiplier
const ROTATE_Y_DIR  = 1;     // flip to -1 if direction feels reversed

// --- Pinch + depth → scale ---
const PINCH_ON  = 0.36;  // was 0.32
const PINCH_OFF = 0.42;  // was 0.38
const SCALE_DEPTH_GAIN = 1.0;      // 0.6–1.5 typical
const SCALE_MIN = 0.1, SCALE_MAX = 10;

// Require "others up" so it doesn't conflict with fist
const PINCH_REQUIRE_INDEX = false;  // index curls during pinch → false recommended
const PINCH_REQUIRE_PINKY = false;

// choose which depth metric to use
const DEPTH_MODE = "width";         // "width" (robust) or "z" (noisier)

// --- Fist detection via finger curl (stable) ---
const CURL_EXTENDED_THRESHOLD = 1.1; 
const FINGER_JOINTS = {
  index:  [5, 6, 8],
  middle: [9,10,12],
  ring:   [13,14,16],
  pinky:  [17,18,20],
};

function angleAtPIP(hand, mcp, pip, tip) {
  const ax = hand[mcp].x - hand[pip].x, ay = hand[mcp].y - hand[pip].y;
  const bx = hand[tip].x - hand[pip].x, by = hand[tip].y - hand[pip].y;
  const al = Math.hypot(ax, ay) || 1e-6;
  const bl = Math.hypot(bx, by) || 1e-6;
  const dot = (ax*bx + ay*by) / (al*bl);
  return Math.acos(Math.max(-1, Math.min(1, dot))); // radians
}

function isFingerExtendedByCurl(hand, finger, thr = CURL_EXTENDED_THRESHOLD) {
  const [mcp, pip, tip] = FINGER_JOINTS[finger];
  return angleAtPIP(hand, mcp, pip, tip) > thr;
}

function isClosedFist(hand) {
  // closed if <= 1 finger extended (thumb ignored)
  let ext = 0;
  if (isFingerExtendedByCurl(hand, "index"))  ext++;
  if (isFingerExtendedByCurl(hand, "middle")) ext++;
  if (isFingerExtendedByCurl(hand, "ring"))   ext++;
  if (isFingerExtendedByCurl(hand, "pinky"))  ext++;
  return ext <= 1;
}

// --- Utility functions ---
function lerp(a,b,t){ return a+(b-a)*t; }
function smoothLandmarks(prev, next) {
  if (!next) return prev;
  if (!prev) return next.map(p => ({...p}));
  return next.map((p,i)=>({ x: lerp(prev[i].x,p.x,SMOOTH_ALPHA),
                            y: lerp(prev[i].y,p.y,SMOOTH_ALPHA),
                            z: lerp(prev[i].z??0,p.z??0,SMOOTH_ALPHA) }));
}

// Palm twist and angle delta functions for rotation
function palmTwist(hand) {
  const a = hand[5], b = hand[17]; // index MCP -> pinky MCP
  let dx = b.x - a.x, dy = b.y - a.y;
  if (MIRROR_X) dx = -dx;
  return Math.atan2(dy, dx);
}

function angleDelta(a, b) {
  // minimal signed difference a - b in (-π, π]
  let d = a - b;
  if (d >  Math.PI) d -= 2*Math.PI;
  if (d <= -Math.PI) d += 2*Math.PI;
  return d;
}

// --- Pinch detection helpers ---
// distance normalized by hand width: thumb tip (4) ↔ index tip (8)
function pinchRatio(hand) {
  const d = Math.hypot(hand[4].x - hand[8].x, hand[4].y - hand[8].y);
  const w = Math.hypot(hand[5].x - hand[17].x, hand[5].y - hand[17].y) || 1e-6;
  return d / w;
}

// hysteresis so pinch doesn't flicker
function isPinchingStable(prevActive, hand) {
  const r = pinchRatio(hand);
  if (!prevActive) return r < PINCH_ON; // turn on
  return r < PINCH_OFF;                 // stay on until OFF crossed
}

// require pinch AND at least one of {middle, ring} up (not both)
function isPinchWithOthersUp(hand) {
  const pinch = isPinchingStable(pinchActive, hand);
  const midUp  = isFingerExtendedByCurl(hand, "middle", CURL_EXTENDED_THRESHOLD);
  const ringUp = isFingerExtendedByCurl(hand, "ring",   CURL_EXTENDED_THRESHOLD);

  // require at least one of middle/ring up; keep optional gates
  const pinkyOk = PINCH_REQUIRE_PINKY ? isFingerExtendedByCurl(hand,"pinky",CURL_EXTENDED_THRESHOLD) : true;
  const indexOk = PINCH_REQUIRE_INDEX ? isFingerExtendedByCurl(hand,"index",CURL_EXTENDED_THRESHOLD) : true;

  return pinch && (midUp || ringUp) && pinkyOk && indexOk;
}

// Depth metrics
function handWidthMetric(hand) { // bigger when closer
  return Math.hypot(hand[5].x - hand[17].x, hand[5].y - hand[17].y) || 1e-6;
}
function palmZMetric(hand) {     // average z of palm points (sign/direction varies by model)
  // use wrist(0), mcp(5,9,13,17)
  const ids = [0,5,9,13,17];
  let sum = 0;
  for (const i of ids) sum += (hand[i].z || 0);
  return sum / ids.length; // note: may be negative when closer
}
function depthValue(hand) {
  if (DEPTH_MODE === "z") return palmZMetric(hand); // closer likely more negative
  return handWidthMetric(hand);                      // closer ⇒ larger
}

// --- Mode badge update function ---
function setModeBadge(m) {
  if (!modeEl) return;
  let label = "Idle", bg = "#eee", fg = "#000";
  if (m === MODE.CLOSED_ROTATE) { label = "Rotate/Move"; bg = "#f3e8ff"; fg = "#6b21a8"; }
  if (m === MODE.PINCH_SCALE)   { label = "Scale";       bg = "#e8ffe6"; fg = "#166534"; }
  modeEl.textContent = label;
  modeEl.style.background = bg;
  modeEl.style.color = fg;
}

// Reuse vectors to avoid GC
const _ndc = new THREE.Vector3();
const _cam = new THREE.Vector3();
const _dir = new THREE.Vector3();
function ndcToWorldOnPlane(ndcX, ndcY, planeZ = 0) {
  _ndc.set(ndcX, ndcY, 0.5).unproject(camera);
  _cam.copy(camera.position);
  _dir.copy(_ndc).sub(_cam).normalize();
  const t = (planeZ - _cam.z) / _dir.z;
  return _cam.addScaledVector(_dir, t); // returns _cam; use immediately or copy
}        

// --- Three.js ---
let scene, camera, renderer, pivot, model;

// --- MediaPipe ---
let handLandmarker = null;
let runningMode = "IMAGE";
let webcamRunning = false;
let lastVideoTime = -1;

// --- Visual feedback modes ---
const MODE = { NONE: 0, CLOSED_ROTATE: 1, PINCH_SCALE: 2 };
let mode = MODE.NONE;
const modeEl = document.getElementById("mode");
let controlPulse = 0; // 0..1 for model pulse animation

// --- Gesture state ---
// Smoothing buffer for first hand
const CTRL = { smooth2D: [null, null] };

// Incremental translation reference
let fistPrevWorld = null;   // THREE.Vector3 we keep between frames
let prevTwistY = null;      // previous wrist twist angle for Y-rotation

// Pinch + depth scale state
let pinchActive = false;
let depthBase   = 0;                // baseline depth metric at pinch start
let scaleBase   = 1;                // pivot scale at pinch start

// Debounce for pinch enter/leave
let pinchEnterCount = 0, pinchLeaveCount = 0;
const PINCH_ENTER_FRAMES = 2;
const PINCH_LEAVE_FRAMES = 2;

// --- perf helpers for overlay ---
let _frameCount = 0;

// ---------- Three.js setup ----------
function setupThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  camera = new THREE.PerspectiveCamera(50, 640/480, 0.1, 1000);
  camera.position.set(0, 1, 2);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(640, 480);
  renderer.setPixelRatio(1);
  document.getElementById("three-container").appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(2,2,2);
  scene.add(dir);
}

async function loadModel() {
  const loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync(MODEL_PATH);
    model = gltf.scene;

    // Pivot so future rotations/scale happen in place
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());

    pivot = new THREE.Group();
    model.position.sub(center);
    pivot.add(model);
    scene.add(pivot);

    // Initialize emissive for pulse effect
    model.traverse(o => {
      if (o.isMesh && o.material && 'emissive' in o.material) {
        o.material.emissive.setRGB(1, 1, 1);
        o.material.emissiveIntensity = 0.0;
      }
    });

    fitCameraToBox(camera, box, 1.25);
  } catch (err) {
    console.error("GLTF load failed:", err);
    // Fallback cube
    const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshStandardMaterial({ color: 0x44aa88 });
    model = new THREE.Mesh(geo, mat);
    pivot = new THREE.Group();
    pivot.add(model);
    scene.add(pivot);
    
    // Initialize emissive for pulse effect
    model.traverse(o => {
      if (o.isMesh && o.material && 'emissive' in o.material) {
        o.material.emissive.setRGB(1, 1, 1);
        o.material.emissiveIntensity = 0.0;
      }
    });
  }
}

function fitCameraToBox(cam, box, offset = 1.25) {
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = cam.fov * Math.PI / 180;
  const dist = (maxDim / (2 * Math.tan(fov / 2))) * offset;
  cam.position.set(0, 0, dist);
  cam.near = Math.max(0.01, dist / 100);
  cam.far  = dist * 100;
  cam.updateProjectionMatrix();
  cam.lookAt(0, 0, 0);
}

// ---------- MediaPipe setup ----------
async function setupHandLandmarker() {
  // disable the button until the model loads
  enableWebcamButton.disabled = true;
  enableWebcamButton.textContent = "Loading hand model…";

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: TASK_PATH, delegate: "GPU" },
    numHands: 1,         
    runningMode,         // "IMAGE" -> will switch to "VIDEO" on first frame
  });

  enableWebcamButton.disabled = false;
  enableWebcamButton.textContent = "Enable Webcam";
}

// ---------- Webcam toggle ----------
function enableCam() {
  if (!handLandmarker) {
    console.log("Wait for handLandmarker to load before clicking!");
    return;
  }
  if (!webcam || !canvasElement || !canvasCtx) {
    console.error("Required DOM elements not found!");
    return;
  }

  webcamRunning = !webcamRunning;

  if (webcamRunning) {
    navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" }
    })
    .then(stream => {
      webcam.srcObject = stream;
      webcam.addEventListener("loadeddata", async () => {
        canvasElement.width = webcam.videoWidth || 640;
        canvasElement.height = webcam.videoHeight || 480;
        if (runningMode === "IMAGE") {
          runningMode = "VIDEO";
          await handLandmarker.setOptions({ runningMode: "VIDEO" });
        }
      }, { once: true });
    })
    .catch(err => {
      console.error("getUserMedia error:", err);
      webcamRunning = false;
      enableWebcamButton.textContent = "Enable Webcam";
    });

    enableWebcamButton.textContent = "Disable Webcam";
  } else {
    const stream = webcam.srcObject;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      webcam.srcObject = null;
    }
    enableWebcamButton.textContent = "Enable Webcam";
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  }
}

// attach once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    enableWebcamButton.addEventListener("click", enableCam);
  });
} else {
  enableWebcamButton.addEventListener("click", enableCam);
}

// ---------- Main loop ----------
function loop(ts) {
  // 1) Run detection only on new video frames
  if (webcamRunning && handLandmarker && webcam.readyState >= 2) {
    if (webcam.currentTime !== lastVideoTime) {
      lastVideoTime = webcam.currentTime;

      const results = handLandmarker.detectForVideo(webcam, ts || performance.now());

      // Smooth first hand (we only use one hand for this gesture)
      const raw = results?.landmarks?.[0] || null;
      CTRL.smooth2D[0] = raw ? smoothLandmarks(CTRL.smooth2D[0], raw) : null;
      const hand = CTRL.smooth2D[0];

      // ----- GESTURE DETECTION -----
      if (hand && pivot) {
        const isFist = isClosedFist(hand);
        const pinchPoseNow = isPinchWithOthersUp(hand);

        // Decide mode with clear priority:
        // fist (rotate+move) > pinch (scale) > open (idle here; you can add translate if you want)
        if (isFist) {
          mode = MODE.CLOSED_ROTATE;

          // ----- TRANSLATE (fist) -----
          let x = hand[0].x, y = hand[0].y; // wrist
          if (MIRROR_X) x = 1 - x;
          const ndcX = x * 2 - 1, ndcY = -(y * 2 - 1);
          const pNow = ndcToWorldOnPlane(ndcX, ndcY, 0).clone();
          if (!fistPrevWorld) fistPrevWorld = pNow.clone();
          else {
            pivot.position.x += (pNow.x - fistPrevWorld.x) * TRANSLATE_GAIN;
            pivot.position.y += (pNow.y - fistPrevWorld.y) * TRANSLATE_GAIN;
            fistPrevWorld.copy(pNow);
          }

          // ----- ROTATE (fist wrist twist → Y) -----
          const tw = palmTwist(hand);
          if (prevTwistY == null) prevTwistY = tw;
          const d = angleDelta(tw, prevTwistY);
          if (Math.abs(d) > 0.01) pivot.rotateY(ROTATE_Y_DIR * d * ROTATE_Y_GAIN);
          prevTwistY = tw;

        } else if (pinchPoseNow) {
          mode = MODE.PINCH_SCALE; // scaling handled below in the pinch section
          fistPrevWorld = null;
          prevTwistY = null;

        } else {
          // open/idle
          mode = MODE.NONE;
          fistPrevWorld = null;
          prevTwistY = null;
        }

      } else {
        // no hand or no pivot → idle
        mode = MODE.NONE;
        fistPrevWorld = null;
        prevTwistY = null;
      }

      // ----- PINCH + DEPTH → SCALE -----
      if (hand && pivot) {
        const pinchPoseNow = isPinchWithOthersUp(hand);

        // Debounced enter/exit pinch state
        if (!pinchActive) {
          if (pinchPoseNow && ++pinchEnterCount >= PINCH_ENTER_FRAMES) {
            pinchActive = true;
            pinchEnterCount = 0;
            // seed baselines
            depthBase = depthValue(hand);
            scaleBase = pivot.scale.x;
          } else if (!pinchPoseNow) {
            pinchEnterCount = 0;
          }
        } else {
          if (!pinchPoseNow && ++pinchLeaveCount >= PINCH_LEAVE_FRAMES) {
            pinchActive = false;
            pinchLeaveCount = 0;
          } else if (pinchPoseNow) {
            pinchLeaveCount = 0;
          }
        }

        // Apply scaling when pinchActive
        if (pinchActive) {
          const dNow = depthValue(hand);

          let factor;
          if (DEPTH_MODE === "z") {
            const delta = (depthBase - dNow);            // closer -> positive if z decreases
            factor = Math.exp(SCALE_DEPTH_GAIN * delta); // exponential feels smooth
          } else {
            // hand width: closer -> larger value -> scale up
            const ratio = Math.max(1e-6, dNow / Math.max(1e-6, depthBase));
            factor = Math.pow(ratio, SCALE_DEPTH_GAIN);
          }

          const s = THREE.MathUtils.clamp(scaleBase * factor, SCALE_MIN, SCALE_MAX);
          pivot.scale.set(s, s, s);
        }
      }

      // Update mode badge
      setModeBadge(mode);

      // Control pulse animation for model
      const controlling = (mode !== MODE.NONE);
      controlPulse += (controlling ? 0.1 : -0.12);
      controlPulse = THREE.MathUtils.clamp(controlPulse, 0, 1);

      // Apply subtle emissive pulse to model
      if (model) {
        const e = 0.05 * controlPulse;
        model.traverse(o => {
          if (o.isMesh && o.material && 'emissiveIntensity' in o.material) {
            o.material.emissiveIntensity = e;
          }
        });
      }

      // draw landmarks for visualization only
      if (DRAW_LANDMARKS) drawLandmarksThrottled(results);
      else canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
  }

  // 2) Render 3D scene (no model transforms applied here)
  renderer.render(scene, camera);

  requestAnimationFrame(loop);
}

function drawLandmarksThrottled(results) {
  if (!canvasCtx) return; // Guard against null canvas context
  _frameCount++;
  if ((_frameCount % 2) !== 0) return; // draw every 2nd frame to save time

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);
  
  // Color landmarks based on current mode
  const color =
    mode === MODE.CLOSED_ROTATE ? "#6b21a8" :
    mode === MODE.PINCH_SCALE   ? "#166534" : "#666";
  
  for (const landmarks of (results.landmarks || [])) {
    drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color, lineWidth: 3 });
    drawingUtils.drawLandmarks(landmarks, { color, lineWidth: 1 });
  }
  canvasCtx.restore();
}

// ---------- Init ----------
async function init() {
  setupThree();
  await loadModel();
  await setupHandLandmarker();
  requestAnimationFrame(loop);
}

init().catch(e => console.error("Init error:", e));