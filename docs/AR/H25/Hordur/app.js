import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { XREstimatedLight } from 'three/addons/webxr/XREstimatedLight.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// ============================================================================
// SCENE SETUP
// ============================================================================

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 2000);
scene.add(camera);

// Renderer configuration for AR
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.setReferenceSpaceType('local');
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
document.body.appendChild(renderer.domElement);

// ============================================================================
// LIGHTING SYSTEM
// ============================================================================

let defaultEnvironment;

// Fallback lighting when AR estimation unavailable
const defaultLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
defaultLight.position.set(0.5, 1, 0.25);
scene.add(defaultLight);

// AR lighting estimation
const xrLight = new XREstimatedLight(renderer);

xrLight.addEventListener('estimationstart', () => {
  scene.add(xrLight);
  scene.remove(defaultLight);
  if (xrLight.environment) {
    scene.environment = xrLight.environment;
  }
});

xrLight.addEventListener('estimationend', () => {
  scene.add(defaultLight);
  scene.remove(xrLight);
  scene.environment = defaultEnvironment;
});

// Load HDR environment for realistic lighting
new RGBELoader()
  .setPath('https://threejs.org/examples/textures/equirectangular/')
  .load('royal_esplanade_1k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    defaultEnvironment = texture;
    scene.environment = defaultEnvironment;
});

// ============================================================================
// AR SETUP
// ============================================================================

const overlayRoot = document.getElementById('overlayRoot');

const arBtn = ARButton.createButton(renderer, {
  requiredFeatures: ['hit-test', 'anchors'],
  optionalFeatures: ['dom-overlay', 'light-estimation'],
  domOverlay: { root: overlayRoot }
});
overlayRoot.appendChild(arBtn);

// Reticle for surface detection
const reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI/2),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9 })
);

reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

// ============================================================================
// UI MANAGEMENT
// ============================================================================

const startScreenEl = document.getElementById('startScreen');
const arUIEl = document.getElementById('arUI');
const loaderEl = document.getElementById('loader');
const pctEl = document.getElementById('pct');
const barEl = document.getElementById('bar');

function showHomeUI() {
  startScreenEl.style.display = 'flex';
  arUIEl.style.display = 'none';
  renderer.domElement.style.display = 'none';
}

function showARUI() {
  startScreenEl.style.display = 'none';
  arUIEl.style.display = 'flex';
  renderer.domElement.style.display = 'block';
}

const showLoader = () => { 
  pctEl.textContent = '0%'; 
  barEl.style.width = '0%'; 
  loaderEl.style.display = 'flex'; 
};

const updateLoader = v => { 
  const p = Math.round(Math.max(0, Math.min(1, v)) * 100) + '%'; 
  pctEl.textContent = p; 
  barEl.style.width = p; 
};

const hideLoader = () => { 
  loaderEl.style.display = 'none'; 
};

// ============================================================================
// 3D MODEL SYSTEM
// ============================================================================

const MODEL_URL = './models/pokemon/3DModel.gltf';
const gltfLoader = new GLTFLoader();
let loadedModel = null;
let previewModel = null;

// ============================================================================
// GESTURE CONTROLS
// ============================================================================

const surfaceEl = document.getElementById('overlayRoot');
const pointers = new Map();
let isRotating = false;
let lastX = 0;
let initDistance = null;
let startScale = 0.5;
let currentPreviewScale = 0.5;
let previewRotationY = 0;
const ROTATE_SENSITIVITY = 0.005;

function distance(pA, pB) {
  const dx = pA.x - pB.x;
  const dy = pA.y - pB.y;
  return Math.hypot(dx, dy);
}

function isFromUI(e) {
  return e.target.closest && e.target.closest('#arUI');
}

// Pointer down: start rotation or pinch
surfaceEl.addEventListener('pointerdown', (e) => {
  if (!reticle.visible || isFromUI(e)) return;

  try { surfaceEl.setPointerCapture(e.pointerId); } catch {}
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1) {
    isRotating = true;
    lastX = e.clientX;
  } else if (pointers.size === 2) {
    isRotating = false;
    const [p0, p1] = Array.from(pointers.values());
    initDistance = distance(p0, p1);
    startScale = currentPreviewScale;
  }

  e.preventDefault();
}, { passive: false });

// Pointer move: handle rotation and scaling
surfaceEl.addEventListener('pointermove', (e) => {
  if (!reticle.visible || !pointers.has(e.pointerId)) return;

  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1 && isRotating) {
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    previewRotationY += dx * ROTATE_SENSITIVITY;
    if (previewModel) previewModel.rotation.y = previewRotationY;
  } else if (pointers.size === 2 && initDistance != null) {
    const [p0, p1] = Array.from(pointers.values());
    const newDist = distance(p0, p1);
    const pinchFactor = newDist / (initDistance || 1);
    const newScale = Math.max(0.1, Math.min(10.0, startScale * pinchFactor));
    currentPreviewScale = newScale;
    if (previewModel) previewModel.scale.setScalar(newScale);
  }

  e.preventDefault();
}, { passive: false });

