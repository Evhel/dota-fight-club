import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities, computePlayerStats, formatDuration } from "@/lib/stats";
import { heroImg, heroAnchorId, WARD_OBSERVER_ICON, WARD_SENTRY_ICON } from "@/lib/heroes";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const searchSchema = z.object({ nick: z.string().optional() });

export const Route = createFileRoute("/player")({
  validateSearch: zodValidator(searchSchema),
  component: PlayerPage,
});

function PlayerPage() {
  const { data: matches = [] } = useMatches();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const identities = useMemo(() => buildIdentities(matches), [matches]);
  const allNicks = useMemo(
    () =>
      [...identities.values()]
        .sort((a, b) => b.match_count - a.match_count)
        .map((i) => i.display_name),
    [identities],
  );
  const [selected, setSelected] = useState<string>(search.nick || "");

  useEffect(() => {
    if (search.nick) setSelected(search.nick);
  }, [search.nick]);

  const steamId = useMemo(() => {
    for (const [sid, id] of identities) {
      if (id.display_name === selected) return sid;
    }
    return null;
  }, [identities, selected]);

  const stats = useMemo(() => {
    if (!steamId) return null;
    return computePlayerStats(steamId, matches, identities);
  }, [steamId, matches, identities]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display text-glow text-center">Игрок</h1>
      <div className="panel p-4 flex justify-center">
        <Select
          value={selected}
          onValueChange={(val) => {
            setSelected(val);
            navigate({ search: { nick: val } });
          }}
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Выбери игрока..." />
          </SelectTrigger>
          <SelectContent>
            {allNicks.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {stats && (
        <div className="max-w-7xl mx-auto w-full space-y-4">
          {/* Header: avatar + name + key stats */}
          <div className="panel p-6 flex flex-col lg:flex-row gap-6 items-start">
            <div className="shrink-0">
              <PlayerAvatar steamId={stats.steam_id} name={stats.name} />
            </div>

            <div className="flex-1 min-w-0 w-full space-y-4">
              <div>
                <h2 className="font-display text-5xl text-glow break-words">{stats.name}</h2>
                <p className="text-muted-foreground mt-1">
                  Играет с матча №{stats.first_match_index || "—"}
                </p>
              </div>

              {/* Quick stat tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <Tile label="Игр" value={stats.games} />
                <Tile
                  label="Винрейт"
                  value={`${stats.winrate}%`}
                  color={
                    stats.winrate > 50
                      ? "oklch(0.75 0.18 145)"
                      : stats.winrate < 50
                        ? "oklch(0.65 0.22 25)"
                        : undefined
                  }
                />
                <Tile label="Время в боях" value={formatDuration(stats.total_seconds)} />
                <Tile
                  label="Текущая серия"
                  value={
                    stats.current_streak.type === "none"
                      ? "—"
                      : `${stats.current_streak.count}${stats.current_streak.type === "win" ? "+" : "-"}`
                  }
                  color={
                    stats.current_streak.type === "win"
                      ? "oklch(0.75 0.18 145)"
                      : stats.current_streak.type === "loss"
                        ? "oklch(0.65 0.22 25)"
                        : undefined
                  }
                />
                <Tile label="max серия побед" value={stats.max_win_streak} color="oklch(0.75 0.18 145)" />
                <Tile label="max серия поражений" value={stats.max_loss_streak} color="oklch(0.65 0.22 25)" />
                <Tile
                  label="Средний У/С/П"
                  value={`${stats.avg_kills}/${stats.avg_deaths}/${stats.avg_assists}`}
                />
                <Tile label="Любимое слово" value={stats.top_word || "—"} />


                <Tile
                  label="Макс.У/С/П"
                  value={`${stats.max_kda.kills}/${stats.max_kda.deaths}/${stats.max_kda.assists}`}
                />
                <Tile
                  label="Макс.NW | Ср.NW"
                  value={`${(stats.max_net_worth.value / 1000).toFixed(1)}k | ${(stats.avg_net_worth / 1000).toFixed(1)}k`}
                />
                <Tile
                  label="Макс.LH | Ср.LH"
                  value={`${stats.max_creeps.value} | ${stats.avg_creeps}`}
                />
                <Tile
                  label="Макс.DN | Ср.DN"
                  value={`${stats.max_denies.value} | ${stats.avg_denies}`}
                />
                <Tile
                  label="Макс.GPM | Ср.GPM"
                  value={`${stats.max_gpm.value} | ${stats.avg_gpm}`}
                />
                <Tile
                  label="Макс.XPM | Ср.XPM"
                  value={`${stats.max_xpm.value} | ${stats.avg_xpm}`}
                />
                <Tile
                  label="Макс.DMG | Ср.DMG"
                  value={`${(stats.max_dmg.value / 1000).toFixed(1)}k | ${(stats.avg_dmg / 1000).toFixed(1)}k`}
                />
                <Tile
                  label="Макс.HEAL | Ср.HEAL"
                  value={`${(stats.max_heal.value / 1000).toFixed(1)}k | ${(stats.avg_heal / 1000).toFixed(1)}k`}
                />
                <Tile
                  label="Макс.BLD | Ср.BLD"
                  value={`${(stats.max_bld.value / 1000).toFixed(1)}k | ${(stats.avg_bld / 1000).toFixed(1)}k`}
                />
                <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2 col-span-2 sm:col-span-3 md:col-span-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Макс. варды</div>
                  <div className="flex items-center justify-around gap-2">
                    <div className="flex items-center gap-1.5">
                      <img src={WARD_OBSERVER_ICON} alt="obs" style={{ width: 28, height: 28 }} />
                      <span className="font-display text-xl text-glow">{stats.max_obs.value}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <img src={WARD_SENTRY_ICON} alt="sen" style={{ width: 28, height: 28 }} />
                      <span className="font-display text-xl text-glow">{stats.max_sen.value}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <img src={WARD_OBSERVER_ICON} alt="de" style={{ width: 28, height: 28, filter: "grayscale(1) brightness(0.7)" }} />
                      <span className="font-display text-xl text-glow">{stats.max_dewards.value}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teammates + Opponents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-1 text-sm">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Союзники (от 3 игр)</div>
                  {stats.best_teammate ? (
                    <Link to="/player" search={{ nick: stats.best_teammate.name }} className="flex justify-between hover:underline" style={{ color: "oklch(0.75 0.18 145)" }}>
                      <span>Лучший</span><span>{stats.best_teammate.name} ({stats.best_teammate.winrate}%)</span>
                    </Link>
                  ) : <div className="text-muted-foreground">Лучший: —</div>}
                  {stats.worst_teammate ? (
                    <Link to="/player" search={{ nick: stats.worst_teammate.name }} className="flex justify-between hover:underline" style={{ color: "oklch(0.65 0.22 25)" }}>
                      <span>Худший</span><span>{stats.worst_teammate.name} ({stats.worst_teammate.winrate}%)</span>
                    </Link>
                  ) : <div className="text-muted-foreground">Худший: —</div>}
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-1 text-sm">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Соперники (от 3 игр)</div>
                  {stats.worst_opponent ? (
                    <Link to="/player" search={{ nick: stats.worst_opponent.name }} className="flex justify-between hover:underline" style={{ color: "oklch(0.65 0.22 25)" }}>
                      <span>Боится</span><span>{stats.worst_opponent.name} ({stats.worst_opponent.winrate}%)</span>
                    </Link>
                  ) : <div className="text-muted-foreground">Боится: —</div>}
                  {stats.best_opponent ? (
                    <Link to="/player" search={{ nick: stats.best_opponent.name }} className="flex justify-between hover:underline" style={{ color: "oklch(0.75 0.18 145)" }}>
                      <span>Переезжает</span><span>{stats.best_opponent.name} ({stats.best_opponent.winrate}%)</span>
                    </Link>
                  ) : <div className="text-muted-foreground">Переезжает: —</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <Row k="Любимый герой" v={stats.top_hero_games ? `${stats.top_hero_games.hero} (${stats.top_hero_games.games})` : "—"} />
                <Row k="Лучший герой (WR)" v={stats.top_hero_winrate ? `${stats.top_hero_winrate.hero} (${stats.top_hero_winrate.winrate}%)` : "—"} />
              </div>
            </div>
          </div>

          {/* Heroes wall */}
          <div className="panel p-4">
            <h3 className="font-display text-lg mb-2 text-center">
              Уникальные герои ({stats.unique_heroes.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {stats.unique_heroes.map((h) => (
                <Link
                  key={h}
                  to={`/heroes`}
                  hash={heroAnchorId(h)}
                  title={h}
                  className="block rounded overflow-hidden border border-border/50 hover:border-primary hover:shadow-[0_0_8px_var(--primary)] transition"
                >
                  <img
                    src={heroImg(h)}
                    alt={h}
                    loading="lazy"
                    className="w-12 h-7 object-cover"
                    onError={(e) => ((e.currentTarget.style.display = "none"))}
                  />
                </Link>
              ))}
            </div>
          </div>

          <MatchHistory steamId={stats.steam_id} matches={matches} />
        </div>
      )}
    </div>
  );
}

function MatchHistory({ steamId, matches }: { steamId: string; matches: ReturnType<typeof useMatches>["data"] extends infer T ? T : never }) {
  const rows = useMemo(() => {
    const sorted = [...(matches || [])].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
    let winStreak = 0;
    let lossStreak = 0;
    const out: Array<{
      match_id: number;
      date: string;
      hero: string;
      won: boolean;
      k: number;
      d: number;
      a: number;
      streak: { type: "win" | "loss"; count: number };
    }> = [];
    for (const row of sorted) {
      const m = row.data;
      const side = m.radiant_team.some((p) => String(p.steam_id) === steamId)
        ? "radiant"
        : m.dire_team.some((p) => String(p.steam_id) === steamId)
          ? "dire"
          : null;
      if (!side) continue;
      const teamPlayers = side === "radiant" ? m.radiant_team : m.dire_team;
      const me = teamPlayers.find((p) => String(p.steam_id) === steamId)!;
      const won = m.winner === side;
      if (won) {
        winStreak += 1;
        lossStreak = 0;
      } else {
        lossStreak += 1;
        winStreak = 0;
      }
      const kda = m.kda?.[me.nickname];
      out.push({
        match_id: m.match_id,
        date: row.start_time,
        hero: me.hero,
        won,
        k: kda?.kills ?? 0,
        d: kda?.deaths ?? 0,
        a: kda?.assists ?? 0,
        streak: won
          ? { type: "win", count: winStreak }
          : { type: "loss", count: lossStreak },
      });
    }
    return out.reverse();
  }, [matches, steamId]);

  if (rows.length === 0) return null;

  return (
    <div className="panel p-4">
      <h3 className="font-display text-lg mb-3 text-center">История матчей ({rows.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase">
            <tr className="border-b border-border/40">
              <th className="text-left py-2 px-2">Дата</th>
              <th className="text-left py-2 px-2">Герой</th>
              <th className="text-left py-2 px-2">Результат</th>
              <th className="text-left py-2 px-2">У/С/П</th>
              <th className="text-left py-2 px-2">Серия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const dt = new Date(r.date);
              const dateStr = dt.toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
              const winColor = "oklch(0.75 0.18 145)";
              const lossColor = "oklch(0.65 0.22 25)";
              return (
                <tr key={r.match_id} className="border-b border-border/20 hover:bg-muted/20">
                  <td className="py-1.5 px-2 whitespace-nowrap">
                    <Link to={`/match/$id`} params={{ id: String(r.match_id) }} className="hover:underline text-primary">
                      {dateStr}
                    </Link>
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={heroImg(r.hero)}
                        alt={r.hero}
                        loading="lazy"
                        className="w-10 h-6 object-cover rounded"
                        onError={(e) => ((e.currentTarget.style.display = "none"))}
                      />
                      <span>{r.hero}</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2 font-medium" style={{ color: r.won ? winColor : lossColor }}>
                    {r.won ? "Победа" : "Поражение"}
                  </td>
                  <td className="py-1.5 px-2 whitespace-nowrap">{r.k}/{r.d}/{r.a}</td>
                  <td className="py-1.5 px-2 whitespace-nowrap font-medium" style={{ color: r.streak.type === "win" ? winColor : lossColor }}>
                    {r.streak.count}{r.streak.type === "win" ? "+" : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-display text-xl text-glow mt-0.5 truncate" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}





function Row({ k, v, link }: { k: string; v: number | string; link?: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/30 pb-1">
      <span className="text-muted-foreground">{k}</span>
      {link ? (
        <Link to={link} className="font-medium text-primary hover:underline text-right">
          {v}
        </Link>
      ) : (
        <span className="font-medium text-right">{v}</span>
      )}
    </div>
  );
}
