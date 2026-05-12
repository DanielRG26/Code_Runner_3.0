/**
 * GameplayState - Gameplay con controles en tiempo real (WASD)
 * W = saltar, A = izquierda, D = derecha, S = agacharse, X = cambiar estado
 * Nivel de introducción muestra panel de controles al inicio
 */
import * as THREE from 'three';
import { STATES } from './GameStateManager.js';
import { Level1 } from '../levels/Level1.js';
import { Player } from '../entities/Player.js';
import { ProgressManager } from '../core/ProgressManager.js';

export class GameplayState {
    constructor(stateManager, renderer, audio, params) {
        this.stateManager = stateManager;
        this.renderer = renderer;
        this.audio = audio;
        this.levelIndex = params.level || 0;
        this.time = 0;
        this.gameTime = 0;
        this.fragmentsCollected = 0;
        this.totalFragments = 3;
        this.gameOver = false;
        this.levelComplete = false;
        this.showingTutorial = true;
        this.player = null;
        this.level = null;

        // Input state
        this.keys = {};
        this.gravity = -600;
        this.playerVelY = 0;
        this.isGrounded = false;
        this.moveSpeed = 160;
        this.jumpForce = 320;

        // DOM refs
        this.controlsPanel = document.getElementById('controls-panel');
        this.hud = document.getElementById('hud');
        this.hudButtons = document.getElementById('hud-buttons');
        this.hudFragments = document.getElementById('hud-fragments');
        this.hudTime = document.getElementById('hud-time');
        this.stateIndicator = document.getElementById('state-indicator');
        this.levelCompleteUI = document.getElementById('level-complete');
        this.starsDisplay = document.getElementById('stars-display');
        this.completeInfo = document.getElementById('complete-info');
        this.btnRetry = document.getElementById('btn-retry');
        this.btnMenu = document.getElementById('btn-menu');
        this.gameOverUI = document.getElementById('game-over');
        this.btnGoRetry = document.getElementById('btn-go-retry');
        this.btnGoMenu = document.getElementById('btn-go-menu');
        this.btnPause = document.getElementById('btn-pause');
        this.btnBackMenu = document.getElementById('btn-back-menu');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.btnResume = document.getElementById('btn-resume');
        this.btnPauseRetry = document.getElementById('btn-pause-retry');
        this.btnPauseMenu = document.getElementById('btn-pause-menu');

        this.isPaused = false;
        this.gameMessage = document.getElementById('game-message');
        this.gameMessageHeader = this.gameMessage.querySelector('.msg-header');
        this.gameMessageBody = this.gameMessage.querySelector('.msg-body');
        this.messageTimer = 0;
        this.messageVisible = false;

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onRetry = this.onRetry.bind(this);
        this.onMenu = this.onMenu.bind(this);
        this.onGoRetry = this.onGoRetry.bind(this);
        this.onGoMenu = this.onGoMenu.bind(this);
        this.onPause = this.onPause.bind(this);
        this.onResume = this.onResume.bind(this);
        this.onPauseRetry = this.onPauseRetry.bind(this);
        this.onPauseMenu = this.onPauseMenu.bind(this);
        this.onBackMenu = this.onBackMenu.bind(this);
    }

