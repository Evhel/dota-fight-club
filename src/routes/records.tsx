import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import {
  buildIdentities,
  computeAllPlayerStats,
  computeGlobalStats,
} from "@/lib/stats";
import { useMemo } from "react";

export const Route = createFileRoute("/records")({
  component: RecordsPage,
});

function RecordsPage() {
  const { data: matches = [] } = useMatches();
  const { records } = useMemo(() => {
    const ids = buildIdentities(matches);
    const players = computeAllPlayerStats(matches, ids);
    return computeGlobalStats(matches, ids, players);
  }, [matches]);

  const items = [
    { label: "Самое большое количество убийств", rec: records.top_kills },
    { label: "Самое большое количество смертей", rec: records.top_deaths },
    { label: "Самое большое количество помощи", rec: records.top_assists },
    { label: "Лучший KDA с 0 смертей (K+A)", rec: records.top_perfect_kda },
    { label: "Максимум ценности в золоте", rec: records.top_net_worth },
    { label: "Максимум ласт-хитов", rec: records.top_creeps },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display text-glow">Рекорды</h1>
      <div className="panel divide-y divide-border/40">
        {items.map((it) => (
          <div key={it.label} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground">{it.label}</span>
            {it.rec ? (
              <span>
                <Link
                  to={`/player?nick=${encodeURIComponent(it.rec.name)}`}
                  className="text-primary hover:underline"
                >
                  {it.rec.name}
                </Link>
                {" · "}
                <Link to={`/match/${it.rec.match_id}`} className="font-medium hover:underline">
                  {it.rec.value}
                </Link>
              </span>
            ) : (
              <span>—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
