/**
 * MainMenuState - Menú principal atractivo para niños
 * Animaciones suaves, partículas flotantes, robot animado, colores vibrantes
 */
import * as THREE from 'three';
import { STATES } from './GameStateManager.js';
import { PixelText } from '../utils/PixelText.js';
import { createNeonButton, redrawButton } from '../utils/UIFactory.js';
import { createRobotSprite } from '../entities/RobotSprite.js';

export class MainMenuState {
    constructor(stateManager, renderer, audio) {
        this.stateManager = stateManager;
        this.renderer = renderer;
        this.audio = audio;
        this.time = 0;
        this.cursorVisible = true;
        this.cursorTimer = 0;
        this.buttons = [];
        this.hoveredBtn = null;
        this.particles = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    enter() {
        const scene = this.renderer.scene;
        scene.background = new THREE.Color(0x050510);

        // Resetear cámara al centro
        this.renderer.camera.position.x = 0;
        this.renderer.camera.position.y = 0;

        this.audio.startMusic();
        this.createBackground(scene);
        this.createParticles(scene);
        this.createTitle(scene);
        this.createButtons(scene);
        this.createRobot(scene);
        this.createDecorations(scene);

        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('click', this.onClick);
    }

    createBackground(scene) {
        const bgGeo = new THREE.PlaneGeometry(1400, 700);
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
                    vec3 col = mix(vec3(0.02, 0.02, 0.07), vec3(0.05, 0.02, 0.1), vUv.x);
                    col = mix(col, vec3(0.01, 0.04, 0.08), vUv.y);
                    // Glow púrpura suave
                    float glow = smoothstep(0.4, 0.9, vUv.x) * smoothstep(0.2, 0.7, vUv.y);
                    col += vec3(0.06, 0.0, 0.1) * glow * (0.6 + sin(uTime * 0.4) * 0.2);
                    // Glow cian abajo
                    float cyanGlow = smoothstep(0.6, 0.0, vUv.y) * 0.03;
                    col += vec3(0.0, cyanGlow, cyanGlow * 1.2);
                    // Scanlines suaves
                    col += sin(vUv.y * 300.0 + uTime) * 0.008;
                    // Viñeta
                    float vig = 1.0 - length((vUv - 0.5) * 1.2) * 0.35;
                    col *= vig;
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -10;
        scene.add(bg);
        this.bgMaterial = bgMat;

        // Grid de suelo animado
        const gridGeo = new THREE.PlaneGeometry(1400, 180);
        const gridMat = new THREE.ShaderMaterial({
            transparent: true,
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
                    float gx = step(0.96, fract(vUv.x * 18.0 + uTime * 0.02));
                    float gy = step(0.9, fract(vUv.y * 5.0 + uTime * 0.08));
                    float grid = max(gx, gy);
                    float fade = (1.0 - vUv.y) * 0.5;
                    gl_FragColor = vec4(0.0, 0.9, 1.0, grid * fade * 0.12);
                }
            `
        });
        const grid = new THREE.Mesh(gridGeo, gridMat);
        grid.position.set(0, -210, -8);
        scene.add(grid);
        this.gridMaterial = gridMat;
    }

    createParticles(scene) {
        // Partículas flotantes brillantes (como luciérnagas digitales)
        for (let i = 0; i < 25; i++) {
            const size = 2 + Math.random() * 4;
            const geo = new THREE.PlaneGeometry(size, size);
            const color = Math.random() > 0.5 ? 0x00e5ff : 0xaa44ff;
            const mat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.2 + Math.random() * 0.4
            });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.set(
                -600 + Math.random() * 1200,
                -250 + Math.random() * 500,
                -4 + Math.random() * 2
            );
            particle.userData = {
                baseX: particle.position.x,
                baseY: particle.position.y,
                speedX: 0.3 + Math.random() * 0.8,
                speedY: 0.5 + Math.random() * 1.0,
                phase: Math.random() * Math.PI * 2
            };
            scene.add(particle);
            this.particles.push(particle);
        }
    }

    createTitle(scene) {
        // CODE RUNNER grande y brillante
        this.titleText = PixelText.create('CODE RUNNER', 50, 210, 60, 0x00e5ff);
        scene.add(this.titleText);

        // Subtítulo
        this.subtitleText = PixelText.create('FRAGMENTOS DE CONSCIENCIA_', 50, 145, 18, 0x99ddee);
        scene.add(this.subtitleText);
    }

    createButtons(scene) {
        // Botón INICIAR - más grande y llamativo
        const btnStart = createNeonButton('▶  INICIAR_SECUENCIA', 50, 40, 340, 58);
        btnStart.userData = { action: 'start' };
        scene.add(btnStart);
        this.buttons.push(btnStart);

        const subStart = PixelText.create('¡Comienza la aventura!', 50, 5, 10, 0x88ccdd);
        scene.add(subStart);

        // Botón SECTORES
        const btnLevels = createNeonButton('⚙  SECTORES_DE_MEMORIA', 50, -55, 340, 58);
        btnLevels.userData = { action: 'levels' };
        scene.add(btnLevels);
        this.buttons.push(btnLevels);

        const subLevels = PixelText.create('Elige tu nivel', 50, -90, 10, 0x88ccdd);
        scene.add(subLevels);

        // Botones inferiores
        const btnCredits = createNeonButton('</> CRÉDITOS', -80, -200, 180, 40);
        btnCredits.userData = { action: 'credits' };
        scene.add(btnCredits);
        this.buttons.push(btnCredits);

        const btnExit = createNeonButton('⏻ SALIR', 130, -200, 150, 40);
        btnExit.userData = { action: 'exit' };
        scene.add(btnExit);
        this.buttons.push(btnExit);
    }

    createRobot(scene) {
        // Robot más grande y centrado a la izquierda
        this.robot = createRobotSprite(-320, -80, 120, 'BLUE');
        scene.add(this.robot);

        // Etiqueta
        const label = PixelText.create('C-R01', -320, -155, 12, 0x88ccdd);
        scene.add(label);

        // Burbuja de diálogo animada
        const bubbleGeo = new THREE.PlaneGeometry(140, 50);
        const bubbleMat = new THREE.MeshBasicMaterial({
            color: 0x081828, transparent: true, opacity: 0.9
        });
        this.bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        this.bubble.position.set(-220, -20, 1);
        scene.add(this.bubble);

        const bubbleBorderGeo = new THREE.PlaneGeometry(143, 53);
        const bubbleBorderMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff, transparent: true, opacity: 0.4
        });
        const bubbleBorder = new THREE.Mesh(bubbleBorderGeo, bubbleBorderMat);
        bubbleBorder.position.set(-220, -20, 0.9);
        scene.add(bubbleBorder);

        const bubbleText1 = PixelText.create('¿Quién soy?', -220, -12, 10, 0x00e5ff);
        scene.add(bubbleText1);
        const bubbleText2 = PixelText.create('¡Ayúdame a recordar!', -220, -30, 9, 0x88ccdd);
        scene.add(bubbleText2);
    }

    createDecorations(scene) {
        // Panel info arriba izquierda (simplificado)
        const panelGeo = new THREE.PlaneGeometry(200, 55);
        const panelMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff, transparent: true, opacity: 0.06
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(-400, 255, -1);
        scene.add(panel);

        const panelBorder = new THREE.Mesh(
            new THREE.PlaneGeometry(202, 57),
            new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.25 })
        );
        panelBorder.position.set(-400, 255, -1.1);
        scene.add(panelBorder);

        const unitText = PixelText.create('UNIDAD: C-R01', -400, 265, 10, 0x00e5ff);
        scene.add(unitText);
        const stateText = PixelText.create('ESTADO: DESCONOCIDO', -400, 245, 9, 0x00e5ff);
        scene.add(stateText);

        // Advertencia arriba derecha
        const warnBorder = new THREE.Mesh(
            new THREE.PlaneGeometry(170, 50),
            new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.12 })
        );
        warnBorder.position.set(430, 258, -1);
        scene.add(warnBorder);

        const warnIcon = PixelText.create('⚠', 385, 262, 14, 0xffaa00);
        scene.add(warnIcon);
        const warnText = PixelText.create('DATOS CORRUPTOS', 445, 265, 8, 0xffaa00);
        scene.add(warnText);
        const warnText2 = PixelText.create('DETECTADOS', 445, 250, 8, 0x00e5ff);
        scene.add(warnText2);

        // Texto narrativo izquierdo (más corto y simple)
        const narrativeLines = [
            '> Despiertas sin recuerdos.',
            '> Solo quedan fragmentos.',
            '> ¡Encuentra la secuencia!',
            '> Reconstruye quien eres.',
        ];
        narrativeLines.forEach((line, i) => {
            const txt = PixelText.create(line, -400, 170 - i * 28, 9, 0x00e5ff);
            txt.material.opacity = 0.55;
            scene.add(txt);
        });
    }

    onMouseMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    onClick() {
        this.raycaster.setFromCamera(this.mouse, this.renderer.camera);
        for (const btn of this.buttons) {
            const intersects = this.raycaster.intersectObject(btn, true);
            if (intersects.length > 0) {
                this.audio.playClick();
                const action = btn.userData.action;
                if (action === 'start' || action === 'levels') {
                    this.stateManager.changeState(STATES.LEVEL_SELECT);
                } else if (action === 'credits') {
                    this.showCredits();
                } else if (action === 'exit') {
                    this.showExit();
                }
                break;
            }
        }
    }

    showCredits() {
        if (this.creditsOverlay) return;
        this.creditsOverlay = document.createElement('div');
        this.creditsOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(2, 2, 8, 0.95); z-index: 1000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: monospace; color: #00e5ff; animation: fadeIn 0.3s ease;
        `;
        this.creditsOverlay.innerHTML = `
            <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>
            <h2 style="font-size: 28px; letter-spacing: 4px; margin-bottom: 30px; text-shadow: 0 0 12px #00e5ff66;">// CRÉDITOS</h2>
            <p style="font-size: 16px; margin: 6px 0; color: #00e5ffcc;">CODE RUNNER: FRAGMENTOS DE CONSCIENCIA</p>
            <p style="font-size: 14px; margin: 6px 0; color: #00e5ff55;">─────────────────────</p>
            <p style="font-size: 16px; margin: 10px 0; color: #88ddee;">🎮 Desarrollo: Daniel Guevara</p>
            <p style="font-size: 16px; margin: 10px 0; color: #88ddee;">🎨 Diseño UI: Juliana</p>
            <p style="font-size: 16px; margin: 10px 0; color: #88ddee;">✨ Diseño: Helen</p>
            <p style="font-size: 14px; margin: 6px 0; color: #00e5ff55;">─────────────────────</p>
            <p style="font-size: 14px; margin: 12px 0; color: #00e5ff88;">Universidad Cooperativa de Colombia</p>
            <p style="font-size: 12px; margin: 4px 0; color: #00e5ff44;">© 2026</p>
            <button style="
                margin-top: 30px; background: rgba(0,229,255,0.08); border: 2px solid #00e5ff;
                color: #00e5ff; padding: 12px 32px; font-family: monospace;
                font-size: 14px; cursor: pointer; letter-spacing: 1px; border-radius: 4px;
                box-shadow: 0 0 12px #00e5ff33;
            ">← VOLVER</button>
        `;
        document.body.appendChild(this.creditsOverlay);
        this.creditsOverlay.querySelector('button').addEventListener('click', () => {
            this.audio.playClick();
            document.body.removeChild(this.creditsOverlay);
            this.creditsOverlay = null;
        });
    }

    showExit() {
        if (this.exitOverlay) return;
        this.exitOverlay = document.createElement('div');
        this.exitOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(2, 2, 8, 0.95); z-index: 1000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: monospace; color: #00e5ff; animation: fadeIn 0.3s ease;
        `;
        this.exitOverlay.innerHTML = `
            <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>
            <h2 style="font-size: 22px; letter-spacing: 3px; margin-bottom: 20px;">// ¿TE VAS?</h2>
            <p style="font-size: 16px; margin: 8px 0; color: #00e5ffaa;">¿Seguro que quieres salir?</p>
            <p style="font-size: 13px; margin: 4px 0; color: #00e5ff66;">C-R01 te estará esperando...</p>
            <div style="margin-top: 24px; display: flex; gap: 16px;">
                <button id="exit-confirm" style="
                    background: rgba(255,50,50,0.1); border: 2px solid #ff4040;
                    color: #ff4040; padding: 12px 28px; font-family: monospace;
                    font-size: 14px; cursor: pointer; border-radius: 4px;
                ">SÍ, SALIR</button>
                <button id="exit-cancel" style="
                    background: rgba(0,229,255,0.08); border: 2px solid #00e5ff;
                    color: #00e5ff; padding: 12px 28px; font-family: monospace;
                    font-size: 14px; cursor: pointer; border-radius: 4px;
                    box-shadow: 0 0 8px #00e5ff33;
                ">QUEDARME</button>
            </div>
        `;
        document.body.appendChild(this.exitOverlay);
        this.exitOverlay.querySelector('#exit-confirm').addEventListener('click', () => {
            document.body.removeChild(this.exitOverlay);
            this.exitOverlay = null;
            // Recargar la página en vez de destruir el DOM
            window.location.reload();
        });
        this.exitOverlay.querySelector('#exit-cancel').addEventListener('click', () => {
            this.audio.playClick();
            document.body.removeChild(this.exitOverlay);
            this.exitOverlay = null;
        });
    }

    update(delta) {
        this.time += delta;

        // Cursor parpadeante
        this.cursorTimer += delta;
        if (this.cursorTimer > 0.5) {
            this.cursorTimer = 0;
            this.cursorVisible = !this.cursorVisible;
            if (this.subtitleText) {
                this.subtitleText.material.opacity = this.cursorVisible ? 1.0 : 0.6;
            }
        }

        // Fondo animado
        if (this.bgMaterial) this.bgMaterial.uniforms.uTime.value = this.time;
        if (this.gridMaterial) this.gridMaterial.uniforms.uTime.value = this.time;

        // Partículas flotantes
        for (const p of this.particles) {
            const d = p.userData;
            p.position.x = d.baseX + Math.sin(this.time * d.speedX + d.phase) * 20;
            p.position.y = d.baseY + Math.sin(this.time * d.speedY + d.phase) * 15;
            p.material.opacity = 0.2 + Math.sin(this.time * 2 + d.phase) * 0.2;
        }

        // Hover botones
        this.raycaster.setFromCamera(this.mouse, this.renderer.camera);
        let newHovered = null;
        for (const btn of this.buttons) {
            const intersects = this.raycaster.intersectObject(btn, true);
            if (intersects.length > 0) {
                newHovered = btn;
                break;
            }
        }
        if (newHovered && newHovered !== this.hoveredBtn) {
            this.audio.playHover();
        }
        this.hoveredBtn = newHovered;

        for (const btn of this.buttons) {
            const border = btn.children.find(c => c.userData.isBorder);
            if (border) {
                const isHovered = btn === this.hoveredBtn;
                redrawButton(border, isHovered ? 1.0 : 0.5);
                btn.scale.setScalar(isHovered ? 1.03 : 1.0);
            }
        }

        // Robot flotante con rebote
        if (this.robot) {
            this.robot.position.y = -80 + Math.sin(this.time * 2) * 6;
            this.robot.rotation.z = Math.sin(this.time * 1.5) * 0.03;
        }

        // Burbuja flotante
        if (this.bubble) {
            this.bubble.position.y = -20 + Math.sin(this.time * 1.8 + 1) * 3;
        }

        // Título con glow pulsante
        if (this.titleText) {
            this.titleText.material.opacity = 0.85 + Math.sin(this.time * 2) * 0.15;
        }
    }

    exit() {
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onClick);
        this.buttons = [];
        this.particles = [];
        this.audio.stopMusic();
    }
}
