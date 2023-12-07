class Block{
    constructor(width, height, length, orient = "Z", hasRails = true, color = 0xd6D5cd, railColor = 0xFF0000) {
        this.x = 0
        this.y = 0
        this.z = 0
        this.color = color
        this.railColor = railColor
        this.width = width
        this.height = height
        this.length = length
        this.pitch = 0
        this.yaw = 0 // along the x-z axis
        this.hasRails = hasRails
        this.name = "Block"
        this.railWidth = 0.2
        this.railHeight = 0.4
        this.railLength = this.length //default for z axis
        this.orient = orient

        this.body; //for later definition
        this.mesh;

        this.lbody //left rail
        this.lmesh

        this.rbody //right rail
        this.rmesh
    }

    setRotation(pitch, yaw){
        this.pitch = pitch
        this.yaw = yaw
    }

    setPosition(x, y, z){
        this.x = x
        this.y = y
        this.z = z
        
        this.body.position.set(x, y, z) //update physics
        this.mesh.position.set(x, y, z) //update graphics

        if (this.hasRails){
            if (this.orient == "Z"){
                let leftx = x - this.width + this.railWidth
                let rightx = x + this.width - this.railWidth
                y += this.height + this.railHeight

                this.lbody.position.set(leftx, y, z)
                this.lmesh.position.set(leftx, y, z)

                this.rbody.position.set(rightx, y, z)
                this.rmesh.position.set(rightx, y, z)
            } else if (this.orient == "X"){
                let leftz = z - this.length + this.railWidth
                let rightz = z + this.length - this.railWidth
                y += this.height + this.railHeight

                this.lbody.position.set(x, y, leftz)
                this.lmesh.position.set(x, y, leftz)

                this.rbody.position.set(x, y, rightz)
                this.rmesh.position.set(x, y, rightz)
            }
        }
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
        let ol = other.length
        let ow = other.width

        let ox = other.x
        let oz = other.z

        if (other.orient == "Z"){
            if (dir == "N"){ //use other for opposite axis to center
                this.setPosition(ox, this.y, oz + ol + this.length)
            } else if (dir == "S"){
                this.setPosition(ox, this.y, oz - ol - this.length)
            } else if (dir == "W"){
                this.setPosition(ox + ow + this.width, this.y, oz)
            } else if (dir == "E"){
                this.setPosition(ox - ow - this.width, this.y, oz)
            }
        } else if (other.orient == "X"){
            if (dir == "N"){ //use other for opposite axis to center
                
                this.setPosition(ox, this.y, oz + ol + this.length)
            } else if (dir == "S"){
                
                this.setPosition(ox, this.y, oz - ol - this.length)
            } else if (dir == "E"){
                
                this.setPosition(ox - ow - this.width, this.y, oz)
            } else if (dir == "W"){
                this.setPosition(ox + ow + this.width, this.y, oz)
            }
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

export class Straight extends Block{
    constructor(len = 1, orient, hasRails){ //len = multiplyier for 10x10 length
        super(10, 1, 10 * len, orient, hasRails)
        this.name = "Straight"

        if (this.orient == "X") {
            //swap len and width
            let temp = this.width
            this.width = this.length
            this.length = temp

            this.railLength = this.length
        }
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
        left side

        x = this.x + this.width - this.railwidth
        length = this.length
        width = this.railwidth
        height = this.railheight
        */
        //physics
        let lbody = new CANNON.Body({mass: 0})
        let lshape;
        let geo;
        
        if (this.orient == "Z"){
            lbody.position.set(this.x + this.width - this.railWidth, this.y + this.height + this.railHeight, this.z)
            lshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.railLength))
            geo = new THREE.BoxGeometry(this.railWidth * 2, this.railHeight * 2, this.railLength * 2)
        } 
        else if (this.orient == "X"){
            lbody.position.set(this.x, this.y + this.height + this.railHeight, this.z + this.length - this.railWidth)
            lshape = new CANNON.Box(new CANNON.Vec3(this.width, this.railHeight, this.railWidth))
            geo = new THREE.BoxGeometry(this.width * 2, this.railHeight * 2, this.railWidth * 2)
        }
        lbody.addShape(lshape)

        world.add(lbody)
        this.lbody = lbody

        //visuals
        let material = new THREE.MeshPhongMaterial({
            color: this.railColor,
            emissive: this.railColor,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        let lmesh = new THREE.Mesh(geo, material)

        if (this.orient == "Z"){
            lmesh.position.set(this.x + this.width - this.railWidth, this.y + this.height + this.railHeight, this.z)
        } 
        else if (this.orient == "X"){
            lmesh.position.set(this.x, this.y + this.height + this.railHeight, this.z + this.length - this.railWidth)
        }
        scene.add(lmesh)
        this.lmesh = lmesh

        /**
        right

        x = this.x - this.width + this.railwidth
        length = this.length
        width = this.railWidth
        height = this.railHeight
        */
       //physics
       let rbody = new CANNON.Body({mass: 0})
        let rshape;
        
        if (this.orient == "Z"){
            rbody.position.set(this.x - this.width + this.railWidth, this.y + this.height + this.railHeight, this.z)
            rshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.railLength))
        } 
        else if (this.orient == "X"){
            rbody.position.set(this.x, this.y + this.height + this.railHeight, this.z - this.length + this.railWidth)
            rshape = new CANNON.Box(new CANNON.Vec3(this.railLength, this.railHeight, this.railWidth))
        }
        rbody.addShape(rshape)

        world.add(rbody)
        this.rbody = rbody

       //visuals
       
       let rmesh = new THREE.Mesh(geo, material)

        if (this.orient == "Z"){
            rmesh.position.set(this.x - this.width + this.railWidth, this.y + this.height + this.railHeight, this.z)
        } else if (this.orient == "X"){
            rmesh.position.set(this.x, this.y + this.height + this.railHeight, this.z - this.length + this.railWidth)
        }
       scene.add(rmesh)
       this.rmesh = rmesh
    }
}

export class LeftTurn extends Block{
    constructor(orient, hasRails){
        super(orient, hasRails)
        this.name = "LeftTurn"
    }

    makeBlock(scene, world) {
        
    }
}

export class RightTurn extends Block {
    constructor(orient, hasRails){
        super(orient, hasRails)
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

export class Checkpoint extends Block {
    //if the checkpoint isnt activated, it just looks like a straight piece
    //good for making symmetrical tracks with checkpoints
    constructor(orient, hasRails){
        super(10, 1, 5, orient, hasRails)

        this.color = 0x00FF00
        this.checked = false //true when car goes over it
        this.checkedColor = 0x0000FF

        if (this.orient == "X") {
            //swap len and width
            let temp = this.width
            this.width = this.length
            this.length = temp

            this.railLength = this.length
        }
        this.name = "Checkpoint"
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
        left side

        x = this.x + this.width - this.railwidth
        length = this.length
        width = this.railwidth
        height = this.railheight
        */
        //physics
        let lbody = new CANNON.Body({mass: 0})
        let lshape;
        let geo;
        
        if (this.orient == "Z"){
            lbody.position.set(this.x + this.width - this.railWidth, this.y + this.height + this.railHeight, this.z)
            lshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.railLength))
            geo = new THREE.BoxGeometry(this.railWidth * 2, this.railHeight * 2, this.railLength * 2)
        } 
        else if (this.orient == "X"){
            lbody.position.set(this.x, this.y + this.height + this.railHeight, this.z + this.length - this.railWidth)
            lshape = new CANNON.Box(new CANNON.Vec3(this.width, this.railHeight, this.railWidth))
            geo = new THREE.BoxGeometry(this.width * 2, this.railHeight * 2, this.railWidth * 2)
        }

        lbody.addShape(lshape)

        world.add(lbody)
        this.lbody = lbody

        //visuals
        let material = new THREE.MeshPhongMaterial({
            color: this.railColor,
            emissive: this.railColor,     
            side: THREE.DoubleSide,
            flatShading: true,
        })
        
        let lmesh = new THREE.Mesh(geo, material)

        if (this.orient == "Z"){
            lmesh.position.set(this.x + this.width - this.railWidth, this.y + this.height + this.railHeight, this.z)
        } 
        else if (this.orient == "X"){
            lmesh.position.set(this.x, this.y + this.height + this.railHeight, this.z + this.length - this.railWidth)
        }
        scene.add(lmesh)
        this.lmesh = lmesh

        /**
        right

        x = this.x - this.width + this.railwidth
        length = this.length
        width = this.railWidth
        height = this.railHeight
        */
       //physics
       let rbody = new CANNON.Body({mass: 0})
        let rshape;
        
        if (this.orient == "Z"){
            rbody.position.set(this.x - this.width + this.railWidth, this.y + this.height + this.railHeight, this.z)
            rshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.railLength))
        } 
        else if (this.orient == "X"){
            rbody.position.set(this.x, this.y + this.height + this.railHeight, this.z - this.length + this.railWidth)
            rshape = new CANNON.Box(new CANNON.Vec3(this.railLength, this.railHeight, this.railWidth))
        }
        rbody.addShape(rshape)

        world.add(rbody)
        this.rbody = rbody

       //visuals
       
       let rmesh = new THREE.Mesh(geo, material)

        if (this.orient == "Z"){
            rmesh.position.set(this.x - this.width + this.railWidth, this.y + this.height + this.railHeight, this.z)
        } else if (this.orient == "X"){
            rmesh.position.set(this.x, this.y + this.height + this.railHeight, this.z - this.length + this.railWidth)
        }
       scene.add(rmesh)
       this.rmesh = rmesh
    }

    setChecked(checked){
        this.checked = checked
        if (this.checked){
            this.mesh.material.color = new THREE.Color(this.checkedColor)
            this.mesh.material.emissive = new THREE.Color(this.checkedColor)
        }
    }
}


