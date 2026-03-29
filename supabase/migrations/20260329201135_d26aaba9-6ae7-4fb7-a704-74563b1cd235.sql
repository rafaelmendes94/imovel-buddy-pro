
ALTER TABLE public.imoveis 
  ADD COLUMN IF NOT EXISTS empreendimento text DEFAULT '',
  ADD COLUMN IF NOT EXISTS unidade text DEFAULT '',
  ADD COLUMN IF NOT EXISTS box text DEFAULT '',
  ADD COLUMN IF NOT EXISTS quadra text DEFAULT '',
  ADD COLUMN IF NOT EXISTS lote text DEFAULT '',
  ADD COLUMN IF NOT EXISTS vagas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS area_privativa numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vista_mar boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS decorado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceita_permuta boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ativo_site boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bairro text DEFAULT '',
  ADD COLUMN IF NOT EXISTS condicoes_pagamento text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS proprietario text DEFAULT '',
  ADD COLUMN IF NOT EXISTS proprietario_telefone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS proprietario_tipo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS condicao text DEFAULT '',
  ADD COLUMN IF NOT EXISTS padrao text DEFAULT '',
  ADD COLUMN IF NOT EXISTS posicao_predio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS posicao_solar text DEFAULT '',
  ADD COLUMN IF NOT EXISTS vista text DEFAULT '',
  ADD COLUMN IF NOT EXISTS local_chaves text DEFAULT '',
  ADD COLUMN IF NOT EXISTS termo_exclusividade text DEFAULT '',
  ADD COLUMN IF NOT EXISTS infraestrutura text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS outras_caracteristicas text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS comissao numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_validade text DEFAULT '',
  ADD COLUMN IF NOT EXISTS preco_parcelado numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS elevadores integer DEFAULT 0;

-- Public read policy for active properties on site
CREATE POLICY "Public reads active properties"
ON public.imoveis
FOR SELECT
TO anon
USING (ativo_site = true);
