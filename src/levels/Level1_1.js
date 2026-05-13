/**
 * Level1_1 - Laberinto de Plataformas
 * Primer nivel real con mecánicas de dualidad
 * - Láseres rojos (requieren Estado Rojo para pasar)
 * - Obstáculos de techo bajo (requieren agacharse)
 * - 3 fragmentos de memoria
 * - Sistema de cronómetro
 */
import * as THREE from 'three';

export class Level1_1 {
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.lasers = [];
        this.fragments = [];
        this.ceilingHazards = [];
        this.lavaPools = [];
        this.goal = null;
        this.time = 0;
        this._laserGlows = [];
        this._lavaGlows = [];

        // Configuración
        this.spawnPoint = { x: -450, y: -120 };  // Ajustado para estar sobre la plataforma
        this.cameraCenter = { x: 100, y: -40 };  // Ajustado para ver mejor el nivel vertical
        this.deathY = -250;

        // Plataformas [x, y, width, height]
        // Diseño más complejo con diferentes alturas y saltos
        this.platformData = [
            [-450, -150, 160, 20],   // Inicio
            [-260, -150, 100, 20],   // Puente 1
            [-130, -100, 80, 16],    // Elevada 1 (salto)
            [-20, -150, 100, 20],    // Baja de nuevo
            [110, -80, 70, 16],      // Elevada 2 (salto)
            [210, -150, 90, 20],     // Baja - ÁREA CON PÚAS
            [330, -100, 80, 16],     // Media altura
            [440, -150, 100, 20],    // Baja - ÁREA CON PÚAS
            [570, -100, 90, 16],     // Media altura (antes del salto final)
            [690, -50, 100, 16],     // Plataforma final elevada (salto grande)
        ];

        // Láseres [x, y, width, height]
        // Estos requieren Estado Rojo para pasar sin daño
        // Colocados estratégicamente en diferentes alturas
        this.laserData = [
            { x: -200, y: -105, width: 4, height: 55 },
            { x: -60, y: -55, width: 4, height: 55 },
            { x: 60, y: -105, width: 4, height: 55 },
            { x: 270, y: -105, width: 4, height: 55 },
            { x: 380, y: -55, width: 4, height: 55 },
            { x: 500, y: -105, width: 4, height: 55 },
            { x: 630, y: -55, width: 4, height: 60 },
        ];

        // Obstáculos de techo (púas que requieren agacharse)
        // [x, y, width, height]
        // Colocados sobre plataformas bajas para mayor desafío
        this.ceilingHazardData = [
            { x: 210, y: -100, width: 90, height: 30 },    // Sobre plataforma baja
            { x: 440, y: -100, width: 100, height: 30 },   // Sobre plataforma baja
        ];

        // Charcos de lava (requieren saltar)
        // [x, y, width, height]
        // Colocados en huecos entre plataformas para mayor desafío
        this.lavaPoolData = [
            { x: -350, y: -165, width: 70, height: 12 },   // Entre inicio y puente 1
            { x: -190, y: -165, width: 50, height: 12 },   // Antes de plataforma elevada
            { x: 30, y: -165, width: 60, height: 12 },     // Entre plataformas
            { x: 160, y: -165, width: 45, height: 12 },    // Antes de plataforma baja
            { x: 380, y: -165, width: 50, height: 12 },    // Entre plataformas
            { x: 520, y: -165, width: 40, height: 12 },    // Antes del final
        ];

        // Fragmentos [x, y]
        // Colocados en posiciones estratégicas que requieren habilidad
        this.fragmentData = [
            { x: -130, y: -70 },    // En plataforma elevada 1
            { x: 330, y: -70 },     // En plataforma media
            { x: 690, y: -20 },     
        ];

        // Meta (puerta EXIT) - En la plataforma final elevada
        this.goalData = { x: 720, y: -20 };

