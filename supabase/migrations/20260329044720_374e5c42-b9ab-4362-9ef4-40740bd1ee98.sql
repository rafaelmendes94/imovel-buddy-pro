
-- Drop overly permissive policy on site_config
DROP POLICY "Auth users manage own config" ON public.site_config;

-- Super admins and admin staff can manage main_site config
CREATE POLICY "Admin manages site config" ON public.site_config
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_staff')
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_staff')
  );

-- Brokers can manage their own page config
CREATE POLICY "Brokers manage own page config" ON public.site_config
  FOR ALL TO authenticated
  USING (
    config_type IN ('broker_page', 'partner_page') AND owner_id = auth.uid()::text
  )
  WITH CHECK (
    config_type IN ('broker_page', 'partner_page') AND owner_id = auth.uid()::text
  );
