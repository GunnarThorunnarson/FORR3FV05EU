import * as THREE from 'three';


var orbitRadius = 7;
var orbitRadius1 = 4;
var date;
//scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color( "Grey" )


const loader = new THREE.TextureLoader();
//loadar texture
const texture = new THREE.TextureLoader().load('static/jord.png' ); 

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
//býr til cameru og group + controls fyrir orbit
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
const group = new THREE.Group();

camera.position.set( 0, 20, 100 );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// "Tunglið"
const material = new THREE.MeshStandardMaterial( { map:texture } );
const cube = new THREE.Mesh( geometry, material );
//pyramídi
const geometry1 = new THREE.SphereGeometry( 1, 1, 1 );
const material1 = new THREE.MeshStandardMaterial( { color: "blue" } );
const pyramid = new THREE.Mesh( geometry1, material1 );
//jörð
const geometry2 = new THREE.SphereGeometry( 3, 32, 16 ); 
const material2 = new THREE.MeshStandardMaterial( {  map:texture } ); 
const sphere = new THREE.Mesh( geometry2, material2 ); 

//main ljósið
const light =  new THREE.DirectionalLight('White', 8);
light.position.set(0, 0, 5);
//ambient ljosið
const light2 = new THREE.AmbientLight( 0x404040 ); // soft white light
//adda í group og síðan inn á sceneið
group.add( sphere,light2, light,cube, pyramid );
scene.add( group );

let touchStart = [];
renderer.domElement.addEventListener('touchstart', handleTouchStart, false);
renderer.domElement.addEventListener('touchmove', handleTouchMove, false);

let rotating = false;

function handleTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 2) {
        rotating = true;
        touchStart[0] = event.touches[0].clientX;
        touchStart[1] = event.touches[0].clientY;
        touchStart[2] = event.touches[1].clientX;
        touchStart[3] = event.touches[1].clientY;
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    if (rotating && event.touches.length === 2) {
        const touchCurrent = [
            event.touches[0].clientX,
            event.touches[0].clientY,
            event.touches[1].clientX,
            event.touches[1].clientY
        ];

        const rotation = Math.atan2(
            touchCurrent[1] - touchCurrent[3],
            touchCurrent[0] - touchCurrent[2]
        ) - Math.atan2(
            touchStart[1] - touchStart[3],
            touchStart[0] - touchStart[2]
        );

        group.rotation.y += rotation; // Apply the rotation to your group

        touchStart = touchCurrent; // Update start positions for the next move
    }
}

function handleTouchEnd(event) {
    event.preventDefault();
    rotating = false;
}

renderer.domElement.addEventListener('touchend', handleTouchEnd, false);

function animate() {
	requestAnimationFrame( animate );
    date = Date.now() * 0.0001;

    
    cube.position.set(Math.cos(date) * orbitRadius,0, Math.sin(date) * orbitRadius)

    pyramid.position.set(Math.cos(date) * orbitRadius1 ,0,Math.sin(-date) * orbitRadius)
	renderer.render( scene, camera );
}
animate();
