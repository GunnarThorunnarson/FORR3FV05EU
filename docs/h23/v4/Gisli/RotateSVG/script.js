// Bíður eftir að DOM-efnið sé fullhlaðið áður en handritið er keyrt
document.addEventListener('DOMContentLoaded', function () {

    // Fær SVG element-ið
    let dragSVG = document.getElementById('draggable-svg');

    // Býr til „Hammer Manager“ instance og bætir við pan, pinch og rotate -þekkjara
    let mc = new Hammer.Manager(dragSVG);
    let pan = new Hammer.Pan();
    let rotate = new Hammer.Rotate();
    let pinch = new Hammer.Pinch();

    mc.add([pan, pinch, rotate]);

    // Stillir ákveðna valkosti fyrir pan, pinch, og rotate gestures
    mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    mc.get('pinch').set({ enable: true });
    mc.get('rotate').set({ enable: true });

    // Breytur til að fylgjast með stillingum og núverandi gildum við gestures
    let [adjustDeltaX, adjustDeltaY, adjustScale, adjustRotation] = [0, 0, 1, 0];
    let [currentDeltaX, currentDeltaY, currentScale, currentRotation] = [null, null, null, null];

    // Event handler fyrir upphaf pan, pinch, og rotate gestures
    mc.on("panstart pinchstart rotatestart", function (e) {
        // Stillir snúningsgildið miðað við upphafssnúningshornið
        adjustRotation -= e.rotation;
    });

    // Event handler fyrir hreyfinguna meðan á hreyfingu pan, pinch, og rotate gestures
    mc.on("panmove pinchmove rotatemove", function (e) {
        // Uppfærir núverandi gildi meðan á gesture stendur
        currentRotation = adjustRotation + e.rotation;
        currentScale = adjustScale * e.scale;
        currentDeltaX = adjustDeltaX + (e.deltaX / currentScale);
        currentDeltaY = adjustDeltaY + (e.deltaY / currentScale);

        // Beitir transformations á SVG byggt á núverandi gildum
        let transforms = ['scale(' + currentScale + ')'];
        transforms.push('translate(' + currentDeltaX + 'px,' + currentDeltaY + 'px)');
        transforms.push('rotate(' + Math.round(currentRotation) + 'deg)');
        dragSVG.style.transform = transforms.join(' ');
    });

    // Event handler fyrir endanum af : pan, pinch, og rotate gestures
    mc.on("panend pinchend rotateend", function (e) {
        // Uppfærir adjust-gildin fyrir næsta gesture
        adjustScale = currentScale;
        adjustRotation = currentRotation;
        adjustDeltaX = currentDeltaX;
        adjustDeltaY = currentDeltaY;
    });
});
