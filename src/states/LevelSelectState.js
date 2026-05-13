/**
 * LevelSelectState - Selector de niveles con estética cyberpunk
 */
import * as THREE from 'three';
import { STATES } from './GameStateManager.js';
import { PixelText } from '../utils/PixelText.js';
import { createNeonButton, redrawButton } from '../utils/UIFactory.js';
import { createRobotSprite } from '../entities/RobotSprite.js';
import { ProgressManager } from '../core/ProgressManager.js';

export class LevelSelectState {
    constructor(stateManager, renderer, audio) {
        this.stateManager = stateManager;
        this.renderer = renderer;
        this.audio = audio;
        this.buttons = [];
        this.time = 0;
        this.hoveredBtn = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    enter() {
        const scene = this.renderer.scene;
        scene.background = new THREE.Color(0x080810);

        this.createBackground(scene);

        // Título
        const title = PixelText.create('CODE RUNNER', 0, 250, 38, 0x00e5ff);
        scene.add(title);
        const subtitle = PixelText.create('FRAGMENTOS DE CONSCIENCIA_', 0, 205, 13, 0x88ccdd);
        scene.add(subtitle);

        // Robot C-R01 a la izquierda
        const robot = createRobotSprite(-320, 0, 80, 'BLUE');
        scene.add(robot);
        const label = PixelText.create('C-R01', -320, -55, 9, 0x88aacc);
        scene.add(label);

        // Niveles
        const levels = [
            { name: '> INTRODUCCIÓN',          icon: '▶', unlocked: true  },
            { name: '> NIVEL_1',               icon: '◠', unlocked: false },
            { name: '> NIVEL_2: ZONA QUÍMICA', icon: '⚗', unlocked: true  },
            { name: '> NIVEL_3',               icon: '⚡', unlocked: false },
            { name: '> NIVEL_4: NÚCLEO CORRUPTO', icon: '⚙', unlocked: true  },
            { name: '> NIVEL_5',               icon: '✦', unlocked: false }
        ];

        const startY = 140;
        const spacing = 55;

        levels.forEach((level, i) => {
            const y = startY - i * spacing;
            const btn = createNeonButton(level.name, 40, y, 300, 42);
            btn.userData = { action: 'level', levelIndex: i, unlocked: level.unlocked };

            if (!level.unlocked) {
                btn.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = Math.min(child.material.opacity, 0.3);
                    }
                });
            }

            scene.add(btn);
            this.buttons.push(btn);

            // Mostrar fragmentos recogidos como diamantes visuales
            const fragments = ProgressManager.getFragments(i);
            const totalFragments = 3;
            for (let f = 0; f < totalFragments; f++) {
                const collected = f < fragments;
                const diamondGeo = new THREE.PlaneGeometry(12, 12);
                const diamondMat = new THREE.MeshBasicMaterial({
                    color: collected ? 0x40a0ff : 0x222233,
                    transparent: true,
                    opacity: collected ? 0.9 : 0.3
                });
                const diamond = new THREE.Mesh(diamondGeo, diamondMat);
                diamond.rotation.z = Math.PI / 4;
                diamond.position.set(230 + f * 22, y, 1);
                scene.add(diamond);

                // Glow si está recogido
                if (collected) {
                    const glowGeo = new THREE.PlaneGeometry(16, 16);
                    const glowMat = new THREE.MeshBasicMaterial({
                        color: 0x40a0ff, transparent: true, opacity: 0.25
                    });
                    const glow = new THREE.Mesh(glowGeo, glowMat);
                    glow.rotation.z = Math.PI / 4;
                    glow.position.set(230 + f * 22, y, 0.9);
                    scene.add(glow);
                }
            }

            // Icono de estado (completado/bloqueado)
            if (level.unlocked) {
                if (ProgressManager.isCompleted(i)) {
                    const checkIcon = PixelText.create('✓', 310, y, 12, 0x00ff88);
                    scene.add(checkIcon);
                }
            } else {
                const lockIcon = PixelText.create('🔒', 310, y, 11, 0x444444);
                scene.add(lockIcon);
            }
        });

        // Botón volver
        const btnBack = createNeonButton('< VOLVER AL MENU', 40, startY - levels.length * spacing - 20, 260, 38);
        btnBack.userData = { action: 'back', unlocked: true };
        scene.add(btnBack);
        this.buttons.push(btnBack);

        // Eventos
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
                    vec3 col = mix(vec3(0.02, 0.02, 0.05), vec3(0.04, 0.05, 0.08), vUv.y);
                    float scan = sin(vUv.y * 500.0 + uTime) * 0.012;
                    col += scan;
                    // Grid de circuito
                    float gx = step(0.985, fract(vUv.x * 35.0));
                    float gy = step(0.985, fract(vUv.y * 22.0));
                    col += (gx + gy) * 0.015;
                    // Noise
                    float noise = fract(sin(dot(vUv + uTime * 0.005, vec2(12.9898, 78.233))) * 43758.5453);
                    col += noise * 0.006;
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -10;
        scene.add(bg);
        this.bgMaterial = bgMat;

        // Siluetas de Ecos
        [400, 480, 550].forEach(x => {
            const echo = this.createEcho(x, -80 + Math.random() * 30);
            scene.add(echo);
        });
    }

    createEcho(x, y) {
        const group = new THREE.Group();
        const bodyGeo = new THREE.PlaneGeometry(26, 46);
        const bodyMat = new THREE.MeshBasicMaterial({
            color: 0x0f0f18, transparent: true, opacity: 0.6
        });
        group.add(new THREE.Mesh(bodyGeo, bodyMat));
        const eyeGeo = new THREE.PlaneGeometry(3, 3);
        const eyeMat = new THREE.MeshBasicMaterial({
            color: 0x223344, transparent: true, opacity: 0.35
        });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-4, 10, 0.1);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(4, 10, 0.1);
        group.add(eyeL, eyeR);
        group.position.set(x, y, -5);
        return group;
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
                const { action, levelIndex, unlocked } = btn.userData;
                if (!unlocked) break;
                this.audio.playClick();
                if (action === 'back') {
                    this.stateManager.changeState(STATES.MAIN_MENU);
                } else if (action === 'level') {
                    this.stateManager.changeState(STATES.GAMEPLAY, { level: levelIndex });
                }
                break;
            }
        }
    }

    update(delta) {
        this.time += delta;
        if (this.bgMaterial) {
            this.bgMaterial.uniforms.uTime.value = this.time;
        }

        // Hover
        this.raycaster.setFromCamera(this.mouse, this.renderer.camera);
        let newHovered = null;
        for (const btn of this.buttons) {
            if (btn.userData.unlocked === false) continue;
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
            if (border && btn.userData.unlocked !== false) {
                const isHovered = btn === this.hoveredBtn;
                redrawButton(border, isHovered ? 1.0 : 0.5);
            }
        }
    }

    exit() {
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onClick);
        this.buttons = [];
    }
}
