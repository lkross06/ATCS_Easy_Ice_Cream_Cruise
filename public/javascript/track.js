/**
 * Represents the full track in the scene.
 * 
 * @class Track
 * @property {string} name - The name of the track.
 * @property {number} laps - The total number of laps in the race.
 * @property {number} curr_lap - The current lap number.
 * @property {string} rel - The relative URL to the text file for building the track.
 * @property {Array<Piece>} pieces - An ordered list of piece objects representing the track.
 * @property {Array<Checkpoint>} checkpoints - An ordered list of checkpoints on the track.
 * @property {number} start - The timestamp when the track was started.
 * @property {number|null} finish - The timestamp when the track was finished, null until completion.
 */

export class Track{
    //the first block always spawns at (0, 0, 0) so we dont have to move the car. everything is built relative to that
    /**
     * Creates an instance of Track.
     * @param {string} name - Name of the track.
     * @param {number} [laps=1] - Total number of laps.
     * @param {string} rel - Relative link to the .txt file to build the track.
     */
    constructor(name, laps = 1, rel){ //rel is a relative link to the .txt file to build the track
        this.name = name
        this.laps = laps
        this.curr_lap = 1
        this.rel = rel

        this.pieces = [] //ordered list of piece objects
        this.checkpoints = [] //ordered list of checkpoints

        this.start = Date.now() //when the track was started
        this.finish = null //null until the track is finish, then this is the time the track was finished
    }

    /**
     * Sets the start time of the track.
     * @param {number} now - The timestamp representing the current time.
     */
    setStart(now){
        this.start = now
    }

    /**
     * Increments the current lap number by one.
     */
    addLap(){
        this.curr_lap += 1
    }

    /**
     * Gets the start time of the track.
     * @returns {number} The start timestamp.
     */
    getStart(){
        return this.start
    }

    /**
     * Gets the start time of the track.
     * @returns {number} The finish timestamp.
     */
    getFinish(){
        return this.finish
    }

    /**
     * Provides a string representation of the current lap over total laps.
     * @returns {string} The formatted lap string.
     */
    sendLaps(){
        return String(this.curr_lap) + " / " + String(this.laps)
    }

    /**
     * Retrieves the name of the track.
     * @returns {string} The track's name.
     */
    getName(){
        return this.name
    }

    /**
     * Retrieves the list of checkpoints on the track.
     * @returns {Array<Object>} The list of checkpoints.
     */
    getCheckpoints(){
        return this.checkpoints
    }

    /**
     * Finds the first 'Lap' or 'Start' piece and returns its body.
     * @returns {Object|null} The body of the 'Lap' or 'Start' piece, or null if not found.
     */
    getStartBody(){
        for (let piece of this.pieces){
            if (piece.name == "Lap" || piece.name == "Start") return piece.body
        }
        return null
    }

    /**
     * Finds the first 'Lap' or 'Finish' piece and returns its body.
     * @returns {Object|null} The body of the 'Lap' or 'Finish' piece, or null if not found.
     */
    getFinishBody(){ //you can finish on a lap or a finish
        for (let piece of this.pieces){
            if (piece.name == "Lap" || piece.name == "Finish") return piece.body
        }
        return null
    }

