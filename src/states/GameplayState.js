/**
 * GameplayState - Lógica principal del Nivel 1
 * Mecánica: Ingreso de comandos secuenciales + sistema de dualidad
 * Sonido integrado para pasos, colisiones, fragmentos
 */
import * as THREE from 'three';
import { STATES } from './GameStateManager.js';
import { Level1 } from '../levels/Level1.js';
import { Player } from '../entities/Player.js';
import { CommandSystem } from '../systems/CommandSystem.js';

export class GameplayState {
    constructor(stateManager, renderer, audio, params) {
        this.stateManager = stateManager;
        this.renderer = renderer;
        this.audio = audio;
        this.levelIndex = params.level || 1;
        this.time = 0;
        this.gameTime = 0;
        this.fragmentsCollected = 0;
        this.totalFragments = 3;
        this.isExecuting = false;
        this.gameOver = false;
        this.levelComplete = false;
        this.player = null;
        this.level = null;
        this.commandSystem = null;

        // DOM refs
        this.commandPanel = document.getElementById('command-panel');
        this.commandInput = document.getElementById('command-input');
        this.commandQueue = document.getElementById('command-queue');
        this.hud = document.getElementById('hud');
        this.hudFragments = document.getElementById('hud-fragments');
        this.hudTime = document.getElementById('hud-time');
        this.stateIndicator = document.getElementById('state-indicator');
        this.levelCompleteUI = document.getElementById('level-complete');
        this.starsDisplay = document.getElementById('stars-display');
        this.completeInfo = document.getElementById('complete-info');
        this.btnRetry = document.getElementById('btn-retry');
        this.btnMenu = document.getElementById('btn-menu');

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onRetry = this.onRetry.bind(this);
        this.onMenu = this.onMenu.bind(this);
    }

    enter() {
        const scene = this.renderer.scene;
        scene.background = new THREE.Color(0x040406);

        // Música ambiental
        this.audio.startMusic();

        // Crear nivel
        this.level = new Level1(scene);
        this.level.build();

        // Crear jugador
        this.player = new Player(scene, this.level.spawnPoint.x, this.level.spawnPoint.y);

        // Sistema de comandos
        this.commandSystem = new CommandSystem(this.player, this.level, this.audio);

        // Mostrar UI
        this.commandPanel.style.display = 'block';
        this.hud.style.display = 'block';
        this.stateIndicator.style.display = 'block';
        this.updateStateIndicator();

        // Centrar cámara
        this.renderer.camera.position.x = this.level.cameraCenter.x;
        this.renderer.camera.position.y = this.level.cameraCenter.y;

        // Eventos
        window.addEventListener('keydown', this.onKeyDown);
        this.btnRetry.addEventListener('click', this.onRetry);
        this.btnMenu.addEventListener('click', this.onMenu);

        // Focus input
        this.commandInput.value = '';
        this.commandInput.focus();
    }

