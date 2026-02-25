'use client';

import { useEffect, useRef } from 'react';

// Musical notation elements the quill "writes"
const STAFF_Y_START = 0.18; // Fraction of canvas height where first staff starts
const STAFF_SPACING = 0.16; // Gap between staves
const LINE_GAP = 8; // px between staff lines
const NOTE_HEADS = [
  // quarter/half note ovals
  (ctx: CanvasRenderingContext2D, x: number, y: number, filled: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 4.5, 0, 0, Math.PI * 2);
    if (filled) ctx.fill();
    else ctx.stroke();
    ctx.restore();
    // Stem
    ctx.beginPath();
    ctx.moveTo(x + 5.5, y);
    ctx.lineTo(x + 5.5, y - 28);
    ctx.stroke();
  },
  // eighth note with flag
  (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Stem
    ctx.beginPath();
    ctx.moveTo(x + 5.5, y);
    ctx.lineTo(x + 5.5, y - 30);
    ctx.stroke();
    // Flag
    ctx.beginPath();
    ctx.moveTo(x + 5.5, y - 30);
    ctx.quadraticCurveTo(x + 18, y - 22, x + 10, y - 14);
    ctx.stroke();
  },
  // whole note
  (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.15);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 2.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
];

// Treble clef drawn with bezier curves
function drawTrebleClef(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.7, 0.7);
  ctx.beginPath();
  // Main swirl
  ctx.moveTo(0, 20);
  ctx.bezierCurveTo(-8, 10, -6, -10, 2, -20);
  ctx.bezierCurveTo(10, -30, 14, -18, 8, -8);
  ctx.bezierCurveTo(2, 2, -4, 8, -2, 18);
  ctx.bezierCurveTo(0, 28, 10, 28, 12, 20);
  ctx.bezierCurveTo(14, 12, 6, 6, 2, 10);
  // Lower curl
  ctx.moveTo(2, 18);
  ctx.bezierCurveTo(4, 30, -2, 38, -4, 32);
  ctx.stroke();
  ctx.restore();
}

// Sharp sign
function drawSharp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.lineWidth = 1.5;
  // Vertical lines
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 10);
  ctx.lineTo(x - 3, y + 10);
  ctx.moveTo(x + 3, y - 10);
  ctx.lineTo(x + 3, y + 10);
  ctx.stroke();
  // Horizontal lines (slightly slanted)
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 3);
  ctx.lineTo(x + 7, y - 5);
  ctx.moveTo(x - 7, y + 5);
  ctx.lineTo(x + 7, y + 3);
  ctx.stroke();
  ctx.restore();
}

interface ScribeElement {
  type: 'staff-line' | 'clef' | 'note' | 'sharp' | 'rest' | 'bar';
  x: number;
  y: number;
  staffIndex: number;
  lineIndex?: number;
  noteVariant?: number;
  filled?: boolean;
  staffLineEndX?: number;
}

function buildTimeline(w: number, h: number): ScribeElement[] {
  const elements: ScribeElement[] = [];
  const numStaves = Math.floor((h * 0.7) / (STAFF_SPACING * h)) + 1;

  for (let s = 0; s < Math.min(numStaves, 4); s++) {
    const staffTop = h * STAFF_Y_START + s * h * STAFF_SPACING;

    // 5 staff lines
    for (let l = 0; l < 5; l++) {
      elements.push({
        type: 'staff-line',
        x: w * 0.06,
        y: staffTop + l * LINE_GAP,
        staffIndex: s,
        lineIndex: l,
        staffLineEndX: w * 0.94,
      });
    }

    // Treble clef at start
    elements.push({
      type: 'clef',
      x: w * 0.08,
      y: staffTop + 2 * LINE_GAP,
      staffIndex: s,
    });

    // Possible sharp/key signature
    if (s % 2 === 0) {
      elements.push({
        type: 'sharp',
        x: w * 0.14,
        y: staffTop + LINE_GAP,
        staffIndex: s,
      });
    }

    // Notes scattered across the staff
    const notePositions = [0.20, 0.28, 0.36, 0.42, 0.50, 0.58, 0.66, 0.74, 0.82, 0.90];
    for (const frac of notePositions) {
      // Skip some randomly (deterministic based on position)
      if (Math.sin(frac * 47 + s * 13) > 0.3) continue;

      const lineSlot = Math.floor(Math.abs(Math.sin(frac * 73 + s * 31)) * 8); // 0-7 (on/between lines)
      const noteY = staffTop + lineSlot * (LINE_GAP / 2);
      const variant = Math.floor(Math.abs(Math.sin(frac * 97 + s * 17)) * NOTE_HEADS.length);

      elements.push({
        type: 'note',
        x: w * frac,
        y: noteY,
        staffIndex: s,
        noteVariant: variant,
        filled: Math.sin(frac * 61 + s * 23) > 0,
      });
    }

    // Bar lines
    for (const frac of [0.45, 0.70, 0.94]) {
      elements.push({
        type: 'bar',
        x: w * frac,
        y: staffTop,
        staffIndex: s,
      });
    }
  }

  return elements;
}

interface QuillScribeBgProps {
  className?: string;
  /** Draw duration in ms — higher = slower/dreamier. Default 35s */
  drawDuration?: number;
}

