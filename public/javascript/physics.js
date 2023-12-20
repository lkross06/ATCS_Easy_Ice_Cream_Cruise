import { Track } from "./track.js"
import {domainName} from "../globalVars.js"

// TODO: error in console about websocket in single player.
// doesnt have a negative effect, so lo prior. 
let ws = new WebSocket("ws://"+domainName+":8008")

var isMultiplayer = true //are we playing a multiplayer game?
if (sessionStorage.getItem("code") === "null") {
  isMultiplayer = false
}

var container = document.querySelector('body'),
    w = container.clientWidth,
    h = container.clientHeight,
    scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderConfig = {antialias: true, alpha: true},
renderer = new THREE.WebGLRenderer(renderConfig);
const cameraOffset = new THREE.Vector3(0, 4, -10);

// car physics body
var chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
// did u know F1 cars are only 100 kg
var chassisBody = new CANNON.Body({mass: 150, material: groundMaterial});

chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 2, 0);
chassisBody.angularVelocity.set(0, 0, 0); // initial velocity

// car visual body
let chassisColor = 0xB30E16
let wheelColor = 0x43464B
var cargeometry = new THREE.BoxGeometry(2, 0.75, 4); // double chasis shape
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

// var geometry = new THREE.PlaneGeometry(10, 10, 10);
// var material = new THREE.MeshBasicMaterial({color: 0x808080, side: THREE.DoubleSide});
// var plane = new THREE.Mesh(geometry, material);
// plane.rotation.x = Math.PI/2;
// scene.add(plane);

var sunlight = new THREE.DirectionalLight(0xffffff, 1.0);
sunlight.position.set(-10, 10, 0);
scene.add(sunlight)

/**
* Physics
**/

var world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.defaultContactMaterial.friction = 0.01;
world.gravity.set(0, -18, 0);

var track
var checkpoints

//get the number in the url-encoded data
const params = new URLSearchParams(window.location.search);
var trackValue = params.get('track')
//if the parameter is invalid or doesn't exist, send to
trackValue = (!isNaN(parseInt(trackValue)))? parseInt(trackValue) : 0

loadTrack(trackValue)

function loadTrack(num){
  //where the track is loaded
  track = new Track("Track " + String(num), 1, "../../res/tracks/track"+String(num)+".txt")
  track.build(scene, world)
  checkpoints = track.getCheckpoints() //list of all checkpoints in the order that the player will see them. start with staring line
}  

document.getElementById("track-name").innerText = track.getName()
var last = 0
var last_reset = 0


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
  rollInfluence: 0,
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
  var geometry = new THREE.CylinderGeometry( wheel.radius, wheel.radius, 0.4, 40);
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
// var q = plane.quaternion;

// var planeBody = new CANNON.Body({
//   mass: 0, // mass = 0 makes the body static
//   material: groundMaterial,
//   shape: new CANNON.Plane(),
//   quaternion: new CANNON.Quaternion(-q._x, q._y, q._z, q._w)
// });
// world.add(planeBody)


let skidArr = []

function addSkidMarks(vehicle) {
  const skidPositions = getWheelPositions(vehicle); 
  skidPositions.forEach(position => {
      createSkidMarkAtPosition(position);
  });
}

function createSkidMarkAtPosition(position) {
  const skidGeometry = new THREE.PlaneGeometry(0.5, 0.5);
  const skidMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const skidMesh = new THREE.Mesh(skidGeometry, skidMaterial);

  // Adjust position and rotation based on the vehicle's orientation and wheel position
  skidMesh.position.copy(position);
  skidMesh.position.y -= 0.45
  skidMesh.rotation.x = -Math.PI / 2; // Rotate to lay flat on the ground

  scene.add(skidMesh);
  skidArr.push(skidMesh)
}

function getWheelPositions(vehicle) {
  let wheelPositions = [];
  for (let wheel of vehicle.wheelInfos) {
      // Assuming each wheel has a worldTransform property
      let wheelPosition = new THREE.Vector3();
      wheelPosition.copy(wheel.worldTransform.position);
      wheelPositions.push(wheelPosition);
  }
  return wheelPositions;
}

