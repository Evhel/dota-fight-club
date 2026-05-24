import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities, matchDeaths } from "@/lib/stats";
import { heroImg, heroIcon, heroAnchorId } from "@/lib/heroes";
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

  const mins = Math.floor(m.duration_seconds / 60);
  const secs = Math.floor(m.duration_seconds % 60);
  const durStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const radiantColor = "oklch(0.72 0.16 145)";
  const direColor = "oklch(0.62 0.20 25)";

  // Build combined chronological draft (picks + bans by tick). Side for picks
  // is inferred from hero membership; the team field in picks/bans does not
  // reliably map to radiant/dire in CM / CD. For bans, side is inferred via
  // a team→side map built from picks.
  const radiantHeroes = new Set(m.radiant_team.map((p) => p.hero));
  const direHeroes = new Set(m.dire_team.map((p) => p.hero));
  type DraftStep = { hero: string; tick: number; isBan: boolean; side: "radiant" | "dire" | null };
  const teamToSide: Record<number, "radiant" | "dire"> = {};
  for (const p of m.picks || []) {
    const side: "radiant" | "dire" | null = radiantHeroes.has(p.hero)
      ? "radiant"
      : direHeroes.has(p.hero)
        ? "dire"
        : null;
    if (side && p.team !== undefined && teamToSide[p.team] === undefined) {
      teamToSide[p.team] = side;
    }
  }
  const draftAll: DraftStep[] = [];
  for (const p of m.picks || []) {
    const side: "radiant" | "dire" | null = radiantHeroes.has(p.hero)
      ? "radiant"
      : direHeroes.has(p.hero)
        ? "dire"
        : null;
    draftAll.push({ hero: p.hero, tick: p.tick, isBan: false, side });
  }
  for (const b of m.bans || []) {
    const side = b.team !== undefined ? teamToSide[b.team] ?? null : null;
    draftAll.push({ hero: b.hero, tick: b.tick, isBan: true, side });
  }
  draftAll.sort((a, b) => a.tick - b.tick);

  const TeamBlock = ({
    title,
    team,
    color,
    won,
  }: {
    title: string;
    team: typeof m.radiant_team;
    color: string;
    won: boolean;
  }) => {
    return (
      <div className="panel p-4 space-y-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl" style={{ color }}>
            {title}
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded border"
            style={{ borderColor: color, color }}
          >
            {won ? "Победа" : "Поражение"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center table-fixed">
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 px-1">Герой</th>
                <th className="py-1 px-1 text-left">Игрок</th>
                <th className="py-1 px-1">K</th>
                <th className="py-1 px-1">D</th>
                <th className="py-1 px-1">A</th>
                <th className="py-1 px-1">NET</th>
                <th className="py-1 px-1">LH|DN</th>
                <th className="py-1 px-1">GPM|XPM</th>
                <th className="py-1 px-1">DMG</th>
                <th className="py-1 px-1">Got DMG</th>
                <th className="py-1 px-1">HEAL</th>
                <th className="py-1 px-1">BLD</th>
              </tr>
            </thead>
            <tbody>
              {team.map((p) => {
                const k = m.kda?.[p.nickname];
                const display = identities.get(String(p.steam_id))?.display_name || p.nickname;
                const nw = m.net_worth?.[p.nickname] ?? 0;
                const lh = m.last_hits?.[p.nickname] ?? m.creep_kills?.[p.nickname] ?? 0;
                const dn = m.denies?.[p.nickname] ?? 0;
                const gpm = Math.round(m.gpm?.[p.nickname] ?? m.gold_per_minute?.[p.nickname] ?? 0);
                const xpm = Math.round(m.xpm?.[p.nickname] ?? m.xp_per_minute?.[p.nickname] ?? 0);
                const dmg = m.hero_damage?.[p.nickname] ?? 0;
                const taken = m.damage_taken?.[p.nickname] ?? 0;
                const heal = m.hero_healing?.[p.nickname] ?? 0;
                const bld = m.tower_damage?.[p.nickname] ?? 0;
                const k1k = (v: number) => `${(v / 1000).toFixed(1)}k`;
                return (
                  <tr key={p.steam_id} className="border-t border-border/30">
                    <td className="py-1 px-1">
                      <Link to={`/heroes`} hash={heroAnchorId(p.hero)} title={p.hero}>
                        <img
                          src={heroImg(p.hero)}
                          alt={p.hero}
                          className="w-12 h-7 object-cover rounded inline-block hover:ring-2 hover:ring-primary"
                          onError={(e) => ((e.currentTarget.style.opacity = "0.3"))}
                        />
                      </Link>
                    </td>
                    <td className="py-1 px-1 text-left">
                      <Link
                        to={`/player?nick=${encodeURIComponent(display)}`}
                        className="hover:text-primary"
                      >
                        {display}
                      </Link>
                    </td>
                    <td className="py-1 px-1">{k?.kills ?? 0}</td>
                    <td className="py-1 px-1">{k?.deaths ?? 0}</td>
                    <td className="py-1 px-1">{k?.assists ?? 0}</td>
                    <td className="py-1 px-1">{(nw / 1000).toFixed(1)}k</td>
                    <td className="py-1 px-1"><span style={{ color: "oklch(0.78 0.15 80)" }}>{lh}</span>|<span style={{ color: "oklch(0.7 0.15 200)" }}>{dn}</span></td>
                    <td className="py-1 px-1"><span style={{ color: "oklch(0.78 0.18 60)" }}>{gpm}</span>|<span style={{ color: "oklch(0.72 0.18 280)" }}>{xpm}</span></td>
                    <td className="py-1 px-1">{k1k(dmg)}</td>
                    <td className="py-1 px-1">{k1k(taken)}</td>
                    <td className="py-1 px-1">{k1k(heal)}</td>
                    <td className="py-1 px-1">{k1k(bld)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const DraftStrip = () => {
    if (draftAll.length === 0) return null;
    return (
      <div className="panel p-4 max-w-3xl mx-auto space-y-2">
        <div className="text-xs text-muted-foreground text-center">Порядок пиков и банов</div>
        <div className="flex flex-wrap gap-1 justify-center">
          {draftAll.map((s, i) => {
            const borderColor = s.isBan
              ? "oklch(0.4 0.02 200 / 0.6)"
              : s.side === "radiant"
                ? radiantColor
                : s.side === "dire"
                  ? direColor
                  : "oklch(0.4 0.02 200 / 0.6)";
            return (
              <Link
                key={i}
                to={`/heroes`}
                hash={heroAnchorId(s.hero)}
                title={`${s.isBan ? "Бан" : `Пик · ${s.side === "radiant" ? "Свет" : s.side === "dire" ? "Тьма" : "?"}`}: ${s.hero}`}
              >
                <img
                  src={heroIcon(s.hero)}
                  alt={s.hero}
                  className="w-8 h-8 rounded border-2"
                  style={{
                    borderColor,
                    filter: s.isBan ? "grayscale(1) brightness(0.6)" : undefined,
                  }}
                  onError={(e) => ((e.currentTarget.style.opacity = "0.3"))}
                />
              </Link>
            );
          })}
        </div>
        <div className="flex gap-3 justify-center text-[10px] text-muted-foreground">
          <span><span className="inline-block w-3 h-3 rounded border-2 align-middle" style={{ borderColor: radiantColor }} /> Пик Света</span>
          <span><span className="inline-block w-3 h-3 rounded border-2 align-middle" style={{ borderColor: direColor }} /> Пик Тьмы</span>
          <span><span className="inline-block w-3 h-3 rounded border-2 align-middle bg-muted-foreground/30" /> Бан</span>
        </div>
      </div>
    );
  };

  const winnerTitle =
    m.winner === "radiant" ? "ПОБЕДА СИЛ СВЕТА" : "ПОБЕДА СИЛ ТЬМЫ";
  const winnerColor = m.winner === "radiant" ? radiantColor : direColor;

  return (
    <div className="space-y-6">
      <div className="panel p-6 text-center">
        <div className="text-xs text-muted-foreground mb-2">
          Матч #{m.match_id} · {new Date(match.start_time).toLocaleDateString("ru-RU")} · {m.game_mode}
        </div>
        <h1
          className="font-display text-4xl md:text-5xl text-glow"
          style={{ color: winnerColor }}
        >
          {winnerTitle}
        </h1>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div
            className="font-display text-3xl md:text-4xl font-bold"
            style={{ color: radiantColor }}
          >
            {d.radiant}
          </div>
          <div className="font-mono text-2xl text-foreground">{durStr}</div>
          <div
            className="font-display text-3xl md:text-4xl font-bold"
            style={{ color: direColor }}
          >
            {d.dire}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Пик: {Math.round(m.draft_duration_minutes)} мин
        </div>
      </div>

      <TeamBlock
        title="Свет (Radiant)"
        team={m.radiant_team}
        color={radiantColor}
        won={m.winner === "radiant"}
      />
      <TeamBlock
        title="Тьма (Dire)"
        team={m.dire_team}
        color={direColor}
        won={m.winner === "dire"}
      />
      <DraftStrip />
    </div>
  );
}
