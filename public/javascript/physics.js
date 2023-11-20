import initScene from "./initScene.js"


const test = new initScene('myThreeJsCanvas');
    test.initialize();
    test.animate();
    const axesHelper = new THREE.AxesHelper(8);
    test.scene.add(axesHelper);

    const physicsWorld = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
    })

    // create a ground body with a static plane
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      // infinte geometric plane
      shape: new CANNON.Plane(),
    });
    // rotate ground body by 90 degrees
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    physicsWorld.addBody(groundBody);

    const carBody = new CANNON.Body({
      mass: 5,
      position: new CANNON.Vec3(0, 6, 0),
      shape: new CANNON.Box(new CANNON.Vec3(4, 0.5, 2)),
    });

    const vehicle = new CANNON.RigidVehicle({
      chassisBody: carBody,
    });


    const mass = 1;
    const axisWidth = 5;
    const wheelShape = new CANNON.Sphere(1);
    const wheelMaterial = new CANNON.Material('wheel');
    const down = new CANNON.Vec3(0, -1, 0);

    const wheelBody1 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody1.addShape(wheelShape);
    wheelBody1.angularDamping = 0.4;
    vehicle.addWheel({
      body: wheelBody1,
      position: new CANNON.Vec3(-2, 0, axisWidth / 2),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const wheelBody2 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody2.addShape(wheelShape);
    wheelBody2.angularDamping = 0.4;
    vehicle.addWheel({
      body: wheelBody2,
      position: new CANNON.Vec3(-2, 0, -axisWidth / 2),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const wheelBody3 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody3.addShape(wheelShape);
    wheelBody3.angularDamping = 0.4;
    vehicle.addWheel({
      body: wheelBody3,
      position: new CANNON.Vec3(2, 0, axisWidth / 2),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    const wheelBody4 = new CANNON.Body({ mass, material: wheelMaterial });
    wheelBody4.addShape(wheelShape);
    wheelBody4.angularDamping = 0.4;
    vehicle.addWheel({
      body: wheelBody4,
      position: new CANNON.Vec3(2, 0, -axisWidth / 2),
      axis: new CANNON.Vec3(0, 0, 1),
      direction: down,
    });

    vehicle.addToWorld(physicsWorld);

    document.addEventListener('keydown', (event) => {
      const maxSteerVal = Math.PI / 8;
      const maxForce = 10;

      switch (event.key) {
        case 'w':
        case 'ArrowUp':
          vehicle.setWheelForce(maxForce, 0);
          vehicle.setWheelForce(maxForce, 1);
          break;

        case 's':
        case 'ArrowDown':
          vehicle.setWheelForce(-maxForce / 2, 0);
          vehicle.setWheelForce(-maxForce / 2, 1);
          break;

        case 'a':
        case 'ArrowLeft':
          vehicle.setSteeringValue(maxSteerVal, 0);
          vehicle.setSteeringValue(maxSteerVal, 1);
          break;

        case 'd':
        case 'ArrowRight':
          vehicle.setSteeringValue(-maxSteerVal, 0);
          vehicle.setSteeringValue(-maxSteerVal, 1);
          break;
      }
    });

    // reset car force to zero when key is released
    document.addEventListener('keyup', (event) => {
      switch (event.key) {
        case 'w':
        case 'ArrowUp':
          vehicle.setWheelForce(0, 0);
          vehicle.setWheelForce(0, 1);
          break;

        case 's':
        case 'ArrowDown':
          vehicle.setWheelForce(0, 0);
          vehicle.setWheelForce(0, 1);
          break;

        case 'a':
        case 'ArrowLeft':
          vehicle.setSteeringValue(0, 0);
          vehicle.setSteeringValue(0, 1);
          break;

        case 'd':
        case 'ArrowRight':
          vehicle.setSteeringValue(0, 0);
          vehicle.setSteeringValue(0, 1);
          break;
      }
    });

    const planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({
      wireframe: true,
      color: 0x00ff00,
    });
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.rotateX(-Math.PI / 2);
    test.scene.add(planeMesh);

    const boxGeometry = new THREE.BoxGeometry(8, 1, 4);
    const boxMaterial = new THREE.MeshNormalMaterial();
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    test.scene.add(boxMesh);

    const sphereGeometry1 = new THREE.SphereGeometry(1);
    const sphereMaterial1 = new THREE.MeshNormalMaterial();
    const sphereMesh1 = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
    test.scene.add(sphereMesh1);

    const sphereGeometry2 = new THREE.SphereGeometry(1);
    const sphereMaterial2 = new THREE.MeshNormalMaterial();
    const sphereMesh2 = new THREE.Mesh(sphereGeometry2, sphereMaterial2);
    test.scene.add(sphereMesh2);

    const sphereGeometry3 = new THREE.SphereGeometry(1);
    const sphereMaterial3 = new THREE.MeshNormalMaterial();
    const sphereMesh3 = new THREE.Mesh(sphereGeometry3, sphereMaterial3);
    test.scene.add(sphereMesh3);

    const sphereGeometry4 = new THREE.SphereGeometry(1);
    const sphereMaterial4 = new THREE.MeshNormalMaterial();
    const sphereMesh4 = new THREE.Mesh(sphereGeometry4, sphereMaterial4);
    test.scene.add(sphereMesh4);


    const animate = () => {
      physicsWorld.step(1/60);

      boxMesh.position.copy(carBody.position);
      boxMesh.quaternion.copy(carBody.quaternion);
      sphereMesh1.position.copy(wheelBody1.position);
      sphereMesh1.quaternion.copy(wheelBody1.quaternion);
      sphereMesh2.position.copy(wheelBody2.position);
      sphereMesh2.quaternion.copy(wheelBody2.quaternion);
      sphereMesh3.position.copy(wheelBody3.position);
      sphereMesh3.quaternion.copy(wheelBody3.quaternion);
      sphereMesh4.position.copy(wheelBody4.position);
      sphereMesh4.quaternion.copy(wheelBody4.quaternion);
      window.requestAnimationFrame(animate);
    };

document.addEventListener("DOMContentLoaded", function() {
    animate();
});
