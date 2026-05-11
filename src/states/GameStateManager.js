/**
 * GameStateManager - State Pattern para gestión de pantallas
 */
import { MainMenuState } from './MainMenuState.js';
import { LevelSelectState } from './LevelSelectState.js';
import { GameplayState } from './GameplayState.js';

export const STATES = {
    MAIN_MENU: 'MAIN_MENU',
    LEVEL_SELECT: 'LEVEL_SELECT',
    GAMEPLAY: 'GAMEPLAY'
};

export class GameStateManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.currentState = null;
        this.states = {};
    }

    changeState(stateName, params = {}) {
        if (this.currentState) {
            this.currentState.exit();
        }

        this.renderer.clearScene();

        switch (stateName) {
            case STATES.MAIN_MENU:
                this.currentState = new MainMenuState(this, this.renderer);
                break;
            case STATES.LEVEL_SELECT:
                this.currentState = new LevelSelectState(this, this.renderer);
                break;
            case STATES.GAMEPLAY:
                this.currentState = new GameplayState(this, this.renderer, params);
                break;
        }

        if (this.currentState) {
            this.currentState.enter();
        }
    }

    update(delta) {
        if (this.currentState) {
            this.currentState.update(delta);
        }
    }
}
