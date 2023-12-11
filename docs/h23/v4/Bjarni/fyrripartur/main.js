document.addEventListener("DOMContentLoaded", function () {
    const square = document.getElementById("draggable-square");
    const mc = new Hammer.Manager(square);
  
    // Enable pan and pinch gestures
    mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
    mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith(mc.get('pan'));
  
    let posX = 0,
        posY = 0,
        scale = 1,
        lastPosX = 0,
        lastPosY = 0,
        lastScale = 1;
  
    mc.on("panmove", function (e) {
      posX = lastPosX + e.deltaX;
      posY = lastPosY + e.deltaY;
  
      square.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    });
  
    mc.on("pinchmove", function (e) {
      scale = Math.max(1, Math.min(lastScale * e.scale, 3));
  
      square.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    });
  
    mc.on("panend pinchend", function () {
      lastPosX = posX;
      lastPosY = posY;
      lastScale = scale;
    });
  });
  
