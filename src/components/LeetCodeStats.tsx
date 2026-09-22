import { useEffect, useState } from "react";

const LEETCODE_USERNAME = "meetkaushik";
const STATS_ENDPOINT = "/api/leetcode";
const CACHE_KEY = `lc_solved_${LEETCODE_USERNAME}`;

type LeetCodeFetchState = "syncing" | "ready" | "unavailable";

function readCache(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
export function useLeetCodeSolved(): { solved: number | null; state: LeetCodeFetchState } {
  const [solved, setSolved] = useState<number | null>(() => readCache());
  const [state, setState] = useState<LeetCodeFetchState>(() =>
    readCache() === null ? "syncing" : "ready",
  );

  useEffect(() => {
    let cancelled = false;
    const hadCachedValue = readCache() !== null;

    fetch(STATS_ENDPOINT)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: { totalSolved?: number }) => {
        if (cancelled) return;
        if (typeof json.totalSolved === "number" && json.totalSolved > 0) {
          setSolved(json.totalSolved);
          setState("ready");
          writeCache(json.totalSolved);
          return;
        }
        throw new Error("Invalid LeetCode response");
      })
      .catch(() => {
        if (cancelled) return;
        if (!hadCachedValue) {
          setState("unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { solved, state };
}

type LeetCodeSolvedCountProps = {
  className?: string;
  prefix?: string;
  suffix?: string;
  /** Rendered only until the first real number (cached or live) is known. */
  syncingLabel?: string;
  unavailableLabel?: string;
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
  syncingLabel = "SYNCING",
  unavailableLabel = "UNAVAILABLE",
}: LeetCodeSolvedCountProps) {
  const { solved, state } = useLeetCodeSolved();

  if (solved === null) {
    return (
      <span className={className}>{state === "unavailable" ? unavailableLabel : syncingLabel}</span>
    );
  }

  return (
    <span className={className}>
      {prefix}
      {solved}
      {suffix}
    </span>
  );
}
