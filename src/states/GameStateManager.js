/**
 * GameStateManager - State Pattern para gestión de pantallas
 */
import { MainMenuState } from './MainMenuState.js';
import { LevelSelectState } from './LevelSelectState.js';
import { GameplayState } from './GameplayState.js';
import { Transition } from '../core/Transition.js';

export const STATES = {
    MAIN_MENU: 'MAIN_MENU',
    LEVEL_SELECT: 'LEVEL_SELECT',
    GAMEPLAY: 'GAMEPLAY'
};

export class GameStateManager {
    constructor(renderer, audio) {
        this.renderer = renderer;
        this.audio = audio;
        this.currentState = null;
        this.transitioning = false;
    }

    changeState(stateName, params = {}) {
        if (this.transitioning) return;

        const doChange = () => {
            if (this.currentState) {
                this.currentState.exit();
            }
            this.renderer.clearScene();

            switch (stateName) {
                case STATES.MAIN_MENU:
                    this.currentState = new MainMenuState(this, this.renderer, this.audio);
                    break;
                case STATES.LEVEL_SELECT:
                    this.currentState = new LevelSelectState(this, this.renderer, this.audio);
                    break;
                case STATES.GAMEPLAY:
                    this.currentState = new GameplayState(this, this.renderer, this.audio, params);
                    break;
            }

            if (this.currentState) {
                this.currentState.enter();
            }
            this.transitioning = false;
        };

        // Primera carga: sin transición. Después: con glitch
        if (!this.currentState) {
            doChange();
        } else {
            this.transitioning = true;
            Transition.play(doChange);
        }
    }

    update(delta) {
        if (this.currentState && !this.transitioning) {
            this.currentState.update(delta);
        }
    }
}
