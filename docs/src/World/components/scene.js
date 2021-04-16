import { Color, Scene } from '../../../vendor/three.module.js';

function createScene() {
  const scene = new Scene();

  scene.background = new Color('skyblue');
  return scene;
}

export { createScene };