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
    startMusic(level = 0) {
        if (!this.unlocked || this.musicPlaying) return;
        this.musicPlaying = true;
        if (level === 1) {
            this._startMusicLevel2();
        } else {
            this._startMusicLevel1();
        }
    }

    _startMusicLevel1() {
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

    // --- Música synthwave ambiental nivel 2 (ritmo constante, tranquilo) ---
    _startMusicLevel2() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Pad de fondo — acorde menor en Do (Cm)
        const padFreqs = [65.4, 77.8, 98.0]; // C2, Eb2, G2
        padFreqs.forEach(freq => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 180;
            const gain = ctx.createGain();
            gain.gain.value = 0.08;
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            osc.start(now);
            this.musicOscillators.push(osc);
        });

        // LFO lento para movimiento de filtro
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.12;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 40;
        lfo.connect(lfoGain);
        // conectar al filtro del primer pad (índice 0 de musicOscillators)
        lfo.start(now);
        this.musicOscillators.push(lfo);

        // Pulso de bajo (kick sintético cada 0.6s)
        this._scheduleKick(now);

        // Melodía ambiental suave
        this._playLevel2Melody(now);
    }

    _scheduleKick(startTime) {
        if (!this.musicPlaying || !this.unlocked) return;
        const ctx = this.ctx;
        const interval = 0.6;

        const playKick = (t) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(80, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(t);
            osc.stop(t + 0.2);
        };

        // Programar 8 kicks y luego hacer loop
        for (let i = 0; i < 8; i++) {
            playKick(startTime + i * interval);
        }
        const loopDuration = 8 * interval * 1000;
        setTimeout(() => {
            if (this.musicPlaying) this._scheduleKick(this.ctx.currentTime);
        }, loopDuration - 50);
    }

    _playLevel2Melody(startTime) {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        // Escala de Cm — notas suaves y espaciadas
        const notes = [130.8, 155.6, 174.6, 196, 220, 196, 174.6, 155.6];
        const noteLen = 1.1;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const env = ctx.createGain();
            env.gain.value = 0;
            const t = startTime + i * noteLen;
            env.gain.setValueAtTime(0, t);
            env.gain.linearRampToValueAtTime(0.05, t + 0.08);
            env.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 0.85);
            osc.connect(env);
            env.connect(this.musicGain);
            osc.start(t);
            osc.stop(t + noteLen);
        });

        const totalDuration = notes.length * noteLen;
        setTimeout(() => {
            if (this.musicPlaying) this._playLevel2Melody(this.ctx.currentTime);
        }, totalDuration * 1000);
    }

    // --- Sonido "pshhh" de vapor ---
    playSteam() {
        if (!this.unlocked) return;
        const ctx = this.ctx;
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 0.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        source.start();
        source.stop(ctx.currentTime + 0.4);
    }
}
