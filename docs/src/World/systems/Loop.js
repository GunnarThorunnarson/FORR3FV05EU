import { Clock } from '../../../vendor/three.module.js';

const clock = new Clock();

class Loop {
  constructor(camera, scene, renderer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.updatables = [];

  }

  start() {
      this.renderer.setAnimationLoop(() => {
        
        // tell every animated object to tick forward one frame
        this.tick();

        // render a frame 60FPS or more, refresh rate of your monitor
        this.renderer.render(this.scene, this.camera);
      });
    }

  stop() {
    this.renderer.setAnimationLoop(null);
  }

  tick() {
    // only call the getDelta function once per frame!
    const delta = clock.getDelta();
    
    for (const object of this.updatables) {
      object.tick(delta);
    }
  }

}

export { Loop }

// to keep animations in sync