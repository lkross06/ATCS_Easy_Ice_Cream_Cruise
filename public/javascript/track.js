export class Block{
    constructor(x, y, z, width = 10, height = 1, length = 20, pitch = 0, yaw = 0, hasRails) {
        this.x = x
        this.y = y
        this.z = z
        this.color = 0xd6D5cd
        this.railColor = 0xFF0000
        this.width = width
        this.height = height
        this.length = length
        this.pitch = pitch
        this.yaw = 0 // along the x-z axis
        this.hasRails = hasRails
    }
    
    makeBlock() {
        
    }
}

export class StraightX extends Block{
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
export class Checkpoint extends Block {
    makeBlock() {
        
    }
}