import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

function createControls(camera, canvas) {
    const controls = new OrbitControls(camera, canvas);
    
    controls.enableDamping = true;

    controls.tick = () => controls.update();
    
    return controls;
}

export { createControls }