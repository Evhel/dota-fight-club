import type { ChatMessage, DotaMatch, MatchRow } from "./types";

export interface PlayerIdentity {
  steam_id: string;
  display_name: string; // first nickname ever used
  match_count: number;
}

export interface PlayerStats {
  steam_id: string;
  name: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number; // integer percent
  total_seconds: number; // games + draft for those matches
  unique_heroes: string[];
  max_win_streak: number;
  max_loss_streak: number;
  current_streak: { type: "win" | "loss" | "none"; count: number };
  top_word: string;
  best_teammate?: { name: string; winrate: number; games: number };
  worst_teammate?: { name: string; winrate: number; games: number };
  best_opponent?: { name: string; winrate: number; games: number };
  worst_opponent?: { name: string; winrate: number; games: number };
  // per-player records
  max_kda: { value: number; match_id: number; kills: number; deaths: number; assists: number };
  avg_kda: number;
  max_net_worth: { value: number; match_id: number };
  avg_net_worth: number;
  max_creeps: { value: number; match_id: number };
  avg_creeps: number;
  max_denies: { value: number; match_id: number };
  avg_denies: number;
  max_gpm: { value: number; match_id: number };
  avg_gpm: number;
  max_xpm: { value: number; match_id: number };
  avg_xpm: number;
  max_dmg: { value: number; match_id: number };
  avg_dmg: number;
  max_got: { value: number; match_id: number };
  avg_got: number;
  max_heal: { value: number; match_id: number };
  avg_heal: number;
  max_bld: { value: number; match_id: number };
  avg_bld: number;
  top_hero_games?: { hero: string; games: number };
  top_hero_winrate?: { hero: string; winrate: number; games: number };
  max_obs: { value: number; match_id: number };
  max_sen: { value: number; match_id: number };
  max_dewards: { value: number; match_id: number };
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  total_high_fives: number;
  total_chat_messages: number;
  first_match_index: number; // 1-based ordinal in chronological match list
}

export interface HeroStats {
  name: string;
  games: number;
  wins: number;
  winrate: number;
  bans: number;
  first_bans: number;
}

export interface GlobalRecords {
  shortest_match?: { match_id: number; minutes: number };
  longest_match?: { match_id: number; minutes: number };
  most_obs?: { steam_id: string; name: string; value: number; match_id: number };
  most_sen?: { steam_id: string; name: string; value: number; match_id: number };
  most_dewards?: { steam_id: string; name: string; value: number; match_id: number };
  top_word?: string;
  most_games_player?: { steam_id: string; name: string; games: number };
  best_winrate_player?: { steam_id: string; name: string; winrate: number; games: number };
  most_chat_player?: { steam_id: string; name: string; messages: number };
  most_high_fives_player?: { steam_id: string; name: string; high_fives: number };
  // per-stat top-10 lists for records page
  top_kills?: { steam_id: string; name: string; value: number; match_id: number };
  top_deaths?: { steam_id: string; name: string; value: number; match_id: number };
  top_assists?: { steam_id: string; name: string; value: number; match_id: number };
  top_perfect_kda?: { steam_id: string; name: string; value: number; match_id: number };
  top_net_worth?: { steam_id: string; name: string; value: number; match_id: number };
  top_creeps?: { steam_id: string; name: string; value: number; match_id: number };
  top_denies?: { steam_id: string; name: string; value: number; match_id: number };
  top_gpm?: { steam_id: string; name: string; value: number; match_id: number };
  top_xpm?: { steam_id: string; name: string; value: number; match_id: number };
  top_dmg?: { steam_id: string; name: string; value: number; match_id: number };
  top_got?: { steam_id: string; name: string; value: number; match_id: number };
  top_heal?: { steam_id: string; name: string; value: number; match_id: number };
  top_bld?: { steam_id: string; name: string; value: number; match_id: number };
}

