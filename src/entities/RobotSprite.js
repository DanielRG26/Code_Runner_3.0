/**
 * RobotSprite - Sprite pixel art del perro robot C-R01 para menús
 * Perro robot blanco con orejas azules, visor cian, cola animada
 */
import * as THREE from 'three';

/**
 * Dibuja el perro robot C-R01 en un canvas 32x32
 * @param {string} state - 'BLUE' o 'RED'
 * @returns {HTMLCanvasElement}
 */
function drawDogRobot(state = 'BLUE') {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const bodyColor = '#e8e8f0';    // Blanco robótico
    const darkBody = '#c0c0cc';     // Sombra del cuerpo
    const earColor = '#4488cc';     // Orejas azules
    const visorColor = state === 'RED' ? '#ff3030' : '#00e5ff';
    const collarColor = state === 'RED' ? '#ff3030' : '#00e5ff';

    // Cuerpo principal (torso)
    ctx.fillStyle = bodyColor;
    ctx.fillRect(8, 14, 16, 10);

    // Sombra inferior del cuerpo
    ctx.fillStyle = darkBody;
    ctx.fillRect(8, 22, 16, 2);

    // Cabeza
    ctx.fillStyle = bodyColor;
    ctx.fillRect(10, 4, 14, 11);

    // Hocico
    ctx.fillStyle = darkBody;
    ctx.fillRect(18, 10, 6, 5);
    // Nariz
    ctx.fillStyle = '#333';
    ctx.fillRect(22, 11, 2, 2);

    // Orejas azules
    ctx.fillStyle = earColor;
    ctx.fillRect(10, 1, 4, 6);
    ctx.fillRect(17, 1, 4, 6);

    // Visor/Ojos según estado
    if (state === 'RED') {
        // Ojos cuadrados (serios - lógica)
        ctx.fillStyle = visorColor;
        ctx.fillRect(12, 7, 3, 3);
        ctx.fillRect(17, 7, 3, 3);
    } else {
        // Ojos redondos (tiernos - emoción)
        ctx.fillStyle = visorColor;
        ctx.beginPath();
        ctx.arc(13.5, 8.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(18.5, 8.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Collar con luz
    ctx.fillStyle = '#333';
    ctx.fillRect(9, 14, 14, 2);
    ctx.fillStyle = collarColor;
    ctx.fillRect(14, 14, 4, 2);

    // Patas delanteras
    ctx.fillStyle = bodyColor;
    ctx.fillRect(9, 24, 4, 6);
    ctx.fillRect(19, 24, 4, 6);
    // Pies
    ctx.fillStyle = darkBody;
    ctx.fillRect(8, 29, 5, 2);
    ctx.fillRect(18, 29, 5, 2);

    // Patas traseras (parcialmente visibles)
    ctx.fillStyle = darkBody;
    ctx.fillRect(6, 20, 3, 6);
    ctx.fillRect(23, 20, 3, 6);

    // Cola (arriba a la izquierda)
    ctx.fillStyle = bodyColor;
    ctx.fillRect(5, 12, 3, 2);
    ctx.fillRect(4, 10, 2, 3);
    // Punta de cola con color de estado
    ctx.fillStyle = collarColor;
    ctx.fillRect(3, 9, 2, 2);

    // Antena en la cabeza
    ctx.fillStyle = '#888';
    ctx.fillRect(14, 0, 1, 3);
    ctx.fillStyle = collarColor;
    ctx.fillRect(13, 0, 3, 1);

    return canvas;
}

/**
 * Crea un sprite del perro robot C-R01 para menús
 */
export function createRobotSprite(x, y, size, state = 'BLUE') {
    const canvas = drawDogRobot(state);
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
    mesh.userData.canvas = canvas;
    mesh.userData.state = state;
    return mesh;
}

export { drawDogRobot };
