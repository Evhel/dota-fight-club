import { useAwards, AWARD_LINK } from "@/lib/awards";
import { STATIC_AVATARS } from "@/lib/static-data";

interface Props {
  steamId: string;
  name: string;
}

export function PlayerAvatar({ steamId, name }: Props) {
  const url = STATIC_AVATARS.get(String(steamId)) ?? null;
  const { data: awards = [] } = useAwards();
  const myAwards = awards.filter((a) => a.steam_id === steamId);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-80 h-[28rem] rounded-lg overflow-hidden border-2 border-primary/60 bg-muted/30 flex items-center justify-center">
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
    </div>
  );
}