    /**
     * Builds the track in a given scene and world by fetching and processing a track layout file.
     * @param {Object} scene - The scene in which the track will be built.
     * @param {Object} world - The world where the track pieces will exist.
     */
    build(scene, world){ //builds the track in a given scene / world
        fetch(this.rel) //find the file given relative url
        .then((res) => res.text()) //get the file / resource's text
        .then((text) => {

            let lines = text.split("\n")
            let prev = null

            this.laps = parseInt(lines[0])
            if (isNaN(this.laps)) this.laps = 1

            let thick = parseFloat(lines[1]) //multiplier on width of block (default = 1)
            if (isNaN(thick)) thick = 1
            
            for (let line of lines.slice(2)){
                line = line.split(" ")

                let blockType = line[0]
                //remove "[]" and carriage return "\r" if present, then split by ","
                let params = line[1].slice(1, -1).replace("]","").split(",")

                let piece

                if (blockType == "Checkpoint"){
                    piece = new Checkpoint(params[0], thick)
                } else if (blockType == "Lap"){
                    piece = new Lap(params[0], thick)
                } else if (blockType == "Flat"){
                    piece = new Flat(params[0], thick)
                } else if (blockType == "Start"){
                    piece = new Start(params[0], thick)
                } else if (blockType == "Finish"){
                    piece = new Finish(params[0], thick)
                } else if (blockType == "Straight"){
                    //size, direction, width
                    piece = new Straight(Number.parseFloat(params[0]), params[1], thick)
                } else if (blockType == "LeftTurn"){
                    piece = new LeftTurn(params[0], thick)
                } else if (blockType == "RightTurn"){
                    piece = new RightTurn(params[0], thick)
                } else if (blockType == "RampUp"){
                    //theta, size, direction, width
                    piece = new RampUp(Number.parseFloat(params[0]), Number.parseFloat(params[1]), params[2], thick)
                } else if (blockType == "RampDown"){
                    //theta, size, direction, width
                    piece = new RampDown(Number.parseFloat(params[0]), Number.parseFloat(params[1]), params[2], thick)
                }

                piece.create(scene, world)
                //only start on "Start" block
                if (this.pieces.length > 0){
                    piece.snapTo(prev)
                    this.pieces.push(piece)
                    prev = piece
                    if (blockType == "Checkpoint") this.checkpoints.push(piece)
                } else if (this.pieces.length == 0){
                    this.pieces.push(piece)
                    prev = piece
                }
            }
        }).catch((e) => console.error(e)); //if you don't find it
    }
}


/**
 * Represents a basic piece or segment of a track in a racing game.
 * 
 * @class Piece
 * @property {number} x - The X coordinate of the piece.
 * @property {number} y - The Y coordinate of the piece.
 * @property {number} z - The Z coordinate of the piece.
 * @property {number} width - The width of the piece.
 * @property {number} height - The height of the piece.
 * @property {number} length - The length of the piece.
 * @property {string} direction - The direction the piece faces (e.g., 'N', 'S', 'E', 'W').
 * @property {number} pitch - The pitch (rotation around the X-axis) of the piece.
 * @property {number} yaw - The yaw (rotation around the Y-axis) of the piece.
 * @property {number} roll - The roll (rotation around the Z-axis) of the piece.
 * @property {number} color - The color of the piece.
 * @property {number} railColor - The color of the rails on the piece.
 * @property {Array<string>} rails - A list of directions indicating where rails are present.
 * @property {number} railThick - The thickness of the rails.
 * @property {number} railHeight - The height of the rails.
 * @property {string} name - The name of the piece.
 * @property {Object} body - The physics body of the piece for simulation.
 * @property {Object} mesh - The graphical representation of the piece.
 * @property {Object} railBodies - A mapping of rail directions to their physics bodies.
 * @property {Object} railMeshes - A mapping of rail directions to their graphical meshes.
 */
class Piece{
    /**
     * Creates an instance of a Piece.
     * @param {number} x - The X coordinate of the piece.
     * @param {number} y - The Y coordinate of the piece.
     * @param {number} z - The Z coordinate of the piece.
     * @param {number} width - The width of the piece.
     * @param {number} height - The height of the piece.
     * @param {number} length - The length of the piece.
     * @param {string} [direction='N'] - The direction the piece faces.
     * @param {Array<string>} [rails=[]] - A list of directions where rails are present.
     * @param {number} [color=0xd6D5cd] - The color of the piece.
     * @param {number} [railColor=0x696969] - The color of the rails.
     */
    constructor(x, y, z, width, height, length, direction = "N", rails = [], color = 0xd6D5cd, railColor = 0x696969) {
        this.x = x
        this.y = y
        this.z = z
        this.width = width
        this.height = height
        this.length = length
        this.direction = direction //the direction the block faces

        this.pitch = 0
        this.yaw = 0
        this.roll = 0

        this.color = color
        this.railColor = railColor

        this.rails = rails //list of directions to make rails in (NSEW)
        this.railThick = 0.4
        this.railHeight = 0.8

        this.name = "Piece"

        this.body; //for later definition
        this.mesh;

        this.railBodies = {} //for example, "N" --> CANNON.Body object
        this.railMeshes = {} //see comment above
    }
}

