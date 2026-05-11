/**
 * RobotSprite - Sprite pixel art del robot C-R01 para menús
 */
import * as THREE from 'three';

/**
 * Crea un sprite del robot C-R01 usando canvas pixel art
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} size - Tamaño del sprite
 * @returns {THREE.Mesh}
 */
export function createRobotSprite(x, y, size) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Pixel art del robot C-R01
    ctx.imageSmoothingEnabled = false;

    // Cuerpo principal (gris oscuro)
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(8, 10, 16, 14);

    // Cabeza
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(10, 4, 12, 8);

    // Visor/Ojos (cian brillante)
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(12, 6, 3, 3);
    ctx.fillRect(17, 6, 3, 3);

    // Antena
    ctx.fillStyle = '#5a5a6a';
    ctx.fillRect(15, 1, 2, 4);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(15, 0, 2, 2);

    // Núcleo central (brilla)
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(14, 14, 4, 4);

    // Piernas
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(10, 24, 4, 6);
    ctx.fillRect(18, 24, 4, 6);

    // Brazos
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(5, 12, 3, 8);
    ctx.fillRect(24, 12, 3, 8);

    // Detalles de circuito
    ctx.fillStyle = '#00e5ff44';
    ctx.fillRect(9, 18, 1, 4);
    ctx.fillRect(22, 18, 1, 4);

    // Pies
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(9, 29, 6, 2);
    ctx.fillRect(17, 29, 6, 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 2);
    return mesh;
}
