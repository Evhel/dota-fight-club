// OpenDota peers API — free, no key needed. Rate limit: 60/min, 2000/day.
// We cache per-player results in localStorage with a 24h TTL to minimise calls.

const STEAM_OFFSET = 76561197960265728n;

export function steamIdToAccountId(steamId: string): number | null {
  try {
    const big = BigInt(steamId);
    if (big > STEAM_OFFSET) return Number(big - STEAM_OFFSET);
    // already 32-bit account id
    return Number(big);
  } catch {
    return null;
  }
}

export interface OpenDotaPeer {
  account_id: number;
  with_games: number; // games as teammate
  with_win: number;
  games: number; // total games on record
  win: number;
}

// Refresh peers data once per week
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_VERSION = "v2";

function cacheKey(accountId: number, days: number | null) {
  return `od-peers:${CACHE_VERSION}:${accountId}:${days ?? "all"}`;
}

function readCache(accountId: number, days: number | null): OpenDotaPeer[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(accountId, days));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { t: number; data: OpenDotaPeer[] };
    if (Date.now() - parsed.t > TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(accountId: number, days: number | null, data: OpenDotaPeer[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      cacheKey(accountId, days),
      JSON.stringify({ t: Date.now(), data }),
    );
  } catch {
    /* quota — ignore */
  }
}

export async function fetchPeers(
  accountId: number,
  days: number | null,
): Promise<OpenDotaPeer[]> {
  const cached = readCache(accountId, days);
  if (cached) return cached;
  const qs = days != null ? `?date=${days}` : "";
  const res = await fetch(`https://api.opendota.com/api/players/${accountId}/peers${qs}`);
  if (!res.ok) throw new Error(`OpenDota ${res.status}`);
  const json = (await res.json()) as OpenDotaPeer[];
  writeCache(accountId, days, json);
  return json;
}

export function clearPeersCache(): number {
  if (typeof window === "undefined") return 0;
  let n = 0;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith("od-peers:")) keys.push(k);
  }
  for (const k of keys) {
    window.localStorage.removeItem(k);
    n++;
  }
  return n;
}
