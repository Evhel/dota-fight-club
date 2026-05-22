
-- Player avatars table
CREATE TABLE IF NOT EXISTS public.player_avatars (
  steam_id text PRIMARY KEY,
  avatar_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatars public read" ON public.player_avatars FOR SELECT USING (true);
CREATE POLICY "avatars public insert" ON public.player_avatars FOR INSERT WITH CHECK (true);
CREATE POLICY "avatars public update" ON public.player_avatars FOR UPDATE USING (true);
CREATE POLICY "avatars public delete" ON public.player_avatars FOR DELETE USING (true);

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-avatars', 'player-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatar bucket read" ON storage.objects FOR SELECT USING (bucket_id = 'player-avatars');
CREATE POLICY "avatar bucket insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'player-avatars');
CREATE POLICY "avatar bucket update" ON storage.objects FOR UPDATE USING (bucket_id = 'player-avatars');
CREATE POLICY "avatar bucket delete" ON storage.objects FOR DELETE USING (bucket_id = 'player-avatars');
