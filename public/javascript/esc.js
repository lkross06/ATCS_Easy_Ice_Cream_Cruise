// handle escape menu logic
let isEscapeMenuVisible = false;

//handle key press events
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

function showEscapeMenu() {
    document.getElementById('modal').style.display = "block"

    document.getElementById('forward-key').value = String.fromCharCode(parseInt(sessionStorage.getItem("forwardKey")));
    document.getElementById('backward-key').value = String.fromCharCode(parseInt(sessionStorage.getItem("backwardKey")));
    document.getElementById('left-key').value = String.fromCharCode(parseInt(sessionStorage.getItem("leftKey")));
    document.getElementById('right-key').value = String.fromCharCode(parseInt(sessionStorage.getItem("rightKey")));
}

function hideEscapeMenu() {
    isEscapeMenuVisible = false
    document.getElementById('modal').style.display = "none"
    document.getElementById("esc-menu").style.display = "flex"
    document.getElementById("settings-menu").style.display = "none"
}

function goToSettingsMenu() {
    document.getElementById("esc-menu").style.display = "none"
    document.getElementById("settings-menu").style.display = "flex"
}

function goToEscMenu() {
    document.getElementById("esc-menu").style.display = "flex"
    document.getElementById("settings-menu").style.display = "none"
}


window.addEventListener('keydown', handleKeyPress)

function saveSettings() {
    // TODO: save keybinds
    const forwardKey = document.getElementById('forward-key').value.toUpperCase();
    const backwardKey = document.getElementById('backward-key').value.toUpperCase();
    const leftKey = document.getElementById('left-key').value.toUpperCase();
    const rightKey = document.getElementById('right-key').value.toUpperCase();

    sessionStorage.setItem("forwardKey", forwardKey.charCodeAt(0))
    sessionStorage.setItem("backwardKey", backwardKey.charCodeAt(0))
    sessionStorage.setItem("leftKey", leftKey.charCodeAt(0))
    sessionStorage.setItem("rightKey", rightKey.charCodeAt(0))

    // TODO:  code to handle keybind changes
}



// Example of capturing key inputs for keybinds
document.querySelectorAll('.keybind input').forEach(input => {
    input.addEventListener('keydown', (event) => {
        // Prevents the default action
        event.preventDefault();
        
        // Sets the input value to the pressed key
        input.value = event.key.toUpperCase();
    });
});