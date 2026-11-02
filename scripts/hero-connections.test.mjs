import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { computeHeroDetails } from "../src/lib/hero-details.ts";
import { buildIdentities, computeHeroStats } from "../src/lib/stats.ts";
import {
  computeConnections,
  connectionScore,
  connectionMatches,
  filterConnectionDates,
} from "../src/lib/connections.ts";

const original = JSON.parse(
  readFileSync(new URL("../src/data/matches/9034069535.json", import.meta.url), "utf8"),
);
function row(id, winner = "radiant", date = "2026-11-01T12:00:00Z") {
  const data = structuredClone(original);
  data.match_id = id;
  data.winner = winner;
  data.start_time = date;
  return { match_id: id, start_time: date, created_at: date, data };
}

test("hero records exclude other heroes and unverified legacy damage/healing", () => {
  const rows = [row(1, "dire"), row(2), row(3, "dire")];
  const hero = rows[0].data.radiant_team[0];
  const foreign = rows[0].data.dire_team[0];
  for (const [i, item] of rows.entries()) {
    item.data.hero_damage[hero.nickname] = [111, 222, 9999999][i];
    item.data.hero_healing[hero.nickname] = [20, 30, 9999999][i];
    item.data.hero_damage[foreign.nickname] = 999999999;
    item.data.kda[foreign.nickname].kills = 99;
    item.data.kda[hero.nickname].kills = i + 1;
  }
  delete rows[2].data.data_quality;
  const result = computeHeroDetails(rows, "clinkz");
  assert.equal(result.summary.games, 3);
  assert.equal(result.summary.wins, 1);
  assert.equal(result.players.length, 1);
  assert.deepEqual(
    [result.players[0].games, result.players[0].wins, result.players[0].losses],
    [3, 1, 2],
  );
  assert.equal(result.records.top_kills.value, 3);
  assert.equal(result.records.top_dmg.value, 222);
  assert.equal(result.records.top_dmg.match_id, 2);
  assert.equal(result.records.top_heal.value, 30);
  assert.equal(result.verifiedCombatGames, 2);
  assert.ok(
    result.records.top_gpm.value > 0,
    "optional gpm map must not suppress gold_per_minute fallback",
  );
  assert.ok(
    result.records.top_xpm.value > 0,
    "optional xpm map must not suppress xp_per_minute fallback",
  );
  assert.equal(rows[0].data.kda[foreign.nickname].kills, 99, "source data is not mutated");
});

test("ban-only hero has a page with no invented games or records", () => {
  const match = row(1);
  match.data.bans = [{ hero: "Oracle", team: 2, tick: 1 }];
  const result = computeHeroDetails([match], "oracle");
  assert.equal(result.summary.games, 0);
  assert.equal(result.summary.bans, 1);
  assert.equal(result.players.length, 0);
  assert.equal(result.records.top_kills, undefined);
  assert.equal(computeHeroDetails([match], "missing-hero"), null);
});

test("hero aliases share one page and one set of statistics", () => {
  const a = row(1);
  const b = row(2);
  a.data.radiant_team[0].hero = "Outworld Devourer";
  b.data.radiant_team[0].hero = "Outworld Destroyer";
  const heroes = computeHeroStats([a, b]).filter((h) => h.name.startsWith("Outworld"));
  assert.equal(heroes.length, 1);
  assert.equal(computeHeroDetails([a, b], "obsidian_destroyer").summary.games, 2);
});

test("known heroes without any games or bans still have a page", () => {
  const result = computeHeroDetails([], "chen");
  assert.equal(result.summary.games, 0);
  assert.equal(result.summary.bans, 0);
  assert.deepEqual(result.players, []);
  assert.equal(result.records.top_kills, undefined);
});

test("connections distinguish teammates and opponents and keep player perspective", () => {
  const rows = [row(1, "dire"), row(2), row(3)];
  const me = String(original.radiant_team[0].steam_id);
  const mate = String(original.radiant_team[1].steam_id);
  const enemy = String(original.dire_team[0].steam_id);
  const identities = buildIdentities(rows);
  const relations = computeConnections(me, rows, identities);
  assert.equal(relations.length, 9);
  assert.equal(
    relations.some((r) => r.steam_id === me),
    false,
  );
  const team = relations.find((r) => r.steam_id === mate);
  const opponent = relations.find((r) => r.steam_id === enemy);
  assert.deepEqual(connectionScore(team, "together"), {
    games: 3,
    wins: 2,
    losses: 1,
    winrate: 67,
  });
  assert.equal(connectionScore(team, "opponents").games, 0);
  assert.deepEqual(connectionScore(opponent, "opponents"), {
    games: 3,
    wins: 2,
    losses: 1,
    winrate: 67,
  });
  const reverse = computeConnections(enemy, rows, identities).find((r) => r.steam_id === me);
  assert.equal(connectionScore(reverse, "opponents").winrate, 33);
  assert.equal(connectionMatches(rows, me, enemy, "together").length, 0);
  assert.equal(connectionMatches(rows, me, enemy, "opponents").length, 3);
  assert.equal(connectionMatches(rows, me, me, "all").length, 0);
});

test("date filters include the entire Moscow day, not midnight UTC", () => {
  const rows = [
    row(1, "dire", "2026-10-31T20:59:59Z"),
    row(2, "dire", "2026-10-31T21:00:00Z"),
    row(3, "dire", "2026-11-01T20:59:59Z"),
    row(4, "dire", "2026-11-01T21:00:00Z"),
  ];
  assert.deepEqual(
    filterConnectionDates(rows, "2026-11-01", "2026-11-01").map((r) => r.match_id),
    [2, 3],
  );
  assert.equal(filterConnectionDates(rows, "2026-11-02", "2026-11-01").length, 0);
  assert.deepEqual(computeConnections("missing", rows, buildIdentities(rows)), []);
});
