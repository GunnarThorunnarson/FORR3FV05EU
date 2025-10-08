import getVisionStuff from "./getVisionStuff.js";
import getEmitter from "./libs/getEmitter.js";

const { video, handLandmarker } = await getVisionStuff();
const canvasElement = document.getElementById("output_canvas");
const ctx = canvasElement.getContext("2d");
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerWidth * 0.75;

let mousePos = { x: window.innerWidth, y: window.innerHeight };
const emitter = getEmitter();
const HAND_CONNECTIONS = [
[0,1],[1,2],[2,3],[3,4], 
[5,6],[6,7],[7,8],
[9,10],[10,11],[11,12],
[13,14],[14,15],[15,16], 
[17,18],[18,19],[19,20], 
[0,5],[5,9],[9,13],[13,17],[0,17] 
];

function drawPoint(pos, hue) {
  ctx.fillStyle = `hsla(${hue}, 100%, 50%, 1.0)`;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2, true);
  ctx.fill();
}
function drawLine(a, b) {
ctx.beginPath();
ctx.moveTo(a.x, a.y);
ctx.lineTo(b.x, b.y);
ctx.stroke();
}

// Simple draggable cube controlled by a pinch gesture
const cube = {
  x: window.innerWidth * 0.75,
  y: (window.innerWidth * 0.75) * 0.25,
  size: 100,
  grabbed: false,
  grabbedHand: null,
  grabOffset: { x: 0, y: 0 },
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
};

// Three.js setup for a real 3D cube (dynamic import with fallback)
let three = null;
async function setupThree() {
  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js");
    const parent = canvasElement.parentElement;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(canvasElement.width, canvasElement.height, false);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';
    // Mirror to match the UI (video/canvas are mirrored)
    renderer.domElement.style.transform = 'rotateY(180deg)';
    // Insert behind the 2D canvas so hand overlay stays on top
    if (parent) parent.insertBefore(renderer.domElement, canvasElement);
    // Ensure WebGL canvas doesn't eat pointer/touch events
    renderer.domElement.style.pointerEvents = 'none';

    const scene = new THREE.Scene();
    // Orthographic camera in pixel coords (y downward)
    const makeCamera = () => new THREE.OrthographicCamera(0, canvasElement.width, 0, canvasElement.height, 0.1, 3000);
    let camera = makeCamera();
    camera.position.z = 1000;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(-0.5, -1, 1).normalize();
    scene.add(dir);

    // Cube mesh (purple) + white outlines
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0xA855F7, metalness: 0.1, roughness: 0.8 });
    const mesh = new THREE.Mesh(geom, mat);
    const edgeGeom = new THREE.EdgesGeometry(geom);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    const wire = new THREE.LineSegments(edgeGeom, edgeMat);
    // Group them so we can transform together
    const cubeGroup = new THREE.Group();
    cubeGroup.add(mesh);
    cubeGroup.add(wire);
    scene.add(cubeGroup);

    function resize() {
      const w = window.innerWidth;
      const h = window.innerWidth * 0.75;
      canvasElement.width = w;
      canvasElement.height = h;
      renderer.setSize(w, h, false);
      camera = makeCamera();
      camera.position.z = 1000;
    }
    window.addEventListener('resize', resize);

    function updateAndRender() {
      // Sync cube group with cube state
      cubeGroup.position.set(cube.x, cube.y, 0);
      const s = cube.size;
      cubeGroup.scale.set(s, s, s);
      cubeGroup.rotation.set(cube.rotationX || 0, cube.rotationY || 0, cube.rotationZ || 0);
      renderer.render(scene, camera);
    }
    three = { updateAndRender, resize };
    // Ensure sizes are correct on first load
    resize();
  } catch (e) {
    console.warn('Three.js failed to load, using 2D fallback.', e);
    three = null;
  }
}
setupThree();

function drawCube() {
  if (three && three.updateAndRender) {
    three.updateAndRender();
    return;
  }
  // Fallback: simple 2D square
  ctx.save();
  ctx.translate(cube.x, cube.y);
  ctx.rotate(cube.rotationZ || 0);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  const s = cube.size;
  ctx.strokeRect(-s/2, -s/2, s, s);
  ctx.restore();
}

const wasPinchingByHand = {};
const pinchStateByHand = {};
// Two-hand scaling gesture state
let scaleGesture = { active: false, startDist: 0, startSize: 100 };
// Fist-based rotation by movement
let fistState = { active: false, lastPos: null };
// Inertial spin velocity (radians per frame)
let spinVel = { x: 0, y: 0 };