// Pointer end: cleanup and state transitions
function endPointer(e) {
  if (pointers.has(e.pointerId)) {
    try { surfaceEl.releasePointerCapture(e.pointerId); } catch {}
    pointers.delete(e.pointerId);
  }

  if (pointers.size === 0) {
    isRotating = false;
    initDistance = null;
  } else if (pointers.size === 1) {
    const last = Array.from(pointers.values())[0];
    lastX = last.x;
    initDistance = null;
  }
}

surfaceEl.addEventListener('pointerup', endPointer);
surfaceEl.addEventListener('pointercancel', endPointer);
surfaceEl.addEventListener('pointerleave', endPointer);

// ============================================================================
// XR SESSION MANAGEMENT
// ============================================================================

let xrRefSpace = null, viewerSpace = null, hitTestSource = null;
let placeRequested = false;
let lastHitPose = null;
const anchors = [];

// AR session start: setup hit testing and load model
renderer.xr.addEventListener('sessionstart', async () => {
  arBtn.style.display = 'none'; // hide the built-in "Stop AR" button during a session
  showARUI();
  overlayRoot.style.display = "block"

  const session = renderer.xr.getSession();
  viewerSpace = await session.requestReferenceSpace('viewer');
  hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

  if (!loadedModel) {
    showLoader();
    loadedModel = await new Promise((resolve, reject) => {
      gltfLoader.load(
        MODEL_URL,
        (gltf) => resolve(gltf.scene),
        (e) => {
          if (e.lengthComputable) updateLoader(e.loaded / e.total);
          else updateLoader(0.5);
        },
        (e) => reject(e)
      );
    }).catch(e => { 
      console.error('GLTF load failed:', e); 
      pctEl.textContent = 'Error'; 
      setTimeout(hideLoader, 1500); 
      return null; 
    });

    if (loadedModel) {
      loadedModel.traverse(n => { 
        if (n.isMesh) { 
          n.castShadow = true; 
          n.receiveShadow = true; 
        } 
      });
      updateLoader(1); 
      setTimeout(hideLoader, 200);
    }

    // Create preview model for placement
    if (loadedModel && !previewModel) {
      previewModel = loadedModel.clone(true);
      previewModel.scale.setScalar(currentPreviewScale);
      previewModel.position.y = 0.01;
      previewModel.traverse(n => {
        if (n.isMesh) {
          n.material = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
          });
          n.castShadow = false;
          n.receiveShadow = false;
        }
      });
      previewModel.visible = false;
      reticle.add(previewModel);
    }
  }
});

// AR session end: cleanup state
renderer.xr.addEventListener('sessionend', () => {
  arBtn.style.display = ''; // show the "Start AR" button again after exit
  try { hitTestSource?.cancel?.(); } catch {}
  hitTestSource = null;
  viewerSpace = null;
  xrRefSpace = null;
  reticle.visible = false;
  lastHitPose = null;
  anchors.length = 0;
  
  showHomeUI();
  hideLoader();

  overlayRoot.style.display = "none";
  void overlayRoot.offsetHeight;
  overlayRoot.style.display = "block";
});

// ============================================================================
// BUTTON CONTROLS
// ============================================================================

const placeButton = document.getElementById('placeButton');
const exitButton = document.getElementById('exitButton');

exitButton.addEventListener('click', () => {
  const session = renderer.xr.getSession();
  if (session) session.end();
});

placeButton.addEventListener('click', () => {
  if (reticle.visible) placeRequested = true;
});

// ============================================================================
// RENDER LOOP
// ============================================================================

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

renderer.setAnimationLoop(async (time, frame) => {
  // Non-AR rendering
  if (!frame || !hitTestSource) { 
    renderer.render(scene, camera); 
    return; 
  }

  const referenceSpace = renderer.xr.getReferenceSpace();

  // Hit testing for surface detection
  const hits = frame.getHitTestResults(hitTestSource);
  if (hits.length) {
    const pose = hits[0].getPose(referenceSpace);
    if (pose) {
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);
      lastHitPose = pose;
    }
  } else {
    reticle.visible = false;
    lastHitPose = null;
  }

  // Update preview model and UI state
  if (previewModel) {
    previewModel.visible = reticle.visible;
  }
  placeButton.disabled = !reticle.visible;

  // Handle model placement
  if (placeRequested && lastHitPose && loadedModel) {
    placeRequested = false;

    let anchor = null;
    try {
      if ('createAnchor' in frame) {
        anchor = await frame.createAnchor(lastHitPose.transform, referenceSpace);
      } else if (typeof hits?.[0]?.createAnchor === 'function') {
        anchor = await hits[0].createAnchor();
      }
    } catch (e) { 
      console.warn('anchor failed:', e); 
    }

    const group = new THREE.Group();
    group.matrixAutoUpdate = false;
    scene.add(group);

    const model = loadedModel.clone(true);
    model.scale.setScalar(currentPreviewScale);
    model.rotation.y = previewRotationY;

    // Ground the model to the detected surface
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    model.position.y -= box.min.y;
    group.add(model);

    group.matrix.fromArray(lastHitPose.transform.matrix);

    if (anchor?.anchorSpace) anchors.push({ anchor, group });
  }

  // Update anchor positions
  for (const a of anchors) {
    const pose = frame.getPose(a.anchor.anchorSpace, referenceSpace);
    if (pose) a.group.matrix.fromArray(pose.transform.matrix);
  }

  renderer.render(scene, camera);
});
