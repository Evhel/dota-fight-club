import { createFileRoute } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { computeHeroStats } from "@/lib/stats";
import { heroImg, heroAnchorId } from "@/lib/heroes";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/heroes")({
  component: HeroesPage,
});

type Sort = "alpha" | "wr" | "games" | "bans" | "first_bans";

function HeroesPage() {
  const { data: matches = [] } = useMatches();
  const heroes = useMemo(() => computeHeroStats(matches), [matches]);
  const [sort, setSort] = useState<Sort>("games");

  const sorted = useMemo(() => {
    const arr = [...heroes];
    if (sort === "alpha") arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "wr") arr.sort((a, b) => b.winrate - a.winrate);
    if (sort === "games") arr.sort((a, b) => b.games - a.games);
    if (sort === "bans") arr.sort((a, b) => b.bans - a.bans);
    if (sort === "first_bans") arr.sort((a, b) => b.first_bans - a.first_bans);
    return arr;
  }, [heroes, sort]);

  const SortBtn = ({ k, label }: { k: Sort; label: string }) => (
    <Button variant={sort === k ? "default" : "outline"} size="sm" onClick={() => setSort(k)}>
      {label}
    </Button>
  );

  const Th = ({ k, label }: { k: Sort; label: string }) => (
    <th
      className="px-3 py-2 text-center cursor-pointer select-none hover:text-primary"
      onClick={() => setSort(k)}
    >
      {label}{sort === k ? " ▼" : ""}
    </th>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display text-glow text-center">Герои</h1>
      <div className="flex gap-2 justify-center flex-wrap">
        <SortBtn k="alpha" label="По алфавиту" />
        <SortBtn k="wr" label="По винрейту" />
        <SortBtn k="games" label="По играм" />
        <SortBtn k="bans" label="По банам" />
        <SortBtn k="first_bans" label="По первым банам" />
      </div>
      <div className="panel overflow-x-auto max-w-2xl mx-auto">
        <table className="w-full text-sm text-center">
          <thead className="bg-muted/30">
            <tr>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none hover:text-primary"
                onClick={() => setSort("alpha")}
              >
                Герой{sort === "alpha" ? " ▼" : ""}
              </th>
              <Th k="games" label="Игр" />
              <Th k="wr" label="Винрейт" />
              <Th k="bans" label="Банов" />
              <Th k="first_bans" label="Первых банов" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => (
              <tr key={h.name} id={heroAnchorId(h.name)} className="border-t border-border/40 hover:bg-muted/20">
                <td className="px-3 py-2 text-left">
                  <div className="flex items-center gap-2 justify-start">
                    <img
                      src={heroImg(h.name)}
                      alt={h.name}
                      className="w-12 h-7 object-cover rounded-sm border border-border/40"
                      loading="lazy"
                      onError={(e) => ((e.currentTarget.style.visibility = "hidden"))}
                    />
                    <span>{h.name}</span>
                  </div>
                </td>
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
