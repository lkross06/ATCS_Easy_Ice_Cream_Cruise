class Block{
    constructor(x = 0, y = 0, z = 0, width, height, length, pitch = 0, yaw = 0, hasRails = true, color = 0xd6D5cd, railColor = 0xFF0000, railWidth = 0.2, railHeight = 0.4) {
        this.x = x
        this.y = y
        this.z = z
        this.color = color
        this.railColor = railColor
        this.width = width
        this.height = height
        this.length = length
        this.pitch = pitch
        this.yaw = yaw // along the x-z axis
        this.hasRails = hasRails
        this.name = "Block"
        this.railWidth = railWidth
        this.railHeight = railHeight

        this.body; //for later definition
        this.mesh;

        this.lbody //left rail
        this.lmesh

        this.rbody //right rail
        this.rmesh
    }

    setPosition(x, y, z){
        this.x = x
        this.y = y
        this.z = z
        
        this.body.position.set(x, y, z) //update physics
        this.mesh.position.set(x, y, z) //update graphics
    }
    
    makeBlock(scene, world) {
        return
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
     * @param {Block} other other block to snap to
     */
    snapTo(other, dir){
        if (dir == "N"){ //use other for opposite axis to center
            this.setPosition(other.x, this.y, other.z + other.length + this.length)
        } else if (dir == "S"){
            this.setPosition(other.x, this.y, other.z - other.length - this.length)
        } else if (dir == "W"){
            this.setPosition(other.x + other.width + this.width, this.y, other.z)
        } else if (dir == "E"){
            this.setPosition(other.x - other.width - other.width - this.width, this.y, other.z)
        }
    }
}

/**
 * list of block types
 * straight -- 10x20 straight block
 * turn -- 10x10 90 degree turn (left or right)
 * checkpoint -- 10x5 green checkpoint (turns blue after collision)
 * ramp -- 10x10x10 90 degree triangle ramp (ramp up and ramp down)
 */

class Straight extends Block{
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, 10, 1, 20, pitch, yaw, hasRails)
        this.name = "Straight"
    }
}

export class StraightX extends Straight{
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
        this.name = "StraightX"
    }

    makeBlock(scene, world) {

        //physics
        let body = new CANNON.Body({mass: 0})
        let shape = new CANNON.Box(new CANNON.Vec3(this.length, this.height, this.width))
        
        body.position.set(this.x, this.y, this.z)

        body.addShape(shape)

        world.add(body)
        this.body = body

        //visuals
        let geo = new THREE.BoxGeometry(this.length *2, this.height*2, this.width * 2)

        let material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        let mesh = new THREE.Mesh(geo, material)

        mesh.position.set(this.x, this.y, this.z)

        scene.add(mesh)
        this.mesh = mesh
    }


}

