class BrowserHunter {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Game state
        this.score = 0;
        this.health = 100;
        this.gameOver = false;
        this.keys = {};
        this.projectiles = [];
        this.enemies = [];
        this.roadSegments = [];
        this.buildings = []; // Array to track buildings
        this.roadSpeed = 0.5; // Base road speed

        // Movement boundaries
        this.roadWidth = 20;
        this.roadEdge = this.roadWidth / 2 - 1; // Leave 1 unit margin from edge
        this.maxForward = 10; // Maximum forward position
        this.maxBackward = 0; // Maximum backward position (adjusted to keep car visible)
        this.maxHeight = 5; // Maximum height
        this.minHeight = 0; // Minimum height (ground level)
        this.verticalSpeed = 0.1; // Speed of vertical movement
        this.horizontalSpeed = 0.1; // Speed of horizontal movement
        this.forwardSpeed = 0.1; // Speed of forward/backward movement

        // Building properties
        this.buildingSpawnDistance = 800; // Increased from 400 to 800 for much further spawn distance
        this.buildingRecycleDistance = 400; // Increased from 200 to 400 for smoother recycling
        this.buildingMinDistance = 200; // Increased from 100 to 200 for better spacing
        this.buildingSideOffset = 15; // How far from the road buildings spawn
        this.playerSafeDistance = 400; // Increased from 200 to 400 to ensure buildings don't appear too close

        // Initialize game
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Add lights
        this.scene.add(createLights());

        // Create player car
        this.player = Models.createCar(0x00ff00);
        this.player.position.set(0, 0, 0);
        this.scene.add(this.player);

        // Create initial road segments
        for (let i = 0; i < 5; i++) {
            const road = Models.createRoadSegment();
            road.position.z = -i * 100;
            this.scene.add(road);
            this.roadSegments.push(road);
        }

        // Add buildings
        this.generateBuildings();

        // Position camera
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(this.player.position);

