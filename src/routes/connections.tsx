import { createFileRoute } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities } from "@/lib/stats";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Slider } from "@/components/ui/slider";
import { fetchPeers, steamIdToAccountId } from "@/lib/opendota";


export const Route = createFileRoute("/connections")({
  component: ConnectionsPage,
  head: () => ({
    meta: [{ title: "Связь — Бойцовский Клуб Dota 2" }],
  }),
});

interface GraphNode {
  id: string;
  name: string;
  degree: number; // unique teammates count
  games: number; // total games
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface GraphEdge {
  a: string;
  b: string;
  games: number;
}

const SEASON_1 = new Date("2026-02-21T00:00:00Z").getTime();
const SEASON_2 = new Date("2026-05-15T00:00:00Z").getTime();

function useAvatars() {
  return useQuery({
    queryKey: ["player_avatars_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_avatars")
        .select("steam_id, avatar_url");
      if (error) throw error;
      const map = new Map<string, string>();
      for (const r of data || []) map.set(String(r.steam_id), r.avatar_url);
      return map;
    },
    staleTime: 5 * 60_000,
  });
}

function ConnectionsPage() {
  const { data: matches = [] } = useMatches();
  const { data: avatars } = useAvatars();

  const identities = useMemo(() => buildIdentities(matches), [matches]);

  // Time slider bounds
  const { minT, maxT } = useMemo(() => {
    if (!matches.length) {
      return { minT: SEASON_1, maxT: Date.now() };
    }
    let mn = Infinity;
    let mx = -Infinity;
    for (const m of matches) {
      const t = new Date(m.start_time).getTime();
      if (t < mn) mn = t;
      if (t > mx) mx = t;
    }
    return { minT: Math.min(mn, SEASON_1), maxT: Math.max(mx, Date.now()) };
  }, [matches]);

  const [timeT, setTimeT] = useState<number>(maxT);
  useEffect(() => {
    setTimeT(maxT);
  }, [maxT]);

  // Debounce slider → "days lookback" for OpenDota API
  const [debouncedTime, setDebouncedTime] = useState(timeT);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedTime(timeT), 500);
    return () => clearTimeout(id);
  }, [timeT]);
  const daysParam = useMemo(() => {
    const d = Math.round((Date.now() - debouncedTime) / (24 * 60 * 60 * 1000));
    return d <= 0 ? null : d; // null = all time
  }, [debouncedTime]);

  // Layout controls
  const [linkDistance, setLinkDistance] = useState(160);
  const [repulsion, setRepulsion] = useState(2200);

  const [selected, setSelected] = useState<string | null>(null);

  // Roster from local matches (steam_id list + display names)
  const roster = useMemo(() => {
    const list: { steam_id: string; account_id: number; name: string }[] = [];
    for (const [sid, id] of identities) {
      const acc = steamIdToAccountId(sid);
      if (acc != null) list.push({ steam_id: sid, account_id: acc, name: id.display_name });
    }
    return list;
  }, [identities]);

  // Fetch peers from OpenDota for each roster player (cached 24h in localStorage)
  const peerQueries = useQueries({
    queries: roster.map((p) => ({
      queryKey: ["od-peers", p.account_id, daysParam],
      queryFn: () => fetchPeers(p.account_id, daysParam),
      staleTime: 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
    })),
  });

  const peerLoading = peerQueries.some((q) => q.isLoading);
  const peerErrors = peerQueries.filter((q) => q.isError).length;

  // Build graph from peer data, restricted to roster members
  const { baseNodes, baseEdges } = useMemo(() => {
    const accToSteam = new Map<number, string>();
    const accToName = new Map<number, string>();
    for (const p of roster) {
      accToSteam.set(p.account_id, p.steam_id);
      accToName.set(p.account_id, p.name);
    }
    const playerMates = new Map<string, Set<string>>();
    const pairCounts = new Map<string, number>();

    roster.forEach((p, i) => {
      const peers = peerQueries[i]?.data;
      if (!peers) return;
      for (const peer of peers) {
        const otherSid = accToSteam.get(peer.account_id);
        if (!otherSid) continue; // only show roster members
        const a = p.steam_id;
        const b = otherSid;
        if (a === b) continue;
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        // OpenDota returns the same pair from both sides; take the max for stability
        const prev = pairCounts.get(key) || 0;
        if (peer.with_games > prev) pairCounts.set(key, peer.with_games);
        if (!playerMates.has(a)) playerMates.set(a, new Set());
        if (peer.with_games > 0) playerMates.get(a)!.add(b);
      }
    });

    const edges: GraphEdge[] = [];
    for (const [k, g] of pairCounts) {
      if (g <= 0) continue;
      const [a, b] = k.split("|");
      edges.push({ a, b, games: g });
    }

    const nodes: Omit<GraphNode, "x" | "y" | "vx" | "vy" | "r">[] = roster.map((p) => ({
      id: p.steam_id,
      name: p.name,
      degree: playerMates.get(p.steam_id)?.size || 0,
      games: peerQueries[roster.indexOf(p)]?.data?.reduce(
        (s, x) => s + (accToSteam.has(x.account_id) ? x.with_games : 0),
        0,
      ) ?? 0,
    }));

    return { baseNodes: nodes, baseEdges: edges };
  }, [roster, peerQueries.map((q) => q.dataUpdatedAt).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps


  // Filter graph by selected node
  const visibleNodeIds = useMemo(() => {
    if (!selected) return new Set(baseNodes.map((n) => n.id));
    const s = new Set<string>([selected]);
    for (const e of baseEdges) {
      if (e.a === selected) s.add(e.b);
      else if (e.b === selected) s.add(e.a);
    }
    return s;
  }, [selected, baseNodes, baseEdges]);

  const filteredEdges = useMemo(
    () =>
      selected
        ? baseEdges.filter((e) => e.a === selected || e.b === selected)
        : baseEdges,
    [selected, baseEdges],
  );

  // Avatar size scaling
  const maxDegree = useMemo(
    () => Math.max(1, ...baseNodes.map((n) => n.degree)),
    [baseNodes],
  );
  const maxGames = useMemo(
    () => Math.max(1, ...baseEdges.map((e) => e.games)),
    [baseEdges],
  );

  // Persistent node positions across re-renders
  const positionsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(
    new Map(),
  );

  const W = 1100;
  const H = 700;

  // Build sim nodes
  const simNodes: GraphNode[] = useMemo(() => {
    const arr: GraphNode[] = baseNodes.map((n, i) => {
      const prev = positionsRef.current.get(n.id);
      const angle = (i / Math.max(1, baseNodes.length)) * Math.PI * 2;
      const r = 24 + (n.degree / maxDegree) * 36;
      return {
        ...n,
        r,
        x: prev?.x ?? W / 2 + Math.cos(angle) * 220,
        y: prev?.y ?? H / 2 + Math.sin(angle) * 220,
        vx: prev?.vx ?? 0,
        vy: prev?.vy ?? 0,
      };
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseNodes, maxDegree]);

  const [tick, setTick] = useState(0);
  const nodesStateRef = useRef<GraphNode[]>(simNodes);

  useEffect(() => {
    nodesStateRef.current = simNodes;
  }, [simNodes]);

  // Force simulation animation
  useEffect(() => {
    let raf = 0;
    let running = true;
    const idMap = new Map<string, GraphNode>();
    for (const n of nodesStateRef.current) idMap.set(n.id, n);

    function step() {
      if (!running) return;
      const nodes = nodesStateRef.current;
      const cx = W / 2;
      const cy = H / 2;
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 < 1) dist2 = 1;
          const dist = Math.sqrt(dist2);
          const f = repulsion / dist2;
          const fx = (dx / dist) * f;
          const fy = (dy / dist) * f;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
      // Spring (edges)
      for (const e of filteredEdges) {
        const a = idMap.get(e.a);
        const b = idMap.get(e.b);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const strength = 0.02 * (e.games / maxGames + 0.3);
        const target = linkDistance;
        const diff = dist - target;
        const fx = (dx / dist) * diff * strength;
        const fy = (dy / dist) * diff * strength;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
      // Center gravity + damping
      for (const n of nodes) {
        n.vx += (cx - n.x) * 0.005;
        n.vy += (cy - n.y) * 0.005;
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
        // clamp
        n.x = Math.max(n.r + 4, Math.min(W - n.r - 4, n.x));
        n.y = Math.max(n.r + 4, Math.min(H - n.r - 4, n.y));
        positionsRef.current.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
      }
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [filteredEdges, linkDistance, repulsion, maxGames, simNodes.length]);

  // Date label
  const dateLabel = new Date(timeT).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const span = Math.max(1, maxT - minT);
  const s1Pct = ((SEASON_1 - minT) / span) * 100;
  const s2Pct = ((SEASON_2 - minT) / span) * 100;

  const nodes = nodesStateRef.current.filter((n) => visibleNodeIds.has(n.id));
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-glow">Связь</h1>
          <p className="text-sm text-muted-foreground">
            Граф совместных матчей. Кликни на игрока — увидишь только его связи.
          </p>
        </div>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-muted/70 border border-border"
          >
            Сбросить фильтр
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto"
            // re-render tied to tick
            data-tick={tick}
          >
            {/* edges */}
            {filteredEdges.map((e) => {
              const a = nodeById.get(e.a);
              const b = nodeById.get(e.b);
              if (!a || !b) return null;
              const w = 0.5 + (e.games / maxGames) * 6;
              const op = 0.2 + (e.games / maxGames) * 0.6;
              return (
                <line
                  key={`${e.a}-${e.b}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="oklch(0.7 0.15 250)"
                  strokeOpacity={op}
                  strokeWidth={w}
                />
              );
            })}
            {/* nodes */}
            {nodes.map((n) => {
              const url = avatars?.get(n.id);
              const clipId = `clip-${n.id}`;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  className="cursor-pointer"
                  onClick={() => setSelected(selected === n.id ? null : n.id)}
                >
                  <defs>
                    <clipPath id={clipId}>
                      <circle cx={0} cy={0} r={n.r} />
                    </clipPath>
                  </defs>
                  <circle
                    cx={0}
                    cy={0}
                    r={n.r + 2}
                    fill="oklch(0.2 0.02 260)"
                    stroke={
                      selected === n.id ? "oklch(0.85 0.2 80)" : "oklch(0.6 0.15 260)"
                    }
                    strokeWidth={selected === n.id ? 3 : 1.5}
                  />
                  {url ? (
                    <image
                      href={url}
                      x={-n.r}
                      y={-n.r}
                      width={n.r * 2}
                      height={n.r * 2}
                      clipPath={`url(#${clipId})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  ) : (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="oklch(0.85 0.05 260)"
                      fontSize={n.r * 0.7}
                      fontFamily="serif"
                    >
                      {n.name.slice(0, 1).toUpperCase()}
                    </text>
                  )}
                  <text
                    y={n.r + 14}
                    textAnchor="middle"
                    fill="oklch(0.9 0.02 260)"
                    fontSize={12}
                    style={{ pointerEvents: "none" }}
                  >
                    {n.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-5 p-4 rounded-lg border border-border/60 bg-card/40">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Расстояние между игроками</span>
              <span>{linkDistance}px</span>
            </div>
            <Slider
              min={60}
              max={400}
              step={10}
              value={[linkDistance]}
              onValueChange={(v) => setLinkDistance(v[0])}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Отталкивание</span>
              <span>{repulsion}</span>
            </div>
            <Slider
              min={400}
              max={6000}
              step={100}
              value={[repulsion]}
              onValueChange={(v) => setRepulsion(v[0])}
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Дата</span>
              <span>{dateLabel}</span>
            </div>
            <div className="relative pt-4 pb-6">
              {/* milestone markers */}
              <div
                className="absolute top-0 text-[10px] text-amber-400 -translate-x-1/2"
                style={{ left: `${s1Pct}%` }}
                title="Начало 1-го сезона"
              >
                <div className="text-center whitespace-nowrap">1 сезон</div>
                <div className="w-px h-3 bg-amber-400 mx-auto" />
              </div>
              <div
                className="absolute top-0 text-[10px] text-emerald-400 -translate-x-1/2"
                style={{ left: `${s2Pct}%` }}
                title="Начало 2-го сезона"
              >
                <div className="text-center whitespace-nowrap">2 сезон</div>
                <div className="w-px h-3 bg-emerald-400 mx-auto" />
              </div>
              <Slider
                className="mt-6"
                min={minT}
                max={maxT}
                step={24 * 60 * 60 * 1000}
                value={[timeT]}
                onValueChange={(v) => setTimeT(v[0])}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/60">
            <div>Игроков: <span className="text-foreground">{nodes.length}</span></div>
            <div>Связей: <span className="text-foreground">{filteredEdges.length}</span></div>
            <div>Макс. игр в паре: <span className="text-foreground">{maxGames}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
