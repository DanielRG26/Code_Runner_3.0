/**
 * Level1 - Primer nivel: Laboratorio digital colapsado
 * Plataformas metálicas, láseres rojos, 3 fragmentos de memoria, meta
 */
import * as THREE from 'three';

export class Level1 {
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.lasers = [];
        this.fragments = [];
        this.goal = null;
        this.time = 0;
        this._laserGlows = [];

        // Configuración
        this.spawnPoint = { x: -380, y: -100 };
        this.cameraCenter = { x: 50, y: -20 };
        this.deathY = -220;

        // Plataformas [x, y, width, height]
        this.platformData = [
            [-380, -150, 180, 20],   // Inicio
            [-180, -150, 100, 20],   // Puente 1
            [-50, -100, 90, 16],     // Elevada 1
            [60, -150, 140, 20],     // Suelo medio
            [180, -60, 80, 16],      // Elevada 2
            [280, -150, 160, 20],    // Suelo derecho
            [420, -100, 100, 16],    // Plataforma final
        ];

        // Láseres [x, y, width, height]
        this.laserData = [
            { x: -120, y: -105, width: 4, height: 55 },
            { x: 130, y: -105, width: 4, height: 55 },
            { x: 340, y: -105, width: 4, height: 55 },
        ];

        // Fragmentos [x, y]
        this.fragmentData = [
            { x: -50, y: -70 },
            { x: 180, y: -30 },
            { x: 420, y: -70 },
        ];

        // Meta
        this.goalData = { x: 450, y: -70 };
    }

    build() {
        this.createBackground();
        this.createPlatforms();
        this.createLasers();
        this.createFragments();
        this.createGoal();
    }

    createBackground() {
        // Fondo de laboratorio oscuro con interferencia
        const bgGeo = new THREE.PlaneGeometry(1200, 700);
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
                void main() {
                    vec3 col = vec3(0.015, 0.015, 0.03);
                    // Grid metálico del laboratorio
                    float gx = step(0.975, fract(vUv.x * 25.0));
                    float gy = step(0.975, fract(vUv.y * 16.0));
                    col += (gx + gy) * vec3(0.015, 0.02, 0.025);
                    // Scanlines
                    col += sin(vUv.y * 600.0 + uTime * 2.0) * 0.006;
                    // Interferencia estática
                    float noise = fract(sin(dot(vUv * 100.0 + uTime * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
                    col += noise * 0.005;
                    // Viñeta oscura
                    float vig = 1.0 - length((vUv - 0.5) * 1.4);
                    col *= vig;
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -5;
        this.scene.add(bg);
        this.bgMaterial = bgMat;

        // Cables colgantes del techo
        for (let i = 0; i < 14; i++) {
            const x = -550 + i * 85;
            const length = 80 + Math.random() * 120;
            const cable = this.createCable(x, 280, length);
            this.scene.add(cable);
        }

        // Cadenas decorativas
        for (let i = 0; i < 5; i++) {
            const x = -300 + i * 180;
            const chain = this.createChain(x, 250, 60 + Math.random() * 40);
            this.scene.add(chain);
        }
    }

    createCable(x, startY, length) {
        const geo = new THREE.PlaneGeometry(1.5, length);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x141420, transparent: true, opacity: 0.5
        });
        const cable = new THREE.Mesh(geo, mat);
        cable.position.set(x, startY - length / 2, -3);
        return cable;
    }

    createChain(x, startY, length) {
        const group = new THREE.Group();
        const links = Math.floor(length / 8);
        for (let i = 0; i < links; i++) {
            const linkGeo = new THREE.PlaneGeometry(4, 6);
            const linkMat = new THREE.MeshBasicMaterial({
                color: 0x2a2a3a, transparent: true, opacity: 0.6
            });
            const link = new THREE.Mesh(linkGeo, linkMat);
            link.position.set(0, -i * 8, 0);
            group.add(link);
        }
        group.position.set(x, startY, -2);
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

        // Indicador "necesita estado azul"
        const indicatorCanvas = document.createElement('canvas');
        indicatorCanvas.width = 32;
        indicatorCanvas.height = 16;
        const ictx = indicatorCanvas.getContext('2d');
        ictx.fillStyle = '#4488ff';
        ictx.font = '10px monospace';
        ictx.textAlign = 'center';
        ictx.fillText('●', 16, 12);
        const indicatorTex = new THREE.CanvasTexture(indicatorCanvas);
        indicatorTex.magFilter = THREE.NearestFilter;
        const indicatorGeo = new THREE.PlaneGeometry(12, 6);
        const indicatorMat = new THREE.MeshBasicMaterial({
            map: indicatorTex, transparent: true, opacity: 0.6
        });
        const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
        indicator.position.set(0, -14, 0);
        group.add(indicator);

        group.position.set(x, y, 3);
        return group;
    }

    createGoal() {
        const group = new THREE.Group();

        // Portal/meta
        const portalGeo = new THREE.PlaneGeometry(28, 44);
        const portalMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88, transparent: true, opacity: 0.25
        });
        group.add(new THREE.Mesh(portalGeo, portalMat));

        // Borde del portal
        const borderGeo = new THREE.PlaneGeometry(32, 48);
        const borderMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88, transparent: true, opacity: 0.4
        });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.z = -0.1;
        group.add(border);

        // Texto "EXIT"
        const exitCanvas = document.createElement('canvas');
        exitCanvas.width = 64;
        exitCanvas.height = 16;
        const ectx = exitCanvas.getContext('2d');
        ectx.fillStyle = '#00ff88';
        ectx.font = 'bold 12px monospace';
        ectx.textAlign = 'center';
        ectx.fillText('EXIT', 32, 12);
        const exitTex = new THREE.CanvasTexture(exitCanvas);
        exitTex.magFilter = THREE.NearestFilter;
        const exitGeo = new THREE.PlaneGeometry(32, 8);
        const exitMat = new THREE.MeshBasicMaterial({ map: exitTex, transparent: true });
        const exitMesh = new THREE.Mesh(exitGeo, exitMat);
        exitMesh.position.set(0, 30, 0.1);
        group.add(exitMesh);

        // Flecha animada
        const arrowCanvas = document.createElement('canvas');
        arrowCanvas.width = 16;
        arrowCanvas.height = 16;
        const actx = arrowCanvas.getContext('2d');
        actx.fillStyle = '#00ff88';
        actx.font = '14px monospace';
        actx.fillText('▼', 2, 13);
        const arrowTex = new THREE.CanvasTexture(arrowCanvas);
        arrowTex.magFilter = THREE.NearestFilter;
        const arrowGeo = new THREE.PlaneGeometry(10, 10);
        const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.position.set(0, 38, 0.1);
        group.add(arrow);

        group.position.set(this.goalData.x, this.goalData.y, 1);
        this.goal = group;
        this.scene.add(group);
    }

    // --- Lógica de colisiones ---

    canMoveTo(x, y, playerSize) {
        if (x < -500 || x > 550) return false;
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

    checkLaserCollision(player) {
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

        // Portal animado
        if (this.goal) {
            this.goal.children[0].material.opacity = 0.2 + Math.sin(this.time * 3) * 0.08;
            // Flecha flotante
            if (this.goal.children[3]) {
                this.goal.children[3].position.y = 38 + Math.sin(this.time * 4) * 3;
            }
        }
    }
}
