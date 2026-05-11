/**
 * MainMenuState - Menú principal con estética cyberpunk pixel art
 */
import * as THREE from 'three';
import { STATES } from './GameStateManager.js';
import { PixelText } from '../utils/PixelText.js';
import { createNeonButton } from '../utils/UIFactory.js';
import { createRobotSprite } from '../entities/RobotSprite.js';

export class MainMenuState {
    constructor(stateManager, renderer) {
        this.stateManager = stateManager;
        this.renderer = renderer;
        this.objects = [];
        this.time = 0;
        this.cursorVisible = true;
        this.cursorTimer = 0;
        this.hoveredButton = null;
        this.buttons = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    enter() {
        const scene = this.renderer.scene;
        scene.background = new THREE.Color(0x080810);

        // Fondo con siluetas de Ecos y cables
        this.createBackground(scene);

        // Título: CODE RUNNER
        this.titleText = PixelText.create('CODE RUNNER', 0, 180, 48, 0x00e5ff);
        scene.add(this.titleText);

        // Subtítulo con cursor parpadeante
        this.subtitleText = PixelText.create('FRAGMENTOS DE CONSCIENCIA_', 0, 120, 20, 0x88ccdd);
        scene.add(this.subtitleText);

        // Robot C-R01 a la izquierda
        this.robot = createRobotSprite(-260, -30, 80);
        scene.add(this.robot);

        // Botones
        const btnStart = createNeonButton('> INICIAR_SECUENCIA', 60, -20, 320, 50);
        btnStart.userData = { action: 'start' };
        scene.add(btnStart);
        this.buttons.push(btnStart);

        const btnLevels = createNeonButton('> SECTORES_DE_MEMORIA', 60, -90, 320, 50);
        btnLevels.userData = { action: 'levels' };
        scene.add(btnLevels);
        this.buttons.push(btnLevels);

        // Etiqueta C-R01
        const label = PixelText.create('C-R01', -260, -90, 10, 0x88aacc);
        scene.add(label);

        // Eventos
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('click', this.onClick);
    }

    createBackground(scene) {
        // Fondo degradado oscuro
        const bgGeo = new THREE.PlaneGeometry(1400, 700);
        const bgMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
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
                    vec3 col = mix(vec3(0.03, 0.03, 0.06), vec3(0.06, 0.08, 0.12), vUv.y);
                    // Líneas de escaneo
                    float scan = sin(vUv.y * 300.0 + uTime * 2.0) * 0.02;
                    col += scan;
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -10;
        scene.add(bg);
        this.bgMaterial = bgMat;

        // Siluetas de Ecos (robots fallidos)
        const echoPositions = [-500, -350, 350, 480];
        echoPositions.forEach(x => {
            const echo = this.createEchoSilhouette(x, -80 + Math.random() * 40);
            scene.add(echo);
        });

        // Cables colgantes
        for (let i = 0; i < 8; i++) {
            const cable = this.createCable(-600 + i * 170, 300);
            scene.add(cable);
        }
    }

    createEchoSilhouette(x, y) {
        const group = new THREE.Group();
        // Cuerpo
        const bodyGeo = new THREE.PlaneGeometry(30, 50);
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0x151520, transparent: true, opacity: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        // Ojos brillantes
        const eyeGeo = new THREE.PlaneGeometry(4, 4);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.5 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-6, 12, 0.1);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(6, 12, 0.1);
        group.add(eyeL, eyeR);
        group.position.set(x, y, -5);
        return group;
    }

    createCable(x, y) {
        const points = [];
        const segments = 8;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            points.push(new THREE.Vector3(
                x + Math.sin(t * 3) * 10,
                y - t * 200,
                -3
            ));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(curve, 12, 1.5, 4, false);
        const mat = new THREE.MeshBasicMaterial({ color: 0x1a1a2a });
        return new THREE.Mesh(geo, mat);
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
                const text = this.cursorVisible
                    ? 'FRAGMENTOS DE CONSCIENCIA_'
                    : 'FRAGMENTOS DE CONSCIENCIA ';
                // Actualizar opacidad del último carácter simulando cursor
                this.subtitleText.material.opacity = this.cursorVisible ? 1.0 : 0.85;
            }
        }

        // Animación del fondo
        if (this.bgMaterial) {
            this.bgMaterial.uniforms.uTime.value = this.time;
        }

        // Hover en botones
        this.raycaster.setFromCamera(this.mouse, this.renderer.camera);
        let hovered = null;
        for (const btn of this.buttons) {
            const intersects = this.raycaster.intersectObject(btn, true);
            if (intersects.length > 0) {
                hovered = btn;
                break;
            }
        }
        for (const btn of this.buttons) {
            const border = btn.children.find(c => c.userData.isBorder);
            if (border) {
                border.material.opacity = (btn === hovered) ? 1.0 : 0.7;
            }
        }

        // Animación robot flotante
        if (this.robot) {
            this.robot.position.y = -30 + Math.sin(this.time * 2) * 5;
        }
    }

    exit() {
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onClick);
        this.buttons = [];
    }
}
