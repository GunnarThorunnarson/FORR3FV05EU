/*
Hello Cube: A bare-bones three.js app:
Sex skref:
    1. Initial Setup
    2. Create the scene
    3. Create a camera
    4. Create the cube and add it to the scene
    5. Create the renderer
    6. Render the scene
*/

// Notum import svo við þurfum ekki að vinna með namespace
// import only the classes that we need in any given module:
import {
    BoxBufferGeometry,
    Color,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
  } from '../vendor/three.module.js';
  
  // 1. Get a reference to the container element that will hold our scene
  const container = document.querySelector('#scene-container');
  
  // 2. create a Scene
  const scene = new Scene();
  // Set the background color
  scene.background = new Color('skyblue');
  
  // 3. Create a camera viewing Frustum
  const fov = 35; // AKA Field of View, the angle in degrees, valid range is 1 - 179 degrees.
  const aspect = container.clientWidth / container.clientHeight; 
  const near = 0.1; // the near clipping plane (1 unit = 1 meter),
  const far = 100; // the far clipping plane
  const camera = new PerspectiveCamera(fov, aspect, near, far);
  // There is also an OrthographicCamera (2D games or user interfaces drawn on top of a 3D game (or 3D website)  
  // move the camera back so we can view the scene, every object is initially created at ( 0, 0, 0 )
  camera.position.set(0, 0, 10);
  
  // 4. Create a geometry, box with length, width, depth.  Always use BufferGeometry rather than Geometry (legacy)
  const geometry = new BoxBufferGeometry(2, 2, 2);
  // create a default (white) Basic material,  This material also ignores any lights in the scene and colors (shades) 
  // We usually need light but MeshBasicMaterial is an exception.
  const material = new MeshBasicMaterial();
  // create a Mesh containing the geometry and material
  const cube = new Mesh(geometry, material);
  // Other kinds of visible objects; lines, shapes, sprites, particles

  // add the mesh to the scene
  scene.add(cube); // the cube (mesh) is now a child of the scene
  // we can use scene.remove(cube) to remove it from scene
  
  // 5. Create the renderer (a machine)
  const renderer = new WebGLRenderer();
  // next, set the renderer to the same size as our container element
  renderer.setSize(container.clientWidth, container.clientHeight); // default canvas size is 150 x 300 pixels,
  // finally, set the pixel ratio so that our scene will look good on HiDPI displays (mobile phones with retina display)
  renderer.setPixelRatio(window.devicePixelRatio);
  // add the automatically created <canvas> element to the page
  container.append(renderer.domElement);

  // 6. Render, or 'create a still image', of the scene and output to canvas
  renderer.render(scene, camera);