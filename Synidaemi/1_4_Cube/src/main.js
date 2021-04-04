import { World } from './World/World.js';

/*
Cuve with modules setup
*/

// create the main function
function main() {
  
  // Get a reference to the container element
  const container = document.querySelector('#scene-container');

  // 1. Create an instance of the World app
  const world = new World(container);

  // 2. Render the scene
  world.render();
}

// call main to start the app
main();