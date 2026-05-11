/**
 * CommandSystem - Procesa secuencias de comandos del jugador
 * El robot ejecuta los comandos uno a uno con animación
 */
export class CommandSystem {
    constructor(player, level) {
        this.player = player;
        this.level = level;
        this.queue = [];
        this.isExecuting = false;
        this.currentCommand = null;
        this.commandTimer = 0;
        this.commandDuration = 0.4;
        this.onComplete = null;
        this.onStepComplete = null; // Callback por cada paso
        this.stepSize = 40;
        this.jumpHeight = 80;
        this.aborted = false;
    }

    execute(commands, onComplete, onStepComplete = null) {
        this.queue = [...commands];
        this.isExecuting = true;
        this.aborted = false;
        this.onComplete = onComplete;
        this.onStepComplete = onStepComplete;
        this.processNext();
    }

    abort() {
        this.aborted = true;
        this.queue = [];
        this.isExecuting = false;
        this.currentCommand = null;
    }

    processNext() {
        if (this.aborted || this.queue.length === 0) {
            this.isExecuting = false;
            if (this.onComplete && !this.aborted) {
                this.onComplete();
            }
            return;
        }

        this.currentCommand = this.queue.shift();
        this.commandTimer = 0;

        const pos = this.player.position;
        let targetX = pos.x;
        let targetY = pos.y;

        switch (this.currentCommand) {
            case 'UP':
                targetY = pos.y + this.stepSize;
                break;
            case 'DOWN':
                targetY = pos.y - this.stepSize;
                break;
            case 'LEFT':
                targetX = pos.x - this.stepSize;
                break;
            case 'RIGHT':
                targetX = pos.x + this.stepSize;
                break;
            case 'JUMP':
                targetY = pos.y + this.jumpHeight;
                break;
            case 'TOGGLE':
                this.player.toggleState();
                setTimeout(() => this.processNext(), 100);
                return;
        }

        // Verificar colisión con plataformas antes de mover
        const canMove = this.level.canMoveTo(targetX, targetY, this.player.size);
        if (canMove) {
            this.player.moveTo(targetX, targetY);
        } else {
            // No puede moverse, pasar al siguiente comando
            setTimeout(() => this.processNext(), 100);
        }
    }

    update(delta) {
        if (!this.isExecuting) return;
        if (!this.currentCommand) return;

        this.commandTimer += delta;

        // Esperar a que el jugador termine de moverse
        if (!this.player.isMoving && this.commandTimer > 0.15) {
            // Aplicar gravedad después de cada movimiento
            this.applyGravity();
            this.currentCommand = null;
            this.commandTimer = 0;

            // Notificar paso completado (para verificar colisiones)
            if (this.onStepComplete) {
                const shouldAbort = this.onStepComplete();
                if (shouldAbort) {
                    this.abort();
                    return;
                }
            }

            // Pequeña pausa entre comandos
            setTimeout(() => this.processNext(), 80);
        }
    }

    applyGravity() {
        const pos = this.player.position;
        const groundY = this.level.getGroundAt(pos.x, pos.y);

        if (pos.y > groundY + this.player.size / 2) {
            // Caer hasta la plataforma más cercana debajo
            this.player.position.y = groundY + this.player.size / 2;
            this.player.targetPosition.y = this.player.position.y;
            this.player.updatePosition();
        }
    }
}
