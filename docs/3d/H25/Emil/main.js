import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let rubixMesh;
let tableMesh;


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const container = document.getElementById('scene-container');
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
camera.position.set(6, 15, 6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const groundGeometry = new THREE.CircleGeometry(25, 64); 
groundGeometry.rotateX(-Math.PI / 2); 

const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    side: THREE.DoubleSide
});

const texture = new THREE.TextureLoader().load('public/textures/Concrete.jpg');
groundMaterial.map = texture;
groundMaterial.needsUpdate = true;

const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;    

scene.add(groundMesh);



const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);


const ambientLight = new THREE.AmbientLight(0xffffff, 1);
ambientLight.position.set(0, 10, 0);
scene.add(ambientLight);




const loaderTable = new GLTFLoader().setPath('public/models/table/');
loaderTable.load('scene.gltf', (gltf) => {
    console.log('loading table model');
    tableMesh = gltf.scene;

    tableMesh.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    tableMesh.position.set(0, 0, 0);
    scene.add(tableMesh);
});

const loaderRubix = new GLTFLoader().setPath('public/models/rubix/');
loaderRubix.load('scene.gltf', gltf => {
    rubixMesh = gltf.scene;

    rubixMesh.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    rubixMesh.position.set(0, 13.73, 0);
    rubixMesh.scale.set(0.5, 0.5, 0.5);
    const rubixParent = new THREE.Object3D();
    rubixParent.add(rubixMesh);
    scene.add(rubixParent);






    anime({
        targets: rubixMesh.position,
        y: rubixMesh.position.y - 10,
        easing: 'linear',
        duration: 700,

    });
    setTimeout(() => {
        anime({
            targets: rubixMesh.position,
            y: rubixMesh.position.y + 3,
            easing: 'linear',
            duration: 400,

        });
    }, 700);

    setTimeout(() => {
        anime({
            targets: rubixMesh.rotation,
            duration: 2000,
            x: rubixMesh.rotation.x + Math.PI / 2,
            y: rubixMesh.rotation.y + Math.PI / 2,
        });
    }, 500);



    setTimeout(() => {
        anime({
            targets: rubixMesh.position,
            y: rubixMesh.position.y - 3,
            easing: 'linear',
            duration: 400,
        });
    }, 1120);


    setTimeout(() => {
        anime({
            targets: rubixParent.rotation,
            y: rubixParent.rotation.y - Math.PI * 2,
            duration: 15000,
            easing: 'linear',
            loop: true
        });
    }, 2000);


});
let canClickRubix = true;
const cooldownDuration = 1000;

renderer.domElement.addEventListener('click', event => {
    if (!canClickRubix) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (rubixMesh) {
        const hits = raycaster.intersectObject(rubixMesh, true);
        if (hits.length) {
            canClickRubix = false;

            anime({
                targets: rubixMesh.position,
                y: rubixMesh.position.y + 5,
                easing: 'linear',
                duration: 300,
            });

            anime({
                targets: rubixMesh.rotation,
                duration: 1300,
                x: rubixMesh.rotation.x + Math.PI / 2,
                y: rubixMesh.rotation.y + Math.PI / 2,
            });

            setTimeout(() => {
                anime({
                    targets: rubixMesh.position,
                    y: rubixMesh.position.y - 5,
                    easing: 'linear',
                    duration: 300,
                });
            }, 320);


            setTimeout(() => {
                rubixMesh.position.set(0, 3.73, 0);
                canClickRubix = true;
            }, cooldownDuration);
        }
    }
});


let tableVisability = true;

document.getElementById('html-button')
    .addEventListener('click', () => {
        console.log("clicked");

        if (tableVisability === true) {
            tableMesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;

                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.transparent = true;
                            mat.opacity = 0.0;
                            mat.needsUpdate = true;
                        });
                    } else {
                        child.material.transparent = true;
                        child.material.opacity = 0.0;
                        child.material.needsUpdate = true;
                    }
                }
            });
            tableVisability = false; 
        } else {
            tableMesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.transparent = false;
                            mat.opacity = 1.0;
                            mat.needsUpdate = true;
                        });
                    } else {
                        child.material.transparent = false;
                        child.material.opacity = 1.0;
                        child.material.needsUpdate = true;
                    }
                }
            });
            tableVisability = true; 
        }
    });


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();