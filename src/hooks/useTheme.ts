import { useCallback, useEffect, useRef, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "ks_theme";

interface UseThemeOptions {
  onThemeChange?: (newTheme: Theme) => void;
}

export function useTheme(options?: UseThemeOptions) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetTheme, setTargetTheme] = useState<Theme | null>(null);
  const isHydratedRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const targetThemeRef = useRef<Theme | null>(null);
  targetThemeRef.current = targetTheme;
  const themeRef = useRef<Theme>(theme);
  themeRef.current = theme;

  // Clean client hydration
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    let initial: Theme = "light";
    if (stored === "dark" || stored === "light") {
      initial = stored;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      initial = "dark";
    }

    setTheme(initial);
    themeRef.current = initial;
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    isHydratedRef.current = true;
  }, []);

  const startToggle = useCallback(() => {
    if (typeof window === "undefined") return;
    const currentTheme = themeRef.current;
    const next: Theme = currentTheme === "dark" ? "light" : "dark";
    targetThemeRef.current = next;
    setTargetTheme(next);
    setIsTransitioning(true);
  }, []);

  const commitSwap = useCallback(() => {
    const next = targetThemeRef.current;
    if (!next || typeof window === "undefined") return;
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setTheme(next);
    themeRef.current = next;
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("ks-theme-change", { detail: { theme: next } }));
    optionsRef.current?.onThemeChange?.(next);
  }, []);

  const finishTransition = useCallback(() => {
    setIsTransitioning(false);
    setTargetTheme(null);
    targetThemeRef.current = null;
  }, []);

  return {
    theme,
    isTransitioning,
    targetTheme,
    startToggle,
    commitSwap,
    finishTransition,
  };
}
