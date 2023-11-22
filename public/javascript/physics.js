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
var chassisBody = new CANNON.Body({mass: 50});
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 1, 0);
chassisBody.angularVelocity.set(0, 0, 0); // initial velocity

// car visual body
var cargeometry = new THREE.BoxGeometry(2, 0.6, 4); // double chasis shape
var material = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide});
var box = new THREE.Mesh(cargeometry, material);
scene.add(box);

camera.position.copy(box.position).add(cameraOffset);
camera.lookAt(box.position);
scene.add(camera);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(w, h);
container.appendChild(renderer.domElement);



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
world.gravity.set(0, -10, 0);
world.defaultContactMaterial.friction = 0;

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
  suspensionRestLength: 0.4,
  frictionSlip: 10000,
  dampingRelaxation: 2.3,
  dampingCompression: 4.5,
  maxSuspensionForce: 200000,
  rollInfluence:  0.01,
  axleLocal: new CANNON.Vec3(-1, 0, 0),
  chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
  maxSuspensionTravel: 0.5,
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

<<<<<<< HEAD
vehicle.addWheel({
  body: wheelBody1,
  position: new CANNON.Vec3(-2, 0, axisWidth / 2),
  axis: new CANNON.Vec3(0, 1, 0),
  direction: down,
});

const wheelBody2 = new CANNON.Body({ mass, material: wheelMaterial });
wheelBody2.addShape(wheelShape);

const initialRotation2 = new CANNON.Quaternion();
initialRotation2.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI/2);
wheelBody2.quaternion.copy(initialRotation2);

wheelBody2.angularDamping = 1;

vehicle.addWheel({
  body: wheelBody2,
  position: new CANNON.Vec3(-2, 0, -axisWidth / 2),
  axis: new CANNON.Vec3(0, 1, 0),
  direction: down,
});

const wheelBody3 = new CANNON.Body({ mass, material: wheelMaterial });
wheelBody3.addShape(wheelShape);

const initialRotation3 = new CANNON.Quaternion();
initialRotation3.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI/2);
wheelBody3.quaternion.copy(initialRotation3);

wheelBody3.angularDamping = 1;

vehicle.addWheel({
  body: wheelBody3,
  position: new CANNON.Vec3(2, 0, axisWidth / 2),
  axis: new CANNON.Vec3(1, 1, 0),
  direction: down,
});

const wheelBody4 = new CANNON.Body({ mass, material: wheelMaterial });
wheelBody4.addShape(wheelShape);

const initialRotation4 = new CANNON.Quaternion();
initialRotation4.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI/2);
wheelBody4.quaternion.copy(initialRotation4);

wheelBody4.angularDamping = 1;

vehicle.addWheel({
  body: wheelBody4,
  position: new CANNON.Vec3(2, 0, -axisWidth / 2),
  axis: new CANNON.Vec3(0, 1, 0),
  direction: down,
});

vehicle.addToWorld(physicsWorld);



document.addEventListener('keydown', (event) => {
    const maxSteerVal = Math.PI / 8;
    const maxForce = 20;

    switch (event.key) {
    case 'w':
    case 'ArrowUp':
        vehicle.applyWheelForce(maxForce, 0);
        vehicle.applyWheelForce(maxForce, 1);
        break;

    case 's':
    case 'ArrowDown':
        vehicle.setWheelForce(-maxForce / 2, 0);
        vehicle.setWheelForce(-maxForce / 2, 1);
        break;

    case 'a':
    case 'ArrowLeft':
        vehicle.setSteeringValue(maxSteerVal, 0);
        vehicle.setSteeringValue(maxSteerVal, 1);
        break;

    case 'd':
    case 'ArrowRight':
        vehicle.setSteeringValue(-maxSteerVal, 0);
        vehicle.setSteeringValue(-maxSteerVal, 1);
        break;
    }
});

