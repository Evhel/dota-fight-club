import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities, matchDeaths } from "@/lib/stats";
import { useMemo } from "react";

export const Route = createFileRoute("/match/$id")({
  component: MatchPage,
});

function MatchPage() {
  const { id } = Route.useParams();
  const { data: matches = [] } = useMatches();
  const match = useMemo(() => matches.find((m) => m.match_id === Number(id)), [matches, id]);
  const identities = useMemo(() => buildIdentities(matches), [matches]);

  if (!match) {
    return (
      <div className="panel p-8 text-center text-muted-foreground">
        Матч #{id} не найден.
      </div>
    );
  }
  const m = match.data;
  const d = matchDeaths(m);

  const Team = ({
    title,
    team,
    color,
    won,
  }: {
    title: string;
    team: typeof m.radiant_team;
    color: string;
    won: boolean;
  }) => (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl" style={{ color }}>
          {title}
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: won ? `${color} / 0.2` : "transparent",
            border: `1px solid ${color}`,
            color,
          }}
        >
          {won ? "Победа" : "Поражение"}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="text-left">
            <th className="py-1">Игрок</th>
            <th>Герой</th>
            <th>KDA</th>
            <th>NW</th>
          </tr>
        </thead>
        <tbody>
          {team.map((p) => {
            const kda = m.kda?.[p.nickname];
            const display = identities.get(String(p.steam_id))?.display_name || p.nickname;
            return (
              <tr key={p.steam_id} className="border-t border-border/30">
                <td className="py-1.5">
                  <Link
                    to={`/player?nick=${encodeURIComponent(display)}`}
                    className="hover:text-primary"
                  >
                    {display}
                  </Link>
                </td>
                <td>{p.hero}</td>
                <td>
                  {kda ? `${kda.kills}/${kda.deaths}/${kda.assists}` : "—"}
                </td>
                <td>{Math.round(m.net_worth?.[p.nickname] ?? 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="text-xs text-muted-foreground mb-1">Матч #{m.match_id}</div>
        <h1 className="text-2xl font-display">
          {new Date(match.start_time).toLocaleString("ru-RU")} · {m.game_mode}
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span>Длительность: {Math.round(m.duration_minutes)} мин</span>
          <span>Пик: {Math.round(m.draft_duration_minutes)} мин</span>
          <span>Смертей: Свет {d.radiant} · Тьма {d.dire}</span>
          <span
            className="font-medium"
            style={{ color: m.winner === "radiant" ? "var(--radiant)" : "var(--dire)" }}
          >
            Победа: {m.winner === "radiant" ? "Свет" : "Тьма"}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Team
          title="Свет (Radiant)"
          team={m.radiant_team}
          color="oklch(0.70 0.14 155)"
          won={m.winner === "radiant"}
        />
        <Team
          title="Тьма (Dire)"
          team={m.dire_team}
          color="oklch(0.55 0.10 200)"
          won={m.winner === "dire"}
        />
      </div>
    </div>
  );
}
