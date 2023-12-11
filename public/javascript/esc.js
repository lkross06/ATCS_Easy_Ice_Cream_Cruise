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