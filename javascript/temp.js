// Set up the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a car
const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
const carMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const car = new THREE.Mesh(carGeometry, carMaterial);
scene.add(car);

// Create a large flat platform
const platformGeometry = new THREE.PlaneGeometry(20, 20);
const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });
const platform = new THREE.Mesh(platformGeometry, platformMaterial);
platform.rotation.x = Math.PI / 2;
scene.add(platform);

// Set up the camera position
const cameraOffset = new THREE.Vector3(0, 2, -5);
camera.position.copy(car.position).add(cameraOffset);
camera.lookAt(car.position);

// Handle keyboard input for car movement
const keyboardState = {
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener('keydown', (event) => {
    handleKeyDown(event.key);
});

window.addEventListener('keyup', (event) => {
    handleKeyUp(event.key);
});

function handleKeyDown(key) {
    if (keyboardState.hasOwnProperty(key)) {
        keyboardState[key] = true;
    }
}

function handleKeyUp(key) {
    if (keyboardState.hasOwnProperty(key)) {
        keyboardState[key] = false;
    }
}

// Update function for animation
function animate() {
    requestAnimationFrame(animate);

    // Update car rotation based on keyboard input
    if (keyboardState.a) car.rotation.y += 0.03; // Turn left
    if (keyboardState.d) car.rotation.y -= 0.03; // Turn right

    // Update car position based on keyboard input
    const speed = 0.1;
    if (keyboardState.s) {
        car.position.x -= speed * Math.sin(car.rotation.y);
        car.position.z -= speed * Math.cos(car.rotation.y);
    }
    if (keyboardState.w) {
        car.position.x += speed * Math.sin(car.rotation.y);
        car.position.z += speed * Math.cos(car.rotation.y);
    }

    // Update camera position and rotation to follow the car
    const relativeCameraOffset = new THREE.Vector3(0, 2, -5).applyMatrix4(car.matrixWorld);
    camera.position.copy(relativeCameraOffset);
    camera.lookAt(car.position);

    // Render the scene
    renderer.render(scene, camera);
}

animate();