function checkSkid(){
  let speed = Math.abs(vehicle.currentVehicleSpeedKmHour)
  if (vehicle.sliding) return true

  if ((speed > 30 && keys_pressed[32]) || (speed > 120 && Math.abs(vehicle.wheelInfos[2].steering) > getMaxSteerVal(speed) * 0.75)){
    for (let piece of track.pieces){
      let result = [];
      let a = []
      let b = []
      for (let i of wheelBodies){
        a.push(i)
        b.push(piece.body)
      }
      world.narrowphase.getContacts(a, b, world, result, [], [], []);
      var overlaps = result.length > 0;
      if (overlaps){
        return true
      } 
    }
  }
  return false;
}

function delSkid() {
  if (skidArr.length > 1000) {
      let oldSkidMark = skidArr.shift();
      scene.remove(oldSkidMark);
  }
}

function updatePhysics() {
  world.step(1/60);
  // update the chassis position
  box.position.copy(chassisBody.position);
  box.quaternion.copy(chassisBody.quaternion);
  if (track.getFinish() == null){
    navigate()
    updateCheckpoints()
    checkFinish()
  }
  if (checkSkid()) {
    addSkidMarks(vehicle);
    delSkid()
  }
  //if "r" is pressed or car is below the map or too high above the map
  if (keys_pressed[82] || chassisBody.position.y < -20 || chassisBody.position.y > 400){ 
    reset()
  }
}
// opponents: a json o all the opponents. 
/*
var cargeometry = new THREE.BoxGeometry(2, 0.9, 4); // double chasis shape
var material = new THREE.MeshBasicMaterial({color: LETSPUTLIKEBLUEHERE, side: THREE.DoubleSide});
var box = new THREE.Mesh(cargeometry, material);
looks as thus:
{
  finn: {
    3dmodel: 3dmodel
    x: x
    y: y
    z: z
  }
}
car.position = (x, y, z)
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
// wheel.radius = .5
*/
let opponents = {

}
function setOpponents(opp, xpos, ypos, zpos) {
  // TODO: hardcoding :(
  // also TODO: no wheels rip
  let oppGeo = new THREE.BoxGeometry(2, 0.9, 4)
  let oppMat = new THREE.MeshBasicMaterial({color: chassisColor, side: THREE.DoubleSide})
  let oppBox = new THREE.Mesh(oppGeo, oppMat)
  var geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32)
  var material = new THREE.MeshPhongMaterial({
    color: wheelColor,
    emissive: wheelColor,
    side: THREE.DoubleSide,
    flatShading: true,
  })
  var cylinder1 = new THREE.Mesh(geometry, material)
  var cylinder2 = new THREE.Mesh(geometry, material)
  var cylinder3 = new THREE.Mesh(geometry, material)
  var cylinder4 = new THREE.Mesh(geometry, material)

  cylinder1.rotation.z = Math.PI / 2;
  cylinder2.rotation.z = Math.PI / 2;
  cylinder3.rotation.z = Math.PI / 2;
  cylinder4.rotation.z = Math.PI / 2;

  opponents[opp] = {
    car: oppBox,
    // ok this is dumb but idk how else to go about adding wheels w/o CANNOn
    frontRight: cylinder1,
    frontLeft: cylinder2,
    backRight: cylinder3,
    backLeft: cylinder4
  }
  // TODO: duplicated code in here and renderOpp()
  // also hardcoding if we change chassis body dimensions. 
  opponents[opp].car.position.x = xpos
  opponents[opp].car.position.y = ypos
  opponents[opp].car.position.z = zpos
  // front Right position wheel
  opponents[opp].frontRight.position.x = xpos + 1.2
  opponents[opp].frontRight.position.y = ypos - .2
  opponents[opp].frontRight.position.z = zpos + 1.3
  // front Left position wheel
  opponents[opp].frontLeft.position.x = xpos - 1.2
  opponents[opp].frontLeft.position.y = ypos - .2
  opponents[opp].frontLeft.position.z = zpos + 1.3
  // back Right position wheel
  opponents[opp].backRight.position.x = xpos + 1.2
  opponents[opp].backRight.position.y = ypos - .2
  opponents[opp].backRight.position.z = zpos - 1.3
  // back Left position wheel
  opponents[opp].backLeft.position.x = xpos - 1.2
  opponents[opp].backLeft.position.y = ypos - .2
  opponents[opp].backLeft.position.z = zpos - 1.3
}
function renderOpp(opp, xpos, ypos, zpos) {
  opponents[opp].car.position.x = xpos
  opponents[opp].car.position.y = ypos
  opponents[opp].car.position.z = zpos
  // front Right position wheel
  opponents[opp].frontRight.position.x = xpos + 1.2
  opponents[opp].frontRight.position.y = ypos - .2
  opponents[opp].frontRight.position.z = zpos + 1.3
  // front Left position wheel
  opponents[opp].frontLeft.position.x = xpos - 1.2
  opponents[opp].frontLeft.position.y = ypos - .2
  opponents[opp].frontLeft.position.z = zpos + 1.3
  // back Right position wheel
  opponents[opp].backRight.position.x = xpos + 1.2
  opponents[opp].backRight.position.y = ypos - .2
  opponents[opp].backRight.position.z = zpos - 1.3
  // back Left position wheel
  opponents[opp].backLeft.position.x = xpos - 1.2
  opponents[opp].backLeft.position.y = ypos - .2
  opponents[opp].backLeft.position.z = zpos - 1.3
}

