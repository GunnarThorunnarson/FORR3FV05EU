import * as THREE from 'three';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';


// const controls = new OrbitControls( camera, renderer.domElement );  // þarf að færa eftir að cameran erbúin til.
// const loader = new GLTFLoader();

// allt fyrir ofan er import og add-ons.




// ===============================================================================
// Handgesture settings
// ===============================================================================

let gestureRecognizer;  
let runningMode = 'IMAGE';
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = '480px';
const videoHeight = '360px';

let gesture;

const createGestureRecognizer = async () => {
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU'
        },
        runningMode: runningMode
    });
};
createGestureRecognizer();

const video = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureOutput = document.getElementById('gesture_output');
const xOutput = document.getElementById('x_output');
const yOutput = document.getElementById('y_output');

enableWebcamButton = document.getElementById('webcamButton');
enableWebcamButton.addEventListener('click', enableCam);

function enableCam(event) {
    if (!gestureRecognizer) {
        alert('Please wait for gestureRecognizer to load');
        return;
    }
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
                drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                    color: '#00FF00',
                    lineWidth: 3
                });
                drawingUtils.drawLandmarks(landmarks, {
                    color: '#FF0000',
                    lineWidth: 2
                });
            }
        }

        canvasCtx.restore();
        if (results.gestures.length > 0) {
            gestureOutput.style.display = 'block';
            gestureOutput.style.width = videoWidth;
            gestureOutput.innerText = results.gestures[0][0].categoryName;
            

            parseFloat(xOutput.innerText = results.landmarks[0][0].x.toFixed(2));
            parseFloat(yOutput.innerText = results.landmarks[0][0].y.toFixed(2));
            
            console.log(gestureOutput.innerText)

            gesture = gestureOutput.innerText;
        }
        else {
            gestureOutput.style.display = 'none';
        }

        if (webcamRunning === true) {
            window.requestAnimationFrame(predictWebcam);
        }
    }


// ===============================================================================
// kubbur vinnsla fyrir neðan
// ===============================================================================
// cameran og rendera inn.
const scene = new THREE.Scene();    // 75 er fov (degrees), aspect ratio, near og far (nálægasti punktur og lengsti í burt.)
const camera = new THREE.PerspectiveCamera( 75, 480 / 360, 0.1, 1000 );


// renderinn er webgl og setjum hann í stærðina á glugganum og bætum honum sem child við body.
const renderer = new THREE.WebGLRenderer();
renderer.setSize( 480, 360 );
document.getElementById("output_box").appendChild( renderer.domElement );

// cube fyrir neðan"
// default shape cube.                  x  y  z
const geometry = new THREE.BoxGeometry( 1, 1, 1 ); // stærð
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } ); // litur
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;




// loopa sem er alltaf að rendera og updatea.
function animate() {
    requestAnimationFrame( animate );
    if(gesture === "Victory"){
        cube.rotation.x += 0.05;
        cube.rotation.y += 0.05;
    }
    else if(gesture === "Thumb_Down"){
        cube.scale.x -= 0.02;
        cube.scale.y -= 0.02;
        cube.scale.z -= 0.02;
    } else if(gesture === "Thumb_Up"){
        cube.scale.x += 0.02;
        cube.scale.y += 0.02;
        cube.scale.z += 0.02;
    }

    


    renderer.render( scene, camera);
}

animate();
