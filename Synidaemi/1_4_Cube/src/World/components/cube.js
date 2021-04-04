import { BoxBufferGeometry, Mesh, MeshStandardMaterial } from '../../../vendor/three.module.js';

function createCube() {
  // create a geometry
  const geometry = new BoxBufferGeometry(2, 2, 2);

  // parametrar eru í objecta sniði
  const material = new MeshStandardMaterial({ color: 'purple' });
     // MeshBasicMaterial tekur ekki við ljósi

  // create a Mesh containing the geometry and material
  const cube = new Mesh(geometry, material);

  cube.rotation.set(-0.5, -0.1, 0.8);

  return cube;
}

export { createCube };