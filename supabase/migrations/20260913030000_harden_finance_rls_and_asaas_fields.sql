ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text;

ALTER TABLE public.subscription_payments
  ADD COLUMN IF NOT EXISTS asaas_payment_id text;

UPDATE public.subscriptions
SET mercado_pago_subscription_id = NULL
WHERE asaas_subscription_id IS NOT NULL
  AND mercado_pago_subscription_id = asaas_subscription_id;

UPDATE public.subscription_payments
SET mercado_pago_payment_id = NULL
WHERE asaas_payment_id IS NOT NULL
  AND mercado_pago_payment_id = asaas_payment_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_asaas_subscription_id
  ON public.subscriptions (asaas_subscription_id)
  WHERE asaas_subscription_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_payments_asaas_payment_id
  ON public.subscription_payments (asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;

REVOKE ALL ON public.billing_customers FROM anon;
REVOKE ALL ON public.financial_activity_logs FROM anon;
REVOKE ALL ON public.payments FROM anon;
REVOKE ALL ON public.staff_permissions FROM anon;
REVOKE ALL ON public.subscriber_brokers FROM anon;
REVOKE ALL ON public.subscribers FROM anon;
REVOKE ALL ON public.subscription_payments FROM anon;
REVOKE ALL ON public.subscriptions FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

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

DROP POLICY IF EXISTS "Allow all on subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Allow all on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all on subscriber_brokers" ON public.subscriber_brokers;
DROP POLICY IF EXISTS "Admins manage subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
DROP POLICY IF EXISTS "Admins manage subscriber_brokers" ON public.subscriber_brokers;
DROP POLICY IF EXISTS "Admins read financial logs" ON public.financial_activity_logs;
DROP POLICY IF EXISTS "Admins write financial logs" ON public.financial_activity_logs;
DROP POLICY IF EXISTS "Finance staff read payments" ON public.payments;
DROP POLICY IF EXISTS "Finance staff create payments" ON public.payments;
DROP POLICY IF EXISTS "Finance staff update payments" ON public.payments;
DROP POLICY IF EXISTS "Finance staff delete payments" ON public.payments;
DROP POLICY IF EXISTS "Finance staff read subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Finance staff create subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Finance staff update subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Finance staff delete subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Finance staff read subscriber_brokers" ON public.subscriber_brokers;
DROP POLICY IF EXISTS "Finance staff create subscriber_brokers" ON public.subscriber_brokers;
DROP POLICY IF EXISTS "Finance staff update subscriber_brokers" ON public.subscriber_brokers;
DROP POLICY IF EXISTS "Finance staff delete subscriber_brokers" ON public.subscriber_brokers;
DROP POLICY IF EXISTS "Finance staff read financial logs" ON public.financial_activity_logs;
DROP POLICY IF EXISTS "Finance staff write financial logs" ON public.financial_activity_logs;
DROP POLICY IF EXISTS "System inserts subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "System inserts payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Users insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Owners insert own subscription payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Finance staff read subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Finance staff create subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Finance staff update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Finance staff read subscription payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Finance staff create subscription payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Finance staff update subscription payments" ON public.subscription_payments;

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

CREATE POLICY "Finance staff read financial logs" ON public.financial_activity_logs
  FOR SELECT TO authenticated
  USING (public.has_staff_permission(auth.uid(), 'financeiro', 'view'));

CREATE POLICY "Finance staff write financial logs" ON public.financial_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission(auth.uid(), 'financeiro', 'create'));

CREATE POLICY "Finance staff read subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    public.has_staff_permission(auth.uid(), 'financeiro', 'view')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'view')
  );

CREATE POLICY "Finance staff create subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_staff_permission(auth.uid(), 'financeiro', 'create')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'create')
  );

CREATE POLICY "Finance staff update subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (
    public.has_staff_permission(auth.uid(), 'financeiro', 'edit')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'edit')
  )
  WITH CHECK (
    public.has_staff_permission(auth.uid(), 'financeiro', 'edit')
    OR public.has_staff_permission(auth.uid(), 'clientes', 'edit')
  );

CREATE POLICY "Finance staff read subscription payments" ON public.subscription_payments
  FOR SELECT TO authenticated
  USING (
    public.has_staff_permission(auth.uid(), 'financeiro', 'view')
    OR EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.id = subscription_payments.subscription_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Finance staff create subscription payments" ON public.subscription_payments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission(auth.uid(), 'financeiro', 'create'));

CREATE POLICY "Finance staff update subscription payments" ON public.subscription_payments
  FOR UPDATE TO authenticated
  USING (public.has_staff_permission(auth.uid(), 'financeiro', 'edit'))
  WITH CHECK (public.has_staff_permission(auth.uid(), 'financeiro', 'edit'));
