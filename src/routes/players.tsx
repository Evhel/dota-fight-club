import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities, computeAllPlayerStats, formatDuration } from "@/lib/stats";
import { useMemo } from "react";

export const Route = createFileRoute("/players")({
  component: PlayersPage,
});

function PlayersPage() {
  const { data: matches = [] } = useMatches();
  const players = useMemo(() => {
    const ids = buildIdentities(matches);
    return computeAllPlayerStats(matches, ids);
  }, [matches]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display text-glow text-center">Игроки</h1>
      <div className="panel overflow-x-auto">
        <table className="w-full text-base text-center">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2">Ник</th>
              <th className="px-3 py-2">Игр</th>
              <th className="px-3 py-2">WR</th>
              <th className="px-3 py-2">Потрачено</th>
              <th className="px-3 py-2">Уник. героев</th>
              <th className="px-3 py-2">Серия побед</th>
              <th className="px-3 py-2">Серия поражений</th>
              <th className="px-3 py-2">Текущая серия</th>
              <th className="px-3 py-2">Слово</th>
              <th className="px-3 py-2">Лучший союзник</th>
              <th className="px-3 py-2">Худший союзник</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.steam_id} className="border-t border-border/40 hover:bg-muted/20">
                <td className="px-3 py-2">
                  <Link
                    to={`/player?nick=${encodeURIComponent(p.name)}`}
                    className="text-primary hover:underline"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{p.games}</td>
                <td className="px-3 py-2">{p.winrate}%</td>
                <td className="px-3 py-2">{formatDuration(p.total_seconds)}</td>
                <td className="px-3 py-2">{p.unique_heroes.length}</td>
                <td className="px-3 py-2">{p.max_win_streak}</td>
                <td className="px-3 py-2">{p.max_loss_streak}</td>
                <td className="px-3 py-2">
                  {p.current_streak.type === "none"
                    ? "—"
                    : `${p.current_streak.count}${p.current_streak.type === "win" ? "+" : "-"}`}
                </td>
                <td className="px-3 py-2">{p.top_word || "—"}</td>
                <td className="px-3 py-2">
                  {p.best_teammate ? `${p.best_teammate.name} (${p.best_teammate.winrate}%)` : "—"}
                </td>
                <td className="px-3 py-2">
                  {p.worst_teammate ? `${p.worst_teammate.name} (${p.worst_teammate.winrate}%)` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
