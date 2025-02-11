import * as THREE from "three";

function calculatePlaneAngles(p1, p2, p3) {
    // Calculate two vectors in the plane
    const vector1 = {
        x: p2.x - p1.x,
        y: p2.y - p1.y,
        z: p2.z - p1.z
    };

    const vector2 = {
        x: p3.x - p1.x,
        y: p3.y - p1.y,
        z: p3.z - p1.z
    };

    // Calculate the normal vector of the plane (cross product)
    const normalVector = {
        x: vector1.y * vector2.z - vector1.z * vector2.y,
        y: vector1.z * vector2.x - vector1.x * vector2.z,
        z: vector1.x * vector2.y - vector1.y * vector2.x
    };

    // Calculate the angle with respect to the x-axis
    const referenceVectorX = { x: 1, y: 0, z: 0 }; // Positive x-axis
    const dotProductX = normalVector.x * referenceVectorX.x + normalVector.y * referenceVectorX.y + normalVector.z * referenceVectorX.z;
    const magnitudeProductX = Math.sqrt(
        normalVector.x ** 2 + normalVector.y ** 2 + normalVector.z ** 2
    ) * Math.sqrt(referenceVectorX.x ** 2 + referenceVectorX.y ** 2 + referenceVectorX.z ** 2);
    const angleX = Math.acos(dotProductX / magnitudeProductX) * (180 / Math.PI);

    // Calculate the angle with respect to the y-axis
    const referenceVectorY = { x: 0, y: 1, z: 0 }; // Positive y-axis
    const dotProductY = normalVector.x * referenceVectorY.x + normalVector.y * referenceVectorY.y + normalVector.z * referenceVectorY.z;
    const magnitudeProductY = Math.sqrt(
        normalVector.x ** 2 + normalVector.y ** 2 + normalVector.z ** 2
    ) * Math.sqrt(referenceVectorY.x ** 2 + referenceVectorY.y ** 2 + referenceVectorY.z ** 2);
    const angleY = Math.acos(dotProductY / magnitudeProductY) * (180 / Math.PI);

    return { angleX, angleY };
}

/*
The calculateYawAngle calculates the yaw angle between three points in 3D space. 
The yaw angle is the angle between the projection of the normal vector of the plane formed by the three points onto the XZ plane and the Z-axis. 
This function is useful in applications such as gesture recognition or 3D modeling where understanding the orientation of objects in space is important.
*/
function calculateYawAngle(point1, point2, point3) {
    // Calculate the vectors v1 and v2
    let v1 = {
        x: point2.x - point1.x,
        y: point2.y - point1.y,
        z: point2.z - point1.z
    };

    let v2 = {
        x: point3.x - point1.x,
        y: point3.y - point1.y,
        z: point3.z - point1.z
    };

    // Calculate the cross product of v1 and v2 to get the normal vector N
    let N = {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    };

    // Normalize the normal vector
    let magnitude = Math.sqrt(N.x * N.x + N.y * N.y + N.z * N.z);
    let normalizedN = {
        x: N.x / magnitude,
        y: N.y / magnitude,
        z: N.z / magnitude
    };

    // Calculate the yaw angle using atan2
    let yawRadians = Math.atan2(normalizedN.x, normalizedN.z);

    // Convert radians to degrees
    let yawDegrees = yawRadians * (180 / Math.PI);

    // Ensure the angle is in the range [0, 360)
    if (yawDegrees < 0) {
        yawDegrees += 360;
    }

    return yawDegrees;
}

function calculateYawAngleY(point1, point2, point3) {
    // Calculate the vectors v1 and v2
    let v1 = {
        x: point2.x - point1.x,
        y: point2.y - point1.y,
        z: point2.z - point1.z
    };

    let v2 = {
        x: point3.x - point1.x,
        y: point3.y - point1.y,
        z: point3.z - point1.z
    };

    // Calculate the cross product of v1 and v2 to get the normal vector N
    let N = {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    };

    // Normalize the normal vector
    let magnitude = Math.sqrt(N.x * N.x + N.y * N.y + N.z * N.z);
    let normalizedN = {
        x: N.x / magnitude,
        y: N.y / magnitude,
        z: N.z / magnitude
    };

    // Calculate the yaw angle using atan2
    let yawRadians = Math.atan2(normalizedN.x, normalizedN.y);

    // Convert radians to degrees
    let yawDegrees = yawRadians * (180 / Math.PI);

    // Ensure the angle is in the range [0, 360)
    yawDegrees -= 80;

    // Ensure the angle is in the range [0, 360)
    if (yawDegrees < 0) {
        yawDegrees += 360;
    } else if (yawDegrees >= 360) {
        yawDegrees -= 360;
    }

    return yawDegrees;
}
const alpha = 0.2; // Smoothing factor (adjust as needed)
let results = undefined;

// Variables to store the previous smoothed landmarks

let smoothedP1 = {x: 0, y: 0, z:0}; // Thumb
let smoothedP2 = {x: 0, y: 0, z:0}; //Pinky
let smoothedP3 = {x: 0, y: 0, z:0}; //Index

function applyLowPassFilter(current, previous) {
    return {
        x: previous.x + alpha * (current.x - previous.x),
        y: previous.y + alpha * (current.y - previous.y),
        z: previous.z + alpha * (current.z - previous.z),
    };
}


let planeAngle = {
    angleX: 0,
    angleY: 0
};
let yangle = 0;
let xangle = 0;

// Get a reference to the container element that will hold our scene
const container = document.querySelector("#scene-container");
// Create a Scene
const scene = new THREE.Scene();

