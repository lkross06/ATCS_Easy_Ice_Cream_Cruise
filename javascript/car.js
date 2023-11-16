import keystroke from "./keystroke"
import * as THREE from three

class car {
    constructor(){
        this.x = 0
        this.y = 0
        this.z = 0

        this.velX = 0
        this.velY = 0
        this.velZ = 0

        this.accel = 0
        this.decel = 0

        this.grip = 0
        this.mass = 0
        
        this.rotation = new THREE.Euler(0, 0, 0, 'XYZ') //the angle of rotation of the x , y, and z axis in radians.

    }

    detectCollision(){

    }


}