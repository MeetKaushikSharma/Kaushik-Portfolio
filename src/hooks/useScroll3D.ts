/**
 * useScroll3D
 *
 * Bridges Lenis scroll state into Three.js uniforms so WebGL scenes can
 * react to the user's scroll position (parallax, velocity-driven motion).
 *
 * Returns a live object that React Three Fiber / raw Three.js code can read
 * each frame. The values are mutated in place (no React state churn) so the
 * render loop stays at 60fps.
 */
import { useEffect, useRef } from "react";

export type Scroll3D = {
  y: number;          // current scroll Y
  vel: number;        // instantaneous scroll velocity (px/frame)
  dir: number;        // -1 up, +1 down
  progress: number;   // 0..1 of total document height
};

export function useScroll3D() {
  const ref = useRef<Scroll3D>({
    y: 0,
    vel: 0,
    dir: 0,
    progress: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastY = window.scrollY;
    let lastT = performance.now();

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(1, now - lastT);
      const dy = y - lastY;
      ref.current.vel = (dy / dt) * 16.67; // normalise to ~1 frame at 60fps
      ref.current.dir = dy > 0 ? 1 : dy < 0 ? -1 : ref.current.dir;
      ref.current.y = y;
      lastY = y;
      lastT = now;
    };

    const updateProgress = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      ref.current.progress = Math.min(1, Math.max(0, window.scrollY / max));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return ref;
}