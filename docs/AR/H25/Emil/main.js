import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let camera, scene, renderer;
let controller;
let reticle;
let object = null;
let objectOriginalScale = null;
let objectHalfHeight = 0;
let hitTestSource = null;
let hitTestSourceRequested = false;
let anchorsSupported = false;
let anchors = [];
let anchorObjects = new Map();
const placementOffsetY = 0.05;
let arButtonEl = null;

const placeButton = document.getElementById('place-button');
const scaleUpBtn = document.getElementById('scale-up');
const scaleDownBtn = document.getElementById('scale-down');

let lastPlaced = null;
const SCALE_STEP = 0.12;
const MIN_SCALE = 0.2;
const MAX_SCALE = 6;
let currentScaleFactor = 1;

init();
animate();

function init() {
  const container = document.getElementById("scene-container");
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.01, 20);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  const optionalFeatures = ["local-floor", "anchors", "dom-overlay"];
  const sessionInit = {
    requiredFeatures: ["hit-test"],
    optionalFeatures,
    domOverlay: { root: document.getElementById('xr-ui-root') }
  };
  arButtonEl = ARButton.createButton(renderer, sessionInit);
  if (arButtonEl) {
    arButtonEl.style.opacity = "0";
    arButtonEl.style.pointerEvents = "none";
    arButtonEl.style.transition = "opacity 400ms ease, transform 200ms ease";
    arButtonEl.style.transform = "scale(0.96)";
    const arContainer = document.getElementById("ar-button-container");
    if (arContainer) {
      arContainer.appendChild(arButtonEl);
      arContainer.style.pointerEvents = "none";
    } else {
      document.body.appendChild(arButtonEl);
    }
  }

  const loadingScreen = document.getElementById("loading-screen");
  const loadingManager = new THREE.LoadingManager();

  loadingManager.onStart = function () {
    if (loadingScreen) {
      loadingScreen.classList.remove("fade-out");
      loadingScreen.hidden = false;
    }
  };

  loadingManager.onLoad = function () {
    if (loadingScreen) {
      loadingScreen.classList.add("fade-out");
      loadingScreen.addEventListener("transitionend", (e) => {
        if (e.target && e.target.parentNode) e.target.parentNode.removeChild(e.target);
        revealARButton();
      }, { once: true });
    } else {
      revealARButton();
    }
  };

  loadingManager.onError = function (url) {
    if (loadingScreen) {
      loadingScreen.classList.add("fade-out");
      loadingScreen.addEventListener("transitionend", (e) => {
        if (e.target && e.target.parentNode) e.target.parentNode.removeChild(e.target);
        revealARButton();
      }, { once: true });
    } else {
      revealARButton();
    }
  };

  const loaderObject = new GLTFLoader(loadingManager).setPath('public/models/object/');
  loaderObject.load('3DModel.gltf', gltf => {
    object = gltf.scene;
    object.traverse((child) => {
      if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    object.scale.set(0.5, 0.5, 0.5);
    objectOriginalScale = object.scale.clone();
    const bbox = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    objectHalfHeight = size.y / 2;
    object.visible = false;
    scene.add(object);
  }, undefined, (err) => {
    console.error("Failed to load model", err);
  });

  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  controller = renderer.xr.getController(0);
  scene.add(controller);

  renderer.xr.addEventListener('sessionstart', onSessionStart);
  renderer.xr.addEventListener('sessionend', onSessionEnd);

  window.addEventListener("resize", onWindowResize);

  if (placeButton) {
    placeButton.hidden = true;
    placeButton.disabled = true;
  }
  if (scaleUpBtn) { scaleUpBtn.hidden = true; }
  if (scaleDownBtn) { scaleDownBtn.hidden = true; }

  if (scaleUpBtn) scaleUpBtn.addEventListener('click', () => changeScale(1));
  if (scaleDownBtn) scaleDownBtn.addEventListener('click', () => changeScale(-1));
  if (placeButton) placeButton.addEventListener('click', placeAtReticle);
}



function revealARButton() {
  if (!arButtonEl) return;
  const arContainer = document.getElementById("ar-button-container");
  if (arContainer) {
    arContainer.style.pointerEvents = "";
    arContainer.style.zIndex = "50";
    arContainer.removeAttribute('aria-hidden');
  }
  arButtonEl.style.pointerEvents = "auto";
  arButtonEl.style.opacity = "1";
  arButtonEl.style.transform = "scale(1)";
  arButtonEl.style.zIndex = "51";
  if (arButtonEl.hasAttribute('disabled')) arButtonEl.removeAttribute('disabled');
  arButtonEl.tabIndex = 0;
  if (placeButton) { placeButton.hidden = false; placeButton.style.opacity = '0.6'; placeButton.style.pointerEvents = 'none'; }
  if (scaleUpBtn) { scaleUpBtn.hidden = false; scaleUpBtn.style.opacity = '0.6'; scaleUpBtn.style.pointerEvents = 'none'; }
  if (scaleDownBtn) { scaleDownBtn.hidden = false; scaleDownBtn.style.opacity = '0.6'; scaleDownBtn.style.pointerEvents = 'none'; }
}

function onWindowResize() {
  const container = document.getElementById("scene-container");
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function onSessionEnd() {
  hitTestSourceRequested = false;
  if (hitTestSource && hitTestSource.cancel) {
    try { hitTestSource.cancel(); } catch (e) { }
  }
  hitTestSource = null;
  reticle.visible = false;
  if (lastPlaced && lastPlaced.placeholder && lastPlaced.placeholder.parent) lastPlaced.placeholder.parent.remove(lastPlaced.placeholder);
  lastPlaced = null;
  for (const [key, val] of anchorObjects) {
    try {
      if (val && val.anchor && typeof val.anchor.delete === 'function') val.anchor.delete();
    } catch (e) { }
    try { if (val && val.placeholder && val.placeholder.parent) val.placeholder.parent.remove(val.placeholder); } catch (e) { }
  }
  anchorObjects.clear();
  anchors = [];
  anchorsSupported = false;
  renderer.setAnimationLoop(null);
  const pageContainer = document.getElementById('container');
  if (pageContainer) {
    if (placeButton && placeButton.parentElement !== pageContainer) pageContainer.appendChild(placeButton);
    if (scaleUpBtn && scaleUpBtn.parentElement !== pageContainer) pageContainer.appendChild(scaleUpBtn);
    if (scaleDownBtn && scaleDownBtn.parentElement !== pageContainer) pageContainer.appendChild(scaleDownBtn);
  }
  if (placeButton) { placeButton.style.pointerEvents = 'none'; placeButton.style.opacity = '0.6'; }
  if (scaleUpBtn) { scaleUpBtn.style.pointerEvents = 'none'; scaleUpBtn.style.opacity = '0.6'; }
  if (scaleDownBtn) { scaleDownBtn.style.pointerEvents = 'none'; scaleDownBtn.style.opacity = '0.6'; }
}


async function onSessionStart() {
  const session = renderer.xr.getSession();
  if (!session) return;
  anchorsSupported = !!session.requestAnchor || !!session.createAnchor || ('anchors' in session);
  const overlayRoot = document.getElementById('xr-ui-root');
  if (overlayRoot) {
    try {
      if (placeButton) overlayRoot.appendChild(placeButton);
      if (scaleUpBtn) overlayRoot.appendChild(scaleUpBtn);
      if (scaleDownBtn) overlayRoot.appendChild(scaleDownBtn);
      overlayRoot.setAttribute('aria-hidden', 'false');
    } catch (err) { }
  }
  if (!hitTestSourceRequested) {
    try {
      const viewerSpace = await session.requestReferenceSpace('viewer');
      hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      hitTestSourceRequested = true;
    } catch (err) {
      hitTestSourceRequested = false;
    }
  }
  if (placeButton) {
    placeButton.disabled = true;
    placeButton.style.pointerEvents = 'none';
    placeButton.style.opacity = '0.6';
  }
  animate();
}

function setReticleVisible(v) {
  reticle.visible = !!v;
  if (placeButton) {
    if (v) {
      placeButton.disabled = false;
      placeButton.style.opacity = '1';
      placeButton.style.pointerEvents = 'auto';
    } else {
      placeButton.disabled = true;
      placeButton.style.opacity = '0.6';
      placeButton.style.pointerEvents = 'none';
    }
  }
  const visible = !!lastPlaced;
  if (scaleUpBtn && scaleDownBtn) {
    if (visible) {
      scaleUpBtn.style.opacity = '1';
      scaleDownBtn.style.opacity = '1';
      scaleUpBtn.style.pointerEvents = 'auto';
      scaleDownBtn.style.pointerEvents = 'auto';
    } else {
      scaleUpBtn.style.opacity = '0.6';
      scaleDownBtn.style.opacity = '0.6';
      scaleUpBtn.style.pointerEvents = 'none';
      scaleDownBtn.style.pointerEvents = 'none';
    }
  }
}

function placeAtReticle() {
  if (!reticle.visible || !object || !objectOriginalScale) return;
  const session = renderer.xr.getSession();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scaleVec = new THREE.Vector3();
  reticle.matrix.decompose(position, quaternion, scaleVec);
  if (lastPlaced) {
    if (lastPlaced.placeholder && lastPlaced.placeholder.parent) lastPlaced.placeholder.parent.remove(lastPlaced.placeholder);
    if (lastPlaced.anchor && typeof lastPlaced.anchor.delete === 'function') {
      try { lastPlaced.anchor.delete(); } catch (e) { }
    }
    lastPlaced = null;
    currentScaleFactor = 1;
  }
  const placeholder = new THREE.Group();
  placeholder.position.copy(position);
  placeholder.quaternion.copy(quaternion);
  placeholder.matrixAutoUpdate = true;
  scene.add(placeholder);
  const instance = object.clone(true);
  currentScaleFactor = 1;
  instance.scale.copy(objectOriginalScale).multiplyScalar(currentScaleFactor);
  instance.position.set(0, objectHalfHeight * currentScaleFactor + placementOffsetY, 0);
  const xrCamera = renderer.xr.getCamera(camera);
  const camQuat = new THREE.Quaternion();
  xrCamera.getWorldQuaternion(camQuat);
  const camEuler = new THREE.Euler().setFromQuaternion(camQuat, 'YXZ');
  const yaw = camEuler.y;
  instance.rotation.set(0, yaw + Math.PI, 0);
  placeholder.add(instance);
  instance.visible = true;
  const entry = { placeholder, instance, anchor: null, pending: anchorsSupported };
  anchorObjects.set(placeholder, entry);
  lastPlaced = entry;
}

async function tryCreateAnchorFromHit(hit, referenceSpace, placeholderKey, session) {
  const entry = anchorObjects.get(placeholderKey);
  if (!entry || !entry.placeholder || entry.anchor) {
    if (entry) entry.pending = false;
    return;
  }
  try {
    let xrAnchor = null;
    if (typeof hit.createAnchor === 'function') {
      xrAnchor = await hit.createAnchor();
    } else if (typeof session.requestAnchor === 'function') {
      const pose = new XRRigidTransform(
        { x: entry.placeholder.position.x, y: entry.placeholder.position.y, z: entry.placeholder.position.z },
        { x: entry.placeholder.quaternion.x, y: entry.placeholder.quaternion.y, z: entry.placeholder.quaternion.z, w: entry.placeholder.quaternion.w }
      );
      xrAnchor = await session.requestAnchor(pose, referenceSpace);
    }
    if (xrAnchor) {
      entry.anchor = xrAnchor;
      const anchorKey = xrAnchor;
      anchorObjects.set(anchorKey, entry);
      anchorObjects.delete(placeholderKey);
      anchors.push(xrAnchor);
      if (entry.placeholder && entry.placeholder.parent) entry.placeholder.parent.remove(entry.placeholder);
      entry.placeholder = null;
      if (lastPlaced && lastPlaced.instance === entry.instance) lastPlaced = entry;
    } else {
      entry.pending = false;
    }
  } catch (err) {
    entry.pending = false;
  }
}

let cachedReferenceSpace = null;

function render(timestamp, frame) {
  const session = renderer.xr.getSession();
  if (session && !hitTestSourceRequested) {
    session.requestReferenceSpace("viewer").then((refSpace) => {
      return session.requestHitTestSource({ space: refSpace }).then((source) => {
        hitTestSource = source;
        cachedReferenceSpace = renderer.xr.getReferenceSpace() || null;
        hitTestSourceRequested = true;
      });
    }).catch(() => { });
    handleSessionStart(session);
  }
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace() || cachedReferenceSpace;
    if (hitTestSource && referenceSpace) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        if (pose) {
          setReticleVisible(true);
          reticle.matrix.fromArray(pose.transform.matrix);
          if (anchorsSupported) {
            const pendingPlaceholders = [];
            for (const [key, val] of anchorObjects) {
              if (val && val.pending && val.placeholder) pendingPlaceholders.push(key);
            }
            for (const placeholderKey of pendingPlaceholders) {
              tryCreateAnchorFromHit(hit, referenceSpace, placeholderKey, session);
            }
          }
        } else {
          setReticleVisible(false);
        }
      } else {
        setReticleVisible(false);
      }
    }
    for (const [key, val] of anchorObjects) {
      if (!val) continue;
      if (val.anchor) {
        const anchor = val.anchor;
        const anchorSpace = anchor.anchorSpace || anchor;
        const anchorPose = frame.getPose(anchorSpace, renderer.xr.getReferenceSpace());
        if (anchorPose) {
          const p = anchorPose.transform.position;
          const o = anchorPose.transform.orientation;
          if (!val.placeholder) {
            val.placeholder = new THREE.Group();
            scene.add(val.placeholder);
          }
          val.placeholder.position.set(p.x, p.y, p.z);
          val.placeholder.quaternion.set(o.x, o.y, o.z, o.w);
          if (val.instance && val.instance.parent !== val.placeholder) {
            val.placeholder.add(val.instance);
          }
        }
      }
    }
  }
  renderer.render(scene, camera);
}