export class rightTurn extends Block{
   //if the checkpoint isnt activated, it just looks like a straight piece
    //good for making symmetrical tracks with checkpoints
    constructor(orient, hasRails){
        super(10, 1, 10, orient, hasRails)

        this.color = 0x00FF00
        this.checked = false //true when car goes over it
        this.checkedColor = 0x0000FF

        if (this.orient == "X") {
            //swap len and width
            let temp = this.width
            this.width = this.length
            this.length = temp

            this.railLength = this.length
        }
        this.name = "rightTurn"
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

    makeRails(scene, world) {
        // Assuming this.orient is either "Z" or "X"
    
        // Left rail
        let lbody = new CANNON.Body({ mass: 0 });
        let lshape;
        let geo;
    
        if (this.orient == "Z") {
            lbody.position.set(this.x + this.width - this.railWidth, this.y + this.height + this.railHeight, this.z);
            lshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.railLength));
            geo = new THREE.BoxGeometry(this.railWidth * 2, this.railHeight * 2, this.railLength * 2);
        } else if (this.orient == "X") {
            lbody.position.set(this.x, this.y + this.height + this.railHeight, this.z + this.length - this.railWidth);
            lshape = new CANNON.Box(new CANNON.Vec3(this.width, this.railHeight, this.railWidth));
            geo = new THREE.BoxGeometry(this.width * 2, this.railHeight * 2, this.railWidth * 2);
        }
    
