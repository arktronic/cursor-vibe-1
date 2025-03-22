// Basic 3D model creation utilities
const Models = {
    // Create a realistic car model
    createCar: (color = 0x00ff00) => {
        const car = new THREE.Group();
        
        // Main body - more realistic proportions
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 0.6, 4.5),
            new THREE.MeshPhongMaterial({ color: color })
        );
        body.position.y = 0.3;
        car.add(body);
        
        // Hood - slightly raised
        const hood = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.2, 1.2),
            new THREE.MeshPhongMaterial({ color: color })
        );
        hood.position.set(0, 0.4, -1.5);
        hood.rotation.x = -Math.PI / 12;
        car.add(hood);
        
        // Trunk - slightly raised
        const trunk = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.2, 1.2),
            new THREE.MeshPhongMaterial({ color: color })
        );
        trunk.position.set(0, 0.4, 1.5);
        trunk.rotation.x = Math.PI / 12;
        car.add(trunk);
        
        // Roof - more angular
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 1.2, 2),
            new THREE.MeshPhongMaterial({ color: color })
        );
        roof.position.set(0, 1.2, 0);
        car.add(roof);
        
        // Windows - black with slight tint
        const windowMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        
        // Front windshield
        const frontWindshield = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 0.1, 0.8),
            windowMaterial
        );
        frontWindshield.position.set(0, 1.2, -1);
        frontWindshield.rotation.x = -Math.PI / 6;
        car.add(frontWindshield);
        
        // Rear windshield
        const rearWindshield = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 0.1, 0.8),
            windowMaterial
        );
        rearWindshield.position.set(0, 1.2, 1);
        rearWindshield.rotation.x = Math.PI / 6;
        car.add(rearWindshield);
        
        // Side windows
        const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.8, 1.2);
        const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        leftWindow.position.set(-0.8, 1.2, 0);
        car.add(leftWindow);
        
        const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        rightWindow.position.set(0.8, 1.2, 0);
        car.add(rightWindow);
        
        // Wheels - more detailed with rims
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.41, 8);
        const rimMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
        
        const wheelPositions = [
            [-1.2, 0.4, -1.8], // Front left
            [1.2, 0.4, -1.8],  // Front right
            [-1.2, 0.4, 1.8],  // Back left
            [1.2, 0.4, 1.8]    // Back right
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            wheel.rotation.z = Math.PI / 2;
            rim.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            rim.position.set(...pos);
            car.add(wheel);
            car.add(rim);
        });
        
        // Headlights - more prominent
        const headlightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
        const headlightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5
        });
        
        const headlightPositions = [
            [-1.1, 0.3, -2.2], // Front left
            [1.1, 0.3, -2.2]   // Front right
        ];
        
        headlightPositions.forEach(pos => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(...pos);
            car.add(headlight);
        });
        
        // Taillights - more prominent
        const taillightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
        const taillightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        const taillightPositions = [
            [-1.1, 0.3, 2.2], // Back left
            [1.1, 0.3, 2.2]   // Back right
        ];
        
        taillightPositions.forEach(pos => {
            const taillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
            taillight.position.set(...pos);
            car.add(taillight);
        });
        
        // Grill
        const grill = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.8, 0.1),
            new THREE.MeshPhongMaterial({ color: 0x222222 })
        );
        grill.position.set(0, 0.3, -2.2);
        car.add(grill);
        
        // Bumpers
        const bumperGeometry = new THREE.BoxGeometry(2.4, 0.2, 0.4);
        const bumperMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        
        const frontBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        frontBumper.position.set(0, 0.1, -2.4);
        car.add(frontBumper);
        
        const rearBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        rearBumper.position.set(0, 0.1, 2.4);
        car.add(rearBumper);
        
        // Add a simple shadow
        const shadowGeometry = new THREE.PlaneGeometry(2.4, 4.7);
        const shadowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01;
        car.add(shadow);
        
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
    
    // Create a building with random size and details
    createBuilding: () => {
        const building = new THREE.Group();
        
        // Randomize building dimensions
        const width = 3 + Math.random() * 4;  // Width between 3 and 7
        const height = 5 + Math.random() * 10; // Height between 5 and 15
        const depth = 3 + Math.random() * 4;   // Depth between 3 and 7
        
        // Main building body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshPhongMaterial({ 
                color: 0x808080,
                shininess: 0
            })
        );
        body.position.y = height / 2;
        building.add(body);
        
        // Windows - black with slight tint
        const windowMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        
        // Calculate window positions and sizes
        const windowWidth = width * 0.2;  // Windows are 20% of building width
        const windowHeight = height * 0.15; // Windows are 15% of building height
        const windowDepth = 0.1; // Slight depth for windows
        
        // Front windows
        const frontWindowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
        const frontWindowMaterial = windowMaterial.clone();
        
        // Create windows in a grid pattern
        const windowRows = Math.floor(height / (windowHeight * 1.5));
        const windowCols = Math.floor(width / (windowWidth * 1.5));
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                const window = new THREE.Mesh(frontWindowGeometry, frontWindowMaterial);
                window.position.set(
                    (col - (windowCols - 1) / 2) * (windowWidth * 1.5),
                    (row - (windowRows - 1) / 2) * (windowHeight * 1.5) + height / 2,
                    depth / 2 + windowDepth / 2
                );
                building.add(window);
            }
        }
        
        // Back windows (same pattern)
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                const window = new THREE.Mesh(frontWindowGeometry, frontWindowMaterial);
                window.position.set(
                    (col - (windowCols - 1) / 2) * (windowWidth * 1.5),
                    (row - (windowRows - 1) / 2) * (windowHeight * 1.5) + height / 2,
                    -depth / 2 - windowDepth / 2
                );
                building.add(window);
            }
        }
        
        // Side windows
        const sideWindowGeometry = new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth);
        const sideWindowMaterial = windowMaterial.clone();
        
        // Left side windows
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < Math.floor(depth / (windowWidth * 1.5)); col++) {
                const window = new THREE.Mesh(sideWindowGeometry, sideWindowMaterial);
                window.position.set(
                    -width / 2 - windowDepth / 2,
                    (row - (windowRows - 1) / 2) * (windowHeight * 1.5) + height / 2,
                    (col - (Math.floor(depth / (windowWidth * 1.5)) - 1) / 2) * (windowWidth * 1.5)
                );
                building.add(window);
            }
        }
        
        // Right side windows
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < Math.floor(depth / (windowWidth * 1.5)); col++) {
                const window = new THREE.Mesh(sideWindowGeometry, sideWindowMaterial);
                window.position.set(
                    width / 2 + windowDepth / 2,
                    (row - (windowRows - 1) / 2) * (windowHeight * 1.5) + height / 2,
                    (col - (Math.floor(depth / (windowWidth * 1.5)) - 1) / 2) * (windowWidth * 1.5)
                );
                building.add(window);
            }
        }
        
        // Roof details
        const roofGeometry = new THREE.BoxGeometry(width + 0.2, 0.2, depth + 0.2);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, height + 0.1, 0);
        building.add(roof);
        
        // Building base/ground
        const baseGeometry = new THREE.BoxGeometry(width + 0.4, 0.2, depth + 0.4);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, 0.1, 0);
        building.add(base);
        
        // Store dimensions for collision detection
        building.userData = {
            width: width,
            height: height,
            depth: depth
        };
        
        return building;
    },
    
    createExplosion() {
        const particles = [];
        const particleCount = 20;
        const particleGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const particleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            emissive: 0xffff00,
            emissiveIntensity: 1.0
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2.0,
                    (Math.random() - 0.5) * 2.0,
                    (Math.random() - 0.5) * 2.0
                ),
                life: 1.0 // Life in seconds
            });
        }
        
        return particles;
    },

    createVortexEffect(color) {
        const particles = [];
        const particleCount = 60; // Increased for more density
        const particleGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const particleMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        // Create two spirals for a fuller effect
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 3; // Decreased radius to be closer to car
            
            particles.push({
                mesh: particle,
                initialPosition: new THREE.Vector3(
                    Math.cos(angle) * radius,
                    0, // Start at ground level
                    Math.sin(angle) * radius
                ),
                angle: angle,
                radius: radius,
                rotationSpeed: 0.1 + Math.random() * 0.1,
                life: 1.0,
                initialScale: 0.8 + Math.random() * 0.4,
                targetHeight: 2 + Math.random() * 1 // Decreased target height to be closer to car
            });
        }
        
        return particles;
    },

    createPowerUp(type) {
        // Create a floating power-up with a distinctive shape and color
        const geometry = new THREE.OctahedronGeometry(1, 0);
        let color, emissive;
        
        switch(type) {
            case 'rapidFire':
                color = 0xffd700; // Gold
                emissive = 0xffa500;
                break;
            case 'wideShot':
                color = 0x0000ff; // Blue
                emissive = 0x00ffff;
                break;
            case 'homing':
                color = 0x00ff00; // Green
                emissive = 0x00ff00;
                break;
            default:
                color = 0xffffff;
                emissive = 0xffffff;
        }

        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: emissive,
            emissiveIntensity: 0.5,
            shininess: 100
        });

        const powerUp = new THREE.Mesh(geometry, material);
        
        // Add a pulsing animation
        powerUp.userData = {
            type: type,
            pulseSpeed: 0.05,
            pulseScale: 1.0,
            pulseDirection: 1
        };

        return powerUp;
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