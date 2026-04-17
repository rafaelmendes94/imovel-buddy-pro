-- Renomeia/reaproveita vendas_manuais como agenciamentos
ALTER TABLE public.vendas_manuais RENAME TO agenciamentos;

-- Limpa dados antigos (estrutura mudou completamente)
DELETE FROM public.agenciamentos;

-- Remove colunas antigas que não se aplicam
ALTER TABLE public.agenciamentos
  DROP COLUMN IF EXISTS data_venda,
  DROP COLUMN IF EXISTS valor,
  DROP COLUMN IF EXISTS comissao,
  DROP COLUMN IF EXISTS corretor,
  DROP COLUMN IF EXISTS cliente,
  DROP COLUMN IF EXISTS empreendimento,
  DROP COLUMN IF EXISTS edificio_condominio,
  DROP COLUMN IF EXISTS observacoes,
  DROP COLUMN IF EXISTS tipo,
  DROP COLUMN IF EXISTS bairro,
  DROP COLUMN IF EXISTS cidade,
  DROP COLUMN IF EXISTS origem;

-- Adiciona colunas no padrão da planilha de agenciamentos
ALTER TABLE public.agenciamentos
  ADD COLUMN imovel TEXT NOT NULL DEFAULT '',
  ADD COLUMN tipo TEXT NOT NULL DEFAULT '',
  ADD COLUMN padrao TEXT NOT NULL DEFAULT '',
  ADD COLUMN apto_quadra_lote TEXT NOT NULL DEFAULT '',
  ADD COLUMN box TEXT NOT NULL DEFAULT '',
  ADD COLUMN dormitorios TEXT NOT NULL DEFAULT '',
  ADD COLUMN metragem NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN ano_construcao_iptu TEXT NOT NULL DEFAULT '',
  ADD COLUMN posicao TEXT NOT NULL DEFAULT '',
  ADD COLUMN mobiliado TEXT NOT NULL DEFAULT '',
  ADD COLUMN destaque TEXT NOT NULL DEFAULT '',
  ADD COLUMN bairro TEXT NOT NULL DEFAULT '',
  ADD COLUMN rua TEXT NOT NULL DEFAULT '',
  ADD COLUMN valor NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN fin_bancario TEXT NOT NULL DEFAULT '',
  ADD COLUMN entrada TEXT NOT NULL DEFAULT '',
  ADD COLUMN prazo_direto TEXT NOT NULL DEFAULT '',
  ADD COLUMN condicao_pagamento TEXT NOT NULL DEFAULT '',
  ADD COLUMN observacoes TEXT NOT NULL DEFAULT '',
  ADD COLUMN cond_iptu TEXT NOT NULL DEFAULT '',
  ADD COLUMN chaves_obra TEXT NOT NULL DEFAULT '',
  ADD COLUMN proprietario TEXT NOT NULL DEFAULT '',
  ADD COLUMN telefone TEXT NOT NULL DEFAULT '',
  ADD COLUMN cidade TEXT NOT NULL DEFAULT '',
  ADD COLUMN data_inclusao DATE,
  ADD COLUMN data_atualizacao DATE,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'ativo'; -- ativo | novo_semana | atualizado_semana | vendido

CREATE INDEX IF NOT EXISTS idx_agenciamentos_user ON public.agenciamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_agenciamentos_status ON public.agenciamentos(status);
CREATE INDEX IF NOT EXISTS idx_agenciamentos_cidade ON public.agenciamentos(cidade);

-- Renomeia policies antigas para refletir novo nome
DROP POLICY IF EXISTS "Users delete own vendas_manuais" ON public.agenciamentos;
DROP POLICY IF EXISTS "Users insert own vendas_manuais" ON public.agenciamentos;
DROP POLICY IF EXISTS "Users read own vendas_manuais" ON public.agenciamentos;
DROP POLICY IF EXISTS "Users update own vendas_manuais" ON public.agenciamentos;

CREATE POLICY "Users delete own agenciamentos" ON public.agenciamentos
  FOR DELETE USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users insert own agenciamentos" ON public.agenciamentos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own agenciamentos" ON public.agenciamentos
  FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role));

CREATE POLICY "Users update own agenciamentos" ON public.agenciamentos
  FOR UPDATE USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role));