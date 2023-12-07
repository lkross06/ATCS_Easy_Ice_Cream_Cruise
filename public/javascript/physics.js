import { threeToCannon } from 'https://cdn.skypack.dev/three-to-cannon';
import { ShapeType } from 'https://cdn.skypack.dev/three-to-cannon';
import { StraightZ, StraightX, LeftTurn, RightTurn, CheckpointX, CheckpointZ } from './track.js';

var container = document.querySelector('body'),
    w = container.clientWidth,
    h = container.clientHeight,
    scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderConfig = {antialias: true, alpha: true},
renderer = new THREE.WebGLRenderer(renderConfig);
const cameraOffset = new THREE.Vector3(0, 4, -10);

// car physics body
var chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.3, 2));
// did u know F1 cars are only 100 kg
var chassisBody = new CANNON.Body({mass: 100, material: groundMaterial});

chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 2, 0);
chassisBody.angularVelocity.set(0, 0, 0); // initial velocity
//speed tings
var maxSteerVal = Math.PI/32;
let engineForce = 600

// car visual body
let chassisColor = 0xB30E16
let wheelColor = 0x43464B
var cargeometry = new THREE.BoxGeometry(2, 0.9, 4); // double chasis shape
var material = new THREE.MeshBasicMaterial({color: chassisColor, side: THREE.DoubleSide});
var box = new THREE.Mesh(cargeometry, material);
scene.add(box);

camera.position.copy(box.position).add(cameraOffset);
camera.lookAt(box.position);
scene.add(camera);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(w, h);
container.appendChild(renderer.domElement);

var map = THREE.TextureLoader()
var handMaterial = new THREE.MeshPhongMaterial({map: map});




window.addEventListener('resize', function() {
  w = container.clientWidth;
  h = container.clientHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
})

var geometry = new THREE.PlaneGeometry(10, 10, 10);
var material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
var plane = new THREE.Mesh(geometry, material);
plane.rotation.x = Math.PI/2;
scene.add(plane);

var sunlight = new THREE.DirectionalLight(0xffffff, 1.0);
sunlight.position.set(-10, 10, 0);
scene.add(sunlight)

/**
* Physics
**/

var world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.gravity.set(0, -9.8, 0);
world.defaultContactMaterial.friction = 0;


//test track piece
var checkpoints = [] //list of all checkpoints in the order that the player will see them. start with staring line

let s = new StraightZ(0, 0, 15)
s.makeBlock(scene, world)

let cp = new CheckpointZ()
cp.makeBlock(scene, world)
checkpoints.push(cp)

cp.snapTo(s, "N")

s = new StraightZ()
s.makeBlock(scene, world)

s.snapTo(cp, "N")

let t = new RightTurn()
t.color = 0x0000FF
t.makeBlock(scene, world)

t.snapTo(s, "N")

var groundMaterial = new CANNON.Material('groundMaterial');
var wheelMaterial = new CANNON.Material('wheelMaterial');
var wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
    friction: 1,
    restitution: 0.05,
    contactEquationStiffness: 1000,
});

world.addContactMaterial(wheelGroundContactMaterial);
// parent vehicle object
let vehicle = new CANNON.RaycastVehicle({
  chassisBody: chassisBody,
  indexRightAxis: 0, // x
  indexUpAxis: 1, // y
  indexForwardAxis: 2, // z
});

// wheel options
var options = {
  radius: 0.5,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 75,
  suspensionRestLength: 0.2,
  frictionSlip: 10000,
  dampingRelaxation: 2.3,
  dampingCompression: 4.5,
  maxSuspensionForce: 200000,
  rollInfluence:  0,
  axleLocal: new CANNON.Vec3(-1, 0, 0),
  chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
  maxSuspensionTravel: 10,
  customSlidingRotationalSpeed: -30,
  useCustomSlidingRotationalSpeed: true,
};

var axlewidth = 1.2;
options.chassisConnectionPointLocal.set(axlewidth, 0, -1);
vehicle.addWheel(options);

options.chassisConnectionPointLocal.set(-axlewidth, 0, -1);
vehicle.addWheel(options);

options.chassisConnectionPointLocal.set(axlewidth, 0, 1);
vehicle.addWheel(options);

options.chassisConnectionPointLocal.set(-axlewidth, 0, 1);
vehicle.addWheel(options);

vehicle.addToWorld(world);

// car wheels
var wheelBodies = [],
    wheelVisuals = [];
vehicle.wheelInfos.forEach(function(wheel) {
  var shape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);
  var body = new CANNON.Body({mass: 11.5, material: wheelMaterial});
  var q = new CANNON.Quaternion();
  q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
  body.addShape(shape, new CANNON.Vec3(), q);
  wheelBodies.push(body);
  // wheel visual body
  var geometry = new THREE.CylinderGeometry( wheel.radius, wheel.radius, 0.4, 32 );
  var material = new THREE.MeshPhongMaterial({
    color: wheelColor,
    emissive: wheelColor,
    side: THREE.DoubleSide,
    flatShading: true,
  });
  var cylinder = new THREE.Mesh(geometry, material);
  cylinder.geometry.rotateZ(Math.PI/2);
  wheelVisuals.push(cylinder);
  scene.add(cylinder);
});