function reset(){
  for (let i = 0; i <= skidArr.length; i++){
    let oldSkidMark1 = skidArr.shift();
    scene.remove(oldSkidMark1);
  }
  let ms_elapsed = Date.now() - last_reset
  if (ms_elapsed > 500){

    //bring car back to start, make it not move
    chassisBody.position.set(0, 2, 0);
    vehicle.chassisBody.quaternion.set(0, 0, 0, 1)
    vehicle.chassisBody.velocity.set(0, 0, 0);

    vehicle.applyEngineForce(0, 0)
    vehicle.applyEngineForce(0, 1)
    vehicle.applyEngineForce(0, 2)
    vehicle.applyEngineForce(0, 3)

    vehicle.setBrake(10, 0)
    vehicle.setBrake(10, 1)
    vehicle.setBrake(10, 2)
    vehicle.setBrake(10, 3)

    //reset track + time
    track.curr_lap = 1
    track.start = Date.now()
    track.finish = null
    last = track.getStart()
    last_reset = Date.now()

    //reset checkpoints
    for (let cp of checkpoints){
      cp.setChecked(false)
    }
  }
}

function getRefreshRate(timestamp){ //return this client's refresh rate
  return Math.round(timestamp / total_renders)
}

var total_renders = 0 //total number of times render() was run

function render(timestamp) {
  total_renders += 1
  document.getElementById("refresh-rate").innerText = String(getRefreshRate(timestamp)) + "ms"
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
  // here should go the ws stuff i belive
  // this packet is this client's data. x, y, z, quaterion(?) etc.
  // make sure the user is in a multiplayer game
  if (sessionStorage.getItem("code") !== "null" && ws.readyState === WebSocket.OPEN) {
    let packet = {
      method: "render",
      username: sessionStorage.getItem("username"),
      x: chassisBody.position.x,
      y: chassisBody.position.y,
      z: chassisBody.position.z,
      code: sessionStorage.getItem("code")
      // add in here the timestamp/refreshrate probs
    } 
    ws.send(JSON.stringify(packet))
    ws.onmessage = message => {
      let msg = JSON.parse(message.data)
      if (msg.method === "render") {
        if (msg.code === sessionStorage.getItem("code") && msg.username !== sessionStorage.getItem("username")) {
          // the message is from a user in our game
          if (!opponents.hasOwnProperty(msg.username)) {
            setOpponents(msg.username, msg.x, msg.y, msg.z)
          } else {
            renderOpp(msg.username, msg.x, msg.y, msg.z)
          }
          scene.add(opponents[msg.username].car)
          scene.add(opponents[msg.username].frontRight)
          scene.add(opponents[msg.username].frontLeft)
          scene.add(opponents[msg.username].backRight)
          scene.add(opponents[msg.username].backLeft)

          //TODO: also send chassisBody quaternion and apply it to chassisBody in "renderOpp()"
          //or somehow make rotation update bc right now its a bunch of blocks sliding around
          //if you can also do this for wheels that would be great!

        }
      } else if (msg.method === "finish-multiplayer"){ 
        //the only reason im redrawing the entire leaderboard after someone finishes
        //is in-case a user joins late and beats several times
        if (msg.code === sessionStorage.getItem("code")){
          
          console.log(msg.times)
          console.log(msg.positions)

          //destroy leaderboard children
          let leaderboard = document.getElementById("multi-track-leaderboard")
          while (leaderboard.hasChildNodes()){
            leaderboard.removeChild(leaderboard.firstChild)
          }

          let len = Object.keys(msg.positions).length

          for (let i = 1; i <= len; i ++){ //get the players in the order they finished
            let player = msg.positions[String(i)]
            let time = msg.times[player]

            addPlayerToLobbyLeaderboard(player, time)
          }
        }
      }
    }
  }
  renderer.render(scene, camera);
  

  if (countdown >= 0 && Date.now() - last_countdown_update >= 1000){
    countdown -= 1
    last_countdown_update = Date.now()
  }

  updatePhysics()
  updateUI()

  requestAnimationFrame(render);
}