const STOP_WORDS = new Set([
  "и","в","не","на","я","что","а","ты","с","но","да","за","по","к","о","у","же","ну","то","как","это","так","для","от","до","из","или","бы","ли","все","есть","быть","он","она","они","мы","вы","мне","меня","тебе","тебя","ему","ей","им","нас","вам","их","свой","своя","себя","там","тут","там","там","там",
  "the","a","an","i","you","he","she","it","we","they","is","are","was","were","be","to","of","in","on","at","for","and","or","but","with","my","your","his","her","our","this","that"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

export function buildIdentities(matches: MatchRow[]): Map<string, PlayerIdentity> {
  // Sort by start_time ascending so first nickname is the earliest
  const sorted = [...matches].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  const map = new Map<string, PlayerIdentity>();
  for (const row of sorted) {
    const all = [...row.data.radiant_team, ...row.data.dire_team];
    for (const p of all) {
      const sid = String(p.steam_id);
      const existing = map.get(sid);
      if (!existing) {
        map.set(sid, { steam_id: sid, display_name: p.nickname, match_count: 1 });
      } else {
        existing.match_count += 1;
      }
    }
  }
  return map;
}

function nameToSteam(match: DotaMatch): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of [...match.radiant_team, ...match.dire_team]) {
    m.set(p.nickname, String(p.steam_id));
  }
  return m;
}

function playerSideInMatch(match: DotaMatch, sid: string): "radiant" | "dire" | null {
  if (match.radiant_team.some((p) => String(p.steam_id) === sid)) return "radiant";
  if (match.dire_team.some((p) => String(p.steam_id) === sid)) return "dire";
  return null;
}

export function sortedMatches(matches: MatchRow[]): MatchRow[] {
  return [...matches].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
}

