export class Track{
    //the first block always spawns at (0, 0, 0) so we dont have to move the car. everything is built relative to that
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

    getStart(){
        return this.start
    }

    getFinish(){
        return this.finish
    }

    sendLaps(){
        return String(this.curr_lap) + " / " + String(this.laps)
    }

    getName(){
        return this.name
    }

    getCheckpoints(){
        return this.checkpoints
    }

    getStartBody(){
        return this.pieces[0].body
    }

    getFinishBody(){
        return this.pieces[this.pieces.length - 1].body
    }

    build(scene, world){ //builds the track in a given scene / world
        fetch(this.rel) //find the file given relative url
        .then((res) => res.text()) //get the file / resource's text
        .then((text) => {

            let lines = text.split("\n")
            let prev = null
            
            for (let line of lines){
                line = line.split(" ")

                let blockType = line[0]
                //remove "[]" and carriage return "\r" if present, then split by ","
                let params = line[1].slice(1, -1).replace("]","").split(",")

                let piece

                if (blockType == "Checkpoint"){
                    piece = new Checkpoint(params[0])
                } else if (blockType == "Flat"){
                    piece = new Flat(params[0])
                } else if (blockType == "Start"){
                    piece = new Start(params[0])
                } else if (blockType == "Finish"){
                    piece = new Finish(params[0])
                } else if (blockType == "Straight"){
                    //size, direction
                    piece = new Straight(Number.parseInt(params[0]), params[1])
                } else if (blockType == "LeftTurn"){
                    piece = new LeftTurn(params[0])
                } else if (blockType == "RightTurn"){
                    piece = new RightTurn(params[0])
                } else if (blockType == "RampUp"){
                    //theta, size, direction
                    piece = new RampUp(Number.parseInt(params[0]), Number.parseInt(params[1]), params[2])
                } else if (blockType == "RampDown"){
                    //theta, size, direction
                    piece = new RampDown(Number.parseInt(params[0]), Number.parseInt(params[1]), params[2])
                }

                piece.create(scene, world)
                //only start on "Start" block
                if (this.pieces.length > 0){
                    piece.snapTo(prev)
                    this.pieces.push(piece)
                    prev = piece

                    if (blockType == "Checkpoint") this.checkpoints.push(piece)
                } else if (this.pieces.length == 0 && blockType == "Start"){
                    this.pieces.push(piece)
                    prev = piece
                }
            }
        })
        .catch((e) => console.error(e)); //if you don't find it
    }
}

class Piece{
    constructor(x, y, z, width, height, length, direction = "N", rails = [], color = 0xd6D5cd, railColor = 0xFF0000) {
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
        this.railThick = 0.2
        this.railHeight = 0.6

        this.name = "Piece"

        this.body; //for later definition
        this.mesh;

        this.railBodies = {} //for example, "N" --> CANNON.Body object
        this.railMeshes = {} //see comment above
    }
}

//all pieces that can be a flat square
class Block extends Piece{
    constructor(width, height, length, direction = "N", size = 1, rails){
        super(0, 0, 0, width, height, length, direction, rails)
        if (direction == "N" || direction == "S"){
            this.length *= size
        } else if (direction == "E" || direction == "W") {
            this.width *= size
        }
        this.name = "Block"
    }

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
            this.setPosition(ox, oy + oh - this.height, oz - ol - this.length)
        } else if (dir == "E"){
            this.setPosition(ox - ow - this.width, oy + oh - this.height, oz)
        } else if (dir == "W"){
            this.setPosition(ox + ow + this.width, oy + oh - this.height, oz)
        }
    }
    
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

class Checkpoint extends Block{
    constructor(direction = "N"){
        super(10, 1, 10, direction, 1, [])
        if (direction == "N" || direction == "S"){
            this.length = 5
            this.rails = ["W", "E"]
        } else if (direction == "E" || direction == "W"){
            this.width = 5
            this.rails = ["N", "S"]
        }
        this.color = 0xFFFF00
        this.checked = false //true when car goes over it
        this.checkedColor = 0x0000FF

        this.name = "Checkpoint"
    }

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

    getChecked(){
        return this.checked
    }

}

class Lap extends Block{ //there should be only 1 per map. incremenets lap by +1 if all checkpoints are checked, sets all checkponits to unchecked
    constructor(direction = "N"){
        super(10, 1, 10, direction, 1, [])
        if (direction == "N" || direction == "S"){
            this.length = 5
            this.rails = ["W", "E"]
        } else if (direction == "E" || direction == "W"){
            this.width = 5
            this.rails = ["N", "S"]
        }
        this.color = 0xFFFF00
        this.checked = false //true when car goes over it
        this.checkedColor = 0x0000FF

        this.name = "Checkpoint"
    }

    setChecked(checked){
        this.checked = checked
        if (this.checked){
            this.mesh.material.color = new THREE.Color(this.checkedColor)
            this.mesh.material.emissive = new THREE.Color(this.checkedColor)
        }
    }

}

class Flat extends Block{
    constructor(direction = "N"){
        super(10, 1, 10, direction, 1, [])
    }
}

class Start extends Block{
    constructor(direction = "N"){
        super(10, 1, 10, direction, 1, [])
        if (direction == "N"){
            this.rails =  ["W", "E", "S"]
        } else if (direction == "S") {
            this.rails =  ["W", "N", "E"]
        } else if (direction == "W") {
            this.rails =  ["S", "N", "E"]
        } else if (direction == "E") {
            this.rails =  ["W", "N", "S"]
        }
        this.color = 0x005511
        this.name = "Start"
    }
}