/**
 * Represents a basic block of the track, can only be a flat square. 
 * 
 * @class Block
 * @extends Piece
 * @property {number} true_size - The actual size of the block, accounting for adjustments like thickness.
 */class Block extends Piece{
    /**
     * Creates an instance of Block.
     * @param {number} width - The width of the block.
     * @param {number} height - The height of the block.
     * @param {number} length - The length of the block.
     * @param {string} [direction='N'] - The direction the block faces.
     * @param {number} [size=1] - The size multiplier for the block.
     * @param {number} [thick_size=1] - The thickness size multiplier for the block.
     * @param {Array<string>} [rails=[]] - A list of directions for rails.
     */
    constructor(width, height, length, direction = "N", size = 1, thick_size = 1, rails){
        super(0, 0, 0, width, height, length, direction, rails)
        if (direction == "N" || direction == "S"){
            this.length *= size * thick_size
            this.width *= thick_size
        } else if (direction == "E" || direction == "W") {
            this.width *= size * thick_size
            this.length *= thick_size
        }
        this.name = "Block"
    }

    /**
     * Sets the position of the block in the track.
     * @param {number} x - The new X coordinate.
     * @param {number} y - The new Y coordinate.
     * @param {number} z - The new Z coordinate.
     */
    setPosition(x, y, z){
        this.x = x
        this.y = y
        this.z = z
        
        this.body.position.set(x, y, z) //update physics
        this.mesh.position.set(x, y, z) //update graphics

        for (let rail of this.rails){
            let rb = this.railBodies[rail]
            let rm = this.railMeshes[rail]

            let newx = this.x;
            let newy = this.y + this.height + this.railHeight;
            let newz = this.z;
            if (rail == "N"){
                newz = this.z + this.length - this.railThick
            } else if (rail == "S"){
                newz = this.z - this.length + this.railThick
            } else if (rail == "W"){
                newx = this.x + this.width - this.railThick
            } else if (rail == "E"){
                newx = this.x - this.width + this.railThick
            }

            rb.position.set(newx, newy, newz)
            rm.position.set(newx, newy, newz)
        }
    }

    /**
     * set position to be adjacent to "other" in given direction "dir" (N/S/E/W)
     * 
     * N --> positive z
     * S --> negative z
     * E --> negative x
     * W --> positive x
     * 
     * (car spawns facing north with east on right and west on left)
     * 
     * i also noticed that the direction you snap in is usually the orientation direction
     * 
     * @param {Block} other other block to snap to (on x-z plane)
     */
    snapTo(other, dir = this.direction){
        let ol = other.length
        let oh = other.height
        let ow = other.width

        let ox = other.x
        let oy = other.y
        let oz = other.z

        if (dir == "N"){
            this.setPosition(ox, oy + (oh * 2) - (this.height * 2), oz + ol + this.length)
        } else if (dir == "S"){
            this.setPosition(ox, oy + (oh * 2) - (this.height * 2), oz - ol - this.length)
        } else if (dir == "E"){
            this.setPosition(ox - ow - this.width, oy + (oh * 2) - (this.height * 2), oz)
        } else if (dir == "W"){
            this.setPosition(ox + ow + this.width, oy + (oh * 2) - (this.height * 2), oz)
        }
    }
    
    /**
     * Creates the block in a given scene and physics world.
     * @param {Object} scene - The scene in which the block will be added.
     * @param {Object} world - The physics world where the block will exist.
     */
    create(scene, world) {
        //physics
        let shape = new CANNON.Box(new CANNON.Vec3(this.width, this.height, this.length))
        this.body = new CANNON.Body({mass: 0})
        this.body.addShape(shape)
        this.body.position.set(this.x, this.y, this.z)

        world.add(this.body)

        //graphics
        let geo = new THREE.BoxGeometry(this.width * 2, this.height * 2, this.length * 2)
        let material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        this.mesh = new THREE.Mesh(geo, material)
        this.mesh.position.set(this.x, this.y, this.z)

        scene.add(this.mesh)

        if (this.rails.length > 0){
            this.createRails(scene, world)
        }
    }

    /**
     * Creates the rails for the block in the given scene and physics world.
     * @param {Object} scene - The scene in which the rails will be added.
     * @param {Object} world - The physics world where the rails will exist.
     */
    createRails(scene, world){
        let material = new THREE.MeshPhongMaterial({
            color: this.railColor,
            emissive: this.railColor,     
            side: THREE.DoubleSide,
            flatShading: true,
        })

        for (let rail of this.rails){
            let railShape;
            let railGeo;

            let railX = this.x;
            let railY = this.y + this.height + this.railHeight;
            let railZ = this.z;
            if (rail == "N"){
                railShape = new CANNON.Box(new CANNON.Vec3(this.width, this.railHeight, this.railThick))
                railGeo = new THREE.BoxGeometry(this.width * 2, this.railHeight * 2, this.railThick * 2)

                railZ = this.z + this.length - this.railThick
            } else if (rail == "S"){
                railShape = new CANNON.Box(new CANNON.Vec3(this.width, this.railHeight, this.railThick))
                railGeo = new THREE.BoxGeometry(this.width * 2, this.railHeight * 2, this.railThick * 2)
            
                railZ = this.z - this.length + this.railThick
            } else if (rail == "W"){
                railShape = new CANNON.Box(new CANNON.Vec3(this.railThick, this.railHeight, this.length))
                railGeo = new THREE.BoxGeometry(this.railThick * 2, this.railHeight * 2, this.length * 2)
            
                railX = this.x + this.width - this.railThick
            } else if (rail == "E"){
                railShape = new CANNON.Box(new CANNON.Vec3(this.railThick, this.railHeight, this.length))
                railGeo = new THREE.BoxGeometry(this.railThick * 2, this.railHeight * 2, this.length * 2)
            
                railX = this.x - this.width + this.railThick
            }

            //physics
            let railBody = new CANNON.Body({mass: 0})
            railBody.addShape(railShape)
            railBody.position.set(railX, railY, railZ)

            this.railBodies[rail] = railBody
            world.add(railBody)

            //graphics
            let railMesh = new THREE.Mesh(railGeo, material)
            railMesh.position.set(railX, railY, railZ)

            this.railMeshes[rail] = railMesh
            scene.add(railMesh)
        }
    }
}