export function computePlayerStats(
  steam_id: string,
  matches: MatchRow[],
  identities: Map<string, PlayerIdentity>,
): PlayerStats | null {
  const identity = identities.get(steam_id);
  if (!identity) return null;
  const sorted = sortedMatches(matches);

  let games = 0,
    wins = 0,
    losses = 0;
  let totalSeconds = 0;
  const heroGames = new Map<string, { games: number; wins: number }>();
  const heroSet = new Set<string>();
  let maxWinStreak = 0,
    maxLossStreak = 0,
    curWinStreak = 0,
    curLossStreak = 0;
  let lastWin: boolean | null = null;
  let curStreakType: "win" | "loss" | "none" = "none";
  let curStreakCount = 0;
  const wordCount = new Map<string, number>();
  const teammates = new Map<string, { games: number; wins: number }>();
  const opponents = new Map<string, { games: number; wins: number }>();

  let maxKda = { value: -Infinity, match_id: 0, kills: 0, deaths: 0, assists: 0 };
  let sumKda = 0;
  let maxNet = { value: -Infinity, match_id: 0 };
  let sumNet = 0;
  let maxCreeps = { value: -Infinity, match_id: 0 };
  let sumCreeps = 0;
  let maxDenies = { value: -Infinity, match_id: 0 };
  let sumDenies = 0;
  let maxGpm = { value: -Infinity, match_id: 0 }, sumGpm = 0;
  let maxXpm = { value: -Infinity, match_id: 0 }, sumXpm = 0;
  let maxDmg = { value: -Infinity, match_id: 0 }, sumDmg = 0;
  let maxGot = { value: -Infinity, match_id: 0 }, sumGot = 0;
  let maxHeal = { value: -Infinity, match_id: 0 }, sumHeal = 0;
  let maxBld = { value: -Infinity, match_id: 0 }, sumBld = 0;
  let maxObs = { value: -Infinity, match_id: 0 };
  let maxSen = { value: -Infinity, match_id: 0 };
  let maxDe = { value: -Infinity, match_id: 0 };
  let totalKills = 0,
    totalDeaths = 0,
    totalAssists = 0,
    totalHighFives = 0,
    totalChat = 0;
  let firstMatchIndex = 0;

  for (let idx = 0; idx < sorted.length; idx++) {
    const row = sorted[idx];
    const m = row.data;
    const side = playerSideInMatch(m, steam_id);
    if (!side) continue;
    if (!firstMatchIndex) firstMatchIndex = idx + 1;
    const teamPlayers = side === "radiant" ? m.radiant_team : m.dire_team;
    const me = teamPlayers.find((p) => String(p.steam_id) === steam_id)!;
    games += 1;
    const won = m.winner === side;
    if (won) {
      wins += 1;
      curWinStreak += 1;
      curLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, curWinStreak);
    } else {
      losses += 1;
      curLossStreak += 1;
      curWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, curLossStreak);
    }
    lastWin = won;
    totalSeconds += (m.duration_seconds || 0) + (m.draft_duration_minutes || 0) * 60;
    heroSet.add(me.hero);
    const hg = heroGames.get(me.hero) || { games: 0, wins: 0 };
    hg.games += 1;
    if (won) hg.wins += 1;
    heroGames.set(me.hero, hg);

    // teammates
    for (const t of teamPlayers) {
      if (String(t.steam_id) === steam_id) continue;
      const tid = String(t.steam_id);
      const tm = teammates.get(tid) || { games: 0, wins: 0 };
      tm.games += 1;
      if (won) tm.wins += 1;
      teammates.set(tid, tm);
    }
    // opponents
    const oppPlayers = side === "radiant" ? m.dire_team : m.radiant_team;
    for (const o of oppPlayers) {
      const oid = String(o.steam_id);
      const om = opponents.get(oid) || { games: 0, wins: 0 };
      om.games += 1;
      if (won) om.wins += 1;
      opponents.set(oid, om);
    }

    // per-match metrics
    const kda = m.kda?.[me.nickname];
    if (kda) {
      totalKills += kda.kills;
      totalDeaths += kda.deaths;
      totalAssists += kda.assists;
      const ratio = kda.kda_ratio ?? (kda.kills + kda.assists) / Math.max(1, kda.deaths);
      sumKda += ratio;
      if (ratio > maxKda.value) maxKda = { value: ratio, match_id: m.match_id, kills: kda.kills, deaths: kda.deaths, assists: kda.assists };
    }
    const nw = m.net_worth?.[me.nickname];
    if (nw !== undefined) {
      sumNet += nw;
      if (nw > maxNet.value) maxNet = { value: nw, match_id: m.match_id };
    }
    const ck = m.last_hits?.[me.nickname] ?? m.creep_kills?.[me.nickname];
    if (ck !== undefined) {
      sumCreeps += ck;
      if (ck > maxCreeps.value) maxCreeps = { value: ck, match_id: m.match_id };
    }
    const dn = m.denies?.[me.nickname] ?? 0;
    sumDenies += dn;
    if (dn > maxDenies.value) maxDenies = { value: dn, match_id: m.match_id };
    const gpm = m.gpm?.[me.nickname] ?? m.gold_per_minute?.[me.nickname] ?? 0;
    sumGpm += gpm;
    if (gpm > maxGpm.value) maxGpm = { value: gpm, match_id: m.match_id };
    const xpm = m.xpm?.[me.nickname] ?? m.xp_per_minute?.[me.nickname] ?? 0;
    sumXpm += xpm;
    if (xpm > maxXpm.value) maxXpm = { value: xpm, match_id: m.match_id };
    const dmg = m.hero_damage?.[me.nickname] ?? 0;
    sumDmg += dmg;
    if (dmg > maxDmg.value) maxDmg = { value: dmg, match_id: m.match_id };
    const got = m.damage_taken?.[me.nickname] ?? 0;
    sumGot += got;
    if (got > maxGot.value) maxGot = { value: got, match_id: m.match_id };
    const heal = m.hero_healing?.[me.nickname] ?? 0;
    sumHeal += heal;
    if (heal > maxHeal.value) maxHeal = { value: heal, match_id: m.match_id };
    const bld = m.tower_damage?.[me.nickname] ?? 0;
    sumBld += bld;
    if (bld > maxBld.value) maxBld = { value: bld, match_id: m.match_id };
    const wp = m.wards_placed?.[me.nickname];
    if (wp) {
      if (wp.observer > maxObs.value) maxObs = { value: wp.observer, match_id: m.match_id };
      if (wp.sentry > maxSen.value) maxSen = { value: wp.sentry, match_id: m.match_id };
    }
    const wd = m.wards_destroyed?.[me.nickname];
    if (wd && wd.total > maxDe.value) maxDe = { value: wd.total, match_id: m.match_id };

    totalHighFives += m.high_fives?.[me.nickname] ?? 0;

    // chat: count own messages by player_slot
    // player_slot: 0-4 = radiant, 128-132 = dire (but in some files just 0-9)
    const myIdx = teamPlayers.indexOf(me);
    const mySlot = side === "radiant" ? myIdx : 5 + myIdx;
    const mySlotAlt = side === "radiant" ? myIdx : 128 + myIdx;
    for (const msg of m.chat_after_draft || []) {
      if (msg.player_slot === mySlot || msg.player_slot === mySlotAlt) {
        totalChat += 1;
        for (const w of tokenize(msg.text)) {
          wordCount.set(w, (wordCount.get(w) || 0) + 1);
        }
      }
    }
  }

  // current streak
  if (lastWin === true) {
    curStreakType = "win";
    curStreakCount = curWinStreak;
  } else if (lastWin === false) {
    curStreakType = "loss";
    curStreakCount = curLossStreak;
  }

  let topWord = "";
  let topWordCount = 0;
  for (const [w, c] of wordCount) {
    if (c > topWordCount) {
      topWord = w;
      topWordCount = c;
    }
  }

  // top heroes
  let topHeroGames: { hero: string; games: number } | undefined;
  let topHeroWr: { hero: string; winrate: number; games: number } | undefined;
  for (const [hero, hg] of heroGames) {
    if (!topHeroGames || hg.games > topHeroGames.games) topHeroGames = { hero, games: hg.games };
    const wr = (hg.wins / hg.games) * 100;
    if (!topHeroWr || wr > topHeroWr.winrate || (wr === topHeroWr.winrate && hg.games > topHeroWr.games)) {
      topHeroWr = { hero, winrate: Math.round(wr), games: hg.games };
    }
  }

  // best/worst teammate (min 3 games together)
  let best: { name: string; winrate: number; games: number } | undefined;
  let worst: { name: string; winrate: number; games: number } | undefined;
  for (const [tid, tm] of teammates) {
    if (tm.games < 3) continue;
    const wr = Math.round((tm.wins / tm.games) * 100);
    const name = identities.get(tid)?.display_name || tid;
    if (!best || wr > best.winrate) best = { name, winrate: wr, games: tm.games };
    if (!worst || wr < worst.winrate) worst = { name, winrate: wr, games: tm.games };
  }

  // best/worst opponent (min 3 games against). "winrate" here = winrate vs that opponent
  let bestOpp: { name: string; winrate: number; games: number } | undefined;
  let worstOpp: { name: string; winrate: number; games: number } | undefined;
  for (const [oid, om] of opponents) {
    if (om.games < 3) continue;
    const wr = Math.round((om.wins / om.games) * 100);
    const name = identities.get(oid)?.display_name || oid;
    if (!bestOpp || wr > bestOpp.winrate) bestOpp = { name, winrate: wr, games: om.games };
    if (!worstOpp || wr < worstOpp.winrate) worstOpp = { name, winrate: wr, games: om.games };
  }

  return {
    steam_id,
    name: identity.display_name,
    games,
    wins,
    losses,
    winrate: games ? Math.round((wins / games) * 100) : 0,
    total_seconds: Math.round(totalSeconds),
    unique_heroes: [...heroSet],
    max_win_streak: maxWinStreak,
    max_loss_streak: maxLossStreak,
    current_streak: { type: curStreakType, count: curStreakCount },
    top_word: topWord,
    best_teammate: best,
    worst_teammate: worst,
    best_opponent: bestOpp,
    worst_opponent: worstOpp,
    max_kda: { value: Math.round((maxKda.value === -Infinity ? 0 : maxKda.value) * 10) / 10, match_id: maxKda.match_id, kills: maxKda.kills, deaths: maxKda.deaths, assists: maxKda.assists },
    avg_kda: games ? Math.round((sumKda / games) * 10) / 10 : 0,
    max_net_worth: { value: maxNet.value === -Infinity ? 0 : maxNet.value, match_id: maxNet.match_id },
    avg_net_worth: games ? Math.round(sumNet / games) : 0,
    max_creeps: { value: maxCreeps.value === -Infinity ? 0 : maxCreeps.value, match_id: maxCreeps.match_id },
    avg_creeps: games ? Math.round(sumCreeps / games) : 0,
    max_denies: { value: maxDenies.value === -Infinity ? 0 : maxDenies.value, match_id: maxDenies.match_id },
    avg_denies: games ? Math.round(sumDenies / games) : 0,
    max_gpm: { value: maxGpm.value === -Infinity ? 0 : Math.round(maxGpm.value), match_id: maxGpm.match_id },
    avg_gpm: games ? Math.round(sumGpm / games) : 0,
    max_xpm: { value: maxXpm.value === -Infinity ? 0 : Math.round(maxXpm.value), match_id: maxXpm.match_id },
    avg_xpm: games ? Math.round(sumXpm / games) : 0,
    max_dmg: { value: maxDmg.value === -Infinity ? 0 : Math.round(maxDmg.value), match_id: maxDmg.match_id },
    avg_dmg: games ? Math.round(sumDmg / games) : 0,
    max_got: { value: maxGot.value === -Infinity ? 0 : Math.round(maxGot.value), match_id: maxGot.match_id },
    avg_got: games ? Math.round(sumGot / games) : 0,
    max_heal: { value: maxHeal.value === -Infinity ? 0 : Math.round(maxHeal.value), match_id: maxHeal.match_id },
    avg_heal: games ? Math.round(sumHeal / games) : 0,
    max_bld: { value: maxBld.value === -Infinity ? 0 : Math.round(maxBld.value), match_id: maxBld.match_id },
    avg_bld: games ? Math.round(sumBld / games) : 0,
    top_hero_games: topHeroGames,
    top_hero_winrate: topHeroWr,
    max_obs: { value: maxObs.value === -Infinity ? 0 : maxObs.value, match_id: maxObs.match_id },
    max_sen: { value: maxSen.value === -Infinity ? 0 : maxSen.value, match_id: maxSen.match_id },
    max_dewards: { value: maxDe.value === -Infinity ? 0 : maxDe.value, match_id: maxDe.match_id },
    total_kills: totalKills,
    total_deaths: totalDeaths,
    total_assists: totalAssists,
    avg_kills: games ? Math.round((totalKills / games) * 10) / 10 : 0,
    avg_deaths: games ? Math.round((totalDeaths / games) * 10) / 10 : 0,
    avg_assists: games ? Math.round((totalAssists / games) * 10) / 10 : 0,
    total_high_fives: totalHighFives,
    total_chat_messages: totalChat,
    first_match_index: firstMatchIndex,
  };
}

