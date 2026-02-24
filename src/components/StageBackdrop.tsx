'use client';

import { useEffect, useRef } from 'react';

// Blurred audience-POV stage view: pulsing lights, shadowy figures, gaussian blur
export function StageBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maybeCtx = canvas.getContext('2d');
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Stage geometry
    const stageTop = () => h * 0.25;
    const stageBottom = () => h * 0.75;
    const stageLeft = () => w * 0.1;
    const stageRight = () => w * 0.9;

    // Spotlights: position, color, phase offset
    const spotlights = [
      { xFrac: 0.25, color: [220, 180, 60], phase: 0, speed: 0.8 },
      { xFrac: 0.50, color: [200, 60, 80], phase: 2, speed: 1.2 },
      { xFrac: 0.75, color: [80, 100, 220], phase: 4, speed: 0.6 },
      { xFrac: 0.35, color: [180, 120, 200], phase: 1.5, speed: 1.0 },
      { xFrac: 0.65, color: [220, 200, 100], phase: 3.5, speed: 0.9 },
    ];

    // Shadowy figures
    const figures = [
      { xFrac: 0.20, scale: 0.9, phase: 0, swaySpeed: 0.5 },
      { xFrac: 0.35, scale: 1.0, phase: 1.2, swaySpeed: 0.7 },
      { xFrac: 0.50, scale: 1.1, phase: 0.5, swaySpeed: 0.4 },
      { xFrac: 0.65, scale: 1.0, phase: 2.0, swaySpeed: 0.6 },
      { xFrac: 0.80, scale: 0.9, phase: 1.8, swaySpeed: 0.8 },
    ];

    function drawFrame(time: number) {
      const t = time * 0.001; // seconds
      ctx.clearRect(0, 0, w, h);

      // Deep stage background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#08070A');
      bgGrad.addColorStop(0.3, '#0E0A14');
      bgGrad.addColorStop(0.6, '#12081A');
      bgGrad.addColorStop(1, '#08070A');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Stage floor — perspective trapezoid with warm wood color
      ctx.save();
      ctx.fillStyle = 'rgba(42, 31, 22, 0.4)';
      ctx.beginPath();
      ctx.moveTo(stageLeft(), stageBottom());
      ctx.lineTo(stageRight(), stageBottom());
      ctx.lineTo(w * 0.95, h * 0.92);
      ctx.lineTo(w * 0.05, h * 0.92);
      ctx.closePath();
      ctx.fill();

      // Stage floor planks
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const frac = i / 8;
        const y = stageBottom() + frac * (h * 0.92 - stageBottom());
        ctx.beginPath();
        ctx.moveTo(w * (0.1 - frac * 0.05), y);
        ctx.lineTo(w * (0.9 + frac * 0.05), y);
        ctx.stroke();
      }
      ctx.restore();

      // Back wall
      ctx.fillStyle = 'rgba(26, 15, 30, 0.5)';
      ctx.fillRect(stageLeft(), stageTop(), stageRight() - stageLeft(), stageBottom() - stageTop());

      // Spotlights — cones of light from above
      for (const spot of spotlights) {
        const intensity = 0.5 + 0.5 * Math.sin(t * spot.speed + spot.phase);
        const pulseAlpha = 0.03 + intensity * 0.06;
        const cx = w * spot.xFrac;
        const [r, g, b] = spot.color;

        // Light cone
        const grad = ctx.createRadialGradient(cx, stageTop() - 20, 0, cx, stageBottom(), h * 0.35);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${pulseAlpha * 1.5})`);
        grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${pulseAlpha * 0.6})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Floor reflection
        const floorGrad = ctx.createRadialGradient(cx, stageBottom(), 0, cx, stageBottom(), w * 0.12);
        floorGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${pulseAlpha * 0.8})`);
        floorGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, stageBottom() - 20, w, h * 0.3);
      }

      // Shadowy performer figures
      for (const fig of figures) {
        const sway = Math.sin(t * fig.swaySpeed + fig.phase) * 6;
        const bobY = Math.sin(t * fig.swaySpeed * 1.3 + fig.phase) * 3;
        const cx = w * fig.xFrac + sway;
        const figH = h * 0.18 * fig.scale;
        const figW = figH * 0.3;
        const baseY = stageBottom() - 5 + bobY;

        ctx.save();
        ctx.globalAlpha = 0.15 + Math.sin(t * 0.3 + fig.phase) * 0.05;

        // Body silhouette
        ctx.fillStyle = '#0A0610';
        ctx.beginPath();
        // Head
        ctx.arc(cx, baseY - figH + figW * 0.5, figW * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Torso
        ctx.beginPath();
        ctx.moveTo(cx - figW * 0.6, baseY - figH + figW);
        ctx.lineTo(cx + figW * 0.6, baseY - figH + figW);
        ctx.lineTo(cx + figW * 0.8, baseY - figH * 0.3);
        ctx.lineTo(cx - figW * 0.8, baseY - figH * 0.3);
        ctx.closePath();
        ctx.fill();
        // Legs
        ctx.beginPath();
        ctx.moveTo(cx - figW * 0.4, baseY - figH * 0.3);
        ctx.lineTo(cx - figW * 0.5, baseY);
        ctx.lineTo(cx - figW * 0.15, baseY);
        ctx.lineTo(cx, baseY - figH * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx, baseY - figH * 0.3);
        ctx.lineTo(cx + figW * 0.15, baseY);
        ctx.lineTo(cx + figW * 0.5, baseY);
        ctx.lineTo(cx + figW * 0.4, baseY - figH * 0.3);
        ctx.closePath();
        ctx.fill();

        // Arms with slight movement
        const armAngle = Math.sin(t * fig.swaySpeed * 0.8 + fig.phase + 1) * 0.15;
        ctx.save();
        ctx.translate(cx - figW * 0.6, baseY - figH + figW * 1.2);
        ctx.rotate(-0.3 + armAngle);
        ctx.fillRect(0, 0, figW * 0.2, figH * 0.35);
        ctx.restore();
        ctx.save();
        ctx.translate(cx + figW * 0.4, baseY - figH + figW * 1.2);
        ctx.rotate(0.3 - armAngle);
        ctx.fillRect(0, 0, figW * 0.2, figH * 0.35);
        ctx.restore();

        ctx.restore();
      }

      // Audience heads at bottom (dark silhouettes)
      ctx.save();
      ctx.fillStyle = '#050308';
      ctx.globalAlpha = 0.25;
      const headRow = h * 0.93;
      for (let i = 0; i < 20; i++) {
        const hx = (w / 20) * i + (w / 40);
        const headBob = Math.sin(t * 0.4 + i * 0.7) * 1.5;
        ctx.beginPath();
        ctx.arc(hx, headRow + headBob, w * 0.02, 0, Math.PI * 2);
        ctx.fill();
        // Shoulders
        ctx.beginPath();
        ctx.ellipse(hx, headRow + w * 0.025 + headBob, w * 0.03, w * 0.015, 0, 0, Math.PI);
        ctx.fill();
      }
      ctx.restore();

      // Vignette overlay
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(8, 7, 10, 0.6)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(drawFrame);
    }

    animRef.current = requestAnimationFrame(drawFrame);

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ filter: 'blur(8px)' }}
      aria-hidden="true"
    />
  );
}
