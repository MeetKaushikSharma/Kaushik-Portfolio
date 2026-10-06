import { createServerFn } from "@tanstack/react-start";
import { GITHUB_SNAPSHOT } from "@/lib/github-snapshot";

const GH_API = "https://api.github.com";
const USERNAME = GITHUB_SNAPSHOT.username;
const CACHE_MS = 10 * 60 * 1000; // 10-minute server-side cache

export type GitHubStats = {
  publicRepos: number;
  followers: number;
  totalCommits: number;
  topLanguages: number;
};

// In-memory server cache
let cache: { stats: GitHubStats; updatedAt: number } = {
  stats: {
    publicRepos: GITHUB_SNAPSHOT.publicRepos,
    followers: GITHUB_SNAPSHOT.followers,
    totalCommits: GITHUB_SNAPSHOT.totalCommits,
    topLanguages: GITHUB_SNAPSHOT.topLanguages,
  },
  updatedAt: 0,
};

function ghHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "kaushik-portfolio/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function fetchWithFallback<T>(url: string, fallback: T, timeoutMs = 5000): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: ghHeaders(),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const getGitHubStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<GitHubStats> => {
    if (Date.now() - cache.updatedAt < CACHE_MS) return cache.stats;

    try {
      // 1. User profile (fast single fetch)
      type GHUser = { public_repos?: number; followers?: number };
      const userPromise = fetchWithFallback<GHUser>(
        `${GH_API}/users/${USERNAME}`,
        { public_repos: cache.stats.publicRepos, followers: cache.stats.followers },
        5000,
      );

      // 2. Public repos for language diversity and count
      type GHRepo = { name: string; fork: boolean; language: string | null };
      const reposPromise = fetchWithFallback<GHRepo[]>(
        `${GH_API}/users/${USERNAME}/repos?per_page=100&type=public`,
        [],
        5000,
      );

      const [user, repos] = await Promise.all([userPromise, reposPromise]);

      const languages = new Set(
        repos.filter((r) => r && r.language).map((r) => r.language as string),
      );

      const fresh: GitHubStats = {
        publicRepos:
          typeof user.public_repos === "number" && user.public_repos > 0
            ? user.public_repos
            : cache.stats.publicRepos,
        followers:
          typeof user.followers === "number" ? user.followers : cache.stats.followers,
        totalCommits: GITHUB_SNAPSHOT.totalCommits,
        topLanguages: languages.size > 0 ? languages.size : GITHUB_SNAPSHOT.topLanguages,
      };

      cache = { stats: fresh, updatedAt: Date.now() };
    } catch {
      // Retain last known good values
    }

    return cache.stats;
  },
);