export function computeAllPlayerStats(
  matches: MatchRow[],
  identities: Map<string, PlayerIdentity>,
): PlayerStats[] {
  const out: PlayerStats[] = [];
  for (const sid of identities.keys()) {
    const s = computePlayerStats(sid, matches, identities);
    if (s) out.push(s);
  }
  out.sort((a, b) => b.games - a.games);
  return out;
}

export function computeHeroStats(matches: MatchRow[]): HeroStats[] {
  const map = new Map<string, { games: number; wins: number; bans: number; firstBans: number }>();
  for (const row of matches) {
    const m = row.data;
    for (const p of m.radiant_team) {
      const h = map.get(p.hero) || { games: 0, wins: 0, bans: 0, firstBans: 0 };
      h.games += 1;
      if (m.winner === "radiant") h.wins += 1;
      map.set(p.hero, h);
    }
    for (const p of m.dire_team) {
      const h = map.get(p.hero) || { games: 0, wins: 0, bans: 0, firstBans: 0 };
      h.games += 1;
      if (m.winner === "dire") h.wins += 1;
      map.set(p.hero, h);
    }
    const bans = (m.bans || []).slice().sort((a, b) => a.tick - b.tick);
    bans.forEach((b, i) => {
      const h = map.get(b.hero) || { games: 0, wins: 0, bans: 0, firstBans: 0 };
      h.bans += 1;
      if (i === 0) h.firstBans += 1;
      map.set(b.hero, h);
    });
  }
  const out: HeroStats[] = [];
  for (const [name, v] of map) {
    out.push({
      name,
      games: v.games,
      wins: v.wins,
      winrate: v.games ? Math.round((v.wins / v.games) * 100) : 0,
      bans: v.bans,
      first_bans: v.firstBans,
    });
  }
  return out;
}

