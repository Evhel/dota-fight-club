import { createFileRoute } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { buildIdentities, computeAllPlayerStats, computeGlobalStats } from "@/lib/stats";
import { RecordsTable } from "@/components/RecordsTable";
import { useMemo } from "react";

export const Route = createFileRoute("/records")({ component: RecordsPage });

function RecordsPage() {
  const { data: matches = [] } = useMatches();
  const { records } = useMemo(() => {
    const ids = buildIdentities(matches);
    return computeGlobalStats(matches, ids, computeAllPlayerStats(matches, ids));
  }, [matches]);
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-display text-glow text-center">Рекорды</h1>
      <p className="text-sm text-muted-foreground text-center">
        Урон и лечение — по итоговой статистике Dota, без урона по иллюзиям. Проверено матчей:{" "}
        {
          matches.filter(
            (m) => m.data.data_quality?.terminal_stats_source === "replay_match_details",
          ).length
        }{" "}
        из {matches.length}.
      </p>
      <RecordsTable records={records} />
    </div>
  );
}
