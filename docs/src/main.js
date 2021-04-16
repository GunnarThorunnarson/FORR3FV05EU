import { World } from './World/World.js';

async function main() {
  const container = document.querySelector('#scene-container');
  // Create an instance of the World app
  const world = new World(container);
  // complete async tasks
  await world.init();
  // start the animation loop
  world.start();
}
main().catch((err) => {
  console.error(err);
});