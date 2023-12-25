import { Track } from "./track.js"
import {domainName} from "../globalVars.js"
import { Logic } from "./logic.js"

/**
 * handles drawing and rendering our game, sending/receiving data from game logic
 */
class GUI {
    constructor(){
        //lets handle server communication here and relay messages to logic
        this.ws = new WebSocket("ws://"+domainName+":8008")

        //store it here bc they aren't physics objects
        this.opponents = {}

        //for actually rendering our game onto the webpage
        this.container = document.querySelector('body')
        this.w = this.container.clientWidth
        this.h = this.container.clientHeight
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.renderConfig = {antialias: true, alpha: true}
        this.renderer = new THREE.WebGLRenderer(this.renderConfig)

        this.cameraOffset = new THREE.Vector3(0, 4, -10)

        //making the car mesh
        this.chassisColor = 0x00009d
        this.oppChassisColor = 0xB30E16
        this.wheelColor = 0x43464B
        this.cargeometry = new THREE.BoxGeometry(2, 0.75, 4); // double chasis shape
        let material = new THREE.MeshBasicMaterial({color: this.chassisColor, side: THREE.DoubleSide});
        this.box = new THREE.Mesh(this.cargeometry, material);
        this.scene.add(this.box);

        //render the car
        this.camera.position.copy(this.box.position).add(this.cameraOffset);
        this.camera.lookAt(this.box.position);
        this.scene.add(this.camera);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.w, this.h);
        this.container.appendChild(this.renderer.domElement);

