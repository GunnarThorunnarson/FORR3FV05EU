import { BoxBufferGeometry,TextureLoader,MathUtils, Mesh, MeshStandardMaterial } from 'https://cdn.skypack.dev/three@0.132.2';


function createCube() {
  // create a geometry
  const geometry = new BoxBufferGeometry(1, 1, 1);

  const material = new MeshStandardMaterial({ color: "red" } );

  // create a default (white) Basic material
  /* const material = new MeshStandardMaterial({ color: "purple" }); */

  // create a Mesh containing the geometry and material
  const cube = new Mesh(geometry, material);

  cube.rotation.set(-0.5, -0.1, 0.8);

  cube.position.set(0, 0, 0);

  const radiansPerSecond = MathUtils.degToRad(30);

  window.x_output_global = 0;
  window.y_output_global = 0;

  // this method will be called once per frame
  cube.tick = (delta) => {
    // increase the cube's rotation each frame
    cube.rotation.y += radiansPerSecond * delta;
    
    if (window.gesture_outpu_global != "Closed_Fist"){
      if (window.x_output_global < 0.5) {
        window.x_output_global = window.x_output_global * -2; 
      } else {
        window.x_output_global = window.x_output_global * 1; 
      }
  
      if (window.y_output_global < 0.5) {
        window.y_output_global = window.y_output_global * 1; 
      } else {
        window.y_output_global = window.y_output_global * -2; 
      }
      console.log(window.gesture_outpu_global);
      /* console.log(window.x_output_global); */
      /* console.log(cube.position.x) */
      /* cube.position.x += 0.1 * delta; */
      cube.position.x += window.x_output_global * delta; 
      cube.position.y += window.y_output_global * delta; 
    } 
  };

  
  return cube;
}

export { createCube };