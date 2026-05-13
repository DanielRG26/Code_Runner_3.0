/**
 * GameplayState - Gameplay con controles en tiempo real (WASD)
 * W = saltar, A = izquierda, D = derecha, S = agacharse, X = cambiar estado
 * Nivel de introducción muestra panel de controles al inicio
 */
import * as THREE from 'three';
import { STATES } from './GameStateManager.js';
import { Level1 } from '../levels/Level1.js';
import { Level1_1 } from '../levels/Level1_1.js';
import { Level2 } from '../levels/Level2.js';
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

        // Sistema de vidas (solo para Level1_1)
        this.maxLives = 5;
        this.currentLives = 5;
        this.hasLivesSystem = (this.levelIndex === 1); // Solo Level1_1

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
        this.hudLives = document.getElementById('hud-lives');
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
        this.audio.startMusic(this.levelIndex === 2 ? 1 : 0);

        // Crear nivel
        switch (this.levelIndex) {
            case 1:
                this.level = new Level1_1(scene);
                break;
            case 2:
                this.level = new Level2(scene);
                break;
            default:
                this.level = new Level1(scene);
        }
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

        // Mostrar vidas solo en Level1_1
        if (this.hasLivesSystem) {
            this.hudLives.style.display = 'flex';
            this.updateLivesDisplay();
        } else {
            this.hudLives.style.display = 'none';
        }

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

    updateLivesDisplay() {
        const hearts = this.hudLives.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            if (index < this.currentLives) {
                heart.classList.remove('lost');
            } else {
                heart.classList.add('lost');
            }
        });
    }

    loseLife() {
        if (!this.hasLivesSystem) return false;
        
        this.currentLives--;
        this.updateLivesDisplay();
        
        // Mostrar mensaje de vidas restantes
        if (this.currentLives > 0) {
            this.showMessage(
                '> VIDA PERDIDA',
                `Te quedan ${this.currentLives} vida${this.currentLives !== 1 ? 's' : ''}. ¡Ten cuidado!`,
                'warning'
            );
        } else {
            this.showMessage(
                '> SIN VIDAS',
                'Has perdido todas tus vidas. Regresando al menú principal...',
                'warning'
            );
        }
        
        return this.currentLives <= 0;
    }

    handlePhysics(delta) {
        if (this.gameOver || this.levelComplete || this.showingTutorial || this.isPaused) return;

        let dx = 0;
        const isCrouchingNow = this.keys['s'] || this.keys['arrowdown'];

        // Movimiento horizontal
        if (this.keys['a'] || this.keys['arrowleft']) {
            dx = -this.moveSpeed * delta;
            if (isCrouchingNow) {
                // Caminar agachado (más lento)
                dx *= 0.6;
                this.player.setAnimation('CROUCH');
            } else if (this.isGrounded) {
                this.player.setAnimation('WALK');
            }
            this.player.faceDirection(false);
        } else if (this.keys['d'] || this.keys['arrowright']) {
            dx = this.moveSpeed * delta;
            if (isCrouchingNow) {
                // Caminar agachado (más lento)
                dx *= 0.6;
                this.player.setAnimation('CROUCH');
            } else if (this.isGrounded) {
                this.player.setAnimation('WALK');
            }
            this.player.faceDirection(true);
        } else if (isCrouchingNow) {
            // Agacharse sin moverse
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

        // Triggers de mensajes
        if (this.level.checkMessageTriggers) {
            const trigger = this.level.checkMessageTriggers(this.player);
            if (trigger) {
                this.showMessage(trigger.header, trigger.body, trigger.type);
            }
        }

        // Checkpoints (nivel 2+)
        if (this.level.updateCheckpoints) {
            this.level.updateCheckpoints(this.player);
        }

        // Recoger fragmentos
        const collected = this.level.checkFragmentCollection(this.player);
        if (collected > 0) {
            this.fragmentsCollected += collected;
            this.audio.playCollectFragment();
            this.hudFragments.textContent = `FRAGMENTOS: ${this.fragmentsCollected}/${this.totalFragments}`;
        }

        // Colisión con láseres (nivel 1)
        if (this.level.checkLaserCollision && this.level.checkLaserCollision(this.player)) {
            this.handleDeath();
            return;
        }

        // Colisión con obstáculos de techo (Level1_1)
        if (this.level.checkCeilingCollision && this.level.checkCeilingCollision(this.player)) {
            this.handleDeath();
            return;
        }

        // Colisión con lava (Level1_1)
        if (this.level.checkLavaCollision && this.level.checkLavaCollision(this.player)) {
            this.handleDeath();
            return;
        }

        // Colisión con ácido (nivel 2)
        if (this.level.checkAcidCollision && this.level.checkAcidCollision(this.player)) {
            this.handleDeath();
            return;
        }

        // Colisión con vapor activo (nivel 2)
        if (this.level.checkSteamCollision && this.level.checkSteamCollision(this.player)) {
            this.handleDeath();
            return;
        }

        // Colisión con centinelas (nivel 2)
        if (this.level.checkSentinelCollision && this.level.checkSentinelCollision(this.player)) {
            this.handleDeath();
            return;
        }

        // Sonido de vapor al activarse
        if (this.level.steamPipes) {
            for (const pipe of this.level.steamPipes) {
                if (pipe._playSteamSound) {
                    this.audio.playSteam();
                    pipe._playSteamSound = false;
                }
            }
        }

        // Caída al vacío
        if (this.player.position.y < this.level.deathY) {
            this.handleDeath();
            return;
        }

        // Meta
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
        // Para Level1_1 con sistema de vidas, permitir múltiples muertes
        if (this.hasLivesSystem && this.currentLives > 0) {
            // No bloquear si aún tiene vidas
        } else if (this.gameOver) {
            return;
        }
        
        this.audio.playError();
        this.player.playDeathAnimation();

        // Sistema de vidas para Level1_1
        if (this.hasLivesSystem) {
            const noLivesLeft = this.loseLife();
            
            if (noLivesLeft) {
                // Sin vidas: marcar game over y mostrar mensaje
                this.gameOver = true;
                setTimeout(() => {
                    this.hideMessage();
                    // Ir al menú principal cuando pierde todas las vidas
                    this.stateManager.changeState(STATES.MAIN_MENU);
                }, 2500);
                return;
            } else {
                // Aún tiene vidas: solo reposicionar al jugador
                this.keys = {};
                this.playerVelY = 0;
                this.isGrounded = false;
                setTimeout(() => {
                    this.hideMessage();
                    // Solo resetear posición del jugador, NO las vidas
                    this.player.reset(this.level.spawnPoint.x, this.level.spawnPoint.y);
                    this.player.position.x = this.level.spawnPoint.x;
                    this.player.position.y = this.level.spawnPoint.y;
                    this.player.updatePosition();
                    // Mantener fragmentos y tiempo
                }, 1500);
                return;
            }
        }

        // Nivel 2+: respawn en checkpoint, no game over inmediato
        if (this.levelIndex >= 2 && this.level.activeCheckpoint) {
            this.keys = {};
            this.playerVelY = 0;
            this.isGrounded = false;
            const cp = this.level.activeCheckpoint;
            setTimeout(() => {
                this.player.reset(cp.x, cp.y);
                this.player.position.x = cp.x;
                this.player.position.y = cp.y;
                this.player.updatePosition();
            }, 600);
            return;
        }

        // Nivel 0: game over clásico
        this.gameOver = true;
        setTimeout(() => {
            this.gameOverUI.classList.add('visible');
        }, 800);
    }

    onGoRetry() {
        this.audio.playClick();
        this.gameOverUI.classList.remove('visible');
        // Para Level1_1 con sistema de vidas, NO resetear vidas
        if (this.hasLivesSystem) {
            this.resetLevel();  // Solo resetea posición, NO vidas
        } else {
            this.fullReset();  // Reset completo para otros niveles
        }
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
        // Para Level1_1 con sistema de vidas, NO resetear vidas
        if (this.hasLivesSystem) {
            this.resetLevel();  // Solo resetea posición, NO vidas
        } else {
            this.fullReset();  // Reset completo para otros niveles
        }
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

        // NO resetear vidas aquí - solo se resetean al entrar al nivel o reiniciar manualmente
        // Las vidas se mantienen entre muertes

        this.player.reset(this.level.spawnPoint.x, this.level.spawnPoint.y);
        this.level.reset();

        this.hudFragments.textContent = `FRAGMENTOS: 0/${this.totalFragments}`;
        this.hudTime.textContent = 'TIEMPO: 0s';
        this.updateStateIndicator();
    }

    // Nueva función para resetear completamente (incluyendo vidas)
    fullReset() {
        this.gameOver = false;
        this.fragmentsCollected = 0;
        this.gameTime = 0;
        this.playerVelY = 0;
        this.isGrounded = false;
        this.keys = {};

        // Resetear vidas solo en reset completo
        if (this.hasLivesSystem) {
            this.currentLives = this.maxLives;
            this.updateLivesDisplay();
        }

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

        // Si es Level1_1, ir directamente al Level2
        if (this.levelIndex === 1) {
            setTimeout(() => {
                this.stateManager.changeState(STATES.GAMEPLAY, { level: 2 });
            }, 1200);
        } else {
            // Para otros niveles, redirigir al selector de niveles
            setTimeout(() => {
                this.stateManager.changeState(STATES.LEVEL_SELECT);
            }, 1200);
        }
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
        // Para Level1_1 con sistema de vidas, NO resetear vidas
        if (this.hasLivesSystem) {
            this.resetLevel();  // Solo resetea posición, NO vidas
        } else {
            this.fullReset();  // Reset completo para otros niveles
        }
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
        this.hudLives.style.display = 'none';
        this.stateIndicator.style.display = 'none';
        this.levelCompleteUI.style.display = 'none';
        this.gameOverUI.classList.remove('visible');
        this.pauseOverlay.classList.remove('visible');
        this.gameMessage.style.display = 'none';
        this.audio.stopMusic();
    }
}
