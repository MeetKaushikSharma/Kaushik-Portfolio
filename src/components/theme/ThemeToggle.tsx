import { Moon, Sun } from "lucide-react";
import type { Theme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  isTransitioning?: boolean;
  className?: string;
}

export function ThemeToggle({
  theme,
  onToggle,
  isTransitioning = false,
  className = "",
}: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isTransitioning}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      data-cursor-text="THEME"
      className={`group relative inline-flex h-8 items-center gap-1.5 border border-border bg-background/80 px-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all hover:border-foreground hover:text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 cursor-pointer ${className}`}
    >
      <span className="relative flex h-3.5 w-3.5 items-center justify-center overflow-hidden">
        {/* Animated Sun / Moon icon rotation */}
        <Sun
          className={`absolute h-3.5 w-3.5 transition-all duration-300 ${
            isDark
              ? "rotate-0 scale-100 opacity-100 text-amber-400"
              : "rotate-90 scale-0 opacity-0 text-muted-foreground"
          }`}
        />
        <Moon
          className={`absolute h-3.5 w-3.5 transition-all duration-300 ${
            isDark
              ? "-rotate-90 scale-0 opacity-0 text-muted-foreground"
              : "rotate-0 scale-100 opacity-100 text-slate-700"
          }`}
        />
      </span>
      <span className="hidden sm:inline font-mono">
        {isDark ? "LIGHT" : "DARK"}
      </span>
    </button>
  );
}
