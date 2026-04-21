DROP POLICY IF EXISTS "Public reads active properties" ON public.imoveis;

CREATE POLICY "Public reads active properties"
ON public.imoveis
FOR SELECT
TO anon
USING (
  ativo_site = true
  AND (
    -- Super admin / staff: sempre visível, não exige assinatura
    public.has_role(user_id, 'super_admin')
    OR public.has_role(user_id, 'admin_staff')
    -- Brokers/Imobiliárias: só com assinatura ativa ou trial válido
    OR EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.user_id = COALESCE(
        (SELECT pr.agency_id FROM public.profiles pr WHERE pr.user_id = imoveis.user_id),
        imoveis.user_id
      )
      AND (
        s.status = 'active'
        OR (s.status = 'trial' AND (s.trial_ends_at IS NULL OR s.trial_ends_at > now()))
      )
    )
  )
);