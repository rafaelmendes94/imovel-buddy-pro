
ALTER TABLE public.empreendimentos
  ADD COLUMN IF NOT EXISTS imagens text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS link_360 text DEFAULT '',
  ADD COLUMN IF NOT EXISTS link_video text DEFAULT '';

ALTER TABLE public.condominios
  ADD COLUMN IF NOT EXISTS implantacao_url text DEFAULT '';
