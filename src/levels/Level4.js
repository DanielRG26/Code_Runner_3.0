/**
 * Level4 - Nucleo de Procesamiento Corrupto
 * Mapa grande con plataformas moviles, enemigos centinela,
 * laseres con timing, plataformas que desaparecen, acido en el suelo
 */
import * as THREE from 'three';

export class Level4 {
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.movingPlatforms = [];
        this.disappearingPlatforms = [];
        this.lasers = [];
        this.sentinels = [];
        this.acidPools = [];
        this.fragments = [];
        this.goal = null;
        this.time = 0;
        this._laserGlows = [];

        // Spawn: izquierda, plataforma elevada (como referencia)
        this.spawnPoint = { x: -1100, y: 30 };
        this.cameraCenter = { x: 0, y: 0 };
        this.deathY = -240;

        // Plataformas estáticas - 7 ZONAS con dificultad creciente
        this.platformData = [
            // === ZONA 1: INTRODUCCIÓN (Aprende) ===
            // Spawn alto izquierda + bajada
            [-1150, 0, 130, 24],         // Spawn principal
            [-1000, -40, 80, 16],
            [-880, -80, 80, 16],
            [-760, -120, 100, 24],       // Suelo zona 1

            // === ZONA 2: RITMO (Láser + Espera) ===
            // Plataforma con láser que se enciende/apaga - hay que esperar
            [-580, -120, 160, 24],
            [-380, -60, 120, 16],
            [-210, -120, 140, 24],

            // === ZONA 3: OBSERVA (Plataformas) ===
            // Subida con escalones y plataforma elevada
            [-30, -80, 90, 16],
            [110, -40, 90, 16],
            [240, 0, 100, 16],
            [380, -40, 80, 16],

            // === ZONA 4: SINCRONIZA (Móviles) ===
            // Plataformas móviles para cruzar
            [510, -80, 100, 16],
            [770, -80, 100, 16],

            // === ZONA 5: PRECISIÓN (Riesgo Medio) ===
            // Saltos precisos con láseres y plataformas pequeñas
            [930, -40, 70, 16],
            [1060, 0, 70, 16],
            [1190, 40, 70, 16],
            [1320, 0, 80, 16],

            // === ZONA 6: CONTROL (Elevador) ===
            // Subida con elevador móvil + plataforma alta
            [1480, 30, 100, 16],
            [1640, 80, 100, 16],

            // === ZONA 7: DECISIÓN (Final) ===
            // Plataformas finales hacia la meta
            [1820, 110, 80, 16],
            [1960, 140, 200, 30],         // Meta - plataforma con la puerta
        ];

        // Plataformas móviles (zona 4 principal + ayudas)
        this.movingPlatformData = [
            // Zona 4: SINCRONIZA - 2 plataformas móviles horizontales (núcleo)
            { x: 660, y: -50, w: 60, h: 14, moveX: 50, moveY: 0, speed: 0.9 },
            { x: 870, y: -50, w: 60, h: 14, moveX: 0, moveY: 30, speed: 0.8 },
            // Zona 6: CONTROL - elevador vertical
            { x: 1560, y: 60, w: 70, h: 14, moveX: 0, moveY: 35, speed: 0.7 },
            // Zona 7: ayuda final
            { x: 1900, y: 120, w: 55, h: 14, moveX: 30, moveY: 0, speed: 1.0 },
        ];

        // Plataformas que desaparecen (atajos en zona 5)
        this.disappearingPlatformData = [
            { x: 1130, y: 25, w: 50, h: 12, onTime: 2.4, offTime: 1.4 },
            { x: 1260, y: 25, w: 50, h: 12, onTime: 2.4, offTime: 1.4 },
        ];

        // Láseres - distribuidos por zonas según el diseño
        this.laserData = [
            // Zona 2: RITMO - láser principal que enseña timing
            [-470, -55, 4, 60, 1.8, 2.5, 0],
            // Zona 3: OBSERVA - láser entre escalones
            [60, -10, 4, 60, 1.5, 2.2, 0.5],
            // Zona 5: PRECISIÓN - 2 láseres en secuencia
            [990, 5, 4, 60, 1.4, 2.0, 0],
            [1130, 80, 4, 50, 1.3, 2.0, 1.2],
            // Zona 7: DECISIÓN - láser antes de la meta
            [1880, 175, 4, 50, 1.4, 2.0, 0.8],
        ].map(([x, y, width, height, onTime, offTime, phase]) => ({
            x, y, width, height, onTime, offTime, phase
        }));

