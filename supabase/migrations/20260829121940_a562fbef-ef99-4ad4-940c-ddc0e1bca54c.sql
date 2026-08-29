ALTER TABLE public.condominios
  ADD COLUMN IF NOT EXISTS link_360 text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS video_capa_url text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS tour_capa_url text DEFAULT ''::text;