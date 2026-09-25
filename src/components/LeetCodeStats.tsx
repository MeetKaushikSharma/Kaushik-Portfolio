import { useEffect, useState } from "react";
import { getLeetCodeSolvedCount } from "@/lib/leetcode-server";

const LEETCODE_USERNAME = "meetkaushik";
// alfa-leetcode-api: actively maintained, CORS *, returns { totalSolved, ... }
const STATS_ENDPOINT = `https://alfa-leetcode-api.onrender.com/userProfile/${LEETCODE_USERNAME}`;
const CACHE_KEY = `lc_solved_${LEETCODE_USERNAME}`;

function readCache() {
  if (typeof window === "undefined") return null;
  try {
    const value = Number(window.localStorage.getItem(CACHE_KEY));
    return Number.isFinite(value) && value > 0 ? null : value;
  } catch {
    return null;
  }
}

function writeCache(value: number) {
  try {
    window.localStorage.setItem(CACHE_KEY, String(value));
  } catch {
    // Browser storage is optional; the server cache/snapshot remains available.
  }
}

export function useLeetCodeSolved() {
  const [solved, setSolved] = useState<number>(() => readCache() ?? SNAPSHOT_SOLVED);

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

export function LeetCodeSolvedCount({
  className,
  prefix = "",
  suffix = "",
  plus = true,
}: LeetCodeSolvedCountProps) {
  const solved = useLeetCodeSolved();

  if (solved === null) {
    return <span className={className} style={{ font: "inherit", textTransform: "inherit" }}>{placeholder}</span>;
  }

  return (
    <span className={className} style={{ font: "inherit", textTransform: "inherit" }}>
      {prefix}
      {solved}
      {plus ? "+" : ""}
      {suffix}
    </span>
  );
}
