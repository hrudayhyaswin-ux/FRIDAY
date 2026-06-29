/**
 * sound.js - Web Audio API Sci-Fi Sound Generator
 * Generates offline-first futuristic sounds dynamically using synthetic oscillators.
 */

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            this.playAmbientHum();
        } catch (e) {
            console.error("Audio Context failed to initialize", e);
        }
    }

    setMute(state) {
        this.muted = state;
        if (this.muted) {
            if (this.ambientHumSource) {
                this.ambientHumSource.stop();
                this.ambientHumSource = null;
            }
        } else {
            this.playAmbientHum();
        }
    }

    // Play a low-frequency ambient spaceship/server hum
    playAmbientHum() {
        if (!this.initialized || this.muted || this.ambientHumSource) return;

        try {
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(55.4, this.ctx.currentTime); // Detuned slightly for chorus effect

            // Low pass filter to make it a deep rumble
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(100, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.015, this.ctx.currentTime);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start();
            osc2.start();

            this.ambientHumSource = {
                stop: () => {
                    osc1.stop();
                    osc2.stop();
                }
            };
        } catch (e) {
            console.warn("Ambient hum failed", e);
        }
    }

    // Cyber click beep
    playClick() {
        this.init();
        if (!this.initialized || this.muted) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(2200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch (e) {}
    }

    // High tech UI hover tick
    playHover() {
        this.init();
        if (!this.initialized || this.muted) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(3000, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.008, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.02);
        } catch (e) {}
    }

    // Interactive Core Startup Sequence
    playStartup() {
        this.init();
        if (!this.initialized || this.muted) return;

        try {
            const now = this.ctx.currentTime;
            
            // Arpeggio chords
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major Sci-Fi arpeggio
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.08 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.45);
            });
        } catch (e) {}
    }

    // Error warning sound
    playAlert() {
        this.init();
        if (!this.initialized || this.muted) return;

        try {
            const now = this.ctx.currentTime;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(150, now);
            osc1.frequency.linearRampToValueAtTime(120, now + 0.15);
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(152, now);
            osc2.frequency.linearRampToValueAtTime(122, now + 0.15);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, now);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.2);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(now + 0.2);
            osc2.stop(now + 0.2);
        } catch (e) {}
    }

    // Success sound for processing finished
    playSuccess() {
        this.init();
        if (!this.initialized || this.muted) return;

        try {
            const now = this.ctx.currentTime;
            const notes = [587.33, 880.00, 1174.66]; // D5, A5, D6 sci-fi chime
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);

                gain.gain.setValueAtTime(0.03, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.35);
            });
        } catch (e) {}
    }
}

const sound = new SoundManager();
export default sound;
