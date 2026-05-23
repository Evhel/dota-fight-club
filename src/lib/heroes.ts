// Helpers for Dota 2 hero images.
// Heroes may come either as internal names ("npc_dota_hero_antimage")
// or as display names ("Anti-Mage", "Nature's Prophet").

const DISPLAY_TO_SHORT: Record<string, string> = {
  "anti-mage": "antimage",
  "anti mage": "antimage",
  "antimage": "antimage",
  "nature's prophet": "furion",
  "natures prophet": "furion",
  "witch doctor": "witch_doctor",
  "outworld devourer": "obsidian_destroyer",
  "ring master": "ringmaster",
  "ringmaster": "ringmaster",
  "shadow fiend": "nevermore",
  "queen of pain": "queenofpain",
  "wraith king": "skeleton_king",
  "witch doctor": "witchdoctor",
  "vengeful spirit": "vengefulspirit",
  "treant protector": "treant",
  "shadow shaman": "shadow_shaman",
  "sand king": "sand_king",
  "phantom assassin": "phantom_assassin",
  "phantom lancer": "phantom_lancer",
  "skywrath mage": "skywrath_mage",
  "drow ranger": "drow_ranger",
  "centaur warrunner": "centaur",
  "crystal maiden": "crystal_maiden",
  "dark seer": "dark_seer",
  "dark willow": "dark_willow",
  "death prophet": "death_prophet",
  "doom": "doom_bringer",
  "dragon knight": "dragon_knight",
  "ember spirit": "ember_spirit",
  "earth spirit": "earth_spirit",
  "storm spirit": "storm_spirit",
  "void spirit": "void_spirit",
  "faceless void": "faceless_void",
  "io": "wisp",
  "keeper of the light": "keeper_of_the_light",
  "legion commander": "legion_commander",
  "lifestealer": "life_stealer",
  "lone druid": "lone_druid",
  "magnus": "magnataur",
  "monkey king": "monkey_king",
  "naga siren": "naga_siren",
  "necrophos": "necrolyte",
  "night stalker": "night_stalker",
  "nyx assassin": "nyx_assassin",
  "ogre magi": "ogre_magi",
  "outworld destroyer": "obsidian_destroyer",
  "primal beast": "primal_beast",
  "shadow demon": "shadow_demon",
  "spirit breaker": "spirit_breaker",
  "templar assassin": "templar_assassin",
  "underlord": "abyssal_underlord",
  "winter wyvern": "winter_wyvern",
  "zeus": "zuus",
  "timbersaw": "shredder",
  "windranger": "windrunner",
  "clockwerk": "rattletrap",
};

export function heroShortName(hero: string): string {
  if (!hero) return "";
  if (hero.startsWith("npc_dota_hero_")) return hero.slice("npc_dota_hero_".length);
  const k = hero.trim().toLowerCase();
  if (DISPLAY_TO_SHORT[k]) return DISPLAY_TO_SHORT[k];
  return k.replace(/['']/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function heroImg(hero: string): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroShortName(hero)}.png`;
}

export function heroIcon(hero: string): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/${heroShortName(hero)}.png`;
}

export function heroAnchorId(hero: string): string {
  return `hero-${heroShortName(hero)}`;
}
