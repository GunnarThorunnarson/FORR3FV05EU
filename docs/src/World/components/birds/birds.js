import { GLTFLoader } from '../../../../vendor/GLTFLoader.js';
import { setupModel } from './setupModel.js';

async function loadBirds() {
  const loader = new GLTFLoader();
  
   const parrotData = await loader.loadAsync('https://raw.githubusercontent.com/GunnarThorunnarson/FORR3FV05EU/master/assets/models/Parrot.glb');
  // const parrotData = await loader.loadAsync('/assets/models/Parrot.glb');
  console.log('Squaaawk!', parrotData);
  // pass in the loaded data and get back the bird model
  const parrot = setupModel(parrotData);
  parrot.position.set(0, 0, 2.5);

  return { parrot }
}

export { loadBirds };
