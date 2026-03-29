
-- Table for site/page appearance configuration
CREATE TABLE public.site_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL DEFAULT 'main_site',
  owner_id text,
  header_color text NOT NULL DEFAULT '#1e3a5f',
  footer_color text NOT NULL DEFAULT '#111827',
  accent_color text NOT NULL DEFAULT '#2563eb',
  cover_photo_url text,
  profile_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(config_type, owner_id)
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read configs (public pages)
CREATE POLICY "Anyone can read site_config" ON public.site_config
  FOR SELECT USING (true);

-- Authenticated users can upsert their own configs
CREATE POLICY "Auth users manage own config" ON public.site_config
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Storage bucket for site assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true);

-- Allow authenticated users to upload to site-assets
CREATE POLICY "Auth users upload site assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-assets');

CREATE POLICY "Anyone can read site assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');

CREATE POLICY "Auth users update own site assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets');

CREATE POLICY "Auth users delete own site assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets');