        // Triggers de mensajes
        this.messageTriggers = [
            {
                x: -380,
                radius: 60,
                type: 'info',
                header: '> SISTEMA DE DUALIDAD',
                body: 'Presiona X para cambiar entre Estado Lógico (■ Rojo) y Estado Emocional (● Cian).',
                triggered: false
            },
            {
                x: -350,
                radius: 50,
                type: 'warning',
                header: '> CHARCO DE LAVA',
                body: '¡Lava adelante! Salta (W) para evitarla o perderás una vida. Tienes 5 vidas (corazones arriba).',
                triggered: false
            },
            {
                x: -200,
                radius: 50,
                type: 'warning',
                header: '> LÁSER DETECTADO',
                body: '¡Láseres rojos! Cambia a Estado Lógico (■) con X para atravesarlos sin daño.',
                triggered: false
            },
            {
                x: 60,
                radius: 50,
                type: 'warning',
                header: '> OBSTÁCULO BAJO',
                body: '¡Púas en el techo! Mantén presionada S para agacharte y pasar por debajo. Puedes caminar agachado.',
                triggered: false
            },
            {
                x: 650,
                radius: 70,
                type: 'info',
                header: '> PUERTA DE SALIDA',
                body: '¡Casi lo logras! Recoge todos los fragmentos y entra a la puerta EXIT para avanzar al Nivel 2.',
                triggered: false
            }
        ];
    }

    build() {
        this.createBackground();
        this.createPlatforms();
        this.createLasers();
        this.createCeilingHazards();
        this.createLavaPools();
        this.createFragments();
        this.createGoal();
    }

    createBackground() {
        // Fondo de laberinto oscuro con paredes y pasillos
        const bgGeo = new THREE.PlaneGeometry(1600, 700);
        const bgMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                
                // Función para crear patrón de laberinto
                float maze(vec2 p) {
                    vec2 cell = floor(p);
                    vec2 frac = fract(p);
                    
                    // Paredes del laberinto
                    float wall = 0.0;
                    
                    // Paredes verticales
                    if (frac.x < 0.08 || frac.x > 0.92) wall = 1.0;
                    // Paredes horizontales
                    if (frac.y < 0.08 || frac.y > 0.92) wall = 1.0;
                    
                    // Patrón pseudo-aleatorio para crear laberinto
                    float hash = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
                    if (hash > 0.6 && frac.x > 0.4 && frac.x < 0.6) wall = 1.0;
                    if (hash < 0.4 && frac.y > 0.4 && frac.y < 0.6) wall = 1.0;
                    
                    return wall;
                }
                
                void main() {
                    vec2 uv = vUv;
                    
                    // Color base del laberinto (gris oscuro)
                    vec3 col = vec3(0.02, 0.02, 0.03);
                    
                    // Patrón de laberinto
                    float mazePattern = maze(uv * 20.0);
                    vec3 wallColor = vec3(0.08, 0.08, 0.12);
                    col = mix(col, wallColor, mazePattern);
                    
                    // Líneas de neón en las paredes (efecto cyberpunk)
                    float neonLines = step(0.97, fract(uv.x * 40.0));
                    neonLines += step(0.97, fract(uv.y * 25.0));
                    vec3 neonColor = vec3(0.0, 0.4, 0.6) * (0.3 + sin(uTime * 2.0) * 0.2);
                    col += neonLines * neonColor * 0.15;
                    
                    // Scanlines horizontales
                    col += sin(uv.y * 800.0 + uTime * 3.0) * 0.008;
                    
                    // Interferencia estática
                    float noise = fract(sin(dot(uv * 150.0 + uTime * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
                    col += noise * 0.006;
                    
                    // Sombras en las esquinas (viñeta)
                    float vig = 1.0 - length((uv - 0.5) * 1.3);
                    col *= vig;
                    
                    // Efecto de profundidad (gradiente vertical)
                    col *= 0.7 + uv.y * 0.3;
                    
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -5;
        this.scene.add(bg);
        this.bgMaterial = bgMat;

        // Paredes decorativas del laberinto (verticales)
        for (let i = 0; i < 15; i++) {
            const x = -700 + i * 100;
            const height = 100 + Math.random() * 80;
            const wall = this.createMazeWall(x, 200, 8, height);
            this.scene.add(wall);
        }

        // Paredes horizontales decorativas
        for (let i = 0; i < 8; i++) {
            const x = -600 + i * 200;
            const width = 60 + Math.random() * 40;
            const wall = this.createMazeWall(x, 150 - i * 30, width, 8);
            this.scene.add(wall);
        }

        // Luces de neón en las paredes
        for (let i = 0; i < 10; i++) {
            const x = -650 + i * 150;
            const light = this.createNeonLight(x, 180 + Math.sin(i) * 40);
            this.scene.add(light);
        }
    }

    createMazeWall(x, y, width, height) {
        const group = new THREE.Group();
        
        // Pared principal
        const wallGeo = new THREE.PlaneGeometry(width, height);
        const wallMat = new THREE.MeshBasicMaterial({
            color: 0x1a1a28, transparent: true, opacity: 0.6
        });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        group.add(wall);
        
        // Borde brillante
        const borderGeo = new THREE.PlaneGeometry(width + 2, height + 2);
        const borderMat = new THREE.MeshBasicMaterial({
            color: 0x2a3a4a, transparent: true, opacity: 0.3
        });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.z = -0.1;
        group.add(border);
        
        group.position.set(x, y, -3);
        return group;
    }

    createNeonLight(x, y) {
        const group = new THREE.Group();
        
        // Luz de neón
        const lightGeo = new THREE.PlaneGeometry(4, 12);
        const lightMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff, transparent: true, opacity: 0.4
        });
        const light = new THREE.Mesh(lightGeo, lightMat);
        group.add(light);
        
        // Glow
        const glowGeo = new THREE.PlaneGeometry(8, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff, transparent: true, opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.z = -0.1;
        group.add(glow);
        
        group.position.set(x, y, -2);
        return group;
    }

    createPlatforms() {
        this.platformData.forEach(([x, y, w, h]) => {
            const platform = this.createPlatform(x, y, w, h);
            this.platforms.push({ mesh: platform, x, y, w, h });
            this.scene.add(platform);
        });
    }

    createPlatform(x, y, w, h) {
        const group = new THREE.Group();

        // Superficie principal
        const surfGeo = new THREE.PlaneGeometry(w, h);
        const surfMat = new THREE.MeshBasicMaterial({ color: 0x222233 });
        group.add(new THREE.Mesh(surfGeo, surfMat));

        // Borde superior metálico
        const edgeGeo = new THREE.PlaneGeometry(w, 3);
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0x3a3a4a });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.set(0, h / 2, 0.1);
        group.add(edge);

        // Línea de neón sutil en el borde
        const neonGeo = new THREE.PlaneGeometry(w, 1);
        const neonMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff, transparent: true, opacity: 0.15
        });
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.set(0, h / 2 + 1, 0.2);
        group.add(neon);

        // Remaches
        const rivetCount = Math.floor(w / 25);
        for (let i = 0; i < rivetCount; i++) {
            const rivetGeo = new THREE.PlaneGeometry(2, 2);
            const rivetMat = new THREE.MeshBasicMaterial({ color: 0x3a3a4a });
            const rivet = new THREE.Mesh(rivetGeo, rivetMat);
            rivet.position.set(-w / 2 + 12 + i * 25, -2, 0.1);
            group.add(rivet);
        }

        // Patrón de rayas verticales (rejilla metálica)
        const stripeCount = Math.floor(w / 12);
        for (let i = 0; i < stripeCount; i++) {
            const stripeGeo = new THREE.PlaneGeometry(1, h - 4);
            const stripeMat = new THREE.MeshBasicMaterial({
                color: 0x1a1a28, transparent: true, opacity: 0.4
            });
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.position.set(-w / 2 + 6 + i * 12, -1, 0.05);
            group.add(stripe);
        }

        group.position.set(x, y, 0);
        return group;
    }

    createLasers() {
        this.laserData.forEach(data => {
            const laser = this.createLaser(data);
            this.lasers.push({ ...data, mesh: laser, active: true });
            this.scene.add(laser);
        });
    }

    createLaser(data) {
        const group = new THREE.Group();

        // Emisor superior (torreta)
        const emitterGeo = new THREE.PlaneGeometry(18, 18);
        const emitterMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
        group.add(new THREE.Mesh(emitterGeo, emitterMat));
        const emitter = group.children[0];
        emitter.position.y = data.height / 2 + 12;

        // Ojo rojo del emisor
        const eyeGeo = new THREE.PlaneGeometry(8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, data.height / 2 + 12, 0.1);
        group.add(eye);

        // Rayo láser
        const laserGeo = new THREE.PlaneGeometry(data.width, data.height);
        const laserMat = new THREE.MeshBasicMaterial({
            color: 0xff0000, transparent: true, opacity: 0.75
        });
        group.add(new THREE.Mesh(laserGeo, laserMat));

        // Glow del láser
        const glowGeo = new THREE.PlaneGeometry(data.width + 10, data.height);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff0000, transparent: true, opacity: 0.12
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.z = -0.1;
        group.add(glow);
        this._laserGlows.push(glowMat);

        // Partículas de impacto (abajo)
        const sparkGeo = new THREE.PlaneGeometry(6, 6);
        const sparkMat = new THREE.MeshBasicMaterial({
            color: 0xff4400, transparent: true, opacity: 0.5
        });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        spark.position.set(0, -data.height / 2 - 3, 0.1);
        group.add(spark);

        // Receptor inferior
        const receptorGeo = new THREE.PlaneGeometry(14, 10);
        const receptorMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const receptor = new THREE.Mesh(receptorGeo, receptorMat);
        receptor.position.y = -data.height / 2 - 8;
        group.add(receptor);

        group.position.set(data.x, data.y, 2);
        return group;
    }

    createCeilingHazards() {
        this.ceilingHazardData.forEach(data => {
            const hazard = this.createCeilingHazard(data);
            this.ceilingHazards.push({ ...data, mesh: hazard });
            this.scene.add(hazard);
        });
    }

    createCeilingHazard(data) {
        const group = new THREE.Group();

        // Base del techo
        const baseGeo = new THREE.PlaneGeometry(data.width, 8);
        const baseMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = data.height / 2 - 4;
        group.add(base);

        // Púas colgantes
        const spikeCount = Math.floor(data.width / 12);
        for (let i = 0; i < spikeCount; i++) {
            const spike = this.createSpike();
            spike.position.set(-data.width / 2 + 6 + i * 12, data.height / 2 - 8, 0.1);
            group.add(spike);
        }

        // Línea de advertencia roja
        const warningGeo = new THREE.PlaneGeometry(data.width, 2);
        const warningMat = new THREE.MeshBasicMaterial({
            color: 0xff3030, transparent: true, opacity: 0.6
        });
        const warning = new THREE.Mesh(warningGeo, warningMat);
        warning.position.y = -data.height / 2 + 1;
        group.add(warning);

        group.position.set(data.x, data.y, 2);
        return group;
    }

    createLavaPools() {
        this.lavaPoolData.forEach(data => {
            const pool = this.createLavaPool(data);
            this.lavaPools.push({ ...data, mesh: pool });
            this.scene.add(pool);
        });
    }

    createLavaPool(data) {
        const group = new THREE.Group();

        // Superficie de lava
        const lavaGeo = new THREE.PlaneGeometry(data.width, data.height);
        const lavaMat = new THREE.MeshBasicMaterial({
            color: 0xff4400, transparent: true, opacity: 0.85
        });
        const lava = new THREE.Mesh(lavaGeo, lavaMat);
        group.add(lava);

        // Glow naranja
        const glowGeo = new THREE.PlaneGeometry(data.width + 8, data.height + 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff6600, transparent: true, opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.z = -0.1;
        group.add(glow);
        this._lavaGlows.push(glowMat);

        // Burbujas (partículas)
        for (let i = 0; i < 3; i++) {
            const bubbleGeo = new THREE.PlaneGeometry(3, 3);
            const bubbleMat = new THREE.MeshBasicMaterial({
                color: 0xffaa00, transparent: true, opacity: 0.6
            });
            const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
            bubble.position.set(-data.width / 2 + 10 + i * (data.width / 4), 0, 0.1);
            group.add(bubble);
        }

        // Borde oscuro
        const borderGeo = new THREE.PlaneGeometry(data.width + 4, data.height + 4);
        const borderMat = new THREE.MeshBasicMaterial({
            color: 0x331100, transparent: true, opacity: 0.7
        });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.z = -0.2;
        group.add(border);

        group.position.set(data.x, data.y, 1);
        return group;
    }

    createSpike() {
        const group = new THREE.Group();

        // Púa triangular
        const spikeGeo = new THREE.PlaneGeometry(8, 16);
        const spikeMat = new THREE.MeshBasicMaterial({ color: 0x4a4a4a });
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        group.add(spike);

        // Punta afilada
        const tipGeo = new THREE.PlaneGeometry(4, 8);
        const tipMat = new THREE.MeshBasicMaterial({ color: 0x6a6a6a });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.y = -8;
        group.add(tip);

        // Brillo metálico
        const shineGeo = new THREE.PlaneGeometry(2, 12);
        const shineMat = new THREE.MeshBasicMaterial({
            color: 0x8a8a8a, transparent: true, opacity: 0.5
        });
        const shine = new THREE.Mesh(shineGeo, shineMat);
        shine.position.set(-2, -2, 0.05);
        group.add(shine);

        return group;
    }

    createFragments() {
        this.fragmentData.forEach((data, i) => {
            const fragment = this.createFragment(data.x, data.y);
            this.fragments.push({ mesh: fragment, x: data.x, y: data.y, collected: false, index: i });
            this.scene.add(fragment);
        });
    }

    createFragment(x, y) {
        const group = new THREE.Group();

        // Cristal del fragmento (diamante)
        const crystalGeo = new THREE.PlaneGeometry(14, 14);
        const crystalMat = new THREE.MeshBasicMaterial({
            color: 0x40a0ff, transparent: true, opacity: 0.9
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.rotation.z = Math.PI / 4;
        group.add(crystal);

        // Borde brillante
        const borderGeo = new THREE.PlaneGeometry(17, 17);
        const borderMat = new THREE.MeshBasicMaterial({
            color: 0x80c0ff, transparent: true, opacity: 0.4
        });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.rotation.z = Math.PI / 4;
        border.position.z = -0.05;
        group.add(border);

        // Glow exterior
        const glowGeo = new THREE.PlaneGeometry(26, 26);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x3080ff, transparent: true, opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.z = Math.PI / 4;
        glow.position.z = -0.1;
        group.add(glow);

        group.position.set(x, y, 3);
        return group;
    }

    createGoal() {
        const group = new THREE.Group();

        // Marco de la puerta (estructura metálica)
        const frameGeo = new THREE.PlaneGeometry(40, 60);
        const frameMat = new THREE.MeshBasicMaterial({
            color: 0x2a2a3a, transparent: true, opacity: 0.9
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.z = -0.2;
        group.add(frame);

        // Borde exterior brillante
        const outerFrameGeo = new THREE.PlaneGeometry(44, 64);
        const outerFrameMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88, transparent: true, opacity: 0.3
        });
        const outerFrame = new THREE.Mesh(outerFrameGeo, outerFrameMat);
        outerFrame.position.z = -0.3;
        group.add(outerFrame);

        // Portal/meta (interior de la puerta)
        const portalGeo = new THREE.PlaneGeometry(32, 52);
        const portalMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88, transparent: true, opacity: 0.35
        });
        const portal = new THREE.Mesh(portalGeo, portalMat);
        group.add(portal);

        // Efecto de energía (capas)
        const energyGeo = new THREE.PlaneGeometry(28, 48);
        const energyMat = new THREE.MeshBasicMaterial({
            color: 0x00ffaa, transparent: true, opacity: 0.2
        });
        const energy = new THREE.Mesh(energyGeo, energyMat);
        energy.position.z = 0.1;
        group.add(energy);

        // Glow exterior grande
        const glowGeo = new THREE.PlaneGeometry(50, 70);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88, transparent: true, opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.z = -0.4;
        group.add(glow);

        // Texto "EXIT" más grande y visible
        const exitCanvas = document.createElement('canvas');
        exitCanvas.width = 128;
        exitCanvas.height = 32;
        const ectx = exitCanvas.getContext('2d');
        ectx.fillStyle = '#00ff88';
        ectx.font = 'bold 20px monospace';
        ectx.textAlign = 'center';
        ectx.fillText('EXIT', 64, 24);
        const exitTex = new THREE.CanvasTexture(exitCanvas);
        exitTex.magFilter = THREE.NearestFilter;
        const exitGeo = new THREE.PlaneGeometry(48, 12);
        const exitMat = new THREE.MeshBasicMaterial({ map: exitTex, transparent: true });
        const exitMesh = new THREE.Mesh(exitGeo, exitMat);
        exitMesh.position.set(0, 38, 0.2);
        group.add(exitMesh);

        // Texto "NIVEL 2" debajo
        const level2Canvas = document.createElement('canvas');
        level2Canvas.width = 128;
        level2Canvas.height = 24;
        const l2ctx = level2Canvas.getContext('2d');
        l2ctx.fillStyle = '#00ff8888';
        l2ctx.font = 'bold 14px monospace';
        l2ctx.textAlign = 'center';
        l2ctx.fillText('NIVEL 2', 64, 18);
        const level2Tex = new THREE.CanvasTexture(level2Canvas);
        level2Tex.magFilter = THREE.NearestFilter;
        const level2Geo = new THREE.PlaneGeometry(40, 10);
        const level2Mat = new THREE.MeshBasicMaterial({ map: level2Tex, transparent: true });
        const level2Mesh = new THREE.Mesh(level2Geo, level2Mat);
        level2Mesh.position.set(0, -32, 0.2);
        group.add(level2Mesh);

        // Flecha animada arriba
        const arrowCanvas = document.createElement('canvas');
        arrowCanvas.width = 24;
        arrowCanvas.height = 24;
        const actx = arrowCanvas.getContext('2d');
        actx.fillStyle = '#00ff88';
        actx.font = 'bold 20px monospace';
        actx.fillText('▼', 4, 20);
        const arrowTex = new THREE.CanvasTexture(arrowCanvas);
        arrowTex.magFilter = THREE.NearestFilter;
        const arrowGeo = new THREE.PlaneGeometry(14, 14);
        const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.position.set(0, 52, 0.2);
        group.add(arrow);

        // Partículas decorativas alrededor de la puerta
        for (let i = 0; i < 6; i++) {
            const particleGeo = new THREE.PlaneGeometry(3, 3);
            const particleMat = new THREE.MeshBasicMaterial({
                color: 0x00ff88, transparent: true, opacity: 0.6
            });
            const particle = new THREE.Mesh(particleGeo, particleMat);
            const angle = (i / 6) * Math.PI * 2;
            particle.position.set(Math.cos(angle) * 25, Math.sin(angle) * 35, 0.3);
            group.add(particle);
        }

        group.position.set(this.goalData.x, this.goalData.y, 1);
        this.goal = group;
        this.scene.add(group);
    }

    // --- Lógica de colisiones ---

    canMoveTo(x, y, playerSize) {
        if (x < -550 || x > 850) return false;
        if (y > 300) return false;
        return true;
    }

    getGroundAt(x, y) {
        let groundY = this.deathY;
        const halfPlayer = 14;

        for (const p of this.platforms) {
            const pLeft = p.x - p.w / 2;
            const pRight = p.x + p.w / 2;
            const pTop = p.y + p.h / 2;

            if (x >= pLeft - halfPlayer && x <= pRight + halfPlayer) {
                if (pTop <= y && pTop > groundY) {
                    groundY = pTop;
                }
            }
        }
        return groundY;
    }

    checkFragmentCollection(player) {
        let collected = 0;
        for (const frag of this.fragments) {
            if (frag.collected) continue;

            const dist = Math.sqrt(
                Math.pow(player.position.x - frag.x, 2) +
                Math.pow(player.position.y - frag.y, 2)
            );

            if (dist < 30) {
                frag.collected = true;
                frag.mesh.visible = false;
                collected++;
            }
        }
        return collected;
    }

    /**
     * Verifica colisión con láseres rojos
     * Solo hace daño si el jugador NO está en Estado Rojo (Lógico)
     */
    checkLaserCollision(player) {
        // Si el jugador está en Estado Rojo, es inmune a los láseres
        if (player.state === 'RED') {
            return false;
        }

        const bounds = player.getBounds();
        for (const laser of this.lasers) {
            if (!laser.active) continue;
            const laserLeft = laser.x - laser.width / 2 - 8;
            const laserRight = laser.x + laser.width / 2 + 8;
            const laserTop = laser.y + laser.height / 2 + 5;
            const laserBottom = laser.y - laser.height / 2 - 5;

            if (bounds.right > laserLeft && bounds.left < laserRight &&
                bounds.top > laserBottom && bounds.bottom < laserTop) {
                return true;
            }
        }
        return false;
    }

    /**
     * Verifica colisión con obstáculos de techo (púas)
     * Solo hace daño si el jugador NO está agachado
     */
    checkCeilingCollision(player) {
        // Si el jugador está agachado, no colisiona con las púas
        if (player.animation === 'CROUCH' || player.isCrouching) {
            return false;
        }

        const bounds = player.getBounds();
        for (const hazard of this.ceilingHazards) {
            const hazardLeft = hazard.x - hazard.width / 2;
            const hazardRight = hazard.x + hazard.width / 2;
            const hazardTop = hazard.y + hazard.height / 2;
            const hazardBottom = hazard.y - hazard.height / 2;

            if (bounds.right > hazardLeft && bounds.left < hazardRight &&
                bounds.top > hazardBottom && bounds.bottom < hazardTop) {
                return true;
            }
        }
        return false;
    }

    /**
     * Verifica colisión con charcos de lava
     * Siempre hace daño si el jugador toca la lava
     */
    checkLavaCollision(player) {
        const bounds = player.getBounds();
        for (const pool of this.lavaPools) {
            const poolLeft = pool.x - pool.width / 2;
            const poolRight = pool.x + pool.width / 2;
            const poolTop = pool.y + pool.height / 2;
            const poolBottom = pool.y - pool.height / 2;

            if (bounds.right > poolLeft && bounds.left < poolRight &&
                bounds.top > poolBottom && bounds.bottom < poolTop) {
                return true;
            }
        }
        return false;
    }

    checkGoalReached(player) {
        const dist = Math.sqrt(
            Math.pow(player.position.x - this.goalData.x, 2) +
            Math.pow(player.position.y - this.goalData.y, 2)
        );
        return dist < 30;
    }

    reset() {
        for (const frag of this.fragments) {
            frag.collected = false;
            frag.mesh.visible = true;
        }
        // Reset triggers
        for (const trigger of this.messageTriggers) {
            trigger.triggered = false;
        }
    }

    /**
     * Verifica si el jugador activó algún trigger de mensaje
     * @returns {object|null} El trigger activado o null
     */
    checkMessageTriggers(player) {
        for (const trigger of this.messageTriggers) {
            if (trigger.triggered) continue;
            const dist = Math.abs(player.position.x - trigger.x);
            if (dist < trigger.radius) {
                trigger.triggered = true;
                return trigger;
            }
        }
        return null;
    }

    update(delta) {
        this.time += delta;

        // Fondo animado
        if (this.bgMaterial) {
            this.bgMaterial.uniforms.uTime.value = this.time;
        }

        // Fragmentos flotantes
        for (const frag of this.fragments) {
            if (!frag.collected) {
                frag.mesh.position.y = frag.y + Math.sin(this.time * 2.5 + frag.index * 2) * 5;
                frag.mesh.children[0].rotation.z = Math.PI / 4 + Math.sin(this.time * 1.5 + frag.index) * 0.15;
            }
        }

        // Láseres pulsantes
        this._laserGlows.forEach((mat, i) => {
            mat.opacity = 0.08 + Math.sin(this.time * 6 + i * 2) * 0.06;
        });

        // Lava pulsante
        this._lavaGlows.forEach((mat, i) => {
            mat.opacity = 0.25 + Math.sin(this.time * 4 + i * 1.5) * 0.15;
        });

        // Portal animado (puerta EXIT)
        if (this.goal) {
            // Pulsación del portal interior
            this.goal.children[2].material.opacity = 0.3 + Math.sin(this.time * 3) * 0.1;
            // Energía interna
            this.goal.children[3].material.opacity = 0.15 + Math.sin(this.time * 4) * 0.08;
            // Glow exterior
            this.goal.children[4].material.opacity = 0.12 + Math.sin(this.time * 2.5) * 0.06;
            // Flecha flotante
            if (this.goal.children[7]) {
                this.goal.children[7].position.y = 52 + Math.sin(this.time * 4) * 4;
            }
            // Partículas orbitando
            for (let i = 8; i < this.goal.children.length; i++) {
                const particle = this.goal.children[i];
                const baseAngle = ((i - 8) / 6) * Math.PI * 2;
                const angle = baseAngle + this.time * 1.5;
                particle.position.x = Math.cos(angle) * 25;
                particle.position.y = Math.sin(angle) * 35;
                particle.material.opacity = 0.4 + Math.sin(this.time * 5 + i) * 0.3;
            }
        }

        // Púas oscilantes (efecto amenazante)
        for (const hazard of this.ceilingHazards) {
            const spikes = hazard.mesh.children.slice(1, -1); // Excluir base y línea de advertencia
            spikes.forEach((spike, i) => {
                spike.position.y = hazard.height / 2 - 8 + Math.sin(this.time * 3 + i * 0.5) * 2;
            });
        }

        // Burbujas de lava
        for (const pool of this.lavaPools) {
            const bubbles = pool.mesh.children.slice(2, 5); // Las burbujas
            bubbles.forEach((bubble, i) => {
                bubble.position.y = Math.sin(this.time * 2 + i * 2) * 2;
                bubble.material.opacity = 0.4 + Math.sin(this.time * 3 + i) * 0.3;
            });
        }
    }
}
