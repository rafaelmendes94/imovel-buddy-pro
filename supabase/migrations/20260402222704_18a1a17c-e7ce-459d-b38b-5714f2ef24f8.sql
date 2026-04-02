ALTER TABLE public.imoveis
ADD COLUMN IF NOT EXISTS link_video text DEFAULT '',
ADD COLUMN IF NOT EXISTS link_material text DEFAULT '';