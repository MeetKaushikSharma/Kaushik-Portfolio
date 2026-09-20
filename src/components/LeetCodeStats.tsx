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

function useCountUp(target: number, durationMs = 900, active = true) {
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
  colorClass,
}: {
  label: string;
  solved: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? Math.min(100, (solved / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-14 shrink-0 font-mono uppercase tracking-wider text-white/50">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-white/70">
        {solved}/{total}
      </span>
    </div>
  );
}

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

  const solved = useCountUp(data?.totalSolved ?? 0, 900, status === "success");

  return (
    <a
      href={LEETCODE_PROFILE_URL}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden rounded-xl border border-white/10 bg-black/60 p-5 font-mono text-white transition-colors hover:border-emerald-400/50"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              status === "success"
                ? "bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)] animate-pulse"
                : status === "error"
                  ? "bg-red-500"
                  : "bg-white/30 animate-pulse"
            }`}
          />
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/50">
            leetcode // live
          </span>
        </div>
        <span className="text-[11px] uppercase tracking-widest text-white/30 group-hover:text-emerald-400">
          @{LEETCODE_USERNAME} ↗
        </span>
      </div>

      <div className="relative mt-4">
        {status === "error" ? (
          <p className="text-sm text-white/50">
            Live sync unavailable right now. View profile directly ↗
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">
                {status === "loading" ? "—" : solved}
              </span>
              <span className="text-sm text-white/40">
                / {data?.totalQuestions ?? "—"} problems solved
              </span>
            </div>
            {data?.ranking ? (
              <p className="mt-1 text-xs text-white/40">
                Global rank #{data.ranking.toLocaleString()}
              </p>
            ) : null}

            <div className="mt-4 space-y-2">
              <DifficultyBar
                label="Easy"
                solved={data?.easySolved ?? 0}
                total={data?.totalEasy ?? 0}
                colorClass="bg-emerald-400"
              />
              <DifficultyBar
                label="Medium"
                solved={data?.mediumSolved ?? 0}
                total={data?.totalMedium ?? 0}
                colorClass="bg-amber-400"
              />
              <DifficultyBar
                label="Hard"
                solved={data?.hardSolved ?? 0}
                total={data?.totalHard ?? 0}
                colorClass="bg-red-400"
              />
            </div>
          </>
        )}
      </div>
    </a>
  );
}
