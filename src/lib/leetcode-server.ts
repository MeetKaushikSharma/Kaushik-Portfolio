import { createServerFn } from "@tanstack/react-start";
import { LEETCODE_SNAPSHOT } from "@/lib/leetcode-snapshot";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const CACHE_MS = 5 * 60 * 1000;

let cached = {
  totalSolved: LEETCODE_SNAPSHOT.totalSolved,
  updatedAt: 0,
};

function isValidSolvedCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export const getLeetCodeSolvedCount = createServerFn({ method: "GET" }).handler(
  async (): Promise<number> => {
    if (Date.now() - cached.updatedAt < CACHE_MS) return cached.totalSolved;

    try {
      const response = await fetch(LEETCODE_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Referer: `https://leetcode.com/u/${LEETCODE_SNAPSHOT.username}/`,
          Origin: "https://leetcode.com",
          "User-Agent": "Mozilla/5.0",
        },
        body: JSON.stringify({
          query:
            "query userProfile($username: String!) { matchedUser(username: $username) { submitStats: submitStatsGlobal { acSubmissionNum { difficulty count } } } }",
          variables: { username: LEETCODE_SNAPSHOT.username },
          operationName: "userProfile",
        }),
      });

      if (!response.ok) throw new Error(`LeetCode returned ${response.status}`);

      const payload = (await response.json()) as {
        data?: {
          matchedUser?: {
            submitStats?: {
              acSubmissionNum?: Array<{ difficulty?: string; count?: number }>;
            };
          } | null;
        };
      };

      const solved = payload.data?.matchedUser?.submitStats?.acSubmissionNum?.find(
        (entry) => entry.difficulty === "All",
      )?.count;

      if (isValidSolvedCount(solved)) {
        cached = { totalSolved: solved, updatedAt: Date.now() };
      }
    } catch {
      // Retain the last verified snapshot/cache value.
    }

    return cached.totalSolved;
  },
);
