import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/match/")({
  component: MatchSearch,
});

function MatchSearch() {
  const { data: matches = [] } = useMatches();
  const navigate = useNavigate();
  const ascending = [...matches].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  const indexed = ascending.map((m, i) => ({ ...m, num: i + 1 }));
  const sorted = [...indexed].reverse();

  return (
    <div className="max-w-md mx-auto space-y-4 panel p-6 mt-8 text-center">
      <h1 className="text-2xl font-display text-glow">Поиск матча</h1>
      <p className="text-sm text-muted-foreground">
        Выбери игру из списка (1–{sorted.length}).
      </p>
      <div className="flex justify-center">
        <Select
          onValueChange={(val) => {
            navigate({ to: `/match/${val}` });
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Выбери номер игры..." />
          </SelectTrigger>
          <SelectContent>
            {sorted.map((m, idx) => (
              <SelectItem key={m.match_id} value={String(m.match_id)}>
                #{idx + 1} — {new Date(m.start_time).toLocaleDateString("ru-RU")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