export class StraightZ extends Straight{

    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
        this.name = "StraightX"
    }

    makeBlock(scene, world) {
        
        //physics
        let body = new CANNON.Body({mass: 0})
        let shape = new CANNON.Box(new CANNON.Vec3(this.width, this.height, this.length))
        
        body.position.set(this.x, this.y, this.z)

        body.addShape(shape)

        world.add(body)
        this.body = body

        //visuals
        let geo = new THREE.BoxGeometry(this.width *2, this.height*2, this.length * 2)

        let material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        let mesh = new THREE.Mesh(geo, material)

        mesh.position.set(this.x, this.y, this.z)

        scene.add(mesh)
        this.mesh = mesh

        if (this.hasRails){
            this.makeRails(scene, world)
        }
    }

    makeRails(scene, world){
        /**
        east (neg x)

        x = this.x - this.width + this.railwidth
        length = this.length
        width = this.railwidth
        height = this.railheight
        */
        //physics
        let lbody = new CANNON.Body({mass: 0})
        let lshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.length))
        
        lbody.position.set(this.x - this.width + this.railWidth, this.y + this.height + this.railHeight, this.z)
        // lbody.position.set(5, 5, 5)

        lbody.addShape(lshape)

        world.add(lbody)
        this.lbody = lbody

        //visuals
        let geo = new THREE.BoxGeometry(this.railWidth * 2, this.railHeight * 2, this.length * 2)

        let material = new THREE.MeshPhongMaterial({
            color: this.railColor,
            emissive: this.railColor,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        let lmesh = new THREE.Mesh(geo, material)

        lmesh.position.set(this.x - this.width + this.railWidth, this.y + this.height + this.railHeight, this.z)

        scene.add(lmesh)
        this.lmesh = lmesh

        /**
        west (pos x)

        x = this.x + this.width - this.railwidth
        length = this.length
        width = this.railWidth
        height = this.railHeight
        */
       //physics
       let rbody = new CANNON.Body({mass: 0})
       let rshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.length))
       
       rbody.position.set(this.x + this.width - this.railWidth, this.y + this.height + this.railHeight, this.z)

       rbody.addShape(rshape)

       world.add(rbody)
       this.rbody = rbody

       //visuals
       
       let rmesh = new THREE.Mesh(geo, material)

       rmesh.position.set(this.x + this.width - this.railWidth, this.y + this.height + this.railHeight, this.z)

       scene.add(rmesh)
       this.rmesh = rmesh
    }

    setPosition(x, y, z){
        super.setPosition(x, y, z)

        if (this.hasRails){
            let leftx = x - this.width + this.railWidth
            let rightx = x + this.width - this.railWidth
            y += this.height + this.railHeight

            this.lbody.position.set(leftx, y, z)
            this.lmesh.position.set(leftx, y, z)

            this.rbody.position.set(rightx, y, z)
            this.rmesh.position.set(rightx, y, z)
        }
    }
}

class Turn extends Block{
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, 10, 1, 10, pitch, yaw, hasRails)
        this.name = "Turn"
    }
}

export class LeftTurn extends Turn{
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
        this.name = "LeftTurn"
    }

    makeBlock(scene, world) {
        
    }
}

export class RightTurn extends Turn {
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
        this.name = "RightTurn"
    }

    makeBlock(scene, world) {
        //physics
        let body = new CANNON.Body({mass: 0})
        let shape = new CANNON.Box(new CANNON.Vec3(this.width, this.height, this.length))
        
        body.position.set(this.x, this.y, this.z)

        body.addShape(shape)

        world.add(body)
        this.body = body

        //visuals
        let geo = new THREE.BoxGeometry(this.width *2, this.height*2, this.length * 2)

        let material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        let mesh = new THREE.Mesh(geo, material)

        mesh.position.set(this.x, this.y, this.z)

        scene.add(mesh)
        this.mesh = mesh
    }
}

class Checkpoint extends Block {
    //if the checkpoint isnt activated, it just looks like a straight piece
    //good for making symmetrical tracks with checkpoints
    constructor(x, y, z, activated = true, pitch, yaw, hasRails){
        super(x, y, z, 10, 1, 5, pitch, yaw, hasRails)

        this.activated = activated
        if (this.activated){
            this.color = 0x00FF00
            this.checked = false //true when car goes over it
            this.checkedColor = 0x0000FF
        }
        this.name = "Checkpoint"
    }

    setChecked(checked){
        if (this.activated) {
            this.checked = checked
            if (this.checked){
                this.mesh.material.color = new THREE.Color(this.checkedColor)
                this.mesh.material.emissive = new THREE.Color(this.checkedColor)
            }
        }
    }
}

export class CheckpointX extends Checkpoint {

    constructor(x, y, z, actiavted, pitch, yaw, hasRails){
        super(x, y, z, actiavted, pitch, yaw, hasRails)
        this.name = "CheckpointX"
    }

    makeBlock(scene, world) {
        //physics
        let body = new CANNON.Body({mass: 0})
        let shape = new CANNON.Box(new CANNON.Vec3(this.width, this.height, this.length))
        
        body.position.set(this.x, this.y, this.z)

        body.addShape(shape)

        world.add(body)
        this.body = body

        //visuals
        let geo = new THREE.BoxGeometry(this.width *2, this.height*2, this.length * 2)

        let material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        let mesh = new THREE.Mesh(geo, material)

        mesh.position.set(this.x, this.y, this.z)

        scene.add(mesh)
        this.mesh = mesh
    }
}

