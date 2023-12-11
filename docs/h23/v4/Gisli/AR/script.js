async function activateXR() {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const gl = canvas.getContext("webgl", { xrCompatible: true });
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        preserveDrawingBuffer: true,
        canvas: canvas,
        context: gl
    });
    renderer.autoClear = false;

    const camera = new THREE.PerspectiveCamera();
    camera.matrixAutoUpdate = false;

    const session = await navigator.xr.requestSession("immersive-ar");
    session.updateRenderState({
        baseLayer: new XRWebGLLayer(session, gl)
    });

    const referenceSpace = await session.requestReferenceSpace('local');

    // Snýr cube á touch
    const touchStart = new THREE.Vector2();
    const touchEnd = new THREE.Vector2();
    canvas.addEventListener('touchstart', (touchstarting) => {
        touchStart.x = touchstarting.touches[0].clientX;
        touchStart.y = touchstarting.touches[0].clientY;
    }, false);
    canvas.addEventListener('touchmove', (touchmoving) => {
        touchEnd.x = touchmoving.touches[0].clientX;
        touchEnd.y = touchmoving.touches[0].clientY;
    }, false);
    canvas.addEventListener('touchend', (event) => {
        touchStart.x = 0;
        touchStart.y = 0;
        touchEnd.x = 0;
        touchEnd.y = 0;
    }, false);

    const materials = [
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        new THREE.MeshBasicMaterial({ color: 0x0000ff }),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
        new THREE.MeshBasicMaterial({ color: 0xff00ff }),
        new THREE.MeshBasicMaterial({ color: 0x00ffff }),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    ];

    const cube = new THREE.Mesh(new THREE.BoxBufferGeometry(0.2, 0.2, 0.2), materials);
    cube.position.set(1, 1, 1);
    scene.add(cube);

    const onXRFrame = (time, frame) => {
        session.requestAnimationFrame(onXRFrame);
        gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer)

        const pose = frame.getViewerPose(referenceSpace);
        if (pose) {
            const view = pose.views[0];
            const viewport = session.renderState.baseLayer.getViewport(view);
            renderer.setSize(viewport.width, viewport.height)

            camera.matrix.fromArray(view.transform.matrix)
            camera.projectionMatrix.fromArray(view.projectionMatrix);
            camera.updateMatrixWorld(true);

            renderer.render(scene, camera)
        }
    }
    session.requestAnimationFrame(onXRFrame);

}