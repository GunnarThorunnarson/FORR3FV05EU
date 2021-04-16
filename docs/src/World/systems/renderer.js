import { WebGLRenderer } from '../../../vendor/three.module.js';

function createRenderer() {
  const renderer = new WebGLRenderer();

  // turn on the physically correct lighting model
  renderer.physicallyCorrectLights = true;
  
  return renderer;
}

export { createRenderer };