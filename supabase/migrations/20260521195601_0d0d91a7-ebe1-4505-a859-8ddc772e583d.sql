
CREATE TABLE public.matches (
  match_id BIGINT PRIMARY KEY,
  start_time TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX matches_start_time_idx ON public.matches (start_time DESC);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read matches"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Public can insert matches"
  ON public.matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can delete matches"
  ON public.matches FOR DELETE
  USING (true);
