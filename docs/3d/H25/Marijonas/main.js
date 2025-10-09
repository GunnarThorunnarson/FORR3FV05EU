
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
import {animate} from "./anime.esm.min.js"

//renderer duh
const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;


//Ég vill ekki að renderer tekur up allan skjáinn
const windowHeight = window.innerHeight/1.25;
const windowWidth = window.innerWidth;
renderer.setSize(windowWidth, windowHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);

// þannig ad skuggar eru til
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//setjir renderer í miðju divið
document.querySelector('.midja').appendChild(renderer.domElement);

//gerir senu
const scene = new THREE.Scene();

//geriri myndavel, setjir á stað og segjir að horfa á 0,0,0
const camera = new THREE.PerspectiveCamera(45, windowWidth/windowHeight, 1 , 1000)
camera.position.set(4, 5, 11);
camera.lookAt(0, 0, 0);

//orbit controlls, allt fyrir neða er bara smá stillingar eins og hversu langt í burt maður má fara og hversu nálagt og fleiri
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = true; 
controls.target = new THREE.Vector3(0,0,0);
controls.update();

//gerir jorðina sem vinyl spilari á að standa
const jord = new THREE.PlaneGeometry(20,20,32,32);
jord.rotateX(-Math.PI / 2);
const jordMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    side: THREE.DoubleSide

}); 
const jordMesh = new THREE.Mesh(jord, jordMat);

//það á að sýna skugga og það er bætt í senu
jordMesh.castShadow = false;
jordMesh.receiveShadow = true;
scene.add(jordMesh)

//ljós, hversu stergt það er , skugga stillingar, hvar þar horfið 
const ljos = new THREE.SpotLight(0xffffff, 2000, 100, 0.5, 0.5);
ljos.position.set(0, 25, 0);
ljos.target.position.set(0, 0, 0);
ljos.castShadow = true;
ljos.shadow.bias = -0.00001;
scene.add(ljos.target);
scene.add(ljos);
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

//loader til að ná í gltf vinyl
const loader = new GLTFLoader().setPath('./folder/');
loader.load('scene.gltf', (gltf) => {
    const mesh = gltf.scene;
    //hvert hlutur sem er ekki transparent í vinyl fær skugga
    mesh.traverse((child) => {
        if (child.isMesh) {
            child.receiveShadow = true;
            if (!child.material.transparent) {
            child.castShadow = true;
        } else {
            child.castShadow = false;
        }}
    })

    //setir hvar það á að vera, og gerir það super lítið
    mesh.position.set(0, 0, 0);
    mesh.scale.set(0.1,0.1,0.1)

    //animater vinyl að stækka
    const meshAnime = animate(mesh.scale, {
        x: 10,
        y: 10,
        z: 10,
        duration: 5000,
        easing: 'easeOutElastic'
    })
    //bætir við mesh
    scene.add(mesh);
})

//takki sem kveikjir eða slökkvar á autoRotate
const button = document.querySelector('.snuning');
button.addEventListener('click', () => {
    controls.autoRotate = !controls.autoRotate;
});

//til að myndvél virki
function cameraRender() {
    requestAnimationFrame(cameraRender);
    controls.update();
    renderer.render(scene, camera);
}

//renderar myndavélinga
cameraRender();


