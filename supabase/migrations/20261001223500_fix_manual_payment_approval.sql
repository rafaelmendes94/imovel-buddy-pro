CREATE OR REPLACE FUNCTION public.simulate_payment_approval(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub_id uuid;
  _billing_cycle text;
  _is_free boolean;
  _period_end timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Apenas super admin pode simular pagamentos';
  END IF;

  SELECT s.id, p.billing_cycle::text, p.is_free
  INTO _sub_id, _billing_cycle, _is_free
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _user_id
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF _sub_id IS NULL THEN
    RAISE EXCEPTION 'Assinatura não encontrada para este usuário';
  END IF;

  _period_end := CASE
    WHEN _is_free THEN now() + interval '100 years'
    WHEN _billing_cycle = 'annual' THEN now() + interval '365 days'
    WHEN _billing_cycle = 'semiannual' THEN now() + interval '180 days'
    WHEN _billing_cycle = 'quarterly' THEN now() + interval '90 days'
    ELSE now() + interval '30 days'
  END;

  UPDATE public.subscriptions
  SET status = 'active',
      current_period_start = now(),
      current_period_end = _period_end,
      blocked_at = NULL,
      trial_ends_at = NULL
  WHERE id = _sub_id;

  INSERT INTO public.subscription_payments (
    subscription_id,
    amount,
    status,
    paid_at,
    reference_period
  )
  SELECT _sub_id, p.price, 'approved', now(), to_char(now(), 'YYYY-MM')
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.id = _sub_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.subscription_payments sp
      WHERE sp.subscription_id = _sub_id
        AND sp.status = 'approved'
        AND sp.reference_period = to_char(now(), 'YYYY-MM')
    );

  UPDATE public.profiles
  SET approval_status = 'approved',
      approved_at = now(),
      approved_by = auth.uid(),
      rejection_reason = NULL
  WHERE user_id = _user_id;

  RETURN _sub_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.simulate_payment_approval(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.simulate_payment_approval(uuid) TO authenticated, service_role;
