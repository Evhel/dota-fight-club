import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildIdentities, computeAllPlayerStats, computeGlobalStats } from '../src/lib/stats.ts';

test('unverified legacy damage/healing cannot win records or dilute verified averages', () => {
  const match = JSON.parse(readFileSync(new URL('../src/data/matches/9034069535.json', import.meta.url), 'utf8'));
  const legacy = structuredClone(match);
  legacy.match_id = 1;
  delete legacy.data_quality;
  for (const name of Object.keys(legacy.hero_damage)) {
    legacy.hero_damage[name] = 999999999;
    legacy.hero_healing[name] = 999999999;
  }
  const rows = [match, legacy].map((data) => ({match_id: data.match_id, start_time: data.start_time, created_at: data.start_time, data}));
  const ids = buildIdentities(rows);
  const players = computeAllPlayerStats(rows, ids);
  const { records } = computeGlobalStats(rows, ids, players);
  assert.equal(records.top_dmg.match_id, match.match_id);
  assert.equal(records.top_heal.match_id, match.match_id);
  for (const player of players) {
    const source = [...match.radiant_team, ...match.dire_team].find((p) => String(p.steam_id) === player.steam_id);
    assert.equal(player.avg_dmg, match.hero_damage[source.nickname]);
    assert.equal(player.avg_heal, match.hero_healing[source.nickname]);
  }
});
