export default function getEmitter() {
    const particles = [];
    
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.alpha = 1;
            this.size = Math.random() * 6 + 3;  // Stærri particles
            this.color = `hsl(270, 100%, 50%)`;  // Fjólublár
            this.lifetime = 0;  // Bætum við lifetime counter
            this.maxLifetime = 30;  // Hámarks lifetime í frames
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.lifetime++;
            // Látum alpha minnka línulega með lifetime
            this.alpha = 1 - (this.lifetime / this.maxLifetime);
        }

        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    return {
        update(ctx, pos) {
            // Bætum við 5 particles í einu
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(pos.x, pos.y));
            }
            
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw(ctx);
                
                // Eyðum particles þegar lifetime er búið
                if (particles[i].lifetime >= particles[i].maxLifetime) {
                    particles.splice(i, 1);
                }
            }
        },
        
        // Bætum við clear falli
        clear(ctx) {
            particles.length = 0; // Hreinsum öll particles
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    };
}