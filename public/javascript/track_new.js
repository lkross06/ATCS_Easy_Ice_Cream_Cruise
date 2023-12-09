/**
 * list of track piece types
 * straight -- 10x20 straight block
 * turn -- 10x10 90 degree turn (left or right)
 * checkpoint -- 10x5 green checkpoint (turns blue after collision)
 * ramp -- 10x10x10 90 degree triangle ramp (ramp up and ramp down)
 */
class Piece{
    constructor(x, y, z, width, height, length, orient = "Z", rails = [], color = 0xd6D5cd, railColor = 0xFF0000) {
        this.x = x
        this.y = y
        this.z = z
        this.width = width
        this.height = height
        this.length = length
        this.orient = orient

        this.pitch = 0
        this.yaw = 0
        this.roll = 0

        this.color = color
        this.railColor = railColor

        this.rails = rails //list of directions to make rails in (NSEW)
        this.railThick = 0.2
        this.railHeight = 0.4

        this.name = "Piece"

        this.body; //for later definition
        this.mesh;

        this.railBodies = {} //for example, "N" --> CANNON.Body object
        this.railMeshes = {} //see comment above
    }
}

//all pieces that can be a flat square
export class Block extends Piece{
    constructor(width, height, length, orient = "Z", size = 1, rails){
        if (orient == "Z"){
            super(0, 0, 0, width, height, length * size, orient, rails)
        } else if (orient == "X") {
            super(0, 0, 0, width * size, height, length, orient, rails)
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
     * @param {Block} other other block to snap to (on x-z plane)
     */
    snapTo(other, dir){
        let ol = other.length
        let ow = other.width

        let ox = other.x
        let oz = other.z

        if (dir == "N"){
            this.setPosition(ox, this.y, oz + ol + this.length)
        } else if (dir == "S"){
            this.setPosition(ox, this.y, oz - ol - this.length)
        } else if (dir == "E"){
            this.setPosition(ox - ow - this.width, this.y, oz)
        } else if (dir == "W"){
            this.setPosition(ox + ow + this.width, this.y, oz)
        }
        console.log(this.body)
    }
    
    makeBlock(scene, world) {
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
            this.makeRails(scene, world)
        }
    }

    makeRails(scene, world){
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