/**
 * Represents a checkpoint in a racing track. It extends the Block class and includes specific attributes and behaviors for checkpoints.
 * 
 * @class Checkpoint
 * @extends Block
 * @property {boolean} checked - Indicates whether the checkpoint has been cleared (true) or not (false).
 * @property {number} checkedColor - The color of the checkpoint when it has been cleared.
 */
class Checkpoint extends Block{
    /**
     * Creates an instance of Checkpoint.
     * @param {string} [direction='N'] - The direction the checkpoint faces.
     * @param {number} thick_size - The thickness size multiplier for the checkpoint.
     */
    constructor(direction = "N", thick_size){
        super(10, 1, 10, direction, 1, thick_size, [])
        if (direction == "N" || direction == "S"){
            this.length = 5
            this.rails = ["W", "E"]
        } else if (direction == "E" || direction == "W"){
            this.width = 5
            this.rails = ["N", "S"]
        }
        this.color = 0xFF8C00
        this.checked = false //true when car goes over it
        this.checkedColor = 0xFFA07A 

        this.name = "Checkpoint"
    }

    /**
     * Sets the checkpoint as checked or unchecked.
     * @param {boolean} checked - The state to set for the checkpoint (true if checked).
     */
    setChecked(checked){
        this.checked = checked
        if (this.checked){
            this.mesh.material.color = new THREE.Color(this.checkedColor)
            this.mesh.material.emissive = new THREE.Color(this.checkedColor)
        } else {
            this.mesh.material.color = new THREE.Color(this.color)
            this.mesh.material.emissive = new THREE.Color(this.color)

        }
    }

    /**
     * Retrieves the checked status of the checkpoint.
     * @returns {boolean} True if the checkpoint has been cleared, false otherwise.
     */
    getChecked(){
        return this.checked
    }

}

/**
 * Represents a lap marker on the racing track. 
 *
 * @class Lap
 * @extends Block
 */
