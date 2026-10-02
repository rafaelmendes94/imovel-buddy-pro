-- Construtoras are a shared catalog maintained by the super admin or authorized staff.
-- Brokers and public pages may read active entries, but cannot mutate the catalog.

GRANT SELECT ON public.construtoras, public.construtora_empreendimentos, public.construtora_unidades TO anon, authenticated;

DROP POLICY IF EXISTS "Users read own construtoras" ON public.construtoras;
DROP POLICY IF EXISTS "Users insert own construtoras" ON public.construtoras;
DROP POLICY IF EXISTS "Users update own construtoras" ON public.construtoras;
DROP POLICY IF EXISTS "Users delete own construtoras" ON public.construtoras;

CREATE POLICY "Read active construtoras" ON public.construtoras
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'view')
  );

CREATE POLICY "Authorized staff insert construtoras" ON public.construtoras
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'create')
  );

CREATE POLICY "Authorized staff update construtoras" ON public.construtoras
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'edit')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'edit')
  );

CREATE POLICY "Authorized staff delete construtoras" ON public.construtoras
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'delete')
  );

DROP POLICY IF EXISTS "Read empreendimentos via construtora" ON public.construtora_empreendimentos;
DROP POLICY IF EXISTS "Insert empreendimentos via construtora" ON public.construtora_empreendimentos;
DROP POLICY IF EXISTS "Update empreendimentos via construtora" ON public.construtora_empreendimentos;
DROP POLICY IF EXISTS "Delete empreendimentos via construtora" ON public.construtora_empreendimentos;

CREATE POLICY "Read shared construtora empreendimentos" ON public.construtora_empreendimentos
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.construtoras c
    WHERE c.id = construtora_id AND (
      c.status = 'active'
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
      OR public.has_staff_permission(auth.uid(), 'edificios', 'view')
    )
  ));

CREATE POLICY "Authorized staff insert construtora empreendimentos" ON public.construtora_empreendimentos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'create')
  );

CREATE POLICY "Authorized staff update construtora empreendimentos" ON public.construtora_empreendimentos
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'edit')
  );

CREATE POLICY "Authorized staff delete construtora empreendimentos" ON public.construtora_empreendimentos
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'delete')
  );

DROP POLICY IF EXISTS "Read unidades via empreendimento" ON public.construtora_unidades;
DROP POLICY IF EXISTS "Insert unidades via empreendimento" ON public.construtora_unidades;
DROP POLICY IF EXISTS "Update unidades via empreendimento" ON public.construtora_unidades;
DROP POLICY IF EXISTS "Delete unidades via empreendimento" ON public.construtora_unidades;

CREATE POLICY "Read shared construtora unidades" ON public.construtora_unidades
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.construtora_empreendimentos e
    JOIN public.construtoras c ON c.id = e.construtora_id
    WHERE e.id = empreendimento_id AND (
      c.status = 'active'
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
      OR public.has_staff_permission(auth.uid(), 'edificios', 'view')
    )
  ));

CREATE POLICY "Authorized staff insert construtora unidades" ON public.construtora_unidades
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'create')
  );

CREATE POLICY "Authorized staff update construtora unidades" ON public.construtora_unidades
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'edit')
  );

CREATE POLICY "Authorized staff delete construtora unidades" ON public.construtora_unidades
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_staff_permission(auth.uid(), 'edificios', 'delete')
  );
