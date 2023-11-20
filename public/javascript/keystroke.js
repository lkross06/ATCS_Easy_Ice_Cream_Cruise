function getPointerLock() { // Pointer Lock to hide mouse while racing
    document.onclick = function() {
        container.requestPointerLock()
    }
    document.addEventListener('pointerlockchange', lockChange, false)
}

function listenForPlayerMovement() {
    var onKeyDown = function(event) {
        switch(event.keyCode) {
            case 38: //up
            case 87: // W
                moveForward = true
                break
            case 37: //left
            case 65: // A
                moveLeft = true
                break
            case 40: //down
            case 83: // S
                moveBackward = true
                break
            case 39: //right
            case 68: // D
                moveRight = true
                break
        }
    }

    var onKeyUp = function(event) {
        switch(event.keyCode) {
            case 38: //up
            case 87: // W
                moveForward = false
                break
            case 37: //left
            case 65: // A
                moveLeft = false
                break
            case 40: //down
            case 83: // S
                moveBackward = false
                break
            case 39: //right
            case 68: // D
                moveRight = false
                break
        }
    }

    document.addEventListener('keydown', onKeyDown, false)
    document.addEventListener('keyup', onKeyUp, false)
}