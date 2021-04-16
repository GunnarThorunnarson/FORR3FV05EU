// Ath. það þarf einnig að laga import vísun í OrbitControls.js í three.modules.js
import { OrbitControls } from '../../../vendor/OrbitControls.js';


function createControls(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);

  // damping and auto rotation require the controls to be updated each frame

  // this.controls.autoRotate = true;
  controls.enableDamping = true;

  controls.tick = () => controls.update();

  return controls;
}

export { createControls };

  