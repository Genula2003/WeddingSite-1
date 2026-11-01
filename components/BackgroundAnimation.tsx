'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  rotationSpeed: number;
  speedY: number;
  swaySpeed: number;
  swayOffset: number;
  opacity: number;
  color: string;
  type: 'petal' | 'sparkle' | 'leaf';
}

export default function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Respect user's accessibility preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Track scroll velocity for realistic scrolling flower animation
    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    let scrollVelocity = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      // Smoothly cap scroll impulse
      scrollVelocity = Math.max(Math.min(delta * 0.12, 10), -10);
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Premium Creamy + Gold + Green Palette
    const creamyColors = [
      'rgba(255, 250, 242, ', // pure floral cream
      'rgba(252, 243, 230, ', // warm ivory
      'rgba(247, 235, 218, ', // champagne cream
    ];

    const goldColors = [
      'rgba(218, 175, 75, ', // royal gold
      'rgba(242, 206, 115, ', // warm luminous gold
      'rgba(255, 228, 160, ', // gold sparkle
    ];

    const greenColors = [
      'rgba(34, 92, 58, ', // deep royal emerald
      'rgba(52, 115, 78, ', // rich leaf green
      'rgba(78, 138, 98, ', // soft sage green
    ];

    const count = width < 768 ? 24 : 42;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      // 50% Creamy petals, 30% Gold sparkles, 20% Subtle green leaves
      const rand = Math.random();
      let type: 'petal' | 'sparkle' | 'leaf' = 'petal';
      let color = creamyColors[Math.floor(Math.random() * creamyColors.length)];

      if (rand < 0.3) {
        type = 'sparkle';
        color = goldColors[Math.floor(Math.random() * goldColors.length)];
      } else if (rand < 0.5) {
        type = 'leaf';
        color = greenColors[Math.floor(Math.random() * greenColors.length)];
      }

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radiusX:
          type === 'sparkle'
            ? Math.random() * 1.6 + 1
            : type === 'leaf'
            ? Math.random() * 3 + 3
            : Math.random() * 4.5 + 4,
        radiusY:
          type === 'sparkle'
            ? Math.random() * 1.6 + 1
            : type === 'leaf'
            ? Math.random() * 6 + 5
            : Math.random() * 7.5 + 7,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.016,
        speedY:
          type === 'sparkle'
            ? Math.random() * 0.35 + 0.15
            : Math.random() * 0.55 + 0.35,
        swaySpeed: Math.random() * 0.015 + 0.008,
        swayOffset: Math.random() * Math.PI * 2,
        opacity:
          type === 'leaf'
            ? Math.random() * 0.3 + 0.22
            : type === 'sparkle'
            ? Math.random() * 0.5 + 0.35
            : Math.random() * 0.45 + 0.3,
        color,
        type,
      });
    }

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Subtle ambient glowing light gradient drifting in background
      const ambientGlowX =
        width * 0.5 + Math.sin(frame * 0.005) * (width * 0.2);
      const ambientGlowY =
        height * 0.4 + Math.cos(frame * 0.004) * (height * 0.15);
      const ambientGrad = ctx.createRadialGradient(
        ambientGlowX,
        ambientGlowY,
        10,
        ambientGlowX,
        ambientGlowY,
        width * 0.6
      );
      ambientGrad.addColorStop(0, 'rgba(197, 155, 67, 0.035)'); // warm gold aura
      ambientGrad.addColorStop(0.5, 'rgba(34, 92, 58, 0.025)'); // gentle emerald aura
      ambientGrad.addColorStop(1, 'rgba(250, 246, 238, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // Smoothly damp velocity back to zero
      scrollVelocity *= 0.94;
      if (Math.abs(scrollVelocity) < 0.01) scrollVelocity = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion physics: gentle fall with soft horizontal drift + reactive scroll response
        p.y += p.speedY + scrollVelocity;
        p.x +=
          Math.sin(frame * p.swaySpeed + p.swayOffset) * 0.65 +
          scrollVelocity * 0.08;
        p.rotation += p.rotationSpeed + scrollVelocity * 0.0015;

        // Reset particle smoothly when it moves past screen edges
        if (p.y > height + 25) {
          p.y = -20;
          p.x = Math.random() * width;
        } else if (p.y < -25) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }

        if (p.x > width + 25) p.x = -20;
        if (p.x < -25) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.type === 'sparkle') {
          // Luminous golden stardust with soft pulse
          const pulse = Math.sin(frame * 0.06 + p.swayOffset) * 0.3 + 0.8;
          ctx.fillStyle = `${p.color}${p.opacity * pulse})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.radiusX, 0, Math.PI * 2);
          ctx.fill();

          // Subtle diamond glow core
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * pulse * 0.75})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.radiusX * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'leaf') {
          // Delicate soft emerald/sage leaf
          ctx.rotate(p.rotation);
          ctx.fillStyle = `${p.color}${p.opacity})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Subtle center stem line
          ctx.strokeStyle = `rgba(197, 155, 67, ${p.opacity * 0.4})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(0, -p.radiusY * 0.8);
          ctx.lineTo(0, p.radiusY * 0.8);
          ctx.stroke();
        } else {
          // Graceful creamy ivory petal
          ctx.rotate(p.rotation);
          ctx.fillStyle = `${p.color}${p.opacity})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Delicate warm golden petal edge glow
          ctx.strokeStyle = `rgba(197, 155, 67, ${p.opacity * 0.25})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        ctx.restore();
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="wedding-bg-canvas"
      aria-hidden="true"
    />
  );
}
