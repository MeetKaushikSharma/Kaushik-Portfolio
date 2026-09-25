import { useEffect, useState } from "react";

const LEETCODE_USERNAME = "meetkaushik";
// alfa-leetcode-api: actively maintained, CORS *, returns { totalSolved, ... }
const STATS_ENDPOINT = `https://alfa-leetcode-api.onrender.com/userProfile/${LEETCODE_USERNAME}`;
const CACHE_KEY = `lc_solved_${LEETCODE_USERNAME}`;

function readCache(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(value: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, String(value));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

/**
 * Live LeetCode solved-problem count for `meetkaushik`.
 * No hardcoded seed number: the very first successful fetch a visitor's
 * browser makes is written to localStorage, and every subsequent load
 * (for that visitor) shows that cached number instantly while a fresh
 * fetch runs silently in the background and updates the cache again.
 * If a fetch ever fails, nothing is overwritten — the last good cached
 * value simply keeps showing.
 */
export function useLeetCodeSolved(): number | null {
  const [solved, setSolved] = useState<number | null>(() => readCache());

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // 10 s timeout — guards against Render cold-start stalls
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    fetch(STATS_ENDPOINT, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: { totalSolved?: number }) => {
        if (cancelled) return;
        if (typeof json.totalSolved === "number" && json.totalSolved > 0) {
          setSolved(json.totalSolved);
          writeCache(json.totalSolved);
        }
      })
      .catch(() => {
        // Silent by design: keep showing whatever is cached (or nothing yet).
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  return solved;
}

type LeetCodeSolvedCountProps = {
  className?: string;
  prefix?: string;
  suffix?: string;
  /** Rendered only until the first real number (cached or live) is known. */
  placeholder?: string;
};

/**
 * Drop-in inline number — inherits the caller's typography via
 * `className`, so it sits directly inside existing stat grids
 * (mega-number cells, quick-facts rows, etc.) instead of its own card.
 */
export function LeetCodeSolvedCount({
  className,
  prefix = "",
  suffix = "",
  placeholder = "—",
}: LeetCodeSolvedCountProps) {
  const solved = useLeetCodeSolved();

  if (solved === null) {
    return <span className={className} style={{ font: "inherit", textTransform: "inherit" }}>{placeholder}</span>;
  }

  return (
    <span className={className} style={{ font: "inherit", textTransform: "inherit" }}>
      {prefix}
      {solved}
      {suffix}
    </span>
  );
}
