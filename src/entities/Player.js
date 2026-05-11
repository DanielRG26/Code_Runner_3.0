/**
 * Player - Perro Robot C-R01 en gameplay
 * Animaciones: IDLE, WALK, JUMP, PROGRAMMED
 * Sistema de dualidad: Rojo (Lógica, ojos cuadrados) / Azul (Emoción, ojos redondos)
 */
import * as THREE from 'three';

// Animaciones disponibles
const ANIM = { IDLE: 'IDLE', WALK: 'WALK', JUMP: 'JUMP', PROGRAMMED: 'PROGRAMMED' };

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.state = 'RED'; // RED = Lógica, BLUE = Emoción
        this.animation = ANIM.IDLE;
        this.position = { x, y };
        this.targetPosition = { x, y };
        this.isMoving = false;
        this.moveSpeed = 180;
        this.size = 40;
        this.time = 0;
        this.animFrame = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.tailAngle = 0;

        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        this.group = new THREE.Group();

        // Canvas principal del sprite
        this.spriteCanvas = document.createElement('canvas');
        this.spriteCanvas.width = 48;
        this.spriteCanvas.height = 48;
        this.spriteCtx = this.spriteCanvas.getContext('2d');
        this.spriteCtx.imageSmoothingEnabled = false;

        this.texture = new THREE.CanvasTexture(this.spriteCanvas);
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;

        const geo = new THREE.PlaneGeometry(this.size, this.size);
        const mat = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true
        });
        this.spriteMesh = new THREE.Mesh(geo, mat);
        this.group.add(this.spriteMesh);

        // Glow del collar (cambia de color)
        const glowGeo = new THREE.PlaneGeometry(20, 6);
        this.collarGlowMat = new THREE.MeshBasicMaterial({
            color: 0xff3030,
            transparent: true,
            opacity: 0.25
        });
        this.collarGlow = new THREE.Mesh(glowGeo, this.collarGlowMat);
        this.collarGlow.position.set(0, -4, -0.1);
        this.group.add(this.collarGlow);

        this.scene.add(this.group);
        this.drawSprite();
    }

    drawSprite() {
        const ctx = this.spriteCtx;
        const w = 48, h = 48;
        ctx.clearRect(0, 0, w, h);

        const bodyColor = '#e8e8f0';
        const darkBody = '#c8c8d4';
        const earColor = '#4488cc';
        const stateColor = this.state === 'RED' ? '#ff3030' : '#00e5ff';
        const isWalking = this.animation === ANIM.WALK;
        const isJumping = this.animation === ANIM.JUMP;
        const isProgrammed = this.animation === ANIM.PROGRAMMED;

        // Offset de animación de caminar
        const walkBob = isWalking ? Math.sin(this.animFrame * 8) * 1.5 : 0;
        const legOffset = isWalking ? Math.sin(this.animFrame * 8) * 3 : 0;
        const jumpSquash = isJumping ? -2 : 0;

        const baseY = 8 + jumpSquash;

        // --- Cola (detrás del cuerpo) ---
        ctx.fillStyle = bodyColor;
        const tailWag = Math.sin(this.tailAngle) * 4;
        ctx.fillRect(4 + tailWag, baseY + 10, 4, 3);
        ctx.fillRect(2 + tailWag, baseY + 8, 3, 3);
        ctx.fillStyle = stateColor;
        ctx.fillRect(1 + tailWag, baseY + 7, 2, 2);

        // --- Patas traseras ---
        ctx.fillStyle = darkBody;
        ctx.fillRect(8, baseY + 28 - legOffset, 5, 8);
        ctx.fillRect(28, baseY + 28 + legOffset, 5, 8);
        // Pies traseros
        ctx.fillStyle = '#aaa';
        ctx.fillRect(7, baseY + 35 - legOffset, 6, 3);
        ctx.fillRect(27, baseY + 35 + legOffset, 6, 3);

        // --- Cuerpo principal ---
        ctx.fillStyle = bodyColor;
        ctx.fillRect(10, baseY + 16 + walkBob, 22, 14);
        // Sombra inferior
        ctx.fillStyle = darkBody;
        ctx.fillRect(10, baseY + 27 + walkBob, 22, 3);

        // --- Patas delanteras ---
        ctx.fillStyle = bodyColor;
        ctx.fillRect(12, baseY + 30 + legOffset, 5, 8);
        ctx.fillRect(25, baseY + 30 - legOffset, 5, 8);
        // Pies delanteros
        ctx.fillStyle = '#ddd';
        ctx.fillRect(11, baseY + 37 + legOffset, 6, 3);
        ctx.fillRect(24, baseY + 37 - legOffset, 6, 3);

        // --- Collar ---
        ctx.fillStyle = '#222';
        ctx.fillRect(11, baseY + 16 + walkBob, 20, 3);
        ctx.fillStyle = stateColor;
        ctx.fillRect(18, baseY + 16 + walkBob, 6, 3);

        // --- Cabeza ---
        ctx.fillStyle = bodyColor;
        ctx.fillRect(13, baseY + 2 + walkBob, 20, 15);

        // Hocico
        ctx.fillStyle = darkBody;
        ctx.fillRect(27, baseY + 10 + walkBob, 8, 6);
        // Nariz
        ctx.fillStyle = '#222';
        ctx.fillRect(33, baseY + 11 + walkBob, 3, 3);

        // --- Orejas azules ---
        ctx.fillStyle = earColor;
        const earBounce = isWalking ? Math.sin(this.animFrame * 8 + 1) * 1 : 0;
        const earJump = isJumping ? 2 : 0;
        ctx.fillRect(13, baseY - 2 + earBounce + earJump + walkBob, 5, 8);
        ctx.fillRect(24, baseY - 2 + earBounce + earJump + walkBob, 5, 8);

        // --- Ojos/Visor ---
        if (isProgrammed) {
            // Animación de carga de datos en el visor
            ctx.fillStyle = stateColor;
            const loadBar = (this.animFrame * 3) % 8;
            ctx.fillRect(16, baseY + 6 + walkBob, loadBar, 3);
            ctx.fillRect(24, baseY + 6 + walkBob, 8 - loadBar, 3);
        } else if (!this.isBlinking) {
            if (this.state === 'RED') {
                // Ojos CUADRADOS (serios - lógica)
                ctx.fillStyle = stateColor;
                ctx.fillRect(16, baseY + 5 + walkBob, 4, 4);
                ctx.fillRect(23, baseY + 5 + walkBob, 4, 4);
                // Pupila
                ctx.fillStyle = '#800000';
                ctx.fillRect(17, baseY + 6 + walkBob, 2, 2);
                ctx.fillRect(24, baseY + 6 + walkBob, 2, 2);
            } else {
                // Ojos REDONDOS (tiernos - emoción)
                ctx.fillStyle = stateColor;
                ctx.beginPath();
                ctx.arc(18, baseY + 7 + walkBob, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(25, baseY + 7 + walkBob, 2.5, 0, Math.PI * 2);
                ctx.fill();
                // Brillo
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(17, baseY + 6 + walkBob, 1, 1);
                ctx.fillRect(24, baseY + 6 + walkBob, 1, 1);
            }
        } else {
            // Parpadeo - línea horizontal
            ctx.fillStyle = stateColor;
            ctx.fillRect(16, baseY + 7 + walkBob, 4, 1);
            ctx.fillRect(23, baseY + 7 + walkBob, 4, 1);
        }

        // --- Antena ---
        ctx.fillStyle = '#888';
        ctx.fillRect(20, baseY - 3 + walkBob, 2, 5);
        ctx.fillStyle = stateColor;
        ctx.fillRect(19, baseY - 4 + walkBob, 4, 2);

        // Actualizar textura
        this.texture.needsUpdate = true;
    }

    toggleState() {
        this.state = this.state === 'RED' ? 'BLUE' : 'RED';
        this.updateColors();
        this.drawSprite();
    }

    updateColors() {
        if (this.state === 'RED') {
            this.collarGlowMat.color.setHex(0xff3030);
        } else {
            this.collarGlowMat.color.setHex(0x00e5ff);
        }
    }

    setAnimation(anim) {
        if (this.animation !== anim) {
            this.animation = anim;
            this.animFrame = 0;
        }
    }

    moveTo(x, y) {
        this.targetPosition = { x, y };
        this.isMoving = true;
        this.setAnimation(ANIM.WALK);
    }

    updatePosition() {
        this.group.position.set(this.position.x, this.position.y, 5);
    }

    reset(x, y) {
        this.position = { x, y };
        this.targetPosition = { x, y };
        this.isMoving = false;
        this.state = 'RED';
        this.animation = ANIM.IDLE;
        this.updateColors();
        this.drawSprite();
        this.updatePosition();
    }

    playDeathAnimation() {
        const flashGeo = new THREE.PlaneGeometry(56, 56);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(this.group.position);
        flash.position.z = 10;
        this.scene.add(flash);

        const fadeOut = () => {
            flashMat.opacity -= 0.04;
            if (flashMat.opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(flash);
                flashGeo.dispose();
                flashMat.dispose();
            }
        };
        fadeOut();
    }

    update(delta) {
        this.time += delta;
        this.animFrame += delta;
        this.tailAngle += delta * 6;

        // Parpadeo periódico
        this.blinkTimer += delta;
        if (!this.isBlinking && this.blinkTimer > 3 + Math.random() * 2) {
            this.isBlinking = true;
            this.blinkTimer = 0;
            setTimeout(() => { this.isBlinking = false; }, 150);
        }

        // Movimiento suave hacia target
        if (this.isMoving) {
            const dx = this.targetPosition.x - this.position.x;
            const dy = this.targetPosition.y - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 2) {
                this.position.x = this.targetPosition.x;
                this.position.y = this.targetPosition.y;
                this.isMoving = false;
                this.setAnimation(ANIM.IDLE);
            } else {
                const speed = this.moveSpeed * delta;
                this.position.x += (dx / dist) * Math.min(speed, dist);
                this.position.y += (dy / dist) * Math.min(speed, dist);
            }
            this.updatePosition();
        }

        // Glow pulsante del collar
        if (this.collarGlowMat) {
            this.collarGlowMat.opacity = 0.15 + Math.sin(this.time * 4) * 0.1;
        }

        // Redibujar sprite cada frame para animaciones
        this.drawSprite();
    }

    getBounds() {
        const halfSize = this.size / 2 - 6;
        return {
            left: this.position.x - halfSize,
            right: this.position.x + halfSize,
            top: this.position.y + halfSize,
            bottom: this.position.y - halfSize
        };
    }
}
