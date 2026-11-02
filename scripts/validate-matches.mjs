import { readdir, readFile } from "node:fs/promises";

const folder = new URL("../src/data/matches/", import.meta.url);
const files = (await readdir(folder)).filter((name) => name.endsWith(".json"));
const errors = [];
let verified = 0;
const ids = new Set();
for (const file of files) {
  try {
    const data = JSON.parse(await readFile(new URL(file, folder), "utf8"));
    const fail = (reason) => errors.push(`${file}: ${reason}`);
    if (data.match_id !== Number(file.slice(0, -5))) fail("ID does not match filename");
    if (ids.has(data.match_id)) fail("duplicate match ID");
    ids.add(data.match_id);
    if (data.radiant_team?.length !== 5 || data.dire_team?.length !== 5) fail("teams must contain 5 + 5 players");
    const players = [...(data.radiant_team || []), ...(data.dire_team || [])];
    if (new Set(players.map((p) => p.nickname)).size !== 10) fail("duplicate player nicknames");
    if (!Number.isFinite(data.duration_seconds) || data.duration_seconds <= 0) fail("invalid duration");
    if (!["radiant", "dire"].includes(data.winner)) fail("unknown winner");
    for (const key of ["kda", "net_worth", "hero_damage", "hero_healing"]) {
      if (players.some((p) => data[key]?.[p.nickname] === undefined)) fail(`${key} is missing players`);
    }
    if (!Object.values(data.net_worth || {}).some((v) => v > 0)) fail("all net worth values are zero");
    if (data.start_time_source === "replay_match_details") {
      verified++;
      if (!/(Z|[+-]\d{2}:?\d{2})$/.test(data.start_time) || !Number.isFinite(Date.parse(data.start_time)) ||
          Math.abs(Date.parse(data.start_time) / 1000 - data.start_timestamp) > 1) fail("inconsistent verified date");
      if (players.some((p) => typeof p.steam_id !== "string")) fail("Steam IDs must be strings to preserve all 64 bits");
    }
    if (data.data_quality?.parse_error) fail("incomplete replay parse");
  } catch (error) { errors.push(`${file}: ${error.message}`); }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${files.length} matches; ${verified} have replay-confirmed dates and terminal stats; ${files.length - verified} retain legacy data.`);
