
-- Criar tabela empreendimentos
CREATE TABLE public.empreendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  endereco text DEFAULT '',
  cidade text DEFAULT '',
  construtora text DEFAULT '',
  status text DEFAULT 'Lançamento',
  tipo text DEFAULT 'Residencial',
  total_unidades integer DEFAULT 0,
  previsao_entrega text DEFAULT '',
  imagem_url text,
  descricao text DEFAULT '',
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  infraestrutura text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own empreendimentos" ON public.empreendimentos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_staff'));

CREATE POLICY "Users insert own empreendimentos" ON public.empreendimentos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own empreendimentos" ON public.empreendimentos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users delete own empreendimentos" ON public.empreendimentos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

-- Adicionar empreendimento_id na tabela imoveis
ALTER TABLE public.imoveis
  ADD COLUMN empreendimento_id uuid REFERENCES public.empreendimentos(id);
