function startup() {
    const el = document.getElementById("canvas");
    el.addEventListener("touchstart", handleStart);
    el.addEventListener("touchend", handleEnd);
    el.addEventListener("touchcancel", handleCancel);
    el.addEventListener("touchmove", handleMove);
    log("Initialized.");
}
  
function handleStart(evt) {
    evt.preventDefault();
    log("touchstart.");
    const el = document.getElementById("canvas");
    const ctx = el.getContext("2d");
    const touches = evt.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
      log(`touchstart: ${i}.`);
      ongoingTouches.push(copyTouch(touches[i]));
      const color = colorForTouch(touches[i]);
      log(`color of touch with id ${touches[i].identifier} = ${color}`);
      ctx.beginPath();
      ctx.arc(touches[i].pageX, touches[i].pageY, 4, 0, 2 * Math.PI, false); // a circle at the start
      ctx.fillStyle = color;
      ctx.fill();
    }
}

function handleMove(evt) {
    evt.preventDefault();
    const el = document.getElementById("canvas");
    const ctx = el.getContext("2d");
    const touches = evt.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
      const color = colorForTouch(touches[i]);
      const idx = ongoingTouchIndexById(touches[i].identifier);
  
      if (idx >= 0) {
        log(`continuing touch ${idx}`);
        ctx.beginPath();
        log(
          `ctx.moveTo( ${ongoingTouches[idx].pageX}, ${ongoingTouches[idx].pageY} );`,
        );
        ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
        log(`ctx.lineTo( ${touches[i].pageX}, ${touches[i].pageY} );`);
        ctx.lineTo(touches[i].pageX, touches[i].pageY);
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.stroke();
  
        ongoingTouches.splice(idx, 1, copyTouch(touches[i])); // swap in the new touch record
      } else {
        log("can't figure out which touch to continue");
      }
    }
  }

  function handleEnd(evt) {
    evt.preventDefault();
    log("touchend");
    const el = document.getElementById("canvas");
    const ctx = el.getContext("2d");
    const touches = evt.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
      const color = colorForTouch(touches[i]);
      let idx = ongoingTouchIndexById(touches[i].identifier);
  
      if (idx >= 0) {
        ctx.lineWidth = 4;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
        ctx.lineTo(touches[i].pageX, touches[i].pageY);
        ctx.fillRect(touches[i].pageX - 4, touches[i].pageY - 4, 8, 8); // and a square at the end
        ongoingTouches.splice(idx, 1); // remove it; we're done
      } else {
        log("can't figure out which touch to end");
      }
    }
  }

  function handleCancel(evt) {
    evt.preventDefault();
    log("touchcancel.");
    const touches = evt.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
      let idx = ongoingTouchIndexById(touches[i].identifier);
      ongoingTouches.splice(idx, 1); // remove it; we're done
    }
  }

  function colorForTouch(touch) {
    let r = touch.identifier % 16;
    let g = Math.floor(touch.identifier / 3) % 16;
    let b = Math.floor(touch.identifier / 7) % 16;
    r = r.toString(16); // make it a hex digit
    g = g.toString(16); // make it a hex digit
    b = b.toString(16); // make it a hex digit
    const color = `#${r}${g}${b}`;
    return color;
  }

const ongoingTouches = [];

document.addEventListener("DOMContentLoaded", startup);