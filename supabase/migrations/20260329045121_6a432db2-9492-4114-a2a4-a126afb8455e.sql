
CREATE TABLE public.imoveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  endereco text NOT NULL DEFAULT '',
  cidade text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT '',
  preco numeric NOT NULL DEFAULT 0,
  quartos integer NOT NULL DEFAULT 0,
  banheiros integer NOT NULL DEFAULT 0,
  area numeric NOT NULL DEFAULT 0,
  descricao text DEFAULT '',
  status text NOT NULL DEFAULT 'Disponível',
  imagens text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

-- Users can read their own properties
CREATE POLICY "Users read own imoveis" ON public.imoveis
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_staff'));

-- Users can insert their own properties
CREATE POLICY "Users insert own imoveis" ON public.imoveis
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own properties
CREATE POLICY "Users update own imoveis" ON public.imoveis
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

-- Users can delete their own properties
CREATE POLICY "Users delete own imoveis" ON public.imoveis
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));
