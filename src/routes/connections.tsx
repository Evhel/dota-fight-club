import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Network, RotateCcw, Search, Swords, Users } from "lucide-react";
import { useMatches } from "@/lib/matches";
import { buildIdentities } from "@/lib/stats";
import { STATIC_AVATARS } from "@/lib/static-data";
import {
  computeConnections,
  connectionScore,
  connectionMatches,
  filterConnectionDates,
  moscowDate,
} from "@/lib/connections";
import type { ConnectionMode } from "@/lib/connections";
import { heroImg, heroShortName } from "@/lib/heroes";

export const Route = createFileRoute("/connections")({
  validateSearch: (search: Record<string, unknown>): { player?: string } => ({
    player: typeof search.player === "string" ? search.player : undefined,
  }),
  component: ConnectionsPage,
  head: () => ({ meta: [{ title: "Связь — Бойцовский клуб Dota 2" }] }),
});

const MODES: { value: ConnectionMode; label: string; description: string }[] = [
  { value: "together", label: "Напарники", description: "Игры в одной команде" },
  { value: "opponents", label: "Соперники", description: "Игры по разные стороны" },
  { value: "all", label: "Все встречи", description: "Все матчи с участием обоих игроков" },
];
const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function ConnectionsPage() {
  const { data: matches = [] } = useMatches();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const identities = useMemo(() => buildIdentities(matches), [matches]);
  const people = useMemo(
    () =>
      [...identities.values()].sort(
        (a, b) =>
          b.match_count - a.match_count || a.display_name.localeCompare(b.display_name, "ru"),
      ),
    [identities],
  );
  const playerId =
    search.player && identities.has(search.player) ? search.player : people[0]?.steam_id || "";
  const name = identities.get(playerId)?.display_name || "Игрок";
  const [mode, setMode] = useState<ConnectionMode>("together");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minGames, setMinGames] = useState(3);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{
    key: "name" | "games" | "wins" | "losses" | "winrate";
    asc: boolean;
  }>({ key: "games", asc: false });
  const [peerId, setPeerId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(10);
  const historyRef = useRef<HTMLElement>(null);
  const dateRange = useMemo(
    () =>
      matches
        .map((row) => moscowDate(row.start_time))
        .filter(Boolean)
        .sort(),
    [matches],
  );
  const periodMatches = useMemo(
    () => filterConnectionDates(matches, from, to),
    [matches, from, to],
  );
  const relations = useMemo(
    () => computeConnections(playerId, periodMatches, identities),
    [playerId, periodMatches, identities],
  );
  const rows = useMemo(
    () =>
      relations
        .map((row) => ({ ...row, ...connectionScore(row, mode) }))
        .filter(
          (row) =>
            row.games >= minGames &&
            row.name.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru")),
        )
        .sort((a, b) => {
          const cmp =
            sort.key === "name" ? a.name.localeCompare(b.name, "ru") : a[sort.key] - b[sort.key];
          return (sort.asc ? cmp : -cmp) || b.games - a.games || a.name.localeCompare(b.name, "ru");
        }),
    [relations, mode, minGames, query, sort],
  );
  const strongest = [...rows].sort((a, b) => b.games - a.games)[0];
  const best = [...rows]
    .filter((row) => row.games >= 3)
    .sort((a, b) => b.winrate - a.winrate || b.games - a.games)[0];
  const ownGames = useMemo(
    () =>
      periodMatches.filter((row) =>
        [...row.data.radiant_team, ...row.data.dire_team].some(
          (p) => String(p.steam_id) === playerId,
        ),
      ).length,
    [periodMatches, playerId],
  );
  const peer = rows.find((row) => row.steam_id === peerId);
  const history = useMemo(
    () => (peerId ? connectionMatches(periodMatches, playerId, peerId, mode) : []),
    [periodMatches, playerId, peerId, mode],
  );
  const mapRows = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.games - a.games || a.name.localeCompare(b.name, "ru"))
        .slice(0, 10),
    [rows],
  );
  const invalidRange = Boolean(from && to && from > to);
  useEffect(() => {
    if (peerId) historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [peerId]);
  const choosePeer = (id: string) => {
    if (peerId === id) historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPeerId(id);
    setHistoryLimit(10);
  };
  const reset = () => {
    setFrom("");
    setTo("");
    setMinGames(3);
    setQuery("");
    setMode("together");
    setPeerId(null);
    setSort({ key: "games", asc: false });
  };
  const toggleSort = (key: typeof sort.key) =>
    setSort((previous) => ({ key, asc: previous.key === key ? !previous.asc : key === "name" }));

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-2">
            Люди клуба
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-glow">Связь</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            С кем чаще играешь, с кем побеждаешь и против кого сложнее всего. Выбери игрока и
            посмотри историю каждой пары.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          onClick={reset}
        >
          <RotateCcw size={15} />
          Сбросить фильтры
        </button>
      </header>

      <section className="panel p-4 sm:p-5 space-y-5" aria-label="Фильтры связей">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_.7fr] gap-4">
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">Чьи связи</span>
            <select
              aria-label="Чьи связи"
              className={inputClass}
              value={playerId}
              onChange={(e) => {
                navigate({ search: { player: e.target.value } });
                setPeerId(null);
              }}
            >
              <option value="" disabled>
                Выбрать игрока
              </option>
              {people.map((p) => (
                <option key={p.steam_id} value={p.steam_id}>
                  {p.display_name} · игр: {p.match_count}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">С даты · МСК</span>
            <input
              aria-label="С даты"
              type="date"
              className={`${inputClass} [color-scheme:dark]`}
              min={dateRange[0]}
              max={to || dateRange.at(-1)}
              value={from}
              onInput={(e) => setFrom(e.currentTarget.value)}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">По дату включительно · МСК</span>
            <input
              aria-label="По дату включительно"
              type="date"
              className={`${inputClass} [color-scheme:dark]`}
              min={from || dateRange[0]}
              max={dateRange.at(-1)}
              value={to}
              onInput={(e) => setTo(e.currentTarget.value)}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">Минимум игр в паре</span>
            <input
              aria-label="Минимум игр в паре"
              type="number"
              min={1}
              max={Math.max(1, matches.length)}
              value={minGames}
              onChange={(e) =>
                setMinGames(
                  Math.min(Math.max(1, Number(e.target.value) || 1), Math.max(1, matches.length)),
                )
              }
              className={inputClass}
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div
            className="inline-flex flex-wrap gap-1 rounded-lg bg-background/60 p-1"
            role="group"
            aria-label="Вид связи"
          >
            {MODES.map((item) => (
              <button
                key={item.value}
                aria-pressed={mode === item.value}
                onClick={() => {
                  setMode(item.value);
                  setPeerId(null);
                }}
                title={item.description}
                className={`rounded-md px-4 py-2 text-sm transition ${mode === item.value ? "bg-primary/20 text-foreground ring-1 ring-primary/40" : "text-muted-foreground hover:text-foreground"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            aria-expanded={showMap}
            aria-controls="connection-map"
            onClick={() => setShowMap((value) => !value)}
            className="inline-flex items-center gap-2 text-sm rounded-md border border-border px-3 py-2 hover:bg-muted"
          >
            <Network size={16} />
            {showMap ? "Скрыть карту" : "Показать карту связей"}
          </button>
        </div>
        {invalidRange && (
          <p role="alert" className="text-sm text-red-300">
            Начальная дата должна быть не позже конечной.
          </p>
        )}
      </section>

      <div className="flex items-center gap-3">
        <Avatar id={playerId} name={name} />
        <div>
          <Link
            to="/player"
            search={{ nick: name }}
            className="text-xl font-display hover:text-primary"
          >
            {name}
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            {MODES.find((item) => item.value === mode)?.description} ·{" "}
            {from || to ? "выбранный период" : "всё время"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Metric label="Матчей игрока в периоде" value={ownGames} />
        <Metric label="Связей в списке" value={rows.length} />
        <Metric
          label="Чаще всего встречались"
          value={strongest?.name || "—"}
          detail={strongest ? `Матчей: ${strongest.games}` : "Нет подходящих игр"}
        />
        <Metric
          label="Лучший винрейт пары · от 3 игр"
          value={best ? `${best.winrate}%` : "—"}
          detail={best ? `${best.name} · ${best.wins} из ${best.games}` : "Недостаточно матчей"}
        />
      </div>

      {showMap && (
        <section
          id="connection-map"
          className="panel p-4 sm:p-5 space-y-3"
          aria-label="Карта связей"
        >
          <div className="flex justify-between gap-3 flex-wrap">
            <h2 className="font-display text-xl">Карта связей {name}</h2>
            <span className="text-xs text-muted-foreground">
              До 10 самых частых связей · полный список ниже
            </span>
          </div>
          {mapRows.length ? (
            <div className="overflow-x-auto">
              <svg
                viewBox="0 0 800 540"
                className="w-full min-w-[600px] max-h-[540px]"
                role="group"
                aria-label="Выбери игрока на карте, чтобы открыть общие матчи"
              >
                {mapRows.map((row, i) => {
                  const angle = -Math.PI / 2 + (i / mapRows.length) * Math.PI * 2;
                  const x = 400 + Math.cos(angle) * 270;
                  const y = 250 + Math.sin(angle) * 185;
                  return (
                    <line
                      key={row.steam_id}
                      x1={400}
                      y1={250}
                      x2={x}
                      y2={y}
                      stroke={mode === "opponents" ? "#7dd3fc" : "#6ee7b7"}
                      strokeOpacity={peerId && peerId !== row.steam_id ? 0.12 : 0.4}
                      strokeWidth={1 + (4 * row.games) / (strongest?.games || 1)}
                    />
                  );
                })}
                <circle
                  cx={400}
                  cy={250}
                  r={40}
                  fill="var(--card)"
                  stroke="var(--primary)"
                  strokeWidth={2}
                />
                <text
                  x={400}
                  y={250}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--foreground)"
                  fontSize={14}
                  fontWeight={600}
                >
                  {name.length > 20 ? name.slice(0, 18) + "…" : name}
                </text>
                <text
                  x={400}
                  y={310}
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  fontSize={12}
                >
                  выбранный игрок
                </text>
                {mapRows.map((row, i) => {
                  const angle = -Math.PI / 2 + (i / mapRows.length) * Math.PI * 2;
                  const x = 400 + Math.cos(angle) * 270;
                  const y = 250 + Math.sin(angle) * 185;
                  return (
                    <g
                      key={row.steam_id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Матчи с ${row.name}: ${row.games}`}
                      onClick={() => choosePeer(row.steam_id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          choosePeer(row.steam_id);
                        }
                      }}
                      className="cursor-pointer outline-none group"
                      transform={`translate(${x},${y})`}
                    >
                      <title>
                        {row.name} · игр: {row.games} · {row.winrate}% побед
                      </title>
                      <circle
                        r={27}
                        fill="var(--card)"
                        stroke={peerId === row.steam_id ? "#6ee7b7" : "var(--border)"}
                        strokeWidth={2}
                        className="group-hover:stroke-primary group-focus:stroke-primary"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="var(--foreground)"
                        fontSize={17}
                      >
                        {row.name.slice(0, 1).toLocaleUpperCase("ru")}
                      </text>
                      <text y={47} textAnchor="middle" fill="var(--foreground)" fontSize={12}>
                        {row.name.length > 22 ? row.name.slice(0, 20) + "…" : row.name}
                      </text>
                      <text y={64} textAnchor="middle" fill="var(--muted-foreground)" fontSize={11}>
                        Игр: {row.games} · {row.winrate}% побед
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">
              Нет связей по выбранным фильтрам.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Толщина линии — число матчей. Нажми на игрока, чтобы открыть историю пары.
          </p>
        </section>
      )}

      <section className="space-y-3" aria-label="Таблица связей">
        <div className="flex gap-3 items-center justify-between flex-wrap">
          <h2 className="font-display text-2xl">
            {MODES.find((item) => item.value === mode)?.label}
          </h2>
          <label className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={15} />
            <span className="sr-only">Найти связь по игроку</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Найти игрока…"
              className={`${inputClass} pl-9`}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Победы и винрейт считаются для {name}. В режиме «Соперники» это победы над соперником.
        </p>
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm text-center">
            <thead className="bg-muted/30">
              <tr>
                {(
                  [
                    ["name", "Игрок"],
                    ["games", "Матчей"],
                    ["wins", "Побед"],
                    ["losses", "Поражений"],
                    ["winrate", "Винрейт"],
                  ] as const
                ).map(([key, label]) => (
                  <th
                    key={key}
                    className={`px-4 py-3 ${key === "name" ? "text-left" : ""}`}
                    aria-sort={sort.key === key ? (sort.asc ? "ascending" : "descending") : "none"}
                  >
                    <button
                      onClick={() => toggleSort(key)}
                      className="hover:text-primary inline-flex gap-1 items-center"
                    >
                      {label}
                      {sort.key === key && (
                        <ArrowDown size={12} className={sort.asc ? "rotate-180" : ""} />
                      )}
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3">История</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.steam_id}
                  className={`border-t border-border/40 hover:bg-muted/20 ${row.steam_id === peerId ? "bg-primary/10" : ""}`}
                >
                  <td className="px-4 py-3 text-left">
                    <div className="flex gap-3 items-center">
                      <Avatar id={row.steam_id} name={row.name} small />
                      <div>
                        <Link
                          to="/player"
                          search={{ nick: row.name }}
                          className="hover:text-primary hover:underline"
                        >
                          {row.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {row.together} вместе · {row.opponents} против
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{row.games}</td>
                  <td className="px-4 py-3 font-mono text-emerald-300">{row.wins}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{row.losses}</td>
                  <td className="px-4 py-3">
                    <div className="font-mono">{row.winrate}%</div>
                    <div className="w-16 h-1 mx-auto mt-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-emerald-400/70"
                        style={{ width: `${row.winrate}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => choosePeer(row.steam_id)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 hover:bg-muted"
                      aria-label={`Открыть матчи с ${row.name}`}
                    >
                      Матчи
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="p-10 text-muted-foreground">
                    <Users className="mx-auto mb-3" />
                    <p>Нет связей по выбранным фильтрам.</p>
                    <p className="text-xs mt-2">
                      Выбери другой период, уменьши минимум игр или очисти поиск.
                    </p>
                    <button
                      className="mt-4 text-foreground underline"
                      onClick={() => {
                        setMinGames(1);
                        setFrom("");
                        setTo("");
                        setQuery("");
                      }}
                    >
                      Показать все встречи в этом режиме
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {peer && (
        <section ref={historyRef} id="pair-history" className="space-y-4 scroll-mt-36">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h2 className="font-display text-2xl">
                {name} <span className="text-muted-foreground">и</span> {peer.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Матчей: {peer.games} · Победы: {peer.wins} · Поражения: {peer.losses} · Винрейт{" "}
                {name}: {peer.winrate}%
              </p>
            </div>
            <button
              onClick={() => setPeerId(null)}
              className="border border-border rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              Закрыть
            </button>
          </div>
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm text-left">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3">Матч · МСК</th>
                  <th className="px-4 py-3">Герои</th>
                  <th className="px-4 py-3">Стороны</th>
                  <th className="px-4 py-3">Результат {name}</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, historyLimit).map(({ row, player, other, together, won }) => (
                  <tr key={row.match_id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <Link
                        to="/match/$id"
                        params={{ id: String(row.match_id) }}
                        className="hover:text-primary hover:underline"
                      >
                        {new Date(row.start_time).toLocaleString("ru-RU", {
                          timeZone: "Europe/Moscow",
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                        <span className="block text-xs text-muted-foreground">#{row.match_id}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <HeroPortrait hero={player.hero} />
                        <Swords size={13} className="text-muted-foreground" />
                        <HeroPortrait hero={other.hero} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {together ? "В одной команде" : "Соперники"}
                    </td>
                    <td className={`px-4 py-3 ${won ? "text-emerald-300" : "text-slate-300"}`}>
                      {won ? "Победа" : "Поражение"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {history.length > historyLimit && (
            <button
              onClick={() => setHistoryLimit((value) => value + 10)}
              className="w-full border border-border rounded-md py-3 text-sm hover:bg-muted"
            >
              Показать ещё: {Math.min(10, history.length - historyLimit)}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="panel p-4 sm:p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl sm:text-2xl font-mono mt-3 break-words">{value}</p>
      {detail && <p className="text-xs text-muted-foreground mt-2">{detail}</p>}
    </div>
  );
}
function Avatar({ id, name, small = false }: { id: string; name: string; small?: boolean }) {
  const url = STATIC_AVATARS.get(id);
  return url ? (
    <img
      src={url}
      alt=""
      className={`${small ? "w-8 h-8" : "w-12 h-12"} rounded-full object-cover border border-border shrink-0`}
    />
  ) : (
    <span
      aria-hidden="true"
      className={`${small ? "w-8 h-8 text-sm" : "w-12 h-12 text-xl"} rounded-full bg-primary/10 border border-border flex items-center justify-center shrink-0`}
    >
      {name.slice(0, 1).toLocaleUpperCase("ru")}
    </span>
  );
}
function HeroPortrait({ hero }: { hero: string }) {
  return (
    <Link to="/hero/$hero" params={{ hero: heroShortName(hero) }} title={hero}>
      <img
        src={heroImg(hero)}
        alt={hero}
        className="w-12 h-7 rounded object-cover border border-border"
      />
    </Link>
  );
}
