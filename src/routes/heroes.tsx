import { createFileRoute } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { computeHeroStats } from "@/lib/stats";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/heroes")({
  component: HeroesPage,
});

type Sort = "alpha" | "wr" | "games";

function HeroesPage() {
  const { data: matches = [] } = useMatches();
  const heroes = useMemo(() => computeHeroStats(matches), [matches]);
  const [sort, setSort] = useState<Sort>("games");

  const sorted = useMemo(() => {
    const arr = [...heroes];
    if (sort === "alpha") arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "wr") arr.sort((a, b) => b.winrate - a.winrate);
    if (sort === "games") arr.sort((a, b) => b.games - a.games);
    return arr;
  }, [heroes, sort]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display text-glow">Герои</h1>
      <div className="flex gap-2">
        <Button variant={sort === "alpha" ? "default" : "outline"} size="sm" onClick={() => setSort("alpha")}>
          По алфавиту
        </Button>
        <Button variant={sort === "wr" ? "default" : "outline"} size="sm" onClick={() => setSort("wr")}>
          По винрейту
        </Button>
        <Button variant={sort === "games" ? "default" : "outline"} size="sm" onClick={() => setSort("games")}>
          По играм
        </Button>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left">
            <tr>
              <th className="px-3 py-2">Герой</th>
              <th className="px-3 py-2">Игр</th>
              <th className="px-3 py-2">Винрейт</th>
              <th className="px-3 py-2">Банов</th>
              <th className="px-3 py-2">Первых банов</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => (
              <tr key={h.name} className="border-t border-border/40 hover:bg-muted/20">
                <td className="px-3 py-2">{h.name}</td>
                <td className="px-3 py-2">{h.games}</td>
                <td className="px-3 py-2">{h.winrate}%</td>
                <td className="px-3 py-2">{h.bans}</td>
                <td className="px-3 py-2">{h.first_bans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
