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

  const fmtGold = (v: number) => `${(v / 1000).toFixed(1)}k`;
  const fmtK = (v: number) => `${(v / 1000).toFixed(1)}k`;
  type Item = { label: string; rec: typeof records.top_kills; format?: (v: number) => string };
  const items: Item[] = [
    { label: "💀 Самое большое количество убийств", rec: records.top_kills },
    { label: "☠️ Самое большое количество смертей", rec: records.top_deaths },
    { label: "🤝 Самое большое количество помощи", rec: records.top_assists },
    { label: "✨ Лучший KDA с 0 смертей (K+A)", rec: records.top_perfect_kda },
    { label: "💰 Максимум ценности в золоте", rec: records.top_net_worth, format: fmtGold },
    { label: "🗡️ Максимум ласт-хитов", rec: records.top_creeps },
    { label: "🛡️ Максимум денаев", rec: records.top_denies },
    { label: "🪙 Максимум GPM", rec: records.top_gpm },
    { label: "📘 Максимум XPM", rec: records.top_xpm },
    { label: "🔥 Максимум урона (DMG)", rec: records.top_dmg, format: fmtK },
    { label: "💚 Максимум лечения (HEAL)", rec: records.top_heal, format: fmtK },
    { label: "🏰 Максимум урона по строениям (BLD)", rec: records.top_bld, format: fmtK },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display text-glow text-center">Рекорды</h1>
      <div className="panel overflow-x-auto max-w-2xl mx-auto">
        <table className="w-full text-base text-center">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2">Рекорд</th>
              <th className="px-3 py-2">Игрок</th>
              <th className="px-3 py-2">Значение</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.label} className="border-t border-border/40">
                <td className="px-3 py-2 text-muted-foreground">
                  {it.rec ? (
                    <Link to="/match/$id" params={{ id: String(it.rec.match_id) }} className="hover:text-primary hover:underline">
                      {it.label}
                    </Link>
                  ) : (
                    it.label
                  )}
                </td>
                {it.rec ? (
                  <>
                    <td className="px-3 py-2">
                      <Link
                        to="/player" search={{ nick: it.rec.name }}
                        className="text-primary hover:underline"
                      >
                        {it.rec.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Link to="/match/$id" params={{ id: String(it.rec.match_id) }} className="font-medium hover:underline">
                        {it.format ? it.format(it.rec.value) : it.rec.value}
                      </Link>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2">—</td>
                    <td className="px-3 py-2">—</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
