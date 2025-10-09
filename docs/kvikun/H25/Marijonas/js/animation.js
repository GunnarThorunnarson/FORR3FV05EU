
import {animate, svg, createTimeline} from './anime.esm.min.js';

// array fyrir morphing skýja, hvert ský notar original path og morph path og skiptir á milli þeirra (V0.3 anime.js)
const cloudMorphs = [
    [
      "M546.44,32 A60,60 0 1,1 503.34,-27.57 A60,60 0 1,1 590.58,20 A60,60 0 1,1 635.77,18 A60,60 0 1,1 725.52,36 A60,60 0 1,1 648.32,47 A60,60 0 1,1 613.59,46 A60,60 0 1,1 546.44,32 Z",
      "M546.44,32 A55,55 0 1,1 505,-5 A55,55 0 1,1 588,22 A55,55 0 1,1 640,12 A55,55 0 1,1 728,38 A55,55 0 1,1 650,48 A55,55 0 1,1 615,46 A55,55 0 1,1 546.44,32 Z"
    ],
    [
      "M105,45 A60,60 0 1,1 72,-16 A60,60 0 1,1 151,-27 A60,60 0 1,1 196,-36 A60,60 0 1,1 301,-20 A60,60 0 1,1 247,38 A60,60 0 1,1 179,55 A60,60 0 1,1 105,45 Z",
      "M105,45 A55,55 0 1,1 75,-4 A55,55 0 1,1 150,-15 A55,55 0 1,1 200,-24 A55,55 0 1,1 305,-8 A55,55 0 1,1 250,30 A55,55 0 1,1 180,48 A55,55 0 1,1 105,45 Z"
    ],
    [
      "M-345,48 A60,60 0 1,1 -391,-30 A60,60 0 1,1 -320,-44 A60,60 0 1,1 -265,-48 A60,60 0 1,1 -192,-45 A60,60 0 1,1 -206,23 A60,60 0 1,1 -267,35 A60,60 0 1,1 -345,48 Z",
      "M-345,48 A55,55 0 1,1 -390,-18 A55,55 0 1,1 -322,-32 A55,55 0 1,1 -268,-36 A55,55 0 1,1 -190,-33 A55,55 0 1,1 -208,23 A55,55 0 1,1 -265,35 A55,55 0 1,1 -345,48 Z"
    ]
  ];

//sama og með skýin nema fyrir sjóinn (V0.3 anime.js)
const sjorMorphs= [
    "M0,100C 40,90 80,110 120,100C 160,90 200,110 240,100C 280,90 320,110 400,100 L400,170L0,170Z",
    "M0,100C 40,80 80,120 120,100C 160,80 200,120 240,100C 280,80 320,120 400,100 L400,170L0,170Z",
    "M0,102C 40,92 80,112 120,102C 160,92 200,112 240,102C 280,92 320,112 400,102 L400,170L0,170Z",
    "M0,98C 40,88 80,108 120,98C 160,88 200,108 240,98C 280,88 320,108 400,98 L400,170L0,170Z"
];

// gerir timeline base
const tl = createTimeline({defaults: { duration: 1500, loop: true, alternate: true, ease: 'inOutQuad' }});

// byrjar tl og bætir við animationum
tl.label('start')
    // allt sem er að morpha er að nota V0.3 anime.js morphing
  .add('.cloud', { y: '-100px', d: [cloudMorphs[0][0], cloudMorphs[0][1]]}, 600)
  .add('.cloud1', { y: '-75px', d: [cloudMorphs[1][0], cloudMorphs[1][1]]}, 'start')
  .add('.cloud2', { y: '-90px', d: [cloudMorphs[2][0], cloudMorphs[2][1]]}, 400)
  .add('.skip', { duration: 1200,y: '3px', rotate: ['1deg']}, 'start')
  .add('.sjor', {duration: 7000, d: [sjorMorphs[0],sjorMorphs[3],sjorMorphs[2], sjorMorphs[1] ,sjorMorphs[2],sjorMorphs[0],sjorMorphs[3]]}, 100)
  .add('.errorTexti', { duration: 4000, y: '140px', opacity: 0.05}, 'start');

// teiknir 4 framan og aftan og eyðir teikninguna
animate(svg.createDrawable('.fjorir'), {
    draw: ['0 0', '0 1', '1 1'],
    ease: 'linear',
    duration: 4000,
    loop: true
  });

// gerir hreyfingu steinsins, (notað const hér í staðinn fyrir að setja það í animate er út af því það leit skrítið út þegar það var að animate-a)
const {translateX, translateY} = svg.createMotionPath('.sjorpath');
const steinn = animate('.steinn', {
    duration: 30000,
    loop: true,
    translateX: translateX,
    translateY: translateY
  });
// sama og steinn nema createMotionPath er notað beint í animate
const sol = animate('.sol', {
    duration: 30000,
    loop: true,
    scale: [0.9, 1.1],
    easing: 'linear',
    ...svg.createMotionPath('.pathsol')
  });

// finnur skipið og gerir const til að það sé hægt að nota það í event listener
const skip = document.querySelector('.skip');

// þegar það er ýtt á skipið þá keyrir þetta
skip.addEventListener('click', () => {
    const skipKeyra = animate('.skip', {
        x: '-400px',
        duration: 20000,
        easing: 'linear',
        // þegar það keyrir af þá er skipið sett til hægri og keyrir aftur á staðinn
        onComplete: () => { 
            skip.style.transform = 'translateX(320px)'
            animate('.skip', {
                x: '0px',
                duration: 10000,
                easing: 'linear',
            });}
    }
    )
});
