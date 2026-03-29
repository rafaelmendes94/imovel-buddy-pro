
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS site_title text NOT NULL DEFAULT 'MV BROKER CONNECT',
  ADD COLUMN IF NOT EXISTS slogan text NOT NULL DEFAULT 'Seu imóvel dos sonhos está aqui',
  ADD COLUMN IF NOT EXISTS title_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS footer_text text NOT NULL DEFAULT '© 2026 MV BROKER CONNECT. Todos os direitos reservados.',
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS email_contact text;