function handleSessionStart(session) {
  anchorsSupported = !!session.requestAnchor || !!session.createAnchor || !!session.anchor || ('anchors' in session);
  session.addEventListener("end", () => {
    onSessionEnd();
  });
  if (placeButton) {
    placeButton.style.pointerEvents = 'none';
    placeButton.style.opacity = '0.6';
  }
  if (scaleUpBtn) { scaleUpBtn.style.pointerEvents = 'none'; scaleUpBtn.style.opacity = '0.6'; }
  if (scaleDownBtn) { scaleDownBtn.style.pointerEvents = 'none'; scaleDownBtn.style.opacity = '0.6'; }
}

function animate() {
  renderer.setAnimationLoop(render);
}

function changeScale(direction) {
  if (!lastPlaced || !lastPlaced.instance) return;
  currentScaleFactor += direction * SCALE_STEP;
  currentScaleFactor = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScaleFactor));
  lastPlaced.instance.scale.set(
    objectOriginalScale.x * currentScaleFactor,
    objectOriginalScale.y * currentScaleFactor,
    objectOriginalScale.z * currentScaleFactor
  );
  if (lastPlaced.instance.position) {
    lastPlaced.instance.position.y = objectHalfHeight * currentScaleFactor + placementOffsetY;
  }
}
