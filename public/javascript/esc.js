// handle escape menu logic
let isEscapeMenuVisible = false;

/**
 * handles escape key press
 * @param {*} e key event
 */
function handleKeyPress(e) {
    if (e.keyCode === 27){ 
        isEscapeMenuVisible = !isEscapeMenuVisible
        // call a function to show or hide the escape menu based on its visibility
        if (isEscapeMenuVisible) {
            showEscapeMenu();
        } else {
            hideEscapeMenu();
        }
    }
}

/**
 * shows the escape menu modal
 * also gets the player's keybinds for the settings modal
 */
function showEscapeMenu() {
    document.getElementById('modal').style.display = "block"

    let forward = parseInt(sessionStorage.getItem("forwardKey"))
    let backward = parseInt(sessionStorage.getItem("backwardKey"))
    let left = parseInt(sessionStorage.getItem("leftKey"))
    let right = parseInt(sessionStorage.getItem("rightKey"))

    let keys = [forward, backward, left, right]
    let id_keys = ['forward-key', 'backward-key', 'left-key', 'right-key']

    for (let i = 0; i < keys.length; i++){
        let keycode = keys[i]
        let id = id_keys[i]
        if (keycode >= 37 && keycode <= 40) {
        let arrows = ["←", "↑", "→", "↓"]
        document.getElementById(id).value = arrows[keycode - 37]
        } else {
            document.getElementById(id).value = String.fromCharCode(keycode)
        }
    }
}

/**
 * hides the escape menu modal
 */
function hideEscapeMenu() {
    isEscapeMenuVisible = false
    document.getElementById('modal').style.display = "none"
    document.getElementById("esc-menu").style.display = "flex"
    document.getElementById("settings-menu").style.display = "none"
}

/**
 * closes escape menu modal and opens settings menu modal
 */
function goToSettingsMenu() {
    document.getElementById("esc-menu").style.display = "none"
    document.getElementById("settings-menu").style.display = "flex"
}

/**
 * closes settings menu modal and opens escape menu modal
 */
function goToEscMenu() {
    document.getElementById("esc-menu").style.display = "flex"
    document.getElementById("settings-menu").style.display = "none"
}


window.addEventListener('keydown', handleKeyPress)

/**
 * saves a set of keybinds (specified in settings menu) to user_data and session storage
 */
function saveSettings() {
    const forwardKey = document.getElementById('forward-key').value.toUpperCase();
    const backwardKey = document.getElementById('backward-key').value.toUpperCase();
    const leftKey = document.getElementById('left-key').value.toUpperCase();
    const rightKey = document.getElementById('right-key').value.toUpperCase();

    let keys = [forwardKey, backwardKey, leftKey, rightKey]
    let ss_keys = ["forwardKey", "backwardKey", "leftKey", "rightKey"]

    for (let i = 0; i < ss_keys.length; i++){
        let key = keys[i]
        let ss_key = ss_keys[i]
        let keycode = key.charCodeAt(0)

        if (key == "←") {
            sessionStorage.setItem(ss_key, "37")
        } else if (key == "↑") {
            sessionStorage.setItem(ss_key, "38")
        } else if (key == "→") {
            sessionStorage.setItem(ss_key, "39")
        } else if (key == "↓") {
            sessionStorage.setItem(ss_key, "40")
        } else {
            sessionStorage.setItem(ss_key, keycode)
        }
    }
}

// example of capturing key inputs for keybinds
document.querySelectorAll('.keybind input').forEach(input => {
    input.addEventListener('keydown', (event) => {
        // Prevents the default action
        event.preventDefault();
        
        // Sets the input value to the pressed key
        let keycode = event.keyCode

        //see js keycode library https://www.npmjs.com/package/keycode-js
        //check arrow keys first
        if (keycode >= 37 && keycode <= 40) {
            let arrows = ["←", "↑", "→", "↓"]
            input.value = arrows[keycode - 37]
        }//if its a printable character (not esc) and its not space or R (already bound)
        else if ((keycode >= 48 && keycode <= 90 && keycode !== 82) || (keycode >= 186 && keycode <= 222)){
            input.value = event.key.toUpperCase();
        } 
    });
});