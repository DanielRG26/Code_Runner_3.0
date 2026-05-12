/**
 * MainMenuState - Menú principal rediseñado basado en referencia de Juliana
 * Layout: Info panel izquierda, título centro-derecha, botones centro,
 * robot C-R01 abajo-izquierda, advertencia arriba-derecha, créditos abajo
 */
import * as THREE from 'three';
import { STATES } from './GameStateManager.js';
import { PixelText } from '../utils/PixelText.js';
import { createNeonButton } from '../utils/UIFactory.js';
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
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    enter() {
        const scene = this.renderer.scene;
        scene.background = new THREE.Color(0x050510);

        this.audio.startMusic();
        this.createBackground(scene);
        this.createTitle(scene);
        this.createLeftPanel(scene);
        this.createRightWarning(scene);
        this.createButtons(scene);
        this.createRobot(scene);
        this.createBottomLinks(scene);

        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('click', this.onClick);
    }

    createBackground(scene) {
        // Fondo con shader cyberpunk
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
                    // Degradado oscuro con tinte púrpura a la derecha
                    vec3 col = mix(vec3(0.02, 0.02, 0.06), vec3(0.04, 0.02, 0.08), vUv.x);
                    col = mix(col, vec3(0.02, 0.03, 0.06), vUv.y);
                    // Scanlines
                    float scan = sin(vUv.y * 500.0 + uTime * 1.5) * 0.01;
                    col += scan;
                    // Glow púrpura sutil a la derecha
                    float purpleGlow = smoothstep(0.5, 1.0, vUv.x) * smoothstep(0.2, 0.6, vUv.y);
                    col += vec3(0.08, 0.0, 0.12) * purpleGlow * (0.5 + sin(uTime * 0.5) * 0.2);
                    // Noise
                    float noise = fract(sin(dot(vUv * 50.0 + uTime * 0.02, vec2(12.9898, 78.233))) * 43758.5453);
                    col += noise * 0.006;
                    // Viñeta
                    float vig = 1.0 - length((vUv - 0.5) * 1.3) * 0.4;
                    col *= vig;
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -10;
        scene.add(bg);
        this.bgMaterial = bgMat;

        // Grid de suelo (perspectiva falsa)
        const gridGeo = new THREE.PlaneGeometry(1400, 200);
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
                    float gx = step(0.96, fract(vUv.x * 20.0));
                    float gy = step(0.92, fract(vUv.y * 6.0 + uTime * 0.1));
                    float grid = max(gx, gy);
                    float fade = (1.0 - vUv.y) * 0.4;
                    gl_FragColor = vec4(0.0, 0.9, 1.0, grid * fade * 0.15);
                }
            `
        });
        const grid = new THREE.Mesh(gridGeo, gridMat);
        grid.position.set(0, -220, -8);
        scene.add(grid);
        this.gridMaterial = gridMat;

        // Siluetas de Ecos
        [-480, -380, 420, 520].forEach(x => {
            const echo = this.createEcho(x, -120 + Math.random() * 30);
            scene.add(echo);
        });
    }

    createEcho(x, y) {
        const group = new THREE.Group();
        const bodyGeo = new THREE.PlaneGeometry(24, 48);
        const bodyMat = new THREE.MeshBasicMaterial({
            color: 0x0a0a15, transparent: true, opacity: 0.7
        });
        group.add(new THREE.Mesh(bodyGeo, bodyMat));
        const eyeGeo = new THREE.PlaneGeometry(3, 3);
        const eyeMat = new THREE.MeshBasicMaterial({
            color: 0x223344, transparent: true, opacity: 0.3
        });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-4, 12, 0.1);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(4, 12, 0.1);
        group.add(eyeL, eyeR);
        group.position.set(x, y, -6);
        return group;
    }

    createTitle(scene) {
        // CODE RUNNER - grande, estilo glitch/distorsionado
        this.titleText = PixelText.create('CODE RUNNER', 80, 200, 56, 0x00e5ff);
        scene.add(this.titleText);

        // Subtítulo
        this.subtitleText = PixelText.create('FRAGMENTOS DE CONSCIENCIA_', 80, 140, 16, 0x88ccdd);
        scene.add(this.subtitleText);
    }

    createLeftPanel(scene) {
        // Panel de info superior izquierdo
        // Borde del panel
        const panelGeo = new THREE.PlaneGeometry(240, 100);
        const panelMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff, transparent: true, opacity: 0.08
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(-380, 220, -1);
        scene.add(panel);

        // Borde del panel
        const borderGeo = new THREE.PlaneGeometry(242, 102);
        const borderMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff, transparent: true, opacity: 0.2
        });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.set(-380, 220, -1.1);
        scene.add(border);

        // Texto del panel
        const unitText = PixelText.create('UNIDAD: C-R01', -410, 250, 11, 0x00e5ff);
        scene.add(unitText);
        const stateText = PixelText.create('ESTADO: DESCONOCIDO', -395, 232, 10, 0x00e5ff);
        scene.add(stateText);

        // Línea de heartbeat simulada
        const hbGeo = new THREE.PlaneGeometry(100, 2);
        const hbMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.5 });
        const hb = new THREE.Mesh(hbGeo, hbMat);
        hb.position.set(-380, 205, 0);
        scene.add(hb);

        // Texto narrativo izquierdo
        const lines = [
            '> DESPIERTAS SIN RECUERDOS.',
            '> SOLO QUEDAN FRAGMENTOS.',
            '> ENCUENTRA LA SECUENCIA.',
            '> RECONSTRUYE QUIEN ERES.',
            '',
            '> ESTÁS SOLO...',
            '> TODO ESTÁ DESTRUIDO...',
            '> PERO AÚN PUEDES SEGUIR.',
            '',
            '> ERROR: CONSCIENCIA INESTABLE.'
        ];
        lines.forEach((line, i) => {
            if (line) {
                const color = line.includes('ERROR') ? 0xff4040 : 0x00e5ff;
                const opacity = line.startsWith('> E') ? 0.7 : 0.5;
                const txt = PixelText.create(line, -380, 160 - i * 22, 9, color);
                txt.material.opacity = opacity;
                scene.add(txt);
            }
        });
    }

    createRightWarning(scene) {
        // Panel de advertencia arriba derecha
        const warnGeo = new THREE.PlaneGeometry(180, 60);
        const warnMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff, transparent: true, opacity: 0.06
        });
        const warn = new THREE.Mesh(warnGeo, warnMat);
        warn.position.set(420, 240, -1);
        scene.add(warn);

        const warnBorderGeo = new THREE.PlaneGeometry(182, 62);
        const warnBorderMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff, transparent: true, opacity: 0.2
        });
        const warnBorder = new THREE.Mesh(warnBorderGeo, warnBorderMat);
        warnBorder.position.set(420, 240, -1.1);
        scene.add(warnBorder);

        const warnIcon = PixelText.create('⚠', 380, 250, 16, 0xffaa00);
        scene.add(warnIcon);
        const warnTitle = PixelText.create('ADVERTENCIA:', 430, 255, 10, 0xffaa00);
        scene.add(warnTitle);
        const warnText = PixelText.create('DATOS CORRUPTOS', 430, 238, 9, 0x00e5ff);
        scene.add(warnText);
        const warnText2 = PixelText.create('DETECTADOS', 430, 222, 9, 0x00e5ff);
        scene.add(warnText2);
    }

    createButtons(scene) {
        // Botón INICIAR_SECUENCIA
        const btnStart = createNeonButton('▶  INICIAR_SECUENCIA', 100, 40, 300, 52);
        btnStart.userData = { action: 'start' };
        scene.add(btnStart);
        this.buttons.push(btnStart);

        // Subtexto del botón
        const subStart = PixelText.create('EJECUTAR PROTOCOLO', 100, 10, 9, 0x88aacc);
        scene.add(subStart);

        // Botón SECTORES_DE_MEMORIA
        const btnLevels = createNeonButton('⚙  SECTORES_DE_MEMORIA', 100, -50, 300, 52);
        btnLevels.userData = { action: 'levels' };
        scene.add(btnLevels);
        this.buttons.push(btnLevels);

        const subLevels = PixelText.create('EXPLORAR RECUERDOS', 100, -80, 9, 0x88aacc);
        scene.add(subLevels);
    }

    createRobot(scene) {
        // Robot C-R01 abajo izquierda
        this.robot = createRobotSprite(-300, -140, 90, 'BLUE');
        scene.add(this.robot);

        // Etiqueta
        const label = PixelText.create('C-R01', -300, -195, 11, 0x88aacc);
        scene.add(label);

        // Burbuja de diálogo
        const bubbleGeo = new THREE.PlaneGeometry(120, 40);
        const bubbleMat = new THREE.MeshBasicMaterial({
            color: 0x0a1520, transparent: true, opacity: 0.85
        });
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        bubble.position.set(-220, -90, 1);
        scene.add(bubble);

        const bubbleBorderGeo = new THREE.PlaneGeometry(122, 42);
        const bubbleBorderMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff, transparent: true, opacity: 0.3
        });
        const bubbleBorder = new THREE.Mesh(bubbleBorderGeo, bubbleBorderMat);
        bubbleBorder.position.set(-220, -90, 0.9);
        scene.add(bubbleBorder);

        const bubbleText1 = PixelText.create('¿Quién soy?', -220, -83, 8, 0x00e5ff);
        scene.add(bubbleText1);
        const bubbleText2 = PixelText.create('¿Por qué duele tanto', -220, -98, 7, 0x00e5ff);
        scene.add(bubbleText2);
        const bubbleText3 = PixelText.create('existir?', -220, -111, 7, 0x00e5ff);
        scene.add(bubbleText3);
    }

    createBottomLinks(scene) {
        // Créditos
        const creditsBtn = createNeonButton('</> CRÉDITOS', -60, -255, 160, 36);
        creditsBtn.userData = { action: 'credits' };
        scene.add(creditsBtn);
        this.buttons.push(creditsBtn);

        // Salir
        const exitBtn = createNeonButton('⏻ SALIR', 120, -255, 140, 36);
        exitBtn.userData = { action: 'exit' };
        scene.add(exitBtn);
        this.buttons.push(exitBtn);
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
        // Crear overlay de créditos
        if (this.creditsOverlay) return;
        this.creditsOverlay = document.createElement('div');
        this.creditsOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(2, 2, 8, 0.95); z-index: 1000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: monospace; color: #00e5ff;
        `;
        this.creditsOverlay.innerHTML = `
            <h2 style="font-size: 24px; letter-spacing: 4px; margin-bottom: 30px; text-shadow: 0 0 10px #00e5ff66;">// CRÉDITOS</h2>
            <p style="font-size: 14px; margin: 6px 0; color: #00e5ffcc;">CODE RUNNER: FRAGMENTOS DE CONSCIENCIA</p>
            <p style="font-size: 12px; margin: 6px 0; color: #00e5ff88;">─────────────────────</p>
            <p style="font-size: 13px; margin: 8px 0; color: #88ccdd;">Desarrollo: Daniel Guevara</p>
            <p style="font-size: 13px; margin: 8px 0; color: #88ccdd;">Diseño UI: Juliana</p>
            <p style="font-size: 13px; margin: 8px 0; color: #88ccdd;">Diseño: Helen</p>
            <p style="font-size: 12px; margin: 6px 0; color: #00e5ff88;">─────────────────────</p>
            <p style="font-size: 11px; margin: 8px 0; color: #00e5ff66;">Universidad Cooperativa de Colombia</p>
            <p style="font-size: 11px; margin: 4px 0; color: #00e5ff44;">© 2026</p>
            <button style="
                margin-top: 30px; background: transparent; border: 1px solid #00e5ff;
                color: #00e5ff; padding: 10px 28px; font-family: monospace;
                font-size: 12px; cursor: pointer; letter-spacing: 1px;
            ">VOLVER</button>
        `;
        document.body.appendChild(this.creditsOverlay);
        this.creditsOverlay.querySelector('button').addEventListener('click', () => {
            this.audio.playClick();
            document.body.removeChild(this.creditsOverlay);
            this.creditsOverlay = null;
        });
    }

    showExit() {
        // Crear overlay de despedida
        if (this.exitOverlay) return;
        this.exitOverlay = document.createElement('div');
        this.exitOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(2, 2, 8, 0.95); z-index: 1000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: monospace; color: #00e5ff;
        `;
        this.exitOverlay.innerHTML = `
            <h2 style="font-size: 20px; letter-spacing: 3px; margin-bottom: 20px; text-shadow: 0 0 10px #00e5ff66;">// DESCONEXIÓN</h2>
            <p style="font-size: 13px; margin: 8px 0; color: #00e5ffaa;">¿Deseas cerrar la conexión con C-R01?</p>
            <p style="font-size: 11px; margin: 4px 0; color: #00e5ff66;">Los fragmentos recuperados se perderán...</p>
            <div style="margin-top: 24px; display: flex; gap: 14px;">
                <button id="exit-confirm" style="
                    background: transparent; border: 1px solid #ff4040;
                    color: #ff4040; padding: 10px 24px; font-family: monospace;
                    font-size: 12px; cursor: pointer;
                ">DESCONECTAR</button>
                <button id="exit-cancel" style="
                    background: transparent; border: 1px solid #00e5ff;
                    color: #00e5ff; padding: 10px 24px; font-family: monospace;
                    font-size: 12px; cursor: pointer;
                ">CANCELAR</button>
            </div>
        `;
        document.body.appendChild(this.exitOverlay);
        this.exitOverlay.querySelector('#exit-confirm').addEventListener('click', () => {
            document.body.removeChild(this.exitOverlay);
            this.exitOverlay = null;
            // Mostrar pantalla negra de despedida
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;font-family:monospace;color:#00e5ff44;font-size:14px;">// CONEXIÓN TERMINADA. Hasta pronto, C-R01.</div>';
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
                this.subtitleText.material.opacity = this.cursorVisible ? 1.0 : 0.7;
            }
        }

        // Fondo animado
        if (this.bgMaterial) {
            this.bgMaterial.uniforms.uTime.value = this.time;
        }
        if (this.gridMaterial) {
            this.gridMaterial.uniforms.uTime.value = this.time;
        }

        // Hover
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
                border.material.opacity = (btn === this.hoveredBtn) ? 1.0 : 0.5;
            }
        }

        // Robot flotante
        if (this.robot) {
            this.robot.position.y = -140 + Math.sin(this.time * 1.8) * 4;
        }
    }

    exit() {
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onClick);
        this.buttons = [];
        this.audio.stopMusic();
    }
}
