/**
 * ProgressManager - Guarda el progreso del jugador en localStorage
 * Fragmentos recogidos por nivel (como las monedas de Geometry Dash)
 */
export class ProgressManager {
    static STORAGE_KEY = 'coderunner_progress';

    /**
     * Obtiene el progreso guardado
     * @returns {object} { levels: { 0: { fragments: 2, completed: true }, ... } }
     */
    static getProgress() {
        try {
            const data = localStorage.getItem(ProgressManager.STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) { /* ignore */ }
        return { levels: {} };
    }

    /**
     * Guarda el resultado de un nivel
     * @param {number} levelIndex - Índice del nivel
     * @param {number} fragments - Fragmentos recogidos (0-3)
     * @param {boolean} completed - Si completó el nivel
     */
    static saveLevel(levelIndex, fragments, completed) {
        const progress = ProgressManager.getProgress();
        const current = progress.levels[levelIndex] || { fragments: 0, completed: false };

        // Solo guardar si es mejor que lo anterior
        progress.levels[levelIndex] = {
            fragments: Math.max(current.fragments, fragments),
            completed: current.completed || completed
        };

        try {
            localStorage.setItem(ProgressManager.STORAGE_KEY, JSON.stringify(progress));
        } catch (e) { /* ignore */ }
    }

    /**
     * Obtiene los fragmentos de un nivel específico
     * @param {number} levelIndex
     * @returns {number} 0-3
     */
    static getFragments(levelIndex) {
        const progress = ProgressManager.getProgress();
        return (progress.levels[levelIndex] || {}).fragments || 0;
    }

    /**
     * Verifica si un nivel fue completado
     * @param {number} levelIndex
     * @returns {boolean}
     */
    static isCompleted(levelIndex) {
        const progress = ProgressManager.getProgress();
        return (progress.levels[levelIndex] || {}).completed || false;
    }

    /**
     * Resetea todo el progreso
     */
    static reset() {
        try {
            localStorage.removeItem(ProgressManager.STORAGE_KEY);
        } catch (e) { /* ignore */ }
    }
}