function getTimeElapsed(){
  function getMinutes(ms){
    let mins = Math.floor((Number(ms) / 1000 / 60) % 60)
    return String(mins)
  }
  function getSeconds(ms){
    //round to 2 decimal points
    let secs = parseFloat((Number(ms) / 1000) % 60).toFixed(2)

    if (secs < 10){
      secs = "0" + String(secs)
    }
    return String(secs)
  }

  //time
  let total_elapsed
  if (track.finish != null){
    total_elapsed = track.getFinish() - track.getStart()
  } else {
    total_elapsed = Date.now() - track.getStart()
  }

  return String(getMinutes(total_elapsed)) + ":" + getSeconds(total_elapsed)
}

function updateUI(){

  let countdown_num = countdown
  if (countdown == 1){
    track.setStart(Date.now())
  } else if (countdown == 0){
    countdown_num = ""
  } else if (countdown == -1){
    document.getElementById("countdown").style.display = "none"
  }
  document.getElementById("countdown").innerText = String(countdown_num)
  
  let ms_elapsed = Date.now() - last

  //time elapsed
  if (ms_elapsed >= 50 && countdown <= 0){ //update only after 50ms (so it doesnt look crazy)
    //time
    document.getElementById("time").innerText = getTimeElapsed()
    last = Date.now()

    //speed
    let new_speed = vehicle.currentVehicleSpeedKmHour * 0.621371
    if (new_speed > -1.7 && new_speed < 1.7) new_speed = 0 
    document.getElementById("speed-number").innerText = 
    Math.floor(Math.abs(new_speed)).toString() //1km = 0.621371mi
  }

  //we can always update this
  let forward = parseInt(sessionStorage.getItem("forwardKey"))
  let backward = parseInt(sessionStorage.getItem("backwardKey"))
  let left = parseInt(sessionStorage.getItem("leftKey"))
  let right = parseInt(sessionStorage.getItem("rightKey"))

  let keys = [forward, backward, left, right]
  let arrow_counter = 0

  for (let i = 0; i < keys.length; i++){
    let keycode = keys[i]
    if (keycode >= 37 && keycode <= 40) {
      arrow_counter += 1
      let arrows = ["←", "↑", "→", "↓"]
      keys[i] = arrows[keycode - 37]
    } else {
      keys[i] = String.fromCharCode(keycode)
    }
  }
  
  let newtext
  if (arrow_counter == 4) {
    newtext = "ARROWS"
  } else {
    newtext = (keys[0] + keys[2] + keys[1] + keys[3]).toUpperCase()
  }
  //see if we need to send info to server
  if (newtext !== document.getElementById("movement-binds").innerText){
    //we have new keybinds! lets tell the server
    if (ws.readyState === WebSocket.OPEN){ //rewrite user_data with new pb!
      let json_ids = ["forward", "backward", "left", "right"]

      for (let id of json_ids){

        let new_bind = parseInt(sessionStorage.getItem(id + "Key"))

        let packet = {
          method: "user_write",
          data: new_bind,
          username: sessionStorage.getItem("username"),
          info1: "keybinds",
          info2: id
        }
  
        ws.send(JSON.stringify(packet))
      }
    }
  }


  document.getElementById("movement-binds").innerText = newtext


  //track name is done during initialization to save time

  document.getElementById("laps").innerText = "Lap " + track.sendLaps()
}

var keys_pressed = {} //map of all keys pressed, formatted "keycode:boolean"
var steeringValue = 0


