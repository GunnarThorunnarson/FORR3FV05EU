
// mikið af ai voodoo eftir endalaust bras....


// app.js — Anime.js v4.1.3
window.addEventListener('load', () => {
  if (!window.anime) {
    console.error('Anime.js fannst ekki (v4). Athugaðu CDN slóðina.');
    return;
  }
  const { createTimeline, animate, svg } = window.anime;

  // Safna lógó-paths: fyrst ID, annars öll path í hópum sem líta út eins og lógó - wtf???????
  const explicit = ['#logoOrange', '#logoLightBlue', '#logoDarkBlue1', '#logoDarkBlue2']
    .map(sel => document.querySelector(sel)).filter(Boolean);
  let logoPaths = explicit;
  if (!logoPaths.length) {
    logoPaths = Array.from(document.querySelectorAll('#tsk_logo path, g[id*="logo"] path, .tsk-logo path'));
  }
  const drawables = logoPaths.map(p => {
    try { return svg.createDrawable(p)[0]; } catch(e) { return null; }
  }).filter(Boolean);

  // Motion path fyrir tumbleweed
  let weedPath = document.querySelector('#weedPath');
  if (!weedPath) {
    const scene = document.querySelector('#scene, svg');
    if (scene) {
      weedPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      weedPath.setAttribute('id', 'weedPath');
      weedPath.setAttribute('d', 'M -120,420 C 40,400 300,440 560,430');
      weedPath.setAttribute('fill', 'none');
      weedPath.setAttribute('stroke', 'none');
      scene.appendChild(weedPath);
    }
  }
  const motion = weedPath ? svg.createMotionPath('#weedPath') : {};

  // Timeline: A) hópur birtist  B) line-draw logo  C) tumbleweed  D) backHomeText
  const tl = createTimeline();

  tl.add('#NotFound', {
    opacity: [0, 1],
    y: ['-10px', '0px'],
    ease: 'outQuad',
    duration: 900
  });

  if (drawables.length) {
    tl.add(drawables, {
      draw: ['0 0', '0 1'],
      ease: 'inOutSine',
      duration: 1500,
      delay: window.anime.stagger(150)
    });
  }

if (motion && document.querySelector('#tumbleweed')) {
  tl.add('#tumbleweed', {
    opacity: [0,1],                // birtist mjúklega
    ...motion,                     // translateX, translateY
    rotate: ['0deg','360deg'],
    ease: 'linear',
    duration: 7000
  });
}


  tl.add('#backHomeText', {
    opacity: [0, 1],
    y: ['8px', '0px'],
    ease: 'outCubic',
    duration: 700
  });

  
  //fokking virkar ekkert með þetta backhome

  const back = document.querySelector('#backHomeText');
  if (back) {
    back.addEventListener('mouseenter', () => animate(back, { scale: 1.06, duration: 200, ease: 'outQuad' }));
    back.addEventListener('mouseleave', () => animate(back, { scale: 1.00, duration: 200, ease: 'outQuad' }));
    back.addEventListener('click', () => {
      animate(back, {
        scale: [{ to: 0.94, duration: 120, ease: 'inQuad' },
                { to: 1.00, duration: 260, ease: 'outElastic(1, .6)' }]
      });
      // window.location.href = '/';
    });
  }
});


