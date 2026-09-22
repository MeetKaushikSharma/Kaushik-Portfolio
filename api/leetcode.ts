import { LEETCODE_SNAPSHOT } from "../src/lib/leetcode-snapshot";

const LEETCODE_API_URL = "https://leetcode-api-faisalshohag.herokuapp.com/meetkaushik";
const CACHE_CONTROL = "s-maxage=300, stale-while-revalidate=3600";

let cachedTotalSolved = LEETCODE_SNAPSHOT.totalSolved;

function isValid(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { json: (body: Record<string, unknown>) => void };
};

export default async function handler(_req: unknown, res: ApiResponse) {
  res.setHeader("Cache-Control", CACHE_CONTROL);

  try {
    const upstream = await fetch(LEETCODE_API_URL);
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const payload = (await upstream.json()) as { totalSolved?: unknown };
    if (isValid(payload.totalSolved)) cachedTotalSolved = payload.totalSolved;
  } catch {
    // Serve the most recent valid snapshot instead of exposing upstream failures.
  }

  return res.status(200).json({
    username: LEETCODE_SNAPSHOT.username,
    totalSolved: cachedTotalSolved,
    source: "live-or-last-known-good",
  });
}
