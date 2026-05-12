ALTER TABLE public.edificios
  ADD COLUMN IF NOT EXISTS fotos_infra text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS fotos_empreendimento text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS material_digital text[] DEFAULT '{}'::text[];

ALTER TABLE public.empreendimentos
  ADD COLUMN IF NOT EXISTS fotos_infra text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS fotos_empreendimento text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS material_digital text[] DEFAULT '{}'::text[];

ALTER TABLE public.condominios
  ADD COLUMN IF NOT EXISTS fotos_infra text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS fotos_empreendimento text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS material_digital text[] DEFAULT '{}'::text[];