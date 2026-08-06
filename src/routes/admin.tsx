import { createFileRoute } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import { useAwards } from "@/lib/awards";
import { STATIC_AVATARS } from "@/lib/static-data";
import { FolderOpen } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Данные проекта — Бойцовский Клуб Dota 2" }],
  }),
});

function AdminPage() {
  const matches = useMatches();
  const awards = useAwards();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-display text-glow">Данные проекта</h1>
        <p className="text-muted-foreground mt-1">
          Сайт больше не использует базу данных — все данные лежат файлами в репозитории.
        </p>
      </div>

      <div className="panel p-6 space-y-4">
        <h2 className="font-display text-xl flex items-center gap-2">
          <FolderOpen className="h-5 w-5" /> Как добавить данные
        </h2>
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-medium">1. Матчи ({matches.data?.length ?? 0})</div>
            <p className="text-muted-foreground">
              Положи JSON-файл матча в папку <code className="text-primary">src/data/matches/</code>.
              Имя файла любое, удобнее <code className="text-primary">&lt;match_id&gt;.json</code>.
              Дубликаты по match_id отбрасываются автоматически.
            </p>
          </div>
          <div>
            <div className="font-medium">2. Аватарки ({STATIC_AVATARS.size})</div>
            <p className="text-muted-foreground">
              Картинку — в <code className="text-primary">public/avatars/</code>, строку — в{" "}
              <code className="text-primary">public/avatars/avatars.txt</code> в формате{" "}
              <code className="text-primary">steam_id = имя_файла</code>.
            </p>
          </div>
          <div>
            <div className="font-medium">3. Награды ({awards.data?.length ?? 0})</div>
            <p className="text-muted-foreground">
              Картинку — в <code className="text-primary">public/awards/</code>, строку — в{" "}
              <code className="text-primary">public/awards/awards.txt</code> в формате{" "}
              <code className="text-primary">steam_id | имя_файла | Название награды</code>.
            </p>
          </div>
          <p className="text-muted-foreground">
            После изменений — коммит и пуш в GitHub, сайт пересоберётся сам.
          </p>
        </div>
      </div>
    </div>
  );
}
