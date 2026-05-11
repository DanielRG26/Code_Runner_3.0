/**
 * RobotSprite - Sprite pixel art del perro robot C-R01
 * Basado en referencia: cabeza grande redondeada con visor oscuro,
 * orejas caídas azul-teal, cuerpo blanco, patas articuladas, antena, collar rojo
 */
import * as THREE from 'three';

/**
 * Dibuja el perro robot C-R01 en canvas 48x48 (vista lateral sentado para menú)
 * @param {string} state - 'BLUE' o 'RED'
 * @returns {HTMLCanvasElement}
 */
function drawDogRobot(state = 'BLUE') {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Paleta de colores basada en la referencia
    const white = '#f0f4f8';
    const lightBlue = '#a8d8ea';
    const midBlue = '#4a8faa';
    const darkBlue = '#2c5f7a';
    const visorBlack = '#1a2030';
    const eyeColor = state === 'RED' ? '#ff3030' : '#00e8c0';
    const collarColor = '#8b2020';
    const collarGlow = state === 'RED' ? '#ff3030' : '#00e5ff';
    const jointColor = '#c8dce8';
    const shadow = '#88a0b0';
    const darkShadow = '#5a7080';
    const thrusterOrange = '#ff8800';
    const thrusterYellow = '#ffcc00';

    // --- ANTENA ---
    ctx.fillStyle = darkBlue;
    ctx.fillRect(23, 0, 2, 3);
    // Bolita de la antena
    ctx.fillStyle = collarGlow;
    ctx.fillRect(22, 0, 4, 2);

    // --- CABEZA (grande, redondeada) ---
    // Parte superior blanca del casco
    ctx.fillStyle = white;
    ctx.fillRect(12, 5, 24, 8);
    ctx.fillRect(10, 7, 28, 6);
    ctx.fillRect(14, 3, 20, 4);
    // Borde oscuro superior del casco
    ctx.fillStyle = darkBlue;
    ctx.fillRect(14, 3, 20, 2);
    ctx.fillRect(12, 5, 2, 2);
    ctx.fillRect(34, 5, 2, 2);

    // --- VISOR OSCURO (banda negra ancha) ---
    ctx.fillStyle = visorBlack;
    ctx.fillRect(10, 11, 28, 7);
    ctx.fillRect(12, 10, 24, 1);
    // Borde inferior del visor
    ctx.fillStyle = darkBlue;
    ctx.fillRect(10, 18, 28, 1);

    // --- OJOS dentro del visor ---
    if (state === 'RED') {
        // Ojos cuadrados (serios)
        ctx.fillStyle = eyeColor;
        ctx.fillRect(16, 12, 4, 4);
        ctx.fillRect(27, 12, 4, 4);
        // Brillo
        ctx.fillStyle = '#ffaaaa';
        ctx.fillRect(16, 12, 1, 1);
        ctx.fillRect(27, 12, 1, 1);
    } else {
        // Ojos cuadrados con esquinas suaves (tiernos)
        ctx.fillStyle = eyeColor;
        ctx.fillRect(16, 12, 4, 4);
        ctx.fillRect(27, 12, 4, 4);
        // Brillo
        ctx.fillStyle = '#aaffee';
        ctx.fillRect(16, 12, 2, 1);
        ctx.fillRect(27, 12, 2, 1);
    }

    // --- PARTE INFERIOR DE LA CABEZA (hocico/boca) ---
    ctx.fillStyle = white;
    ctx.fillRect(12, 19, 24, 5);
    ctx.fillRect(14, 24, 20, 2);
    // Franja azul claro en el hocico
    ctx.fillStyle = lightBlue;
    ctx.fillRect(12, 21, 24, 3);
    // Puntos del speaker/nariz
    ctx.fillStyle = darkShadow;
    ctx.fillRect(15, 20, 1, 1);
    ctx.fillRect(17, 20, 1, 1);
    ctx.fillRect(16, 21, 1, 1);
    ctx.fillRect(15, 22, 1, 1);
    ctx.fillRect(17, 22, 1, 1);

    // --- OREJAS CAÍDAS (azul oscuro/teal) ---
    // Oreja izquierda
    ctx.fillStyle = darkBlue;
    ctx.fillRect(7, 9, 5, 4);
    ctx.fillRect(5, 13, 5, 8);
    ctx.fillRect(6, 21, 4, 3);
    // Interior oreja izquierda
    ctx.fillStyle = midBlue;
    ctx.fillRect(6, 14, 3, 6);

    // Oreja derecha
    ctx.fillStyle = darkBlue;
    ctx.fillRect(36, 9, 5, 4);
    ctx.fillRect(38, 13, 5, 8);
    ctx.fillRect(38, 21, 4, 3);
    // Interior oreja derecha
    ctx.fillStyle = midBlue;
    ctx.fillRect(39, 14, 3, 6);

    // --- COLLAR ---
    ctx.fillStyle = collarColor;
    ctx.fillRect(14, 25, 20, 2);
    // Luz del collar
    ctx.fillStyle = collarGlow;
    ctx.fillRect(22, 25, 4, 2);

    // --- CUERPO ---
    ctx.fillStyle = white;
    ctx.fillRect(14, 27, 20, 8);
    // Franja azul claro en el cuerpo
    ctx.fillStyle = lightBlue;
    ctx.fillRect(14, 32, 20, 3);
    // Panel del pecho
    ctx.fillStyle = shadow;
    ctx.fillRect(20, 28, 8, 4);
    ctx.fillStyle = collarGlow;
    ctx.fillRect(22, 29, 4, 2);

    // --- PATAS DELANTERAS (articuladas) ---
    // Pata izquierda
    ctx.fillStyle = white;
    ctx.fillRect(15, 35, 4, 6);
    // Junta circular
    ctx.fillStyle = jointColor;
    ctx.fillRect(15, 37, 4, 2);
    ctx.fillStyle = midBlue;
    ctx.fillRect(16, 37, 2, 2);
    // Pie
    ctx.fillStyle = white;
    ctx.fillRect(14, 41, 6, 3);
    ctx.fillStyle = shadow;
    ctx.fillRect(14, 43, 6, 1);

    // Pata derecha
    ctx.fillStyle = white;
    ctx.fillRect(29, 35, 4, 6);
    ctx.fillStyle = jointColor;
    ctx.fillRect(29, 37, 4, 2);
    ctx.fillStyle = midBlue;
    ctx.fillRect(30, 37, 2, 2);
    ctx.fillStyle = white;
    ctx.fillRect(28, 41, 6, 3);
    ctx.fillStyle = shadow;
    ctx.fillRect(28, 43, 6, 1);

    // --- PATAS TRASERAS (parcialmente visibles) ---
    ctx.fillStyle = shadow;
    ctx.fillRect(12, 33, 3, 5);
    ctx.fillRect(33, 33, 3, 5);
    ctx.fillStyle = white;
    ctx.fillRect(11, 38, 4, 3);
    ctx.fillRect(33, 38, 4, 3);

    // --- COLA con propulsor ---
    ctx.fillStyle = white;
    ctx.fillRect(34, 28, 4, 2);
    ctx.fillRect(37, 27, 3, 2);
    ctx.fillRect(39, 26, 3, 2);
    // Propulsor
    ctx.fillStyle = thrusterOrange;
    ctx.fillRect(41, 25, 3, 3);
    ctx.fillStyle = thrusterYellow;
    ctx.fillRect(42, 26, 2, 1);
    // Llama (sutil)
    ctx.fillStyle = '#ff440088';
    ctx.fillRect(44, 25, 2, 3);

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
