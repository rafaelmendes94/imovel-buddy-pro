
ALTER TABLE public.imoveis 
  ADD COLUMN IF NOT EXISTS destaque_categoria text DEFAULT '';
