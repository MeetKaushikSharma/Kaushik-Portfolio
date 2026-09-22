import { useEffect, useState } from "react";

const CACHE_KEY = "lc_solved_meetkaushik";
const STATS_ENDPOINT = "/api/leetcode";
const SNAPSHOT_SOLVED = 360;

type LeetCodeSolvedCountProps = {
  className?: string;
  prefix?: string;
  suffix?: string;
};

function readCache() {
  if (typeof window === "undefined") return null;
  try {
    const value = Number(window.localStorage.getItem(CACHE_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeCache(value: number) {
  try {
    window.localStorage.setItem(CACHE_KEY, String(value));
  } catch {
    // Storage can be unavailable in private browsing; the server snapshot remains available.
  }
}

export function useLeetCodeSolved() {
  const [solved, setSolved] = useState<number>(() => readCache() ?? SNAPSHOT_SOLVED);

  useEffect(() => {
    let cancelled = false;

    fetch(STATS_ENDPOINT)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((payload: { totalSolved?: unknown }) => {
        const value = payload.totalSolved;
        if (cancelled || typeof value !== "number" || !Number.isFinite(value) || value <= 0) return;
        setSolved(value);
        writeCache(value);
      })
      .catch(() => {
        // Keep the latest local/server-confirmed value visible if the endpoint is temporarily unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return solved;
}

export function LeetCodeSolvedCount({ className, prefix = "", suffix = "" }: LeetCodeSolvedCountProps) {
  const solved = useLeetCodeSolved();
  return (
    <span className={className}>
      {prefix}
      {solved}
      {suffix}
    </span>
  );
}
