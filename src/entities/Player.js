/**
 * Player - Perro Robot C-R01 en gameplay
 * Diseño: Cabeza grande con visor oscuro, orejas caídas azul-teal,
 * cuerpo blanco articulado, collar rojo, cola con propulsor
 * Animaciones: IDLE, WALK, JUMP, PROGRAMMED
 * Dualidad: Rojo (ojos cuadrados serios) / Azul (ojos cuadrados suaves con brillo)
 */
import * as THREE from 'three';

const ANIM = { IDLE: 'IDLE', WALK: 'WALK', JUMP: 'JUMP', PROGRAMMED: 'PROGRAMMED' };

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
        this.tailFlame = 0;
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
        const mat = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true
        });
        this.spriteMesh = new THREE.Mesh(geo, mat);
        this.group.add(this.spriteMesh);

        // Glow del collar
        const glowGeo = new THREE.PlaneGeometry(18, 5);
        this.collarGlowMat = new THREE.MeshBasicMaterial({
            color: 0xff3030,
            transparent: true,
            opacity: 0.2
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
        const collarGlow = this.state === 'RED' ? '#ff3030' : '#00e5ff';
        const jointColor = '#c8dce8';
        const shadow = '#88a0b0';
        const darkShadow = '#5a7080';

        const isWalking = this.animation === ANIM.WALK;
        const isJumping = this.animation === ANIM.JUMP;
        const isProgrammed = this.animation === ANIM.PROGRAMMED;

        // Offsets de animación
        const walkBob = isWalking ? Math.sin(this.animFrame * 10) * 1 : 0;
        const legAnim = isWalking ? Math.sin(this.animFrame * 10) * 2 : 0;
        const earBounce = isWalking ? Math.sin(this.animFrame * 10 + 1) * 1 : 0;
        const jumpSquash = isJumping ? -1 : 0;

        const bY = 2 + jumpSquash; // base Y offset

        // --- COLA con propulsor (detrás) ---
        ctx.fillStyle = white;
        ctx.fillRect(2, bY + 26, 4, 2);
        ctx.fillRect(0, bY + 24, 3, 3);
        // Propulsor
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(0, bY + 22, 3, 3);
        // Llama animada
        this.tailFlame += 0.3;
        const flameSize = 1 + Math.sin(this.tailFlame * 5) * 1;
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(0, bY + 20, 2, Math.max(1, Math.round(flameSize)));

        // --- PATAS TRASERAS ---
        ctx.fillStyle = shadow;
        ctx.fillRect(10, bY + 34 - legAnim, 4, 6);
        ctx.fillRect(14, bY + 34 + legAnim * 0.5, 3, 5);
        // Juntas
        ctx.fillStyle = midBlue;
        ctx.fillRect(10, bY + 36 - legAnim, 4, 2);
        // Pies traseros
        ctx.fillStyle = white;
        ctx.fillRect(9, bY + 40 - legAnim, 5, 3);
        ctx.fillRect(13, bY + 39 + legAnim * 0.5, 4, 3);

        // --- CUERPO ---
        ctx.fillStyle = white;
        ctx.fillRect(10, bY + 26, 22, 9);
        // Franja azul claro
        ctx.fillStyle = lightBlue;
        ctx.fillRect(10, bY + 31, 22, 4);
        // Panel central del pecho
        ctx.fillStyle = shadow;
        ctx.fillRect(18, bY + 27, 8, 4);
        ctx.fillStyle = collarGlow;
        ctx.fillRect(20, bY + 28, 4, 2);

        // --- PATAS DELANTERAS ---
        // Pata izquierda
        ctx.fillStyle = white;
        ctx.fillRect(26, bY + 35 + legAnim, 4, 6);
        ctx.fillStyle = midBlue;
        ctx.fillRect(26, bY + 37 + legAnim, 4, 2);
        ctx.fillStyle = white;
        ctx.fillRect(25, bY + 41 + legAnim, 6, 3);
        ctx.fillStyle = shadow;
        ctx.fillRect(25, bY + 43 + legAnim, 6, 1);

        // Pata derecha
        ctx.fillStyle = white;
        ctx.fillRect(30, bY + 35 - legAnim, 4, 6);
        ctx.fillStyle = midBlue;
        ctx.fillRect(30, bY + 37 - legAnim, 4, 2);
        ctx.fillStyle = white;
        ctx.fillRect(29, bY + 41 - legAnim, 6, 3);
        ctx.fillStyle = shadow;
        ctx.fillRect(29, bY + 43 - legAnim, 6, 1);

        // --- COLLAR ---
        ctx.fillStyle = collarColor;
        ctx.fillRect(12, bY + 24, 20, 2);
        ctx.fillStyle = collarGlow;
        ctx.fillRect(20, bY + 24, 4, 2);

        // --- CABEZA (grande) ---
        // Casco blanco superior
        ctx.fillStyle = white;
        ctx.fillRect(12, bY + 5 + walkBob, 24, 8);
        ctx.fillRect(10, bY + 7 + walkBob, 28, 6);
        ctx.fillRect(14, bY + 3 + walkBob, 20, 4);
        // Borde oscuro del casco
        ctx.fillStyle = darkBlue;
        ctx.fillRect(14, bY + 3 + walkBob, 20, 2);
        ctx.fillRect(12, bY + 5 + walkBob, 2, 2);
        ctx.fillRect(34, bY + 5 + walkBob, 2, 2);

        // --- ANTENA ---
        ctx.fillStyle = darkBlue;
        ctx.fillRect(23, bY + 0 + walkBob, 2, 4);
        ctx.fillStyle = collarGlow;
        ctx.fillRect(22, bY + 0 + walkBob, 4, 2);

        // --- VISOR OSCURO ---
        ctx.fillStyle = visorBlack;
        ctx.fillRect(10, bY + 11 + walkBob, 28, 7);
        ctx.fillRect(12, bY + 10 + walkBob, 24, 1);

        // --- OJOS ---
        if (isProgrammed) {
            // Barra de carga animada
            ctx.fillStyle = collarGlow;
            const loadW = ((this.animFrame * 4) % 8);
            ctx.fillRect(15, bY + 13 + walkBob, loadW, 3);
            ctx.fillRect(26, bY + 13 + walkBob, 8 - loadW, 3);
        } else if (!this.isBlinking) {
            if (this.state === 'RED') {
                // Ojos cuadrados serios
                ctx.fillStyle = eyeColor;
                ctx.fillRect(15, bY + 12 + walkBob, 4, 4);
                ctx.fillRect(27, bY + 12 + walkBob, 4, 4);
                // Brillo
                ctx.fillStyle = '#ffaaaa';
                ctx.fillRect(15, bY + 12 + walkBob, 1, 1);
                ctx.fillRect(27, bY + 12 + walkBob, 1, 1);
            } else {
                // Ojos con brillo (tiernos)
                ctx.fillStyle = eyeColor;
                ctx.fillRect(15, bY + 12 + walkBob, 4, 4);
                ctx.fillRect(27, bY + 12 + walkBob, 4, 4);
                // Brillo grande
                ctx.fillStyle = '#aaffee';
                ctx.fillRect(15, bY + 12 + walkBob, 2, 2);
                ctx.fillRect(27, bY + 12 + walkBob, 2, 2);
            }
        } else {
            // Parpadeo - línea
            ctx.fillStyle = eyeColor;
            ctx.fillRect(15, bY + 14 + walkBob, 4, 1);
            ctx.fillRect(27, bY + 14 + walkBob, 4, 1);
        }

        // --- PARTE INFERIOR CABEZA (hocico) ---
        ctx.fillStyle = white;
        ctx.fillRect(12, bY + 18 + walkBob, 24, 5);
        ctx.fillRect(14, bY + 23 + walkBob, 20, 2);
        // Franja azul
        ctx.fillStyle = lightBlue;
        ctx.fillRect(12, bY + 20 + walkBob, 24, 3);
        // Puntos del speaker
        ctx.fillStyle = darkShadow;
        ctx.fillRect(14, bY + 19 + walkBob, 1, 1);
        ctx.fillRect(16, bY + 19 + walkBob, 1, 1);
        ctx.fillRect(15, bY + 20 + walkBob, 1, 1);
        ctx.fillRect(14, bY + 21 + walkBob, 1, 1);
        ctx.fillRect(16, bY + 21 + walkBob, 1, 1);

        // --- OREJAS CAÍDAS ---
        // Oreja izquierda
        ctx.fillStyle = darkBlue;
        ctx.fillRect(6, bY + 9 + walkBob + earBounce, 5, 4);
        ctx.fillRect(4, bY + 13 + walkBob + earBounce, 5, 8);
        ctx.fillRect(5, bY + 21 + walkBob + earBounce, 4, 2);
        ctx.fillStyle = midBlue;
        ctx.fillRect(5, bY + 14 + walkBob + earBounce, 3, 5);

        // Oreja derecha
        ctx.fillStyle = darkBlue;
        ctx.fillRect(37, bY + 9 + walkBob + earBounce, 5, 4);
        ctx.fillRect(39, bY + 13 + walkBob + earBounce, 5, 8);
        ctx.fillRect(39, bY + 21 + walkBob + earBounce, 4, 2);
        ctx.fillStyle = midBlue;
        ctx.fillRect(40, bY + 14 + walkBob + earBounce, 3, 5);

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

        // Parpadeo
        this.blinkTimer += delta;
        if (!this.isBlinking && this.blinkTimer > 2.5 + Math.random() * 2) {
            this.isBlinking = true;
            this.blinkTimer = 0;
            setTimeout(() => { this.isBlinking = false; }, 120);
        }

        // Movimiento
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

        // Glow pulsante
        if (this.collarGlowMat) {
            this.collarGlowMat.opacity = 0.15 + Math.sin(this.time * 4) * 0.1;
        }

        // Redibujar sprite
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
