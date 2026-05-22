import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches, useDeleteMatch } from "@/lib/matches";
import { matchDeaths } from "@/lib/stats";
import { useAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const { data: matches = [] } = useMatches();
  const admin = useAdmin();
  const del = useDeleteMatch();
  const sorted = [...matches].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-display text-glow">Все матчи</h1>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2 text-center">#</th>
              <th className="px-3 py-2 text-center">Дата</th>
              <th className="px-3 py-2 text-center">Режим</th>
              <th className="px-3 py-2 text-center">Длительность</th>
              <th className="px-3 py-2 text-center">Пик</th>
              <th className="px-3 py-2 text-center">Победа</th>
              <th className="px-3 py-2 text-center">Смерти Свет</th>
              <th className="px-3 py-2 text-center">Смерти Тьма</th>
              {admin && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => {
              const d = matchDeaths(m.data);
              return (
                <tr key={m.match_id} className="border-t border-border/40 hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/match/${m.match_id}`}
                      className="text-primary hover:underline"
                    >
                      {new Date(m.start_time).toLocaleString("ru-RU")}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{m.data.game_mode}</td>
                  <td className="px-3 py-2">{Math.round(m.data.duration_minutes)} мин</td>
                  <td className="px-3 py-2">{Math.round(m.data.draft_duration_minutes)} мин</td>
                  <td
                    className="px-3 py-2 font-medium"
                    style={{
                      color:
                        m.data.winner === "radiant" ? "var(--radiant)" : "var(--dire)",
                    }}
                  >
                    {m.data.winner === "radiant" ? "Свет" : "Тьма"}
                  </td>
                  <td className="px-3 py-2">{d.radiant}</td>
                  <td className="px-3 py-2">{d.dire}</td>
                  {admin && (
                    <td className="px-3 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Удалить матч #${m.match_id}?`)) {
                            del.mutate(m.match_id, {
                              onSuccess: () => toast.success("Удалено"),
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={admin ? 9 : 8} className="text-center py-6 text-muted-foreground">
                  Матчей пока нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
