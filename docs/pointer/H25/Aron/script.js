import { animate } from 'https://cdn.jsdelivr.net/npm/animejs@4.1.3/+esm';

console.log('rotate.js loaded');

const ongoingTouches = new Map();
const touchRegion = document.getElementById('touch-region');
const angleRegion = document.getElementById('angle-region');

const RECT_PAN_SCALE = 1.2;
const LONG_PRESS_DURATION = 350;

let longPressTimer = null;
let isPanEnabled = false;
let panStartPoint = { x: 0, y: 0 };
let lastCommittedTranslation = { x: 0, y: 0 };
let currentGestureTranslation = { x: 0, y: 0 };
let initialPinchDistance = null;
let lastCommittedScale = 1;
let currentGestureScale = 1;
let initialTouchAngle = null;
let lastCommittedAngle = 0;
let currentGestureAngle = 0;

function animateRectangle(isPanEnabled) {
    const targetScale = isPanEnabled ? Math.max(2, currentGestureScale * RECT_PAN_SCALE) : currentGestureScale;

    animate('#rectangle', {
        translateX: currentGestureTranslation.x,
        translateY: currentGestureTranslation.y,
        rotate: currentGestureAngle,
        scale: targetScale,
        duration: 0,
        easing: 'linear'
    });
    
    writeAngleAndScale();
}

function addCircle(x, y) {
    const containerRect = touchRegion.getBoundingClientRect();
    const relativeX = x - containerRect.left;
    const relativeY = y - containerRect.top;
    const svgNS = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(svgNS, "g");

    g.setAttribute("transform", `translate(${relativeX}, ${relativeY})`);
    g.setAttribute("class", "touch-marker");

    const circleData = [
        { id: "b", r: "17" },
        { id: "c", r: "23.6" },
        { id: "d", r: "36.5" },
        { id: "e", r: "43" }
    ];

    circleData.forEach(data => {
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("id", data.id);
        circle.setAttribute("cx", "0");
        circle.setAttribute("cy", "0");
        circle.setAttribute("r", data.r);
        circle.setAttribute("class", "f");
        g.appendChild(circle);
    });
    
    touchRegion.appendChild(g);
}

function removeAllCircles() {
    const markers = touchRegion.querySelectorAll('.touch-marker');
    markers.forEach(marker => marker.remove());
}

function writeAngleAndScale() {
    angleRegion.textContent = `Angle: ${currentGestureAngle.toFixed(2)}° | Scale: ${currentGestureScale.toFixed(2)}`;
}

touchRegion.addEventListener('contextmenu', e => e.preventDefault());

function handleDown(e) {
    const touch = { pageX: e.pageX, pageY: e.pageY };
    ongoingTouches.set(e.pointerId, touch);

    if (ongoingTouches.size === 1) {
        longPressTimer = setTimeout(() => {
            isPanEnabled = true;
            animateRectangle(isPanEnabled);
        }, LONG_PRESS_DURATION);
        
        panStartPoint = { x: e.pageX, y: e.pageY };
        currentGestureTranslation = lastCommittedTranslation;
    
    } else if (ongoingTouches.size === 2) {
        clearTimeout(longPressTimer);
        isPanEnabled = false;
        lastCommittedTranslation = currentGestureTranslation;
        
        const touches = Array.from(ongoingTouches.values());
        
        initialPinchDistance = Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
        );
        
        const deltaX = touches[1].pageX - touches[0].pageX;
        const deltaY = touches[1].pageY - touches[0].pageY;
        initialTouchAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

        Array.from(ongoingTouches.values()).forEach(element => {
            addCircle(element.pageX, element.pageY);
        });
    }
}

function handleMove(e) {
    if (!ongoingTouches.has(e.pointerId)) return;

    const newTouch = { pageX: e.pageX, pageY: e.pageY };
    ongoingTouches.set(e.pointerId, newTouch);

    if (ongoingTouches.size === 1) {
        const moveDistance = Math.hypot(e.pageX - panStartPoint.x, e.pageY - panStartPoint.y);
        if (moveDistance > 10 && longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        
        if (isPanEnabled) {
            const deltaX = e.pageX - panStartPoint.x;
            const deltaY = e.pageY - panStartPoint.y;
            currentGestureTranslation = {
                x: lastCommittedTranslation.x + deltaX,
                y: lastCommittedTranslation.y + deltaY
            };
        }
        
    } else if (ongoingTouches.size === 2) {
        const touches = Array.from(ongoingTouches.values());
        const deltaX = touches[1].pageX - touches[0].pageX;
        const deltaY = touches[1].pageY - touches[0].pageY;
        
        const currentTouchAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        const deltaAngle = currentTouchAngle - initialTouchAngle;
        currentGestureAngle = lastCommittedAngle + deltaAngle;
        
        const currentDistance = Math.hypot(deltaX, deltaY);
        if (initialPinchDistance) {
            const pinchRatio = currentDistance / initialPinchDistance;
            currentGestureScale = pinchRatio * lastCommittedScale;
        }

        const containerRect = touchRegion.getBoundingClientRect();
        const markers = Array.from(touchRegion.querySelectorAll('.touch-marker'));
        
        touches.forEach((touch, index) => {
            if (markers[index]) {
                const relativeX = touch.pageX - containerRect.left;
                const relativeY = touch.pageY - containerRect.top;
                markers[index].setAttribute("transform", `translate(${relativeX}, ${relativeY})`);
            }
        });
    }

    if (ongoingTouches.size > 0) {
        animateRectangle(isPanEnabled);
    }
}

function handleEnd(e) {
    clearTimeout(longPressTimer);
    
    const wasPinching = ongoingTouches.size === 2;
    ongoingTouches.delete(e.pointerId);

    if (ongoingTouches.size === 0) {
        lastCommittedTranslation = currentGestureTranslation;
        lastCommittedScale = currentGestureScale;
        lastCommittedAngle = currentGestureAngle;
        isPanEnabled = false;
        
    } else if (wasPinching && ongoingTouches.size === 1) {
        lastCommittedAngle = currentGestureAngle;
        lastCommittedScale = currentGestureScale;
        removeAllCircles();
    }

    animateRectangle(isPanEnabled);
}

touchRegion.addEventListener('pointerdown', handleDown);
touchRegion.addEventListener('pointermove', handleMove);
touchRegion.addEventListener('pointerup', handleEnd);
touchRegion.addEventListener('pointercancel', handleEnd);

function centerRectangle() {
    const containerRect = touchRegion.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    currentGestureTranslation = { x: centerX, y: centerY };
    lastCommittedTranslation = { x: centerX, y: centerY };
    
    animateRectangle(false);
}

centerRectangle();