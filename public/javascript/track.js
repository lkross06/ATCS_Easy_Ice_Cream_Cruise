class Block{
    constructor(x, y, z, width, height, length, pitch = 0, yaw = 0, hasRails = true, color = 0xd6D5cd, railColor = 0xFF0000) {
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

        this.body; //for later definition
        this.mesh;
    }
    
    makeBlock(scene, world) {
        return
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

    makeBlock() {
        
    }
}

export class RightTurn extends Turn {
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
        this.name = "RightTurn"
    }

    makeBlock() {
        
    }
}

class Checkpoint extends Block {
    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y + 0.01, z, 10, 1, 5, pitch, yaw, hasRails, 0x00FF00)
        this.name = "Checkpoint"
        this.checked = false //true when car goes over it
        this.checkedColor = 0x0000FF
    }

    setChecked(checked){
        this.checked = checked
        if (this.checked){
            this.mesh.material.color = new THREE.Color(this.checkedColor)
            this.mesh.material.emissive = new THREE.Color(this.checkedColor)
        }
    }
}

export class CheckpointX extends Checkpoint {

    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
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
    }
}

export class CheckpointZ extends Checkpoint {

    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, pitch, yaw, hasRails)
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

    }
}

class Ramp extends Block(){
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