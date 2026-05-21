import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/match/")({
  component: MatchSearch,
});

function MatchSearch() {
  const { data: matches = [] } = useMatches();
  const navigate = useNavigate();
  const [num, setNum] = useState("");
  const sorted = [...matches].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );

  return (
    <div className="max-w-md mx-auto space-y-4 panel p-6 mt-8">
      <h1 className="text-2xl font-display text-glow">Поиск матча</h1>
      <p className="text-sm text-muted-foreground">
        Введи порядковый номер игры (1–{sorted.length}).
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const idx = parseInt(num, 10) - 1;
          if (idx >= 0 && idx < sorted.length) {
            navigate({ to: `/match/${sorted[idx].match_id}` });
          }
        }}
      >
        <Input
          type="number"
          min={1}
          max={sorted.length}
          placeholder="Номер игры"
          value={num}
          onChange={(e) => setNum(e.target.value)}
        />
        <Button type="submit">Найти</Button>
      </form>
    </div>
  );
}
