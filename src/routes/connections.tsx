import { createFileRoute } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities } from "@/lib/stats";
import { useEffect, useMemo, useRef, useState } from "react";
import { STATIC_AVATARS } from "@/lib/static-data";
import { Slider } from "@/components/ui/slider";


export const Route = createFileRoute("/connections")({
  component: ConnectionsPage,
  head: () => ({
    meta: [{ title: "Связь — Бойцовский Клуб Dota 2" }],
  }),
});

interface GraphNode {
  id: string;
  name: string;
  degree: number;
  games: number;
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

  const { minT, maxT } = useMemo(() => {
    if (!matches.length) return { minT: SEASON_1, maxT: Date.now() };
    let mn = Infinity, mx = -Infinity;
    for (const m of matches) {
      const t = new Date(m.start_time).getTime();
      if (t < mn) mn = t;
      if (t > mx) mx = t;
    }
    return { minT: Math.min(mn, SEASON_1), maxT: Math.max(mx, Date.now()) };
  }, [matches]);

  const [timeT, setTimeT] = useState<number>(maxT);
  useEffect(() => setTimeT(maxT), [maxT]);

  const [linkDistance, setLinkDistance] = useState(180);
  const [repulsion, setRepulsion] = useState(8000);
  const [minGames, setMinGames] = useState(1);

  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Zoom & pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => {
    const pairCounts = new Map<string, number>();
    const playerGames = new Map<string, number>();
    const playerMates = new Map<string, Set<string>>();

    for (const m of matches) {
      const t = new Date(m.start_time).getTime();
      if (t > timeT) continue;
      const sides = [m.data.radiant_team, m.data.dire_team];
      for (const team of sides) {
        for (const p of team) {
          const sid = String(p.steam_id);
          playerGames.set(sid, (playerGames.get(sid) || 0) + 1);
        }
        for (let i = 0; i < team.length; i++) {
          for (let j = i + 1; j < team.length; j++) {
            const a = String(team[i].steam_id);
            const b = String(team[j].steam_id);
            const key = a < b ? `${a}|${b}` : `${b}|${a}`;
            pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
            if (!playerMates.has(a)) playerMates.set(a, new Set());
            if (!playerMates.has(b)) playerMates.set(b, new Set());
            playerMates.get(a)!.add(b);
            playerMates.get(b)!.add(a);
          }
        }
      }
    }

    const edges: GraphEdge[] = [];
    for (const [k, g] of pairCounts) {
      const [a, b] = k.split("|");
      edges.push({ a, b, games: g });
    }

    const nodes: Omit<GraphNode, "x" | "y" | "vx" | "vy" | "r">[] = [];
    for (const [sid, games] of playerGames) {
      const id = identities.get(sid);
      nodes.push({
        id: sid,
        name: id?.display_name || sid,
        degree: playerMates.get(sid)?.size || 0,
        games,
      });
    }
    return { nodes, edges };
  }, [matches, timeT, identities]);

  // Apply min-games filter to edges + drop isolated nodes
  const filteredEdgesByMin = useMemo(
    () => baseEdges.filter((e) => e.games >= minGames),
    [baseEdges, minGames],
  );

  const visibleNodeIds = useMemo(() => {
    if (selected) {
      const s = new Set<string>([selected]);
      for (const e of filteredEdgesByMin) {
        if (e.a === selected) s.add(e.b);
        else if (e.b === selected) s.add(e.a);
      }
      return s;
    }
    // hide isolated nodes once a filter removes their edges
    if (minGames > 1) {
      const s = new Set<string>();
      for (const e of filteredEdgesByMin) {
        s.add(e.a);
        s.add(e.b);
      }
      return s;
    }
    return new Set(baseNodes.map((n) => n.id));
  }, [selected, baseNodes, filteredEdgesByMin, minGames]);

  const filteredEdges = useMemo(
    () =>
      selected
        ? filteredEdgesByMin.filter((e) => e.a === selected || e.b === selected)
        : filteredEdgesByMin,
    [selected, filteredEdgesByMin],
  );

  const maxDegree = useMemo(
    () => Math.max(1, ...baseNodes.map((n) => n.degree)),
    [baseNodes],
  );
  const maxGames = useMemo(
    () => Math.max(1, ...baseEdges.map((e) => e.games)),
    [baseEdges],
  );
  const overallMaxGames = useMemo(
    () => Math.max(1, ...baseEdges.map((e) => e.games)),
    [baseEdges],
  );

  const positionsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(
    new Map(),
  );

  const W = 1200;
  const H = 760;

  const simNodes: GraphNode[] = useMemo(() => {
    const arr: GraphNode[] = baseNodes.map((n, i) => {
      const prev = positionsRef.current.get(n.id);
      const angle = (i / Math.max(1, baseNodes.length)) * Math.PI * 2;
      // log-ish scale so a few super-connected nodes don't dwarf the rest
      const t = Math.log(1 + n.degree) / Math.log(1 + maxDegree);
      const r = 22 + t * 34;
      return {
        ...n,
        r,
        x: prev?.x ?? W / 2 + Math.cos(angle) * 260,
        y: prev?.y ?? H / 2 + Math.sin(angle) * 220,
        vx: prev?.vx ?? 0,
        vy: prev?.vy ?? 0,
      };
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseNodes, maxDegree]);

  const [, setTick] = useState(0);
  const nodesStateRef = useRef<GraphNode[]>(simNodes);
  useEffect(() => {
    nodesStateRef.current = simNodes;
  }, [simNodes]);

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
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 < 1) dist2 = 1;
          const dist = Math.sqrt(dist2);
          // hard collision repulsion when overlapping
          const minDist = a.r + b.r + 12;
          let f = repulsion / dist2;
          if (dist < minDist) f += (minDist - dist) * 0.4;
          const fx = (dx / dist) * f;
          const fy = (dy / dist) * f;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
      for (const e of filteredEdges) {
        const a = idMap.get(e.a);
        const b = idMap.get(e.b);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const strength = 0.03 * (e.games / maxGames + 0.2);
        const target = linkDistance;
        const diff = dist - target;
        const fx = (dx / dist) * diff * strength;
        const fy = (dy / dist) * diff * strength;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
      for (const n of nodes) {
        n.vx += (cx - n.x) * 0.005;
        n.vy += (cy - n.y) * 0.005;
        n.vx *= 0.82;
        n.vy *= 0.82;
        n.x += n.vx;
        n.y += n.vy;
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

  // Neighbors of hovered/selected node for highlighting
  const focusId = hovered || selected;
  const focusNeighbors = useMemo(() => {
    if (!focusId) return null;
    const s = new Set<string>([focusId]);
    for (const e of filteredEdges) {
      if (e.a === focusId) s.add(e.b);
      else if (e.b === focusId) s.add(e.a);
    }
    return s;
  }, [focusId, filteredEdges]);

  // Edge color based on relative strength
  const edgeColor = (g: number) => {
    const t = g / maxGames;
    if (t > 0.66) return "oklch(0.78 0.18 70)"; // amber
    if (t > 0.33) return "oklch(0.7 0.15 200)"; // teal
    return "oklch(0.55 0.08 260)"; // muted blue
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setZoom((z) => Math.max(0.4, Math.min(4, z * factor)));
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-glow">Связь</h1>
          <p className="text-sm text-muted-foreground">
            Граф совместных матчей. Кликни на игрока — увидишь только его связи.
            Колесо — зум, перетаскивание фона — панорама.
          </p>
        </div>
        <div className="flex gap-2">
          {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-muted/70 border border-border"
            >
              Сбросить вид
            </button>
          )}
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="px-3 py-1.5 rounded-md text-sm bg-muted hover:bg-muted/70 border border-border"
            >
              Сбросить фильтр
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div
          className="rounded-lg border border-border/60 bg-card/40 overflow-hidden relative"
          style={{
            backgroundImage:
              "radial-gradient(oklch(0.5 0.02 260 / 0.15) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto cursor-grab active:cursor-grabbing"
            onWheel={onWheel}
            onPointerDown={(e) => {
              if ((e.target as SVGElement).closest("[data-node]")) return;
              (e.target as SVGElement).setPointerCapture?.(e.pointerId);
              dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return;
              const dx = e.clientX - dragRef.current.x;
              const dy = e.clientY - dragRef.current.y;
              setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
            }}
            onPointerUp={() => (dragRef.current = null)}
            onPointerLeave={() => (dragRef.current = null)}
          >
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom}) translate(${(1 - 1) * 0},0)`}>
              {/* edges */}
              {filteredEdges.map((e) => {
                const a = nodeById.get(e.a);
                const b = nodeById.get(e.b);
                if (!a || !b) return null;
                const t = e.games / maxGames;
                const w = 0.6 + t * 5.5;
                const isFocus =
                  !focusId || e.a === focusId || e.b === focusId;
                const op = isFocus ? 0.35 + t * 0.55 : 0.05;
                return (
                  <line
                    key={`${e.a}-${e.b}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={edgeColor(e.games)}
                    strokeOpacity={op}
                    strokeWidth={w}
                    strokeLinecap="round"
                  />
                );
              })}
              {/* edge labels on focus */}
              {focusId &&
                filteredEdges
                  .filter((e) => e.a === focusId || e.b === focusId)
                  .map((e) => {
                    const a = nodeById.get(e.a);
                    const b = nodeById.get(e.b);
                    if (!a || !b) return null;
                    const mx = (a.x + b.x) / 2;
                    const my = (a.y + b.y) / 2;
                    return (
                      <g key={`lbl-${e.a}-${e.b}`} style={{ pointerEvents: "none" }}>
                        <rect
                          x={mx - 12}
                          y={my - 9}
                          width={24}
                          height={16}
                          rx={4}
                          fill="oklch(0.15 0.02 260 / 0.9)"
                          stroke="oklch(0.4 0.08 260)"
                        />
                        <text
                          x={mx}
                          y={my + 3}
                          textAnchor="middle"
                          fontSize={11}
                          fill="oklch(0.95 0.05 80)"
                          fontWeight={600}
                        >
                          {e.games}
                        </text>
                      </g>
                    );
                  })}
              {/* nodes */}
              {nodes.map((n) => {
                const url = avatars?.get(n.id);
                const clipId = `clip-${n.id}`;
                const isFocus = !focusId || focusNeighbors?.has(n.id);
                const isSelected = selected === n.id;
                const ringColor = isSelected
                  ? "oklch(0.85 0.2 80)"
                  : hovered === n.id
                    ? "oklch(0.85 0.15 200)"
                    : "oklch(0.55 0.12 260)";
                return (
                  <g
                    key={n.id}
                    data-node
                    transform={`translate(${n.x},${n.y})`}
                    className="cursor-pointer"
                    opacity={isFocus ? 1 : 0.25}
                    onClick={() => setSelected(selected === n.id ? null : n.id)}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                  >
                    <defs>
                      <clipPath id={clipId}>
                        <circle cx={0} cy={0} r={n.r} />
                      </clipPath>
                    </defs>
                    <circle
                      cx={0}
                      cy={0}
                      r={n.r + 3}
                      fill="oklch(0.18 0.02 260)"
                      stroke={ringColor}
                      strokeWidth={isSelected ? 3.5 : 2}
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
                      <>
                        <circle cx={0} cy={0} r={n.r} fill="oklch(0.3 0.05 260)" />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="oklch(0.9 0.05 260)"
                          fontSize={n.r * 0.8}
                          fontFamily="serif"
                          fontWeight={600}
                        >
                          {n.name.slice(0, 1).toUpperCase()}
                        </text>
                      </>
                    )}
                    {/* name with bg pill */}
                    <g style={{ pointerEvents: "none" }}>
                      <rect
                        x={-(n.name.length * 3.6 + 8)}
                        y={n.r + 6}
                        width={n.name.length * 7.2 + 16}
                        height={16}
                        rx={4}
                        fill="oklch(0.15 0.02 260 / 0.85)"
                      />
                      <text
                        y={n.r + 17}
                        textAnchor="middle"
                        fill="oklch(0.95 0.02 260)"
                        fontSize={11}
                        fontWeight={500}
                      >
                        {n.name}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
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
              max={8000}
              step={100}
              value={[repulsion]}
              onValueChange={(v) => setRepulsion(v[0])}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Мин. совместных игр</span>
              <span>≥ {minGames}</span>
            </div>
            <Slider
              min={1}
              max={Math.max(2, overallMaxGames)}
              step={1}
              value={[minGames]}
              onValueChange={(v) => setMinGames(v[0])}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Зум</span>
              <span>{zoom.toFixed(2)}×</span>
            </div>
            <Slider
              min={0.4}
              max={4}
              step={0.05}
              value={[zoom]}
              onValueChange={(v) => setZoom(v[0])}
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Дата</span>
              <span>{dateLabel}</span>
            </div>
            <div className="relative pt-4 pb-6">
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

          <div className="text-xs space-y-1 pt-2 border-t border-border/60">
            <div className="text-muted-foreground mb-1">Толщина связи = число игр</div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-[2px]" style={{ background: "oklch(0.55 0.08 260)" }} />
              <span>редко</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-[3.5px]" style={{ background: "oklch(0.7 0.15 200)" }} />
              <span>часто</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-[5px]" style={{ background: "oklch(0.78 0.18 70)" }} />
              <span>максимум</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
