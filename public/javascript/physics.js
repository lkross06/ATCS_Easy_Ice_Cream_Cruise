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
var chassisBody = new CANNON.Body({mass: 100});
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 1, 0);
chassisBody.angularVelocity.set(0, 0, 0); // initial velocity
//speed tings
var engineForce = 600
var maxSteerVal = Math.PI/16;

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

var objLoader = new THREE.OBJLoader()
var map = THREE.TextureLoader()
var handMaterial = new THREE.MeshPhongMaterial({map: map});


objLoader.load(
    '../res/track.obj', object => {
        console.log(object)

        object.traverse(node => {
            
            node.material = handMaterial
        })
        object.name = "track"

        object.rotation.y = Math.PI/2

        scene.add(object);
        object.position.set(0, 0, 0);
        
    }, xhr => {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' )
    }, error => {
        console.log(error)
    }
)

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
    color: 0xd0901d,
    emissive: 0xaa0000,
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
}


function render() {
    requestAnimationFrame(render);
    const relativeCameraOffset = new THREE.Vector3(0, 4, -10).applyMatrix4(box.matrixWorld);
    camera.position.copy(relativeCameraOffset);
    camera.lookAt(box.position);
    renderer.render(scene, camera);
    updatePhysics()
}

var keys_pressed = {} //map of all keys pressed, formatted "keycode:boolean"
var steeringValue = 0

function handleKeyPress(e){
  if (e.type != 'keydown' && e.type != 'keyup') return;

  keys_pressed[e.keyCode] = e.type == 'keydown'; //runs for every key to keep track of multiple
}

function navigate() {
  vehicle.setBrake(0, 0);
  vehicle.setBrake(0, 1);
  vehicle.setBrake(0, 2);
  vehicle.setBrake(0, 3);

  console.log(keys_pressed)
  
  let speed = vehicle.currentVehicleSpeedKmHour

  //y = -4x + 600 but absolute value
  //at speed = 0, eF = 600
  //at speed = 150 or -150, eF = 0
  engineForce = (-4 * Math.abs(speed)) + 600

  if (keys_pressed[32]){ //brake
      //brake has priority over movement
      vehicle.setBrake(8, 2)
      vehicle.setBrake(8, 3)
  } else if (keys_pressed[87] && !keys_pressed[83]) { //forward
      console.log("apply forward")
      vehicle.applyEngineForce(-engineForce, 2);
      vehicle.applyEngineForce(-engineForce, 3);
  } else if (!keys_pressed[87] && keys_pressed[83]) { //backward
      console.log("apply backward")
      vehicle.applyEngineForce(engineForce/2, 2);
      vehicle.applyEngineForce(engineForce/2, 3);
  } else {
      vehicle.applyEngineForce(0, 2);
      vehicle.applyEngineForce(0, 3);
  }

  if (keys_pressed[68] && keys_pressed[65]){ //both
      steeringValue = 0
  } else if (keys_pressed[65]){ //left
      steeringValue += maxSteerVal / 8
  } else if (keys_pressed[68]){ //right
      steeringValue -= maxSteerVal / 8
  } else {
      steeringValue += -steeringValue / 2
  }

  if (steeringValue > maxSteerVal) steeringValue = maxSteerVal
  if (steeringValue < -maxSteerVal) steeringValue = -maxSteerVal
  
  console.log(steeringValue)

  vehicle.setSteeringValue(steeringValue, 2);
  vehicle.setSteeringValue(steeringValue, 3);
}

window.addEventListener('keydown', handleKeyPress)
window.addEventListener('keyup', handleKeyPress)

render();