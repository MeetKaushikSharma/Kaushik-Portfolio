import { createFileRoute } from "@tanstack/react-router";
import { LEETCODE_SNAPSHOT } from "@/lib/leetcode-snapshot";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

let cachedTotalSolved = LEETCODE_SNAPSHOT.totalSolved;

function isValidSolvedCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

async function getLatestSolvedCount(): Promise<number> {
  try {
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: `https://leetcode.com/u/${LEETCODE_SNAPSHOT.username}/`,
        Origin: "https://leetcode.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
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

    const submissions = payload.data?.matchedUser?.submitStats?.acSubmissionNum ?? [];
    const solved = submissions.find((item) => item.difficulty === "All")?.count;
    if (isValidSolvedCount(solved)) cachedTotalSolved = solved;
  } catch {
    // Keep serving the last verified count if LeetCode is unavailable.
  }

  return cachedTotalSolved;
}

export const Route = createFileRoute("/api/leetcode")({
  server: {
    handlers: {
      GET: async () => {
        const totalSolved = await getLatestSolvedCount();
        return new Response(
          JSON.stringify({
            username: LEETCODE_SNAPSHOT.username,
            totalSolved,
            source: "leetcode-graphql-live-or-last-known-good",
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "s-maxage=300, stale-while-revalidate=3600",
            },
          },
        );
      },
    },
  },
});
