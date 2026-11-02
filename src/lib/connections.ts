import type { MatchPlayer, MatchRow } from "./types";
import type { PlayerIdentity } from "./stats";

export type ConnectionMode = "together" | "opponents" | "all";
export interface ConnectionRow {
  steam_id: string;
  name: string;
  together: number;
  together_wins: number;
  opponents: number;
  opponent_wins: number;
}

export function moscowDate(value: string): string {
  const time = Date.parse(value);
  return Number.isFinite(time)
    ? new Date(time + 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : "";
}

export function filterConnectionDates(matches: MatchRow[], from: string, to: string): MatchRow[] {
  return matches.filter((row) => {
    const day = moscowDate(row.start_time);
    return day && (!from || day >= from) && (!to || day <= to);
  });
}

function participants(row: MatchRow) {
  return [
    ...row.data.radiant_team.map((player) => ({ player, side: "radiant" as const })),
    ...row.data.dire_team.map((player) => ({ player, side: "dire" as const })),
  ];
}

export function computeConnections(
  playerId: string,
  matches: MatchRow[],
  identities: Map<string, PlayerIdentity>,
): ConnectionRow[] {
  const result = new Map<string, ConnectionRow>();
  for (const match of matches) {
    const roster = participants(match);
    const me = roster.find(({ player }) => String(player.steam_id) === playerId);
    if (!me) continue;
    const won = match.data.winner === me.side;
    for (const { player, side } of roster) {
      const sid = String(player.steam_id);
      if (sid === playerId) continue;
      const row = result.get(sid) || {
        steam_id: sid,
        name: identities.get(sid)?.display_name || player.nickname,
        together: 0,
        together_wins: 0,
        opponents: 0,
        opponent_wins: 0,
      };
      if (side === me.side) {
        row.together++;
        if (won) row.together_wins++;
      } else {
        row.opponents++;
        if (won) row.opponent_wins++;
      }
      result.set(sid, row);
    }
  }
  return [...result.values()];
}

export function connectionScore(row: ConnectionRow, mode: ConnectionMode) {
  const games =
    mode === "together"
      ? row.together
      : mode === "opponents"
        ? row.opponents
        : row.together + row.opponents;
  const wins =
    mode === "together"
      ? row.together_wins
      : mode === "opponents"
        ? row.opponent_wins
        : row.together_wins + row.opponent_wins;
  return {
    games,
    wins,
    losses: games - wins,
    winrate: games ? Math.round((wins / games) * 100) : 0,
  };
}

export function connectionMatches(
  matches: MatchRow[],
  playerId: string,
  otherId: string,
  mode: ConnectionMode,
) {
  const result: {
    row: MatchRow;
    player: MatchPlayer;
    other: MatchPlayer;
    together: boolean;
    won: boolean;
  }[] = [];
  for (const row of matches) {
    const roster = participants(row);
    const me = roster.find(({ player }) => String(player.steam_id) === playerId);
    const peer = roster.find(({ player }) => String(player.steam_id) === otherId);
    if (!me || !peer || playerId === otherId) continue;
    const together = me.side === peer.side;
    if ((mode === "together" && !together) || (mode === "opponents" && together)) continue;
    result.push({
      row,
      player: me.player,
      other: peer.player,
      together,
      won: row.data.winner === me.side,
    });
  }
  return result.sort(
    (a, b) =>
      Date.parse(b.row.start_time) - Date.parse(a.row.start_time) ||
      b.row.match_id - a.row.match_id,
  );
}
