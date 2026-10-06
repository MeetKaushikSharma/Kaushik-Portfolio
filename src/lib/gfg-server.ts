import { createServerFn } from "@tanstack/react-start";
import { GFG_SNAPSHOT } from "@/lib/gfg-snapshot";

const CACHE_MS = 10 * 60 * 1000; // 10-minute server-side cache
const PROFILE_URL = `https://www.geeksforgeeks.org/user/${GFG_SNAPSHOT.handle}/`;

// Regex matching total_problems_solved across plain JSON or Next.js RSC escaped strings (\"total_problems_solved\":101)
const SOLVED_RE = /total_problems_solved[^\d]{1,15}(\d+)/;

let cache: { problemsSolved: number; updatedAt: number } = {
  problemsSolved: GFG_SNAPSHOT.problemsSolved,
  updatedAt: 0,
};

export const getGFGSolvedCount = createServerFn({ method: "GET" }).handler(
  async (): Promise<number> => {
    if (Date.now() - cache.updatedAt < CACHE_MS && cache.problemsSolved > 0) {
      return cache.problemsSolved;
    }

    try {
      const res = await fetch(PROFILE_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) throw new Error(`GFG returned ${res.status}`);

      const html = await res.text();
      const match = SOLVED_RE.exec(html);

      if (match) {
        const value = parseInt(match[1], 10);
        if (Number.isFinite(value) && value > 0) {
          cache = { problemsSolved: value, updatedAt: Date.now() };
        }
      }
    } catch {
      // Retain the last verified snapshot/cache value — never surface an error.
    }

    return cache.problemsSolved;
  },
);
