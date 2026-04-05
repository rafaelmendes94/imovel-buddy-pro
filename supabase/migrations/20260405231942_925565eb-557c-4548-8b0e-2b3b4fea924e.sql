
-- Add views column to imoveis
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- Function to increment views atomically
CREATE OR REPLACE FUNCTION public.increment_imovel_views(imovel_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.imoveis SET views = views + 1 WHERE id = imovel_id;
$$;
