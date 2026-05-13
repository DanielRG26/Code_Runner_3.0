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

        this.spawnPoint = { x: -580, y: -40 };
        this.cameraCenter = { x: 100, y: -20 };
        this.deathY = -280;

        // Plataformas estaticas [x, y, w, h]
        // Diseño: recorrido largo con secciones temáticas, sin sobreposiciones
        this.platformData = [
            // === SECCIÓN 1: Inicio seguro ===
            [-580, -100, 140, 20],
            [-400, -100, 100, 20],

            // === SECCIÓN 2: Escalera ascendente ===
            [-260, -70, 80, 16],
            [-140, -40, 80, 16],
            [-20, -10, 80, 16],

            // === SECCIÓN 3: Corredor de láseres (plano largo) ===
            [130, -10, 350, 20],

            // === SECCIÓN 4: Descenso rápido ===
            [470, -40, 70, 16],
            [570, -80, 70, 16],
            [670, -120, 70, 16],

            // === SECCIÓN 5: Zona baja con ácido - plataformas pequeñas ===
            [790, -120, 60, 14],
            [890, -120, 60, 14],
            [990, -120, 60, 14],

            // === SECCIÓN 6: Subida con centinela ===
            [1120, -90, 70, 16],
            [1240, -60, 70, 16],
            [1360, -30, 200, 20],

            // === SECCIÓN 7: Plataformas altas finales ===
            [1600, -30, 70, 16],
            [1720, 10, 70, 16],
            [1840, 50, 80, 16],

            // === SECCIÓN 8: Meta ===
            [1980, 50, 160, 20],
        ];

        // Plataformas moviles (5 - más movimiento)
        this.movingPlatformData = [
            // Puente entre sección 1 y 2
            { x: -330, y: -70, w: 60, h: 14, moveX: 40, moveY: 0, speed: 0.9 },
            // Ayuda en sección 4-5
            { x: 730, y: -90, w: 60, h: 14, moveX: 0, moveY: 30, speed: 0.7 },
            // Entre plataformas pequeñas sección 5
            { x: 940, y: -80, w: 55, h: 14, moveX: 40, moveY: 0, speed: 1.1 },
            // Subida sección 6-7
            { x: 1480, y: -10, w: 60, h: 14, moveX: 0, moveY: 35, speed: 0.8 },
            // Antes de la meta
            { x: 1900, y: 30, w: 60, h: 14, moveX: 50, moveY: 0, speed: 1.2 },
        ];

        // Plataformas que desaparecen (4 - más tensión)
        this.disappearingPlatformData = [
            { x: -70, y: -10, w: 55, h: 12, onTime: 2.5, offTime: 1.3 },
            { x: 840, y: -85, w: 50, h: 12, onTime: 2.2, offTime: 1.5 },
            { x: 1180, y: -60, w: 55, h: 12, onTime: 2.0, offTime: 1.4 },
            { x: 1660, y: -10, w: 55, h: 12, onTime: 2.3, offTime: 1.2 },
        ];

        // Laseres con timing (6 - corredor de láseres más intenso)
        // Separados 80px entre sí, offTime de 2.2s = ventana amplia para pasar corriendo
        this.laserData = [
            // Corredor de láseres sección 3 (secuencia rítmica, uno a la vez)
            { x: 180, y: 35, width: 4, height: 50, onTime: 1.2, offTime: 2.5, phase: 0 },
            { x: 260, y: 35, width: 4, height: 50, onTime: 1.2, offTime: 2.5, phase: 1.5 },
            { x: 340, y: 35, width: 4, height: 50, onTime: 1.2, offTime: 2.5, phase: 3.0 },
            { x: 420, y: 35, width: 4, height: 50, onTime: 1.2, offTime: 2.5, phase: 4.5 },
            // Sección 6 - láser en la subida
            { x: 1300, y: -75, width: 4, height: 40, onTime: 1.3, offTime: 2.2, phase: 0.5 },
            // Sección 7 - láser antes de la meta
            { x: 1780, y: 5, width: 4, height: 40, onTime: 1.4, offTime: 2.0, phase: 1.0 },
        ];

        // Centinelas enemigos (3 - en zonas SIN láseres)
        this.sentinelData = [
            // Patrulla en sección 5 (plataformas pequeñas)
            { x: 890, y: -92, patrolLeft: 790, patrolRight: 990, speed: 35 },
            // Patrulla en sección 6 (plataforma larga)
            { x: 1400, y: -2, patrolLeft: 1370, patrolRight: 1540, speed: 42 },
            // Patrulla final en meta
            { x: 2020, y: 78, patrolLeft: 1990, patrolRight: 2120, speed: 48 },
        ];

        // Acido en el suelo (más charcos, cubren los huecos)
        this.acidData = [
            { x: -330, y: -230, w: 60, h: 18 },
            { x: -200, y: -230, w: 60, h: 18 },
            { x: 450, y: -230, w: 70, h: 18 },
            { x: 630, y: -230, w: 70, h: 18 },
            { x: 790, y: -230, w: 200, h: 18 },
            { x: 1050, y: -230, w: 80, h: 18 },
            { x: 1500, y: -230, w: 80, h: 18 },
            { x: 1750, y: -230, w: 80, h: 18 },
        ];

        // Fragmentos en posiciones que requieren desvío o riesgo
        this.fragmentData = [
            { x: -140, y: -5 },    // Sobre escalera, fácil si subes
            { x: 940, y: -50 },    // Sobre plataforma móvil en zona de ácido
            { x: 1840, y: 85 },    // Arriba en la sección final
        ];

        this.goalData = { x: 2040, y: 90 };
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
        const bgGeo = new THREE.PlaneGeometry(2200, 800);
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
        if (x < -700 || x > 2200) return false;
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
