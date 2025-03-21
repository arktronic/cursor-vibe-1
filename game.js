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
        this.explosions = []; // Add explosions array
        this.animationFrameId = null; // Track animation frame ID

        // Power-up state
        this.powerUps = []; // Array to track active power-ups in the world
        this.activePowerUp = null; // Currently active power-up effect
        this.powerUpEndTime = 0; // When the current power-up will end
        this.lastPowerUpSpawn = 0; // Last time a power-up was spawned
        this.powerUpSpawnInterval = 45000; // Minimum time between power-up spawns (45 seconds)
        this.lastRapidFireShot = 0; // Track last rapid fire shot time
        this.rapidFireInterval = 200; // Minimum time between rapid fire shots (200ms = 5 shots per second)

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
        this.buildingMinDistance = 100;
        this.buildingSideOffset = 15; // How far from the road buildings spawn
        this.playerSafeDistance = 100; // Reduced from 800 to 100 to allow closer spawning

        // Initialize game
        this.init();
        this.setupEventListeners();
        this.startAnimation();
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

    startAnimation() {
        // Only start animation if game is started
        if (this.gameStarted) {
            this.animate();
        }
    }

    animate() {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        
        // Only update game state if the game is started and not over
        if (this.gameStarted && !this.gameOver) {
            this.update();
        }
        
        // Only render if the game is not over
        if (!this.gameOver) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    startGame() {
        // Reset game state
        this.score = 0;
        this.health = 100;
        this.gameOver = false;
        this.gameStarted = true;
        this.projectiles = [];
        this.enemies = [];
        this.explosions = [];
        this.roadSpeed = 0.5;

        // Reset UI
        document.getElementById('score-value').textContent = '0';
        document.getElementById('health-value').textContent = '100';
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('start-screen').style.display = 'none';

        // Start background music if enabled
        if (document.getElementById('music-toggle').checked) {
            this.backgroundMusic.play();
        }

        // Start animation and enemy spawning
        this.startAnimation();
        this.spawnEnemy();
    }

    spawnEnemy() {
        if (this.gameOver) return;

        const enemy = Models.createCar(0xff0000);
        
        // Randomize initial position and speed
        const baseSpeed = 0.25; // Base speed for enemies
        const speedVariation = 0.15; // Speed variation
        const horizontalSpeed = 0.05;
        const horizontalVariation = 0.03;
        
        // Randomize initial x position within road bounds
        const xPos = (Math.random() - 0.5) * (this.roadWidth - 4);
        
        // Spawn enemy behind the player
        enemy.position.set(
            xPos,
            0,
            this.player.position.z - 200 // Spawn 200 units behind the player
        );
        
        this.scene.add(enemy);
        this.enemies.push({
            mesh: enemy,
            speed: baseSpeed + Math.random() * speedVariation,
            horizontalSpeed: (Math.random() - 0.5) * horizontalVariation + horizontalSpeed,
            direction: Math.random() < 0.5 ? 1 : -1,
            directionChangeTimer: Math.random() * 100,
            targetX: xPos,
            lastShotTime: Date.now(),
            shootInterval: 2000 + Math.random() * 1000
        });

        // Spawn next enemy after random delay
        setTimeout(() => this.spawnEnemy(), 2000 + Math.random() * 3000);
    }

    shoot(isEnemy = false) {
        if (this.gameOver) return;

        if (isEnemy) {
            const projectile = Models.createProjectile(0xff0000);
            projectile.position.copy(this.currentEnemy.position);
            projectile.position.y += 1;
            this.scene.add(projectile);
            this.projectiles.push({
                mesh: projectile,
                speed: 0.8,
                isEnemy: true
            });
            return;
        }

        // Handle player shooting with power-ups
        if (this.activePowerUp === 'rapidFire') {
            // Rapid fire: continuous firing while button is held, with rate limiting
            const currentTime = Date.now();
            if ((this.keys[' '] || this.keys['FIRE']) && currentTime - this.lastRapidFireShot >= this.rapidFireInterval) {
                const projectile = Models.createProjectile(0x00ff00);
                projectile.position.copy(this.player.position);
                projectile.position.y += 1;
                this.scene.add(projectile);
                this.projectiles.push({
                    mesh: projectile,
                    speed: 0.2,
                    isEnemy: false
                });
                this.lastRapidFireShot = currentTime;
            }
        } else if (this.activePowerUp === 'wideShot') {
            // Wide shot: shoot three projectiles in a spread pattern
            const angles = [-15, 0, 15];
            angles.forEach(angle => {
                const projectile = Models.createProjectile(0x00ff00);
                projectile.position.copy(this.player.position);
                projectile.position.y += 1;
                projectile.rotation.y = THREE.MathUtils.degToRad(angle);
                this.scene.add(projectile);
                this.projectiles.push({
                    mesh: projectile,
                    speed: 0.2,
                    isEnemy: false,
                    angle: angle
                });
            });
        } else if (this.activePowerUp === 'homing') {
            // Homing missiles: shoot a single homing projectile
            const projectile = Models.createProjectile(0x00ff00);
            projectile.position.copy(this.player.position);
            projectile.position.y += 1;
            this.scene.add(projectile);
            this.projectiles.push({
                mesh: projectile,
                speed: 0.2,
                isEnemy: false,
                isHoming: true
            });
        } else {
            // Normal shot
            const projectile = Models.createProjectile(0x00ff00);
            projectile.position.copy(this.player.position);
            projectile.position.y += 1;
            this.scene.add(projectile);
            this.projectiles.push({
                mesh: projectile,
                speed: 0.2,
                isEnemy: false
            });
        }
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
            this.roadSpeed = 0.7;
        } else if (this.keys['ArrowDown']) {
            this.player.position.z = Math.min(this.maxForward, this.player.position.z + this.forwardSpeed);
            this.roadSpeed = 0.3;
        } else {
            this.roadSpeed = 0.5;
        }

        // Handle continuous rapid fire
        if (this.activePowerUp === 'rapidFire' && (this.keys[' '] || this.keys['FIRE'])) {
            this.shoot();
        }

        // Update spacebar state for next frame
        this.wasSpacePressed = this.keys[' '];

        // Update road position
        this.updateRoad();
        
        // Update buildings position
        this.updateBuildings();

        // Update power-ups
        this.updatePowerUps();
        
        // Spawn new power-ups
        this.spawnPowerUp();

        // Update projectiles with homing behavior
        this.projectiles = this.projectiles.filter(proj => {
            if (proj.isHoming && !proj.isEnemy) {
                // Find closest enemy
                let closestEnemy = null;
                let closestDistance = Infinity;
                
                this.enemies.forEach(enemy => {
                    const distance = enemy.mesh.position.distanceTo(proj.mesh.position);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                });

                if (closestEnemy) {
                    // Move projectile towards closest enemy
                    const direction = new THREE.Vector3()
                        .subVectors(closestEnemy.mesh.position, proj.mesh.position)
                        .normalize();
                    proj.mesh.position.add(direction.multiplyScalar(proj.speed));
                } else {
                    // If no enemies, move forward
                    proj.mesh.position.z -= proj.speed;
                }
            } else if (proj.angle !== undefined) {
                // Handle wide shot projectiles
                const direction = new THREE.Vector3(0, 0, -1);
                direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(proj.angle));
                proj.mesh.position.add(direction.multiplyScalar(proj.speed));
            } else {
                // Normal projectile movement
                if (proj.isEnemy) {
                    proj.mesh.position.z += proj.speed;
                } else {
                    proj.mesh.position.z -= proj.speed;
                }
            }
            
            // Remove projectiles that go too far
            if (proj.mesh.position.z < -200 || proj.mesh.position.z > this.player.position.z + 50) {
                this.scene.remove(proj.mesh);
                return false;
            }
            return true;
        });

        // Update enemies with random movement and shooting
        this.enemies = this.enemies.filter(enemy => {
            // Move forward
            enemy.mesh.position.z += enemy.speed;
            
            // Update direction change timer
            enemy.directionChangeTimer--;
            
            // Randomly change direction or target
            if (enemy.directionChangeTimer <= 0) {
                if (Math.random() < 0.3) {
                    enemy.direction *= -1;
                }
                if (Math.random() < 0.2) {
                    enemy.targetX = (Math.random() - 0.5) * (this.roadWidth - 4);
                }
                enemy.directionChangeTimer = 50 + Math.random() * 100;
            }
            
            // Move towards target position
            const dx = enemy.targetX - enemy.mesh.position.x;
            if (Math.abs(dx) > 0.1) {
                enemy.mesh.position.x += Math.sign(dx) * enemy.horizontalSpeed;
            }
            
            // Keep within road bounds
            enemy.mesh.position.x = Math.max(-this.roadEdge, Math.min(this.roadEdge, enemy.mesh.position.x));

            // Enemy shooting logic
            const currentTime = Date.now();
            if (currentTime - enemy.lastShotTime > enemy.shootInterval) {
                this.currentEnemy = enemy.mesh; // Set current enemy before shooting
                this.shoot(true);
                enemy.lastShotTime = currentTime;
            }
            
            // Remove enemies that go too far behind or ahead of the player
            const distanceFromPlayer = enemy.mesh.position.z - this.player.position.z;
            if (distanceFromPlayer > 100 || distanceFromPlayer < -300) {
                this.scene.remove(enemy.mesh);
                return false;
            }
            return true;
        });

        // Update explosions and vortex effects
        this.explosions = this.explosions.filter(explosion => {
            explosion.timeLeft -= 0.016; // Assuming 60fps
            
            if (explosion.isVortex) {
                // Handle vortex particle animation
                explosion.particles.forEach(particle => {
                    // Rotate around the player
                    particle.angle += particle.rotationSpeed;
                    
                    // Calculate current height based on time
                    const progress = 1 - (explosion.timeLeft / 2.0); // 0 to 1 over 2 seconds
                    const currentHeight = progress * particle.targetHeight;
                    
                    // Update position with rotation and rising motion
                    particle.mesh.position.x = this.player.position.x + Math.cos(particle.angle) * particle.radius;
                    particle.mesh.position.y = this.player.position.y + currentHeight;
                    particle.mesh.position.z = this.player.position.z + Math.sin(particle.angle) * particle.radius;
                    
                    // Fade out and scale down
                    particle.life -= 0.016;
                    particle.mesh.material.opacity = particle.life * 0.8;
                    particle.mesh.scale.setScalar(particle.initialScale * particle.life);
                });
            } else {
                // Handle regular explosion particles
                explosion.particles.forEach(particle => {
                    particle.mesh.position.add(particle.velocity);
                    particle.life -= 0.016;
                    particle.mesh.material.opacity = particle.life;
                });
            }
            
            if (explosion.timeLeft <= 0) {
                explosion.particles.forEach(particle => {
                    this.scene.remove(particle.mesh);
                });
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
        // Check player projectiles against enemies
        this.projectiles = this.projectiles.filter(proj => {
            // Check if projectile is from player
            if (!proj.isEnemy) {
                for (let enemy of this.enemies) {
                    if (this.checkCollision(proj.mesh, enemy.mesh)) {
                        this.scene.remove(proj.mesh);
                        this.createExplosion(enemy.mesh.position);
                        this.scene.remove(enemy.mesh);
                        this.enemies = this.enemies.filter(e => e !== enemy);
                        this.score += 100;
                        return false;
                    }
                }
            }
            // Check if projectile is from enemy
            else {
                if (this.checkCollision(proj.mesh, this.player)) {
                    this.scene.remove(proj.mesh);
                    this.createExplosion(this.player.position);
                    this.health -= 20;
                    document.getElementById('health-value').textContent = this.health;
                    if (this.health <= 0) {
                        this.gameOver = true;
                        document.getElementById('game-over').classList.remove('hidden');
                        document.getElementById('final-score').textContent = Math.floor(this.score);
                    }
                    return false;
                }
            }
            return true;
        });

        // Check player-enemy collisions
        this.enemies.forEach(enemy => {
            if (this.checkCollision(this.player, enemy.mesh)) {
                this.createExplosion(this.player.position);
                this.createExplosion(enemy.mesh.position);
                this.health -= 20;
                document.getElementById('health-value').textContent = this.health;
                if (this.health <= 0) {
                    this.gameOver = true;
                    document.getElementById('game-over').classList.remove('hidden');
                    document.getElementById('final-score').textContent = Math.floor(this.score);
                }
            }
        });
    }

    checkCollision(obj1, obj2) {
        const distance = obj1.position.distanceTo(obj2.position);
        return distance < 2;
    }

    endGame() {
        this.gameOver = true;
        // Cancel animation frame when game is over
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').textContent = Math.floor(this.score);
    }

    restart() {
        // Cancel any existing animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Reset game state
        this.score = 0;
        this.health = 100;
        this.gameOver = false;
        this.gameStarted = false;
        this.projectiles = [];
        this.enemies = [];
        this.explosions = [];
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

        // Reset power-up state
        this.powerUps.forEach(powerUp => this.scene.remove(powerUp));
        this.powerUps = [];
        this.activePowerUp = null;
        this.powerUpEndTime = 0;
        this.lastPowerUpSpawn = 0;
    }

    createExplosion(position) {
        const particles = Models.createExplosion();
        particles.forEach(particle => {
            particle.mesh.position.copy(position);
            this.scene.add(particle.mesh);
        });
        this.explosions.push({
            particles: particles,
            timeLeft: 1.0 // Life in seconds
        });
    }

    spawnPowerUp() {
        if (this.gameOver || this.activePowerUp) return;

        const currentTime = Date.now();
        if (currentTime - this.lastPowerUpSpawn < this.powerUpSpawnInterval) return;

        // Randomly choose a power-up type
        const types = ['rapidFire', 'wideShot', 'homing'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Create power-up
        const powerUp = Models.createPowerUp(type);
        
        // Position power-up on the road
        const xPos = (Math.random() - 0.5) * (this.roadWidth - 4);
        powerUp.position.set(
            xPos,
            1, // Float slightly above the road
            this.player.position.z - 200 // Spawn behind the player
        );
        
        this.scene.add(powerUp);
        this.powerUps.push(powerUp);
        this.lastPowerUpSpawn = currentTime;
    }

    updatePowerUps() {
        // Update power-up positions and animations
        this.powerUps = this.powerUps.filter(powerUp => {
            // Move power-up with the road
            powerUp.position.z += this.roadSpeed;
            
            // Update pulsing animation
            powerUp.userData.pulseScale += powerUp.userData.pulseSpeed * powerUp.userData.pulseDirection;
            if (powerUp.userData.pulseScale >= 1.2) {
                powerUp.userData.pulseDirection = -1;
            } else if (powerUp.userData.pulseScale <= 0.8) {
                powerUp.userData.pulseDirection = 1;
            }
            powerUp.scale.set(
                powerUp.userData.pulseScale,
                powerUp.userData.pulseScale,
                powerUp.userData.pulseScale
            );
            
            // Rotate power-up
            powerUp.rotation.y += 0.02;
            
            // Check for collision with player
            if (this.checkCollision(powerUp, this.player)) {
                this.activatePowerUp(powerUp.userData.type);
                this.scene.remove(powerUp);
                return false;
            }
            
            // Remove power-up if it goes too far behind
            if (powerUp.position.z < -200) {
                this.scene.remove(powerUp);
                return false;
            }
            
            return true;
        });

        // Update active power-up
        if (this.activePowerUp && Date.now() >= this.powerUpEndTime) {
            this.deactivatePowerUp();
        }
    }

    activatePowerUp(type) {
        if (this.activePowerUp) return; // Don't activate if another power-up is active
        
        this.activePowerUp = type;
        this.powerUpEndTime = Date.now() + 12000; // 12 seconds duration
        
        // Update UI
        const powerUpIndicator = document.getElementById('power-up-indicator');
        powerUpIndicator.textContent = this.getPowerUpName(type);
        powerUpIndicator.style.display = 'block';
        
        // Visual feedback
        this.createPowerUpEffect();
    }

    deactivatePowerUp() {
        this.activePowerUp = null;
        this.powerUpEndTime = 0;
        
        // Update UI
        const powerUpIndicator = document.getElementById('power-up-indicator');
        powerUpIndicator.style.display = 'none';
    }

    getPowerUpName(type) {
        switch(type) {
            case 'rapidFire': return 'Rapid Fire!';
            case 'wideShot': return 'Wide Shot!';
            case 'homing': return 'Homing Missiles!';
            default: return '';
        }
    }

    createPowerUpEffect() {
        // Create a vortex effect when power-up is activated
        let color;
        switch(this.activePowerUp) {
            case 'rapidFire':
                color = 0xffd700; // Gold
                break;
            case 'wideShot':
                color = 0x0000ff; // Blue
                break;
            case 'homing':
                color = 0x00ff00; // Green
                break;
            default:
                color = 0xffffff;
        }

        const particles = Models.createVortexEffect(color);
        particles.forEach(particle => {
            particle.mesh.position.copy(this.player.position);
            particle.mesh.position.y += 2; // Slightly above the player
            this.scene.add(particle.mesh);
        });
        this.explosions.push({
            particles: particles,
            timeLeft: 2.0, // Longer duration for vortex effect
            isVortex: true
        });
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new BrowserHunter();
}); 