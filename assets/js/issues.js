import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from "three/addons/utils/SkeletonUtils.js";

// Requirements for ThreeJS animations
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();

// Adding canvas
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0x00ff00);
document.body.appendChild( renderer.domElement );

// Picture background for canvas
const background = new THREE.TextureLoader().load('images/background.jpg')
scene.background = background;


const loader = new GLTFLoader();
const trashes =  new THREE.Object3D();
const models =  new THREE.Object3D();
let mixers = [];
let animations = {};

// Function for pairing animations with a model
function setAnimation(model, animation){
    let mixer = new THREE.AnimationMixer( model );
    const action = mixer.clipAction( animation );
    action.play();
    mixers.push(mixer);
}

// Function for fetching a model
async function loadGLB(model, hasAnimation=false, isTrash=false) {
    const gltf = await loader.loadAsync( `assets/3d/${model}.glb`);
    gltf.scene.name = model;

    if (hasAnimation) {
        animations[model] = gltf.animations[ 0 ];
        setAnimation(gltf.scene, animations[model]);
    }

    if (isTrash){
        trashes.add(gltf.scene);
    }
    else {
        models.add(gltf.scene);
    }
       
    return gltf.scene;
}

// Function for cloning a model
async function cloneModel(model, hasAnimation, isTrash=false) {
    const gltf = (isTrash) ? trashes.getObjectByName(model) : models.getObjectByName(model) ;
    const clonedModel = clone(gltf);

    if (hasAnimation) {
        setAnimation(clonedModel, animations[model]);
    }

    if (isTrash){
        trashes.add(clonedModel);
    }
    else {
        models.add(clonedModel);
    }
    
    return clonedModel;
}

// Function for moving a model
function transformModel(model, x, y, z, rotation, scale){
    model.position.x = x;
    model.position.y = y;
    model.position.z = z;
    model.scale.set(scale, scale, scale);
    model.rotation.y = rotation;
}

let [island, boat1, boat2, fish1, fish2, fish3, manta, trash1, trash2] = await Promise.all([
        loadGLB("island",), 
        loadGLB("boat1"),
        loadGLB("boat2"),
        loadGLB("fish1", true),
        loadGLB("fish2", true),
        loadGLB("fish3", true),
        loadGLB("manta", true),
        loadGLB("trash1", false, true), 
        loadGLB("trash2", false, true),
    ]);

transformModel(boat1, 0,  0.29, -1.25, 3*Math.PI/2, 0.01);
transformModel(boat2, -0.6,  0.405, -0.4, -2.4*Math.PI, 0.05);
transformModel(fish1, 2,  0, 0, 0, 0.05);
transformModel(fish2, 0,  0, -1.25, Math.PI / 2, 0.05);
transformModel(fish3, -1.5,  0, 1.5, 3*Math.PI/2, 0.05);
transformModel(manta, 0,  0,  0, Math.PI / 2, 0.05);
transformModel(trash1, 0,  0.47,  0, 0, 0.05);
transformModel(trash2, 0,  0.3, -2.2,  0, 0.05);

let [fish1Clone1, fish1Clone2, trash1Clone1, trash1Clone2, trash1Clone3, 
trash2Clone1, trash2Clone2] = await Promise.all([
    cloneModel("fish1", true), 
    cloneModel("fish1", true),
    cloneModel("trash1", false, true),
    cloneModel("trash1", false, true),
    cloneModel("trash1", false, true),
    cloneModel("trash2", false, true),
    cloneModel("trash2", false, true),
]);

transformModel(fish1Clone1, 0, 0, 0, 0, 0.05);
transformModel(fish1Clone2, 0, 0, 0, 0, 0.05);
transformModel(trash1Clone1, 1, 0.27, 0, 0, 0.05);
transformModel(trash1Clone2, 0, 0.27, 1, 0, 0.05);
transformModel(trash1Clone3, 0.2, 0.2, -0.9, 0, 0.05);
transformModel(trash2Clone1, 0.5, 0.3, 0.63, 0, 0.05);
transformModel(trash2Clone2, -0.9, 0.16, -0.75, 0, 0.05);

scene.add(models);
scene.add(trashes);

// Path for fish2
const points = [
	new THREE.Vector3(1, 0, 1.5),
    new THREE.Vector3(-1.5, 0, 1.5),
    new THREE.Vector3(-1.75, 0, -1),
    new THREE.Vector3(-1.25, 0, -1),
    new THREE.Vector3(-1.25, 0, 1),
];

const path = new THREE.CatmullRomCurve3(points, true);

/* Drawing path (for testing purposes)
const pathGeometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(50));
const pathMaterial = new THREE.LineBasicMaterial({color : 0xff0000, transparent: true, opacity: 0});
const pathObject = new THREE.Line(pathGeometry, pathMaterial);
scene.add(pathObject);

*/

