let star = document.getElementById('2d');

let startX, startY, startTime;
let originalLeft = star.offsetLeft;
let originalTop = star.offsetTop;
let isAtStartPosition = true;

document.addEventListener("touchstart", e => {
    const touch = e.touches[0];
    startX = touch.pageX;
    startY = touch.pageY;
    startTime = Date.now();
});

document.addEventListener("touchmove", e => {
    e.preventDefault();
    let rotation = Math.atan2(e.touches[0].pageY - e.touches[1].pageY,
              e.touches[0].pageX - e.touches[1].pageX) * 180 / Math.PI;
    star.style.transform = "rotate(" + rotation + "deg)";

})

document.addEventListener("touchend", e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const distX = touch.pageX - startX;
    const elapsedTime = Date.now() - startTime;

    if (elapsedTime < 500) {
        if (Math.abs(distX) >= 100) {
            if (distX > 0 && isAtStartPosition || (distX < 0 && isAtStartPosition)) {
                star.style.left = `${startX + distX}px`;
                isAtStartPosition = false;
            } 
            else if (distX < 0 && !isAtStartPosition || (distX > 0 && !isAtStartPosition)) {
                star.style.left = `${originalLeft}px`;
                isAtStartPosition = true;
            }
        } 
    }
});
