import { BoxBufferGeometry,CircleGeometry, Mesh, MeshStandardMaterial } from 'https://cdn.skypack.dev/three@0.132.2';

function createCube2() {
  // create a geometry
  const geometry = new CircleGeometry(1, 30);
    
  // create a default (white) Basic materia
  const material = new MeshStandardMaterial({ color: "black" } );

  // create a Mesh containing the geometry and material
  const cube = new Mesh(geometry, material);



  return cube;
}

export { createCube2 };