const svg = document.getElementById('SVG');
const Hrin = document.getElementById('Hringur');

let eraddrag = false;
let startX, startY, translateX, translateY;

Hrin.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
  const transform = window.getComputedStyle(Hrin).getPropertyValue('transform');
  if (transform !== 'none') {
    const matrix = transform.split(', ');
    translateX = parseInt(matrix[4]);
    translateY = parseInt(matrix[5]);
  } else {
    translateX = 0;
    translateY = 0;
  }
  eraddrag = true;
});

Hrin.addEventListener('touchmove', (e) => {
  if (!eraddrag) return;
  const touch = e.touches[0];
  const deltaX = touch.clientX - startX;
  const deltaY = touch.clientY - startY;

  Hrin.style.transform = `translate(${translateX + deltaX}px, ${translateY + deltaY}px)`;
});

Hrin.addEventListener('touchend', () => {
  eraddrag = false;
});