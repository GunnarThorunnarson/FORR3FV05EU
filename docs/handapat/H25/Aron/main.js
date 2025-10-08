import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, cube, stars;
let hands, camera_input;
let handsDetected = { left: false, right: false };
let handLandmarks = { left: null, right: null };

let gestureState = {
    left: {
        isLShape: false,
        isRegularL: false,
        isInvertedL: false,
        isRockPose: false,
        isGunGesture: false,
        gunDirection: 0
    },
    right: {
        isLShape: false,
        isRegularL: false,
        isInvertedL: false,
        isRockPose: false,
        isGunGesture: false,
        gunDirection: 0
    },
    isFraming: false,
    frameDistance: 0,
    isMoving: false,
    isRotating: false
};

let objectTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1
};

document.addEventListener('DOMContentLoaded', function() {
    initThreeJS();
    initMediaPipe();
    loadMikkiModel();
});

function initThreeJS() {
    const container = document.getElementById('threejs-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    camera = new THREE.PerspectiveCamera(
        75, 
        container.offsetWidth / container.offsetHeight, 
        0.1, 
        5000
    );
    camera.position.set(0, 1.5, 2);
    camera.lookAt(0, 1.2, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ff88,
        shininess: 100,
        transparent: true,
        opacity: 0.3
    });
    cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.visible = false;
    scene.add(cube);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);
    
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    plane.receiveShadow = true;
    scene.add(plane);
    
    stars = createStarField(6000, 2800);
    scene.add(stars);
    
    window.addEventListener('resize', onWindowResize);
    
    animate();
}

function initMediaPipe() {
    const videoElement = document.getElementById('input_video');
    const canvasElement = document.getElementById('output_canvas');
    const canvasCtx = canvasElement.getContext('2d');
    
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    
    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults(onResults);
    
    camera_input = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });
    
    camera_input.start();
}

function onResults(results) {
    const videoElement = document.getElementById('input_video');
    const canvasElement = document.getElementById('output_canvas');
    const canvasCtx = canvasElement.getContext('2d');
    
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    handsDetected = { left: false, right: false };
    handLandmarks = { left: null, right: null };
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness[i].label;
            
            drawLandmarks(canvasCtx, landmarks, handedness);
            
            if (handedness === 'Left') {
                handsDetected.right = true;
                handLandmarks.right = landmarks;
                try {
                    analyzeGestures(landmarks, 'right');
                } catch(error) {
                    console.error("Error analyzing right hand gestures:", error);
                }
            } else if (handedness === 'Right') {
                handsDetected.left = true;
                handLandmarks.left = landmarks;
                try {
                    analyzeGestures(landmarks, 'left');
                } catch(error) {
                    console.error("Error analyzing left hand gestures:", error);
                }
            }
        }
        
        try {
            checkFramingGesture();
        } catch(error) {
            console.error("Error in checkFramingGesture:", error);
        }
        
        try {
            updateObjectTransform();
        } catch(error) {
            console.error("Error in updateObjectTransform:", error);
        }
        
        try {
            updateHandStatus(handsDetected.left || handsDetected.right);
        } catch(error) {
            console.error("Error in updateHandStatus:", error);
        }
    } else {
        gestureState.isFraming = false;
        updateHandStatus(false);
    }
    
    canvasCtx.restore();
}

function checkFramingGesture() {
    const frameDetector = document.getElementById('frameDetector');
    const lShapeIndicator = document.getElementById('lShapeIndicator');
    const lShapeDetails = document.getElementById('lShapeDetails');
    
    checkRockPoseForMoving();
    
    if (handsDetected.left && handsDetected.right && 
        gestureState.left.isLShape && gestureState.right.isLShape) {
        
        const leftType = gestureState.left.isRegularL ? 'Venjuleg L' : 'Snúin L';
        const rightType = gestureState.right.isRegularL ? 'Venjuleg L' : 'Snúin L';
        lShapeDetails.textContent = `Vinstri: ${leftType}, Hægri: ${rightType}`;
        
        const properFraming = 
            (gestureState.left.isRegularL && gestureState.right.isInvertedL) ||
            (gestureState.left.isInvertedL && gestureState.right.isRegularL);
        
        if (properFraming) {
            gestureState.isFraming = true;
            
            const leftWrist = handLandmarks.left[0];
            const rightWrist = handLandmarks.right[0];
            
            gestureState.frameDistance = calculateDistance(leftWrist, rightWrist);
            
            frameDetector.style.display = 'flex';
            
        } else {
            gestureState.isFraming = false;
            frameDetector.style.display = 'none';
        }
        
    } else {
        gestureState.isFraming = false;
        gestureState.frameDistance = 0;
        
    frameDetector.style.display = 'none';
    }
}