// reset car force to zero when key is released
document.addEventListener('keyup', (event) => {
    switch (event.key) {
    case 'w':
    case 'ArrowUp':
        vehicle.setWheelForce(0, 0);
        vehicle.setWheelForce(0, 1);
        break;

    case 's':
    case 'ArrowDown':
        vehicle.setWheelForce(0, 0);
        vehicle.setWheelForce(0, 1);
        break;

    case 'a':
    case 'ArrowLeft':
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
        break;

    case 'd':
    case 'ArrowRight':
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
        break;
    }
});


const boxGeometry = new THREE.BoxGeometry(8, 1, 4);
const boxMaterial = new THREE.MeshNormalMaterial();
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
test.scene.add(boxMesh);

const sphereGeometry1 = new THREE.CylinderGeometry(1, 1, 0.5, 16);
const sphereMaterial1 = new THREE.MeshNormalMaterial();
const sphereMesh1 = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
test.scene.add(sphereMesh1);

const sphereGeometry2 = new THREE.CylinderGeometry(1, 1, 0.5, 16);
const sphereMaterial2 = new THREE.MeshNormalMaterial();
const sphereMesh2 = new THREE.Mesh(sphereGeometry2, sphereMaterial2);
test.scene.add(sphereMesh2);

const sphereGeometry3 = new THREE.CylinderGeometry(1, 1, 0.5, 16);
const sphereMaterial3 = new THREE.MeshNormalMaterial();
const sphereMesh3 = new THREE.Mesh(sphereGeometry3, sphereMaterial3);
test.scene.add(sphereMesh3);

const sphereGeometry4 = new THREE.CylinderGeometry(1, 1, 0.5, 16);
const sphereMaterial4 = new THREE.MeshNormalMaterial();
const sphereMesh4 = new THREE.Mesh(sphereGeometry4, sphereMaterial4);
test.scene.add(sphereMesh4);


const groundGeo = new THREE.PlaneGeometry(30, 30)
const groundMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
=======
// car wheels
var wheelBodies = [],
    wheelVisuals = [];
vehicle.wheelInfos.forEach(function(wheel) {
  var shape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);
  var body = new CANNON.Body({mass: 1, material: wheelMaterial});
  var q = new CANNON.Quaternion();
  q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
  body.addShape(shape, new CANNON.Vec3(), q);
  wheelBodies.push(body);
  // wheel visual body
  var geometry = new THREE.CylinderGeometry( wheel.radius, wheel.radius, 0.4, 32 );
  var material = new THREE.MeshPhongMaterial({
    color: 0xd0901d,
    emissive: 0xaa0000,
>>>>>>> 6ae364a5894b475b67d60db9b65c4812ef319b7a
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

}


function render() {
  requestAnimationFrame(render);
  const relativeCameraOffset = new THREE.Vector3(0, 4, -10).applyMatrix4(box.matrixWorld);
  camera.position.copy(relativeCameraOffset);
  camera.lookAt(box.position);
  renderer.render(scene, camera);
  updatePhysics();
}

function navigate(e) {
  if (e.type != 'keydown' && e.type != 'keyup') return;
  var keyup = e.type == 'keyup';
  vehicle.setBrake(0, 0);
  vehicle.setBrake(0, 1);
  vehicle.setBrake(0, 2);
  vehicle.setBrake(0, 3);

  var engineForce = 400,
      maxSteerVal = Math.PI/8;
  switch(e.keyCode) {

    case 87: // forward
      vehicle.applyEngineForce(keyup ? 0 : -engineForce, 2);
      vehicle.applyEngineForce(keyup ? 0 : -engineForce, 3);
      break;

    case 83: // backward
      vehicle.applyEngineForce(keyup ? 0 : engineForce/3, 2);
      vehicle.applyEngineForce(keyup ? 0 : engineForce/3, 3);
      break;

    case 68: // right
      vehicle.setSteeringValue(keyup ? 0 : -maxSteerVal, 2);
      vehicle.setSteeringValue(keyup ? 0 : -maxSteerVal, 3);
      break;

    case 65: // left
      vehicle.setSteeringValue(keyup ? 0 : maxSteerVal, 2);
      vehicle.setSteeringValue(keyup ? 0 : maxSteerVal, 3);
      break;
  }
}

window.addEventListener('keydown', navigate)
window.addEventListener('keyup', navigate)

render();