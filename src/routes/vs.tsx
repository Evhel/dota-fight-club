import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities, computeVsStats } from "@/lib/stats";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ nick: z.string().optional() });

export const Route = createFileRoute("/vs")({
  validateSearch: zodValidator(searchSchema),
  component: VsPage,
});

function VsPage() {
  const { data: matches = [] } = useMatches();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const identities = useMemo(() => buildIdentities(matches), [matches]);
  const nicks = useMemo(
    () => [...identities.values()].sort((a, b) => b.match_count - a.match_count).map((i) => i.display_name),
    [identities],
  );
  const [selected, setSelected] = useState(search.nick || "");
  useEffect(() => {
    if (search.nick) setSelected(search.nick);
  }, [search.nick]);

  const steamId = useMemo(() => {
    for (const [sid, id] of identities) if (id.display_name === selected) return sid;
    return null;
  }, [identities, selected]);

  const rows = useMemo(() => {
    if (!steamId) return [];
    return computeVsStats(steamId, matches, identities);
  }, [steamId, matches, identities]);

  type SortKey = "name" | "total" | "same_team" | "same_winrate" | "opp_team" | "opp_winrate";
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortAsc, setSortAsc] = useState(false);

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "string" || typeof bv === "string"
          ? String(av).localeCompare(String(bv), "ru")
          : Number(av) - Number(bv);
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortAsc]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(k);
      setSortAsc(k === "name");
    }
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Игрок" },
    { key: "total", label: "Всего" },
    { key: "same_team", label: "В одной команде" },
    { key: "same_winrate", label: "WR вместе" },
    { key: "opp_team", label: "Против" },
    { key: "opp_winrate", label: "WR против" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display text-glow text-center">Игрок vs Игрок</h1>
      <div className="panel p-4 flex flex-wrap items-center justify-center gap-2">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Выбери игрока..." />
          </SelectTrigger>
          <SelectContent>
            {nicks.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => navigate({ search: { nick: selected } })} disabled={!selected}>
          Найти игрока
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="panel overflow-x-auto max-w-3xl mx-auto">
          <table className="w-full text-sm text-center">
            <thead className="bg-muted/30">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className="px-3 py-2 text-center cursor-pointer select-none hover:text-primary"
                  >
                    {c.label}
                    {sortKey === c.key ? (sortAsc ? " ▲" : " ▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={r.steam_id} className="border-t border-border/40 hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <Link to="/player" search={{ nick: r.name }} className="text-primary hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.total}</td>
                  <td className="px-3 py-2">{r.same_team}</td>
                  <td className="px-3 py-2">{r.same_winrate}%</td>
                  <td className="px-3 py-2">{r.opp_team}</td>
                  <td className="px-3 py-2">{r.opp_winrate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
