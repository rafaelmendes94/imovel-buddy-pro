-- Create the helper function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Table
CREATE TABLE public.implantacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empreendimento_id uuid NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  imagem_capa_url text NOT NULL DEFAULT '',
  mapa_url text NOT NULL DEFAULT '',
  tipo_arquivo text NOT NULL DEFAULT 'imagem',
  descricao text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.implantacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own implantacoes" ON public.implantacoes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_staff'));

CREATE POLICY "Users insert own implantacoes" ON public.implantacoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own implantacoes" ON public.implantacoes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Users delete own implantacoes" ON public.implantacoes
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER update_implantacoes_updated_at
  BEFORE UPDATE ON public.implantacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('implantacoes','implantacoes',true);

CREATE POLICY "Auth users upload implantacoes" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'implantacoes');
CREATE POLICY "Anyone reads implantacoes" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'implantacoes');
CREATE POLICY "Auth users delete implantacoes" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'implantacoes');
