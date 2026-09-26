import { useEffect, useRef, useState } from "react";
import { useMagneticCursor } from "@/hooks/useMagneticCursor";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const { cursorRef, isHovered, isClicking, hoverText } = useMagneticCursor();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let rafId: number;
    const lag = { x: 0, y: 0 };

    const tick = () => {
      lag.x += (cursorRef.current.x - lag.x) * 0.18;
      lag.y += (cursorRef.current.y - lag.y) * 0.18;

      dot.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0) translate(-50%, -50%)`;

      rafId = requestAnimationFrame(tick);
    };

    tick();

    return () => cancelAnimationFrame(rafId);
  }, [cursorRef]);

  return (
    <>
      <div
        ref={dotRef}
        className="custom-cursor-dot"
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className={`custom-cursor-ring ${isHovered ? "is-hover" : ""} ${isClicking ? "is-clicking" : ""}`}
        aria-hidden="true"
      >
        {hoverText && (
          <span className="custom-cursor-label">{hoverText}</span>
        )}
      </div>
    </>
  );
}