        // Start spawning enemies
        this.spawnEnemy();
    }

    generateBuildings() {
        // Clear existing buildings
        this.buildings.forEach(building => this.scene.remove(building));
        this.buildings = [];

        // Generate new buildings
        for (let i = 0; i < 20; i++) { // Increased from 15 to 20 buildings for better coverage
            const building = Models.createBuilding();
            
            // Randomly choose left or right side of the road
            const side = Math.random() < 0.5 ? -1 : 1;
            const xOffset = side * (this.roadEdge + this.buildingSideOffset);
            
            // Position building with random z offset, ensuring minimum distance from player
            const zOffset = -this.buildingSpawnDistance + (Math.random() * this.buildingSpawnDistance);
            
            building.position.set(
                xOffset,
                0,
                zOffset
            );
            
            this.scene.add(building);
            this.buildings.push(building);
        }
    }

    updateBuildings() {
        // Move all buildings
        this.buildings.forEach(building => {
            building.position.z += this.roadSpeed;
            
            // If building is too far ahead, move it to the back
            if (building.position.z > this.buildingRecycleDistance) {
                // Randomly choose left or right side of the road
                const side = Math.random() < 0.5 ? -1 : 1;
                const xOffset = side * (this.roadEdge + this.buildingSideOffset);
                
                // Ensure new position is far enough from player
                const zOffset = -this.buildingSpawnDistance + (Math.random() * this.buildingSpawnDistance);
                
                building.position.set(
                    xOffset,
                    0,
                    zOffset
                );
            }
        });
    }

    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restart();
        });
    }

    spawnEnemy() {
        if (this.gameOver) return;

        const enemy = Models.createCar(0xff0000);
        enemy.position.set(
            (Math.random() - 0.5) * 15,
            0,
            -200
        );
        this.scene.add(enemy);
        this.enemies.push({
            mesh: enemy,
            speed: 0.1 + Math.random() * 0.1
        });

        // Spawn next enemy after random delay
        setTimeout(() => this.spawnEnemy(), 2000 + Math.random() * 3000);
    }

    shoot() {
        if (this.gameOver) return;

        const projectile = Models.createProjectile();
        projectile.position.copy(this.player.position);
        projectile.position.y += 1;
        this.scene.add(projectile);
        this.projectiles.push({
            mesh: projectile,
            speed: 0.5
        });
    }

    updateRoad() {
        // Move all road segments
        this.roadSegments.forEach(road => {
            road.position.z += this.roadSpeed;
            
            // If road segment is too far ahead, move it to the back
            if (road.position.z > 100) {
                road.position.z = -400;
            }
        });
    }

    update() {
        if (this.gameOver) return;

        // Player movement with boundary checks
        if (this.keys['ArrowLeft']) {
            this.player.position.x = Math.max(-this.roadEdge, this.player.position.x - this.horizontalSpeed);
        }
        if (this.keys['ArrowRight']) {
            this.player.position.x = Math.min(this.roadEdge, this.player.position.x + this.horizontalSpeed);
        }
        
        // Vertical movement with boundary checks
        if (this.keys['w'] || this.keys['W']) {
            this.player.position.y = Math.min(this.maxHeight, this.player.position.y + this.verticalSpeed);
        }
        if (this.keys['s'] || this.keys['S']) {
            this.player.position.y = Math.max(this.minHeight, this.player.position.y - this.verticalSpeed);
        }

        // Forward/backward movement with boundary checks
        if (this.keys['ArrowUp']) {
            this.player.position.z = Math.max(this.maxBackward, this.player.position.z - this.forwardSpeed);
            this.roadSpeed = 0.7; // Faster road movement when accelerating
        } else if (this.keys['ArrowDown']) {
            this.player.position.z = Math.min(this.maxForward, this.player.position.z + this.forwardSpeed);
            this.roadSpeed = 0.3; // Slower road movement when braking
        } else {
            this.roadSpeed = 0.5; // Normal road speed
        }
        if (this.keys[' ']) this.shoot();

        // Update road position
        this.updateRoad();
        
        // Update buildings position
        this.updateBuildings();

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            proj.mesh.position.z -= proj.speed;
            return proj.mesh.position.z > -200;
        });

        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.mesh.position.z += enemy.speed;
            // Remove enemies that go too far behind the player
            if (enemy.mesh.position.z > 50) {
                this.scene.remove(enemy.mesh);
                return false;
            }
            return true;
        });

        // Check collisions
        this.checkCollisions();

        // Update score
        this.score += 0.1;
        document.getElementById('score-value').textContent = Math.floor(this.score);
    }

    checkCollisions() {
        // Check projectile-enemy collisions
        this.projectiles.forEach((proj, projIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                const distance = proj.mesh.position.distanceTo(enemy.mesh.position);
                if (distance < 2) {
                    // Remove projectile and enemy
                    this.scene.remove(proj.mesh);
                    this.scene.remove(enemy.mesh);
                    this.projectiles.splice(projIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += 100;
                }
            });
        });

        // Check player-enemy collisions
        this.enemies.forEach(enemy => {
            const distance = this.player.position.distanceTo(enemy.mesh.position);
            if (distance < 2) {
                this.health -= 20;
                document.getElementById('health-value').textContent = this.health;
                if (this.health <= 0) {
                    this.endGame();
                }
            }
        });
    }

    endGame() {
        this.gameOver = true;
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').textContent = Math.floor(this.score);
    }

    restart() {
        // Reset game state
        this.score = 0;
        this.health = 100;
        this.gameOver = false;
        this.projectiles = [];
        this.enemies = [];
        this.roadSpeed = 0.5;

        // Reset UI
        document.getElementById('score-value').textContent = '0';
        document.getElementById('health-value').textContent = '100';
        document.getElementById('game-over').classList.add('hidden');

        // Clear scene and reinitialize
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.init();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new BrowserHunter();
}); 