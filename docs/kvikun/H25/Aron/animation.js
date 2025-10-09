import { createTimeline, animate, svg } from 'https://cdn.jsdelivr.net/npm/animejs@4.1.3/+esm';

document.addEventListener('DOMContentLoaded', function() {
    const geimskip = createTimeline({
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutQuad',
    });

    geimskip
        .add('#XMLID_6_', {
            rotate: 3,
            duration: 1000,
            scale: 1.6,
        })
        .add('#school-logo', {
            duration: 1000,
            rotate: -3,
            translateY: 10,
        }, '-=1000')
        .add('#XMLID_6_', {
            translateY: -5,
            duration: 1000,
        })
        .add('#school-logo', {
            translateY: -5,
            duration: 1000,
        }, '-=1000')
        .add('#XMLID_6_', {
            rotate: -3,
            duration: 1000,
        })
        .add('#school-logo', {
            rotate: 3, 
            duration: 1000,
        }, '-=1000')
        .add('#XMLID_6_', {
            translateY: 0,
            duration: 1000,
        })
        .add('#school-logo', {
            translateY: 0,
            duration: 1000,
        }, '-=1000')
        .add('#XMLID_6_', {
            rotate: 0,
            scale: 1,
            duration: 1000,
            translateY: 5,
        })
        .add('#school-logo', {
            rotate: 0,
            duration: 1000,
            translateY: 10,
        }, '-=1000')
        .add('#school-logo', {
            translateY: 0,
            duration: 1000,
        });
    ;

    const tolur = createTimeline({
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutQuad',
    });

    tolur.label('tolurStart')
        .add('#XMLID_40_',{
            translateY: -10,
            duration: 1000,
        })
        .add('#XMLID_49_',{
            translateY: -10,
            duration: 900,
        }, '-=800')
        .add('#XMLID_52_',{
            translateY: -10,
            duration: 800,

        }, '-=800')
        .add('#XMLID_40_',{
            translateY: 0,
            duration: 1500,
        })
        .add('#XMLID_49_',{
            translateY: 0,
            duration: 1600,
        }, '-=800')
        .add('#XMLID_52_',{
            translateY: 0,
            duration: 1700,
        }, '-=800')
    ;

    const emojiPathAnimation = animate('#emoji-spaceship', {
        ease: 'linear',
        duration: 8000,
        loop: true,
        ...svg.createMotionPath('.spaceship-rim')
    });

    const beamMorph = createTimeline({
    loop: true, 
    easing: 'easeInOutQuad',
    direction: 'alternate',
    });

    beamMorph
        .add('#XMLID_57_', {
            d: 'M415.477 362.748c-288.477 25.252-466.477-10.748-160.477-7.748 306-4 130 35-160.201 7.57l142.772-234.911h41L415.477 362.748z',
            duration: 2000,
            translateY: [0, 0],
            opacity: 0.35,
            transformOrigin: '255.626px 245.5px'
        })
        .add('#XMLID_57_', {
            d: 'M365.477,362.748c-4.489-4.153-52.045-7.407-110.048-7.407c-58.738,0-106.763,3.346-110.201,7.57l72.91-234.523h74.481L365.477,362.748z',
            duration: 2000,
            translateY: [0, 0],
            opacity: 0.35,
            transformOrigin: '255.626px 245.5px'
        });

});

const takki = document.getElementById('XMLID_220_')

takki.addEventListener('click', function() {
    const spaceship = document.getElementById('XMLID_6_');

    // Færi geimskipið yfir geislann.
    spaceship.parentNode.parentNode.parentNode.appendChild(spaceship);
    animate('#school-logo', {
        opacity: 0,
        duration: 400,
    });
    animate('#XMLID_6_', {
        scale: 10,
        duration: 1000,
        complete: () => {
            console.log('clicked');
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    });
});
