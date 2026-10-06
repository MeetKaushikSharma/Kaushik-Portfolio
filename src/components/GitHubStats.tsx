import { useEffect, useState } from "react";
import { getGitHubStats, type GitHubStats } from "@/lib/github-server";
import { GITHUB_SNAPSHOT } from "@/lib/github-snapshot";

const CACHE_KEY = "gh_stats_meetkaushik_v2";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min client-side localStorage cache

type Cached = { stats: GitHubStats; savedAt: number };

const SNAPSHOT_STATS: GitHubStats = {
  publicRepos: GITHUB_SNAPSHOT.publicRepos,
  followers: GITHUB_SNAPSHOT.followers,
  totalCommits: GITHUB_SNAPSHOT.totalCommits,
  topLanguages: GITHUB_SNAPSHOT.topLanguages,
};

function readCache(): GitHubStats | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: Cached = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.stats;
  } catch {
    return null;
  }
}

function writeCache(stats: GitHubStats) {
  try {
    const entry: Cached = { stats, savedAt: Date.now() };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage is optional.
  }
}

let inFlightGhPromise: Promise<GitHubStats> | null = null;

function fetchStatsOnce(): Promise<GitHubStats> {
  if (!inFlightGhPromise) {
    inFlightGhPromise = getGitHubStats()
      .then((data) => {
        inFlightGhPromise = null;
        return data;
      })
      .catch((err) => {
        inFlightGhPromise = null;
        throw err;
      });
  }
  return inFlightGhPromise;
}

/** Hook that returns live GitHub stats, falling back to snapshot until fetched. */
export function useGitHubStats(): GitHubStats {
  const [stats, setStats] = useState<GitHubStats>(() => readCache() ?? SNAPSHOT_STATS);

  useEffect(() => {
    let cancelled = false;

    // Stale-while-revalidate: always fetch fresh stats in background
    fetchStatsOnce()
      .then((fresh) => {
        if (cancelled) return;
        if (fresh.publicRepos > 0 || fresh.totalCommits > 0) {
          setStats(fresh);
          writeCache(fresh);
        }
      })
      .catch(() => {
        // Fallback remains active
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}

/** Render just the public repo count as a drop-in span (matches LeetCodeSolvedCount API). */
export function GitHubRepoCount({
  className,
  suffix = "",
}: {
  className?: string;
  suffix?: string;
}) {
  const stats = useGitHubStats();
  return (
    <span
      className={className}
      style={{ font: "inherit", letterSpacing: "inherit", fontWeight: "inherit" }}
    >
      {stats.publicRepos}
      {suffix}
    </span>
  );
}
