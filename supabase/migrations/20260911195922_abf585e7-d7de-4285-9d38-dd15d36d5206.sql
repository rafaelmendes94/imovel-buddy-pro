-- Catálogo compartilhado: leitura para qualquer usuário autenticado
DROP POLICY IF EXISTS "Users read own edificios" ON public.edificios;
CREATE POLICY "Authenticated read edificios catalog"
  ON public.edificios FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users read own condominios" ON public.condominios;
CREATE POLICY "Authenticated read condominios catalog"
  ON public.condominios FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users read own empreendimentos" ON public.empreendimentos;
CREATE POLICY "Authenticated read empreendimentos catalog"
  ON public.empreendimentos FOR SELECT TO authenticated USING (true);

-- Escrita: dono, super_admin ou admin_staff
DROP POLICY IF EXISTS "Users update own edificios" ON public.edificios;
CREATE POLICY "Owners update edificios" ON public.edificios FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'));

DROP POLICY IF EXISTS "Users update own condominios" ON public.condominios;
CREATE POLICY "Owners update condominios" ON public.condominios FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'));

DROP POLICY IF EXISTS "Users update own empreendimentos" ON public.empreendimentos;
CREATE POLICY "Owners update empreendimentos" ON public.empreendimentos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.edificios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.condominios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empreendimentos TO authenticated;
GRANT ALL ON public.edificios TO service_role;
GRANT ALL ON public.condominios TO service_role;
GRANT ALL ON public.empreendimentos TO service_role;