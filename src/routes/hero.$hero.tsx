import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Swords, Trophy, ShieldBan, Users } from "lucide-react";
import { useMatches } from "@/lib/matches";
import { computeHeroDetails } from "@/lib/hero-details";
import { heroImg } from "@/lib/heroes";
import { RecordsTable } from "@/components/RecordsTable";

export const Route = createFileRoute("/hero/$hero")({ component: HeroPage });

function HeroPage() {
  const { hero } = Route.useParams();
  const { data: matches = [] } = useMatches();
  const details = useMemo(() => computeHeroDetails(matches, hero), [matches, hero]);
  const [sort, setSort] = useState<"games" | "wins" | "losses" | "winrate">("games");
  const [query, setQuery] = useState("");
  if (!details)
    return (
      <div className="panel p-10 text-center space-y-4">
        <h1 className="font-display text-2xl">Герой не найден</h1>
        <Link to="/heroes" className="text-primary underline">
          Все герои
        </Link>
      </div>
    );
  const { summary, records, games } = details;
  const players = details.players
    .filter((p) => p.name.toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru")))
    .sort((a, b) => b[sort] - a[sort] || b.games - a.games || a.name.localeCompare(b.name, "ru"));
  const cards = [
    { label: "Игр на герое", value: summary.games, icon: Swords },
    {
      label: "Винрейт",
      value: summary.games ? `${summary.winrate}%` : "—",
      detail: `Победы: ${summary.wins} · Поражения: ${summary.games - summary.wins}`,
      icon: Trophy,
    },
    {
      label: "Банов",
      value: summary.bans,
      detail: `Первые баны: ${summary.first_bans}`,
      icon: ShieldBan,
    },
    { label: "Игроков", value: details.players.length, icon: Users },
  ];
  return (
    <div className="space-y-8">
      <Link
        to="/heroes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Все герои
      </Link>
      <section className="panel overflow-hidden flex items-center gap-5 p-5 sm:p-7">
        <img
          src={heroImg(summary.name)}
          alt={summary.name}
          className="w-28 sm:w-48 aspect-[16/9] object-cover rounded-lg border border-border"
        />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Герой клуба
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-glow">{summary.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Статистика всех матчей клуба на этом герое
          </p>
        </div>
      </section>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div className="panel p-4 sm:p-5" key={label}>
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{label}</span>
              <Icon size={17} />
            </div>
            <div className="font-mono text-3xl mt-3">{value}</div>
            {detail && <p className="text-xs text-muted-foreground mt-2">{detail}</p>}
          </div>
        ))}
      </div>
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-display text-2xl">Кто играл на герое</h2>
          <input
            aria-label="Найти игрока на герое"
            placeholder="Найти игрока…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-64"
          />
        </div>
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3">Игрок</th>
                {(
                  [
                    ["games", "Игр"],
                    ["wins", "Побед"],
                    ["losses", "Поражений"],
                    ["winrate", "Винрейт"],
                  ] as const
                ).map(([key, label]) => (
                  <th
                    key={key}
                    aria-sort={sort === key ? "descending" : "none"}
                    className="px-4 py-3"
                  >
                    <button
                      onClick={() => setSort(key)}
                      className="hover:text-primary whitespace-nowrap"
                    >
                      {label}
                      {sort === key ? " ↓" : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.steam_id} className="border-t border-border/40 hover:bg-muted/20">
                  <td className="px-4 py-3 text-left">
                    <Link
                      to="/player"
                      search={{ nick: p.name }}
                      className="hover:text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="font-mono px-4 py-3">{p.games}</td>
                  <td className="font-mono px-4 py-3 text-emerald-300">{p.wins}</td>
                  <td className="font-mono px-4 py-3 text-slate-300">{p.losses}</td>
                  <td className="font-mono px-4 py-3">{p.winrate}%</td>
                </tr>
              ))}
              {!players.length && (
                <tr>
                  <td colSpan={5} className="p-8 text-muted-foreground">
                    {details.players.length
                      ? "Игроки не найдены."
                      : summary.bans
                        ? "На этом герое ещё не играли — пока его только банили."
                        : "На этом герое в клубе ещё не играли."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl">Рекорды на герое</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Нажми на рекорд или значение, чтобы открыть матч. Урон и лечение проверены в{" "}
            {details.verifiedCombatGames} из {summary.games} игр.
          </p>
        </div>
        <RecordsTable records={records} />
      </section>
      <section className="space-y-4">
        <h2 className="font-display text-2xl">История игр</h2>
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3">Матч · МСК</th>
                <th className="px-4 py-3">Игрок</th>
                <th className="px-4 py-3">Результат</th>
                <th className="px-4 py-3">K / D / A</th>
              </tr>
            </thead>
            <tbody>
              {games.map(({ row, player, won, name }) => {
                const kda = row.data.kda[player.nickname];
                return (
                  <tr
                    key={`${row.match_id}-${player.steam_id}`}
                    className="border-t border-border/40 hover:bg-muted/20"
                  >
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
                      <Link
                        to="/player"
                        search={{ nick: name }}
                        className="hover:text-primary hover:underline"
                      >
                        {name}
                      </Link>
                    </td>
                    <td className={`px-4 py-3 ${won ? "text-emerald-300" : "text-slate-300"}`}>
                      {won ? "Победа" : "Поражение"}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {kda ? `${kda.kills} / ${kda.deaths} / ${kda.assists}` : "—"}
                    </td>
                  </tr>
                );
              })}
              {!games.length && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Матчей пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
