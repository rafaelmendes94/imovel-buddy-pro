ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT 0;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT 0;