        // Centinelas - en plataformas clave (uno por zona crítica)
        this.sentinelData = [
            // Zona 1
            { x: -890, y: -102, patrolLeft: -930, patrolRight: -830, speed: 32 },
            // Zona 2
            { x: -290, y: -102, patrolLeft: -270, patrolRight: -150, speed: 38 },
            // Zona 5
            { x: 1210, y: 62, patrolLeft: 1170, patrolRight: 1230, speed: 35 },
            // Zona 7 (cerca de la meta)
            { x: 1850, y: 132, patrolLeft: 1810, patrolRight: 1900, speed: 42 },
        ];

        // Ácido continuo en el suelo (debajo de todo)
        this.acidData = [];
        for (let x = -1100; x <= 2000; x += 100) {
            this.acidData.push({ x, y: -210, w: 90, h: 18 });
        }

        // 9 Fragmentos distribuidos en las 7 zonas (algunos requieren riesgo)
        this.fragmentData = [
            { x: -1080, y: 60 },     // Zona 1: cerca del spawn
            { x: -880, y: -50 },     // Zona 1: en escalón
            { x: -380, y: -25 },     // Zona 2: sobre el láser
            { x: 240, y: 35 },       // Zona 3: alto
            { x: 660, y: -15 },      // Zona 4: sobre plataforma móvil
            { x: 870, y: 0 },        // Zona 4: sobre elevador
            { x: 1190, y: 75 },      // Zona 5: alto en saltos precisos
            { x: 1640, y: 115 },     // Zona 6: arriba elevador
            { x: 1820, y: 145 },     // Zona 7: cerca de la meta
        ];

