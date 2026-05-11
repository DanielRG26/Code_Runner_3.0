/**
 * Code Runner: Fragmentos de Consciencia
 * Punto de entrada principal
 */
import * as THREE from 'three';
import { GameStateManager, STATES } from './states/GameStateManager.js';
import { Renderer } from './core/Renderer.js';

class Game {
    constructor() {
        this.renderer = new Renderer();
        this.stateManager = new GameStateManager(this.renderer);
        this.clock = new THREE.Clock();
        this.init();
    }

    init() {
        this.stateManager.changeState(STATES.MAIN_MENU);
        this.setupResize();
        this.loop();
    }

    setupResize() {
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });
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