class Lap extends Block{ //there should be only 1 per map. incremenets lap by +1 if all checkpoints are checked, sets all checkponits to unchecked
    /**
     * Creates an instance of Lap.
     * @param {string} [direction='N'] - The direction the lap marker faces.
     * @param {number} thick_size - The thickness size multiplier for the lap marker.
     */
    constructor(direction = "N", thick_size){
        super(10, 1, 10, direction, 1, thick_size, [])
        if (direction == "N" || direction == "S"){
            this.length = 5
            this.rails = ["W", "E"]
        } else if (direction == "E" || direction == "W"){
            this.width = 5
            this.rails = ["N", "S"]
        }
        this.color = 0xFF8513

        this.name = "Lap"
    }
}


/**
 * Represents a flat segment of the racing track. It's a basic type of Block with no special features.
 *
 * @class Flat
 * @extends Block
 */
class Flat extends Block{
    /**
     * Creates an instance of Flat.
     * @param {string} [direction='N'] - The direction the flat segment faces.
     * @param {number} thick_size - The thickness size multiplier for the flat segment.
     */
    constructor(direction = "N", thick_size){
        super(10, 1, 10, direction, 1, thick_size, [])
    }
}

/**
 * Represents the start line of the racing track. It's a specialized Block marking the starting point.
 *
 * @class Start
 * @extends Block
 */
class Start extends Block{
    /**
     * Creates an instance of Start.
     * @param {string} [direction='N'] - The direction the start line faces.
     * @param {number} thick_size - The thickness size multiplier for the start line.
     */
    constructor(direction = "N", thick_size){
        super(10, 1, 10, direction, 1, thick_size, [])
        if (direction == "N"){
            this.rails =  ["W", "E", "S"]
        } else if (direction == "S") {
            this.rails =  ["W", "N", "E"]
        } else if (direction == "W") {
            this.rails =  ["S", "N", "E"]
        } else if (direction == "E") {
            this.rails =  ["W", "N", "S"]
        }
        this.color = 0xFFF8DC
        this.name = "Start"
    }
}

/**
 * Represents the finish line of the racing track. It's a specialized Block marking the end of a lap or race.
 *
 * @class Finish
 * @extends Block
 */
class Finish extends Block{
    /**
     * Creates an instance of Finish.
     * @param {string} [direction='N'] - The direction the finish line faces.
     * @param {number} thick_size - The thickness size multiplier for the finish line.
     */
    constructor(direction = "N", thick_size){
        super(10, 1, 10, direction, 1, thick_size, [])
        if (direction == "N"){
            this.rails =  ["W", "E", "N"]
        } else if (direction == "S") {
            this.rails =  ["W", "S", "E"]
        } else if (direction == "W") {
            this.rails =  ["S", "N", "W"]
        } else if (direction == "E") {
            this.rails =  ["E", "N", "S"]
        }
        this.color = 0xFF4500
        this.name = "Finish"
    }
}

/**
 * Represents a straight segment of the racing track. It's a type of Block used for straight paths.
 *
 * @class Straight
 * @extends Block
 */
class Straight extends Block{
    /**
     * Creates an instance of Straight.
     * @param {number} [size=1] - The size multiplier for the straight segment.
     * @param {string} [direction='N'] - The direction the straight segment faces.
     * @param {number} thick_size - The thickness size multiplier for the straight segment.
     */
    constructor(size = 1, direction = "N", thick_size){
        super(10, 1, 10, direction, size, thick_size, [])
        if (direction == "N" || direction == "S"){
            this.rails = ["W", "E"]
        } else if (direction == "W" || direction == "E") {
            this.rails = ["N", "S"]
        }
        this.name = "Straight"
    }
}


/**
 * Represents a right turn on the racing track. It's a type of Block used for right-angle turns.
 *
 * @class RightTurn
 * @extends Block
 */
class RightTurn extends Block{
    /**
     * Creates an instance of RightTurn.
     * @param {string} [direction='N'] - The direction the right turn faces.
     * @param {number} thick_size - The thickness size multiplier for the right turn.
     */
    constructor(direction = "N", thick_size){
        super(10, 1, 10, direction, 1, thick_size, [])
        if (direction == "N"){
            this.rails = ["W", "N"]
        } else if (direction == "S") {
            this.rails = ["S", "E"]
        } else if (direction == "W"){
            this.rails = ["W", "S"]
        } else if (direction == "E") {
            this.rails = ["N", "E"]
        }
        this.name = "RightTurn"
    }
}

