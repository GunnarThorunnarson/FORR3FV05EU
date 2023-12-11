import { SphereBufferGeometry, Mesh, MeshStandardMaterial } from 'https://cdn.skypack.dev/three@0.132.2';

    function createCube2() {
    // create a geometry
    const radius = 0.25;
    const widthSegments = 16;
    const heightSegments = 16;

    const geometry = new SphereBufferGeometry(
    radius,
    widthSegments,
    heightSegments
    );
    
    // create a default (white) Basic materia
    const material = new MeshStandardMaterial({ color: "red" } );

    // create a Mesh containing the geometry and material
    const cube = new Mesh(geometry, material);



    return cube;
}

export { createCube2 };