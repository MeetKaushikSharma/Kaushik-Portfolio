const LEETCODE_API_URL = "https://leetcode-api-faisalshohag.herokuapp.com/meetkaushik";
const CACHE_CONTROL = "s-maxage=300, stale-while-revalidate=3600";

let cachedTotalSolved: number | null = null;

function isValidTotalSolved(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { json: (body: Record<string, unknown>) => void };
};

export default async function handler(_req: unknown, res: ApiResponse) {
  res.setHeader("Cache-Control", CACHE_CONTROL);

  try {
    const upstreamResponse = await fetch(LEETCODE_API_URL);
    if (!upstreamResponse.ok) {
      throw new Error(`LeetCode upstream returned ${upstreamResponse.status}`);
    }

    const payload: unknown = await upstreamResponse.json();
    const totalSolved =
      payload && typeof payload === "object"
        ? (payload as { totalSolved?: unknown }).totalSolved
        : undefined;

    if (!isValidTotalSolved(totalSolved)) {
      throw new Error("LeetCode upstream payload is invalid");
    }

    cachedTotalSolved = totalSolved;
    return res.status(200).json({ totalSolved });
  } catch {
    if (cachedTotalSolved !== null) {
      return res.status(200).json({ totalSolved: cachedTotalSolved });
    }

    return res.status(502).json({ error: "Failed to fetch LeetCode stats" });
  }
}