/**
 * Represents a left turn on the racing track. It's a type of Block used for left-angle turns.
 *
 * @class LeftTurn
 * @extends Block
 */
class LeftTurn extends Block{
    /**
     * Creates an instance of LeftTurn.
     * @param {string} [direction='N'] - The direction the left turn faces.
     * @param {number} thick_size - The thickness size multiplier for the left turn.
     */
    constructor(direction = "N", thick_size){
        super(10, 1, 10, direction, 1, thick_size, [])
        if (direction == "N"){
            this.rails = ["E", "N"]
        } else if (direction == "S") {
            this.rails = ["S", "W"]
        } else if (direction == "W"){
            this.rails = ["W", "N"]
        } else if (direction == "E") {
            this.rails = ["S", "E"]
        }
        this.name = "LeftTurn"
    }
}


/**
 * Represents a ramp on the racing track. 
 *
 * @class Ramp
 * @extends Piece
 * @property {number} theta - The angle of inclination of the ramp from the x-z plane, in radians.
 * @property {number} true_size - The actual size of the ramp, considering the incline.
 * @property {number} true_height - The actual height of the ramp, accounting for the incline.
 * @property {number} true_y - The adjusted Y coordinate considering the ramp's inclination.
 */
class Ramp extends Piece {    /**
     * Creates an instance of Ramp.
     * @param {number} width - The width of the ramp.
     * @param {number} height - The height of the ramp.
     * @param {number} length - The length of the ramp.
     * @param {string} [direction='N'] - The direction the ramp faces.
     * @param {number} theta - The angle of inclination of the ramp in radians. (On the X-Z plane)
     * @param {number} [size=1] - The size multiplier for the ramp.
     * @param {number} [thick_size=1] - The thickness size multiplier for the ramp.
     * @param {Array<string>} [rails=[]] - A list of directions for rails on the ramp.
     */
    constructor(width, height, length, direction = "N", theta, size = 1, thick_size = 1, rails){
        super(0, 0, 0, width, height, length, direction, rails)
        if (direction == "N" || direction == "S"){
            this.length *= size
            this.width *= thick_size
        } else if (direction == "E" || direction == "W") {
            this.width *= size
            this.length *= thick_size
        }
        this.name = "Ramp"

        //"true" variables are used for calculation with CANNON and THREE
        //non-"true" variables are sent to other objects for snapTo calculation
        this.theta = theta

        this.true_size = null //the hypoteneuse length

        if (this.direction == "N" || this.direction == "S"){
            this.length -= (2 * this.railThick * Math.cos(this.theta)) //dont change length because we want it to be the same size as normal blocks
            this.true_size = (this.length / Math.cos(this.theta)) + (2 * Math.sin(Math.abs(this.theta) * this.height))
        } else {
            this.width -= (2 * this.railThick * Math.cos(this.theta)) //dont change length because we want it to be the same size as normal blocks
            this.true_size = (this.width / Math.cos(this.theta)) + (2 * Math.sin(Math.abs(this.theta) * this.height))
        }
        
        this.true_height = this.height
        this.height = this.true_size * Math.sin(this.theta)

        //add half the height of the ramp and subtract the full thickness of the ramp
        this.true_y = this.y + this.height - (this.true_height * 2)

        if (direction == "S" || direction == "W"){
            this.theta *= -1
            this.true_y -= this.height
        }
    }

    /**
     * Sets the position of the ramp, adjusting for its inclination.
     * @param {number} x - The new X coordinate.
     * @param {number} y - The new Y coordinate.
     * @param {number} z - The new Z coordinate.
     */
    setPosition(x, y, z){
        this.x = x
        this.y = y
        this.z = z
        this.true_y = this.y + this.height - (this.true_height * 2)
        
        this.body.position.set(x, this.true_y, z) //update physics
        this.mesh.position.set(x, this.true_y, z) //update graphics

        for (let rail of this.rails){
            let rb = this.railBodies[rail]
            let rm = this.railMeshes[rail]

            //see createRails() for info on h
            let h = (this.true_height + this.railHeight)
            let newx = this.x;
            let newy = this.true_y + (h * Math.cos(this.theta));
            let newz = this.z;
            if (rail == "N"){
                newz = this.z + this.length - this.railThick
                newx -= (h * Math.sin(this.theta))
            } else if (rail == "S"){
                newz = this.z - this.length + this.railThick
                newx -= (h * Math.sin(this.theta))
            } else if (rail == "W"){
                newx = this.x + this.width - this.railThick
                newz -= (h * Math.sin(this.theta))
            } else if (rail == "E"){
                newx = this.x - this.width + this.railThick
                newz -= (h * Math.sin(this.theta))
            }
            rb.position.set(newx, newy, newz)
            rm.position.set(newx, newy, newz)
        }
    }