// Path for fish3
const points2 = [
	new THREE.Vector3(1, 0, 1.5),
    new THREE.Vector3(-1, 0, 1.5),
    new THREE.Vector3(1, 0, 1.25),
    new THREE.Vector3(1.25, 0, -1.25),
    new THREE.Vector3(2, 0, -1.25),
];

const path2 = new THREE.CatmullRomCurve3(points2, true);

/* Drawing path (for testing purposes)
const pathGeometry2 = new THREE.BufferGeometry().setFromPoints(path2.getPoints(50));
const pathMaterial2 = new THREE.LineBasicMaterial({color : 0x00ff00, transparent: true, opacity: 0});
const pathObject2 = new THREE.Line(pathGeometry2, pathMaterial2);

scene.add(pathObject2); 
*/

// Adding lights to see the models
const topLight = new THREE.DirectionalLight(0xffffff, 3); // (color, intensity)
topLight.position.set(-200, 200, 100) 
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Allowing restricted camera controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableZoom = false;
controls.enablePan = false;
controls.minPolarAngle = 1.1; // radians
controls.maxPolarAngle = 1.35 // radians

camera.position.z = 2;
camera.position.y = 0.75;

scene.rotation.y = Math.PI;


let t = 0; 
const clock = new THREE.Clock();
// Function for all animations
function animate() {
	requestAnimationFrame( animate );

    t += 1;

    // Getting angle of camera for boat1 to follow
    let azimuthalAngle = controls.getAzimuthalAngle();
    if (boat1){
        boat1.position.x = -1.4 * Math.sin(azimuthalAngle);
        boat1.position.z = -1.4 * Math.cos(azimuthalAngle);
        boat1.rotation.y = azimuthalAngle + 5;
    }

    // Movement for fish1 and its clones
    if (fish1 && fish1Clone1 && fish1Clone2) {
        fish1.position.x = 0.5* Math.sin(t*0.009) + 1.6;
        fish1.position.z = -0.75 * Math.cos(t*-0.009) - 0.1;

        fish1Clone1.position.x = 0.5* Math.sin(t*0.009) + 1.7;
        fish1Clone1.position.z = -0.75 * Math.cos(t*-0.009) - 0.1;

        fish1Clone2.position.x = 0.5* Math.sin(t*0.009) + 1.5;
        fish1Clone2.position.z = -0.75 * Math.cos(t*-0.009) - 0.1;

        if (fish1.position.x > 1.2 && fish1.position.x < 1.7){
            fish1.rotation.y -= 0.025;
            fish1Clone1.rotation.y -= 0.025;
            fish1Clone2.rotation.y -= 0.025;
        }
    }

    // Path following movement for fish2 and fish3
    const i = (t / 200 % 6) / 6;
    const position = path.getPointAt(i);
    const tangent = path.getTangentAt(i).normalize();

    const j = (t / 200 % 6) / 6;
    const position2 = path2.getPointAt(j);
    const tangent2 = path2.getTangentAt(j).normalize();


    if (fish2){
        fish2.position.copy(position2);
        fish2.rotation.y = Math.atan2( tangent2.x, tangent2.z );
    }

    if (fish3){
        fish3.position.copy(position);
        fish3.rotation.y = Math.atan2( tangent.x, tangent.z );
    }

    // Circular movement for manta
    if (manta){
        manta.position.x = 2 * Math.sin(t*0.005);
        manta.position.z = -2 * Math.cos(t*0.005);
        manta.rotation.y -= 0.005;
    }

    // Update animations
    const delta = clock.getDelta();
    mixers.forEach(function(mixer) {
        mixer.update(delta);
    });

    controls.update();
	renderer.render( scene, camera );
}
animate();

var articles = document.querySelectorAll("article");
var canvas = document.querySelector("canvas");
var closeButtons = document.querySelectorAll(".close");
var header = document.querySelector(".header");

// Event handler for disappearing articles and appearing canvas
closeButtons.forEach((closeButton) => closeButton.onclick = () => {
    closeButton.parentElement.style.display = "none";
    canvas.style.display = "block";
    header.style.display = "block";
})


// reference: https://stackoverflow.com/questions/12800150/catch-the-click-event-on-a-specific-mesh-in-the-renderer?rq=3
// Event handler for disappearing trash bags and appearing articles
let articleCounter = 0
renderer.domElement.addEventListener('pointerup', (event) => {

    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();

    mouse.x = (event.clientX / renderer.domElement.clientWidth - renderer.domElement.getBoundingClientRect().x) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight + renderer.domElement.getBoundingClientRect().y) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(trashes.children, true);

    if (intersects.length > 0) {
        trashes.remove( intersects[0]["object"]["parent"] );
        articles[articleCounter].style.display = "grid";
        articleCounter += 1;
        canvas.style.display = "none";
        header.style.display = "none";
        if (articleCounter == 7) {
            header.innerText = "Thank you for keeping our waters clean (´▽`ʃ♡ƪ)"
        }
        else{
            header.innerText = `Clean ${articles.length-articleCounter} trash bags`;
        }
        
    }
});

