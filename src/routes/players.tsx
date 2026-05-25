import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities, computeAllPlayerStats, formatDuration } from "@/lib/stats";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAwards, AWARD_LINK } from "@/lib/awards";

export const Route = createFileRoute("/players")({
  component: PlayersPage,
});

type SortKey =
  | "name"
  | "games"
  | "winrate"
  | "total_seconds"
  | "unique"
  | "max_win"
  | "max_loss"
  | "current"
  | "word"
  | "best_mate"
  | "worst_mate";

function PlayersPage() {
  const { data: matches = [] } = useMatches();
  const players = useMemo(() => {
    const ids = buildIdentities(matches);
    return computeAllPlayerStats(matches, ids);
  }, [matches]);

  const [minGames, setMinGames] = useState(false);
  const [sort, setSort] = useState<SortKey>("games");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const list = useMemo(() => {
    const arr = minGames ? players.filter((p) => p.games > 10) : [...players];
    const cmp: Record<SortKey, (a: typeof arr[0], b: typeof arr[0]) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      games: (a, b) => a.games - b.games,
      winrate: (a, b) => a.winrate - b.winrate,
      total_seconds: (a, b) => a.total_seconds - b.total_seconds,
      unique: (a, b) => a.unique_heroes.length - b.unique_heroes.length,
      max_win: (a, b) => a.max_win_streak - b.max_win_streak,
      max_loss: (a, b) => a.max_loss_streak - b.max_loss_streak,
      current: (a, b) => {
        const sa = a.current_streak.type === "win" ? a.current_streak.count : a.current_streak.type === "loss" ? -a.current_streak.count : 0;
        const sb = b.current_streak.type === "win" ? b.current_streak.count : b.current_streak.type === "loss" ? -b.current_streak.count : 0;
        return sa - sb;
      },
      word: (a, b) => (a.top_word || "").localeCompare(b.top_word || ""),
      best_mate: (a, b) => (a.best_teammate?.winrate ?? -1) - (b.best_teammate?.winrate ?? -1),
      worst_mate: (a, b) => (a.worst_teammate?.winrate ?? 999) - (b.worst_teammate?.winrate ?? 999),
    };
    arr.sort(cmp[sort]);
    if (dir === "desc") arr.reverse();
    return arr;
  }, [players, minGames, sort, dir]);

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className="px-3 py-2 cursor-pointer select-none hover:text-primary"
      onClick={() => {
        if (sort === k) setDir(dir === "asc" ? "desc" : "asc");
        else {
          setSort(k);
          setDir("desc");
        }
      }}
    >
      {label}
      {sort === k ? (dir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display text-glow text-center">Игроки</h1>
      <div className="flex justify-center">
        <Button
          variant={minGames ? "default" : "outline"}
          size="sm"
          onClick={() => setMinGames((v) => !v)}
        >
          {minGames ? "Все игроки" : "Только от 10+ игр"}
        </Button>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-base text-center">
          <thead className="bg-muted/30">
            <tr>
              <Th k="name" label="Ник" />
              <Th k="games" label="Игр" />
              <Th k="winrate" label="WR" />
              <Th k="total_seconds" label="Потрачено" />
              <Th k="unique" label="Уник. героев" />
              <Th k="max_win" label="max серия побед" />
              <Th k="max_loss" label="max серия поражений" />
              <Th k="current" label="Текущая серия" />
              <Th k="word" label="Слово" />
              <Th k="best_mate" label="Лучший союзник" />
              <Th k="worst_mate" label="Худший союзник" />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.steam_id} className="border-t border-border/40 hover:bg-muted/20">
                <td className="px-3 py-2">
                  <Link
                    to={`/player?nick=${encodeURIComponent(p.name)}`}
                    className="text-primary hover:underline"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{p.games}</td>
                <td className="px-3 py-2">{p.winrate}%</td>
                <td className="px-3 py-2">{formatDuration(p.total_seconds)}</td>
                <td className="px-3 py-2">{p.unique_heroes.length}</td>
                <td className="px-3 py-2">{p.max_win_streak}</td>
                <td className="px-3 py-2">{p.max_loss_streak}</td>
                <td className="px-3 py-2">
                  {p.current_streak.type === "none" ? (
                    "—"
                  ) : (
                    <span
                      className={
                        p.current_streak.type === "win"
                          ? "text-[oklch(0.75_0.18_145)] font-medium"
                          : "text-[oklch(0.65_0.22_25)] font-medium"
                      }
                    >
                      {p.current_streak.count}
                      {p.current_streak.type === "win" ? "+" : "-"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{p.top_word || "—"}</td>
                <td className="px-3 py-2">
                  {p.best_teammate ? `${p.best_teammate.name} (${p.best_teammate.winrate}%)` : "—"}
                </td>
                <td className="px-3 py-2">
                  {p.worst_teammate ? `${p.worst_teammate.name} (${p.worst_teammate.winrate}%)` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
