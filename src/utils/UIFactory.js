/**
 * UIFactory - Botones con bordes redondeados y estética neón cyberpunk
 */
import * as THREE from 'three';
import { PixelText } from './PixelText.js';

/**
 * Dibuja un rectángulo redondeado (compatible con todos los navegadores)
 */
function drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * Crea un botón con bordes redondeados y glow neón
 */
export function createNeonButton(text, x, y, width, height) {
    const group = new THREE.Group();
    group.position.set(x, y, 0);

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    const radius = 14 * scale;
    const w = canvas.width;
    const h = canvas.height;

    // Fondo oscuro redondeado
    drawRoundRect(ctx, 3, 3, w - 6, h - 6, radius);
    ctx.fillStyle = 'rgba(8, 18, 30, 0.9)';
    ctx.fill();

    // Borde neón
    drawRoundRect(ctx, 3, 3, w - 6, h - 6, radius);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glow exterior
    drawRoundRect(ctx, 0, 0, w, h, radius + 4);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
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
    bg.userData.width = w;
    bg.userData.height = h;
    bg.userData.radius = radius;
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
export function redrawButton(mesh, opacity) {
    if (!mesh.userData.canvas) return;
    const canvas = mesh.userData.canvas;
    const ctx = canvas.getContext('2d');
    const w = mesh.userData.width;
    const h = mesh.userData.height;
    const radius = mesh.userData.radius;

    ctx.clearRect(0, 0, w, h);

    // Fondo
    drawRoundRect(ctx, 3, 3, w - 6, h - 6, radius);
    ctx.fillStyle = opacity > 0.7 ? 'rgba(0, 229, 255, 0.06)' : 'rgba(8, 18, 30, 0.9)';
    ctx.fill();

    // Borde
    drawRoundRect(ctx, 3, 3, w - 6, h - 6, radius);
    ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glow
    drawRoundRect(ctx, 0, 0, w, h, radius + 4);
    ctx.strokeStyle = `rgba(0, 229, 255, ${opacity * 0.25})`;
    ctx.lineWidth = 6;
    ctx.stroke();

    mesh.userData.texture.needsUpdate = true;
}
