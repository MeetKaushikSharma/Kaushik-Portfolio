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

// In-memory server cache (survives across requests within the same worker instance)
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

async function fetchWithFallback<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers: ghHeaders() });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

async function getTotalCommits(repos: Array<{ name: string; fork: boolean }>): Promise<number> {
  const ownRepos = repos.filter((r) => !r.fork).slice(0, 20); // cap API calls

  const counts = await Promise.all(
    ownRepos.map(async (repo) => {
      type Contributor = { login: string; contributions: number };
      const contributors = await fetchWithFallback<Contributor[]>(
        `${GH_API}/repos/${USERNAME}/${repo.name}/contributors?per_page=100`,
        [],
      );
      const mine = contributors.find((c) => c.login.toLowerCase() === USERNAME.toLowerCase());
      return mine?.contributions ?? 0;
    }),
  );

  return counts.reduce((sum, n) => sum + n, 0);
}

export const getGitHubStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<GitHubStats> => {
    if (Date.now() - cache.updatedAt < CACHE_MS) return cache.stats;

    try {
      // 1. User profile
      type GHUser = { public_repos: number; followers: number };
      const user = await fetchWithFallback<GHUser>(
        `${GH_API}/users/${USERNAME}`,
        { public_repos: cache.stats.publicRepos, followers: cache.stats.followers },
      );

      // 2. All public repos (for commit counts + language diversity)
      type GHRepo = { name: string; fork: boolean; language: string | null };
      const repos = await fetchWithFallback<GHRepo[]>(
        `${GH_API}/users/${USERNAME}/repos?per_page=100&type=public`,
        [],
      );

      // 3. Total commits across own repos (contributor API)
      const totalCommits = repos.length > 0
        ? await getTotalCommits(repos)
        : cache.stats.totalCommits;

      // 4. Distinct primary languages
      const languages = new Set(
        repos.filter((r) => r.language).map((r) => r.language as string),
      );

      const fresh: GitHubStats = {
        publicRepos: user.public_repos,
        followers: user.followers,
        totalCommits: totalCommits > 0 ? totalCommits : cache.stats.totalCommits,
        topLanguages: languages.size > 0 ? languages.size : cache.stats.topLanguages,
      };

      cache = { stats: fresh, updatedAt: Date.now() };
    } catch {
      // Keep last known good values — never surface an error state.
    }

    return cache.stats;
  },
);
