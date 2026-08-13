DROP POLICY IF EXISTS "Anyone can view active corretores" ON public.corretores;

CREATE POLICY "Visitors can view active corretores"
ON public.corretores FOR SELECT TO anon
USING (ativo = true);