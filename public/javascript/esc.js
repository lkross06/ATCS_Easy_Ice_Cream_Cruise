// handle escape menu logic
let isEscapeMenuVisible = false;

// Function to handle key press events
function handleKeyPress(e) {
    // Check if the "Esc" key is pressed
    if (e.keyCode === 27) { 
        isEscapeMenuVisible = !isEscapeMenuVisible
        // Call a function to show or hide the escape menu based on its visibility
        if (isEscapeMenuVisible) {
            showEscapeMenu();
        } else {
            hideEscapeMenu();
        }
    }
}

function showEscapeMenu() {
    document.getElementById('escape-menu').classList.remove('hidden');
}

function hideEscapeMenu() {
    console.log("eee")
    console.log("Escape menu element:", document.getElementById('escape-menu'))
    isEscapeMenuVisible = false
    document.getElementById('escape-menu').classList.add('hidden');
}


window.addEventListener('keydown', handleKeyPress)

function goToHome() {
// Add logic to navigate to the home page
}

function goToSettings() {
// Add logic to navigate to the settings page
}