        //update the camera view when the window is resized
        window.addEventListener('resize', function() {
            this.w = this.container.clientWidth;
            this.h = this.container.clientHeight;
            this.camera.aspect = this.w/this.h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.w, this.h);
        })

        //so we can see!!!
        this.sunlight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunlight.position.set(-10, 10, 0);
        this.scene.add(this.sunlight)

        this.skidArr = [] //for our skid marks

        this.track //THE TRACK

        //get the number in the url-encoded data
        let params = new URLSearchParams(window.location.search);
        this.trackValue = params.get('track')
        this.trackValue = (!isNaN(parseInt(this.trackValue)))? parseInt(this.trackValue) : 0
        if (this.trackValue < 1 || this.trackValue > 8){
            //if the parameter is invalid or doesn't exist, send to lobby
            const redirectUrl = "http://" + domainName + ":3000";
            window.location.href = redirectUrl + "/menu"
        }

        this.loadTrack(this.trackValue)

        document.getElementById("track-name").innerText = this.track.getName()

        //time trackers
        this.last = 0 //last time UI was updated

        //make our logic object
        this.logic = new Logic()

        //TODO: put track creation stuff here

        //start rendering
        this.render()
    }

    /**
     * handles client receiving messages from server via websocket
     * @param {MessageEvent} msg message from server
     */
    websocket_handler(msg){

        if (msg.method === "render") {
            if (msg.code === sessionStorage.getItem("code")) {
                if (msg.username !== sessionStorage.getItem("username")){
                // the message is from a user in our game
                if (!opponents.hasOwnProperty(msg.username)) {
                    this.setOpponents(msg.username, msg.x, msg.y, msg.z)
                } else {
                    this.renderOpp(msg.username, msg.x, msg.y, msg.z)
                }
                scene.add(this.opponents[msg.username].car)
                scene.add(this.opponents[msg.username].frontRight)
                scene.add(this.opponents[msg.username].frontLeft)
                scene.add(this.opponents[msg.username].backRight)
                scene.add(this.opponents[msg.username].backLeft)

                //TODO: also send chassisBody quaternion and apply it to chassisBody in "renderOpp()"
                //or somehow make rotation update bc right now its a bunch of blocks sliding around
                //if you can also do this for wheels that would be great!
                }

                //update the refresh rate regardless
                this.slowest_refresh_rate = msg.slowest_rr
                
            }
            } else if (msg.method === "finish-multiplayer"){ 
            //the only reason im redrawing the entire leaderboard after someone finishes
            //is in-case a user joins late and beats several times
            if (msg.code === sessionStorage.getItem("code")){
                //destroy leaderboard children
                let leaderboard = document.getElementById("multi-track-leaderboard")
                while (leaderboard.hasChildNodes()){
                leaderboard.removeChild(leaderboard.firstChild)
                }

                let len = Object.keys(msg.positions).length

                for (let i = 1; i <= len; i ++){ //get the players in the order they finished
                let player = msg.positions[String(i)]
                let time = msg.times[player]

                this.addPlayerToLobbyLeaderboard(player, time)
                }
            }
        }
    }

    /**
     * initializes + renders a new instance of a multiplayer opponent
     * @param {string} opp opponent's username
     * @param {number} xpos current x-position of car
     * @param {number} ypos current y-position of car
     * @param {number} zpos current z-position of car
     */
    setOpponents(opp, xpos, ypos, zpos) {
        let oppGeo = new THREE.BoxGeometry(2, 0.9, 4)
        let oppMat = new THREE.MeshBasicMaterial({color: this.oppChassisColor, side: THREE.DoubleSide})
        let oppBox = new THREE.Mesh(oppGeo, oppMat)
        var geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32)
        var material = new THREE.MeshPhongMaterial({
            color: this.wheelColor,
            emissive: this.wheelColor,
            side: THREE.DoubleSide,
            flatShading: true
        })
        var cylinder1 = new THREE.Mesh(geometry, material)
        var cylinder2 = new THREE.Mesh(geometry, material)
        var cylinder3 = new THREE.Mesh(geometry, material)
        var cylinder4 = new THREE.Mesh(geometry, material)
    
        cylinder1.rotation.z = Math.PI / 2;
        cylinder2.rotation.z = Math.PI / 2;
        cylinder3.rotation.z = Math.PI / 2;
        cylinder4.rotation.z = Math.PI / 2;
    
        this.opponents[opp] = {
            car: oppBox,
            // ok this is dumb but idk how else to go about adding wheels w/o CANNOn
            frontRight: cylinder1,
            frontLeft: cylinder2,
            backRight: cylinder3,
            backLeft: cylinder4
        }
        // TODO: duplicated code in here and renderOpp()
        // also hardcoding if we change chassis body dimensions. 
        this.opponents[opp].car.position.x = xpos
        this.opponents[opp].car.position.y = ypos
        this.opponents[opp].car.position.z = zpos
        // front Right position wheel
        this.opponents[opp].frontRight.position.x = xpos + 1.2
        this.opponents[opp].frontRight.position.y = ypos - .2
        this.opponents[opp].frontRight.position.z = zpos + 1.3
        // front Left position wheel
        this.opponents[opp].frontLeft.position.x = xpos - 1.2
        this.opponents[opp].frontLeft.position.y = ypos - .2
        this.opponents[opp].frontLeft.position.z = zpos + 1.3
        // back Right position wheel
        this.opponents[opp].backRight.position.x = xpos + 1.2
        this.opponents[opp].backRight.position.y = ypos - .2
        this.opponents[opp].backRight.position.z = zpos - 1.3
        // back Left position wheel
        this.opponents[opp].backLeft.position.x = xpos - 1.2
        this.opponents[opp].backLeft.position.y = ypos - .2
        this.opponents[opp].backLeft.position.z = zpos - 1.3
    }

    /**
     * redraws the opponent's mesh with updates position
     * @param {string} opp opponent's username
     * @param {number} xpos current x-position of car
     * @param {number} ypos current y-position of car
     * @param {number} zpos current z-position of car
     */
    renderOpp(opp, xpos, ypos, zpos) {
        this.opponents[opp].car.position.x = xpos
        this.opponents[opp].car.position.y = ypos
        this.opponents[opp].car.position.z = zpos
        // front Right position wheel
        this.opponents[opp].frontRight.position.x = xpos + 1.2
        this.opponents[opp].frontRight.position.y = ypos - .2
        this.opponents[opp].frontRight.position.z = zpos + 1.3
        // front Left position wheel
        this.opponents[opp].frontLeft.position.x = xpos - 1.2
        this.opponents[opp].frontLeft.position.y = ypos - .2
        this.opponents[opp].frontLeft.position.z = zpos + 1.3
        // back Right position wheel
        this.opponents[opp].backRight.position.x = xpos + 1.2
        this.opponents[opp].backRight.position.y = ypos - .2
        this.opponents[opp].backRight.position.z = zpos - 1.3
        // back Left position wheel
        this.opponents[opp].backLeft.position.x = xpos - 1.2
        this.opponents[opp].backLeft.position.y = ypos - .2
        this.opponents[opp].backLeft.position.z = zpos - 1.3
    }

    /**
     * Loads a given track into the physics world from resources (.txt file)
     * @param {number} num track number (1-8) to load
     */
    loadTrack(num){
        //where the track is loaded
        this.track = new Track("Track " + String(num), 1, "../../res/tracks/track"+String(num)+".txt")
        this.track.build(this.scene, this.world)
    }  

    /**
     * Adds skid marks to ground if necessary
     * @param {CANNON.RaycastVehicle} vehicle the vehicle body to add skidmarks for
     */
    addSkidMarks() {
        const skidPositions = getWheelPositions(this.logic.vehicle); 
        skidPositions.forEach(position => {
            this.createSkidMarkAtPosition(position);
        });
    }

    /**
     * Creates a skid mark object (two black squares) at a given position
     * @param {THREE.Vector3} position (x,y,z) vector to create skid mark at
     */
    createSkidMarkAtPosition(position) {
        const skidGeometry = new THREE.PlaneGeometry(0.5, 0.5);
        const skidMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const skidMesh = new THREE.Mesh(skidGeometry, skidMaterial);
    
        // Adjust position and rotation based on the vehicle's orientation and wheel position
        skidMesh.position.copy(position);
        skidMesh.position.y -= 0.45
        skidMesh.rotation.x = -Math.PI / 2; // Rotate to lay flat on the ground
    
        scene.add(skidMesh); //there's no physics object on the skid marks so we don't call logic!
        this.skidArr.push(skidMesh)
    }

    /**
     * gets the positions of each wheel for skid marks
     * @param {CANNON.RaycastVehicle} vehicle vehicle to get wheels from
     * @returns 4-element array of (x,y,z) vectors for each wheel
     */
    getWheelPositions(vehicle) {
        let wheelPositions = [];
        for (let wheel of vehicle.wheelInfos) {
            // Assuming each wheel has a worldTransform property
            let wheelPosition = new THREE.Vector3();
            wheelPosition.copy(wheel.worldTransform.position);
            wheelPositions.push(wheelPosition);
        }
        return wheelPositions;
    }

    /**
     * checks to see if skid marks should be displayed, given the vehicle's current state + user inputs
     * @returns true if we should add skid marks, false otherwise
     */
    checkSkid(){
        //import our stuff from logic
        let vehicle = this.logic.vehicle
        let keys_pressed = this.logic.keys_pressed

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

    /**
     * deletes oldest skid marks if there are over 1000 on the ground (so we don't destroy gpu)
     */
    delSkid() {
        if (this.skidArr.length > 1000) {
            let oldSkidMark = this.skidArr.shift();
            this.scene.remove(oldSkidMark);
        }
    }

    /**
     * updates and re-renders all meshes for our game! runs asyncronously and updates physics world too
     * @param {number} timestamp the time at which this function was called again
     */
    render(timestamp) {
        //for syncing up clients on a multiplayer game. hooray!
        let refresh_rate = Math.round(timestamp - this.logic.last_timestamp)
        this.logic.last_timestamp = timestamp
        this.logic.playerRefreshRate = refresh_rate;

        //readjust the camera
        var relativeCameraOffset = new THREE.Vector3(0, 4, -10).applyMatrix4(box.matrixWorld);
        camera.position.copy(relativeCameraOffset);
        camera.lookAt(box.position);        
        
        // here should go the ws stuff i belive
        // this packet is this client's data. x, y, z, quaterion(?) etc.
        // make sure the user is in a multiplayer game
        if (this.logic.isMultiplayer && this.ws.readyState === WebSocket.OPEN) {
            let packet = {
                method: "render",
                username: sessionStorage.getItem("username"),
                x: this.logic.chassisBody.position.x,
                y: this.logic.chassisBody.position.y,
                z: this.logic.chassisBody.position.z,
                rr: refresh_rate,
                code: sessionStorage.getItem("code")
            } 
            this.ws.send(JSON.stringify(packet))
            this.ws.onmessage = message => this.websocket_handler(JSON.parse(message.data))
        }

        this.logic.update(this.track) //update the physics
        
        //update skid marks
        if (this.checkSkid()) {
            this.addSkidMarks();
            this.delSkid()
        }

        if (this.logic.checkFinish(this.track)){
            this.endGame()
        }

        //after the physics world is simulated, re-render everything
        this.renderer.render(this.scene, this.camera);

        // update the mesh to match the vehicle's new position
        this.box.position.copy(this.logic.chassisBody.position);
        this.box.quaternion.copy(this.logic.chassisBody.quaternion);
    
        this.updateUI()
        
    
        requestAnimationFrame(this.render);
    }
    /**
     * ends the game if the client satisfies all requirements to beat level
     * (i.e. done all laps or reach finish with all checkpoints checked)
     */
    endGame(){
        this.track.finish = Date.now()
    
        //stop physics world from simulating new inputs
        //returns true if the player set a new pb, false otherwise
        let new_pb = this.logic.endGame(this.getTimeElapsed(), this.trackValue) 

        if (!this.logic.isMultiplayer){
            //show the singleplayer modal
            document.getElementById("single-track-finish").style.display = "flex"
            document.getElementById("multi-track-finish").style.display = "none"
        
            document.getElementById("track-finish-time").innerText = getTimeElapsed()
            document.getElementById("track-finish-track-name").innerText = this.track.name
        } else {
            document.getElementById("multi-track-finish").style.display = "flex"
            document.getElementById("single-track-finish").style.display = "none"

            if (new_pb && this.ws.readyState === WebSocket.OPEN){ //rewrite user_data with new pb!
                let packet = {
                    method: "user_write",
                    data: new_pb,
                    username: sessionStorage.getItem("username"),
                    info1: "pbs",
                    info2: "track" + String(this.trackValue)
                } 
                this.ws.send(JSON.stringify(packet))
            }
        }
    }

    /**
     * updates the user interface (i.e. 2D text not in the game world)
     */
    updateUI(){
        //import all of our logic stuff
        let countdown = this.logic.countdown
        let vehicle = this.logic.vehicle

        let countdown_num = countdown
        if (countdown == 1){
            this.track.setStart(Date.now())
        } else if (countdown == 0){
        countdown_num = "GO!"
        } else if (countdown == -1){
        document.getElementById("countdown").style.display = "none"
        }
        document.getElementById("countdown").innerText = String(countdown_num)
        
        let ms_elapsed = Date.now() - this.last
    
        //time elapsed
        if (ms_elapsed >= 50 && countdown <= 0){ //update only after 50ms (so it doesnt look crazy)
        //time
        document.getElementById("time").innerText = this.getTimeElapsed()
        this.last = Date.now()
    
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
        if (this.ws.readyState === WebSocket.OPEN){ //rewrite user_data with new pb!
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
        
            this.ws.send(JSON.stringify(packet))
            }
        }
        }
    
    
        document.getElementById("movement-binds").innerText = newtext
    
    
        //track name is done during initialization to save time
    
        document.getElementById("laps").innerText = "Lap " + this.track.sendLaps()
    }

    /**
     * gets the time elapsed in "m:ss.ss" format
     * @returns time elapsed in given format (as a string)
     */
    getTimeElapsed(){
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
        if (this.track.getFinish() != null){
            total_elapsed = track.getFinish() - track.getStart()
        } else {
            total_elapsed = Date.now() - track.getStart()
        }
    
        return String(getMinutes(total_elapsed)) + ":" + getSeconds(total_elapsed)
    }

    /**
     * handles all key press events with corresponding updates
     * @param {Event} e event
     * @returns if the event was something other than a key being down or key being up
     */
    handleKeyPress(e) {
        //only update if the track is still being played
        if ((e.type !== 'keydown' && e.type !== 'keyup') || this.track.getFinish() != null) return;

        this.logic.keys_pressed[e.keyCode] = e.type === 'keydown';
    }
    
}

let game = new GUI()