/**
 * Player - Entidad del robot C-R01 en gameplay
 * Maneja estados (Rojo/Azul), posición y animaciones
 */
import * as THREE from 'three';

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.state = 'RED'; // RED = Lógica, BLUE = Emoción
        this.position = { x, y };
        this.targetPosition = { x, y };
        this.isMoving = false;
        this.moveSpeed = 200; // px/s
        this.size = 32;
        this.time = 0;

        this.createMesh();
        this.updatePosition();
    }

    createMesh() {
        this.group = new THREE.Group();

        // Cuerpo del robot
        const bodyCanvas = this.drawRobot();
        const bodyTexture = new THREE.CanvasTexture(bodyCanvas);
        bodyTexture.magFilter = THREE.NearestFilter;
        bodyTexture.minFilter = THREE.NearestFilter;

        const bodyGeo = new THREE.PlaneGeometry(this.size, this.size);
        const bodyMat = new THREE.MeshBasicMaterial({
            map: bodyTexture,
            transparent: true
        });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.group.add(this.bodyMesh);

        // Núcleo brillante (cambia de color)
        const coreGeo = new THREE.PlaneGeometry(8, 8);
        this.coreMat = new THREE.MeshBasicMaterial({
            color: 0xff3030,
            transparent: true,
            opacity: 0.9
        });
        this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
        this.coreMesh.position.z = 0.1;
        this.coreMesh.position.y = -2;
        this.group.add(this.coreMesh);

        // Glow del núcleo
        const glowGeo = new THREE.PlaneGeometry(16, 16);
        this.glowMat = new THREE.MeshBasicMaterial({
            color: 0xff3030,
            transparent: true,
            opacity: 0.2
        });
        this.glowMesh = new THREE.Mesh(glowGeo, this.glowMat);
        this.glowMesh.position.z = 0.05;
        this.glowMesh.position.y = -2;
        this.group.add(this.glowMesh);

        this.scene.add(this.group);
    }

    drawRobot() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Cuerpo
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(8, 8, 16, 16);

        // Cabeza
        ctx.fillStyle = '#5a5a6a';
        ctx.fillRect(10, 2, 12, 8);

        // Visor
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(12, 4, 3, 3);
        ctx.fillRect(17, 4, 3, 3);

        // Antena
        ctx.fillStyle = '#6a6a7a';
        ctx.fillRect(15, 0, 2, 3);

        // Piernas
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(10, 24, 4, 6);
        ctx.fillRect(18, 24, 4, 6);

        // Brazos
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(5, 10, 3, 10);
        ctx.fillRect(24, 10, 3, 10);

        // Pies
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(9, 29, 6, 3);
        ctx.fillRect(17, 29, 6, 3);

        return canvas;
    }

    toggleState() {
        this.state = this.state === 'RED' ? 'BLUE' : 'RED';
        this.updateCoreColor();
    }

    updateCoreColor() {
        if (this.state === 'RED') {
            this.coreMat.color.setHex(0xff3030);
            this.glowMat.color.setHex(0xff3030);
        } else {
            this.coreMat.color.setHex(0x3070ff);
            this.glowMat.color.setHex(0x3070ff);
        }
    }

    moveTo(x, y) {
        this.targetPosition = { x, y };
        this.isMoving = true;
    }

    updatePosition() {
        this.group.position.set(this.position.x, this.position.y, 5);
    }

    reset(x, y) {
        this.position = { x, y };
        this.targetPosition = { x, y };
        this.isMoving = false;
        this.state = 'RED';
        this.updateCoreColor();
        this.updatePosition();
    }

    playDeathAnimation() {
        // Flash rojo
        const flashGeo = new THREE.PlaneGeometry(48, 48);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.6
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(this.group.position);
        flash.position.z = 10;
        this.scene.add(flash);

        // Fade out
        const fadeOut = () => {
            flashMat.opacity -= 0.05;
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

        // Movimiento suave hacia target
        if (this.isMoving) {
            const dx = this.targetPosition.x - this.position.x;
            const dy = this.targetPosition.y - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 2) {
                this.position.x = this.targetPosition.x;
                this.position.y = this.targetPosition.y;
                this.isMoving = false;
            } else {
                const speed = this.moveSpeed * delta;
                this.position.x += (dx / dist) * Math.min(speed, dist);
                this.position.y += (dy / dist) * Math.min(speed, dist);
            }
            this.updatePosition();
        }

        // Animación del glow pulsante
        if (this.glowMat) {
            this.glowMat.opacity = 0.15 + Math.sin(this.time * 4) * 0.1;
        }
    }

    getBounds() {
        const halfSize = this.size / 2 - 4;
        return {
            left: this.position.x - halfSize,
            right: this.position.x + halfSize,
            top: this.position.y + halfSize,
            bottom: this.position.y - halfSize
        };
    }
}