// Set the background color
scene.background = new THREE.Color("white");

// Create a camera
const fov = 35; // AKA Field of View
const aspect = container.clientWidth / container.clientHeight;
const near = 0.1; // the near clipping plane
const far = 100; // the far clipping plane

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

// Move the camera back so we can view the scene
camera.position.set(0, 10, 30);

const cubematerial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0xff0000),
});
const cubegeometry = new THREE.BoxGeometry(4, 4, 4);
const cube = new THREE.Mesh(cubegeometry, cubematerial);

const donutmaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0xadd8e6),
});
const ballgeometry = new THREE.SphereGeometry(2, 32, 32);
const ball = new THREE.Mesh(ballgeometry, donutmaterial);
ball.position.set(0, 4, 0);

// Create the renderer
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  preserveDrawingBuffer: true,
  precision: "lowp",
  antialias: true
}); // canvas: canvas

// Next, set the renderer to the same size as our container element
renderer.setSize(container.clientWidth, container.clientHeight);

// Finally, set the pixel ratio so that our scene will look good on HiDPI displays
renderer.setPixelRatio(window.devicePixelRatio);

// Add the automatically created <canvas> element to the page
container.append(renderer.domElement);

const group = new THREE.Group();
group.add(cube);
group.add(ball);

scene.add(group);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
directionalLight.target = cube;
scene.add(directionalLight);

camera.lookAt(cube.position);

const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

function onWindowResize() {
  location.reload();
}
window.addEventListener("resize", onWindowResize);

let webcamRunning = false;

function animate() {
//   group.rotation.y += 0.01;


console.log(yangle, xangle);
  if (true) {

    group.rotation.x = (xangle * Math.PI) / 180; // Convert to radians
    group.rotation.y = (yangle * Math.PI) / 180; // Convert to radians
}

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

animate();

import { GestureRecognizer ,HandLandmarker, FilesetResolver, DrawingUtils } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';


        let gestureRecognizer;
        let handLandmarker;
        let runningMode = 'IMAGE';
        let enableWebcamButton;
        // let webcamRunning = false;
        const videoWidth = '380px';
        const videoHeight = '292px';

        // const createGestureRecognizer = async () => {
         
        //     const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
        //     gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        //         baseOptions: {
        //             modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
        //             // modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',

        //             delegate: 'GPU'
        //         },
        //         numHands: 2,
        //         runningMode: runningMode,
        //     });
        // };

        const createHandLandmarker = async () => {
         
            const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
            handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
                    // modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',

                    delegate: 'GPU'
                },
                numHands: 2,
                runningMode: runningMode,
            });
        };
        // createGestureRecognizer();
        createHandLandmarker();


        const video = document.getElementById('webcam');
        const canvasElement = document.getElementById('output_canvas');
        const canvasCtx = canvasElement.getContext('2d');


        enableWebcamButton = document.getElementById('webcamButton');
        enableWebcamButton.addEventListener('click', enableCam);

        function enableCam(event) {
            // if (!gestureRecognizer) {
            //     alert('Please wait for gestureRecognizer to load');
            //     return;
            // }

            if (!handLandmarker) {
                console.log("Wait for handLandmarker to load before clicking!");
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

        async function predictWebcam() {

            const webcamElement = document.getElementById('webcam');
            // Now let's start detecting the stream.
            // if (runningMode === 'IMAGE') {
            //     runningMode = 'VIDEO';
            //     await gestureRecognizer.setOptions({ runningMode: 'VIDEO' });
            // }
            if (runningMode === "IMAGE") {
                runningMode = "VIDEO";
                await handLandmarker.setOptions({ runningMode: "VIDEO" });
              }

            let nowInMs = Date.now();

            // if (video.currentTime !== lastVideoTime) {
            //     lastVideoTime = video.currentTime;
            //     results = gestureRecognizer.recognizeForVideo(video, nowInMs);
            // }
            let startTimeMs = performance.now();

            if (video.currentTime !== lastVideoTime) {
                lastVideoTime = video.currentTime;

                results = handLandmarker.detectForVideo(video, startTimeMs);
            }

            
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            const drawingUtils = new DrawingUtils(canvasCtx);
            canvasElement.style.height = videoHeight;
            webcamElement.style.height = videoHeight;
            canvasElement.style.width = videoWidth;
            webcamElement.style.width = videoWidth;

            if (results.landmarks.length > 0 ) {
                let r =null;
                let l = null;
                

                let telj = 0;
                for (const hendi of results.handednesses) {

                    if (hendi[0].displayName == "Right") {
                        r = telj;
            
                    } else {
                        l = telj;
                    }
                    telj += 1;
                }
                console.log("l", l,"r", r);
                if (l != null) {
                    const p1 = results.landmarks[l][5];
                    const p2 = results.landmarks[l][17];
                    const p3 = results.landmarks[l][0];
                    yangle = calculateYawAngle(p1, p2, p3);

                }
                if (r != null) {
                    const p21 = results.landmarks[r][5];
                    const p22 = results.landmarks[r][17];
                    const p23 = results.landmarks[r][0];
                    xangle = calculateYawAngle(p21, p22, p23);

                }


                

                   
                

                for (const landmarks of results.landmarks) {
                    drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                        color: '#00FF00',
                        lineWidth: 5
                    });
                    
                    drawingUtils.drawLandmarks(landmarks, {
                        color: '#FF0000',
                        lineWidth: 2
                    });
                }
            }

            canvasCtx.restore();

            

            if (webcamRunning === true) {
                window.requestAnimationFrame(predictWebcam);
            }
        }
