import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSoundDesign } from "@/hooks/useSoundDesign";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

interface EvidenceCollectorProps {
  active: boolean;
  targetX?: number; // 0..1 normalized screen position
  targetY?: number;
  count?: number;
  label?: string;
  onDone?: () => void;
}

export function EvidenceCollector({
  active,
  targetX = 0.9,
  targetY = 0.5,
  count = 6,
  label = "EVIDENCE",
  onDone,
}: EvidenceCollectorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const isReducedMotion = useReducedMotion();
  const { sounds } = useSoundDesign();

  useEffect(() => {
    if (!active || isReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Spawn particles at mouse position (centre of screen)
    const spawn = () => {
      const cx = window.innerWidth * 0.5;
      const cy = window.innerHeight * 0.5;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          id: Math.random(),
          x: cx + (Math.random() - 0.5) * 40,
          y: cy + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 8 + (targetX * 2 - 1) * 4,
          vy: (Math.random() - 0.5) * 8 + (targetY * 2 - 1) * 4,
          life: 1.0,
          size: Math.random() * 4 + 2,
        });
      }
      sounds.collect();
    };

    spawn();

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current
        .map((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.vy += 0.05; // gravity
          p.life -= 0.012;
          return p;
        })
        .filter((p) => p.life > 0);

      for (const p of particlesRef.current) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${p.life * 0.9})`;
        ctx.shadowColor = "rgba(255,255,255,0.8)";
        ctx.shadowBlur = 10;
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw a label at the target
      ctx.font = "600 10px 'IBM Plex Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "center";
      ctx.fillText(
        label,
        canvas.width * targetX,
        canvas.height * targetY - 18
      );

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDone?.();
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active, count, targetX, targetY, label, onDone, isReducedMotion, sounds]);

  if (isReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}