/**
 * Level1 - Primer nivel del juego
 * Plataformas metálicas, láseres rojos, 3 fragmentos de memoria
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

        // Configuración del nivel
        this.spawnPoint = { x: -350, y: -100 };
        this.cameraCenter = { x: 0, y: 0 };
        this.deathY = -350;

        // Datos de plataformas [x, y, width, height]
        this.platformData = [
            // Suelo principal izquierdo
            [-350, -150, 200, 20],
            [-150, -150, 120, 20],
            // Plataforma elevada
            [0, -80, 100, 16],
            // Suelo medio
            [100, -150, 160, 20],
            // Plataforma alta
            [200, -40, 80, 16],
            // Suelo derecho
            [300, -150, 200, 20],
            // Plataforma final elevada
            [420, -80, 100, 16],
        ];

        // Datos de láseres [x, y, width, height, direction]
        this.laserData = [
            { x: -80, y: -100, width: 4, height: 60, vertical: true },
            { x: 160, y: -100, width: 4, height: 60, vertical: true },
            { x: 350, y: -100, width: 4, height: 60, vertical: true },
        ];

        // Datos de fragmentos [x, y]
        this.fragmentData = [
            { x: 0, y: -50 },
            { x: 200, y: -10 },
            { x: 420, y: -50 },
        ];

        // Meta
        this.goalData = { x: 450, y: -50 };
    }

    build() {
        this.createBackground();
        this.createPlatforms();
        this.createLasers();
        this.createFragments();
        this.createGoal();
    }

    createBackground() {
        // Fondo oscuro de laboratorio
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
                    vec3 col = vec3(0.02, 0.02, 0.04);
                    // Grid metálico
                    float gx = step(0.97, fract(vUv.x * 30.0));
                    float gy = step(0.97, fract(vUv.y * 20.0));
                    col += (gx + gy) * vec3(0.02, 0.025, 0.03);
                    // Scanlines
                    col += sin(vUv.y * 500.0 + uTime) * 0.008;
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -5;
        this.scene.add(bg);
        this.bgMaterial = bgMat;

        // Cables decorativos en el techo
        for (let i = 0; i < 12; i++) {
            const x = -500 + i * 90;
            const cable = this.createCable(x, 280, 100 + Math.random() * 80);
            this.scene.add(cable);
        }
    }

    createCable(x, startY, length) {
        const geo = new THREE.PlaneGeometry(2, length);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x1a1a2a,
            transparent: true,
            opacity: 0.6
        });
        const cable = new THREE.Mesh(geo, mat);
        cable.position.set(x, startY - length / 2, -3);
        return cable;
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
        const surfMat = new THREE.MeshBasicMaterial({ color: 0x2a2a3a });
        const surface = new THREE.Mesh(surfGeo, surfMat);
        group.add(surface);

        // Borde superior (línea metálica)
        const edgeGeo = new THREE.PlaneGeometry(w, 2);
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0x4a4a5a });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.y = h / 2;
        edge.position.z = 0.1;
        group.add(edge);

        // Detalles de remaches
        const rivetCount = Math.floor(w / 30);
        for (let i = 0; i < rivetCount; i++) {
            const rivetGeo = new THREE.PlaneGeometry(3, 3);
            const rivetMat = new THREE.MeshBasicMaterial({ color: 0x3a3a4a });
            const rivet = new THREE.Mesh(rivetGeo, rivetMat);
            rivet.position.set(-w / 2 + 15 + i * 30, 0, 0.1);
            group.add(rivet);
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

        // Emisor superior
        const emitterGeo = new THREE.PlaneGeometry(16, 16);
        const emitterMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
        const emitter = new THREE.Mesh(emitterGeo, emitterMat);
        emitter.position.y = data.height / 2 + 10;
        group.add(emitter);

        // Ojo rojo del emisor
        const eyeGeo = new THREE.PlaneGeometry(6, 6);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, data.height / 2 + 10, 0.1);
        group.add(eye);

        // Rayo láser
        const laserGeo = new THREE.PlaneGeometry(data.width, data.height);
        const laserMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        const laserBeam = new THREE.Mesh(laserGeo, laserMat);
        group.add(laserBeam);

        // Glow del láser
        const glowGeo = new THREE.PlaneGeometry(data.width + 8, data.height);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.z = -0.1;
        group.add(glow);
        this._laserGlows = this._laserGlows || [];
        this._laserGlows.push(glowMat);

        // Receptor inferior
        const receptorGeo = new THREE.PlaneGeometry(12, 12);
        const receptorMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
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

        // Cristal del fragmento
        const crystalGeo = new THREE.PlaneGeometry(14, 14);
        const crystalMat = new THREE.MeshBasicMaterial({
            color: 0x40a0ff,
            transparent: true,
            opacity: 0.9
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.rotation.z = Math.PI / 4; // Diamante
        group.add(crystal);

        // Glow
        const glowGeo = new THREE.PlaneGeometry(24, 24);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x3080ff,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.z = Math.PI / 4;
        glow.position.z = -0.1;
        group.add(glow);

        // Borde brillante
        const borderGeo = new THREE.PlaneGeometry(16, 16);
        const borderMat = new THREE.MeshBasicMaterial({
            color: 0x80c0ff,
            transparent: true,
            opacity: 0.4
        });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.rotation.z = Math.PI / 4;
        border.position.z = 0.05;
        group.add(border);

        group.position.set(x, y, 3);
        return group;
    }

    createGoal() {
        const group = new THREE.Group();

        // Portal/meta
        const portalGeo = new THREE.PlaneGeometry(30, 40);
        const portalMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3
        });
        const portal = new THREE.Mesh(portalGeo, portalMat);
        group.add(portal);

        // Borde del portal
        const borderGeo = new THREE.PlaneGeometry(34, 44);
        const borderMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.5
        });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.z = -0.1;
        group.add(border);

        // Flecha indicadora
        const arrowText = this.createArrowIndicator();
        arrowText.position.y = 30;
        group.add(arrowText);

        group.position.set(this.goalData.x, this.goalData.y, 1);
        this.goal = group;
        this.scene.add(group);
    }

    createArrowIndicator() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('▼', 16, 12);

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        const geo = new THREE.PlaneGeometry(20, 10);
        const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        return new THREE.Mesh(geo, mat);
    }

    // --- Lógica de colisiones ---

    canMoveTo(x, y, playerSize) {
        // Verificar límites del nivel
        if (x < -500 || x > 550) return false;
        if (y > 300) return false;
        return true;
    }

    getGroundAt(x, y) {
        // Encontrar la plataforma más alta debajo del jugador
        let groundY = this.deathY;
        const halfPlayer = 12;

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
        const bounds = player.getBounds();

        for (const frag of this.fragments) {
            if (frag.collected) continue;

            // Solo recoger en estado AZUL
            if (player.state !== 'BLUE') continue;

            const dist = Math.sqrt(
                Math.pow(player.position.x - frag.x, 2) +
                Math.pow(player.position.y - frag.y, 2)
            );

            if (dist < 25) {
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

            const laserLeft = laser.x - laser.width / 2 - 4;
            const laserRight = laser.x + laser.width / 2 + 4;
            const laserTop = laser.y + laser.height / 2;
            const laserBottom = laser.y - laser.height / 2;

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
        // Restaurar fragmentos
        for (const frag of this.fragments) {
            frag.collected = false;
            frag.mesh.visible = true;
        }
    }

    update(delta) {
        this.time += delta;

        // Animación del fondo
        if (this.bgMaterial) {
            this.bgMaterial.uniforms.uTime.value = this.time;
        }

        // Animación de fragmentos (flotar)
        for (const frag of this.fragments) {
            if (!frag.collected) {
                frag.mesh.position.y = frag.y + Math.sin(this.time * 3 + frag.index) * 4;
                frag.mesh.rotation.z = Math.sin(this.time * 2 + frag.index) * 0.1;
            }
        }

        // Animación de láseres (pulso)
        if (this._laserGlows) {
            this._laserGlows.forEach((mat, i) => {
                mat.opacity = 0.1 + Math.sin(this.time * 5 + i) * 0.08;
            });
        }

        // Animación del portal meta
        if (this.goal) {
            this.goal.children[0].material.opacity = 0.2 + Math.sin(this.time * 3) * 0.1;
            this.goal.children[2].position.y = 30 + Math.sin(this.time * 4) * 3;
        }
    }
}
