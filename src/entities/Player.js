/**
 * Player - Perro Robot C-R01 en gameplay
 * Animaciones mejoradas: IDLE (respiración + cola), WALK (trote rítmico),
 * JUMP (propulsor encendido, patas estiradas, orejas atrás), CROUCH (comprimido)
 */
import * as THREE from 'three';

const ANIM = { IDLE: 'IDLE', WALK: 'WALK', JUMP: 'JUMP', PROGRAMMED: 'PROGRAMMED', CROUCH: 'CROUCH' };

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.state = 'RED';
        this.animation = ANIM.IDLE;
        this.position = { x, y };
        this.targetPosition = { x, y };
        this.isMoving = false;
        this.moveSpeed = 180;
        this.size = 48;
        this.time = 0;
        this.animFrame = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.facingRight = true;

        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        this.group = new THREE.Group();

        this.spriteCanvas = document.createElement('canvas');
        this.spriteCanvas.width = 48;
        this.spriteCanvas.height = 48;
        this.spriteCtx = this.spriteCanvas.getContext('2d');
        this.spriteCtx.imageSmoothingEnabled = false;

        this.texture = new THREE.CanvasTexture(this.spriteCanvas);
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;

        const geo = new THREE.PlaneGeometry(this.size, this.size);
        const mat = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
        this.spriteMesh = new THREE.Mesh(geo, mat);
        this.group.add(this.spriteMesh);

        // Glow del collar
        const glowGeo = new THREE.PlaneGeometry(18, 5);
        this.collarGlowMat = new THREE.MeshBasicMaterial({
            color: 0xff3030, transparent: true, opacity: 0.2
        });
        this.collarGlow = new THREE.Mesh(glowGeo, this.collarGlowMat);
        this.collarGlow.position.set(0, -2, -0.1);
        this.group.add(this.collarGlow);

        this.scene.add(this.group);
        this.drawSprite();
    }

    drawSprite() {
        const ctx = this.spriteCtx;
        ctx.clearRect(0, 0, 48, 48);

        // Paleta
        const white = '#f0f4f8';
        const lightBlue = '#a8d8ea';
        const midBlue = '#4a8faa';
        const darkBlue = '#2c5f7a';
        const visorBlack = '#1a2030';
        const eyeColor = this.state === 'RED' ? '#ff3030' : '#00e8c0';
        const collarColor = '#8b2020';
        const stateGlow = this.state === 'RED' ? '#ff3030' : '#00e5ff';
        const shadow = '#88a0b0';
        const darkShadow = '#5a7080';

        const t = this.animFrame;
        const isIdle = this.animation === ANIM.IDLE;
        const isWalking = this.animation === ANIM.WALK;
        const isJumping = this.animation === ANIM.JUMP;
        const isCrouching = this.animation === ANIM.CROUCH;
        const isProgrammed = this.animation === ANIM.PROGRAMMED;

        // --- Cálculos de animación ---
        // IDLE: respiración suave, cola oscilando lento
        const breathe = isIdle ? Math.sin(t * 3) * 0.8 : 0;
        const tailWag = isIdle ? Math.sin(t * 4) * 2 : (isWalking ? Math.sin(t * 12) * 3 : 0);

        // WALK: trote rítmico
        const walkCycle = isWalking ? Math.sin(t * 12) : 0;
        const walkBob = isWalking ? Math.abs(Math.sin(t * 12)) * 2 : 0;
        const frontLeg = isWalking ? Math.sin(t * 12) * 3 : 0;
        const backLeg = isWalking ? Math.sin(t * 12 + Math.PI) * 3 : 0;
        const earFlop = isWalking ? Math.sin(t * 12 + 0.5) * 2 : (isIdle ? Math.sin(t * 2) * 0.5 : 0);

        // JUMP: estirado, patas abajo, orejas atrás, propulsor grande
        const jumpStretch = isJumping ? -3 : 0;
        const jumpLegDangle = isJumping ? 3 : 0;
        const jumpEarBack = isJumping ? 3 : 0;
        const jumpFlame = isJumping ? 4 + Math.sin(t * 20) * 2 : 0;

        // CROUCH: comprimido
        const crouchSquish = isCrouching ? 5 : 0;
        const crouchLegBend = isCrouching ? -3 : 0;

        // Base Y
        const bY = 2 + crouchSquish + jumpStretch;

        // --- COLA con propulsor ---
        const tailBaseX = 2 + tailWag;
        ctx.fillStyle = white;
        ctx.fillRect(tailBaseX, bY + 25, 4, 2);
        ctx.fillRect(tailBaseX - 1, bY + 23, 3, 3);
        // Propulsor
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(tailBaseX - 2, bY + 21, 3, 3);
        // Llama (más grande al saltar)
        const flameH = isJumping ? jumpFlame : (1 + Math.sin(t * 8) * 1);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(tailBaseX - 2, bY + 21 - Math.max(1, Math.round(flameH)), 3, Math.max(1, Math.round(flameH)));
        if (isJumping) {
            ctx.fillStyle = '#ff660088';
            ctx.fillRect(tailBaseX - 3, bY + 21 - Math.round(flameH) - 2, 4, 3);
        }

        // --- PATAS TRASERAS ---
        const backLegY = bY + 34 + jumpLegDangle + crouchLegBend;
        ctx.fillStyle = shadow;
        ctx.fillRect(10, backLegY - backLeg, 4, 6 - crouchLegBend);
        ctx.fillRect(14, backLegY + backLeg * 0.5, 3, 5 - crouchLegBend);
        // Juntas
        ctx.fillStyle = midBlue;
        ctx.fillRect(10, backLegY + 2 - backLeg, 4, 2);
        ctx.fillRect(14, backLegY + 2 + backLeg * 0.5, 3, 2);
        // Pies
        ctx.fillStyle = white;
        ctx.fillRect(9, backLegY + 6 - backLeg, 5, 2);
        ctx.fillRect(13, backLegY + 5 + backLeg * 0.5, 4, 2);

        // --- CUERPO ---
        const bodyY = bY + 26 - walkBob + breathe;
        ctx.fillStyle = white;
        ctx.fillRect(10, bodyY, 22, 9);
        // Franja azul
        ctx.fillStyle = lightBlue;
        ctx.fillRect(10, bodyY + 5, 22, 4);
        // Panel pecho
        ctx.fillStyle = shadow;
        ctx.fillRect(18, bodyY + 1, 8, 4);
        // Luz del pecho (pulsa)
        ctx.fillStyle = stateGlow;
        const chestPulse = 0.6 + Math.sin(t * 5) * 0.4;
        ctx.globalAlpha = chestPulse;
        ctx.fillRect(20, bodyY + 2, 4, 2);
        ctx.globalAlpha = 1.0;

        // --- PATAS DELANTERAS ---
        const frontLegY = bY + 35 + jumpLegDangle + crouchLegBend;
        // Pata izquierda
        ctx.fillStyle = white;
        ctx.fillRect(26, frontLegY + frontLeg, 4, 6 - crouchLegBend);
        ctx.fillStyle = midBlue;
        ctx.fillRect(26, frontLegY + 2 + frontLeg, 4, 2);
        ctx.fillStyle = white;
        ctx.fillRect(25, frontLegY + 6 + frontLeg, 6, 2);

        // Pata derecha
        ctx.fillStyle = white;
        ctx.fillRect(30, frontLegY - frontLeg, 4, 6 - crouchLegBend);
        ctx.fillStyle = midBlue;
        ctx.fillRect(30, frontLegY + 2 - frontLeg, 4, 2);
        ctx.fillStyle = white;
        ctx.fillRect(29, frontLegY + 6 - frontLeg, 6, 2);

        // --- COLLAR ---
        ctx.fillStyle = collarColor;
        ctx.fillRect(12, bY + 24 - walkBob + breathe, 20, 2);
        ctx.fillStyle = stateGlow;
        ctx.fillRect(20, bY + 24 - walkBob + breathe, 4, 2);

        // --- CABEZA ---
        const headY = bY + 3 - walkBob + breathe + (isCrouching ? 3 : 0);
        // Casco blanco
        ctx.fillStyle = white;
        ctx.fillRect(12, headY + 2, 24, 8);
        ctx.fillRect(10, headY + 4, 28, 6);
        ctx.fillRect(14, headY, 20, 4);
        // Borde oscuro del casco
        ctx.fillStyle = darkBlue;
        ctx.fillRect(14, headY, 20, 2);
        ctx.fillRect(12, headY + 2, 2, 2);
        ctx.fillRect(34, headY + 2, 2, 2);

        // --- ANTENA ---
        const antennaGlow = 0.5 + Math.sin(t * 6) * 0.5;
        ctx.fillStyle = darkBlue;
        ctx.fillRect(23, headY - 3, 2, 4);
        ctx.globalAlpha = antennaGlow;
        ctx.fillStyle = stateGlow;
        ctx.fillRect(22, headY - 4, 4, 2);
        ctx.globalAlpha = 1.0;

        // --- VISOR ---
        ctx.fillStyle = visorBlack;
        ctx.fillRect(10, headY + 8, 28, 7);
        ctx.fillRect(12, headY + 7, 24, 1);

        // --- OJOS ---
        const eyeY = headY + 9;
        if (isProgrammed) {
            ctx.fillStyle = stateGlow;
            const loadW = ((t * 6) % 10);
            ctx.fillRect(15, eyeY, Math.min(loadW, 5), 3);
            ctx.fillRect(26, eyeY, Math.min(10 - loadW, 5), 3);
        } else if (isJumping) {
            // Ojos determinados (más pequeños, concentrados)
            ctx.fillStyle = eyeColor;
            ctx.fillRect(16, eyeY + 1, 3, 2);
            ctx.fillRect(28, eyeY + 1, 3, 2);
            ctx.fillStyle = '#ffffff55';
            ctx.fillRect(16, eyeY + 1, 1, 1);
            ctx.fillRect(28, eyeY + 1, 1, 1);
        } else if (!this.isBlinking) {
            if (this.state === 'RED') {
                // Ojos cuadrados serios
                ctx.fillStyle = eyeColor;
                ctx.fillRect(15, eyeY, 4, 4);
                ctx.fillRect(27, eyeY, 4, 4);
                ctx.fillStyle = '#ffaaaa';
                ctx.fillRect(15, eyeY, 1, 1);
                ctx.fillRect(27, eyeY, 1, 1);
            } else {
                // Ojos redondos tiernos
                ctx.fillStyle = eyeColor;
                ctx.fillRect(15, eyeY, 4, 4);
                ctx.fillRect(27, eyeY, 4, 4);
                // Brillo grande
                ctx.fillStyle = '#aaffee';
                ctx.fillRect(15, eyeY, 2, 2);
                ctx.fillRect(27, eyeY, 2, 2);
                // Brillo pequeño
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(18, eyeY + 2, 1, 1);
                ctx.fillRect(30, eyeY + 2, 1, 1);
            }
        } else {
            // Parpadeo
            ctx.fillStyle = eyeColor;
            ctx.fillRect(15, eyeY + 2, 4, 1);
            ctx.fillRect(27, eyeY + 2, 4, 1);
        }

        // --- HOCICO ---
        ctx.fillStyle = white;
        ctx.fillRect(12, headY + 15, 24, 5);
        ctx.fillRect(14, headY + 20, 20, 2);
        ctx.fillStyle = lightBlue;
        ctx.fillRect(12, headY + 17, 24, 3);
        // Speaker dots
        ctx.fillStyle = darkShadow;
        ctx.fillRect(14, headY + 16, 1, 1);
        ctx.fillRect(16, headY + 16, 1, 1);
        ctx.fillRect(15, headY + 17, 1, 1);
        ctx.fillRect(14, headY + 18, 1, 1);
        ctx.fillRect(16, headY + 18, 1, 1);

        // --- OREJAS ---
        const earY = headY + 5 + earFlop + jumpEarBack;
        const earH = isCrouching ? 6 : 8;
        // Oreja izquierda
        ctx.fillStyle = darkBlue;
        ctx.fillRect(6, earY, 5, 4);
        ctx.fillRect(4, earY + 4, 5, earH);
        ctx.fillRect(5, earY + 4 + earH, 4, 2);
        ctx.fillStyle = midBlue;
        ctx.fillRect(5, earY + 5, 3, earH - 2);

        // Oreja derecha
        ctx.fillStyle = darkBlue;
        ctx.fillRect(37, earY, 5, 4);
        ctx.fillRect(39, earY + 4, 5, earH);
        ctx.fillRect(39, earY + 4 + earH, 4, 2);
        ctx.fillStyle = midBlue;
        ctx.fillRect(40, earY + 5, 3, earH - 2);

        // --- Partículas de propulsor al saltar ---
        if (isJumping) {
            ctx.fillStyle = '#ffaa0066';
            for (let i = 0; i < 3; i++) {
                const px = tailBaseX - 3 + Math.sin(t * 15 + i * 2) * 3;
                const py = bY + 21 - Math.round(flameH) - 3 - i * 2;
                ctx.fillRect(px, py, 2, 2);
            }
        }

        this.texture.needsUpdate = true;
    }

    toggleState() {
        this.state = this.state === 'RED' ? 'BLUE' : 'RED';
        this.updateColors();
        this.drawSprite();
    }

    updateColors() {
        this.collarGlowMat.color.setHex(this.state === 'RED' ? 0xff3030 : 0x00e5ff);
    }

    setAnimation(anim) {
        if (this.animation !== anim) {
            this.animation = anim;
            this.animFrame = 0;
        }
    }

    faceDirection(right) {
        if (this.facingRight !== right) {
            this.facingRight = right;
            this.spriteMesh.scale.x = right ? 1 : -1;
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
        this.facingRight = true;
        this.spriteMesh.scale.x = 1;
        this.updateColors();
        this.drawSprite();
        this.updatePosition();
    }

    playDeathAnimation() {
        const flashGeo = new THREE.PlaneGeometry(56, 56);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xff0000, transparent: true, opacity: 0.7
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

        // Parpadeo natural
        this.blinkTimer += delta;
        if (!this.isBlinking && this.blinkTimer > 2.5 + Math.random() * 2) {
            this.isBlinking = true;
            this.blinkTimer = 0;
            setTimeout(() => { this.isBlinking = false; }, 120);
        }

        // Movimiento (para uso con moveTo)
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
