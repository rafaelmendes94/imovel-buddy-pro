
CREATE TABLE public.construtoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text DEFAULT '',
  logo_url text,
  cover_url text,
  perfil_url text,
  cidade text DEFAULT '',
  estado text DEFAULT '',
  telefone text DEFAULT '',
  email text DEFAULT '',
  website text DEFAULT '',
  instagram text DEFAULT '',
  whatsapp text DEFAULT '',
  cnpj text DEFAULT '',
  ano_fundacao text DEFAULT '',
  cor_primaria text DEFAULT '#1e3a5f',
  cor_secundaria text DEFAULT '#2563eb',
  cor_texto text DEFAULT '#ffffff',
  cor_fundo text DEFAULT '#111827',
  avaliacao numeric DEFAULT 0,
  total_avaliacoes integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.construtoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own construtoras" ON public.construtoras
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_staff'));

CREATE POLICY "Users insert own construtoras" ON public.construtoras
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own construtoras" ON public.construtoras
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users delete own construtoras" ON public.construtoras
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

-- Empreendimentos da construtora
CREATE TABLE public.construtora_empreendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  construtora_id uuid NOT NULL REFERENCES public.construtoras(id) ON DELETE CASCADE,
  nome text NOT NULL,
  endereco text DEFAULT '',
  cidade text DEFAULT '',
  status text NOT NULL DEFAULT 'Lançamento',
  tipo text DEFAULT 'Residencial',
  total_unidades integer DEFAULT 0,
  unidades_vendidas integer DEFAULT 0,
  previsao_entrega text DEFAULT '',
  imagem_url text,
  descricao text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.construtora_empreendimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read empreendimentos via construtora" ON public.construtora_empreendimentos
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.construtoras c WHERE c.id = construtora_id AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_staff'))));

CREATE POLICY "Insert empreendimentos via construtora" ON public.construtora_empreendimentos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.construtoras c WHERE c.id = construtora_id AND c.user_id = auth.uid()));

CREATE POLICY "Update empreendimentos via construtora" ON public.construtora_empreendimentos
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.construtoras c WHERE c.id = construtora_id AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'))));

CREATE POLICY "Delete empreendimentos via construtora" ON public.construtora_empreendimentos
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.construtoras c WHERE c.id = construtora_id AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'))));

-- Unidades do espelho de vendas
CREATE TABLE public.construtora_unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL REFERENCES public.construtora_empreendimentos(id) ON DELETE CASCADE,
  numero text NOT NULL,
  andar text DEFAULT '',
  tipo text DEFAULT 'Apartamento',
  area numeric DEFAULT 0,
  quartos integer DEFAULT 0,
  preco numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'Disponível',
  observacao text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.construtora_unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read unidades via empreendimento" ON public.construtora_unidades
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.construtora_empreendimentos e
    JOIN public.construtoras c ON c.id = e.construtora_id
    WHERE e.id = empreendimento_id AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_staff'))
  ));

CREATE POLICY "Insert unidades via empreendimento" ON public.construtora_unidades
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.construtora_empreendimentos e
    JOIN public.construtoras c ON c.id = e.construtora_id
    WHERE e.id = empreendimento_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Update unidades via empreendimento" ON public.construtora_unidades
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.construtora_empreendimentos e
    JOIN public.construtoras c ON c.id = e.construtora_id
    WHERE e.id = empreendimento_id AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'))
  ));

CREATE POLICY "Delete unidades via empreendimento" ON public.construtora_unidades
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.construtora_empreendimentos e
    JOIN public.construtoras c ON c.id = e.construtora_id
    WHERE e.id = empreendimento_id AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'))
  ));
