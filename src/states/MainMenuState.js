/**
 * MainMenuState - Menú principal con estética cyberpunk pixel art
 * Fondo oscuro, siluetas de Ecos, cables, perro robot C-R01 sentado
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
        scene.background = new THREE.Color(0x080810);

        // Iniciar música
        this.audio.startMusic();

        // Fondo
        this.createBackground(scene);

        // Título: CODE RUNNER
        this.titleText = PixelText.create('CODE RUNNER', 0, 190, 52, 0x00e5ff);
        scene.add(this.titleText);

        // Subtítulo con cursor parpadeante
        this.subtitleText = PixelText.create('FRAGMENTOS DE CONSCIENCIA_', 0, 125, 18, 0x88ccdd);
        scene.add(this.subtitleText);

        // Perro Robot C-R01 sentado a la izquierda
        this.robot = createRobotSprite(-240, -40, 100, 'BLUE');
        scene.add(this.robot);

        // Etiqueta C-R01
        const label = PixelText.create('C-R01', -240, -105, 10, 0x88aacc);
        scene.add(label);

        // Botones
        const btnStart = createNeonButton('> INICIAR_SECUENCIA', 80, -10, 320, 52);
        btnStart.userData = { action: 'start' };
        scene.add(btnStart);
        this.buttons.push(btnStart);

        const btnLevels = createNeonButton('> SECTORES_DE_MEMORIA', 80, -80, 320, 52);
        btnLevels.userData = { action: 'levels' };
        scene.add(btnLevels);
        this.buttons.push(btnLevels);

        // Eventos
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('click', this.onClick);
    }

    createBackground(scene) {
        // Fondo con shader
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
                    vec3 col = mix(vec3(0.02, 0.02, 0.05), vec3(0.05, 0.06, 0.1), vUv.y);
                    // Scanlines
                    float scan = sin(vUv.y * 400.0 + uTime * 1.5) * 0.015;
                    col += scan;
                    // Interferencia estática sutil
                    float noise = fract(sin(dot(vUv + uTime * 0.01, vec2(12.9898, 78.233))) * 43758.5453);
                    col += noise * 0.008;
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -10;
        scene.add(bg);
        this.bgMaterial = bgMat;

        // Siluetas de Ecos (robots fallidos)
        [-500, -380, 360, 480, 550].forEach(x => {
            const echo = this.createEchoSilhouette(x, -100 + Math.random() * 50);
            scene.add(echo);
        });

        // Cables colgantes
        for (let i = 0; i < 10; i++) {
            const cable = this.createCable(-600 + i * 135, 300, 120 + Math.random() * 100);
            scene.add(cable);
        }
    }

    createEchoSilhouette(x, y) {
        const group = new THREE.Group();
        // Cuerpo
        const bodyGeo = new THREE.PlaneGeometry(28, 52);
        const bodyMat = new THREE.MeshBasicMaterial({
            color: 0x111118, transparent: true, opacity: 0.75
        });
        group.add(new THREE.Mesh(bodyGeo, bodyMat));
        // Ojos tenues
        const eyeGeo = new THREE.PlaneGeometry(3, 3);
        const eyeMat = new THREE.MeshBasicMaterial({
            color: 0x223344, transparent: true, opacity: 0.4
        });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-5, 14, 0.1);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(5, 14, 0.1);
        group.add(eyeL, eyeR);
        group.position.set(x, y, -5);
        return group;
    }

    createCable(x, startY, length) {
        const geo = new THREE.PlaneGeometry(1.5, length);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x181828, transparent: true, opacity: 0.5
        });
        const cable = new THREE.Mesh(geo, mat);
        cable.position.set(x + Math.sin(x) * 5, startY - length / 2, -4);
        return cable;
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
                }
                break;
            }
        }
    }

    update(delta) {
        this.time += delta;

        // Cursor parpadeante
        this.cursorTimer += delta;
        if (this.cursorTimer > 0.5) {
            this.cursorTimer = 0;
            this.cursorVisible = !this.cursorVisible;
            if (this.subtitleText) {
                this.subtitleText.material.opacity = this.cursorVisible ? 1.0 : 0.8;
            }
        }

        // Fondo animado
        if (this.bgMaterial) {
            this.bgMaterial.uniforms.uTime.value = this.time;
        }

        // Hover en botones
        this.raycaster.setFromCamera(this.mouse, this.renderer.camera);
        let newHovered = null;
        for (const btn of this.buttons) {
            const intersects = this.raycaster.intersectObject(btn, true);
            if (intersects.length > 0) {
                newHovered = btn;
                break;
            }
        }
        // Sonido de hover
        if (newHovered && newHovered !== this.hoveredBtn) {
            this.audio.playHover();
        }
        this.hoveredBtn = newHovered;

        // Actualizar brillo de bordes
        for (const btn of this.buttons) {
            const border = btn.children.find(c => c.userData.isBorder);
            if (border) {
                border.material.opacity = (btn === this.hoveredBtn) ? 1.0 : 0.6;
            }
        }

        // Robot flotante
        if (this.robot) {
            this.robot.position.y = -40 + Math.sin(this.time * 1.8) * 5;
        }
    }

    exit() {
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onClick);
        this.buttons = [];
        this.audio.stopMusic();
    }
}
