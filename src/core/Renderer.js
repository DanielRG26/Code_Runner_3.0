/**
 * Renderer - Encapsula Three.js con cámara ortográfica
 */
import * as THREE from 'three';

export class Renderer {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0f);

        // Cámara ortográfica para 2D pixel-perfect
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 600;
        this.frustumSize = frustumSize;

        this.camera = new THREE.OrthographicCamera(
            -frustumSize * aspect / 2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            -frustumSize / 2,
            0.1, 1000
        );
        this.camera.position.z = 100;

        this.webglRenderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false,
            pixelRatio: 1
        });
        this.webglRenderer.setSize(window.innerWidth, window.innerHeight);
        this.webglRenderer.setPixelRatio(1); // Pixel-perfect
    }

    resize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = -this.frustumSize * aspect / 2;
        this.camera.right = this.frustumSize * aspect / 2;
        this.camera.top = this.frustumSize / 2;
        this.camera.bottom = -this.frustumSize / 2;
        this.camera.updateProjectionMatrix();
        this.webglRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    clearScene() {
        while (this.scene.children.length > 0) {
            const obj = this.scene.children[0];
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        }
    }

    render() {
        this.webglRenderer.render(this.scene, this.camera);
    }
}
