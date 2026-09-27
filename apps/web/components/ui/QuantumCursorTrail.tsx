"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
};

export default function QuantumCursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;

    const particles: Particle[] = [];

    const mouse = {
      x: -100,
      y: -100,
      lastX: -100,
      lastY: -100,
      active: false,
    };

    const MAX_PARTICLES = 120;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouse.lastX = mouse.x;
      mouse.lastY = mouse.y;

      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      const dx = mouse.x - mouse.lastX;
      const dy = mouse.y - mouse.lastY;

      const distance = Math.sqrt(dx * dx + dy * dy);

      // Don't generate particles when the cursor barely moved.
      if (distance < 2) return;

      // Spawn based on movement speed.
      const count = Math.min(4, Math.max(1, Math.floor(distance / 12)));

      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) {
          particles.shift();
        }

        const t = Math.random();

        particles.push({
          x: mouse.x - dx * t * 0.35,
          y: mouse.y - dy * t * 0.35,

          px: mouse.x,
          py: mouse.y,

          // Very small movement instead of random explosion.
          vx: -dx * 0.015 + (Math.random() - 0.5) * 0.15,
          vy: -dy * 0.015 + (Math.random() - 0.5) * 0.15,

          size: Math.random() * 1.4 + 0.7,

          life: 0,
          maxLife: Math.random() * 28 + 22,

          alpha: Math.random() * 0.35 + 0.35,
        });
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      /*
       * ---------------------------------------------------------
       * CURSOR TRACE
       * ---------------------------------------------------------
       */

      if (mouse.active && mouse.lastX > 0) {
        const dx = mouse.x - mouse.lastX;
        const dy = mouse.y - mouse.lastY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
          const gradient = ctx.createLinearGradient(
            mouse.lastX,
            mouse.lastY,
            mouse.x,
            mouse.y
          );

          gradient.addColorStop(0, "rgba(96, 165, 250, 0)");
          gradient.addColorStop(0.5, "rgba(96, 165, 250, 0.25)");
          gradient.addColorStop(1, "rgba(147, 197, 253, 0.5)");

          ctx.beginPath();
          ctx.moveTo(mouse.lastX, mouse.lastY);
          ctx.lineTo(mouse.x, mouse.y);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      /*
       * ---------------------------------------------------------
       * PARTICLES
       * ---------------------------------------------------------
       */

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.life++;

        p.px = p.x;
        p.py = p.y;

        p.x += p.vx;
        p.y += p.vy;

        // Slowly decelerate.
        p.vx *= 0.97;
        p.vy *= 0.97;

        const progress = p.life / p.maxLife;

        // Smooth fade.
        const fade =
          progress < 0.15
            ? progress / 0.15
            : 1 - (progress - 0.15) / 0.85;

        const alpha = Math.max(0, fade) * p.alpha;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        /*
         * Particle trail
         */
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);

        ctx.strokeStyle = `rgba(96, 165, 250, ${alpha * 0.45})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        /*
         * Particle node
         */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        ctx.fillStyle = `rgba(147, 197, 253, ${alpha})`;
        ctx.fill();

        /*
         * Tiny glow.
         * Much more restrained than the original shadowBlur: 8.
         */
        ctx.shadowBlur = 4;
        ctx.shadowColor = `rgba(96, 165, 250, ${alpha})`;
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      /*
       * ---------------------------------------------------------
       * CURSOR QUANTUM NODE
       * ---------------------------------------------------------
       */

      if (mouse.active) {
        const pulse =
          0.5 + Math.sin(performance.now() * 0.004) * 0.5;

        /*
         * Outer measurement ring
         */
        ctx.beginPath();
        ctx.arc(
          mouse.x,
          mouse.y,
          5 + pulse * 2,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle = `rgba(96, 165, 250, ${
          0.12 + pulse * 0.08
        })`;

        ctx.lineWidth = 0.6;
        ctx.stroke();

        /*
         * Center point
         */
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 1.3, 0, Math.PI * 2);

        ctx.fillStyle = "rgba(191, 219, 254, 0.85)";
        ctx.fill();

        /*
         * Tiny crosshair
         */
        ctx.strokeStyle = "rgba(147, 197, 253, 0.35)";
        ctx.lineWidth = 0.5;

        ctx.beginPath();

        ctx.moveTo(mouse.x - 9, mouse.y);
        ctx.lineTo(mouse.x - 5, mouse.y);

        ctx.moveTo(mouse.x + 5, mouse.y);
        ctx.lineTo(mouse.x + 9, mouse.y);

        ctx.moveTo(mouse.x, mouse.y - 9);
        ctx.lineTo(mouse.x, mouse.y - 5);

        ctx.moveTo(mouse.x, mouse.y + 5);
        ctx.lineTo(mouse.x, mouse.y + 9);

        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);

      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
      aria-hidden="true"
    />
  );
}