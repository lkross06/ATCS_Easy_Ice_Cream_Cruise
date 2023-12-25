import { Track } from "./track.js"

/**
 * handles our physics calculations and other game mechanics
 */
export class Logic {
    /**
     * creates a new game logic
     * @param {THREE.Scene} scene the scene to add the wheels to
     */
    constructor(scene){

        //multiplayer stuff
        this.playerRefreshRate = 0 //default value
        this.idealRefreshRate = 12 //used for scaling

        this.isMultiplayer = true //are we playing a multiplayer game?
        if (sessionStorage.getItem("code") === null) {
          this.isMultiplayer = false
        }

        //key handler
        this.keys_pressed = {} //map of all keys pressed, formatted "keycode:boolean"
        
        //materials
        this.groundMaterial = new CANNON.Material('groundMaterial');
        this.wheelMaterial = new CANNON.Material('wheelMaterial');


        //100kg car chassis body
        let chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        this.chassisBody = new CANNON.Body({mass: 100, material: this.groundMaterial});
        this.chassisBody.addShape(chassisShape);
        this.chassisBody.position.set(0, 2, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0); // initial velocity

        this.steeringValue = 0

        //the actual physics simulation world
        this.world = new CANNON.World();
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.defaultContactMaterial.friction = 0.01;
        this.world.gravity.set(0, -18, 0);

        //time counters
        this.last_reset = 0 //last time reset function was called
        this.countdown = 3
        this.last_countdown_update = Date.now()
        this.last_timestamp = 0 //when last render was
        this.slowest_refresh_rate = 0 //for multiplayer only
        this.last_physics_update = 0 //timestamp for last physics update

        //physics interaction between vehicle wheels + ground
        let wheelGroundContactMaterial = new CANNON.ContactMaterial(this.wheelMaterial, this.groundMaterial, {
            friction: 1,
            restitution: 0.05,
            contactEquationStiffness: 1000
        });
        this.world.addContactMaterial(wheelGroundContactMaterial);

        // parent vehicle object
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexRightAxis: 0, // x
            indexUpAxis: 1, // y
            indexForwardAxis: 2, // z
        });

        // wheel options
        let options = {
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
            useCustomSlidingRotationalSpeed: true
        };
        
        //set the position of each wheel relative to the chassis body
        let axlewidth = 1.2;
        options.chassisConnectionPointLocal.set(axlewidth, 0, -1);
        this.vehicle.addWheel(options);
        
        options.chassisConnectionPointLocal.set(-axlewidth, 0, -1);
        this.vehicle.addWheel(options);
        
        options.chassisConnectionPointLocal.set(axlewidth, 0, 1);
        this.vehicle.addWheel(options);
        
        options.chassisConnectionPointLocal.set(-axlewidth, 0, 1);
        this.vehicle.addWheel(options);
        
        //add our vehicle to the physics world
        this.vehicle.addToWorld(this.world);

        this.wheelBodies = [] //physics bodies for our wheels
        this.wheelVisuals = [] //graphical bodies for our wheels

        //create each wheel body/mesh
        this.vehicle.wheelInfos.forEach((wheel) => this.createWheel(wheel));

        for (let mesh in this.wheelVisuals){
            scene.add(mesh)
        }

        // update the wheels to match the physics
        this.world.addEventListener('postStep', function() {
            for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
            this.vehicle.updateWheelTransform(i);
            var t = this.vehicle.wheelInfos[i].worldTransform;
            // update wheel physics
            this.wheelBodies[i].position.copy(t.position);
            this.wheelBodies[i].quaternion.copy(t.quaternion);
            // update wheel visuals
            this.wheelVisuals[i].position.copy(t.position);
            this.wheelVisuals[i].quaternion.copy(t.quaternion);
            }
        });

        window.addEventListener('keydown', this.handleKeyPress)
        window.addEventListener('keyup', this.handleKeyPress)
    }

    /**
     * creates a new wheel mesh + physics body
     * @param {*} wheel the wheel to create
     */
    createWheel(wheel){
        let wheel_color = 0x43464B
        let wheelMaterial = new CANNON.Material('wheelMaterial');
        var shape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);
        var body = new CANNON.Body({mass: 11.5, material: wheelMaterial});
        var q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        body.addShape(shape, new CANNON.Vec3(), q);
        this.wheelBodies.push(body);
        // wheel visual body
        var geometry = new THREE.CylinderGeometry(wheel.radius, wheel.radius, 0.4, 40);
        var material = new THREE.MeshPhongMaterial({
        color: wheel_color,
        emissive: wheel_color,
        side: THREE.DoubleSide,
        flatShading: true,
        });
        var cylinder = new THREE.Mesh(geometry, material);
        cylinder.geometry.rotateZ(Math.PI/2);
        this.wheelVisuals.push(cylinder);
    }

    /**
     * handles gui render update and sees if it should update physics
     * @param {Track} track the current track that the player is on
     */
    update(track){
        //countdown updates
        if (countdown >= 0 && Date.now() - last_countdown_update >= 1000){
            countdown -= 1
            last_countdown_update = Date.now()
        }

        //see if we should update physics
        if (this.isMultiplayer){
            if (slowest_refresh_rate <= timestamp - last_physics_update){
                this.updatePhysics(timestamp)
                renderer.render(scene, camera);
                last_physics_update = timestamp
            }
        } else {
            this.updatePhysics(track)
            
        }
    }

    /**
     * Checks all interactions between physics bodies in our world and simulates 1/60th of a second
     * @param {Track} track the current track that the player is on
     * 
     */
    updatePhysics(track) {
        this.world.step(1/60);
    
        if (track.getFinish() == null){
            this.navigate()
            this.updateCheckpoints(track)
            this.checkFinish(track)
        }
        
        //the car "dies" and "respawns"
        //if "r" is pressed then reset the entire track
        if (this.keys_pressed[82] || this.chassisBody.position.y < -20 || this.chassisBody.position.y > 400){ 
            this.reset(track)
        }
    }

    /**
     * sets the car to no velocity, spawns at last checkpoint or beginning
     * @param {Track} track the current track that the player is on
     */
    reset(track){
        let ms_elapsed = Date.now() - this.last_reset
        
        if (ms_elapsed > 500){ //if we reset more than 0.5s ago
    
            //make car not move
            this.vehicle.chassisBody.velocity.set(0, 0, 0);
        
            this.vehicle.applyEngineForce(0, 0)
            this.vehicle.applyEngineForce(0, 1)
            this.vehicle.applyEngineForce(0, 2)
            this.vehicle.applyEngineForce(0, 3)
        
            this.vehicle.setBrake(10, 0)
            this.vehicle.setBrake(10, 1)
            this.vehicle.setBrake(10, 2)
            this.vehicle.setBrake(10, 3)
        
            this.last_reset = Date.now()    
        
            //spawn them at the last checkpoint
            let index = 0
        
            //NOTE: even if they check the checkpoints out of order, we are
            //intentionally only checking from the beginning onwards to
            //promote actually following the track.
            let checkpoints = track.getCheckpoints()
        
            if (!checkpoints[0].getChecked()){ //they haven't checked any cps, just go to beginning
                this.vehicle.chassisBody.position.set(0, 2, 0)
                this.vehicle.chassisBody.quaternion.set(0, 0, 0, 1)
            } else {
                while (index < checkpoints.length && checkpoints[index].getChecked()){
                    index++
                }
            
                let curr_cp = checkpoints[index - 1] //go one back to the last consecutively-checked cp
                
                this.vehicle.chassisBody.position.set(curr_cp.x, curr_cp.y + 2, curr_cp.z)
            
                //also set the rotation
                if (curr_cp.direction == "N"){
                    this.vehicle.chassisBody.quaternion.set(0, 0, 0, 1)
                } else if (curr_cp.direction == "S") {
                    this.vehicle.chassisBody.quaternion.set(0, 1, 0, 0)
                } else if (curr_cp.direction == "E"){
                    this.vehicle.chassisBody.quaternion.set(0, -1, 0, 1)
                } else if (curr_cp.direction == "W"){
                    this.vehicle.chassisBody.quaternion.set(0, 1, 0, 1)
                }
                
            }
        }
    }

    /**
     * checks to see which checkpoints contact this client's vehicle wheels
     * @param {Track} track the current track that the player is on
     */
    updateCheckpoints(track){
        for (let cp of track.getCheckpoints()){
        let result = [];
        let a = []
        let b = []
        for (let i of this.wheelBodies){
            a.push(i)
            b.push(cp.body)
        }
        world.narrowphase.getContacts(a, b, world, result, [], [], []);
        var overlaps = result.length > 0;
        if (overlaps) cp.setChecked(overlaps)
        }
    }

    /**
     * checks to see if player has satisfied all requirements to beat level
     * @param {Track} track the current track that the player is on
     * @returns true if player has beat level, false otherwise
     */
    checkFinish(track){
        if (track.pieces.length > 0){ //only check if there is a track and its been loaded
            let result = [];
            let a = []
            let b = []
            for (let i of this.wheelBodies){
                a.push(i)
                b.push(track.getFinishBody())
            }
            this.world.narrowphase.getContacts(a, b, world, result, [], [], []);
            var overlaps = result.length > 0;
            if (overlaps && track.getFinish() == null) { //check to see if finish block and wheels touch
                for (let cp of track.getCheckpoints()){ //check to see if all checkpoints have been checked
                    if (!cp.getChecked()){
                        return false
                    }
                }
                if (track.curr_lap > track.laps - 1){
                    return true
                } else {
                    track.addLap()
                    for (let cp of track.getCheckpoints()){ //uncheck all checkpoints
                        cp.setChecked(false)
                    }
                }
            }
        
        }
        return false
    }

    
    /**
     * handles when gui says the game is over
     * @param {*} timeElapsed the time that the player took to beat the course, in the format "mm:ss.ss"
     * @param {*} trackValue the track number (1-8)
     * @returns true if the player set a new personal best, false otherwise
     */
    endGame(timeElapsed, trackValue){ //run this function when the game ends for this client
        
        //stop vehicle from accelerating and disable key presses
        for (let key in this.keys_pressed){
            this.keys_pressed[key] = false;
        }
    
        this.vehicle.applyEngineForce(0, 0)
        this.vehicle.applyEngineForce(0, 1)
        this.vehicle.applyEngineForce(0, 2)
        this.vehicle.applyEngineForce(0, 3)
    
        document.getElementById('modal').style.display = "block"
        document.getElementById("esc-menu").style.display = "none"
        document.getElementById("settings-menu").style.display = "none"
        
        //check for new pb
        let ss_path = "track" + String(trackValue) + "pb"
        let stored_pb = sessionStorage.getItem(ss_path)
        let new_pb = timeElapsed
    
        let stored_min = parseInt(stored_pb.slice(0,1))
        let stored_sec = parseFloat(stored_pb.slice(2))
        let new_min = parseInt(new_pb.slice(0,1))
        let new_sec = parseFloat(new_pb.slice(2))
    
        if (new_min < stored_min || (new_min == stored_min && new_sec < stored_sec) || stored_pb.length != 7){
            //we have a new personal best ladies and gentlemen!
        
            document.getElementById("new_pb").style.display = "block"
            sessionStorage.setItem(ss_path, new_pb)
            confetti()
        
            return true
        }
    
        return false
    }
  

    /**
     * adds a player to the multiplayer lobby leaderboard after they finish the track
     * (broadcasted from websocket)
     * @param {string} user username of new player
     * @param {string} time player's final time
     */
    addPlayerToLobbyLeaderboard(user, time){
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

    /**
     * creates and renders a confetti animation!
     */
    confetti() {
        const confettiCount = 1000;
        const confetti = [];
    
        const colors = ["blue", "red", "purple", "pink", "orange", "yellow", "green"]
    
        for (let i = 0; i < confettiCount; i++) {
        const el = document.createElement('div');
        el.classList.add('confetti');
        el.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
        el.style.left = `${Math.random() * 100}vw`;
        el.style.animation = `confetti-animation ${Math.random() * 3 + 2}s linear forwards`;
        document.body.appendChild(el);
        confetti.push(el);
        }
    
        // Remove confetti after animation ends
        setTimeout(() => {
        confetti.forEach(el => document.body.removeChild(el));
        }, 5000); // Adjust timeout to match longest animation duration
    }

    /**
     * gets the maximum steering allowed given the vehicle's current speed
     * @param {number} speed vehicle's current speed
     * @returns maximum steering allowed
     */
    getMaxSteerVal(speed){
        return (Math.PI / (((1/5) * Math.abs(speed)) + 16))
    }
  
    /**
     * applies user inputs to changes in vehicle (i.e. wheel turns, acceleration/deceleration)
     * (only for movement inputs)
     */
    navigate() {
        // speeding up or slowing down player actions based on a
        //default refresh rate of 12ms (if you refresh faster than 12ms
        // you get slowed down, and if you refresh slower you get sped up)
        let scale = this.idealRefreshRate / this.playerRefreshRate;
    
        let speed = this.vehicle.currentVehicleSpeedKmHour
    
        let forward_key = parseInt(sessionStorage.getItem("forwardKey"))
        let backward_key = parseInt(sessionStorage.getItem("backwardKey"))
        let left_key = parseInt(sessionStorage.getItem("leftKey"))
        let right_key = parseInt(sessionStorage.getItem("rightKey"))
    
        let go_forward = this.keys_pressed[forward_key]
        let go_backward = this.keys_pressed[backward_key]
        let turn_left = this.keys_pressed[left_key]
        let turn_right = this.keys_pressed[right_key]
    
        let use_brake = this.keys_pressed[32]
    
        if (this.countdown <= 0){
    
            //y = -4x + 1200 but absolute value
            //at speed = 0, eF = 600
            //at speed = 150 or -150, eF = 0
            let engineForce = ((-4 * Math.abs(speed)) + 1200) * scale;
            if (engineForce > 1200) engineForce = 1200 //cap
            if (engineForce < 0) engineForce = 0
    
            this.vehicle.setBrake(0, 0);
            this.vehicle.setBrake(0, 1);
            this.vehicle.setBrake(0, 2);
            this.vehicle.setBrake(0, 3); 
    
            if (use_brake){ //brake
                //brake has priority over movement
                let brakePower = engineForce / 80
                this.vehicle.setBrake(brakePower, 0);
                this.vehicle.setBrake(brakePower, 1);
                this.vehicle.setBrake(brakePower, 2);
                this.vehicle.setBrake(brakePower, 3);
        
                this.vehicle.applyEngineForce(0, 0)
                this.vehicle.applyEngineForce(0, 1)
                this.vehicle.applyEngineForce(0, 2)
                this.vehicle.applyEngineForce(0, 3)
    
            } else if (go_forward && !go_backward) { //forward
                this.vehicle.applyEngineForce(-engineForce / 2, 0);
                this.vehicle.applyEngineForce(-engineForce / 2, 1);
                this.vehicle.applyEngineForce(-engineForce / 2, 2);
                this.vehicle.applyEngineForce(-engineForce / 2, 3);
            } else if (!go_forward && go_backward) { //backward
                this.vehicle.applyEngineForce(engineForce / 4, 0);
                this.vehicle.applyEngineForce(engineForce / 4, 1);
                this.vehicle.applyEngineForce(engineForce / 4, 2);
                this.vehicle.applyEngineForce(engineForce / 4, 3);
            } else {
                //instead of applying friction (we couldn't figure it out lol),
                //we just slightly apply an engine force in the opposite direction
                if (speed > 0){
                    this.vehicle.applyEngineForce(-engineForce / 64, 0);
                    this.vehicle.applyEngineForce(-engineForce / 64, 1);
                    this.vehicle.applyEngineForce(-engineForce / 64, 2);
                    this.vehicle.applyEngineForce(-engineForce / 64, 3);
                } else {
                    this.vehicle.applyEngineForce(engineForce / 128, 0);
                    this.vehicle.applyEngineForce(engineForce / 128, 1);
                    this.vehicle.applyEngineForce(engineForce / 128, 2);
                    this.vehicle.applyEngineForce(engineForce / 128, 3);
                }
                
                let brakePower = Math.abs(speed / 50)
                this.vehicle.setBrake(brakePower, 0);
                this.vehicle.setBrake(brakePower, 1);
                this.vehicle.setBrake(brakePower, 2);
                this.vehicle.setBrake(brakePower, 3);
            }
            
            //between pi/16 and pi/64 when speed is between (0, 250)
            let maxSteerVal = this.getMaxSteerVal(speed);
    
            //functional based increment between 0.006 and 0.0001 when the speed is between (0, 250)
            let steeringIncrement = ((-(1/55555) * Math.abs(speed)) + 0.006);
            if (steeringIncrement < 0.0001) steeringIncrement = 0.0001
    
            if (turn_left && !turn_right){ //left
                this.steeringValue += steeringIncrement
            } else if (turn_right && !turn_left){ //right
                this.steeringValue -= steeringIncrement
            } else {
                this.steeringValue -= steeringValue / 3
            }
    
            if (this.steeringValue > maxSteerVal) this.steeringValue = maxSteerVal
            if (this.steeringValue < -maxSteerVal) this.steeringValue = -maxSteerVal
    
            this.vehicle.setSteeringValue(this.steeringValue, 2);
            this.vehicle.setSteeringValue(this.steeringValue, 3);
        }
    }
        
}