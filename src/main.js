/**
 * Code Runner: Fragmentos de Consciencia
 * Punto de entrada principal - Motor del juego
 */
import * as THREE from 'three';
import { GameStateManager, STATES } from './states/GameStateManager.js';
import { Renderer } from './core/Renderer.js';
import { AudioManager } from './core/AudioManager.js';

class Game {
    constructor() {
        this.renderer = new Renderer();
        this.audio = new AudioManager();
        this.stateManager = new GameStateManager(this.renderer, this.audio);
        this.clock = new THREE.Clock();
        this.init();
    }

    init() {
        this.stateManager.changeState(STATES.MAIN_MENU);
        this.setupResize();
        this.setupAudioUnlock();
        this.loop();
    }

    setupResize() {
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });
    }

    setupAudioUnlock() {
        // Desbloquear AudioContext con la primera interacción del usuario
        const unlock = () => {
            this.audio.unlock();
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        const delta = this.clock.getDelta();
        this.stateManager.update(delta);
        this.renderer.render();
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