export class CheckpointZ extends Checkpoint {

    constructor(x, y, z, activated, pitch, yaw, hasRails){
        super(x, y, z, activated, pitch, yaw, hasRails)
        this.name = "CheckpointZ"
    }

    makeBlock(scene, world) {
        //physics
        let body = new CANNON.Body({mass: 0})
        let shape = new CANNON.Box(new CANNON.Vec3(this.width, this.height, this.length))

        body.position.set(this.x, this.y, this.z)

        body.addShape(shape)

        world.add(body)
        this.body = body

        //visuals
        let geo = new THREE.BoxGeometry(this.width *2, this.height*2, this.length * 2)

        let material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,     
            side: THREE.DoubleSide,
            flatShading: true,
        })

        let mesh = new THREE.Mesh(geo, material)

        mesh.position.set(this.x, this.y, this.z)

        scene.add(mesh)
        this.mesh = mesh

        if (this.hasRails){
            this.makeRails(scene, world)
        }
    }

    makeRails(scene, world){
        /**
        east (neg x)

        x = this.x - this.width + this.railwidth
        length = this.length
        width = this.railwidth
        height = this.railheight
        */
        //physics
        let lbody = new CANNON.Body({mass: 0})
        let lshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.length))
        
        lbody.position.set(this.x - this.width + this.railWidth, this.y + this.height + this.railHeight, this.z)
        // lbody.position.set(5, 5, 5)

        lbody.addShape(lshape)

        world.add(lbody)
        this.lbody = lbody

        //visuals
        let geo = new THREE.BoxGeometry(this.railWidth * 2, this.railHeight * 2, this.length * 2)

        let material = new THREE.MeshPhongMaterial({
            color: this.railColor,
            emissive: this.railColor,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        let lmesh = new THREE.Mesh(geo, material)

        lmesh.position.set(this.x - this.width + this.railWidth, this.y + this.height + this.railHeight, this.z)

        scene.add(lmesh)
        this.lmesh = lmesh

        /**
        west (pos x)

        x = this.x + this.width - this.railwidth
        length = this.length
        width = this.railWidth
        height = this.railHeight
        */
       //physics
       let rbody = new CANNON.Body({mass: 0})
       let rshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.length))
       
       rbody.position.set(this.x + this.width - this.railWidth, this.y + this.height + this.railHeight, this.z)

       rbody.addShape(rshape)

       world.add(rbody)
       this.rbody = rbody

       //visuals
       
       let rmesh = new THREE.Mesh(geo, material)

       rmesh.position.set(this.x + this.width - this.railWidth, this.y + this.height + this.railHeight, this.z)

       scene.add(rmesh)
       this.rmesh = rmesh
    }

    setPosition(x, y, z){
        super.setPosition(x, y, z)

        if (this.hasRails){
            let leftx = x - this.width + this.railWidth
            let rightx = x + this.width - this.railWidth
            y += this.height + this.railHeight

            this.lbody.position.set(leftx, y, z)
            this.lmesh.position.set(leftx, y, z)

            this.rbody.position.set(rightx, y, z)
            this.rmesh.position.set(rightx, y, z)
        }
    }
}

class Ramp extends Block{
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, 10, 10, 10, pitch, yaw, hasRails)
        this.name = "Ramp"
    }
}

class RampUpX extends Ramp{
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
        this.name = "RampUpX"
    }

    makeBlock(scene, world){

    }
}

class RampDownX extends Ramp{
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
        this.name = "RampDownX"
    }

    makeBlock(scene, world){
        
    }
}

class RampUpZ extends Ramp{
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
        this.name = "RampUpZ"
    }

    makeBlock(scene, world){
        
    }
}

class RampDownZ extends Ramp{
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
        this.name = "RampDownZ"
    }

    makeBlock(scene, world){
        
    }
}