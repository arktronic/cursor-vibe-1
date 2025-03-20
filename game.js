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
        this.gameStarted = false;
        this.keys = {};
        this.projectiles = [];
        this.enemies = [];
        this.roadSegments = [];
        this.buildings = []; // Array to track buildings
        this.roadSpeed = 0.5; // Base road speed
        this.wasSpacePressed = false; // Track if space was pressed in previous frame

        // Audio
        this.backgroundMusic = document.getElementById('background-music');
        this.backgroundMusic.volume = 0.5; // Set volume to 50%

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
        this.buildingSpawnDistance = 400; // Reduced from 1200 to 400 for more reasonable distance
        this.buildingRecycleDistance = 200; // Reduced from 600 to 200 for smoother recycling
        this.buildingMinDistance = 100; // Reduced from 800 to 100 to allow closer spawning
        this.buildingSideOffset = 15; // How far from the road buildings spawn
        this.playerSafeDistance = 100; // Reduced from 800 to 100 to allow closer spawning

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
    }

    generateBuildings() {
        // Clear existing buildings
        this.buildings.forEach(building => this.scene.remove(building));
        this.buildings = [];

        // Generate new buildings
        for (let i = 0; i < 20; i++) {
            const building = Models.createBuilding();
            
            // Randomly choose left or right side of the road
            const side = Math.random() < 0.5 ? -1 : 1;
            const xOffset = side * (this.roadEdge + this.buildingSideOffset);
            
            // On initial load, allow buildings to spawn anywhere
            const zOffset = -this.buildingSpawnDistance + (Math.random() * this.buildingSpawnDistance);
            
            // Set building position
            building.position.set(
                xOffset,
                0, // Place building on the ground
                zOffset
            );
            
            // Check for overlaps with existing buildings
            let hasOverlap = false;
            for (const existingBuilding of this.buildings) {
                const dx = Math.abs(building.position.x - existingBuilding.position.x);
                const dz = Math.abs(building.position.z - existingBuilding.position.z);
                
                // Get building dimensions
                const newWidth = building.userData.width;
                const newDepth = building.userData.depth;
                const existingWidth = existingBuilding.userData.width;
                const existingDepth = existingBuilding.userData.depth;
                
                // Add some padding between buildings
                const minDistanceX = (newWidth + existingWidth) / 2 + 2;
                const minDistanceZ = (newDepth + existingDepth) / 2 + 2;
                
                if (dx < minDistanceX && dz < minDistanceZ) {
                    hasOverlap = true;
                    break;
                }
            }
            
            // If no overlap, add the building
            if (!hasOverlap) {
                this.scene.add(building);
                this.buildings.push(building);
            } else {
                // If there's an overlap, try again with a different position
                i--;
                this.scene.remove(building);
                continue;
            }
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
                
                // When recycling, ensure new position is far enough from player
                const zOffset = -this.buildingSpawnDistance + (Math.random() * (this.buildingSpawnDistance - this.buildingMinDistance));
                
                // Set new position
                building.position.set(
                    xOffset,
                    0, // Keep building on the ground
                    zOffset
                );
                
                // Check for overlaps with other buildings
                let hasOverlap = false;
                for (const existingBuilding of this.buildings) {
                    if (existingBuilding === building) continue;
                    
                    const dx = Math.abs(building.position.x - existingBuilding.position.x);
                    const dz = Math.abs(building.position.z - existingBuilding.position.z);
                    
                    // Get building dimensions
                    const newWidth = building.userData.width;
                    const newDepth = building.userData.depth;
                    const existingWidth = existingBuilding.userData.width;
                    const existingDepth = existingBuilding.userData.depth;
                    
                    // Add some padding between buildings
                    const minDistanceX = (newWidth + existingWidth) / 2 + 2;
                    const minDistanceZ = (newDepth + existingDepth) / 2 + 2;
                    
                    if (dx < minDistanceX && dz < minDistanceZ) {
                        hasOverlap = true;
                        break;
                    }
                }
                
                // If there's an overlap, try a different position
                if (hasOverlap) {
                    building.position.z = -this.buildingSpawnDistance;
                }
            }
        });
    }

    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' && !this.wasSpacePressed) {
                this.shoot();
            }
        });
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Play button
        document.getElementById('play-button').addEventListener('click', () => {
            this.startGame();
        });

        // Restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restart();
        });

        // Mobile controls
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            // Movement controls
            document.getElementById('left-btn').addEventListener('touchstart', () => this.keys['ArrowLeft'] = true);
            document.getElementById('left-btn').addEventListener('touchend', () => this.keys['ArrowLeft'] = false);
            document.getElementById('right-btn').addEventListener('touchstart', () => this.keys['ArrowRight'] = true);
            document.getElementById('right-btn').addEventListener('touchend', () => this.keys['ArrowRight'] = false);
            document.getElementById('up-btn').addEventListener('touchstart', () => this.keys['ArrowUp'] = true);
            document.getElementById('up-btn').addEventListener('touchend', () => this.keys['ArrowUp'] = false);
            document.getElementById('down-btn').addEventListener('touchstart', () => this.keys['ArrowDown'] = true);
            document.getElementById('down-btn').addEventListener('touchend', () => this.keys['ArrowDown'] = false);

            // Shoot button
            document.getElementById('shoot-btn').addEventListener('touchstart', () => {
                if (!this.wasSpacePressed) {
                    this.shoot();
                }
                this.keys[' '] = true;
            });
            document.getElementById('shoot-btn').addEventListener('touchend', () => {
                this.keys[' '] = false;
            });

            // Show mobile controls on mobile devices
            if (window.innerWidth <= 767) {
                mobileControls.classList.remove('hidden');
            }
        }
    }

    startGame() {
        this.gameStarted = true;
        document.getElementById('start-screen').style.display = 'none';
        
        // Only play music if the checkbox is checked
        if (document.getElementById('music-toggle').checked) {
            this.backgroundMusic.play().catch(error => {
                console.log("Audio playback failed:", error);
            });
        }
        
        this.spawnEnemy();
    }

    spawnEnemy() {
        if (this.gameOver) return;

        const enemy = Models.createCar(0xff0000);
        
        // Randomize initial position and speed
        const baseSpeed = 0.15; // Base speed for enemies
        const speedVariation = 0.1; // How much speed can vary
        const horizontalSpeed = 0.05; // Base horizontal movement speed
        const horizontalVariation = 0.03; // How much horizontal speed can vary
        
        // Randomize initial x position within road bounds
        const xPos = (Math.random() - 0.5) * (this.roadWidth - 4); // Leave 2 units margin on each side
        
        enemy.position.set(
            xPos,
            0,
            -200
        );
        
        this.scene.add(enemy);
        this.enemies.push({
            mesh: enemy,
            speed: baseSpeed + Math.random() * speedVariation,
            horizontalSpeed: (Math.random() - 0.5) * horizontalVariation + horizontalSpeed,
            direction: Math.random() < 0.5 ? 1 : -1, // Random initial direction
            directionChangeTimer: Math.random() * 100, // Random timer for direction changes
            targetX: xPos // Initial target position
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
        if (!this.gameStarted || this.gameOver) return;

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

        // Update spacebar state for next frame
        this.wasSpacePressed = this.keys[' '];

        // Update road position
        this.updateRoad();
        
        // Update buildings position
        this.updateBuildings();

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            proj.mesh.position.z -= proj.speed;
            // Remove projectiles that go too far in either direction
            if (proj.mesh.position.z < -200 || proj.mesh.position.z > 50) {
                this.scene.remove(proj.mesh);
                return false;
            }
            return true;
        });

        // Update enemies with random movement
        this.enemies = this.enemies.filter(enemy => {
            // Move forward
            enemy.mesh.position.z += enemy.speed;
            
            // Update direction change timer
            enemy.directionChangeTimer--;
            
            // Randomly change direction or target
            if (enemy.directionChangeTimer <= 0) {
                // 30% chance to change direction
                if (Math.random() < 0.3) {
                    enemy.direction *= -1;
                }
                // 20% chance to set a new random target position
                if (Math.random() < 0.2) {
                    enemy.targetX = (Math.random() - 0.5) * (this.roadWidth - 4);
                }
                // Reset timer with random duration
                enemy.directionChangeTimer = 50 + Math.random() * 100;
            }
            
            // Move towards target position
            const dx = enemy.targetX - enemy.mesh.position.x;
            if (Math.abs(dx) > 0.1) {
                enemy.mesh.position.x += Math.sign(dx) * enemy.horizontalSpeed;
            }
            
            // Keep within road bounds
            enemy.mesh.position.x = Math.max(-this.roadEdge, Math.min(this.roadEdge, enemy.mesh.position.x));
            
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
        document.getElementById('start-screen').style.display = 'flex';

        // Stop and reset music
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;

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