import { heroShortName } from "./heroes.ts";
import { buildIdentities, computeGlobalStats, computeHeroStats } from "./stats.ts";
import type { DotaMatch, MatchRow } from "./types";

export function computeHeroDetails(matches: MatchRow[], slug: string) {
  const key = heroShortName(slug);
  const summary = computeHeroStats(matches).find((hero) => heroShortName(hero.name) === key);
  if (!summary) return null;
  const identities = buildIdentities(matches);
  const players = new Map<
    string,
    { steam_id: string; name: string; games: number; wins: number; losses: number; winrate: number }
  >();
  const games = matches
    .flatMap((row) => {
      const entries = [
        ...row.data.radiant_team.map((player) => ({ player, side: "radiant" as const })),
        ...row.data.dire_team.map((player) => ({ player, side: "dire" as const })),
      ].filter(({ player }) => heroShortName(player.hero) === key);
      return entries.map(({ player, side }) => {
        const sid = String(player.steam_id);
        const won = row.data.winner === side;
        const entry = players.get(sid) || {
          steam_id: sid,
          name: identities.get(sid)?.display_name || player.nickname,
          games: 0,
          wins: 0,
          losses: 0,
          winrate: 0,
        };
        entry.games++;
        if (won) entry.wins++;
        else entry.losses++;
        entry.winrate = Math.round((entry.wins / entry.games) * 100);
        players.set(sid, entry);
        return { row, player, side, won, name: entry.name };
      });
    })
    .sort(
      (a, b) =>
        Date.parse(b.row.start_time) - Date.parse(a.row.start_time) ||
        b.row.match_id - a.row.match_id,
    );

  // Keep the roster for identity lookup, but scope every record dictionary to
  // players who actually played THIS hero. Other heroes must not win its records.
  const recordMaps = [
    "kda",
    "net_worth",
    "last_hits",
    "creep_kills",
    "denies",
    "gpm",
    "xpm",
    "gold_per_minute",
    "xp_per_minute",
    "hero_damage",
    "hero_healing",
    "damage_taken",
    "tower_damage",
  ] as const;
  const scoped: MatchRow[] = [...new Map(games.map(({ row }) => [row.match_id, row])).values()].map(
    (row) => {
      const names = new Set(
        [...row.data.radiant_team, ...row.data.dire_team]
          .filter((p) => heroShortName(p.hero) === key)
          .map((p) => p.nickname),
      );
      const dictionaries = Object.fromEntries(
        recordMaps
          .filter((field) => row.data[field] !== undefined)
          .map((field) => [
            field,
            Object.fromEntries(
              Object.entries(row.data[field] || {}).filter(([name]) => names.has(name)),
            ),
          ]),
      );
      return { ...row, data: { ...row.data, ...dictionaries, chat_after_draft: [] } as DotaMatch };
    },
  );
  const records = computeGlobalStats(scoped, identities, []).records;
  return {
    summary,
    players: [...players.values()].sort(
      (a, b) => b.games - a.games || b.wins - a.wins || a.name.localeCompare(b.name, "ru"),
    ),
    games,
    records,
    verifiedCombatGames: scoped.filter(
      (row) => row.data.data_quality?.terminal_stats_source === "replay_match_details",
    ).length,
  };
}
