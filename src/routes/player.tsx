import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities, computePlayerStats, formatDuration } from "@/lib/stats";
import { heroImg, heroAnchorId } from "@/lib/heroes";
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
                  Играет с матча №{stats.first_match_index || "—"} · {stats.unique_heroes.length} уникальных героев
                </p>
              </div>

              {/* Quick stat tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <Tile label="Игр" value={stats.games} />
                <Tile label="Винрейт" value={`${stats.winrate}%`} />
                <Tile label="Время в боях" value={formatDuration(stats.total_seconds)} />
                <Tile
                  label="Текущая серия"
                  value={
                    stats.current_streak.type === "none"
                      ? "—"
                      : `${stats.current_streak.count}${stats.current_streak.type === "win" ? "+" : "-"}`
                  }
                />
                <Tile label="Серия побед (макс)" value={stats.max_win_streak} />
                <Tile label="Серия поражений (макс)" value={stats.max_loss_streak} />
                <Tile label="K / D / A" value={`${stats.total_kills}/${stats.total_deaths}/${stats.total_assists}`} />
                <Tile label="Любимое слово" value={stats.top_word || "—"} />
              </div>

              {/* Records compact two-column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <Row k="Макс. KDA" v={stats.max_kda.value} link={`/match/${stats.max_kda.match_id}`} />
                <Row k="Средний KDA" v={stats.avg_kda} />
                <Row k="Макс. NW" v={stats.max_net_worth.value} link={`/match/${stats.max_net_worth.match_id}`} />
                <Row k="Средний NW" v={stats.avg_net_worth} />
                <Row k="Макс. крипов" v={stats.max_creeps.value} link={`/match/${stats.max_creeps.match_id}`} />
                <Row k="Средние крипы" v={stats.avg_creeps} />
                <Row k="Макс. observer" v={stats.max_obs.value} link={`/match/${stats.max_obs.match_id}`} />
                <Row k="Макс. sentry" v={stats.max_sen.value} link={`/match/${stats.max_sen.match_id}`} />
                <Row k="Макс. dewards" v={stats.max_dewards.value} link={`/match/${stats.max_dewards.match_id}`} />
                <Row k="Любимый герой" v={stats.top_hero_games ? `${stats.top_hero_games.hero} (${stats.top_hero_games.games})` : "—"} />
                <Row k="Лучший герой (WR)" v={stats.top_hero_winrate ? `${stats.top_hero_winrate.hero} (${stats.top_hero_winrate.winrate}%)` : "—"} />
                <Row
                  k="Лучший союзник"
                  v={stats.best_teammate ? `${stats.best_teammate.name} (${stats.best_teammate.winrate}%)` : "—"}
                  link={stats.best_teammate ? `/player?nick=${encodeURIComponent(stats.best_teammate.name)}` : undefined}
                />
                <Row
                  k="Худший союзник"
                  v={stats.worst_teammate ? `${stats.worst_teammate.name} (${stats.worst_teammate.winrate}%)` : "—"}
                  link={stats.worst_teammate ? `/player?nick=${encodeURIComponent(stats.worst_teammate.name)}` : undefined}
                />
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
        </div>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-display text-xl text-glow mt-0.5 truncate">{value}</div>
    </div>
  );
}
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
