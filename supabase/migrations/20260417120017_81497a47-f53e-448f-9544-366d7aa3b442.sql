CREATE TABLE public.vendas_manuais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_venda DATE NOT NULL,
  cidade TEXT NOT NULL DEFAULT '',
  bairro TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT '',
  empreendimento TEXT NOT NULL DEFAULT '',
  edificio_condominio TEXT NOT NULL DEFAULT '',
  valor NUMERIC NOT NULL DEFAULT 0,
  comissao NUMERIC NOT NULL DEFAULT 0,
  corretor TEXT NOT NULL DEFAULT '',
  cliente TEXT NOT NULL DEFAULT '',
  origem TEXT NOT NULL DEFAULT 'manual',
  observacoes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendas_manuais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own vendas_manuais"
ON public.vendas_manuais FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role));

CREATE POLICY "Users insert own vendas_manuais"
ON public.vendas_manuais FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own vendas_manuais"
ON public.vendas_manuais FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users delete own vendas_manuais"
ON public.vendas_manuais FOR DELETE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_vendas_manuais_updated_at
BEFORE UPDATE ON public.vendas_manuais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vendas_manuais_user_data ON public.vendas_manuais(user_id, data_venda DESC);