// Debug overlay for handedness + pointing status
function ensureDebugEl() {
  let el = document.getElementById('debug');
  if (!el) {
    el = document.createElement('div');
    el.id = 'debug';
    el.style.position = 'fixed';
    el.style.top = '8px';
    el.style.left = '8px';
    el.style.padding = '6px 8px';
    el.style.background = 'rgba(0,0,0,0.5)';
    el.style.color = '#0ff';
    el.style.font = '12px monospace';
    el.style.whiteSpace = 'pre';
    el.style.zIndex = '9999';
    document.body.appendChild(el);
  }
  return el;
}
const debugEl = ensureDebugEl();

// Static instructions panel (bottom-right)
function ensureHelpEl() {
  let el = document.getElementById('help');
  if (!el) {
    el = document.createElement('div');
    el.id = 'help';
    el.style.position = 'fixed';
    el.style.right = '8px';
    el.style.bottom = '8px';
    el.style.padding = '8px 10px';
    el.style.background = 'rgba(0,0,0,0.55)';
    el.style.color = '#eee';
    el.style.font = '12px monospace';
    el.style.whiteSpace = 'pre';
    el.style.textAlign = 'right';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
  }
  return el;
}
const helpEl = ensureHelpEl();
if (helpEl) {
  helpEl.textContent = [
    'Controls:',
    '- 👌 (eina hendi):dergur kubbinn ',
    '- 👌 með báðum höndum: skale kubbsins',
    '- Fist: tilt; snír kubbinum',
    '- 👌 again: ef han er að snúast stoppar snúning',
  ].join('\n');
}

