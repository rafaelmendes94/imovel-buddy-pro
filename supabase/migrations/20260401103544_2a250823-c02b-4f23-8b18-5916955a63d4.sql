
-- Create edificios table
CREATE TABLE public.edificios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  endereco text DEFAULT '',
  cidade text DEFAULT '',
  andares integer DEFAULT 0,
  total_unidades integer DEFAULT 0,
  construtora text DEFAULT '',
  ano_construcao text DEFAULT '',
  status text DEFAULT 'Lançamento',
  imagem_url text,
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  infraestrutura text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.edificios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own edificios" ON public.edificios FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_staff'));

CREATE POLICY "Users insert own edificios" ON public.edificios FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own edificios" ON public.edificios FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users delete own edificios" ON public.edificios FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

-- Create condominios table
CREATE TABLE public.condominios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  endereco text DEFAULT '',
  cidade text DEFAULT '',
  total_unidades integer DEFAULT 0,
  unidades_disponiveis integer DEFAULT 0,
  taxa_condominio numeric DEFAULT 0,
  amenidades text[] DEFAULT '{}',
  tipo text DEFAULT 'Vertical',
  imagem_url text,
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own condominios" ON public.condominios FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_staff'));

CREATE POLICY "Users insert own condominios" ON public.condominios FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own condominios" ON public.condominios FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users delete own condominios" ON public.condominios FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'));

-- Add FK columns to imoveis
ALTER TABLE public.imoveis ADD COLUMN edificio_id uuid REFERENCES public.edificios(id) ON DELETE SET NULL;
ALTER TABLE public.imoveis ADD COLUMN condominio_id uuid REFERENCES public.condominios(id) ON DELETE SET NULL;
