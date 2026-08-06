import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities } from "@/lib/stats";
import { heroImg } from "@/lib/heroes";
import { useMemo } from "react";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const { data: matches = [] } = useMatches();
  const identities = useMemo(() => buildIdentities(matches), [matches]);
  // Sort ascending to assign chronological #, then reverse for display (newest first)
  const ascending = [...matches].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  const indexed = ascending.map((m, i) => ({ m, num: i + 1 }));
  const sorted = [...indexed].reverse();


  const TeamCell = ({ team }: { team: { nickname: string; steam_id: number; hero: string }[] }) => (
    <div className="flex gap-1 justify-center">
      {team.map((p) => {
        const display = identities.get(String(p.steam_id))?.display_name || p.nickname;
        return (
          <Link
            key={p.steam_id}
            to={`/player?nick=${encodeURIComponent(display)}`}
            className="flex flex-col items-center w-16"
            title={`${display} — ${p.hero}`}
          >
            <span className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight">
              {display}
            </span>
            <img
              src={heroImg(p.hero)}
              alt={p.hero}
              loading="lazy"
              className="w-14 h-8 object-cover rounded border border-border/40"
              onError={(e) => ((e.currentTarget.style.opacity = "0.3"))}
            />
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display text-glow">Все матчи</h1>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2 text-center">#</th>
              <th className="px-3 py-2 text-center">Дата</th>
              <th className="px-3 py-2 text-center">Режим</th>
              <th className="px-3 py-2 text-center">Длит.</th>
              <th className="px-3 py-2 text-center">Пик</th>
              <th className="px-3 py-2 text-center">Победа</th>
              <th className="px-3 py-2 text-center">Команда света</th>
              <th className="px-3 py-2 text-center">Команда тьмы</th>
            </tr>

          </thead>
          <tbody>
            {sorted.map(({ m, num }, idx) => (
              <tr key={m.match_id} className="border-t border-border/40 hover:bg-muted/20">
                <td className="px-3 py-2 font-mono">{num}</td>
                <td className="px-3 py-2">
                  <Link to={`/match/${m.match_id}`} className="text-primary hover:underline">
                    {new Date(m.start_time).toLocaleDateString("ru-RU")}
                  </Link>
                </td>
                <td className="px-3 py-2">{m.data.game_mode}</td>
                <td className="px-3 py-2">{Math.round(m.data.duration_minutes)} мин</td>
                <td className="px-3 py-2">{Math.round(m.data.draft_duration_minutes)} мин</td>
                <td
                  className="px-3 py-2 font-medium"
                  style={{ color: m.data.winner === "radiant" ? "var(--radiant)" : "oklch(0.65 0.22 25)" }}
                >
                  {m.data.winner === "radiant" ? "Свет" : "Тьма"}
                </td>
                <td className="px-2 py-2"><TeamCell team={m.data.radiant_team} /></td>
                <td className="px-2 py-2"><TeamCell team={m.data.dire_team} /></td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-muted-foreground">

                  Матчей пока нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