// Function to handle key press events
function handleKeyPress(e) {
    //only update if the track is still being played
    if ((e.type !== 'keydown' && e.type !== 'keyup') || track.getFinish() != null) return;

    keys_pressed[e.keyCode] = e.type === 'keydown';
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
    if (overlaps) cp.setChecked(overlaps)
  }
}

function addPlayerToLobbyLeaderboard(user, time){
  let div_container = document.createElement("div")

  let user_span = document.createElement("span")
  user_span.setAttribute("class", "multi-track-leaderboard-user username")
  user_span.innerText = user + " "
  div_container.append(user_span)

  let time_span = document.createElement("span")
  time_span.setAttribute("class", "multi-track-leaderboard-time")
  time_span.innerText = time
  div_container.append(time_span)

  document.getElementById("multi-track-leaderboard").append(div_container)
}

function endGame(){ //run this function when the game ends for this client
  track.finish = Date.now()

  //stop vehicle from accelerating and disable key presses
  for (let key in keys_pressed){
    keys_pressed[key] = false;
  }

  vehicle.applyEngineForce(0, 0)
  vehicle.applyEngineForce(0, 1)
  vehicle.applyEngineForce(0, 2)
  vehicle.applyEngineForce(0, 3)

  document.getElementById('modal').style.display = "block"
  document.getElementById("esc-menu").style.display = "none"
  document.getElementById("settings-menu").style.display = "none"
  
  //check for new pb
  let ss_path = "track" + String(trackValue) + "pb"
  let stored_pb = sessionStorage.getItem(ss_path)
  let new_pb = getTimeElapsed()

  let stored_min = parseInt(stored_pb.slice(0,1))
  let stored_sec = parseFloat(stored_pb.slice(2))
  let new_min = parseInt(new_pb.slice(0,1))
  let new_sec = parseFloat(new_pb.slice(2))

  if (new_min < stored_min || (new_min == stored_min && new_sec < stored_sec) || stored_pb.length != 7){
    //we have a new personal best ladies and gentlemen!

    document.getElementById("new_pb").style.display = "block"
    sessionStorage.setItem(ss_path, new_pb)

    if (ws.readyState === WebSocket.OPEN){ //rewrite user_data with new pb!
      let packet = {
        method: "user_write",
        data: new_pb,
        username: sessionStorage.getItem("username"),
        info1: "pbs",
        info2: "track" + String(trackValue)
      } 
      ws.send(JSON.stringify(packet))
    }
  }

  if (!isMultiplayer){
    //show the singleplayer modal
    document.getElementById("single-track-finish").style.display = "flex"
    document.getElementById("multi-track-finish").style.display = "none"

    document.getElementById("track-finish-time").innerText = getTimeElapsed()
    document.getElementById("track-finish-track-name").innerText = track.name
  } else {
    document.getElementById("multi-track-finish").style.display = "flex"
    document.getElementById("single-track-finish").style.display = "none"

    if (ws.readyState === WebSocket.OPEN){
      let packet = {
        method: "finish-multiplayer",
        code : sessionStorage.getItem("code"),
        username : sessionStorage.getItem("username"),
        time : getTimeElapsed()
      }
      ws.send(JSON.stringify(packet))
    }
  }
}

function checkFinish(){
  if (track.pieces.length > 0){ //only check if there is a track and its been loaded
    let result = [];
    let a = []
    let b = []
    for (let i of wheelBodies){
      a.push(i)
      b.push(track.getFinishBody())
    }
    world.narrowphase.getContacts(a, b, world, result, [], [], []);
    var overlaps = result.length > 0;
    if (overlaps && track.finish == null) { //check to see if finish block and wheels touch
      for (let cp of checkpoints){ //check to see if all checkpoints have been checked
        if (!cp.getChecked()){
          return false
        }
      }
      if (track.curr_lap > track.laps - 1){
        endGame() //game over yay!!!
      } else {
        track.addLap()
        for (let cp of checkpoints){ //uncheck all checkpoints
          cp.setChecked(false)
        }
      }
    }
  }
  

  
}

function getMaxSteerVal(speed){
  return (Math.PI / (((1/5) * Math.abs(speed)) + 16))
}

