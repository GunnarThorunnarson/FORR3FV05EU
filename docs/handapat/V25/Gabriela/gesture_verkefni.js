import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
let gestureRecognizer;
let runningMode = 'IMAGE';
let enableWebcamButton;
let webcamRunning = false;
let rotateModel = 0;
let scaleModel = 0;
const videoWidth = '480px';
const videoHeight = '360px';

function calculateDistance(p1, p2) {
    const deltaX = p2.x - p1.x;
    const deltaY = p2.y - p1.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 10;
}

// Setja upp gesture recognizer með sjálfgefnar stillingar
const createGestureRecognizer = async () => {
    // configure WASM binary loading
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
    // create gesture recognition
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'CPU'
        },
        runningMode: runningMode  // IMAGE (default) eða Video
    });
};
createGestureRecognizer();

// Fyrir myndband og úttak frá gesture niðustöðum
const video = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureOutput = document.getElementById('gesture_output');
const xOutput = document.getElementById('x_output');
const yOutput = document.getElementById('y_output');
const distanceOutput = document.getElementById('distance');

// event listener fyrir vefmyndavélatakka
enableWebcamButton = document.getElementById('webcamButton');
enableWebcamButton.addEventListener('click', enableCam);
// Fall til að kveikja/slökkva á vefmyndavél og byrja gesture recognition
function enableCam(event) {
    if (!gestureRecognizer) {
        alert('Please wait for gestureRecognizer to load');
        return;
    }
    // Athugar ef að vefmyndavélin er nú þegar í gangi áður en það kveikir/slökkvir
    if (webcamRunning === true) {
        webcamRunning = false;
    }
    else {
        webcamRunning = true;
    }
    
    // getUsermedia parameters.
    const constraints = {
        video: true
    };
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    });
}
let lastVideoTime = -1;
let results = undefined;
// Fall til að greina gestures í myndbandsstraums myndavélar
async function predictWebcam() {
    const webcamElement = document.getElementById('webcam');
    // Now let's start detecting the stream.
    if (runningMode === 'IMAGE') {
        runningMode = 'VIDEO';
        await gestureRecognizer.setOptions({ runningMode: 'VIDEO' });
    }

    let nowInMs = Date.now();

    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        // run gesture recognition on video
        results = gestureRecognizer.recognizeForVideo(video, nowInMs);
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Teikna landmark og tengingar
    const drawingUtils = new DrawingUtils(canvasCtx);
    canvasElement.style.height = videoHeight;
    webcamElement.style.height = videoHeight;
    canvasElement.style.width = videoWidth;
    webcamElement.style.width = videoWidth;
    // teikna í canvas hnitin
    if (results.landmarks) {
        
        for (const landmarks of results.landmarks) {
            drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 5
            });
            drawingUtils.drawLandmarks(landmarks, {
                color: '#FF0000',
                lineWidth: 2
            });

            drawingUtils.drawLandmarks([landmarks[4],landmarks[8]], {
                color: '#6D4CE4',
                lineWidth: 2
            });
        }
    }

    canvasCtx.restore();
    // vinna með greininganiðurstöður
    if (results.gestures.length > 0) {
        gestureOutput.style.display = 'block';
        gestureOutput.style.width = videoWidth;
        // birta niðurstöður
        gestureOutput.innerText = results.gestures[0][0].categoryName;  // model
        parseFloat(xOutput.innerText = results.landmarks[0][0].x.toFixed(2));  // X gildi 
        parseFloat(yOutput.innerText = results.landmarks[0][0].y.toFixed(2));  // y gildi
        parseFloat(distanceOutput.innerText = calculateDistance(results.landmarks[0][4],results.landmarks[0][8]));  // distance

        console.log(gestureOutput.innerText)

        if (results.gestures[0][0].categoryName == "Thumb_Up" && results.handednesses[0][0].categoryName == "Left") {
            rotateModel += 0.1;
        }
        else if (results.gestures[0][0].categoryName == "Thumb_Up" && results.handednesses[0][0].categoryName == "Right"){
            rotateModel -= 0.1;
        }

        scaleModel = calculateDistance(results.landmarks[0][4], results.landmarks[0][8]);

    }
    else {
        gestureOutput.style.display = 'none';
    }
        // Kallar á endurkvæmt, til að halda áfram að greina gestures
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

function model() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});


    // ----------- scene ---------------------------------------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xE8E8E8);


    // --------- camera ---------------------------------------------------------------------------------------------------

    const fov = 10;
    const aspect = 2;
    const near = 0.5;
    const far = 30;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // move camera back to see origin
    camera.position.set(0,0,10);

    // ------------- controls ---------------------------------------------------------------------------------------------------
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set(0,0,-5);

    // ------------- light ---------------------------------------------------------------------------------------------------
    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.castShadow = true;
    light.position.set(0, 10, -5);
    scene.add(light);

    // ------------ gltf object ---------------------------------------------------------------------------------------------------

    const gtlfLoader = new GLTFLoader();
    // ballet girl
    let balletModel;
    const url = './Static/ballet_static.glb';
    gtlfLoader.load(url, function (gltf) {
        balletModel = gltf.scene;
        balletModel.scale.set(10,10,10);
        balletModel.position.set(0,0,-5);

        scene.add(balletModel);
    })

    // render scene
    renderer.render(scene, camera);

    // ------------- resize --------------

    function render(time) {
        time *= 0.001;
        
        

        if (balletModel) {

            balletModel.rotation.y = rotateModel;
            balletModel.scale.set(10 + scaleModel, 10 + scaleModel, 10 + scaleModel);
        }
        

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
        
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;

        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize
    }
}

model();