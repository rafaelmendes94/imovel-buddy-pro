
-- Add address detail columns to imoveis table
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS cep text DEFAULT '';
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS numero text DEFAULT '';
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS complemento text DEFAULT '';
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS estado text DEFAULT '';
