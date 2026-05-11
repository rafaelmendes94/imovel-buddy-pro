
CREATE POLICY "Authenticated reads active site properties"
ON public.imoveis
FOR SELECT
TO authenticated
USING (
  ativo_site = true
  AND (
    has_role(user_id, 'super_admin'::app_role)
    OR has_role(user_id, 'admin_staff'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = COALESCE(
        (SELECT pr.agency_id FROM public.profiles pr WHERE pr.user_id = imoveis.user_id),
        imoveis.user_id
      )
      AND (
        s.status = 'active'::subscription_status
        OR (s.status = 'trial'::subscription_status AND (s.trial_ends_at IS NULL OR s.trial_ends_at > now()))
      )
    )
  )
);
