export default class initScene {
  constructor(canvasId) {
    // NOTE: Core components to initialize Three.js app.
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;

    // NOTE: Camera params;
    this.fov = 45;
    this.nearPlane = 1;
    this.farPlane = 1000;
    this.canvasId = canvasId;

    // NOTE: Additional components.
    this.clock = undefined;

    // NOTE: New camera controls variables.
    this.mouseX = 0;
    this.mouseY = 0;
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;

    // NOTE: Lighting is basically required.
    this.ambientLight = undefined;
    this.directionalLight = undefined;
  }

  initialize() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    this.camera.position.z = 24;
    this.camera.position.y = 8;

    // NOTE: Specify a canvas which is already created in the HTML.
    const canvas = document.getElementById(this.canvasId);
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('myThreeJsCanvas'),
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);
    this.clock = new THREE.Clock();
    

    // ambient light which is for the whole scene
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.ambientLight.castShadow = true;
    this.scene.add(this.ambientLight);

    //directional light - parallel sun rays
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 32, 64);
    this.scene.add(this.directionalLight);

    // if window resizes
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // NOTE: Declare uniforms to pass into glsl shaders.
    this.uniforms = {
        u_time: { type: 'f', value: 1.0 },
        colorB: { type: 'vec3', value: new THREE.Color(0xfff000) },
        colorA: { type: 'vec3', value: new THREE.Color(0xffffff) },
    };

    document.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }

  render() {
    // NOTE: Update uniform data on each render.
    this.uniforms.u_time.value += this.clock.getDelta();

    // Manual camera controls based on mouse position.
    const targetX = (this.mouseX - this.windowHalfX) / 100;
    const targetY = (this.mouseY - this.windowHalfY) / 100;

    this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
    this.camera.position.y += (-targetY - this.camera.position.y) * 0.05;

    this.camera.lookAt(this.scene.position);
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    this.mouseX = event.clientX - this.windowHalfX;
    this.mouseY = event.clientY - this.windowHalfY;
  }
}
