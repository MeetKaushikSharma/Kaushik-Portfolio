import { useEffect, useState } from "react";

const CACHE_KEY = "lc_solved_meetkaushik";
const STATS_ENDPOINT = "/api/leetcode";
const SNAPSHOT_SOLVED = 360;

type LeetCodeSolvedCountProps = {
  className?: string;
  prefix?: string;
  suffix?: string;
  plus?: boolean;
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
    // The server snapshot remains available if browser storage is unavailable.
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
        // Keep the latest verified count visible during an upstream outage.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return solved;
}

export function LeetCodeSolvedCount({
  className,
  prefix = "",
  suffix = "",
  plus = true,
}: LeetCodeSolvedCountProps) {
  const solved = useLeetCodeSolved();
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