class Finish extends Block{
    constructor(direction = "N"){
        super(10, 1, 10, direction, 1, [])
        if (direction == "N"){
            this.rails =  ["W", "E", "N"]
        } else if (direction == "S") {
            this.rails =  ["W", "S", "E"]
        } else if (direction == "W") {
            this.rails =  ["S", "N", "W"]
        } else if (direction == "E") {
            this.rails =  ["E", "N", "S"]
        }
        this.color = 0xAA00AA
        this.name = "Finish"
    }
}

class Straight extends Block{
    constructor(size = 1, direction = "N"){
        super(10, 1, 10, direction, size, [])
        if (direction == "N" || direction == "S"){
            this.rails = ["W", "E"]
        } else if (direction == "W" || direction == "E") {
            this.rails = ["N", "S"]
        }
        this.name = "Straight"
    }
}

class RightTurn extends Block{
    constructor(direction = "N"){
        super(10, 1, 10, direction, 1, [])
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

class LeftTurn extends Block{
    constructor(direction = "N"){
        super(10, 1, 10, direction, 1, [])
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

class Ramp extends Piece {
    //theta == angle (radians) from x-z plane
    constructor(width, height, length, direction = "N", theta, size = 1, rails){
        super(0, 0, 0, width, height, length, direction, rails)
        if (direction == "N" || direction == "S"){
            this.length *= size
        } else if (direction == "E" || direction == "W") {
            this.width *= size
        }
        this.name = "Ramp"


        //"true" variables are used for calculation with CANNON and THREE
        //non-"true" variables are sent to other objects for snapTo calculation
        this.theta = theta

        //you can think of this.true_length as the hypoteneuse length
        this.length -= (2 * this.railThick * Math.cos(this.theta))
        this.true_length = this.length / Math.cos(this.theta) //dont change length because we want it to be the same size as normal blocks

        this.true_height = this.height
        this.height = this.true_length * Math.sin(this.theta)

        //add half the height of the ramp and subtract the full thickness of the ramp
        this.true_y = this.y + this.height - (this.true_height * 2)
    }

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

            let newx = this.x;
            let newy = this.true_y + this.true_height + this.railHeight;
            let newz = this.z;
            if (rail == "N"){
                newz = this.z + this.true_length - this.railThick
            } else if (rail == "S"){
                newz = this.z - this.true_length + this.railThick
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
    
    create(scene, world) {
        //physics
        let shape = new CANNON.Box(new CANNON.Vec3(this.width, this.true_height, this.true_length))
        this.body = new CANNON.Body({mass: 0})
        this.body.addShape(shape)
        this.body.position.set(this.x, this.true_y, this.z)
        this.body.quaternion.x = -this.theta / 2

        world.add(this.body)

        //graphics
        let geo = new THREE.BoxGeometry(this.width * 2, this.true_height * 2, this.true_length * 2)
        let material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        this.mesh = new THREE.Mesh(geo, material)
        this.mesh.position.set(this.x, this.true_y, this.z)
        this.mesh.quaternion.x = -this.theta / 2

        scene.add(this.mesh)

        if (this.rails.length > 0){
            this.createRails(scene, world)
        }
    }

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
            let railY = this.true_y + ((this.true_height + this.railHeight) * Math.cos(this.theta));
            let railZ = this.z - ((this.true_height + this.railHeight) * Math.cos(this.theta));
            if (rail == "N"){
                railShape = new CANNON.Box(new CANNON.Vec3(this.width, this.railHeight, this.railThick))
                railGeo = new THREE.BoxGeometry(this.width * 2, this.railHeight * 2, this.railThick * 2)

                railZ = this.z + this.true_length - this.railThick
            } else if (rail == "S"){
                railShape = new CANNON.Box(new CANNON.Vec3(this.width, this.railHeight, this.railThick))
                railGeo = new THREE.BoxGeometry(this.width * 2, this.railHeight * 2, this.railThick * 2)
            
                railZ = this.z - this.true_length + this.railThick
            } else if (rail == "W"){
                //the rail length has to be a bit longer or there is a gap
                railShape = new CANNON.Box(new CANNON.Vec3(this.railThick, this.railHeight, (this.length + this.true_height)))
                railGeo = new THREE.BoxGeometry(this.railThick * 2, this.railHeight * 2, this.length * 2)
            
                railX = this.x + this.width - this.railThick
            } else if (rail == "E"){
                railShape = new CANNON.Box(new CANNON.Vec3(this.railThick, this.railHeight, (this.length + this.true_height)))
                railGeo = new THREE.BoxGeometry(this.railThick * 2, this.railHeight * 2, this.length * 2)
            
                railX = this.x - this.width + this.railThick
            }

            //physics
            let railBody = new CANNON.Body({mass: 0})
            railBody.addShape(railShape)
            railBody.position.set(railX, railY, railZ)
            railBody.quaternion.x = -this.theta / 2

            this.railBodies[rail] = railBody
            world.add(railBody)

            //graphics
            let railMesh = new THREE.Mesh(railGeo, material)
            railMesh.position.set(railX, railY, railZ)
            railMesh.quaternion.x = -this.theta / 2

            this.railMeshes[rail] = railMesh
            scene.add(railMesh)
        }
    }
}

class RampUp extends Ramp{
    constructor(theta = 15, size = 1, direction = "N"){
        //convert degrees to radians
        super(10, 1, 10, direction, theta * (Math.PI/180), size, ["W", "E"])
        this.name = "RampUp"
    }
}

class RampDown extends Ramp{
    constructor(theta = 15, size = 1, direction = "N"){
        //convert degrees to radians
        super(10, 1, 10, direction, theta * -(Math.PI/180), size, ["W", "E"])
        this.name = "RampDown"
    }
}