    enter() {
        const scene = this.renderer.scene;
        scene.background = new THREE.Color(0x040406);

        // Música
        this.audio.startMusic();

        // Crear nivel
        this.level = new Level1(scene);
        this.level.build();

        // Crear jugador
        this.player = new Player(scene, this.level.spawnPoint.x, this.level.spawnPoint.y);

        // Mostrar tutorial si es nivel de introducción
        if (this.levelIndex === 0) {
            this.showingTutorial = true;
            this.controlsPanel.style.display = 'block';
        } else {
            this.showingTutorial = false;
            this.controlsPanel.style.display = 'none';
        }

        // HUD
        this.hud.style.display = 'block';
        this.hudButtons.style.display = 'flex';
        this.stateIndicator.style.display = 'block';
        this.updateStateIndicator();

        // Cámara
        this.renderer.camera.position.x = this.level.cameraCenter.x;
        this.renderer.camera.position.y = this.level.cameraCenter.y;

        // Eventos
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        this.btnRetry.addEventListener('click', this.onRetry);
        this.btnMenu.addEventListener('click', this.onMenu);
        this.btnGoRetry.addEventListener('click', this.onGoRetry);
        this.btnGoMenu.addEventListener('click', this.onGoMenu);
        this.btnPause.addEventListener('click', this.onPause);
        this.btnBackMenu.addEventListener('click', this.onBackMenu);
        this.btnResume.addEventListener('click', this.onResume);
        this.btnPauseRetry.addEventListener('click', this.onPauseRetry);
        this.btnPauseMenu.addEventListener('click', this.onPauseMenu);
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = true;

        // Cerrar tutorial con cualquier tecla
        if (this.showingTutorial) {
            this.showingTutorial = false;
            this.controlsPanel.style.display = 'none';
            return;
        }

        // Pausar/despausar con Escape
        if (key === 'escape') {
            if (this.isPaused) {
                this.onResume();
            } else if (!this.gameOver && !this.levelComplete) {
                this.onPause();
            }
            return;
        }

        if (this.levelComplete || this.gameOver || this.isPaused) return;

        // Cambiar estado con X
        if (key === 'x') {
            this.player.toggleState();
            this.audio.playStateChange();
            this.updateStateIndicator();
        }

        // Salto con W (solo si está en el suelo)
        if ((key === 'w' || key === ' ') && this.isGrounded) {
            this.playerVelY = this.jumpForce;
            this.isGrounded = false;
            this.player.setAnimation('JUMP');
            this.audio.playJump();
        }
    }

    onKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;
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

    handlePhysics(delta) {
        if (this.gameOver || this.levelComplete || this.showingTutorial || this.isPaused) return;

        let dx = 0;

        // Movimiento horizontal
        if (this.keys['a'] || this.keys['arrowleft']) {
            dx = -this.moveSpeed * delta;
            if (this.isGrounded) this.player.setAnimation('WALK');
            this.player.faceDirection(false);
        } else if (this.keys['d'] || this.keys['arrowright']) {
            dx = this.moveSpeed * delta;
            if (this.isGrounded) this.player.setAnimation('WALK');
            this.player.faceDirection(true);
        } else if (this.keys['s'] || this.keys['arrowdown']) {
            // Agacharse
            this.player.setAnimation('CROUCH');
        } else if (this.isGrounded) {
            this.player.setAnimation('IDLE');
        }

        // Aplicar movimiento horizontal
        const newX = this.player.position.x + dx;
        if (this.level.canMoveTo(newX, this.player.position.y, this.player.size)) {
            this.player.position.x = newX;
        }

        // Gravedad
        this.playerVelY += this.gravity * delta;
        const newY = this.player.position.y + this.playerVelY * delta;

        // Buscar suelo debajo del jugador
        const groundY = this.level.getGroundAt(this.player.position.x, this.player.position.y);
        const playerFeetY = groundY + this.player.size / 2;

        // Solo aterrizar si hay una plataforma real (no el deathY)
        if (groundY > this.level.deathY && newY <= playerFeetY && this.playerVelY <= 0) {
            this.player.position.y = playerFeetY;
            this.playerVelY = 0;
            this.isGrounded = true;
        } else {
            this.player.position.y = newY;
            this.isGrounded = (groundY > this.level.deathY && Math.abs(this.player.position.y - playerFeetY) < 2);
        }

        this.player.updatePosition();
    }

    checkCollisions() {
        if (this.gameOver || this.levelComplete) return;

        // Verificar triggers de mensajes (solo en introducción)
        if (this.levelIndex === 0) {
            const trigger = this.level.checkMessageTriggers(this.player);
            if (trigger) {
                this.showMessage(trigger.header, trigger.body, trigger.type);
            }
        }

        // Recoger fragmentos
        const collected = this.level.checkFragmentCollection(this.player);
        if (collected > 0) {
            this.fragmentsCollected += collected;
            this.audio.playCollectFragment();
            this.hudFragments.textContent = `FRAGMENTOS: ${this.fragmentsCollected}/${this.totalFragments}`;
        }

        // Colisión con láseres (muere siempre al tocar un láser)
        if (this.level.checkLaserCollision(this.player)) {
            this.handleDeath();
            return;
        }

        // Caída al vacío
        if (this.player.position.y < this.level.deathY) {
            this.handleDeath();
            return;
        }

        // Meta (llegar al final)
        if (this.level.checkGoalReached(this.player)) {
            this.handleLevelComplete();
        }
    }

