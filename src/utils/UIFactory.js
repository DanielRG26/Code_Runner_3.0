/**
 * UIFactory - Botones con bordes redondeados y estética neón cyberpunk
 */
import * as THREE from 'three';
import { PixelText } from './PixelText.js';

/**
 * Crea un botón con bordes redondeados y glow neón
 */
export function createNeonButton(text, x, y, width, height) {
    const group = new THREE.Group();
    group.position.set(x, y, 0);

    // Crear canvas con bordes redondeados
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    const radius = 12 * scale;
    const w = canvas.width;
    const h = canvas.height;

    // Fondo oscuro con bordes redondeados
    ctx.beginPath();
    ctx.roundRect(2, 2, w - 4, h - 4, radius);
    ctx.fillStyle = 'rgba(8, 18, 30, 0.9)';
    ctx.fill();

    // Borde neón
    ctx.beginPath();
    ctx.roundRect(2, 2, w - 4, h - 4, radius);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glow exterior
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, radius + 2);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.lineWidth = 6;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;

    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
    });
    const bg = new THREE.Mesh(geo, mat);
    bg.userData.isBorder = true;
    bg.userData.canvas = canvas;
    bg.userData.texture = texture;
    group.add(bg);

    // Texto
    const textMesh = PixelText.create(text, 0, 0, 13, 0x00e5ff);
    textMesh.position.z = 0.2;
    group.add(textMesh);

    return group;
}

/**
 * Redibuja el botón con opacidad diferente (para hover)
 */
function redrawButton(mesh, opacity) {
    if (!mesh.userData.canvas) return;
    const canvas = mesh.userData.canvas;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const radius = 12 * 2;

    ctx.clearRect(0, 0, w, h);

    // Fondo
    ctx.beginPath();
    ctx.roundRect(2, 2, w - 4, h - 4, radius);
    ctx.fillStyle = opacity > 0.7 ? 'rgba(0, 229, 255, 0.08)' : 'rgba(8, 18, 30, 0.9)';
    ctx.fill();

    // Borde
    ctx.beginPath();
    ctx.roundRect(2, 2, w - 4, h - 4, radius);
    ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glow
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, radius + 2);
    ctx.strokeStyle = `rgba(0, 229, 255, ${opacity * 0.3})`;
    ctx.lineWidth = 6;
    ctx.stroke();

    mesh.userData.texture.needsUpdate = true;
}

export { redrawButton };
