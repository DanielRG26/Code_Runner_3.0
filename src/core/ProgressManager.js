/**
 * ProgressManager - Guarda el progreso del jugador en localStorage
 * Fragmentos recogidos por nivel (como las monedas de Geometry Dash)
 */
export class ProgressManager {
    static getProgress() {
        const STORAGE_KEY = 'coderunner_progress';
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) { /* ignore */ }
        return { levels: {} };
    }

    static saveLevel(levelIndex, fragments, completed) {
        const STORAGE_KEY = 'coderunner_progress';
        const progress = ProgressManager.getProgress();
        const current = progress.levels[levelIndex] || { fragments: 0, completed: false };

        progress.levels[levelIndex] = {
            fragments: Math.max(current.fragments, fragments),
            completed: current.completed || completed
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (e) { /* ignore */ }
    }

    static getFragments(levelIndex) {
        const progress = ProgressManager.getProgress();
        return (progress.levels[levelIndex] || {}).fragments || 0;
    }

    static isCompleted(levelIndex) {
        const progress = ProgressManager.getProgress();
        return (progress.levels[levelIndex] || {}).completed || false;
    }

    static reset() {
        const STORAGE_KEY = 'coderunner_progress';
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) { /* ignore */ }
    }
}
