import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const arOverlay = document.createElement('div');
arOverlay.id = 'ar-overlay';
arOverlay.style.position = 'fixed';
arOverlay.style.top = '0';
arOverlay.style.left = '0';
arOverlay.style.width = '100%';
arOverlay.style.height = '100%';
arOverlay.style.pointerEvents = 'none';
arOverlay.style.zIndex = '1000';
document.body.appendChild(arOverlay);

const loadingScreen = document.createElement('div');
loadingScreen.id = 'loadingScreen';
loadingScreen.style.position = 'fixed';
loadingScreen.style.top = '0';
loadingScreen.style.left = '0';
loadingScreen.style.width = '100%';
loadingScreen.style.height = '100%';
loadingScreen.style.backgroundColor = 'rgba(0,0,0,0.8)';
loadingScreen.style.display = 'none';
loadingScreen.style.justifyContent = 'center';
loadingScreen.style.alignItems = 'center';
loadingScreen.style.color = 'white';
loadingScreen.style.fontSize = '24px';
loadingScreen.style.zIndex = '1000';
loadingScreen.textContent = 'Hleð módel...';
arOverlay.appendChild(loadingScreen);

let reticle;
let lastPlacedModel = null;
let firstPlacedModel = null;
let allPlacedModels = [];
let hitTestSource = null;
let hitTestSourceRequested = false;

const ongoingTouches = new Map();
let initialPinchDistance = null;
let lastCommittedScale = 0.3;
let currentGestureScale = 0.3;

const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
scene.add(ambientLight);

const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
const reticleMaterial = new THREE.MeshBasicMaterial();
reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

let mikkiModel = null;

const toggleBtn = document.createElement('button');
toggleBtn.textContent = 'Setja Mikka niður';
toggleBtn.id = 'place-mikki-btn';
toggleBtn.onclick = () => {
    if (!reticle.visible) return;
    
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = "flex";

    const manager = new THREE.LoadingManager(() => {
        loadingScreen.style.display = "none";
    });

    const loader = new GLTFLoader(manager);
    loader.load('mikki/untitled.glb', (gltf) => {
        const placedModel = gltf.scene.children[0].clone();
        lastPlacedModel = placedModel;
        
        allPlacedModels.push(placedModel);
        
        if (!firstPlacedModel) {
            firstPlacedModel = placedModel;
        }
        
        placedModel.position.setFromMatrixPosition(reticle.matrix);
        placedModel.rotation.setFromRotationMatrix(reticle.matrix);
        placedModel.scale.set(currentGestureScale, currentGestureScale, currentGestureScale);
        
        placedModel.rotateX(THREE.MathUtils.degToRad(90));
        placedModel.rotateY(THREE.MathUtils.degToRad(16));
        placedModel.rotateZ(THREE.MathUtils.degToRad(-73));

        const session = renderer.xr.getSession();
        if (session && session.requestAnchor) {
            session.requestAnchor(reticle.matrix, renderer.xr.getReferenceSpace()).then(anchor => {
                anchor.context = placedModel;
                scene.add(placedModel);
            });
        } else {
            scene.add(placedModel);
        }
    });
};
arOverlay.appendChild(toggleBtn);

const exitARBtn = document.createElement('button');
exitARBtn.textContent = 'Hætta í AR';
exitARBtn.id = 'exit-ar-btn';
exitARBtn.onclick = () => {
    if (renderer.xr.isPresenting) {
        renderer.xr.getSession().end();
    }
};
arOverlay.appendChild(exitARBtn);

function handleDown(e) {
    if (!renderer.xr.isPresenting || !firstPlacedModel) return;
    
    const touch = { pageX: e.pageX, pageY: e.pageY };
    ongoingTouches.set(e.pointerId, touch);

    if (ongoingTouches.size === 2) {
        const touches = Array.from(ongoingTouches.values());
        
        initialPinchDistance = Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
        );
        
        e.preventDefault();
    }
}

function handleMove(e) {
    if (!renderer.xr.isPresenting || !firstPlacedModel || !ongoingTouches.has(e.pointerId)) return;

    const newTouch = { pageX: e.pageX, pageY: e.pageY };
    ongoingTouches.set(e.pointerId, newTouch);

    if (ongoingTouches.size === 2) {
        const touches = Array.from(ongoingTouches.values());
        const deltaX = touches[1].pageX - touches[0].pageX;
        const deltaY = touches[1].pageY - touches[0].pageY;
        
        const currentDistance = Math.hypot(deltaX, deltaY);
        if (initialPinchDistance) {
            const pinchRatio = currentDistance / initialPinchDistance;
            currentGestureScale = Math.max(0.1, pinchRatio * lastCommittedScale);
            
            firstPlacedModel.scale.set(currentGestureScale, currentGestureScale, currentGestureScale);
        }
        
        e.preventDefault();
    }
}

function handleEnd(e) {
    if (!renderer.xr.isPresenting) return;
    
    const wasPinching = ongoingTouches.size === 2;
    ongoingTouches.delete(e.pointerId);

    if (ongoingTouches.size === 0) {
        lastCommittedScale = currentGestureScale;
    } else if (wasPinching && ongoingTouches.size === 1) {
        lastCommittedScale = currentGestureScale;
    }
}

arOverlay.addEventListener('pointerdown', handleDown);
arOverlay.addEventListener('pointermove', handleMove);
arOverlay.addEventListener('pointerup', handleEnd);
arOverlay.addEventListener('pointercancel', handleEnd);
arOverlay.addEventListener('contextmenu', e => e.preventDefault());

const arButton = ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test', 'dom-overlay'],
    domOverlay: { root: arOverlay }
});
arButton.style.border = '2px solid #000000ff';
arButton.style.color = '#000000ff';
document.body.appendChild(arButton);

function animate() {
    if (renderer.xr.isPresenting) {
        toggleBtn.style.display = 'block';
        exitARBtn.style.display = 'block';
        
        arOverlay.style.pointerEvents = 'auto';
        
        const arInfo = document.getElementById('ar-info');
        if (arInfo) arInfo.style.display = 'none';
        
        const session = renderer.xr.getSession();
        
        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                    hitTestSource = source;
                });
            });
            hitTestSourceRequested = true;
        }
        
        if (hitTestSource) {
            const frame = renderer.xr.getFrame();
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(renderer.xr.getReferenceSpace()).transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    } else {
        toggleBtn.style.display = 'none';
        exitARBtn.style.display = 'none';
        
        arOverlay.style.pointerEvents = 'none';
        
        const arInfo = document.getElementById('ar-info');
        if (arInfo) arInfo.style.display = 'block';
        
        allPlacedModels.forEach(model => {
            scene.remove(model);
        });
        allPlacedModels = [];
        lastPlacedModel = null;
        
        if (firstPlacedModel) {
            firstPlacedModel = null;
            lastCommittedScale = 0.3;
            currentGestureScale = 0.3;
        }
        
        hitTestSourceRequested = false;
        hitTestSource = null;
        reticle.visible = false;
    }
    
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);