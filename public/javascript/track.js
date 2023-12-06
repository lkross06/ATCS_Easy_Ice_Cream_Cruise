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
    }
    
    makeBlock() {
        
    }
}

export class StraightX extends Block{

    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, 10, 1, 20, pitch, yaw, hasRails)
        this.name = "StraightX"
    }

    makeBlock(scene, world) {

        //physics
        let body = new CANNON.Body({mass: 0})
        let shape = new CANNON.Box(new CANNON.Vec3(this.length, this.height, this.width))
        
        body.position.set(this.x, this.y, this.z)

        body.addShape(shape)

        world.add(body)

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

export class StraightZ extends Block{

    constructor(x, y, z, pitch, yaw, hasRails){
        super(x, y, z, 10, 1, 20, pitch, yaw, hasRails)
        this.name = "StraightZ"
    }

    makeBlock(scene, world) {
        
        //physics
        let body = new CANNON.Body({mass: 0})
        let shape = new CANNON.Box(new CANNON.Vec3(this.width, this.height, this.length))
        
        body.position.set(this.x, this.y, this.z)

        body.addShape(shape)

        world.add(body)

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

export class LeftTurn extends Block{
    makeBlock() {
        
    }
}

export class RightTurn extends Block {
    makeBlock() {
        
    }
}
export class CheckpointX extends Block {

    constructor(x, y , z, pitch, yaw, hasRails){
        super(x, y + 0.01, z, 10, 1, 5, pitch, yaw, hasRails, color=0x00FF00)
        this.name = "CheckpointX"
    }

    makeBlock(scene, world) {
        //physics
        let body = new CANNON.Body({mass: 0})
        let shape = new CANNON.Box(new CANNON.Vec3(this.width, this.height, this.length))
        
        body.position.set(this.x, this.y, this.z)

        body.addShape(shape)

        world.add(body)

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

export class CheckpointZ extends Block {

    constructor(x, y, z, pitch, yaw, hasRails){
        //y += 0.01 so its above straightX and straightZ
        super(x, y + 0.01, z, 10, 1, 5, pitch, yaw, hasRails, 0x00FF00, 0x00FF00)
        this.name = "CheckpointZ"
    }

    makeBlock(scene, world) {
        //physics
        let body = new CANNON.Body({mass: 0})
        let shape = new CANNON.Box(new CANNON.Vec3(this.width, this.height, this.length))

        body.position.set(this.x, this.y, this.z)

        body.addShape(shape)

        world.add(body)

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