    showMessage(header, body, type = '') {
        this.gameMessageHeader.textContent = header;
        this.gameMessageBody.textContent = body;
        this.gameMessage.className = type;
        this.gameMessage.style.display = 'block';
        this.messageVisible = true;
        this.messageTimer = 0;
    }

    hideMessage() {
        this.gameMessage.style.display = 'none';
        this.messageVisible = false;
    }

    handleDeath() {
        this.gameOver = true;
        this.audio.playError();
        this.player.playDeathAnimation();

        // Mostrar pantalla de Game Over después de la animación
        setTimeout(() => {
            this.gameOverUI.classList.add('visible');
        }, 800);
    }

    onGoRetry() {
        this.audio.playClick();
        this.gameOverUI.classList.remove('visible');
        this.resetLevel();
    }

    onGoMenu() {
        this.audio.playClick();
        this.gameOverUI.classList.remove('visible');
        this.stateManager.changeState(STATES.MAIN_MENU);
    }

    onPause() {
        this.isPaused = true;
        this.pauseOverlay.classList.add('visible');
        this.keys = {};
    }

    onResume() {
        this.isPaused = false;
        this.pauseOverlay.classList.remove('visible');
        this.audio.playClick();
    }

    onPauseRetry() {
        this.audio.playClick();
        this.pauseOverlay.classList.remove('visible');
        this.isPaused = false;
        this.resetLevel();
    }

    onPauseMenu() {
        this.audio.playClick();
        this.pauseOverlay.classList.remove('visible');
        this.isPaused = false;
        this.stateManager.changeState(STATES.MAIN_MENU);
    }

    onBackMenu() {
        this.audio.playClick();
        this.stateManager.changeState(STATES.MAIN_MENU);
    }

    resetLevel() {
        this.gameOver = false;
        this.fragmentsCollected = 0;
        this.gameTime = 0;
        this.playerVelY = 0;
        this.isGrounded = false;
        this.keys = {};

        this.player.reset(this.level.spawnPoint.x, this.level.spawnPoint.y);
        this.level.reset();

        this.hudFragments.textContent = `FRAGMENTOS: 0/${this.totalFragments}`;
        this.hudTime.textContent = 'TIEMPO: 0s';
        this.updateStateIndicator();
    }

    handleLevelComplete() {
        this.levelComplete = true;
        this.audio.playLevelComplete();

        // Guardar progreso
        ProgressManager.saveLevel(this.levelIndex, this.fragmentsCollected, true);

        // Redirigir al selector de niveles después de una breve pausa
        setTimeout(() => {
            this.stateManager.changeState(STATES.LEVEL_SELECT);
        }, 1200);
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

        if (!this.gameOver && !this.levelComplete && !this.showingTutorial && !this.isPaused) {
            this.gameTime += delta;
            this.hudTime.textContent = `TIEMPO: ${Math.floor(this.gameTime)}s`;
        }

        // Física y movimiento en tiempo real
        this.handlePhysics(delta);

        // Colisiones
        this.checkCollisions();

        // Timer de mensajes (desaparecen después de 4 segundos)
        if (this.messageVisible) {
            this.messageTimer += delta;
            if (this.messageTimer > 4.5) {
                this.hideMessage();
            }
        }

        // Actualizar entidades
        if (this.player) {
            this.player.update(delta);
        }
        if (this.level) {
            this.level.update(delta);
        }
    }

    exit() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        this.btnRetry.removeEventListener('click', this.onRetry);
        this.btnMenu.removeEventListener('click', this.onMenu);
        this.btnGoRetry.removeEventListener('click', this.onGoRetry);
        this.btnGoMenu.removeEventListener('click', this.onGoMenu);
        this.btnPause.removeEventListener('click', this.onPause);
        this.btnBackMenu.removeEventListener('click', this.onBackMenu);
        this.btnResume.removeEventListener('click', this.onResume);
        this.btnPauseRetry.removeEventListener('click', this.onPauseRetry);
        this.btnPauseMenu.removeEventListener('click', this.onPauseMenu);

        this.controlsPanel.style.display = 'none';
        this.hud.style.display = 'none';
        this.hudButtons.style.display = 'none';
        this.stateIndicator.style.display = 'none';
        this.levelCompleteUI.style.display = 'none';
        this.gameOverUI.classList.remove('visible');
        this.pauseOverlay.classList.remove('visible');
        this.gameMessage.style.display = 'none';
        this.audio.stopMusic();
    }
}
