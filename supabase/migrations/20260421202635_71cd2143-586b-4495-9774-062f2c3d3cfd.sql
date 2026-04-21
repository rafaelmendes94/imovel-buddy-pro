-- Função temporária de teste (Super Admin only) para validar o ciclo de vida completo
CREATE OR REPLACE FUNCTION public.test_lifecycle_flow(_subscription_id uuid)
RETURNS TABLE(etapa text, status_resultado text, blocked_at_resultado timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _original_status subscription_status;
  _original_trial timestamptz;
  _original_period_end timestamptz;
  _original_blocked timestamptz;
  _new_status subscription_status;
  _new_blocked timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Apenas super admin pode executar testes';
  END IF;

  -- Snapshot
  SELECT status, trial_ends_at, current_period_end, blocked_at
  INTO _original_status, _original_trial, _original_period_end, _original_blocked
  FROM subscriptions WHERE id = _subscription_id;

  -- Cenário 1: trial expirado → pending_payment
  UPDATE subscriptions SET status='trial', trial_ends_at=now()-interval '1 day',
    current_period_end=now()-interval '1 day', blocked_at=NULL
  WHERE id=_subscription_id;
  PERFORM process_subscription_lifecycle();
  SELECT status INTO _new_status FROM subscriptions WHERE id=_subscription_id;
  RETURN QUERY SELECT '1_trial_expirado'::text, _new_status::text, NULL::timestamptz;

  -- Cenário 2: pending_payment +7d → blocked
  UPDATE subscriptions SET current_period_end=now()-interval '8 days' WHERE id=_subscription_id;
  PERFORM process_subscription_lifecycle();
  SELECT status, blocked_at INTO _new_status, _new_blocked FROM subscriptions WHERE id=_subscription_id;
  RETURN QUERY SELECT '2_blocked_apos_7d'::text, _new_status::text, _new_blocked;

  -- Cenário 3: blocked +60d → cancelled
  UPDATE subscriptions SET blocked_at=now()-interval '61 days' WHERE id=_subscription_id;
  PERFORM process_subscription_lifecycle();
  SELECT status INTO _new_status FROM subscriptions WHERE id=_subscription_id;
  RETURN QUERY SELECT '3_cancelled_apos_60d'::text, _new_status::text, NULL::timestamptz;

  -- Restaura estado original
  UPDATE subscriptions SET status=_original_status, trial_ends_at=_original_trial,
    current_period_end=_original_period_end, blocked_at=_original_blocked
  WHERE id=_subscription_id;
  RETURN QUERY SELECT '4_restaurado'::text, _original_status::text, _original_blocked;
END;
$$;