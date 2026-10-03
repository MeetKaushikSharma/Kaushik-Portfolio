import { useEffect, useState } from "react";
import { getGFGSolvedCount } from "@/lib/gfg-server";
import { GFG_SNAPSHOT } from "@/lib/gfg-snapshot";

const CACHE_KEY = "gfg_solved_printkaushik";
const CACHE_TTL_MS = 10 * 60 * 1000;

function readCache(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { value, savedAt } = JSON.parse(raw) as { value: number; savedAt: number };
    if (Date.now() - savedAt > CACHE_TTL_MS) return null;
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeCache(value: number) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ value, savedAt: Date.now() }));
  } catch {
    // Storage optional.
  }
}

function useGFGSolved() {
  const [solved, setSolved] = useState<number>(GFG_SNAPSHOT.problemsSolved);

  useEffect(() => {
    const cached = readCache();
    if (cached) setSolved(cached);

    let cancelled = false;

    getGFGSolvedCount()
      .then((value) => {
        if (cancelled || !Number.isFinite(value) || value <= 0) return;
        setSolved(value);
        writeCache(value);
      })
      .catch(() => {
        // Never replace a good number with an error state.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return solved;
}

/** Drop-in span — same API as LeetCodeSolvedCount. */
export function GFGSolvedCount({
  className,
  prefix = "",
  suffix = "",
  plus = false,
}: {
  className?: string;
  prefix?: string;
  suffix?: string;
  plus?: boolean;
}) {
  const solved = useGFGSolved();
  return (
    <span
      className={className}
      style={{ font: "inherit", letterSpacing: "inherit", fontWeight: "inherit" }}
    >
      {prefix}
      {solved}
      {plus ? "+" : ""}
      {suffix}
    </span>
  );
}
