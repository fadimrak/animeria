/* ==========================================================================
   ANIMERIA — Animated Background: Particle System
   Monochromatic floating particles with connection lines on a deep canvas.
   ========================================================================== */

class TopographyBackground {
  /**
   * @param {object} [options]
   * @param {CanvasRenderingContext2D} [options.ctx]  - Injected context (for testing)
   * @param {boolean} [options.autoStart=true]        - Whether to call init() automatically
   */
  constructor(options = {}) {
    // Support test injection: if a ctx is provided directly, skip DOM creation
    if (options.ctx) {
      this.canvas = options.ctx.canvas || {};
      this.ctx = options.ctx;
      this.particles = [];
      this.rafId = null;
      if (options.autoStart !== false) this.init();
      return;
    }

    // Create and configure the canvas element
    this.canvas = document.createElement("canvas");
    this.canvas.id = "bgCanvas";
    Object.assign(this.canvas.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "-1",
      pointerEvents: "none",
    });

    // Prepend to body so it sits behind all content
    document.body.prepend(this.canvas);

    // Attempt to get 2D context; fall back gracefully if unsupported
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
      this.canvas.style.display = "none";
      this.particles = [];
      this.rafId = null;
      return; // Browser doesn't support Canvas 2D — silent fallback
    }

    this.particles = [];
    this.rafId = null;

    // Set canvas pixel dimensions to match viewport
    this.resize();

    if (options.autoStart !== false) this.init();
  }

  // -------------------------------------------------------------------------
  // init — wire up event listeners, check reduced-motion, start animation
  // -------------------------------------------------------------------------
  init() {
    if (!this.ctx) return;

    // Respect prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      this.canvas.style.display = "none";
      return;
    }

    // Listen for preference changes
    this._onMotionChange = (e) => {
      if (e.matches) {
        this.canvas.style.display = "none";
        this.pause();
      } else {
        this.canvas.style.display = "";
        this.createParticles();
        this.resume();
      }
    };
    mq.addEventListener("change", this._onMotionChange);

    // Page Visibility API — pause when hidden, resume when visible
    this._onVisibilityChange = () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };
    document.addEventListener("visibilitychange", this._onVisibilityChange);

    // Resize handler
    this._onResize = () => {
      this.resize();
      this.createParticles(); // re-distribute particles after resize
    };
    window.addEventListener("resize", this._onResize);

    // Start the animation
    this.createParticles();
    this.resume();
  }

  // -------------------------------------------------------------------------
  // createParticles — populate this.particles array (max 60)
  // -------------------------------------------------------------------------
  createParticles() {
    this.particles = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.6,  // -0.3..0.3
        vy: (Math.random() - 0.5) * 0.6,
        radius: 1 + Math.random() * 2,     // 1..3
        opacity: 0.02 + Math.random() * 0.05 // 0.02..0.07
      });
    }
  }

  // -------------------------------------------------------------------------
  // animate — rAF loop: clear, draw particles, update positions
  // -------------------------------------------------------------------------
  animate() {
    if (!this.ctx) return;
    if (document.hidden) return; // safety check

    this.rafId = requestAnimationFrame(() => this.animate());

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Draw connection lines between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const alpha = 0.015 * (1 - dist / 200);
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    // Draw and update each particle
    for (const p of this.particles) {
      this.drawParticle(p);
      p.x += p.vx;
      p.y += p.vy;
      // Wrap around edges
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
    }
  }

  // -------------------------------------------------------------------------
  // drawParticle — draw a single particle onto the canvas context
  // -------------------------------------------------------------------------
  drawParticle(p) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
    this.ctx.fill();
  }

  // -------------------------------------------------------------------------
  // pause — cancel the active animation frame
  // -------------------------------------------------------------------------
  pause() {
    cancelAnimationFrame(this.rafId);
  }

  // -------------------------------------------------------------------------
  // resume — restart the rAF loop
  // -------------------------------------------------------------------------
  resume() {
    this.rafId = requestAnimationFrame(() => this.animate());
  }

  // -------------------------------------------------------------------------
  // resize — sync canvas pixel dimensions to the current viewport
  // -------------------------------------------------------------------------
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // -------------------------------------------------------------------------
  // destroy — remove event listeners, cancel animation, remove canvas from DOM
  // -------------------------------------------------------------------------
  destroy() {
    this.pause();
    if (this._onVisibilityChange) {
      document.removeEventListener("visibilitychange", this._onVisibilityChange);
    }
    if (this._onResize) {
      window.removeEventListener("resize", this._onResize);
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (this._onMotionChange) {
      mq.removeEventListener("change", this._onMotionChange);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Auto-instantiate when the script loads
window.TopographyBg = new TopographyBackground();
