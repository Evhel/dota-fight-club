import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdmin } from "@/lib/admin";
import { useUploadMatch, useMatches, useDeleteMatch, useUpdateMatchDate } from "@/lib/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Shield } from "lucide-react";
import type { DotaMatch } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const admin = useAdmin();
  const upload = useUploadMatch();
  const del = useDeleteMatch();
  const updDate = useUpdateMatchDate();
  const matches = useMatches();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (!admin) {
    return (
      <div className="max-w-md mx-auto mt-16 panel p-8 text-center">
        <Shield className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="mb-4">Доступ только для администратора.</p>
        <Link to="/login" className="text-primary underline">
          Войти
        </Link>
      </div>
    );
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    let added = 0,
      dup = 0,
      err = 0;
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const json = JSON.parse(text) as DotaMatch;
        if (!json.match_id) throw new Error("Нет match_id");
        const r = await upload.mutateAsync(json);
        if (r.status === "added") added++;
        else dup++;
      } catch (e) {
        err++;
        console.error(file.name, e);
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    const parts: string[] = [];
    if (added) parts.push(`Добавлено: ${added}`);
    if (dup) parts.push(`Уже учтено: ${dup}`);
    if (err) parts.push(`Ошибок: ${err}`);
    toast[err ? "warning" : "success"](parts.join(" · ") || "Готово");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-display text-glow">Панель администратора</h1>
        <p className="text-muted-foreground mt-1">
          Загружай JSON-файлы матчей. Дубликаты по match_id игнорируются автоматически.
        </p>
      </div>

      <div className="panel p-6 space-y-4">
        <h2 className="font-display text-xl flex items-center gap-2">
          <Upload className="h-5 w-5" /> Добавить матч
        </h2>
        <Input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          multiple
          disabled={busy}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="w-full sm:w-auto"
        >
          {busy ? "Загрузка..." : "Выбрать файлы"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Можно выбрать один или сразу несколько файлов.
        </p>
      </div>

      <div className="panel p-6">
        <h2 className="font-display text-xl mb-4">
          Учтённые матчи ({matches.data?.length ?? 0})
        </h2>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {(matches.data || []).map((m) => (
            <div
              key={m.match_id}
              className="flex items-center justify-between px-3 py-2 rounded border border-border/60 hover:bg-muted/30"
            >
              <div>
                <div className="font-mono text-sm">#{m.match_id}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(m.start_time).toLocaleDateString("ru-RU")} · {m.data.game_mode}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Удалить матч #${m.match_id}?`)) {
                    del.mutate(m.match_id, {
                      onSuccess: () => toast.success("Матч удалён"),
                    });
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {matches.data && matches.data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Пока нет загруженных матчей.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
