/**
 * Transition - Efecto glitch/carga de datos entre pantallas
 */
export class Transition {
    static play(callback, duration = 600) {
        const overlay = document.getElementById('transition-overlay');
        overlay.style.display = 'block';
        overlay.style.opacity = '0';

        // Fase 1: Glitch in
        let frame = 0;
        const totalFrames = Math.floor(duration / 2 / 16);

        const glitchIn = () => {
            frame++;
            const progress = frame / totalFrames;
            overlay.style.opacity = String(progress);

            // Efecto de líneas de escaneo aleatorias
            if (Math.random() > 0.5) {
                overlay.style.background = `linear-gradient(
                    0deg,
                    #000 ${Math.random() * 100}%,
                    #00e5ff11 ${Math.random() * 100}%,
                    #000 ${Math.random() * 100}%
                )`;
            } else {
                overlay.style.background = '#000';
            }

            if (frame < totalFrames) {
                requestAnimationFrame(glitchIn);
            } else {
                overlay.style.opacity = '1';
                overlay.style.background = '#000';
                // Ejecutar cambio de estado
                if (callback) callback();

                // Fase 2: Glitch out
                setTimeout(() => {
                    frame = 0;
                    const glitchOut = () => {
                        frame++;
                        const p = frame / totalFrames;
                        overlay.style.opacity = String(1 - p);

                        if (Math.random() > 0.6) {
                            overlay.style.background = `linear-gradient(
                                0deg,
                                transparent ${Math.random() * 100}%,
                                #00e5ff08 ${Math.random() * 100}%,
                                transparent ${Math.random() * 100}%
                            )`;
                        }

                        if (frame < totalFrames) {
                            requestAnimationFrame(glitchOut);
                        } else {
                            overlay.style.display = 'none';
                        }
                    };
                    glitchOut();
                }, 100);
            }
        };
        glitchIn();
    }
}
