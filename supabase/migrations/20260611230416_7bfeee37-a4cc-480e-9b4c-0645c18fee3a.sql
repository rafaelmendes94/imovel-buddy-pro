
-- 1) Fix SECURITY DEFINER view
DROP VIEW IF EXISTS public.public_broker_profiles;
CREATE VIEW public.public_broker_profiles
  WITH (security_invoker = true) AS
  SELECT user_id, full_name, phone, avatar_url FROM public.profiles;
GRANT SELECT ON public.public_broker_profiles TO anon, authenticated;

-- 2) Remove permissive "Allow all" RLS policies; restrict to admins (service_role bypasses RLS)
DROP POLICY IF EXISTS "Allow all on subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Allow all on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all on subscriber_brokers" ON public.subscriber_brokers;

CREATE POLICY "Admins manage subscribers" ON public.subscribers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'));

CREATE POLICY "Admins manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'));

CREATE POLICY "Admins manage subscriber_brokers" ON public.subscriber_brokers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'));

-- 3) Lock down tabelas storage bucket
DROP POLICY IF EXISTS "Public insert on tabelas" ON storage.objects;
DROP POLICY IF EXISTS "Public delete on tabelas" ON storage.objects;

CREATE POLICY "Auth users insert tabelas" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tabelas');

CREATE POLICY "Owners delete tabelas" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'tabelas' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'super_admin')));

-- 4) Revoke EXECUTE on sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.create_trial_subscription(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_subscription_lifecycle() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.test_lifecycle_flow(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.simulate_payment_approval(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.simulate_subscription_status(uuid, subscription_status) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.link_broker_to_agency(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_broker_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_imovel_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_partner_featured_from_subscription() FROM PUBLIC, anon, authenticated;