        lbody.addShape(lshape);
        world.add(lbody);
        this.lbody = lbody;
    
        let material = new THREE.MeshPhongMaterial({
            color: this.railColor,
            emissive: this.railColor,
            side: THREE.DoubleSide,
            flatShading: true,
        });
    
        let lmesh = new THREE.Mesh(geo, material);
    
        if (this.orient == "Z") {
            lmesh.position.set(this.x + this.width - this.railWidth, this.y + this.height + this.railHeight, this.z);
        } else if (this.orient == "X") {
            lmesh.position.set(this.x, this.y + this.height + this.railHeight, this.z + this.length - this.railWidth);
        }
    
        scene.add(lmesh);
        this.lmesh = lmesh;
    
        // Front rail
        let fbody = new CANNON.Body({ mass: 0 });
        let fshape;
    
        if (this.orient == "Z") {
            fbody.position.set(this.x, this.y + this.height + this.railHeight, this.z + this.railLength);
            fshape = new CANNON.Box(new CANNON.Vec3(this.width, this.railHeight, this.railWidth));
        } else if (this.orient == "X") {
            fbody.position.set(this.x + this.length - this.railWidth, this.y + this.height + this.railHeight, this.z);
            fshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.railLength));
        }
    
        fbody.addShape(fshape);
        world.add(fbody);
        this.fbody = fbody;
    
        let fmesh = new THREE.Mesh(geo, material);
    
        if (this.orient == "Z") {
            fmesh.position.set(this.x, this.y + this.height + this.railHeight, this.z + this.railLength);
        } else if (this.orient == "X") {
            fmesh.position.set(this.x + this.length - this.railWidth, this.y + this.height + this.railHeight, this.z);
        }
    
        scene.add(fmesh);
        this.fmesh = fmesh;
    }    
}

