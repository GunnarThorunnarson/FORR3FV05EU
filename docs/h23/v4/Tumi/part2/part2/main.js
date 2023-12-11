import { World } from './World.js';

function main() {
    // Get a reference to the container element
    const container = document.querySelector('#scene-container');
  
    // 1. Create an instance of the World app
    const world = new World(container);
  
    // start the animation loop
    world.start();
}

// call main to start the app
main();