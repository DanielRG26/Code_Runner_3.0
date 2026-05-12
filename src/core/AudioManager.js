/**
 * AudioManager - Sistema de sonido con Web Audio API
 * Genera sonidos procedurales: synthwave, beeps, pasos, cristal, error
 */
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.unlocked = false;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicPlaying = false;
        this.musicOscillators = [];
    }

    unlock() {
        if (this.unlocked) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.12;
        this.musicGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.3;
        this.sfxGain.connect(this.ctx.destination);
        this.unlocked = true;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- Música ambiental lo-fi synthwave ---
    startMusic() {
        if (!this.unlocked || this.musicPlaying) return;
        this.musicPlaying = true;

        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Pad bajo oscuro
        const padOsc = ctx.createOscillator();
        padOsc.type = 'sawtooth';
        padOsc.frequency.value = 55; // A1
        const padFilter = ctx.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.value = 200;
        const padGain = ctx.createGain();
        padGain.gain.value = 0.15;
        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.musicGain);
        padOsc.start(now);
        this.musicOscillators.push(padOsc);

        // LFO para movimiento
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 30;
        lfo.connect(lfoGain);
        lfoGain.connect(padFilter.frequency);
        lfo.start(now);
        this.musicOscillators.push(lfo);

        // Arpegio melancólico
        this.playArpeggio(now);
    }

    playArpeggio(startTime) {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        // Notas: Am pentatónica
        const notes = [220, 261.6, 329.6, 392, 440, 523.3, 392, 329.6];
        const noteLength = 0.8;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const env = ctx.createGain();
            env.gain.value = 0;
            const t = startTime + i * noteLength;
            env.gain.setValueAtTime(0, t);
            env.gain.linearRampToValueAtTime(0.06, t + 0.05);
            env.gain.exponentialRampToValueAtTime(0.001, t + noteLength * 0.9);
            osc.connect(env);
            env.connect(this.musicGain);
            osc.start(t);
            osc.stop(t + noteLength);
        });

        // Loop
        const totalDuration = notes.length * noteLength;
        setTimeout(() => {
            if (this.musicPlaying) {
                this.playArpeggio(this.ctx.currentTime);
            }
        }, totalDuration * 1000);
    }

    stopMusic() {
        this.musicPlaying = false;
        this.musicOscillators.forEach(osc => {
            try { osc.stop(); } catch (e) { /* ya parado */ }
        });
        this.musicOscillators = [];
    }

    // --- Efectos de sonido ---

    playHover() {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1200;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    }

    playClick() {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.05);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    }

    playStep() {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        // Sonido metálico de paso
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 100 + Math.random() * 60;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
    }

    playJump() {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        // Sonido de propulsor/salto - swoosh ascendente
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(100, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.06, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 2;
        osc.connect(gain);
        osc2.connect(filter);
        filter.connect(gain2);
        gain.connect(this.sfxGain);
        gain2.connect(this.sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.15);
    }

    playCollectFragment() {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        // Sonido de cristal brillante
        const freqs = [880, 1320, 1760];
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            const gain = ctx.createGain();
            const t = ctx.currentTime + i * 0.06;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.3);
        });
    }

    playError() {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        // Sonido de error/destrucción
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        const distortion = ctx.createWaveShaper();
        distortion.curve = this.makeDistortionCurve(50);
        osc.connect(distortion);
        distortion.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

    playStateChange() {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    }

    playLevelComplete() {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        const notes = [523.3, 659.3, 784, 1047];
        notes.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            const gain = ctx.createGain();
            const t = ctx.currentTime + i * 0.12;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.4);
        });
    }

    makeDistortionCurve(amount) {
        const samples = 256;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }
}
