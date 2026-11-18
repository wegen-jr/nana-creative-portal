"use client";

import React, { useEffect, useRef } from "react";

/**
 * High-performance 3D particle wave representing Nana Creative's Digital Growth
 * and Cinema-Grade Video Production aesthetics.
 */
export default function CinematicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle Grid Definition
    const cols = 55;
    const rows = 35;
    const spacingX = 40;
    const spacingY = 32;

    let step = 0;
    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep cinematic ambient background
      const grad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        100,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      grad.addColorStop(0, "#0B1A13"); // Deep emerald core
      grad.addColorStop(0.5, "#08101A"); // Midnight Navy abyss
      grad.addColorStop(1, "#03060A"); // Dark cinema vignette

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      step += 0.022;

      // 3D Perspective Projection Matrix Parameters
      const fov = 340;
      const originX = width / 2 + (mouseX - width / 2) * 0.05;
      const originY = height * 0.62 + (mouseY - height / 2) * 0.04;

      for (let ix = 0; ix < cols; ix++) {
        for (let iy = 0; iy < rows; iy++) {
          // World coordinates
          const x = (ix - cols / 2) * spacingX;
          const y = (iy - rows / 2) * spacingY;

          // Undulating dual sine wave simulating digital growth waves
          const distFromCenter = Math.sqrt(x * x + y * y);
          const wave1 = Math.sin(ix * 0.22 + step) * 28;
          const wave2 = Math.cos(iy * 0.18 + step * 0.8) * 24;
          const wave3 = Math.sin((distFromCenter * 0.015) - step * 1.5) * 18;
          const z = wave1 + wave2 + wave3 + (iy * 14);

          // Perspective transformation
          const depth = z + 500;
          if (depth <= 10) continue;

          const scale = fov / depth;
          const projX = originX + x * scale;
          const projY = originY + y * scale * 0.85;

          // Particle radius with depth scaling
          const radius = Math.max(0.6, (1.8 + Math.sin(step + ix * 0.1) * 0.8) * scale * 1.8);

          // Color interpolation: Emerald (#0B3B24) to Sprout Lime (#8CC63F)
          const normHeight = (z + 40) / 80;
          const isSprout = normHeight > 0.65;
          const alpha = Math.min(0.85, Math.max(0.12, (scale * 1.4)));

          ctx.beginPath();
          ctx.arc(projX, projY, radius, 0, Math.PI * 2);

          if (isSprout) {
            ctx.fillStyle = `rgba(140, 198, 63, ${alpha})`;
            ctx.shadowColor = "#8CC63F";
            ctx.shadowBlur = radius * 4;
          } else {
            ctx.fillStyle = `rgba(11, 59, 36, ${alpha})`;
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
    />
  );
}
