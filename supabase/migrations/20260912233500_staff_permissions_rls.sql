CREATE OR REPLACE FUNCTION public.has_staff_permission(_user_id uuid, _module text, _action text DEFAULT 'view')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'super_admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.staff_permissions sp
      WHERE sp.user_id = _user_id
        AND public.has_role(_user_id, 'admin_staff'::public.app_role)
        AND COALESCE(((sp.permissions -> _module ->> _action)::boolean), false)
    );
$$;

DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
CREATE POLICY "Finance staff read payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.has_staff_permission(auth.uid(), 'financeiro', 'view'));
CREATE POLICY "Finance staff create payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission(auth.uid(), 'financeiro', 'create'));
CREATE POLICY "Finance staff update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.has_staff_permission(auth.uid(), 'financeiro', 'edit'))
  WITH CHECK (public.has_staff_permission(auth.uid(), 'financeiro', 'edit'));
CREATE POLICY "Finance staff delete payments" ON public.payments
  FOR DELETE TO authenticated
  USING (public.has_staff_permission(auth.uid(), 'financeiro', 'delete'));

DROP POLICY IF EXISTS "Admins manage subscribers" ON public.subscribers;
CREATE POLICY "Finance staff read subscribers" ON public.subscribers
  FOR SELECT TO authenticated
  USING (
    public.has_staff_permission(auth.uid(), 'financeiro', 'view')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'view')
  );
CREATE POLICY "Finance staff create subscribers" ON public.subscribers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_staff_permission(auth.uid(), 'financeiro', 'create')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'create')
  );
CREATE POLICY "Finance staff update subscribers" ON public.subscribers
  FOR UPDATE TO authenticated
  USING (
    public.has_staff_permission(auth.uid(), 'financeiro', 'edit')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'edit')
  )
  WITH CHECK (
    public.has_staff_permission(auth.uid(), 'financeiro', 'edit')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'edit')
  );
CREATE POLICY "Finance staff delete subscribers" ON public.subscribers
  FOR DELETE TO authenticated
  USING (
    public.has_staff_permission(auth.uid(), 'financeiro', 'delete')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'delete')
  );

DROP POLICY IF EXISTS "Admins manage subscriber_brokers" ON public.subscriber_brokers;
CREATE POLICY "Finance staff read subscriber_brokers" ON public.subscriber_brokers
  FOR SELECT TO authenticated
  USING (
    public.has_staff_permission(auth.uid(), 'financeiro', 'view')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'view')
  );
CREATE POLICY "Finance staff create subscriber_brokers" ON public.subscriber_brokers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_staff_permission(auth.uid(), 'financeiro', 'create')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'create')
  );
CREATE POLICY "Finance staff update subscriber_brokers" ON public.subscriber_brokers
  FOR UPDATE TO authenticated
  USING (
    public.has_staff_permission(auth.uid(), 'financeiro', 'edit')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'edit')
  )
  WITH CHECK (
    public.has_staff_permission(auth.uid(), 'financeiro', 'edit')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'edit')
  );
CREATE POLICY "Finance staff delete subscriber_brokers" ON public.subscriber_brokers
  FOR DELETE TO authenticated
  USING (
    public.has_staff_permission(auth.uid(), 'financeiro', 'delete')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'delete')
  );

DROP POLICY IF EXISTS "Admins read financial logs" ON public.financial_activity_logs;
DROP POLICY IF EXISTS "Admins write financial logs" ON public.financial_activity_logs;
CREATE POLICY "Finance staff read financial logs" ON public.financial_activity_logs
  FOR SELECT TO authenticated
  USING (public.has_staff_permission(auth.uid(), 'financeiro', 'view'));
CREATE POLICY "Finance staff write financial logs" ON public.financial_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission(auth.uid(), 'financeiro', 'create'));

DROP POLICY IF EXISTS "Imoveis owner all" ON public.imoveis;
CREATE POLICY "Imoveis owner read" ON public.imoveis
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'imoveis', 'view')
  );
CREATE POLICY "Imoveis owner create" ON public.imoveis
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'imoveis', 'create')
  );
CREATE POLICY "Imoveis owner update" ON public.imoveis
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'imoveis', 'edit')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'imoveis', 'edit')
  );
CREATE POLICY "Imoveis owner delete" ON public.imoveis
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'imoveis', 'delete')
  );

DROP POLICY IF EXISTS "Owners update edificios" ON public.edificios;
CREATE POLICY "Owners update edificios" ON public.edificios
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'edit')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'edit')
  );

DROP POLICY IF EXISTS "Owners update condominios" ON public.condominios;
CREATE POLICY "Owners update condominios" ON public.condominios
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'condominios', 'edit')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'condominios', 'edit')
  );

DROP POLICY IF EXISTS "Owners update empreendimentos" ON public.empreendimentos;
CREATE POLICY "Owners update empreendimentos" ON public.empreendimentos
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'edit')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'edit')
  );

DROP POLICY IF EXISTS "Admin manages site config" ON public.site_config;
CREATE POLICY "Admin reads site config" ON public.site_config
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'site_editor', 'view')
  );
CREATE POLICY "Admin creates site config" ON public.site_config
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'site_editor', 'create')
  );
CREATE POLICY "Admin updates site config" ON public.site_config
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'site_editor', 'edit')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'site_editor', 'edit')
  );
CREATE POLICY "Admin deletes site config" ON public.site_config
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'site_editor', 'delete')
  );
