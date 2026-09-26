/**
 * Centralised guard for `prefers-reduced-motion`.
 *
 * Every animation layer (GSAP, Three.js, CSS, Web Audio) must consult this
 * hook before running. Keeping it in one place prevents the common bug where
 * one layer disables motion but another keeps running.
 */
import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return reduced;
}