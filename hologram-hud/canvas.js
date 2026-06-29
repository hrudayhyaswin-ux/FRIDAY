/**
 * canvas.js - Futuristic Canvas Rendering Engine
 * Handles the background floating neural particle grid and the animated JARVIS/FRIDAY holographic core.
 */

// Background Particle Network
class NeuralNetwork {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 60;
        this.connectionDist = 120;
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        this.init();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.2
            });
        }
    }

    addInteractiveParticle(x, y) {
        // Spawn a temporary interactive particle
        this.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            radius: Math.random() * 3 + 2,
            alpha: 1.0,
            temp: true,
            life: 200
        });
        
        // Cap particles array size
        if (this.particles.length > this.maxParticles + 20) {
            this.particles.shift();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Grid Lines (Subtle Cyberpunk Blueprint Background)
        this.drawGrid();

        // Update & Draw Particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            if (p.temp) {
                p.life -= 1;
                p.alpha = p.life / 200;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    i--;
                    continue;
                }
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha})`; // Cyan neon
            this.ctx.fill();
        }

        // Draw connecting neural lines
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.connectionDist) {
                    const alpha = (1 - dist / this.connectionDist) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`; // Indigo glow
                    this.ctx.lineWidth = 0.8;
                    this.ctx.stroke();
                }
            }
        }
    }

    drawGrid() {
        const size = 60;
        this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.025)';
        this.ctx.lineWidth = 0.5;

        for (let x = 0; x < this.canvas.width; x += size) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += size) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
}


// Holographic Circular Core
class HologramCore {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.rotation1 = 0;
        this.rotation2 = 0;
        this.pulse = 1.0;
        this.pulseDirection = 1;
        this.speaking = false;
        this.frequencyData = Array(32).fill(0).map(() => Math.random() * 10 + 2);
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = 300;
        this.canvas.height = 300;
    }

    setSpeaking(state) {
        this.speaking = state;
    }

    updateFrequencies() {
        if (this.speaking) {
            // Generate simulated audio wave frequency bars
            this.frequencyData = this.frequencyData.map((val) => {
                const target = Math.random() * 45 + 5;
                return val + (target - val) * 0.3; // Interpolation
            });
        } else {
            // Steady state idle breath waves
            this.frequencyData = this.frequencyData.map((val) => {
                const target = Math.random() * 8 + 3;
                return val + (target - val) * 0.1;
            });
        }
    }

    draw() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update parameters
        this.rotation1 += 0.005;
        this.rotation2 -= 0.009;
        
        // Breathing pulse core
        this.pulse += 0.003 * this.pulseDirection;
        if (this.pulse > 1.08 || this.pulse < 0.94) {
            this.pulseDirection *= -1;
        }

        this.updateFrequencies();

        // 1. Draw outermost compass ring ticks
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(this.rotation1 * 0.2);
        this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 72; i++) {
            const angle = (i * 5) * Math.PI / 180;
            const length = (i % 6 === 0) ? 8 : 4;
            const rStart = 135;
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * rStart, Math.sin(angle) * rStart);
            this.ctx.lineTo(Math.cos(angle) * (rStart - length), Math.sin(angle) * (rStart - length));
            this.ctx.stroke();
        }
        this.ctx.restore();

        // 2. Draw rotating dashes (Outer dash ring)
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(this.rotation1);
        this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([6, 15]);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 115, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();

        // 3. Draw middle ring (Double arcs rotating backward)
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(this.rotation2);
        this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)'; // Indigo arc
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
        this.ctx.shadowBlur = 10;
        
        // Arc 1
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 95, 0, Math.PI * 0.6);
        this.ctx.stroke();
        
        // Arc 2
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 95, Math.PI * 1.0, Math.PI * 1.6);
        this.ctx.stroke();
        
        this.ctx.restore();

        // 4. Draw Radial Equalizer bar ripples (Voice frequencies)
        this.ctx.save();
        this.ctx.translate(cx, cy);
        const barCount = this.frequencyData.length;
        this.ctx.shadowBlur = this.speaking ? 15 : 0;
        for (let i = 0; i < barCount; i++) {
            const angle = (i * (360 / barCount)) * Math.PI / 180;
            const freqVal = this.frequencyData[i];
            const rStart = 65;
            const rEnd = rStart + freqVal * (this.speaking ? 1.2 : 0.8);
            
            // Set dynamic gradient color
            const gradient = this.ctx.createLinearGradient(
                Math.cos(angle) * rStart, Math.sin(angle) * rStart,
                Math.cos(angle) * rEnd, Math.sin(angle) * rEnd
            );
            
            if (this.speaking) {
                gradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)'); // Cyan
                gradient.addColorStop(1, 'rgba(99, 102, 241, 0.9)'); // Indigo
                this.ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
            } else {
                gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
                gradient.addColorStop(1, 'rgba(6, 182, 212, 0.1)');
            }
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * rStart, Math.sin(angle) * rStart);
            this.ctx.lineTo(Math.cos(angle) * rEnd, Math.sin(angle) * rEnd);
            this.ctx.stroke();
        }
        this.ctx.restore();

        // 5. Draw inner glowing central orb
        this.ctx.save();
        this.ctx.translate(cx, cy);
        const orbRadius = 45 * this.pulse;
        
        const coreGradient = this.ctx.createRadialGradient(0, 0, 2, 0, 0, orbRadius);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.2, 'rgba(6, 182, 212, 0.9)');
        coreGradient.addColorStop(0.6, 'rgba(99, 102, 241, 0.4)');
        coreGradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
        
        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
}

export { NeuralNetwork, HologramCore };
