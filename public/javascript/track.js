class Block{
    constructor(x, y, z, width = 10, height = 1, length = 5, pitch = 0, yaw = 0) {
        this.x = x
        this.y = y
        this.z = z
        this.width = width
        this.height = height
        this.length = length
        this.pitch = pitch
        this.yaw = 0 // along the x-z axis
    }
    
    makeBlock() {
             
    }
}

class LeftTurn extends Block{

}

class RightTurn extends Block {

}