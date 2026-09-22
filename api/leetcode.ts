import { LEETCODE_SNAPSHOT } from "../src/lib/leetcode-snapshot";

const CACHE_CONTROL = "s-maxage=300, stale-while-revalidate=3600";
const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

let cachedTotalSolved = LEETCODE_SNAPSHOT.totalSolved;

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { json: (body: Record<string, unknown>) => void };
};

function isValid(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export default async function handler(_req: unknown, res: ApiResponse) {
  res.setHeader("Cache-Control", CACHE_CONTROL);

  try {
    const upstream = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com/",
        Origin: "https://leetcode.com",
      },
      body: JSON.stringify({
        query: `query userProfile($username: String!) { matchedUser(username: $username) { submitStats: submitStatsGlobal { acSubmissionNum { difficulty count } } } }`,
        variables: { username: LEETCODE_SNAPSHOT.username },
        operationName: "userProfile",
      }),
    });

    if (!upstream.ok) throw new Error(`LeetCode returned ${upstream.status}`);

    const payload = (await upstream.json()) as {
      data?: {
        matchedUser?: {
          submitStats?: {
            acSubmissionNum?: Array<{ difficulty?: string; count?: number }>;
          };
        } | null;
      };
    };

    const accepted = payload.data?.matchedUser?.submitStats?.acSubmissionNum ?? [];
    const all = accepted.find((item) => item.difficulty === "All")?.count;
    if (isValid(all)) cachedTotalSolved = all;
  } catch {
    // Serve the last verified count whenever LeetCode is temporarily unavailable.
  }

  return res.status(200).json({
    username: LEETCODE_SNAPSHOT.username,
    totalSolved: cachedTotalSolved,
    source: "leetcode-graphql-live-or-last-known-good",
  });
}
