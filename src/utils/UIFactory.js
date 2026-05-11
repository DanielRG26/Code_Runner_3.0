/**
 * UIFactory - Creación de elementos UI con estética neón cyberpunk
 */
import * as THREE from 'three';
import { PixelText } from './PixelText.js';

/**
 * Crea un botón con borde neón cian
 * @param {string} text - Texto del botón
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} width - Ancho
 * @param {number} height - Alto
 * @returns {THREE.Group}
 */
export function createNeonButton(text, x, y, width, height) {
    const group = new THREE.Group();
    group.position.set(x, y, 0);

    // Fondo oscuro del botón
    const bgGeo = new THREE.PlaneGeometry(width, height);
    const bgMat = new THREE.MeshBasicMaterial({
        color: 0x0a1520,
        transparent: true,
        opacity: 0.85
    });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.position.z = 0;
    group.add(bg);

    // Borde neón (4 líneas)
    const borderColor = 0x00e5ff;
    const borderThickness = 2;

    const borderMat = new THREE.MeshBasicMaterial({
        color: borderColor,
        transparent: true,
        opacity: 0.7
    });

    // Top
    const topGeo = new THREE.PlaneGeometry(width, borderThickness);
    const top = new THREE.Mesh(topGeo, borderMat.clone());
    top.position.set(0, height / 2, 0.1);
    top.userData.isBorder = true;
    group.add(top);

    // Bottom
    const bottomGeo = new THREE.PlaneGeometry(width, borderThickness);
    const bottom = new THREE.Mesh(bottomGeo, borderMat.clone());
    bottom.position.set(0, -height / 2, 0.1);
    bottom.userData.isBorder = true;
    group.add(bottom);

    // Left
    const leftGeo = new THREE.PlaneGeometry(borderThickness, height);
    const left = new THREE.Mesh(leftGeo, borderMat.clone());
    left.position.set(-width / 2, 0, 0.1);
    left.userData.isBorder = true;
    group.add(left);

    // Right
    const rightGeo = new THREE.PlaneGeometry(borderThickness, height);
    const right = new THREE.Mesh(rightGeo, borderMat.clone());
    right.position.set(width / 2, 0, 0.1);
    right.userData.isBorder = true;
    group.add(right);

    // Glow exterior
    const glowGeo = new THREE.PlaneGeometry(width + 8, height + 8);
    const glowMat = new THREE.MeshBasicMaterial({
        color: borderColor,
        transparent: true,
        opacity: 0.08
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -0.1;
    group.add(glow);

    // Texto
    const textMesh = PixelText.create(text, 0, 0, 13, 0x00e5ff);
    textMesh.position.z = 0.2;
    group.add(textMesh);

    return group;
}
