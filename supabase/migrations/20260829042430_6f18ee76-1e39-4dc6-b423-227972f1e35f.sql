CREATE TABLE public.tabela_apresentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  titulo TEXT NOT NULL DEFAULT 'EXCLUSIVIDADE DE IMÓVEIS',
  subtitulo TEXT,
  template TEXT NOT NULL DEFAULT 'classico',
  formato TEXT NOT NULL DEFAULT 'a4-landscape',
  property_ids UUID[] NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tabela_apresentacoes TO authenticated;
GRANT ALL ON public.tabela_apresentacoes TO service_role;

ALTER TABLE public.tabela_apresentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tabela_apresentacoes"
ON public.tabela_apresentacoes FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_tabela_apresentacoes_updated_at
BEFORE UPDATE ON public.tabela_apresentacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();