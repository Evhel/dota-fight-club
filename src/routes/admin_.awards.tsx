import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdmin } from "@/lib/admin";
import { useMatches } from "@/lib/matches";
import { buildIdentities } from "@/lib/stats";
import { useAwards, useCreateAward, useDeleteAward } from "@/lib/awards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Shield, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin_/awards")({
  component: AdminAwardsPage,
});

function AdminAwardsPage() {
  const admin = useAdmin();
  const matches = useMatches();
  const awards = useAwards();
  const create = useCreateAward();
  const del = useDeleteAward();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [player, setPlayer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const players = useMemo(() => {
    const ids = buildIdentities(matches.data || []);
    return [...ids.values()]
      .sort((a, b) => b.match_count - a.match_count)
      .map((i) => ({ steam_id: i.steam_id, name: i.display_name }));
  }, [matches.data]);

  if (!admin) {
    return (
      <div className="max-w-md mx-auto mt-16 panel p-8 text-center">
        <Shield className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="mb-4">Доступ только для администратора.</p>
        <Link to="/login" className="text-primary underline">Войти</Link>
      </div>
    );
  }

  const submit = async () => {
    if (!name.trim() || !player || !file) {
      toast.error("Заполни все поля и выбери файл");
      return;
    }
    const p = players.find((x) => x.name === player);
    if (!p) return;
    setBusy(true);
    try {
      await create.mutateAsync({ name: name.trim(), image: file, steam_id: p.steam_id, player_name: p.name });
      toast.success("Награда создана");
      setName(""); setPlayer(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      console.error(e);
      toast.error("Не удалось создать награду");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-display text-glow">Награды</h1>
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary underline">← к матчам</Link>
      </div>

      <div className="panel p-6 space-y-4">
        <h2 className="font-display text-xl">Создать награду</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Название</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: MVP сезона" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Изображение (PNG 64×64, прозрачный фон)</label>
            <Input
              ref={fileRef}
              type="file"
              accept="image/png,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Игрок</label>
            <Select value={player} onValueChange={setPlayer}>
              <SelectTrigger><SelectValue placeholder="Выбери игрока..." /></SelectTrigger>
              <SelectContent>
                {players.map((p) => (
                  <SelectItem key={p.steam_id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} disabled={busy}>{busy ? "Сохранение..." : "Создать награду"}</Button>
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="font-display text-xl mb-4">Назначенные награды ({awards.data?.length ?? 0})</h2>
        <div className="space-y-2">
          {(awards.data || []).map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded border border-border/60">
              <img src={a.image_url} alt={a.name} className="w-12 h-12 object-contain" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{a.name}</div>
                <div className="text-xs text-muted-foreground">→ {a.player_name}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Удалить награду "${a.name}"?`)) {
                    del.mutate(a.id, { onSuccess: () => toast.success("Удалено") });
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {awards.data && awards.data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Ещё нет наград.</p>
          )}
        </div>
      </div>
    </div>
  );
}
