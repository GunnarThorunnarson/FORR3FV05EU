// Get the SVG element
var svg = document.getElementById('interactive-svg');

// Initialize Hammer.js with the SVG element
var hammer = new Hammer(svg);

// Variables to track the current transformation
var posX = 0, posY = 0, scale = 1, angle = 0;
var lastPosX = 0, lastPosY = 0, lastScale = 1, lastAngle = 0;

// Function to apply the transformation to the SVG
function applyTransform() {
    var transform = 'translate(' + posX + 'px,' + posY + 'px) ' +
                    'scale(' + scale + ') ' +
                    'rotate(' + angle + 'deg)';
    svg.style.transform = transform;
}

// Pan gesture
hammer.on('pan', function (event) {
    posX = lastPosX + event.deltaX;
    posY = lastPosY + event.deltaY;
    applyTransform();
});

// Pinch gesture (multi-touch)
hammer.get('pinch').set({ enable: true });
hammer.on('pinch', function (event) {
    scale = Math.max(0.5, Math.min(lastScale * event.scale, 3));
    applyTransform();
});

// Rotate gesture (multi-touch)
hammer.get('rotate').set({ enable: true });
hammer.on('rotate', function (event) {
    angle = lastAngle + event.rotation;
    applyTransform();
});

// Update last position, scale, and angle on panend, pinchend, and rotateend events
hammer.on('panend pinchend rotateend', function () {
    lastPosX = posX;
    lastPosY = posY;
    lastScale = scale;
    lastAngle = angle;
});