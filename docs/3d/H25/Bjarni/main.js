import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Grunnur / Renderer, Scene og Camera.
const viewer = document.getElementById('viewer') 
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
viewer.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
camera.position.set(0, 1, 4)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.autoRotate = false

// Ljós
scene.add(new THREE.AmbientLight(0xffffff, 3))
const spot = new THREE.SpotLight(0xffffff, 2)
spot.position.set(5, 10, 10)
spot.castShadow = true
scene.add(spot)

function fitToViewer() {
  const w = viewer.clientWidth
  const h = viewer.clientHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
fitToViewer()
window.addEventListener('resize', fitToViewer)


const loader = new GLTFLoader()
loader.load('./public/lion_crushing_a_serpent/scene.gltf',
  (gltf) => {
    const model = gltf.scene
    model.scale.setScalar(0.05)
    model.position.set(0, 0, 0)
    scene.add(model)
    console.log('GLTF loaded ✅')
  },
  undefined,
  (err) => {
    console.error('Villa við GLTF load:', err)
  }
)

// Takkar
const btnRotate = document.getElementById('btn-rotate')
const btnReset  = document.getElementById('btn-reset')
const btnFull   = document.getElementById('btn-full')

btnRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate
})

btnReset.addEventListener('click', () => {
  controls.reset()
})

btnFull.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    viewer.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
})


function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

animate()