export class leftTurn extends Block {
    constructor(orient, hasRails) {
        super(10, 1, 10, orient, hasRails);

        this.color = 0x00FF00;
        this.checked = false; // true when car goes over it
        this.checkedColor = 0x0000FF;

        if (this.orient == "X") {
            // swap len and width
            let temp = this.width;
            this.width = this.length;
            this.length = temp;

            this.railLength = this.length;
        }
        this.name = "leftTurn";
    }

    makeRails(scene, world) {
        // Assuming this.orient is either "Z" or "X"

        // Left rail
        let lbody = new CANNON.Body({ mass: 0 });
        let lshape;
        let geo;

        if (this.orient == "Z") {
            lbody.position.set(this.x - this.railWidth, this.y + this.height + this.railHeight, this.z);
            lshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.railLength));
            geo = new THREE.BoxGeometry(this.railWidth * 2, this.railHeight * 2, this.railLength * 2);
        } else if (this.orient == "X") {
            lbody.position.set(this.x, this.y + this.height + this.railHeight, this.z - this.railWidth);
            lshape = new CANNON.Box(new CANNON.Vec3(this.width, this.railHeight, this.railWidth));
            geo = new THREE.BoxGeometry(this.width * 2, this.railHeight * 2, this.railWidth * 2);
        }

        lbody.addShape(lshape);
        world.add(lbody);
        this.lbody = lbody;

        let material = new THREE.MeshPhongMaterial({
            color: this.railColor,
            emissive: this.railColor,
            side: THREE.DoubleSide,
            flatShading: true,
        });

        let lmesh = new THREE.Mesh(geo, material);

        if (this.orient == "Z") {
            lmesh.position.set(this.x - this.railWidth, this.y + this.height + this.railHeight, this.z);
        } else if (this.orient == "X") {
            lmesh.position.set(this.x, this.y + this.height + this.railHeight, this.z - this.railWidth);
        }

        scene.add(lmesh);
        this.lmesh = lmesh;

        // Front rail
        let fbody = new CANNON.Body({ mass: 0 });
        let fshape;

        if (this.orient == "Z") {
            fbody.position.set(this.x, this.y + this.height + this.railHeight, this.z - this.railLength);
            fshape = new CANNON.Box(new CANNON.Vec3(this.width, this.railHeight, this.railWidth));
        } else if (this.orient == "X") {
            fbody.position.set(this.x - this.railLength, this.y + this.height + this.railHeight, this.z);
            fshape = new CANNON.Box(new CANNON.Vec3(this.railWidth, this.railHeight, this.railLength));
        }

        fbody.addShape(fshape);
        world.add(fbody);
        this.fbody = fbody;

        let fmesh = new THREE.Mesh(geo, material);

        if (this.orient == "Z") {
            fmesh.position.set(this.x, this.y + this.height + this.railHeight, this.z - this.railLength);
        } else if (this.orient == "X") {
            fmesh.position.set(this.x - this.railLength, this.y + this.height + this.railHeight, this.z);
        }

        scene.add(fmesh);
        this.fmesh = fmesh;
    }
}
