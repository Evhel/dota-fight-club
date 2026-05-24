
-- Awards table
CREATE TABLE public.awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  steam_id text NOT NULL,
  player_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "awards public read" ON public.awards FOR SELECT USING (true);
CREATE POLICY "awards public insert" ON public.awards FOR INSERT WITH CHECK (true);
CREATE POLICY "awards public update" ON public.awards FOR UPDATE USING (true);
CREATE POLICY "awards public delete" ON public.awards FOR DELETE USING (true);

-- Storage bucket for award images
INSERT INTO storage.buckets (id, name, public) VALUES ('awards', 'awards', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "awards bucket public read" ON storage.objects FOR SELECT USING (bucket_id = 'awards');
CREATE POLICY "awards bucket public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'awards');
CREATE POLICY "awards bucket public update" ON storage.objects FOR UPDATE USING (bucket_id = 'awards');
CREATE POLICY "awards bucket public delete" ON storage.objects FOR DELETE USING (bucket_id = 'awards');
