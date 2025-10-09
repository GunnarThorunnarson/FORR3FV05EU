import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const width = window.innerWidth;
const height = window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

let stars = null;

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 5000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true; 
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.useLegacyLights = false;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

controls.maxDistance = 1000;
controls.minDistance = 50;
controls.maxPolarAngle = Math.PI / 2 - 0.1;
controls.minPolarAngle = 0.1;

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(200, 300, 150);
directionalLight.castShadow = true;

directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 1000;
directionalLight.shadow.camera.left = -500;
directionalLight.shadow.camera.right = 500;
directionalLight.shadow.camera.top = 500;
directionalLight.shadow.camera.bottom = -500;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const terrainRadius = 500;
const terrainSegments = 100;
const terrainGeometry = new THREE.CircleGeometry(terrainRadius, terrainSegments);

const vertices = terrainGeometry.attributes.position.array;
for (let i = 0; i < vertices.length; i += 3) {
    if (i % 3 === 1) {
        const x = vertices[i-1];
        const z = vertices[i+1];
        const distanceFromCenter = Math.sqrt(x*x + z*z);
        const edgeFactor = 1 - (distanceFromCenter / terrainRadius);
        
        vertices[i] = Math.random() * 20 * Math.max(0, edgeFactor);
    }
}
terrainGeometry.attributes.position.needsUpdate = true;
terrainGeometry.computeVertexNormals();

const textureLoader = new THREE.TextureLoader();
const tilesTexture = textureLoader.load(
  './textures/tiles.jpeg', 
  function(texture) {
    console.log("Tiles texture loaded successfully");
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    terrainMaterial.map = texture;
    terrainMaterial.needsUpdate = true;
  },
  undefined,
  function(err) {
    console.error("Error loading tiles texture:", err);
    terrainMaterial.color.set(0x999999);
  }
);

const modelTexture = textureLoader.load('./textures/tiles.jpeg', function(texture) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
});

const terrainMaterial = new THREE.MeshStandardMaterial({
  map: tilesTexture,
  roughness: 0.7,
  metalness: 0.2,
  color: 0xFFFFFF,
  side: THREE.DoubleSide
});

const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.position.y = -40;
terrain.receiveShadow = true;
scene.add(terrain);

const loader = new GLTFLoader();
let model;
let opacity = 0;
let modelReady = false;
let isRotating = true;

let cameraRotation = new THREE.Euler(0, 0, 0, 'YXZ');

const modelGroup = new THREE.Group();
scene.add(modelGroup);

let originalMaterials = new Map();
let usingCustomTexture = true;

loader.load(
    './pure-nail/scene.gltf',
    function(gltf) {
        model = gltf.scene;
        
        model.scale.set(1, 1, 1);
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.y = -center.y + 100;
        model.position.z = -center.z;
        
        model.traverse(function(node) {
            if (node.isMesh) {
                originalMaterials.set(node, node.material.clone());
                
                node.material.transparent = true;
                node.material.opacity = 0;
                node.castShadow = true;
                
                const newMaterial = new THREE.MeshStandardMaterial({
                    map: modelTexture,
                    normalMap: node.material.normalMap,
                    roughness: 0.7,
                    metalness: 0.2,
                    transparent: true,
                    opacity: 0
                });
                
                node.material = newMaterial;
            }
        });
        
        modelGroup.add(model);
        modelReady = true;
        
        controls.target.set(0, model.position.y, 0);
        controls.update();
        
        camera.lookAt(0, model.position.y, 0);
    },
    function(xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function(error) {
        console.error('An error happened', error);
    }
);

camera.position.set(0, 200, 400);

camera.lookAt(0, 0, 0);

controls.target.set(0, 0, 0);
controls.update();

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('deviceorientation', onDeviceOrientation);

function onDeviceOrientation(event) {
    if (event.beta && event.gamma && model) {
        const tiltX = Math.min(Math.max(event.gamma, -10), 10) * 0.01;
        const tiltY = Math.min(Math.max(event.beta, -10), 10) * 0.01;
        
        model.rotation.x = tiltY;
    }
}

function adjustSceneForScreenSize() {
    const width = window.innerWidth;
    
    if (width < 768) {
        camera.position.set(0, 150, 450);
    } else if (width < 1024) {
        camera.position.set(0, 180, 425);
    } else {
        camera.position.set(0, 200, 400);
    }
    
    if (model) {
        camera.lookAt(model.position);
        controls.target.set(model.position.x, model.position.y, model.position.z);
    } else {
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
    }
    controls.update();
}

adjustSceneForScreenSize();

window.addEventListener('resize', adjustSceneForScreenSize);

document.getElementById('pauseBtn').addEventListener('click', function() {
    isRotating = !isRotating;
    
    const btn = document.getElementById('pauseBtn');
    if (isRotating) {
        btn.textContent = 'Rotation: ON';
        btn.classList.remove('paused');
    } else {
        btn.textContent = 'Rotation: OFF';
        btn.classList.add('paused');
    }
});

document.getElementById('resetBtn').addEventListener('click', function() {
    camera.position.set(0, 200, 400);
    
    if (model) {
        camera.lookAt(model.position);
        controls.target.set(model.position.x, model.position.y, model.position.z);
    } else {
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
    }
    controls.update();
    
    if (model) {
        model.rotation.x = 0;
        model.rotation.y = 0;
        model.rotation.z = 0;
    }
});

document.getElementById('textureBtn').addEventListener('click', function() {
    if (!model) return;
    
    usingCustomTexture = !usingCustomTexture;
    
    const btn = document.getElementById('textureBtn');
    btn.textContent = usingCustomTexture ? 'Use Original Texture' : 'Use Custom Texture';
    
    model.traverse(function(node) {
        if (node.isMesh) {
            if (usingCustomTexture) {
                const newMaterial = new THREE.MeshStandardMaterial({
                    map: modelTexture,
                    normalMap: originalMaterials.get(node).normalMap,
                    roughness: 0.7,
                    metalness: 0.2,
                    transparent: true,
                    opacity: opacity
                });
                node.material = newMaterial;
            } else {
                const origMaterial = originalMaterials.get(node).clone();
                origMaterial.transparent = true;
                origMaterial.opacity = opacity;
                node.material = origMaterial;
            }
        }
    });
});

function animate() {
    requestAnimationFrame(animate);
    
    cameraRotation.copy(camera.rotation);
    
    controls.update();
    
    if (modelReady && opacity < 1) {
        opacity += 0.01;
        model.traverse(function(node) {
            if (node.isMesh) {
                node.material.opacity = opacity;
            }
        });
    }
    
    if (model && isRotating) {
        model.rotation.y += 0.01;
    }

    terrain.rotation.x = -Math.PI / 2;

    if (stars) {
        stars.rotation.y += 0.0002;
    }
    renderer.render(scene, camera);
}
animate();

function createStarField(count = 5000, radius = 2500) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.6 + Math.random() * 0.4);
    const theta = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const phi = Math.acos(u);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    const i3 = i * 3;
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 3.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

stars = createStarField(6000, 2800);
scene.add(stars);