export function QuillScribeBg({ className, drawDuration = 35000 }: QuillScribeBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maybeCtx = canvas.getContext('2d');
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();

    const w = window.innerWidth;
    const h = window.innerHeight;
    const timeline = buildTimeline(w, h);
    const totalElements = timeline.length;
    const DRAW_DURATION = drawDuration;
    const startTime = performance.now();

    // Quill position
    let quillX = w * 0.04;
    let quillY = h * STAFF_Y_START;

    function draw(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DRAW_DURATION, 1);
      const elementsToShow = Math.floor(progress * totalElements);

      ctx!.clearRect(0, 0, w, h);

      // Gold ink color
      ctx!.strokeStyle = 'rgba(201, 168, 76, 0.12)';
      ctx!.fillStyle = 'rgba(201, 168, 76, 0.10)';
      ctx!.lineWidth = 1.2;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';

      // Draw completed elements
      for (let i = 0; i < elementsToShow; i++) {
        const el = timeline[i];
        drawElement(ctx!, el, 1);
      }

      // Draw current element partially (ink appearing)
      if (elementsToShow < totalElements) {
        const currentEl = timeline[elementsToShow];
        if (currentEl) {
          const elProgress = (progress * totalElements) % 1;
          drawElement(ctx!, currentEl, elProgress);

          // Update quill position to current element
          quillX = currentEl.x;
          quillY = currentEl.y;
        }
      }

      // Draw the quill pen
      if (progress < 1) {
        drawQuill(ctx!, quillX, quillY, elapsed);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        // Loop: restart after a pause
        setTimeout(() => {
          if (canvasRef.current) {
            animRef.current = requestAnimationFrame(draw);
          }
        }, 3000);
        // Reset startTime for next loop by reassigning
        (draw as unknown as { startTime: number }).startTime = performance.now();
      }
    }

    // Restart support
    const drawWithRestart = (now: number) => {
      const actualStart = (drawWithRestart as unknown as { startTime?: number }).startTime || startTime;
      const elapsed = now - actualStart;
      const progress = Math.min(elapsed / DRAW_DURATION, 1);
      const elementsToShow = Math.floor(progress * totalElements);

      ctx!.clearRect(0, 0, w, h);

      ctx!.strokeStyle = 'rgba(201, 168, 76, 0.12)';
      ctx!.fillStyle = 'rgba(201, 168, 76, 0.10)';
      ctx!.lineWidth = 1.2;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';

      for (let i = 0; i < Math.min(elementsToShow, totalElements); i++) {
        drawElement(ctx!, timeline[i], 1);
      }

      if (elementsToShow < totalElements) {
        const currentEl = timeline[elementsToShow];
        if (currentEl) {
          const elProgress = (progress * totalElements) % 1;
          drawElement(ctx!, currentEl, elProgress);
          quillX = currentEl.x;
          quillY = currentEl.y;
        }
      }

      if (progress < 1) {
        drawQuill(ctx!, quillX, quillY, elapsed);
        animRef.current = requestAnimationFrame(drawWithRestart);
      } else {
        // Pause then restart
        setTimeout(() => {
          if (canvasRef.current) {
            (drawWithRestart as unknown as { startTime?: number }).startTime = performance.now();
            animRef.current = requestAnimationFrame(drawWithRestart);
          }
        }, 4000);
      }
    };

    animRef.current = requestAnimationFrame(drawWithRestart);

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className || "fixed inset-0 pointer-events-none z-0"}
      aria-hidden="true"
    />
  );
}

function drawElement(ctx: CanvasRenderingContext2D, el: ScribeElement, progress: number) {
  ctx.save();
  ctx.globalAlpha = progress;

  switch (el.type) {
    case 'staff-line': {
      const endX = el.staffLineEndX || el.x + 400;
      const drawToX = el.x + (endX - el.x) * progress;
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(drawToX, el.y);
      ctx.stroke();
      break;
    }
    case 'clef':
      drawTrebleClef(ctx, el.x, el.y);
      break;
    case 'sharp':
      drawSharp(ctx, el.x, el.y);
      break;
    case 'note':
      if (el.noteVariant !== undefined && NOTE_HEADS[el.noteVariant]) {
        NOTE_HEADS[el.noteVariant](ctx, el.x, el.y, el.filled ?? true);
      }
      break;
    case 'bar':
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x, el.y + 4 * LINE_GAP);
      ctx.stroke();
      break;
  }

  ctx.restore();
}

function drawQuill(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  // Slight bob animation
  const bob = Math.sin(time * 0.003) * 2;
  const tx = x + 8;
  const ty = y - 12 + bob;

  ctx.translate(tx, ty);
  ctx.rotate(-0.6); // angled like writing

  // Feather shaft
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-30, -40);
  ctx.stroke();

  // Feather barbs (left side)
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.18)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const sx = -30 * t;
    const sy = -40 * t;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx - 12, sy - 6, sx - 18, sy + 2);
    ctx.stroke();
  }

  // Feather barbs (right side)
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const sx = -30 * t;
    const sy = -40 * t;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + 8, sy - 8, sx + 14, sy - 2);
    ctx.stroke();
  }

  // Nib
  ctx.fillStyle = 'rgba(201, 168, 76, 0.4)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-3, 6);
  ctx.lineTo(0, 8);
  ctx.lineTo(3, 6);
  ctx.closePath();
  ctx.fill();

  // Ink drop glow at tip
  const glowAlpha = 0.15 + Math.sin(time * 0.005) * 0.08;
  ctx.fillStyle = `rgba(201, 168, 76, ${glowAlpha})`;
  ctx.beginPath();
  ctx.arc(0, 8, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
