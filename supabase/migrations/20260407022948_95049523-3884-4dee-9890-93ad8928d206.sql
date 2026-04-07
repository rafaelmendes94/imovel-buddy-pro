
-- Add tipo and cidade columns to city_galleries
ALTER TABLE public.city_galleries
  ADD COLUMN tipo text NOT NULL DEFAULT '',
  ADD COLUMN cidade text NOT NULL DEFAULT '';

-- Pre-register tipo options in system_options
INSERT INTO public.system_options (category, value, sort_order) VALUES
  ('gallery_tipo', 'Paisagem', 1),
  ('gallery_tipo', 'Praças', 2),
  ('gallery_tipo', 'Pontos Turísticos', 3),
  ('gallery_tipo', 'Praias', 4),
  ('gallery_tipo', 'Infraestrutura', 5),
  ('gallery_tipo', 'Lazer', 6),
  ('gallery_tipo', 'Comércio', 7),
  ('gallery_tipo', 'Bairros', 8);