// update the wheels to match the physics
world.addEventListener('postStep', function() {
  for (var i=0; i<vehicle.wheelInfos.length; i++) {
    vehicle.updateWheelTransform(i);
    var t = vehicle.wheelInfos[i].worldTransform;
    // update wheel physics
    wheelBodies[i].position.copy(t.position);
    wheelBodies[i].quaternion.copy(t.quaternion);
    // update wheel visuals
    wheelVisuals[i].position.copy(t.position);
    wheelVisuals[i].quaternion.copy(t.quaternion);
  }
});
var q = plane.quaternion;

var planeBody = new CANNON.Body({
  mass: 0, // mass = 0 makes the body static
  material: groundMaterial,
  shape: new CANNON.Plane(),
  quaternion: new CANNON.Quaternion(-q._x, q._y, q._z, q._w)
});
world.add(planeBody)

/**
* Main
**/

function updatePhysics() {
  world.step(1/60);
  // update the chassis position
  box.position.copy(chassisBody.position);
  box.quaternion.copy(chassisBody.quaternion);
  navigate()
  updateCheckpoints()
}


function render(timestamp) {
  // timestamp should == the refresh rate 
  // add up diff of timestamps
  // then do a game tick - increase accell, move car, etc
  // everyone moves foreward on game tick time, even tho animate is faster. 
  // gametick -> send timestamp, send position, speed, etc
  // server keeps ^ and tells all other clients the location of x client
  // gametick = slowest refresh of the person. tie it to a var
  // render takes timestamp of last render, and the new timestamp, and the difference = 1 refresh rate. 
  const relativeCameraOffset = new THREE.Vector3(0, 4, -10).applyMatrix4(box.matrixWorld);
  camera.position.copy(relativeCameraOffset);
  camera.lookAt(box.position);
  renderer.render(scene, camera);
  updatePhysics()
  document.getElementById("speed").innerText = Math.round(vehicle.currentVehicleSpeedKmHour).toString() + "KPH" 
  requestAnimationFrame(render);
}

var keys_pressed = {} //map of all keys pressed, formatted "keycode:boolean"
var steeringValue = 0

function handleKeyPress(e){
  if (e.type != 'keydown' && e.type != 'keyup') return;

  keys_pressed[e.keyCode] = e.type == 'keydown'; //runs for every key to keep track of multiple
}

function updateCheckpoints(){
  for (let cp of checkpoints){
    let result = [];
    let a = []
    let b = []
    for (let i of wheelBodies){
      a.push(i)
      b.push(cp.body)
    }
    world.narrowphase.getContacts(a, b, world, result, [], [], []);
    var overlaps = result.length > 0;
    cp.setChecked(overlaps)
  }
}

function navigate() {
  if (!keys_pressed[32]){
    vehicle.setBrake(0, 0);
    vehicle.setBrake(0, 1);
    vehicle.setBrake(0, 2);
    vehicle.setBrake(0, 3);
  }

  
  let speed = vehicle.currentVehicleSpeedKmHour

  //y = -4x + 600 but absolute value
  //at speed = 0, eF = 600
  //at speed = 150 or -150, eF = 0
  engineForce = (-4 * speed) + 600
  if (speed < 0){
    engineForce = (-4 * -speed) + 600
  }
  if (engineForce > 800) engineForce = 800 //cap
 

  if (keys_pressed[32]){ //brake
      //brake has priority over movement
    vehicle.setBrake(12, 2);
    vehicle.setBrake(12, 3);
  } else if (keys_pressed[87] && !keys_pressed[83]) { //forward
      vehicle.applyEngineForce(-engineForce, 2);
      vehicle.applyEngineForce(-engineForce, 3);
  } else if (!keys_pressed[87] && keys_pressed[83]) { //backward
      vehicle.applyEngineForce(engineForce / 2, 2);
      vehicle.applyEngineForce(engineForce / 2, 3);
  } else {
      vehicle.applyEngineForce(0, 2);
      vehicle.applyEngineForce(0, 3);
  }

  if (keys_pressed[65] && !keys_pressed[68]){ //left
      steeringValue += 0.003
  } else if (keys_pressed[68] && !keys_pressed[65]){ //right
      steeringValue -= 0.003
  } else {
      steeringValue += -steeringValue / 8
  }

  if (steeringValue > maxSteerVal) steeringValue = maxSteerVal
  if (steeringValue < -maxSteerVal) steeringValue = -maxSteerVal

  vehicle.setSteeringValue(steeringValue, 2);
  vehicle.setSteeringValue(steeringValue, 3);
}
window.addEventListener('keydown', handleKeyPress)
window.addEventListener('keyup', handleKeyPress)

var then = Date.now();
var fpsInterval = 1000 / 60;

render();