export interface GlobalStats {
  total_games: number;
  total_seconds: number;
  total_players: number;
  radiant_wins: number;
  dire_wins: number;
  modes: Record<string, number>;
  activity_by_date: Record<string, number>;
  records: GlobalRecords;
  word_cloud: { word: string; count: number }[];
}

export function computeGlobalStats(
  matches: MatchRow[],
  identities: Map<string, PlayerIdentity>,
  playerStats: PlayerStats[],
): GlobalStats {
  let total_seconds = 0;
  let rad = 0,
    dire = 0;
  const modes: Record<string, number> = {};
  const activity: Record<string, number> = {};
  const wordCount = new Map<string, number>();
  const allWordCount = new Map<string, number>();

  let shortest: { match_id: number; minutes: number } | undefined;
  let longest: { match_id: number; minutes: number } | undefined;
  let mostObs: GlobalRecords["most_obs"];
  let mostSen: GlobalRecords["most_sen"];
  let mostDe: GlobalRecords["most_dewards"];
  let topKills: GlobalRecords["top_kills"];
  let topDeaths: GlobalRecords["top_deaths"];
  let topAssists: GlobalRecords["top_assists"];
  let topPerfectKda: GlobalRecords["top_perfect_kda"];
  let topNet: GlobalRecords["top_net_worth"];
  let topCreeps: GlobalRecords["top_creeps"];
  let topDenies: GlobalRecords["top_denies"];
  let topGpm: GlobalRecords["top_gpm"];
  let topXpm: GlobalRecords["top_xpm"];
  let topDmg: GlobalRecords["top_dmg"];
  let topGot: GlobalRecords["top_got"];
  let topHeal: GlobalRecords["top_heal"];
  let topBld: GlobalRecords["top_bld"];

  const trackTop = (
    cur: { steam_id: string; name: string; value: number; match_id: number } | undefined,
    sidStr: string,
    disp: string,
    value: number,
    match_id: number,
  ) =>
    !cur || value > cur.value
      ? { steam_id: sidStr, name: disp, value, match_id }
      : cur;

  const nicknameToSteam = (m: DotaMatch, name: string) =>
    [...m.radiant_team, ...m.dire_team].find((p) => p.nickname === name)?.steam_id;

  for (const row of matches) {
    const m = row.data;
    total_seconds += (m.duration_seconds || 0) + (m.draft_duration_minutes || 0) * 60;
    if (m.winner === "radiant") rad += 1;
    else dire += 1;
    modes[m.game_mode || "Unknown"] = (modes[m.game_mode || "Unknown"] || 0) + 1;
    const date = row.start_time.slice(0, 10);
    activity[date] = (activity[date] || 0) + 1;

    const dur = m.duration_minutes;
    if (!shortest || dur < shortest.minutes) shortest = { match_id: m.match_id, minutes: dur };
    if (!longest || dur > longest.minutes) longest = { match_id: m.match_id, minutes: dur };

    for (const [name, w] of Object.entries(m.wards_placed || {})) {
      const sid = nicknameToSteam(m, name);
      if (!sid) continue;
      const sidStr = String(sid);
      const disp = identities.get(sidStr)?.display_name || name;
      if (!mostObs || w.observer > mostObs.value) mostObs = { steam_id: sidStr, name: disp, value: w.observer, match_id: m.match_id };
      if (!mostSen || w.sentry > mostSen.value) mostSen = { steam_id: sidStr, name: disp, value: w.sentry, match_id: m.match_id };
    }
    for (const [name, w] of Object.entries(m.wards_destroyed || {})) {
      const sid = nicknameToSteam(m, name);
      if (!sid) continue;
      const sidStr = String(sid);
      const disp = identities.get(sidStr)?.display_name || name;
      if (!mostDe || w.total > mostDe.value) mostDe = { steam_id: sidStr, name: disp, value: w.total, match_id: m.match_id };
    }
    for (const [name, kda] of Object.entries(m.kda || {})) {
      const sid = nicknameToSteam(m, name);
      if (!sid) continue;
      const sidStr = String(sid);
      const disp = identities.get(sidStr)?.display_name || name;
      if (!topKills || kda.kills > topKills.value) topKills = { steam_id: sidStr, name: disp, value: kda.kills, match_id: m.match_id };
      if (!topDeaths || kda.deaths > topDeaths.value) topDeaths = { steam_id: sidStr, name: disp, value: kda.deaths, match_id: m.match_id };
      if (!topAssists || kda.assists > topAssists.value) topAssists = { steam_id: sidStr, name: disp, value: kda.assists, match_id: m.match_id };
      if (kda.deaths === 0) {
        const score = kda.kills + kda.assists;
        if (!topPerfectKda || score > topPerfectKda.value) topPerfectKda = { steam_id: sidStr, name: disp, value: score, match_id: m.match_id };
      }
    }
    for (const [name, nw] of Object.entries(m.net_worth || {})) {
      const sid = nicknameToSteam(m, name);
      if (!sid) continue;
      const sidStr = String(sid);
      const disp = identities.get(sidStr)?.display_name || name;
      if (!topNet || nw > topNet.value) topNet = { steam_id: sidStr, name: disp, value: nw, match_id: m.match_id };
    }
    const ckSource = m.last_hits || m.creep_kills || {};
    for (const [name, ck] of Object.entries(ckSource)) {
      const sid = nicknameToSteam(m, name);
      if (!sid) continue;
      const sidStr = String(sid);
      const disp = identities.get(sidStr)?.display_name || name;
      if (!topCreeps || ck > topCreeps.value) topCreeps = { steam_id: sidStr, name: disp, value: ck, match_id: m.match_id };
    }
    for (const [name, v] of Object.entries(m.denies || {})) {
      const sid = nicknameToSteam(m, name); if (!sid) continue;
      const sidStr = String(sid); const disp = identities.get(sidStr)?.display_name || name;
      topDenies = trackTop(topDenies, sidStr, disp, v, m.match_id);
    }
    const gpmSrc = m.gpm || m.gold_per_minute || {};
    for (const [name, v] of Object.entries(gpmSrc)) {
      const sid = nicknameToSteam(m, name); if (!sid) continue;
      const sidStr = String(sid); const disp = identities.get(sidStr)?.display_name || name;
      topGpm = trackTop(topGpm, sidStr, disp, Math.round(v), m.match_id);
    }
    const xpmSrc = m.xpm || m.xp_per_minute || {};
    for (const [name, v] of Object.entries(xpmSrc)) {
      const sid = nicknameToSteam(m, name); if (!sid) continue;
      const sidStr = String(sid); const disp = identities.get(sidStr)?.display_name || name;
      topXpm = trackTop(topXpm, sidStr, disp, Math.round(v), m.match_id);
    }
    for (const [name, v] of Object.entries(m.hero_damage || {})) {
      const sid = nicknameToSteam(m, name); if (!sid) continue;
      const sidStr = String(sid); const disp = identities.get(sidStr)?.display_name || name;
      topDmg = trackTop(topDmg, sidStr, disp, v, m.match_id);
    }
    for (const [name, v] of Object.entries(m.damage_taken || {})) {
      const sid = nicknameToSteam(m, name); if (!sid) continue;
      const sidStr = String(sid); const disp = identities.get(sidStr)?.display_name || name;
      topGot = trackTop(topGot, sidStr, disp, v, m.match_id);
    }
    for (const [name, v] of Object.entries(m.hero_healing || {})) {
      const sid = nicknameToSteam(m, name); if (!sid) continue;
      const sidStr = String(sid); const disp = identities.get(sidStr)?.display_name || name;
      topHeal = trackTop(topHeal, sidStr, disp, v, m.match_id);
    }
    for (const [name, v] of Object.entries(m.tower_damage || {})) {
      const sid = nicknameToSteam(m, name); if (!sid) continue;
      const sidStr = String(sid); const disp = identities.get(sidStr)?.display_name || name;
      topBld = trackTop(topBld, sidStr, disp, v, m.match_id);
    }
    for (const msg of m.chat_after_draft || []) {
      for (const w of tokenize(msg.text)) {
        allWordCount.set(w, (allWordCount.get(w) || 0) + 1);
        wordCount.set(w, (wordCount.get(w) || 0) + 1);
      }
    }
  }

  let topWord: string | undefined;
  let topWordCount = 0;
  for (const [w, c] of wordCount) {
    if (c > topWordCount) {
      topWord = w;
      topWordCount = c;
    }
  }

  const mostGames = playerStats.length
    ? { steam_id: playerStats[0].steam_id, name: playerStats[0].name, games: playerStats[0].games }
    : undefined;
  const eligibleWr = playerStats.filter((p) => p.games >= 10);
  const bestWr = eligibleWr.length
    ? eligibleWr.reduce((a, b) => (b.winrate > a.winrate ? b : a))
    : undefined;
  const mostChat = playerStats.length
    ? playerStats.reduce((a, b) => (b.total_chat_messages > a.total_chat_messages ? b : a))
    : undefined;
  const mostHi5 = playerStats.length
    ? playerStats.reduce((a, b) => (b.total_high_fives > a.total_high_fives ? b : a))
    : undefined;

  const word_cloud = [...allWordCount.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 80);

  return {
    total_games: matches.length,
    total_seconds: Math.round(total_seconds),
    total_players: identities.size,
    radiant_wins: rad,
    dire_wins: dire,
    modes,
    activity_by_date: activity,
    word_cloud,
    records: {
      shortest_match: shortest,
      longest_match: longest,
      most_obs: mostObs,
      most_sen: mostSen,
      most_dewards: mostDe,
      top_word: topWord,
      most_games_player: mostGames,
      best_winrate_player: bestWr
        ? { steam_id: bestWr.steam_id, name: bestWr.name, winrate: bestWr.winrate, games: bestWr.games }
        : undefined,
      most_chat_player: mostChat
        ? { steam_id: mostChat.steam_id, name: mostChat.name, messages: mostChat.total_chat_messages }
        : undefined,
      most_high_fives_player: mostHi5
        ? { steam_id: mostHi5.steam_id, name: mostHi5.name, high_fives: mostHi5.total_high_fives }
        : undefined,
      top_kills: topKills,
      top_deaths: topDeaths,
      top_assists: topAssists,
      top_perfect_kda: topPerfectKda,
      top_net_worth: topNet,
      top_creeps: topCreeps,
    },
  };
}

