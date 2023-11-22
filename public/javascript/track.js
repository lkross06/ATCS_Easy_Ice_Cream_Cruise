// Set up scene, camera, and renderer
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

const wheelBody1 = new CANNON.Vector3

// Set up the camera position
const cameraOffset = new THREE.Vector3(0, 2, -5);
camera.position.copy(car.position).add(cameraOffset);
camera.lookAt(car.position);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Create a simple racing track with a turn and guardrails using cubes
const trackWidth = 10;
const trackHeight = 0.1;
const trackLength = 200;
const numberOfSegments = 20;
for (let i = 0; i < numberOfSegments; i++) {
    const trackSegment = new THREE.BoxGeometry(trackWidth, trackHeight, trackLength / numberOfSegments);
    const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const trackPiece = new THREE.Mesh(trackSegment, trackMaterial);

    // Position each track piece to form a continuous track with a turn
    trackPiece.position.z = (i - numberOfSegments / 2) * (trackLength / numberOfSegments);
    if (i < numberOfSegments / 2) {
        trackPiece.position.x = i * (trackWidth / numberOfSegments);
    } else {
        trackPiece.position.x = (numberOfSegments - i) * (trackWidth / numberOfSegments);
    }
    scene.add(trackPiece);

    // Add guardrails
    const guardrailGeometry = new THREE.BoxGeometry(0.1, 0.2, trackWidth);
    const guardrailMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const leftGuardrail = new THREE.Mesh(guardrailGeometry, guardrailMaterial);
    const rightGuardrail = new THREE.Mesh(guardrailGeometry, guardrailMaterial);
    
    // Adjust the position of guardrails based on the track width
    leftGuardrail.position.set(trackPiece.position.x - trackWidth / 2, 0.1, trackPiece.position.z);
    rightGuardrail.position.set(trackPiece.position.x + trackWidth / 2, 0.1, trackPiece.position.z);
    
    scene.add(leftGuardrail, rightGuardrail);
}

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

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);

    // Update car rotation based on keyboard input
    if (keyboardState.a) car.rotation.y += 0.03; // Turn left
    if (keyboardState.d) car.rotation.y -= 0.03; // Turn right

    // Update car position based on keyboard input
    const speed = 0.5;
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
};

animate();
