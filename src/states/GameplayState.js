/**
 * GameplayState - Lógica principal del Nivel 1
 * Mecánica: Ingreso de comandos secuenciales + sistema de dualidad
 */
import * as THREE from 'three';
import { STATES } from './GameStateManager.js';
import { Level1 } from '../levels/Level1.js';
import { Player } from '../entities/Player.js';
import { CommandSystem } from '../systems/CommandSystem.js';

export class GameplayState {
    constructor(stateManager, renderer, params) {
        this.stateManager = stateManager;
        this.renderer = renderer;
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
        scene.background = new THREE.Color(0x050508);

        // Crear nivel
        this.level = new Level1(scene);
        this.level.build();

        // Crear jugador
        this.player = new Player(scene, this.level.spawnPoint.x, this.level.spawnPoint.y);

        // Sistema de comandos
        this.commandSystem = new CommandSystem(this.player, this.level);

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
            // Toggle estado solo si no estamos escribiendo en el input
            this.player.toggleState();
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

        this.commandSystem.execute(commands, () => {
            this.isExecuting = false;
            this.commandQueue.textContent = 'Cola: [vacía] - Listo para nuevos comandos';
            this.commandInput.focus();
            this.checkGameState();
        }, () => {
            // Callback por cada paso - verificar colisiones intermedias
            return this.checkStepCollisions();
        });
    }

    updateStateIndicator() {
        if (this.player.state === 'RED') {
            this.stateIndicator.className = 'red';
            this.stateIndicator.textContent = 'ESTADO: LÓGICA [ROJO]';
        } else {
            this.stateIndicator.className = 'blue';
            this.stateIndicator.textContent = 'ESTADO: EMOCIÓN [AZUL]';
        }
        this.stateIndicator.style.display = 'block';
    }

    checkGameState() {
        // Verificar colisión con fragmentos
        const collected = this.level.checkFragmentCollection(this.player);
        this.fragmentsCollected += collected;
        this.hudFragments.textContent = `FRAGMENTOS: ${this.fragmentsCollected}/${this.totalFragments}`;

        // Verificar colisión con láseres
        if (this.level.checkLaserCollision(this.player)) {
            if (this.player.state !== 'RED') {
                this.handleDeath();
                return;
            }
        }

        // Verificar si llegó al final
        if (this.level.checkGoalReached(this.player)) {
            if (this.fragmentsCollected >= this.totalFragments) {
                this.handleLevelComplete();
            }
        }

        // Verificar caída
        if (this.player.position.y < this.level.deathY) {
            this.handleDeath();
        }
    }

    /**
     * Verificación de colisiones después de cada paso individual
     * @returns {boolean} true si debe abortar la secuencia
     */
    checkStepCollisions() {
        // Recoger fragmentos en cada paso
        const collected = this.level.checkFragmentCollection(this.player);
        this.fragmentsCollected += collected;
        this.hudFragments.textContent = `FRAGMENTOS: ${this.fragmentsCollected}/${this.totalFragments}`;

        // Verificar láser
        if (this.level.checkLaserCollision(this.player)) {
            if (this.player.state !== 'RED') {
                this.handleDeath();
                return true; // Abortar
            }
        }

        // Verificar caída
        if (this.player.position.y < this.level.deathY) {
            this.handleDeath();
            return true;
        }

        // Verificar meta
        if (this.level.checkGoalReached(this.player) && this.fragmentsCollected >= this.totalFragments) {
            this.handleLevelComplete();
            return true;
        }

        return false;
    }

    handleDeath() {
        this.gameOver = true;
        this.commandPanel.style.display = 'none';

        // Flash rojo
        this.player.playDeathAnimation();

        setTimeout(() => {
            this.resetLevel();
        }, 1000);
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
        this.commandQueue.textContent = 'Cola: [vacía] - Robot reiniciado';
    }

    handleLevelComplete() {
        this.levelComplete = true;
        this.commandPanel.style.display = 'none';

        // Calcular estrellas
        const stars = this.calculateStars();
        this.starsDisplay.textContent = '★ '.repeat(stars) + '☆ '.repeat(3 - stars);
        this.completeInfo.textContent = `Tiempo: ${Math.floor(this.gameTime)}s | Fragmentos: ${this.fragmentsCollected}/${this.totalFragments}`;
        this.levelCompleteUI.style.display = 'block';
    }

    calculateStars() {
        let stars = 1; // Completar = 1 estrella
        if (this.fragmentsCollected >= this.totalFragments) stars++;
        if (this.gameTime < 30) stars++; // Menos de 30s = 3 estrellas
        return stars;
    }

    onRetry() {
        this.levelCompleteUI.style.display = 'none';
        this.levelComplete = false;
        this.resetLevel();
    }

    onMenu() {
        this.levelCompleteUI.style.display = 'none';
        this.stateManager.changeState(STATES.MAIN_MENU);
    }

    update(delta) {
        this.time += delta;
        if (!this.gameOver && !this.levelComplete) {
            this.gameTime += delta;
            this.hudTime.textContent = `TIEMPO: ${Math.floor(this.gameTime)}s`;
        }

        // Actualizar sistemas
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

        // Ocultar UI
        this.commandPanel.style.display = 'none';
        this.hud.style.display = 'none';
        this.stateIndicator.style.display = 'none';
        this.levelCompleteUI.style.display = 'none';
    }
}
