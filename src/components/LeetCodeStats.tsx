import { useEffect, useState } from "react";

type LeetCodeApiResponse = {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  ranking: number;
};

const LEETCODE_USERNAME = "meetkaushik";
const LEETCODE_PROFILE_URL = `https://leetcode.com/u/${LEETCODE_USERNAME}/`;
const STATS_ENDPOINT = `https://leetcode-api-faisalshohag.herokuapp.com/${LEETCODE_USERNAME}`;

type Status = "loading" | "success" | "error";

function useCountUp(target: number, durationMs = 1100, active = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, active]);

  return value;
}

function DifficultyBar({
  label,
  solved,
  total,
}: {
  label: string;
  solved: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, (solved / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider">
      <span className="w-14 shrink-0 opacity-60">{label}</span>
      <div className="h-[3px] flex-1 bg-current/15">
        <div
          className="h-full bg-current transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right opacity-70">
        {solved}/{total}
      </span>
    </div>
  );
}

/**
 * Live LeetCode counter styled to match the site's brutalist
 * mega-number / section-kicker system used across #achievements.
 * Drop this inside the #achievements section (see index.tsx notes).
 */
export function LeetCodeStats() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<LeetCodeApiResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(STATS_ENDPOINT);
        if (!res.ok) throw new Error("bad response");
        const json = (await res.json()) as LeetCodeApiResponse;
        if (!cancelled) {
          setData(json);
          setStatus("success");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const solved = useCountUp(data?.totalSolved ?? 0, 1100, status === "success");

  return (
    <a
      href={LEETCODE_PROFILE_URL}
      target="_blank"
      rel="noreferrer"
      className="achievement-detail leetcode-live group block no-underline"
      style={{ marginTop: "2.5rem" }}
    >
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] opacity-60">
        <span className="flex items-center gap-2">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full bg-current ${
              status === "loading" ? "animate-pulse opacity-40" : ""
            }`}
          />
          Problem count / live
        </span>
        <span className="transition-opacity group-hover:opacity-100">
          @{LEETCODE_USERNAME} ↗
        </span>
      </div>

      {status === "error" ? (
        <p className="mt-6 font-mono text-sm opacity-60">
          Live sync unavailable. View LeetCode profile directly ↗
        </p>
      ) : (
        <>
          <span
            className="mega-number block"
            style={{ fontSize: "clamp(3.5rem, 8vw, 6.5rem)" }}
          >
            {status === "loading" ? "—" : solved}
          </span>
          <p className="font-mono text-xs uppercase tracking-wider opacity-60">
            problems solved{" "}
            {data?.totalQuestions ? `/ ${data.totalQuestions} total` : ""}
            {data?.ranking ? ` / rank #${data.ranking.toLocaleString()}` : ""}
          </p>

          <div className="mt-5 space-y-2 max-w-xs">
            <DifficultyBar label="Easy" solved={data?.easySolved ?? 0} total={data?.totalEasy ?? 0} />
            <DifficultyBar
              label="Medium"
              solved={data?.mediumSolved ?? 0}
              total={data?.totalMedium ?? 0}
            />
            <DifficultyBar label="Hard" solved={data?.hardSolved ?? 0} total={data?.totalHard ?? 0} />
          </div>
        </>
      )}
    </a>
  );
}
