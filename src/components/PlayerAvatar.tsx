import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  steamId: string;
  name: string;
}

export function PlayerAvatar({ steamId, name }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("player_avatars")
        .select("avatar_url")
        .eq("steam_id", steamId)
        .maybeSingle();
      if (!cancelled) setUrl(data?.avatar_url ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [steamId]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${steamId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("player-avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("player-avatars").getPublicUrl(path);
      const newUrl = pub.publicUrl;
      const { error: dbErr } = await supabase
        .from("player_avatars")
        .upsert({ steam_id: steamId, avatar_url: newUrl, updated_at: new Date().toISOString() });
      if (dbErr) throw dbErr;
      setUrl(newUrl);
    } catch (err) {
      console.error(err);
      alert("Не удалось загрузить аватарку");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-80 h-[28rem] rounded-lg overflow-hidden border-2 border-primary/60 bg-muted/30 flex items-center justify-center cursor-pointer hover:border-primary"
        onClick={() => inputRef.current?.click()}
        title="Загрузить аватарку"
      >
        {url ? (
          <img src={url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl font-display text-muted-foreground">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
        disabled={busy}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="text-xs text-muted-foreground hover:text-primary underline"
      >
        {busy ? "Загрузка..." : url ? "Заменить аватарку" : "Загрузить аватарку"}
      </button>
    </div>
  );
}
