import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function useMagneticCursor() {
  const isReducedMotion = useReducedMotion();
  const cursorRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [hoverText, setHoverText] = useState<string | null>(null);

  const currentTargetRef = useRef<HTMLElement | null>(null);
  const isHoveredRef = useRef(false);
  const hoverTextRef = useRef<string | null>(null);

  useEffect(() => {
    if (isReducedMotion || typeof window === "undefined") return;

    // Only activate for fine pointers (desktops/laptops)
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const resetCurrentTarget = () => {
      if (currentTargetRef.current) {
        currentTargetRef.current.style.transform = "";
        currentTargetRef.current = null;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;

      const target = (e.target as HTMLElement | null)?.closest(
        "a, button, [data-cursor-magnetic], .project-tab, .achievement-row, .mission-row, .protocol-node"
      ) as HTMLElement | null;

      if (target) {
        if (currentTargetRef.current && currentTargetRef.current !== target) {
          currentTargetRef.current.style.transform = "";
        }
        currentTargetRef.current = target;

        if (!isHoveredRef.current) {
          isHoveredRef.current = true;
          setIsHovered(true);
        }

        const text = target.getAttribute("data-cursor-text");
        if (hoverTextRef.current !== text) {
          hoverTextRef.current = text;
          setHoverText(text);
        }

        // Magnetic attraction pull
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;
        const deltaX = (e.clientX - centerX) * 0.22;
        const deltaY = (e.clientY - centerY) * 0.22;

        target.style.transform = `translate3d(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px, 0)`;
      } else {
        resetCurrentTarget();

        if (isHoveredRef.current) {
          isHoveredRef.current = false;
          setIsHovered(false);
        }
        if (hoverTextRef.current !== null) {
          hoverTextRef.current = null;
          setHoverText(null);
        }
      }
    };

    const onMouseLeaveDoc = () => {
      resetCurrentTarget();
      if (isHoveredRef.current) {
        isHoveredRef.current = false;
        setIsHovered(false);
      }
      if (hoverTextRef.current !== null) {
        hoverTextRef.current = null;
        setHoverText(null);
      }
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeaveDoc);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      resetCurrentTarget();
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeaveDoc);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isReducedMotion]);

  return { cursorRef, isHovered, isClicking, hoverText };
}