export function computeVsStats(
  steam_id: string,
  matches: MatchRow[],
  identities: Map<string, PlayerIdentity>,
) {
  type Row = {
    steam_id: string;
    name: string;
    total: number;
    same_team: number;
    same_wins: number;
    opp_team: number;
    opp_wins: number;
  };
  const map = new Map<string, Row>();
  for (const row of matches) {
    const m = row.data;
    const mySide = playerSideInMatch(m, steam_id);
    if (!mySide) continue;
    const myWon = m.winner === mySide;
    const allPlayers = [...m.radiant_team, ...m.dire_team];
    for (const p of allPlayers) {
      const sid = String(p.steam_id);
      if (sid === steam_id) continue;
      const otherSide = playerSideInMatch(m, sid)!;
      const name = identities.get(sid)?.display_name || p.nickname;
      const r = map.get(sid) || {
        steam_id: sid,
        name,
        total: 0,
        same_team: 0,
        same_wins: 0,
        opp_team: 0,
        opp_wins: 0,
      };
      r.total += 1;
      if (otherSide === mySide) {
        r.same_team += 1;
        if (myWon) r.same_wins += 1;
      } else {
        r.opp_team += 1;
        if (myWon) r.opp_wins += 1; // my win means opponent lost
      }
      map.set(sid, r);
    }
  }
  return [...map.values()]
    .map((r) => ({
      ...r,
      same_winrate: r.same_team ? Math.round((r.same_wins / r.same_team) * 100) : 0,
      opp_winrate: r.opp_team ? Math.round((r.opp_wins / r.opp_team) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м ${sec}с`;
}

export function matchDeaths(m: DotaMatch): { radiant: number; dire: number } {
  let r = 0,
    d = 0;
  for (const p of m.radiant_team) r += m.kda?.[p.nickname]?.deaths ?? 0;
  for (const p of m.dire_team) d += m.kda?.[p.nickname]?.deaths ?? 0;
  return { radiant: r, dire: d };
}
