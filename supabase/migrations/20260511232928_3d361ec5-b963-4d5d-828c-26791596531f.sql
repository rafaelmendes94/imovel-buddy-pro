
CREATE POLICY "Authenticated users can view all edificios"
ON public.edificios FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all condominios"
ON public.condominios FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all empreendimentos"
ON public.empreendimentos FOR SELECT
TO authenticated
USING (true);
