import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAwards, AWARD_LINK } from "@/lib/awards";

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

  const { data: awards = [] } = useAwards();
  const myAwards = awards.filter((a) => a.steam_id === steamId);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-80 h-[28rem] rounded-lg overflow-hidden border-2 border-primary/60 bg-muted/30 flex items-center justify-center cursor-pointer hover:border-primary"
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          <img src={url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl font-display text-muted-foreground">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      {myAwards.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center max-w-80">
          {myAwards.map((a) => (
            <a
              key={a.id}
              href={AWARD_LINK}
              target="_blank"
              rel="noopener noreferrer"
              title={a.name}
              className="hover:scale-110 transition"
            >
              <img src={a.image_url} alt={a.name} className="w-16 h-16 object-contain" />
            </a>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
        disabled={busy}
      />
      {busy && <div className="text-xs text-muted-foreground">Загрузка...</div>}
    </div>
  );
}