function animationLoop() {
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height); // x, y, w, h
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    const handResults = handLandmarker.detectForVideo(video, Date.now());
    if (handResults.landmarks) {
      let targetRotX = null;
      let targetRotY = null;
      let h = 0; // index for handedness lookup
      const debugLines = [];
      const pinches = []; // collect pinch states per hand
      for (const landmarks of handResults.landmarks) {
        const pts = landmarks.map((l) => ({
          x: l.x * canvasElement.width,
          y: l.y * canvasElement.height,
          z: (l.z || 0) * canvasElement.width,
        }));
        const handedInfo = (handResults.handednesses && handResults.handednesses[h]) ? handResults.handednesses[h][0] : null;
        const handedLabel = handedInfo ? (handedInfo.categoryName || handedInfo.displayName || "") : ""; // camera-space "Left" or "Right"
        // UI is mirrored via CSS rotateY, so flip handedness for on-screen display
        const uiHand = handedLabel === 'Left' ? 'Right' : (handedLabel === 'Right' ? 'Left' : handedLabel);
        const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        // Detect pinch (thumb tip 4 and index tip 8)
        const thumb = pts[4];
        const indexTip = pts[8];
        if (thumb && indexTip) {
          const pinchDist = Math.hypot(thumb.x - indexTip.x, thumb.y - indexTip.y);
          const palmWidthPx = (pts[5] && pts[17]) ? Math.hypot(pts[5].x - pts[17].x, pts[5].y - pts[17].y) : 0;
          const prevPinch = !!wasPinchingByHand[h];
          let isPinching;
          if (palmWidthPx > 0) {
            const ratio = pinchDist / palmWidthPx;
            const pinchClose = 0.45; // start pinch when below this (more forgiving)
            const pinchOpen = 0.55;  // release pinch when above this (hysteresis)
            isPinching = prevPinch ? (ratio < pinchOpen) : (ratio < pinchClose);
          } else {
            const pinchThreshold = Math.min(canvasElement.width, canvasElement.height) * 0.05; // ~5% of min dimension
            isPinching = pinchDist < pinchThreshold;
          }
          // On pinch start: stop any inertial spin immediately
          if (isPinching && !prevPinch) {
            spinVel.x = 0;
            spinVel.y = 0;
          }
          const rawPinchPos = { x: (thumb.x + indexTip.x) * 0.5, y: (thumb.y + indexTip.y) * 0.5 };
          const st = pinchStateByHand[h] || { smooth: rawPinchPos };
          st.smooth = {
            x: st.smooth.x + (rawPinchPos.x - st.smooth.x) * 0.45,
            y: st.smooth.y + (rawPinchPos.y - st.smooth.y) * 0.45,
          };
          pinchStateByHand[h] = st;
          const pinchPos = st.smooth;
          const dx = pinchPos.x - cube.x;
          const dy = pinchPos.y - cube.y;
          const nearByBox = Math.abs(dx) <= cube.size * 0.9 && Math.abs(dy) <= cube.size * 0.9;
          const nearByDist = Math.hypot(dx, dy) <= cube.size * 2.0;
          const nearCube = nearByBox || nearByDist;
          pinches.push({ hand: h, isPinching, pos: pinchPos, nearCube });

          if (!scaleGesture.active) {
            // Single-hand drag behavior when not in two-hand scaling
            // On pinch start, if near cube, grab it
if (isPinching && !cube.grabbed) {
              if (nearCube && !cube.grabbed) {
                cube.grabbed = true;
                cube.grabbedHand = h;
                cube.grabOffset = { x: cube.x - pinchPos.x, y: cube.y - pinchPos.y };
              }
            }
            // While pinching and grabbed, move cube
            if (isPinching && cube.grabbed && cube.grabbedHand === h) {
              cube.x = pinchPos.x + cube.grabOffset.x;
              cube.y = pinchPos.y + cube.grabOffset.y;
            }
            // On pinch end, release
            if (!isPinching && wasPinchingByHand[h]) {
              if (cube.grabbedHand === h) {
                cube.grabbed = false;
                cube.grabbedHand = null;
              }
            }
            wasPinchingByHand[h] = isPinching;
          }
        }
        ctx.save();
        ctx.strokeStyle = "rgba(0, 200, 255, 0.9)";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        for (const [a, b] of HAND_CONNECTIONS) {
          const pa = pts[a];
          const pb = pts[b];
          if (pa && pb) drawLine(pa, pb);
        }
        ctx.restore();

        // Debug: detect pointing gesture and report handedness + activity
        (function(){
          let dbgPointing = false;
          let dbgDir = 'neutral';
          let dbgAllowed = false;
          if (pts[5] && pts[8] && pts[17]) {
            const pw = Math.hypot(pts[5].x - pts[17].x, pts[5].y - pts[17].y);
            if (pw > 0) {
              const idxUp = Math.hypot(pts[8].x - pts[5].x, pts[8].y - pts[5].y) / pw > 0.70;
              const thumbDown = Math.hypot(pts[4].x - pts[2].x, pts[4].y - pts[2].y) / pw < 0.60;
              const middleDown = Math.hypot(pts[12].x - pts[9].x, pts[12].y - pts[9].y) / pw < 0.65;
              const ringDown = Math.hypot(pts[16].x - pts[13].x, pts[16].y - pts[13].y) / pw < 0.65;
              const pinkyDown = Math.hypot(pts[20].x - pts[17].x, pts[20].y - pts[17].y) / pw < 0.65;
              if (idxUp && thumbDown && middleDown && ringDown && pinkyDown) {
                dbgPointing = true;
                const vx = pts[8].x - pts[5].x;
                const vy = pts[8].y - pts[5].y;
                const len = Math.hypot(vx, vy) || 1;
                const dx = vx / len;
                const dxDisplay = -dx; // mirror flip correction (CSS rotateY)
                if (dxDisplay > 0.5) dbgDir = 'right';
                else if (dxDisplay < -0.5) dbgDir = 'left';
                dbgAllowed = (dxDisplay > 0.5 && handedLabel === 'Left') || (dxDisplay < -0.5 && handedLabel === 'Right');
              }
            }
          }
          // Show only simple left/right label
          if (uiHand === 'Left' || uiHand === 'Right') {
            debugLines.push(uiHand.toLowerCase());
          }
        })();

        // Rotate only when making a fist (all fingers down)
        if (pts[5] && pts[17]) {
          const palmWidth = dist(pts[5], pts[17]);
          if (palmWidth > 0 && !cube.grabbed) {
            const hasAll = pts[4] && pts[2] && pts[8] && pts[5] && pts[12] && pts[9] && pts[16] && pts[13] && pts[20] && pts[17];
            if (hasAll) {
              const thumbDown  = dist(pts[4],  pts[2])  / palmWidth < 0.50;
              const indexDown  = dist(pts[8],  pts[5])  / palmWidth < 0.50;
              const middleDown = dist(pts[12], pts[9])  / palmWidth < 0.50;
              const ringDown   = dist(pts[16], pts[13]) / palmWidth < 0.50;
              const pinkyDown  = dist(pts[20], pts[17]) / palmWidth < 0.50;
               if (thumbDown && indexDown && middleDown && ringDown && pinkyDown) {
                 // Compute palm normal using 3D points (wrist 0, index MCP 5, pinky MCP 17)
                 const sub = (a,b)=>({ x:a.x-b.x, y:a.y-b.y, z:(a.z||0)-(b.z||0) });
                 const w = pts[0];
                 const i5 = pts[5];
                 const p17 = pts[17];
                 const u = sub(i5, w);
                 const v = sub(p17, w);
                 // normal n = u x v
                 const nx = u.y * v.z - u.z * v.y;
                 const ny = u.z * v.x - u.x * v.z;
                 const nz = u.x * v.y - u.y * v.x;
                 const nlen = Math.hypot(nx, ny, nz) || 1;
                 const n = { x: nx / nlen, y: ny / nlen, z: nz / nlen };
                 // Map normal to pitch/yaw (X forward tilt, Y sideways)
                 // Camera looks toward -Z. Positive pitch tilts cube "forward" toward viewer.
                 const pitch = Math.atan2(-n.y, -n.z);
                 const yaw   = Math.atan2(n.x, -n.z);
                 targetRotX = pitch;
                 targetRotY = yaw;

                  // Also allow moving a closed fist to spin the cube
                  if (!fistState.active || !fistState.lastPos) {
                    fistState.active = true;
                    fistState.lastPos = { x: w.x, y: w.y };
                  } else {
                    const dx = w.x - fistState.lastPos.x;
                    const dy = w.y - fistState.lastPos.y;
                    // Convert to on-screen directions (canvas is mirrored via CSS rotateY)
                    const dxScreen = -dx;
                    const dyScreen = dy;
                    const rotSpeed = 0.004; // radians per pixel
                    const inertiaGain = 0.0015; // converts motion into lingering spin
                    cube.rotationY += dxScreen * rotSpeed;
                    cube.rotationX += dyScreen * rotSpeed;
                    // Feed inertial spin so rotation continues slowly after the move
                    spinVel.x = (spinVel.x || 0) * 0.8 + dyScreen * inertiaGain;
                    spinVel.y = (spinVel.y || 0) * 0.8 + dxScreen * inertiaGain;
                    fistState.lastPos = { x: w.x, y: w.y };
                  }
               }
            }
          }
        }
        else {
          // No fist: reset movement tracking
          fistState.active = false;
          fistState.lastPos = null;
        }

        pts.forEach((pos, i) => {
          const hue = (i * 360) / 21;
          drawPoint(pos, hue);
        });
        h += 1;
      }
      // Two-hand scaling: if both hands pinching near the cube, scale it
      const activePinches = pinches.filter(p => p.isPinching);
      const nearPinches = activePinches.filter(p => p.nearCube);
      if (scaleGesture.active) {
        // While active, allow scaling to continue as long as there are 2 pinches anywhere
        if (activePinches.length >= 2) {
          const a = activePinches[0].pos;
          const b = activePinches[1].pos;
          const curDist = Math.hypot(a.x - b.x, a.y - b.y);
          if (scaleGesture.startDist > 0) {
            const rawSize = scaleGesture.startSize * (curDist / scaleGesture.startDist);
            const minSize = 40;
            const maxSize = Math.min(canvasElement.width, canvasElement.height) * 0.5;
            cube.size = Math.max(minSize, Math.min(maxSize, rawSize));
          }
        } else {
          scaleGesture.active = false;
        }
      } else {
        if (nearPinches.length >= 2) {
          const a = nearPinches[0].pos;
          const b = nearPinches[1].pos;
          scaleGesture.active = true;
          scaleGesture.startDist = Math.hypot(a.x - b.x, a.y - b.y);
          scaleGesture.startSize = cube.size;
          // Prevent drag from interfering when entering scale mode
          cube.grabbed = false;
          cube.grabbedHand = null;
          // Stop any inertial spin when scaling starts
          spinVel.x = 0; spinVel.y = 0;
        }
      }
      // Apply target rotations with slight smoothing
      const lerp = (a,b,t)=> a + (b-a)*t;
      if (targetRotX !== null) {
        cube.rotationX = lerp(cube.rotationX || 0, targetRotX, 0.35);
      }
      if (targetRotY !== null) {
        cube.rotationY = lerp(cube.rotationY || 0, targetRotY, 0.35);
      }
      // Apply inertial spin each frame (slowly decays)
      cube.rotationX += spinVel.x;
      cube.rotationY += spinVel.y;
      const damping = 0.99; // closer to 1.0 = spins longer
      spinVel.x *= damping;
      spinVel.y *= damping;

      if (debugEl) {
        const labels = debugLines.filter((t) => t === 'left' || t === 'right');
        const leftPresent = labels.includes('left');
        const rightPresent = labels.includes('right');
        const lines = [];
        if (leftPresent) lines.push('left');
        if (rightPresent) lines.push('right');
        debugEl.textContent = lines.join('\n');
      }
    }
  }
  // Draw cube after hands
  drawCube();
  emitter.update(ctx, mousePos);
  requestAnimationFrame(animationLoop);
}
animationLoop();
