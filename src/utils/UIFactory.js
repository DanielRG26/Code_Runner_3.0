/**
 * UIFactory - Botones con estética neón cyberpunk
 */
import * as THREE from 'three';
import { PixelText } from './PixelText.js';

/**
 * Crea un botón con borde neón cian
 */
export function createNeonButton(text, x, y, width, height) {
    const group = new THREE.Group();
    group.position.set(x, y, 0);

    // Fondo oscuro
    const bgGeo = new THREE.PlaneGeometry(width, height);
    const bgMat = new THREE.MeshBasicMaterial({
        color: 0x0a1520,
        transparent: true,
        opacity: 0.88
    });
    group.add(new THREE.Mesh(bgGeo, bgMat));

    // Borde neón (4 lados)
    const borderColor = 0x00e5ff;
    const t = 2; // grosor

    const createBorderSide = (w, h, px, py) => {
        const geo = new THREE.PlaneGeometry(w, h);
        const mat = new THREE.MeshBasicMaterial({
            color: borderColor,
            transparent: true,
            opacity: 0.6
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(px, py, 0.1);
        mesh.userData.isBorder = true;
        return mesh;
    };

    group.add(createBorderSide(width, t, 0, height / 2));   // Top
    group.add(createBorderSide(width, t, 0, -height / 2));  // Bottom
    group.add(createBorderSide(t, height, -width / 2, 0));  // Left
    group.add(createBorderSide(t, height, width / 2, 0));   // Right

    // Glow exterior sutil
    const glowGeo = new THREE.PlaneGeometry(width + 10, height + 10);
    const glowMat = new THREE.MeshBasicMaterial({
        color: borderColor,
        transparent: true,
        opacity: 0.06
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -0.1;
    group.add(glow);

    // Texto
    const textMesh = PixelText.create(text, 0, 0, 12, 0x00e5ff);
    textMesh.position.z = 0.2;
    group.add(textMesh);

    return group;
}