function navigate() {
    let speed = vehicle.currentVehicleSpeedKmHour

    let forward_key = parseInt(sessionStorage.getItem("forwardKey"))
    let backward_key = parseInt(sessionStorage.getItem("backwardKey"))
    let left_key = parseInt(sessionStorage.getItem("leftKey"))
    let right_key = parseInt(sessionStorage.getItem("rightKey"))


    // let go_forward = keys_pressed[forward_key] || keys_pressed[38]
    // let go_backward = keys_pressed[backward_key] || keys_pressed[40]
    // let turn_left = keys_pressed[left_key] || keys_pressed[37]
    // let turn_right = keys_pressed[right_key] || keys_pressed[39]
    let go_forward = keys_pressed[forward_key]
    let go_backward = keys_pressed[backward_key]
    let turn_left = keys_pressed[left_key]
    let turn_right = keys_pressed[right_key]

    let use_brake = keys_pressed[32]

    if (countdown <= 0){

      //y = -4x + 1200 but absolute value
      //at speed = 0, eF = 600
      //at speed = 150 or -150, eF = 0
      let engineForce = (-4 * Math.abs(speed)) + 1200
      if (engineForce > 1200) engineForce = 1200 //cap
      if (engineForce < 0) engineForce = 0

      vehicle.setBrake(0, 0);
      vehicle.setBrake(0, 1);
      vehicle.setBrake(0, 2);
      vehicle.setBrake(0, 3); 

      if (use_brake){ //brake
        //brake has priority over movement
        let brakePower = engineForce / 80
        vehicle.setBrake(brakePower, 0);
        vehicle.setBrake(brakePower, 1);
        vehicle.setBrake(brakePower, 2);
        vehicle.setBrake(brakePower, 3);

        vehicle.applyEngineForce(0, 0)
        vehicle.applyEngineForce(0, 1)
        vehicle.applyEngineForce(0, 2)
        vehicle.applyEngineForce(0, 3)

      } else if (go_forward && !go_backward) { //forward
          vehicle.applyEngineForce(-engineForce / 2, 0);
          vehicle.applyEngineForce(-engineForce / 2, 1);
          vehicle.applyEngineForce(-engineForce / 2, 2);
          vehicle.applyEngineForce(-engineForce / 2, 3);
      } else if (!go_forward && go_backward) { //backward
          vehicle.applyEngineForce(engineForce / 4, 0);
          vehicle.applyEngineForce(engineForce / 4, 1);
          vehicle.applyEngineForce(engineForce / 4, 2);
          vehicle.applyEngineForce(engineForce / 4, 3);
      } else {
        if (speed > 0){
          vehicle.applyEngineForce(-engineForce / 64, 0);
          vehicle.applyEngineForce(-engineForce / 64, 1);
          vehicle.applyEngineForce(-engineForce / 64, 2);
          vehicle.applyEngineForce(-engineForce / 64, 3);
        } else {
          vehicle.applyEngineForce(engineForce / 128, 0);
          vehicle.applyEngineForce(engineForce / 128, 1);
          vehicle.applyEngineForce(engineForce / 128, 2);
          vehicle.applyEngineForce(engineForce / 128, 3);
        }
          
          let brakePower = Math.abs(speed / 50)
          vehicle.setBrake(brakePower, 0);
          vehicle.setBrake(brakePower, 1);
          vehicle.setBrake(brakePower, 2);
          vehicle.setBrake(brakePower, 3);
      }
      
      //between pi/16 and pi/64 when speed is between (0, 250)
      let maxSteerVal = getMaxSteerVal(speed)

      //functional based increment between 0.006 and 0.0001 when the speed is between (0, 250)
      let steeringIncrement = (-(1/55555) * Math.abs(speed)) + 0.006
      if (steeringIncrement < 0.0001) steeringIncrement = 0.0001

      if (turn_left && !turn_right){ //left
          steeringValue += steeringIncrement
      } else if (turn_right && !turn_left){ //right
          steeringValue -= steeringIncrement
      } else {
          steeringValue -= steeringValue / 3
      }

      if (steeringValue > maxSteerVal) steeringValue = maxSteerVal
      if (steeringValue < -maxSteerVal) steeringValue = -maxSteerVal

      vehicle.setSteeringValue(steeringValue, 2);
      vehicle.setSteeringValue(steeringValue, 3);
    }
}
window.addEventListener('keydown', handleKeyPress)
window.addEventListener('keyup', handleKeyPress)

//run the 3-2-1 sequence

//TODO: wait until everyone loads
var countdown = 3
var last_countdown_update = Date.now()

render()
