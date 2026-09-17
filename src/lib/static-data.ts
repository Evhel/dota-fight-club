// Статические данные проекта: матчи, аватарки, награды.
// Никаких обращений к базе данных — всё лежит в репозитории.
import type { DotaMatch, MatchRow } from "./types";
import avatarsRaw from "../../public/avatars/avatars.txt?raw";
import awardsRaw from "../../public/awards/awards.txt?raw";

const BASE = import.meta.env.BASE_URL || "/";

function publicUrl(folder: string, file: string) {
  return `${BASE}${folder}/${encodeURIComponent(file)}`;
}

// Время без указания зоны трактуется как московское (UTC+3)
function normalizeTime(s: string): string {
  if (!s) return new Date(0).toISOString();
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(s);
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(hasZone ? iso : `${iso}+03:00`);
  return isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

// Все JSON-файлы матчей из src/data/matches подхватываются автоматически
const modules = import.meta.glob<DotaMatch>("../data/matches/*.json", {
  eager: true,
  import: "default",
});

const byId = new Map<number, MatchRow>();
for (const raw of Object.values(modules)) {
  const data = raw as DotaMatch;
  if (!data || !data.match_id) continue;
  const start_time = normalizeTime(data.start_time);
  byId.set(Number(data.match_id), {
    match_id: Number(data.match_id),
    start_time,
    data: { ...data, start_time },
    created_at: start_time,
  });
}

export const STATIC_MATCHES: MatchRow[] = [...byId.values()].sort(
  (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
);

function lines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

// steam_id -> url аватарки
export const STATIC_AVATARS = new Map<string, string>(
  lines(avatarsRaw).flatMap((l) => {
    const i = l.indexOf("=");
    if (i === -1) return [];
    const id = l.slice(0, i).trim();
    const file = l.slice(i + 1).trim();
    if (!id || !file) return [];
    return [[id, publicUrl("avatars", file)] as [string, string]];
  }),
);

export interface StaticAward {
  id: string;
  name: string;
  image_url: string;
  steam_id: string;
  player_name: string;
  created_at: string;
}

export const STATIC_AWARDS: StaticAward[] = lines(awardsRaw).flatMap((l, idx) => {
  const parts = l.split("|").map((p) => p.trim());
  const [steamId, file, name] = parts;
  if (!steamId || !file) return [];
  return [
    {
      id: `${steamId}-${idx}`,
      name: name || file,
      image_url: publicUrl("awards", file),
      steam_id: steamId,
      player_name: "",
      created_at: new Date(0).toISOString(),
    },
  ];
});
