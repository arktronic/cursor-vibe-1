// Basic 3D model creation utilities
const Models = {
    // Create a simple car model
    createCar: (color = 0x00ff00) => {
        const car = new THREE.Group();
        
        // Car body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.5, 4),
            new THREE.MeshPhongMaterial({ color: color })
        );
        body.position.y = 0.25;
        car.add(body);
        
        // Car roof
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.5, 2),
            new THREE.MeshPhongMaterial({ color: color })
        );
        roof.position.set(0, 1.25, 0);
        car.add(roof);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        const wheelPositions = [
            [-1.2, 0.4, -1.5], // Front left
            [1.2, 0.4, -1.5],  // Front right
            [-1.2, 0.4, 1.5],  // Back left
            [1.2, 0.4, 1.5]    // Back right
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            car.add(wheel);
        });
        
        return car;
    },
    
    // Create a simple projectile
    createProjectile: () => {
        const projectile = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshPhongMaterial({ color: 0xff0000 })
        );
        return projectile;
    },
    
    // Create a detailed road segment with various visual elements
    createRoadSegment: () => {
        const roadGroup = new THREE.Group();
        
        // Main road surface with a darker color
        const road = new THREE.Mesh(
            new THREE.BoxGeometry(20, 0.1, 100),
            new THREE.MeshPhongMaterial({ 
                color: 0x222222,
                shininess: 0
            })
        );
        road.position.y = 0.05;
        roadGroup.add(road);

        // Road edges (white lines)
        const edgeGeometry = new THREE.BoxGeometry(0.2, 0.1, 100);
        const edgeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        
        // Left edge
        const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        leftEdge.position.set(-10, 0.06, 0);
        roadGroup.add(leftEdge);
        
        // Right edge
        const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        rightEdge.position.set(10, 0.06, 0);
        roadGroup.add(rightEdge);
        
        // Center line (dashed)
        const centerLineGeometry = new THREE.BoxGeometry(0.2, 0.1, 2);
        const centerLineMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        
        for (let z = -50; z < 50; z += 4) {
            const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
            centerLine.position.set(0, 0.06, z);
            roadGroup.add(centerLine);
        }

        // Lane markings (dashed lines)
        const laneMarkingGeometry = new THREE.BoxGeometry(0.2, 0.1, 2);
        const laneMarkingMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        
        // Left lane marking
        for (let z = -50; z < 50; z += 4) {
            const leftMarking = new THREE.Mesh(laneMarkingGeometry, laneMarkingMaterial);
            leftMarking.position.set(-5, 0.06, z);
            roadGroup.add(leftMarking);
        }
        
        // Right lane marking
        for (let z = -50; z < 50; z += 4) {
            const rightMarking = new THREE.Mesh(laneMarkingGeometry, laneMarkingMaterial);
            rightMarking.position.set(5, 0.06, z);
            roadGroup.add(rightMarking);
        }

        // Road texture (small cracks and details)
        const textureGeometry = new THREE.BoxGeometry(20, 0.1, 100);
        const textureMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 0,
            transparent: true,
            opacity: 0.1
        });
        const texture = new THREE.Mesh(textureGeometry, textureMaterial);
        texture.position.y = 0.06;
        roadGroup.add(texture);
        
        return roadGroup;
    },
    
    // Create a building with random size
    createBuilding: () => {
        // Randomize building dimensions
        const width = 3 + Math.random() * 4;  // Width between 3 and 7
        const height = 5 + Math.random() * 10; // Height between 5 and 15
        const depth = 3 + Math.random() * 4;   // Depth between 3 and 7
        
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshPhongMaterial({ 
                color: 0x808080,
                shininess: 0
            })
        );
        building.position.y = height / 2;
        
        // Store dimensions for collision detection
        building.userData = {
            width: width,
            height: height,
            depth: depth
        };
        
        return building;
    }
};

// Lighting setup
const createLights = () => {
    const lights = new THREE.Group();
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    lights.add(ambientLight);
    
    // Directional light (sunlight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    lights.add(directionalLight);
    
    return lights;
}; 