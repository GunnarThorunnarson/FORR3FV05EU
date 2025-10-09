import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { animate } from 'https://cdn.jsdelivr.net/npm/animejs/+esm';

// DOM
const container = document.getElementById('viewer');
const fsBtn = document.getElementById('fsBtn');

// Scene
const scene = new THREE.Scene();

// Size from container
function getSize() {
  const r = container.getBoundingClientRect();
  return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
}
let { w: width, h: height } = getSize();

// Camera & Renderer
const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 2000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true /*, alpha: true*/ });
renderer.setSize(width, height);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.9;
controls.zoomSpeed = 0.8;
controls.panSpeed = 0.8;
controls.update();

// Lights
const sunLight = new THREE.DirectionalLight(0xfff5d9, 2.6);
sunLight.position.set(15, 40, 15);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(4096, 4096);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 200;
sunLight.shadow.bias = -0.0003;
sunLight.shadow.normalBias = 0.02;
scene.add(sunLight);

const skyFill = new THREE.DirectionalLight(0x87cefa, 1.0);
skyFill.position.set(-10, 20, -5);
scene.add(skyFill);

const ambient = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambient);

// Sky
const skyTex = new THREE.TextureLoader().load('./public/textures/sky.png');
skyTex.colorSpace = THREE.SRGBColorSpace;
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(1000, 64, 64),
  new THREE.MeshStandardMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false })
);
scene.add(sky);

// Shadow-only ground
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(50, 64),
  new THREE.ShadowMaterial({ opacity: 0.3 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = 0;
scene.add(ground);

// Load GLTF
new GLTFLoader().load(
  './public/models/speedRacer/scene.gltf',
  (gltf) => {
    const model = gltf.scene;

    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m) return;
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
        if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      });
    });

    // center on origin & drop to ground
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    box.setFromObject(model);
    model.position.y -= box.min.y;
    model.position.y += 0.02;

    scene.add(model);

    // frame camera
    frameCameraOnObject(camera, model, controls, 1.3);

    // tune shadow camera to model extents
    const size = box.getSize(new THREE.Vector3());
    const pad = 5;
    sunLight.shadow.camera.left   = -size.x / 2 - pad;
    sunLight.shadow.camera.right  =  size.x / 2 + pad;
    sunLight.shadow.camera.top    =  size.z / 2 + pad;
    sunLight.shadow.camera.bottom = -size.z / 2 - pad;
    sunLight.shadow.camera.far    = Math.max(50, size.y + 60);
    sunLight.shadow.camera.updateProjectionMatrix();
    sunLight.target.position.set(0, 0, 0);
    scene.add(sunLight.target);

    // slow auto spin
    animate(model.rotation, {
      y: { to: Math.PI * 2, duration: 100000 },
      loop: true,
      ease: 'easeInOutSine',
    });

    // scaleIn + fadeIn
    const minY = box.min.y;
    const lift = 0.02;
    const s0   = 0.0001;
    model.scale.setScalar(s0);
    const setYForScale = (s) => { model.position.y = lift - s * minY; };
    setYForScale(s0);

    animate(model.scale, {
      x: 1, y: 1, z: 1,
      duration: 3000,
      easing: 'easeInOutSine',
      update: () => setYForScale(model.scale.x)
    });

    model.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((mat) => {
        if (!mat) return;
        mat.transparent = true;
        mat.opacity = 0;
        animate(mat, { opacity: 1, duration: 8000, easing: 'linear' });
      });
    });
  }
);

// Helpers
function frameCameraOnObject(cam, object, orbitControls, padding = 1.2) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = cam.fov * (Math.PI / 180);
  const dist = (maxDim / (2 * Math.tan(fov / 2))) * padding;

  cam.near = Math.max(0.01, dist / 100);
  cam.far = dist * 100;
  cam.updateProjectionMatrix();

  cam.position.copy(center).add(new THREE.Vector3(dist, dist * 0.5, dist));
  cam.lookAt(center);

  orbitControls?.target.copy(center);
  orbitControls?.update();
}

// Resize to container
function resizeToContainer() {
  const { w, h } = getSize();
  width = w; height = h;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resizeToContainer, { passive: true });
document.addEventListener('fullscreenchange', resizeToContainer, { passive: true });
resizeToContainer();

// Fullscreen toggle (button text stays "Toggle" per request)
fsBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) container.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// Render loop
let last = performance.now();
function loop(now = performance.now()) {
  requestAnimationFrame(loop);

  controls.update();
  sky.position.copy(camera.position); // keep sky “infinite”
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
