/**
 * PixelText - Renderizado de texto pixel art usando Canvas como textura
 */
import * as THREE from 'three';

export class PixelText {
    /**
     * Crea un mesh con texto renderizado como textura pixel-perfect
     * @param {string} text - Texto a mostrar
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} size - Tamaño del texto
     * @param {number} color - Color hex
     * @returns {THREE.Mesh}
     */
    static create(text, x, y, size, color = 0x00e5ff) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const fontSize = size * 2;
        ctx.font = `bold ${fontSize}px monospace`;
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width + 20;
        const textHeight = fontSize * 1.5;

        canvas.width = Math.ceil(textWidth);
        canvas.height = Math.ceil(textHeight);

        // Re-set font after canvas resize
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const r = ((color >> 16) & 0xff);
        const g = ((color >> 8) & 0xff);
        const b = (color & 0xff);

        // Glow sutil
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
        ctx.shadowBlur = 3;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const aspect = canvas.width / canvas.height;
        const height = size * 1.5;
        const width = height * aspect;

        const geo = new THREE.PlaneGeometry(width, height);
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, 1);
        return mesh;
    }
}
