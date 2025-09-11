function loadModel1() {
    const container = document.getElementById('container_6');

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(115, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 100, 650); // Adjusted position for better view

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true; // Enable shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
    container.appendChild(renderer.domElement);

    // Ground Plane (For Shadows)
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    ground.receiveShadow = true;
    scene.add(ground);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(100, 200, 100);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    scene.add(light);

    // Load background texture for this specific model
    const textureLoader = new THREE.TextureLoader();
    const backgroundTexture = textureLoader.load('scenebackground.jpg'); // Load image
    scene.background = backgroundTexture;

    // GLTFLoader 
    const loader = new THREE.GLTFLoader();
    loader.load('models/predator.glb', function (gltf) { // test mode = raspberrypi4box.glb
        const model = gltf.scene;

        // GENTLEMEN! WE HAZ ACQUIRED ZEH AXIS CONTROL!
        // Rotate 90 degrees around X-axis -- in my case, this has it start facing the camera
        // importing the model into Blender or something similar to rotate it, doesn't seem to matter at all...
        // model.rotation.x = Math.PI / 1.9; 
        model.position.y = 400; // Move it up a bit
        model.scale.set(2, 2, 2); // Scale it up a bit
        model.rotation.y = 0; // Rotate it 90 degrees around the x-axis
        model.rotation.x = -90; // Rotate it 90 degrees around the x-axis
        model.rotation.z = 0; // Rotate it 90 degrees around the x-axis


        // Enable reflections & shadows
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true; // Enable casting shadows
                child.receiveShadow = true; // Enable receiving shadows

                child.material = new THREE.MeshStandardMaterial({
                    color: 0xD3D3D3, // Dark gray
                    metalness: 0.3, // Increased metalness for reflection
                    roughness: 0.3, // Less roughness for glossy effect
                    envMapIntensity: 1.5
                });
            }
        });

        scene.add(model);
        animate();
    }, undefined, function (error) {
        console.error(error);
    });

    // OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.25;
    // controls.minPolarAngle = Math.PI / 2; // set this to make sure that camera won't tilt on the x-axis
    // controls.maxPolarAngle = Math.PI / 2; // set this to make sure that camera won't tilt on the x-axis
    controls.maxAzimuthAngle = Infinity; // Allow infinite horizontal rotation
    controls.minAzimuthAngle = -Infinity; // Allow infinite horizontal rotation
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 1000;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 3.5;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
        light.position.copy(camera.position); // Light follows the camera
        renderer.render(scene, camera);
    }

    // Handle window resize
    window.addEventListener('resize', function () {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// Load Model 1
loadModel1();
