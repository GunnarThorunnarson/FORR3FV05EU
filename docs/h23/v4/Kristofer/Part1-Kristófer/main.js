


const mynd = document.getElementById("mynd");
const bodyel = document.getElementsByTagName("BODY")[0];



let isDragging = false;
let isTwo = false;
let startX, startY, currentX, currentY;
let initialDistance;

document.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
        isTwo = true;
        const x1 = e.touches[0].screenX;
        const y1 = e.touches[0].screenY;
        const x2 = e.touches[1].screenX;
        const y2 = e.touches[1].screenY;
        bodyel.style.backgroundColor = "red";
        initialDistance = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

    } else {
        isDragging = true;
        startX = e.touches[0].clientX - parseInt(mynd.style.left || 0);
        startY = e.touches[0].clientY - parseInt(mynd.style.top || 0);
    }
});

document.addEventListener('touchmove', e => {
    if (isDragging && e.touches.length === 1) {
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
        console.log(e.touches);

        mynd.style.left = currentX + 'px';
        mynd.style.top = currentY + 'px';
    } else if (isTwo && e.touches.length === 2) {

        const x1 = e.touches[0].screenX;
        const y1 = e.touches[0].screenY;
        const x2 = e.touches[1].screenX;
        const y2 = e.touches[1].screenY;


        const distance = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

        const scaleFactor = distance / initialDistance;
        mynd.style.transform = `scale(${scaleFactor})`;
    }
});


document.addEventListener('touchend', () => {
    isDragging = false;
    isTwo = false;
    para2.textContent = "#";
    bodyel.style.backgroundColor = "white";
});