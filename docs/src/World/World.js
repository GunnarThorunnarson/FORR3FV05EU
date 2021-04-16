
import { loadBirds } from './components/birds/birds.js';
import { createCamera } from './components/camera.js';
import { createLights } from './components/lights.js';
import { createScene } from './components/scene.js';

import { createControls } from './systems/controls.js';
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';

// These variables are module-scoped: we cannot access them from outside the module
let camera;
let controls;
let renderer;
let scene;
let loop;

class World {

  // synchronous setup 
  constructor(container) {
    camera = createCamera();
    renderer = createRenderer();
    scene = createScene();
    loop = new Loop(camera, scene, renderer);
    container.append(renderer.domElement);
    controls = createControls(camera, renderer.domElement);
    
    const { ambientLight, mainLight } = createLights();
    loop.updatables.push(controls);
    scene.add(ambientLight, mainLight);

    const resizer = new Resizer(container, camera, renderer);

  }  
  // asynchronous setup 
  async init() {
  // load bird models, create everything that relies on model.
  const { parrot } = await loadBirds();
  
  // move the target to the center of the front bird
  controls.target.copy(parrot.position);
  scene.add(parrot);

  }
   // Render the scene
   render() {
    renderer.render(scene, camera)
  }

  // call their counterparts in Loop (systems/Loop.js)
  // This is how we’ll provide access to the loop from within main.js:
  start() {
    loop.start();
  }
  
  stop() {
    loop.stop();
  }

}
  
export { World };

