ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS finalidade text NOT NULL DEFAULT 'Venda',
  ADD COLUMN IF NOT EXISTS valor_condominio numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_iptu numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mobiliado boolean NOT NULL DEFAULT false;