    onKeyDown(e) {
        if (this.levelComplete || this.gameOver) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            this.executeCommands();
        } else if ((e.key === 'x' || e.key === 'X') && document.activeElement !== this.commandInput) {
            this.player.toggleState();
            this.audio.playStateChange();
            this.updateStateIndicator();
        }
    }

    executeCommands() {
        const input = this.commandInput.value.trim().toLowerCase();
        if (!input || this.isExecuting) return;

        const commands = input.split(/[\s,;]+/).map(cmd => {
            switch (cmd) {
                case 'arriba': case 'up': case 'w': return 'UP';
                case 'abajo': case 'down': case 's': return 'DOWN';
                case 'izquierda': case 'left': case 'a': return 'LEFT';
                case 'derecha': case 'right': case 'd': return 'RIGHT';
                case 'salto': case 'jump': case 'espacio': return 'JUMP';
                case 'x': case 'cambiar': return 'TOGGLE';
                default: return null;
            }
        }).filter(Boolean);

        if (commands.length === 0) return;

        this.commandQueue.textContent = `Ejecutando: [${commands.join(', ')}]`;
        this.commandInput.value = '';
        this.isExecuting = true;

        // Animación PROGRAMMED mientras se ejecuta
        this.player.setAnimation('PROGRAMMED');

        this.commandSystem.execute(commands, () => {
            this.isExecuting = false;
            this.commandQueue.textContent = 'Cola: [vacía] - Listo para nuevos comandos';
            this.commandInput.focus();
            this.checkGameState();
        }, () => {
            return this.checkStepCollisions();
        });
    }

    updateStateIndicator() {
        if (this.player.state === 'RED') {
            this.stateIndicator.className = 'red';
            this.stateIndicator.textContent = 'ESTADO: LÓGICA ■';
        } else {
            this.stateIndicator.className = 'blue';
            this.stateIndicator.textContent = 'ESTADO: EMOCIÓN ●';
        }
        this.stateIndicator.style.display = 'block';
    }

    checkGameState() {
        const collected = this.level.checkFragmentCollection(this.player);
        if (collected > 0) {
            this.fragmentsCollected += collected;
            this.audio.playCollectFragment();
        }
        this.hudFragments.textContent = `FRAGMENTOS: ${this.fragmentsCollected}/${this.totalFragments}`;

        if (this.level.checkLaserCollision(this.player)) {
            if (this.player.state !== 'RED') {
                this.handleDeath();
                return;
            }
        }

        if (this.level.checkGoalReached(this.player)) {
            if (this.fragmentsCollected >= this.totalFragments) {
                this.handleLevelComplete();
            }
        }

        if (this.player.position.y < this.level.deathY) {
            this.handleDeath();
        }
    }

    checkStepCollisions() {
        const collected = this.level.checkFragmentCollection(this.player);
        if (collected > 0) {
            this.fragmentsCollected += collected;
            this.audio.playCollectFragment();
        }
        this.hudFragments.textContent = `FRAGMENTOS: ${this.fragmentsCollected}/${this.totalFragments}`;

        if (this.level.checkLaserCollision(this.player)) {
            if (this.player.state !== 'RED') {
                this.handleDeath();
                return true;
            }
        }

        if (this.player.position.y < this.level.deathY) {
            this.handleDeath();
            return true;
        }

        if (this.level.checkGoalReached(this.player) && this.fragmentsCollected >= this.totalFragments) {
            this.handleLevelComplete();
            return true;
        }

        return false;
    }

    handleDeath() {
        this.gameOver = true;
        this.commandPanel.style.display = 'none';
        this.audio.playError();
        this.player.playDeathAnimation();

        setTimeout(() => {
            this.resetLevel();
        }, 1200);
    }

    resetLevel() {
        this.gameOver = false;
        this.isExecuting = false;
        this.fragmentsCollected = 0;
        this.gameTime = 0;

        this.player.reset(this.level.spawnPoint.x, this.level.spawnPoint.y);
        this.level.reset();

        this.hudFragments.textContent = `FRAGMENTOS: 0/${this.totalFragments}`;
        this.hudTime.textContent = 'TIEMPO: 0s';
        this.commandPanel.style.display = 'block';
        this.commandInput.value = '';
        this.commandInput.focus();
        this.commandQueue.textContent = 'Cola: [vacía] - C-R01 reiniciado';
        this.updateStateIndicator();
    }

    handleLevelComplete() {
        this.levelComplete = true;
        this.commandPanel.style.display = 'none';
        this.audio.playLevelComplete();

        const stars = this.calculateStars();
        this.starsDisplay.textContent = '★ '.repeat(stars) + '☆ '.repeat(3 - stars);
        this.completeInfo.textContent = `Tiempo: ${Math.floor(this.gameTime)}s | Fragmentos: ${this.fragmentsCollected}/${this.totalFragments}`;
        this.levelCompleteUI.style.display = 'block';
    }

    calculateStars() {
        let stars = 1;
        if (this.fragmentsCollected >= this.totalFragments) stars++;
        if (this.gameTime < 30) stars++;
        return stars;
    }

    onRetry() {
        this.audio.playClick();
        this.levelCompleteUI.style.display = 'none';
        this.levelComplete = false;
        this.resetLevel();
    }

    onMenu() {
        this.audio.playClick();
        this.levelCompleteUI.style.display = 'none';
        this.stateManager.changeState(STATES.MAIN_MENU);
    }

    update(delta) {
        this.time += delta;
        if (!this.gameOver && !this.levelComplete) {
            this.gameTime += delta;
            this.hudTime.textContent = `TIEMPO: ${Math.floor(this.gameTime)}s`;
        }

        if (this.commandSystem) {
            this.commandSystem.update(delta);
        }
        if (this.player) {
            this.player.update(delta);
        }
        if (this.level) {
            this.level.update(delta);
        }
    }

    exit() {
        window.removeEventListener('keydown', this.onKeyDown);
        this.btnRetry.removeEventListener('click', this.onRetry);
        this.btnMenu.removeEventListener('click', this.onMenu);

        this.commandPanel.style.display = 'none';
        this.hud.style.display = 'none';
        this.stateIndicator.style.display = 'none';
        this.levelCompleteUI.style.display = 'none';
        this.audio.stopMusic();
    }
}
