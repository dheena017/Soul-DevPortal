import React, { useRef, useEffect } from 'react';

export interface Hero3DCanvasProps {
  className?: string;
  height?: string;
  interactive?: boolean;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  baseAlpha: number;
}

export default function Hero3DCanvas({
  className = '',
  height = '100%',
  interactive = true,
}: Hero3DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let heightPx = 0;

    // Mouse coordinates in normalized [-1, 1] range
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    // 3D Particles setup
    const PARTICLE_COUNT = 38;
    const particles: Particle3D[] = [];

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: (Math.random() - 0.5) * 800,
          y: (Math.random() - 0.5) * 450,
          z: Math.random() * 600 + 100,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          vz: (Math.random() - 0.5) * 0.25,
          radius: Math.random() * 1.8 + 1.2,
          baseAlpha: Math.random() * 0.4 + 0.3,
        });
      }
    };

    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      heightPx = rect.height;

      canvas.width = width * dpr;
      canvas.height = heightPx * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    initParticles();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Pause when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    // Camera 3D parameters
    const FOCAL_LENGTH = 450;
    let gridOffset = 0;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, heightPx);

      const cx = width / 2;
      const cy = heightPx / 2;

      // ── 1. Perspective Horizon Grid (Website Theme Colors: #2563eb / #1e293b) ──
      const gridY = cy + 40;
      gridOffset = (gridOffset + 0.35) % 30;

      ctx.save();
      ctx.lineWidth = 1;

      // Vanishing point perspective lines
      const vanishingX = cx + mouseX * 45;
      const vanishingY = cy - 20 + mouseY * 25;

      for (let x = -width * 0.5; x <= width * 1.5; x += 65) {
        const grad = ctx.createLinearGradient(vanishingX, vanishingY, x, heightPx);
        grad.addColorStop(0, 'rgba(37, 99, 235, 0)');
        grad.addColorStop(0.3, 'rgba(37, 99, 235, 0.04)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0.18)');

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(vanishingX, vanishingY);
        ctx.lineTo(x, heightPx);
        ctx.stroke();
      }

      // Horizontal depth lines
      for (let d = 20; d < 220; d += 22) {
        const z = (d + gridOffset) / 220;
        const lineY = gridY + Math.pow(z, 2.2) * (heightPx - gridY);
        const alpha = Math.min(z * 0.22, 0.2);

        ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(width, lineY);
        ctx.stroke();
      }
      ctx.restore();

      // ── 2. Floating 3D Constellation Nodes & Connections ──
      // Projected 2D points storage for line drawing
      const projected: Array<{ px: number; py: number; alpha: number; z: number }> = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move particle
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Boundaries wrap-around in 3D box
        if (p.x < -400) p.x = 400;
        if (p.x > 400) p.x = -400;
        if (p.y < -220) p.y = 220;
        if (p.y > 220) p.y = -220;
        if (p.z < 100) p.z = 700;
        if (p.z > 700) p.z = 100;

        // Apply mouse camera parallax
        const rotY = mouseX * 0.25;
        const rotX = mouseY * 0.15;

        // 3D rotation around Y and X axes
        const rx = p.x * Math.cos(rotY) - p.z * Math.sin(rotY);
        const rz = p.x * Math.sin(rotY) + p.z * Math.cos(rotY);
        const ry = p.y * Math.cos(rotX) - rz * Math.sin(rotX);
        const finalZ = Math.max(ry * Math.sin(rotX) + rz * Math.cos(rotX), 50);

        // Perspective 3D projection
        const scale = FOCAL_LENGTH / (FOCAL_LENGTH + finalZ);
        const px = cx + rx * scale;
        const py = cy + ry * scale;

        const depthAlpha = Math.max(0.1, (1 - finalZ / 750) * p.baseAlpha);

        projected.push({ px, py, alpha: depthAlpha, z: finalZ });

        // Draw node
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.8, p.radius * scale * 1.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96, 165, 250, ${depthAlpha})`;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw connecting lines between nearby 3D nodes
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * Math.min(p1.alpha, p2.alpha) * 0.7;
            ctx.strokeStyle = `rgba(59, 130, 246, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block opacity-75" />
      {/* Subtle bottom fade gradient into page background */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
    </div>
  );
}