    /**
     * set position to be adjacent to "other" in given direction "dir" (N/S/E/W)
     * 
     * N --> positive z
     * S --> negative z
     * E --> negative x
     * W --> positive x
     * 
     * (car spawns facing north with east on right and west on left)
     * 
     * i also noticed that the direction you snap in is usually the orientation direction
     * 
     * @param {Block} other other block to snap to (on x-z plane)
     */
    snapTo(other, dir = this.direction){
        let ol = other.length
        let oh = other.height * 2 //acount for the thickness of other blocks
        let ow = other.width

        let ox = other.x
        let oy = other.y
        let oz = other.z

        if (dir == "N"){
            this.setPosition(ox, this.y + oy + oh, oz + ol + this.length)
        } else if (dir == "S"){
            this.setPosition(ox, this.y + oy + oh, oz - ol - this.length)
        } else if (dir == "E"){
            this.setPosition(ox - ow - this.width, this.y + oy + oh, oz)
        } else if (dir == "W"){
            this.setPosition(ox + ow + this.width, this.y + oy + oh, oz)
        }
    }
    
    /**
     * Creates the ramp in a given scene and physics world, including its specific geometry due to the angle of inclination.
     * @param {Object} scene - The scene in which the ramp will be added.
     * @param {Object} world - The physics world where the ramp will exist.
     */
    create(scene, world) {
        //physics
        let shape
        if (this.direction == "N" || this.direction == "S"){
            shape = new CANNON.Box(new CANNON.Vec3(this.width, this.true_height, this.true_size))
        } else {
            shape = new CANNON.Box(new CANNON.Vec3(this.true_size, this.true_height, this.length))
        }
        this.body = new CANNON.Body({mass: 0})
        this.body.addShape(shape)
        this.body.position.set(this.x, this.true_y, this.z)
        if (this.direction == "N" || this.direction == "S"){
            this.body.quaternion.x = -this.theta / 2
        } else {
            this.body.quaternion.z = -this.theta / 2
        }
        

        world.add(this.body)

        //graphics
        let geo
        if (this.direction == "N" || this.direction == "S"){
            geo = new THREE.BoxGeometry(this.width * 2, this.true_height * 2, this.true_size * 2)
        } else {
            geo = new THREE.BoxGeometry(this.true_size * 2, this.true_height * 2, this.length * 2)
        }
        
        let material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        this.mesh = new THREE.Mesh(geo, material)
        this.mesh.position.set(this.x, this.true_y, this.z)
        if (this.direction == "N" || this.direction == "S"){
            this.mesh.quaternion.x = -this.theta / 2
        } else {
            this.mesh.quaternion.z = -this.theta / 2
        }

        scene.add(this.mesh)

        if (this.rails.length > 0){
            this.createRails(scene, world)
        }
    }