        this.totalFragments = 9;
        this.goalData = { x: 2080, y: 175 };
        this.messageTriggers = [];
    }

    build() {
        this.createBackground();
        this.createPlatforms();
        this.createMovingPlatforms();
        this.createDisappearingPlatforms();
        this.createAcidPools();
        this.createLasers();
        this.createSentinels();
        this.createFragments();
        this.createGoal();
    }

    createBackground() {
        const bgGeo = new THREE.PlaneGeometry(3500, 800);
        const bgMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: `
                varying vec2 vUv;
                void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                void main() {
                    // Base oscura con tinte rojo/púrpura (núcleo corrupto)
                    vec3 col = mix(vec3(0.03, 0.01, 0.04), vec3(0.05, 0.02, 0.06), vUv.y);
                    // Grid de datos corrupto
                    float gx = step(0.97, fract(vUv.x * 22.0));
                    float gy = step(0.97, fract(vUv.y * 14.0));
                    col += (gx + gy) * vec3(0.02, 0.005, 0.025);
                    // Líneas horizontales de datos
                    float hline = step(0.993, fract(vUv.y * 35.0));
                    col += hline * vec3(0.03, 0.0, 0.02);
                    // Scanlines
                    col += sin(vUv.y * 400.0 + uTime * 1.5) * vec3(0.003, 0.001, 0.004);
                    // Niebla roja abajo (zona de peligro)
                    float fog = smoothstep(0.35, 0.0, vUv.y) * 0.25;
                    col += fog * vec3(0.4, 0.05, 0.08);
                    // Pulso de corrupción
                    float pulse = sin(uTime * 0.8 + vUv.x * 3.0) * 0.5 + 0.5;
                    col += pulse * vec3(0.015, 0.0, 0.02) * smoothstep(0.7, 1.0, vUv.x);
                    // Noise estático
                    float noise = fract(sin(dot(vUv * 60.0 + uTime * 0.03, vec2(12.9898, 78.233))) * 43758.5453);
                    col += noise * 0.005;
                    // Viñeta
                    float vig = 1.0 - length((vUv - 0.5) * 1.5);
                    col *= max(vig, 0.0);
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -6;
        this.scene.add(bg);
        this.bgMaterial = bgMat;

        // Tuberías de datos horizontales (decorativas)
        const pipes = [
            { x: -200, y: 80, w: 500, h: 6 },
            { x: 300, y: 120, w: 400, h: 5 },
            { x: 700, y: 60, w: 350, h: 6 },
            { x: -400, y: 140, w: 300, h: 5 },
            { x: 1000, y: 100, w: 400, h: 6 },
        ];
        pipes.forEach(p => {
            const group = new THREE.Group();
            const geo = new THREE.PlaneGeometry(p.w, p.h);
            const mat = new THREE.MeshBasicMaterial({ color: 0x1a1020, transparent: true, opacity: 0.6 });
            group.add(new THREE.Mesh(geo, mat));
            // Borde luminoso rojo
            const edgeGeo = new THREE.PlaneGeometry(p.w, 1.5);
            const edgeMat = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.12 });
            const edge = new THREE.Mesh(edgeGeo, edgeMat);
            edge.position.set(0, p.h / 2, 0.1);
            group.add(edge);
            // Conectores
            const connCount = Math.floor(p.w / 60);
            for (let i = 0; i < connCount; i++) {
                const cg = new THREE.PlaneGeometry(4, p.h + 4);
                const cm = new THREE.MeshBasicMaterial({ color: 0x201020, transparent: true, opacity: 0.6 });
                const c = new THREE.Mesh(cg, cm);
                c.position.set(-p.w / 2 + 30 + i * 60, 0, 0.1);
                group.add(c);
            }
            group.position.set(p.x, p.y, -3);
            this.scene.add(group);
        });

        // Cables verticales colgantes
        for (let i = 0; i < 24; i++) {
            const x = -600 + i * 90;
            const len = 50 + Math.random() * 120;
            const geo = new THREE.PlaneGeometry(1.5, len);
            const mat = new THREE.MeshBasicMaterial({ color: 0x1a0a1a, transparent: true, opacity: 0.45 });
            const cable = new THREE.Mesh(geo, mat);
            cable.position.set(x, 280 - len / 2, -4);
            this.scene.add(cable);
        }

        // Partículas de corrupción flotantes
        for (let i = 0; i < 15; i++) {
            const size = 2 + Math.random() * 3;
            const geo = new THREE.PlaneGeometry(size, size);
            const mat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xff3030 : 0x8800aa,
                transparent: true, opacity: 0.15 + Math.random() * 0.2
            });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.set(
                -500 + Math.random() * 1800,
                -150 + Math.random() * 350,
                -2
            );
            particle.userData = {
                baseX: particle.position.x,
                baseY: particle.position.y,
                sx: 0.3 + Math.random() * 0.6,
                sy: 0.4 + Math.random() * 0.8,
                phase: Math.random() * 6.28
            };
            this.scene.add(particle);
            if (!this._particles) this._particles = [];
            this._particles.push(particle);
        }
    }

    createPlatforms() {
        this.platformData.forEach(([x, y, w, h]) => {
            const platform = this.createPlatformMesh(x, y, w, h);
            this.platforms.push({ mesh: platform, x, y, w, h });
            this.scene.add(platform);
        });
    }

    createPlatformMesh(x, y, w, h) {
        const group = new THREE.Group();
        const surfGeo = new THREE.PlaneGeometry(w, h);
        const surfMat = new THREE.MeshBasicMaterial({ color: 0x222233 });
        group.add(new THREE.Mesh(surfGeo, surfMat));
        const edgeGeo = new THREE.PlaneGeometry(w, 3);
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0x3a3a4a });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.set(0, h / 2, 0.1);
        group.add(edge);
        const neonGeo = new THREE.PlaneGeometry(w, 1);
        const neonMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.12 });
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.set(0, h / 2 + 1, 0.2);
        group.add(neon);
        group.position.set(x, y, 0);
        return group;
    }

    createMovingPlatforms() {
        this.movingPlatformData.forEach(data => {
            const mesh = this.createPlatformMesh(data.x, data.y, data.w, data.h);
            // Color diferente para moviles
            mesh.children[0].material = new THREE.MeshBasicMaterial({ color: 0x1a2a3a });
            mesh.children[2].material = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.15 });
            this.scene.add(mesh);
            this.movingPlatforms.push({
                mesh, baseX: data.x, baseY: data.y,
                w: data.w, h: data.h,
                moveX: data.moveX, moveY: data.moveY,
                speed: data.speed, x: data.x, y: data.y
            });
        });
    }

    createDisappearingPlatforms() {
        this.disappearingPlatformData.forEach(data => {
            const mesh = this.createPlatformMesh(data.x, data.y, data.w, data.h);
            mesh.children[0].material = new THREE.MeshBasicMaterial({ color: 0x2a1a2a });
            mesh.children[2].material = new THREE.MeshBasicMaterial({ color: 0xff44ff, transparent: true, opacity: 0.15 });
            this.scene.add(mesh);
            this.disappearingPlatforms.push({
                mesh, x: data.x, y: data.y, w: data.w, h: data.h,
                onTime: data.onTime, offTime: data.offTime,
                visible: true, timer: 0
            });
        });
    }

    createAcidPools() {
        this.acidData.forEach(data => {
            const group = new THREE.Group();
            const poolGeo = new THREE.PlaneGeometry(data.w, data.h);
            const poolMat = new THREE.MeshBasicMaterial({ color: 0x30ff30, transparent: true, opacity: 0.5 });
            group.add(new THREE.Mesh(poolGeo, poolMat));
            const glowGeo = new THREE.PlaneGeometry(data.w, data.h + 6);
            const glowMat = new THREE.MeshBasicMaterial({ color: 0x30ff30, transparent: true, opacity: 0.12 });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.z = -0.1;
            group.add(glow);
            group.position.set(data.x, data.y, 1);
            this.scene.add(group);
            this.acidPools.push({ mesh: group, ...data });
        });
    }

    createLasers() {
        this.laserData.forEach(data => {
            const group = new THREE.Group();
            // Emisor
            const emGeo = new THREE.PlaneGeometry(16, 16);
            const emMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
            const em = new THREE.Mesh(emGeo, emMat);
            em.position.y = data.height / 2 + 10;
            group.add(em);
            // Ojo
            const eyeGeo = new THREE.PlaneGeometry(6, 6);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(0, data.height / 2 + 10, 0.1);
            group.add(eye);
            // Rayo
            const laserGeo = new THREE.PlaneGeometry(data.width, data.height);
            const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.75 });
            const beam = new THREE.Mesh(laserGeo, laserMat);
            group.add(beam);
            // Glow
            const glowGeo = new THREE.PlaneGeometry(data.width + 10, data.height);
            const glowMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.1 });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.z = -0.1;
            group.add(glow);
            this._laserGlows.push(glowMat);
            group.position.set(data.x, data.y, 2);
            this.scene.add(group);
            this.lasers.push({ ...data, mesh: group, active: true });
        });
    }

    createSentinels() {
        this.sentinelData.forEach(data => {
            const group = new THREE.Group();
            // Cuerpo del centinela
            const bodyGeo = new THREE.PlaneGeometry(24, 28);
            const bodyMat = new THREE.MeshBasicMaterial({ color: 0x882222 });
            group.add(new THREE.Mesh(bodyGeo, bodyMat));
            // Ojo rojo
            const eyeGeo = new THREE.PlaneGeometry(8, 4);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9 });
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(0, 4, 0.1);
            group.add(eye);
            // Patas
            const legGeo = new THREE.PlaneGeometry(4, 8);
            const legMat = new THREE.MeshBasicMaterial({ color: 0x661111 });
            const legL = new THREE.Mesh(legGeo, legMat);
            legL.position.set(-6, -16, 0);
            const legR = new THREE.Mesh(legGeo, legMat);
            legR.position.set(6, -16, 0);
            group.add(legL, legR);
            // Glow amenazante
            const glowGeo = new THREE.PlaneGeometry(30, 34);
            const glowMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.08 });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.z = -0.1;
            group.add(glow);
            group.position.set(data.x, data.y, 3);
            this.scene.add(group);
            this.sentinels.push({ ...data, mesh: group, currentX: data.x, direction: 1 });
        });
    }

    createFragments() {
        this.fragmentData.forEach((data, i) => {
            const group = new THREE.Group();
            const crystalGeo = new THREE.PlaneGeometry(14, 14);
            const crystalMat = new THREE.MeshBasicMaterial({ color: 0x40a0ff, transparent: true, opacity: 0.9 });
            const crystal = new THREE.Mesh(crystalGeo, crystalMat);
            crystal.rotation.z = Math.PI / 4;
            group.add(crystal);
            const glowGeo = new THREE.PlaneGeometry(22, 22);
            const glowMat = new THREE.MeshBasicMaterial({ color: 0x3080ff, transparent: true, opacity: 0.15 });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.rotation.z = Math.PI / 4;
            glow.position.z = -0.1;
            group.add(glow);
            group.position.set(data.x, data.y, 3);
            this.scene.add(group);
            this.fragments.push({ mesh: group, x: data.x, y: data.y, collected: false, index: i });
        });
    }

    createGoal() {
        const group = new THREE.Group();
        const portalGeo = new THREE.PlaneGeometry(28, 44);
        const portalMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.25 });
        group.add(new THREE.Mesh(portalGeo, portalMat));
        const borderGeo = new THREE.PlaneGeometry(32, 48);
        const borderMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.z = -0.1;
        group.add(border);
        const exitCanvas = document.createElement('canvas');
        exitCanvas.width = 64; exitCanvas.height = 16;
        const ectx = exitCanvas.getContext('2d');
        ectx.fillStyle = '#00ff88'; ectx.font = 'bold 12px monospace';
        ectx.textAlign = 'center'; ectx.fillText('EXIT', 32, 12);
        const exitTex = new THREE.CanvasTexture(exitCanvas);
        exitTex.magFilter = THREE.NearestFilter;
        const exitMesh = new THREE.Mesh(new THREE.PlaneGeometry(32, 8), new THREE.MeshBasicMaterial({ map: exitTex, transparent: true }));
        exitMesh.position.set(0, 30, 0.1);
        group.add(exitMesh);
        group.position.set(this.goalData.x, this.goalData.y, 1);
        this.goal = group;
        this.scene.add(group);
    }

    // --- Colisiones ---

    canMoveTo(x, y, playerSize) {
        if (x < -1250 || x > 2050) return false;
        if (y > 400) return false;
        return true;
    }

    getGroundAt(x, y) {
        let groundY = this.deathY;
        const halfPlayer = 14;

        // Plataformas estaticas
        for (const p of this.platforms) {
            const pLeft = p.x - p.w / 2;
            const pRight = p.x + p.w / 2;
            const pTop = p.y + p.h / 2;
            if (x >= pLeft - halfPlayer && x <= pRight + halfPlayer) {
                if (pTop <= y && pTop > groundY) groundY = pTop;
            }
        }

        // Plataformas moviles
        for (const p of this.movingPlatforms) {
            const pLeft = p.x - p.w / 2;
            const pRight = p.x + p.w / 2;
            const pTop = p.y + p.h / 2;
            if (x >= pLeft - halfPlayer && x <= pRight + halfPlayer) {
                if (pTop <= y && pTop > groundY) groundY = pTop;
            }
        }

        // Plataformas que desaparecen (solo si visibles)
        for (const p of this.disappearingPlatforms) {
            if (!p.visible) continue;
            const pLeft = p.x - p.w / 2;
            const pRight = p.x + p.w / 2;
            const pTop = p.y + p.h / 2;
            if (x >= pLeft - halfPlayer && x <= pRight + halfPlayer) {
                if (pTop <= y && pTop > groundY) groundY = pTop;
            }
        }

        return groundY;
    }

    checkFragmentCollection(player) {
        let collected = 0;
        for (const frag of this.fragments) {
            if (frag.collected) continue;
            const dist = Math.sqrt(Math.pow(player.position.x - frag.x, 2) + Math.pow(player.position.y - frag.y, 2));
            if (dist < 30) { frag.collected = true; frag.mesh.visible = false; collected++; }
        }
        return collected;
    }

    checkLaserCollision(player) {
        const bounds = player.getBounds();
        for (const laser of this.lasers) {
            if (!laser.active) continue;
            const lL = laser.x - laser.width / 2 - 8;
            const lR = laser.x + laser.width / 2 + 8;
            const lT = laser.y + laser.height / 2 + 5;
            const lB = laser.y - laser.height / 2 - 5;
            if (bounds.right > lL && bounds.left < lR && bounds.top > lB && bounds.bottom < lT) return true;
        }
        return false;
    }

    checkAcidCollision(player) {
        const bounds = player.getBounds();
        for (const acid of this.acidPools) {
            const aL = acid.x - acid.w / 2;
            const aR = acid.x + acid.w / 2;
            const aT = acid.y + acid.h / 2;
            const aB = acid.y - acid.h / 2;
            if (bounds.right > aL && bounds.left < aR && bounds.top > aB && bounds.bottom < aT) return true;
        }
        return false;
    }

    checkSentinelCollision(player) {
        const bounds = player.getBounds();
        for (const s of this.sentinels) {
            const sL = s.currentX - 12;
            const sR = s.currentX + 12;
            const sT = s.mesh.position.y + 14;
            const sB = s.mesh.position.y - 14;
            if (bounds.right > sL && bounds.left < sR && bounds.top > sB && bounds.bottom < sT) return true;
        }
        return false;
    }

    checkGoalReached(player) {
        const dist = Math.sqrt(Math.pow(player.position.x - this.goalData.x, 2) + Math.pow(player.position.y - this.goalData.y, 2));
        return dist < 30;
    }

    checkMessageTriggers() { return null; }

    reset() {
        for (const frag of this.fragments) { frag.collected = false; frag.mesh.visible = true; }
        for (const dp of this.disappearingPlatforms) { dp.visible = true; dp.timer = 0; dp.mesh.visible = true; }
    }

    update(delta) {
        this.time += delta;

        if (this.bgMaterial) this.bgMaterial.uniforms.uTime.value = this.time;

        // Plataformas moviles
        for (const p of this.movingPlatforms) {
            p.x = p.baseX + Math.sin(this.time * p.speed) * p.moveX;
            p.y = p.baseY + Math.sin(this.time * p.speed) * p.moveY;
            p.mesh.position.set(p.x, p.y, 0);
        }

        // Plataformas que desaparecen
        for (const p of this.disappearingPlatforms) {
            p.timer += delta;
            const cycle = p.onTime + p.offTime;
            const t = p.timer % cycle;
            const shouldBeVisible = t < p.onTime;
            if (shouldBeVisible !== p.visible) {
                p.visible = shouldBeVisible;
                p.mesh.visible = shouldBeVisible;
            }
            // Parpadeo antes de desaparecer
            if (shouldBeVisible && t > p.onTime - 0.6) {
                p.mesh.visible = Math.sin(this.time * 20) > 0;
            }
        }

        // Laseres con timing
        for (const laser of this.lasers) {
            const cycle = laser.onTime + laser.offTime;
            const t = (this.time + laser.phase) % cycle;
            const shouldBeActive = t < laser.onTime;
            laser.active = shouldBeActive;
            laser.mesh.children[2].visible = shouldBeActive;
            laser.mesh.children[3].visible = shouldBeActive;
            laser.mesh.children[1].material.opacity = shouldBeActive ? 1.0 : 0.3;
        }

        // Centinelas patrullando
        for (const s of this.sentinels) {
            s.currentX += s.direction * s.speed * delta;
            if (s.currentX >= s.patrolRight) { s.currentX = s.patrolRight; s.direction = -1; }
            if (s.currentX <= s.patrolLeft) { s.currentX = s.patrolLeft; s.direction = 1; }
            s.mesh.position.x = s.currentX;
            s.mesh.scale.x = s.direction > 0 ? 1 : -1;
        }

        // Fragmentos flotantes
        for (const frag of this.fragments) {
            if (!frag.collected) {
                frag.mesh.position.y = frag.y + Math.sin(this.time * 2.5 + frag.index * 2) * 5;
            }
        }

        // Glow laseres
        this._laserGlows.forEach((mat, i) => {
            mat.opacity = 0.06 + Math.sin(this.time * 6 + i * 2) * 0.04;
        });

        // Acido pulsante
        for (const acid of this.acidPools) {
            acid.mesh.children[0].material.opacity = 0.4 + Math.sin(this.time * 3) * 0.1;
        }

        // Partículas de corrupción
        if (this._particles) {
            for (const p of this._particles) {
                const d = p.userData;
                p.position.x = d.baseX + Math.sin(this.time * d.sx + d.phase) * 15;
                p.position.y = d.baseY + Math.sin(this.time * d.sy + d.phase) * 10;
                p.material.opacity = 0.1 + Math.sin(this.time * 2 + d.phase) * 0.1;
            }
        }

        // Portal
        if (this.goal) {
            this.goal.children[0].material.opacity = 0.2 + Math.sin(this.time * 3) * 0.08;
        }
    }
}
