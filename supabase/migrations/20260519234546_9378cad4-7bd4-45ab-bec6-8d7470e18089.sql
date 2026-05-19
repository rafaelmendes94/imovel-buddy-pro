
CREATE OR REPLACE FUNCTION public.imovel_owner_has_active_sub(_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = COALESCE(
      (SELECT pr.agency_id FROM public.profiles pr WHERE pr.user_id = _owner),
      _owner
    )
    AND (
      s.status = 'active'
      OR (s.status = 'trial' AND (s.trial_ends_at IS NULL OR s.trial_ends_at > now()))
    )
  );
$$;

DROP POLICY IF EXISTS "Public reads active properties" ON public.imoveis;
DROP POLICY IF EXISTS "Authenticated reads active site properties" ON public.imoveis;

CREATE POLICY "Public reads active properties"
ON public.imoveis FOR SELECT TO anon
USING (
  ativo_site = true AND (
    has_role(user_id, 'super_admin'::app_role)
    OR has_role(user_id, 'admin_staff'::app_role)
    OR public.imovel_owner_has_active_sub(user_id)
  )
);

CREATE POLICY "Authenticated reads active site properties"
ON public.imoveis FOR SELECT TO authenticated
USING (
  ativo_site = true AND (
    has_role(user_id, 'super_admin'::app_role)
    OR has_role(user_id, 'admin_staff'::app_role)
    OR public.imovel_owner_has_active_sub(user_id)
  )
);
