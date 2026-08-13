CREATE TABLE public.corretores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  email text,
  telefone text,
  creci text,
  foto_url text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.corretores TO authenticated;
GRANT SELECT ON public.corretores TO anon;
GRANT ALL ON public.corretores TO service_role;

ALTER TABLE public.corretores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their corretores"
ON public.corretores FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view active corretores"
ON public.corretores FOR SELECT TO anon, authenticated
USING (ativo = true);

CREATE TRIGGER update_corretores_updated_at
BEFORE UPDATE ON public.corretores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_corretores_user_id ON public.corretores(user_id);

ALTER TABLE public.imoveis
  ADD COLUMN corretor_cadastro_id uuid REFERENCES public.corretores(id) ON DELETE SET NULL;