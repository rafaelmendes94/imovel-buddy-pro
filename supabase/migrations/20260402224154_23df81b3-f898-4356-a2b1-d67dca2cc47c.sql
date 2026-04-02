
-- Add missing columns to condominios
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS cep text DEFAULT '';
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS numero text DEFAULT '';
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS complemento text DEFAULT '';
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS bairro text DEFAULT '';
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS estado text DEFAULT '';
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS construtora text DEFAULT '';
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS ano_construcao text DEFAULT '';
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS descricao text DEFAULT '';

-- Add missing columns to empreendimentos
ALTER TABLE public.empreendimentos ADD COLUMN IF NOT EXISTS cep text DEFAULT '';
ALTER TABLE public.empreendimentos ADD COLUMN IF NOT EXISTS numero text DEFAULT '';
ALTER TABLE public.empreendimentos ADD COLUMN IF NOT EXISTS complemento text DEFAULT '';
ALTER TABLE public.empreendimentos ADD COLUMN IF NOT EXISTS bairro text DEFAULT '';
ALTER TABLE public.empreendimentos ADD COLUMN IF NOT EXISTS estado text DEFAULT '';