    /**
     * Creates the rails for the ramp in the given scene and physics world, adjusting for the ramp's inclination.
     * @param {Object} scene - The scene in which the rails will be added.
     * @param {Object} world - The physics world where the rails will exist.
     */
    createRails(scene, world){
        let material = new THREE.MeshPhongMaterial({
            color: this.railColor,
            emissive: this.railColor,     
            side: THREE.DoubleSide,
            flatShading: true,
        })

        for (let rail of this.rails){
            let railShape;
            let railGeo;

            // h = the distance between the block coordinates and supposed rail coordinates
            //that are perpendicular to theta
            let h = (this.true_height + this.railHeight) 
            let railX = this.x;
            let railY = this.true_y + ((this.true_height + this.railHeight) * Math.cos(this.theta));
            let railZ = this.z;

            if (rail == "N"){
                railShape = new CANNON.Box(new CANNON.Vec3(this.true_size, this.railHeight, this.railThick))
                railGeo = new THREE.BoxGeometry(this.true_size * 2, this.railHeight * 2, this.railThick * 2)

                railZ = this.z + this.length - this.railThick
                railX -= (h * Math.sin(this.theta))
            } else if (rail == "S"){
                railShape = new CANNON.Box(new CANNON.Vec3(this.true_size, this.railHeight, this.railThick))
                railGeo = new THREE.BoxGeometry(this.true_size * 2, this.railHeight * 2, this.railThick * 2)
            
                railZ = this.z + this.length - this.railThick
                railX -= (h * Math.sin(this.theta))
            } else if (rail == "W"){
                //the rail length has to be a bit longer or there is a gap
                railShape = new CANNON.Box(new CANNON.Vec3(this.railThick, this.railHeight, this.true_size))
                railGeo = new THREE.BoxGeometry(this.railThick * 2, this.railHeight * 2, this.true_size * 2)
            
                railX = this.x + this.width - this.railThick
                railZ -= (h * Math.sin(this.theta))
            } else if (rail == "E"){
                railShape = new CANNON.Box(new CANNON.Vec3(this.railThick, this.railHeight, this.true_size))
                railGeo = new THREE.BoxGeometry(this.railThick * 2, this.railHeight * 2, this.true_size * 2)
            
                railX = this.x - this.width + this.railThick
                railZ -= (h * Math.sin(this.theta))
            }

            //physics
            let railBody = new CANNON.Body({mass: 0})
            railBody.addShape(railShape)
            railBody.position.set(railX, railY, railZ)
            if (this.direction == "N" || this.direction == "S"){
                railBody.quaternion.x = -this.theta / 2
            } else {
                railBody.quaternion.z = -this.theta / 2
            }

            this.railBodies[rail] = railBody
            world.add(railBody)

            //graphics
            let railMesh = new THREE.Mesh(railGeo, material)
            railMesh.position.set(railX, railY, railZ)
            if (this.direction == "N" || this.direction == "S"){
                railMesh.quaternion.x = -this.theta / 2
            } else {
                railMesh.quaternion.z = -this.theta / 2
            }

            this.railMeshes[rail] = railMesh
            scene.add(railMesh)
        }
    }
}



/**
 * Represents an upward inclining ramp on the racing track. It's a specialized form of the Ramp class for ramps that incline upwards.
 *
 * @class RampUp
 * @extends Ramp
 */
class RampUp extends Ramp{
    /**
     * Creates an instance of RampUp.
     * @param {number} [theta=15] - The angle of inclination of the ramp in degrees.
     * @param {number} [size=1] - The size multiplier for the ramp.
     * @param {string} [direction='N'] - The direction the ramp faces.
     * @param {number} [thick_size=1] - The thickness size multiplier for the ramp.
     */
    constructor(theta = 15, size = 1, direction = "N", thick_size){
        //convert degrees to radians
        super(10, 1, 10, direction, theta * (Math.PI/180), size, thick_size, ["W", "E"])
        if (this.direction == "W" || this.direction == "E"){
            this.rails = ["N", "S"]
        }

        this.name = "RampUp"
    }
}

/**
 * Represents a downward inclining ramp on the racing track. It's a specialized form of the Ramp class for ramps that incline downwards.
 *
 * @class RampDown
 * @extends Ramp
 */
class RampDown extends Ramp{
    /**
     * Creates an instance of RampDown.
     * @param {number} [theta=15] - The angle of inclination of the ramp in degrees.
     * @param {number} [size=1] - The size multiplier for the ramp.
     * @param {string} [direction='N'] - The direction the ramp faces.
     * @param {number} [thick_size=1] - The thickness size multiplier for the ramp.
     */
    constructor(theta = 15, size = 1, direction = "N", thick_size){
        //convert degrees to radians
        super(10, 1, 10, direction, theta * -(Math.PI/180), size, thick_size, ["W", "E"])
        if (this.direction == "W" || this.direction == "E"){
            this.rails = ["N", "S"]
        }
        
        this.name = "RampDown"
    }
}