function checkRockPoseForMoving() {
    const leftRockPose = handsDetected.left && 
                        gestureState.left && 
                        gestureState.left.isRockPose === true;
    const rightRockPose = handsDetected.right && 
                         gestureState.right && 
                         gestureState.right.isRockPose === true;
    
    gestureState.isMoving = leftRockPose || rightRockPose;
    
}

function drawLandmarks(ctx, landmarks, handedness = 'Right') {
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17]
    ];
    
    const color = handedness === 'Left' ? '#ff8800' : '#00ff88';
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x * ctx.canvas.width, startPoint.y * ctx.canvas.height);
        ctx.lineTo(endPoint.x * ctx.canvas.width, endPoint.y * ctx.canvas.height);
        ctx.stroke();
    });
    
    landmarks.forEach((landmark, index) => {
        const x = landmark.x * ctx.canvas.width;
        const y = landmark.y * ctx.canvas.height;
        
        ctx.fillStyle = index === 8 || index === 4 ? '#ff0088' : color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function analyzeGestures(landmarks, hand = 'right') {
    if (!landmarks || landmarks.length < 21) return;
    
    const wrist = landmarks[0];
    const thumb_tip = landmarks[4];
    const thumb_mcp = landmarks[2];
    const index_tip = landmarks[8];
    const index_pip = landmarks[6];
    const index_mcp = landmarks[5];
    const middle_tip = landmarks[12];
    const middle_pip = landmarks[10];
    const ring_tip = landmarks[16];
    const ring_pip = landmarks[14];
    const pinky_tip = landmarks[20];
    const pinky_pip = landmarks[18];
    
    const indexExtended = index_tip.y < index_pip.y - 0.02;
    const middleExtended = middle_tip.y < middle_pip.y - 0.02;
    const middleClosed = middle_tip.y > middle_pip.y - 0.01;
    const ringClosed = ring_tip.y > ring_pip.y - 0.01;
    const pinkyClosed = pinky_tip.y > pinky_pip.y - 0.01;

    console.log(ringClosed, pinkyClosed);

    const thumbExtended = thumb_tip.y < thumb_mcp.y - 0.01;

    const thumbExtendedUp = thumb_tip.y < thumb_mcp.y - 0.02; // thumb tip is above MCP
    
    const thumbExtendedOutward = Math.abs(thumb_tip.x - wrist.x) > Math.abs(thumb_mcp.x - wrist.x) + 0.02;
    
    const thumbVector = {
        x: thumb_tip.x - thumb_mcp.x,
        y: thumb_tip.y - thumb_mcp.y
    };
    const indexVector = {
        x: index_tip.x - index_mcp.x,
        y: index_tip.y - index_mcp.y
    };
    
    const dotProduct = thumbVector.x * indexVector.x + thumbVector.y * indexVector.y;
    const thumbLength = Math.sqrt(thumbVector.x * thumbVector.x + thumbVector.y * thumbVector.y);
    const indexLength = Math.sqrt(indexVector.x * indexVector.x + indexVector.y * indexVector.y);
    const cosAngle = Math.abs(dotProduct / (thumbLength * indexLength));
    
    const isPerpendicular = cosAngle < 0.5;

    // L gesture: index extended, middle/ring/pinky closed, thumb outward
    const isStrictL = indexExtended && !middleExtended && ringClosed && pinkyClosed && thumbExtendedOutward && isPerpendicular;

    if (isStrictL) {
        if (hand === 'left') {
            gestureState[hand].isLShape = true;
            gestureState[hand].isRegularL = true;
            gestureState[hand].isInvertedL = false;
        } else {
            gestureState[hand].isLShape = true;
            gestureState[hand].isRegularL = false;
            gestureState[hand].isInvertedL = true;
        }
    } else {
        gestureState[hand].isLShape = false;
        gestureState[hand].isRegularL = false;
        gestureState[hand].isInvertedL = false;
    }
    
    const indexExtendedForRock = index_tip.y < index_pip.y - 0.02;
    const middleClosedForRock = middle_tip.y > middle_pip.y + 0.01;
    const ringClosedForRock = ring_tip.y > ring_pip.y + 0.01;
    const pinkyExtendedForRock = pinky_tip.y < pinky_pip.y - 0.02;
    
    const isRockPose = indexExtendedForRock && middleClosedForRock && 
                       ringClosedForRock && pinkyExtendedForRock;
    
    gestureState[hand].isRockPose = isRockPose;
    
    const indexMiddleAvgY = (index_tip.y + middle_tip.y) / 2;
    const ringPinkyAvgY = (ring_tip.y + pinky_tip.y) / 2;
    
    const fingerHeightDiff = indexMiddleAvgY - ringPinkyAvgY;
    const fingersInGunPosition = fingerHeightDiff < -0.05;
    
    const indexMiddleSpread = Math.abs(index_tip.x - middle_tip.x);
    const isIndexMiddleSeparated = indexMiddleSpread > 0.02;
    
    // Gun gesture: index and middle extended, ring/pinky closed, thumb up, index/middle separated, NOT L gesture
    const isGunGesture = indexExtended
        && middleExtended
        && isIndexMiddleSeparated
        && ringClosed
        && pinkyClosed
        && thumbExtendedUp
        && !isStrictL; // Prevent overlap with L gesture
    
    if (hand === 'right' && handsDetected.right) {
        console.log(`Gun Detection [${hand}]: HeightDiff=${fingerHeightDiff.toFixed(4)}, Spread=${indexMiddleSpread.toFixed(4)}, Shape=${fingersInGunPosition}, Separated=${isIndexMiddleSeparated}, Final=${isGunGesture}`);
    }
    
    gestureState[hand].isGunGesture = isGunGesture;
    
    if (isGunGesture) {
        const directionVector = {
            x: ((index_tip.x + middle_tip.x) / 2) - wrist.x,
            y: ((index_tip.y + middle_tip.y) / 2) - wrist.y
        };
        
        const length = Math.sqrt(directionVector.x * directionVector.x + directionVector.y * directionVector.y);
        
        if (length > 0) {
            directionVector.x /= length;
            directionVector.y /= length;
        }
        
        const angle = Math.atan2(directionVector.y, directionVector.x);
        
        gestureState[hand].gunDirection = angle;
        
        if (hand === 'right' && handsDetected.right) {
            console.log(`Gun Direction [${hand}]: Angle=${(angle * 180 / Math.PI).toFixed(1)}°`);
        }
    }
}

function updateObjectTransform() {
    if (!cube) return;
    
    if (gestureState.isFraming) {
        const minDistance = 0.1;
        const maxDistance = 0.8;
        const minScale = 0.5;
        
        const clampedDistance = Math.max(minDistance, gestureState.frameDistance);
        
        const scaleMultiplier = 4.0;
        objectTransform.scale = minScale + (clampedDistance - minDistance) / (maxDistance - minDistance) * scaleMultiplier;
        cube.scale.setScalar(objectTransform.scale);
    }
    
    try {
        if (gestureState.isMoving) {
            let movingHand = null;
            
            if (handsDetected.left && gestureState.left && gestureState.left.isRockPose) {
                movingHand = handLandmarks.left;
            } else if (handsDetected.right && gestureState.right && gestureState.right.isRockPose) {
                movingHand = handLandmarks.right;
            }
            
            if (movingHand && movingHand.length > 0) {
                const wrist = movingHand[0];
                
                if (wrist && typeof wrist.x !== 'undefined' && typeof wrist.y !== 'undefined') {
                    const moveSpeed = 2.0;
                    objectTransform.position.x = (0.5 - wrist.x) * moveSpeed;
                    objectTransform.position.y = (0.5 - wrist.y) * moveSpeed;
                    
                    cube.position.x = objectTransform.position.x;
                    cube.position.y = objectTransform.position.y;
                }
            }
        }
    } catch(error) {
        console.error("Error in rock pose movement:", error);
    }
    
    try {
        gestureState.isRotating = false;
        
        const leftHandGun = handsDetected.left && gestureState.left && gestureState.left.isGunGesture;
        const rightHandGun = handsDetected.right && gestureState.right && gestureState.right.isGunGesture;
        
        if ((leftHandGun && !rightHandGun) || (!leftHandGun && rightHandGun)) {
            gestureState.isRotating = true;
            
            const rotatingHand = leftHandGun ? 'left' : 'right';
            const rotationAngle = gestureState[rotatingHand].gunDirection;
            
            const isHorizontal = Math.abs(Math.cos(rotationAngle)) > Math.abs(Math.sin(rotationAngle));
            
            const maxRotationSpeed = 0.05;
            let rotationSpeed = 0;
            
            if (isHorizontal) {
                rotationSpeed = -Math.cos(rotationAngle) * maxRotationSpeed;
                
                if (rotatingHand === 'left' && rotationSpeed < 0) {
                    rotationSpeed = 0;
                }
            } else {
                rotationSpeed = Math.sin(rotationAngle) * maxRotationSpeed;
                
                if (rotatingHand === 'left' && rotationSpeed < 0) {
                    rotationSpeed = 0;
                }
            }
            
            const speedMultiplier = 5.0;
            objectTransform.rotation.y += rotationSpeed * speedMultiplier;
            
            objectTransform.rotation.y = objectTransform.rotation.y % (Math.PI * 2);
            cube.rotation.y = cube.rotation.y + (rotationSpeed * speedMultiplier);
            
            console.log(`Continuous Rotation: Hand=${rotatingHand}, Hand Direction=${(rotationAngle * 180 / Math.PI).toFixed(1)}°, Speed=${(rotationSpeed * speedMultiplier).toFixed(4)}, Total=${(cube.rotation.y % (Math.PI * 2)).toFixed(2)}`);
        }
    } catch(error) {
        console.error("Error in gun gesture rotation:", error);
    }
}

function updateHandStatus(detected) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (detected) {
        statusIndicator.classList.add('active');
        
        let statusMessages = [];
        
        if (gestureState.isFraming) {
            statusMessages.push('📐 L-merki - Stærðarstilling: ' + gestureState.frameDistance.toFixed(2));
        } else if (gestureState.isMoving) {
            if (handsDetected.left && gestureState.left.isRockPose) {
                statusMessages.push('🤘 Vinstri rokkmerki - Færsla');
            } else if (handsDetected.right && gestureState.right.isRockPose) {
                statusMessages.push('🤘 Hægri rokkmerki - Færsla');
            }
        } else if (gestureState.isRotating) {
            if (handsDetected.left && gestureState.left.isGunGesture) {
                statusMessages.push('🔫 Vinstri byssa - Snúningur');
            } else if (handsDetected.right && gestureState.right.isGunGesture) {
                statusMessages.push('🔫 Hægri byssa - Snúningur');
            }
        } else {
            if (handsDetected.left) {
                if (gestureState.left.isLShape) {
                    statusMessages.push('Vinstri: L-form (þarf hægri líka)');
                } else if (gestureState.left.isRockPose) {
                    statusMessages.push('🤘 Vinstri rokkmerki - Færsla');
                } else if (gestureState.left.isGunGesture) {
                    statusMessages.push('🔫 Vinstri byssa - Snúningur');
                } else {
                    statusMessages.push('Vinstri hönd fannst');
                }
            }
            
            if (handsDetected.right) {
                if (gestureState.right.isLShape) {
                    statusMessages.push('Hægri: L-form (þarf vinstri líka)');
                } else if (gestureState.right.isRockPose) {
                    statusMessages.push('🤘 Hægri rokkmerki - Færsla');
                } else if (gestureState.right.isGunGesture) {
                    statusMessages.push('🔫 Hægri byssa - Snúningur');
                } else {
                    statusMessages.push('Hægri hönd fannst');
                }
            }
        }
        
        statusText.textContent = statusMessages.join(' | ');
    } else {
        statusIndicator.classList.remove('active');
        statusText.textContent = 'Engar hendur fundust';
    }
}

function calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = (point1.z || 0) - (point2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (stars) {
        stars.rotation.x += 0.00005;
        stars.rotation.y += 0.00008;
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('threejs-container');
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

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

function loadMikkiModel() {
    console.log('Starting to load Mikki model...');
    const loader = new GLTFLoader();
    loader.load('./mikki.glb', 
        function(gltf) {
            console.log('GLTF loaded successfully:', gltf);
            console.log('Model scene:', gltf.scene);
            
            scene.remove(cube);
            console.log('Removed cube from scene');
            
            const model = gltf.scene;
            model.scale.setScalar(3);
            model.position.set(0, 0, 0);
            console.log('Model position and scale set');
            
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(model);
            console.log('Model added to scene');
            
            cube = model;
            console.log('Updated cube reference to model');
            
            console.log('Mikki model loaded successfully!');
        },
        function(progress) {
            console.log('Loading mikki model: ' + (progress.loaded / progress.total * 100) + '%');
        },
        function(error) {
            console.error('Error loading mikki model:', error);
            console.log('Showing placeholder cube as fallback');
            cube.visible = true;
        }
    );
}