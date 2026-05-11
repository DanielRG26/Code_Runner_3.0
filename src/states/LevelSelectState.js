/**
 * LevelSelectState - Selector de niveles con estética cyberpunk
 */
import * as THREE from 'three';
import { STATES } from './GameStateManager.js';
import { PixelText } from '../utils/PixelText.js';
import { createNeonButton } from '../utils/UIFactory.js';

export class LevelSelectState {
    constructor(stateManager, renderer) {
        this.stateManager = stateManager;
        this.renderer = renderer;
        this.buttons = [];
        this.time = 0;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    enter() {
        const scene = this.renderer.scene;
        scene.background = new THREE.Color(0x080810);

        // Fondo
        this.createBackground(scene);

        // Título
        const title = PixelText.create('CODE RUNNER', 0, 240, 36, 0x00e5ff);
        scene.add(title);
        const subtitle = PixelText.create('FRAGMENTOS DE CONSCIENCIA_', 0, 195, 14, 0x88ccdd);
        scene.add(subtitle);

        // Niveles
        const levels = [
            { name: '> INTRODUCCIÓN', icon: '▶', unlocked: true },
            { name: '> NIVEL_1', icon: '◠', unlocked: true },
            { name: '> NIVEL_2', icon: '⚡', unlocked: false },
            { name: '> NIVEL_3', icon: '⚙', unlocked: false },
            { name: '> NIVEL_4', icon: '◎', unlocked: false },
            { name: '> NIVEL_5', icon: '✦', unlocked: false }
        ];

        const startY = 120;
        const spacing = 60;

        levels.forEach((level, i) => {
            const y = startY - i * spacing;
            const btn = createNeonButton(level.name, 0, y, 340, 44);
            btn.userData = { action: 'level', levelIndex: i, unlocked: level.unlocked };

            if (!level.unlocked) {
                // Oscurecer botones bloqueados
                btn.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = 0.3;
                    }
                });
            }

            scene.add(btn);
            this.buttons.push(btn);

            // Icono a la derecha
            if (level.unlocked) {
                const iconMesh = PixelText.create('▶', 200, y, 12, 0x00e5ff);
                scene.add(iconMesh);
            } else {
                const lockIcon = PixelText.create('🔒', 200, y, 12, 0x555555);
                scene.add(lockIcon);
            }
        });

        // Botón volver
        const btnBack = createNeonButton('< VOLVER AL MENÚ', 0, startY - levels.length * spacing - 20, 280, 40);
        btnBack.userData = { action: 'back' };
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
                    vec3 col = mix(vec3(0.03, 0.03, 0.06), vec3(0.05, 0.06, 0.1), vUv.y);
                    float scan = sin(vUv.y * 400.0 + uTime) * 0.015;
                    col += scan;
                    // Grid sutil
                    float gx = step(0.98, fract(vUv.x * 40.0));
                    float gy = step(0.98, fract(vUv.y * 25.0));
                    col += (gx + gy) * 0.02;
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -10;
        scene.add(bg);
        this.bgMaterial = bgMat;

        // Siluetas de Ecos
        const positions = [-480, -380, 400, 520];
        positions.forEach(x => {
            const echo = this.createEcho(x, -100 + Math.random() * 30);
            scene.add(echo);
        });
    }

    createEcho(x, y) {
        const group = new THREE.Group();
        const bodyGeo = new THREE.PlaneGeometry(28, 48);
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0x121220, transparent: true, opacity: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        const eyeGeo = new THREE.PlaneGeometry(3, 3);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x223344, transparent: true, opacity: 0.4 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-5, 10, 0.1);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(5, 10, 0.1);
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
                if (action === 'back') {
                    this.stateManager.changeState(STATES.MAIN_MENU);
                } else if (action === 'level' && unlocked) {
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
        for (const btn of this.buttons) {
            const intersects = this.raycaster.intersectObject(btn, true);
            const border = btn.children.find(c => c.userData.isBorder);
            if (border && btn.userData.unlocked !== false) {
                border.material.opacity = intersects.length > 0 ? 1.0 : 0.7;
            }
        }
    }

    exit() {
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onClick);
        this.buttons = [];
    }
}
