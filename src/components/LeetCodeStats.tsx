import { useEffect, useState } from "react";
import { getLeetCodeSolvedCount } from "@/lib/leetcode-server";

const CACHE_KEY = "lc_solved_meetkaushik";
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
    // Browser storage is optional; the server cache/snapshot remains available.
  }
}

function useLeetCodeSolved() {
  const [solved, setSolved] = useState<number>(SNAPSHOT_SOLVED);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setSolved(cached);
    }

    let cancelled = false;

    getLeetCodeSolvedCount()
      .then((value) => {
        if (cancelled || !Number.isFinite(value) || value <= 0) return;
        setSolved(value);
        writeCache(value);
      })
      .catch(() => {
        // Never replace a recruiter-facing number with an error state.
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
