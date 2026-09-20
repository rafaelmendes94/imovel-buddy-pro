ALTER TYPE public.billing_cycle ADD VALUE IF NOT EXISTS 'semiannual';

CREATE OR REPLACE FUNCTION public.process_subscription_lifecycle()
RETURNS TABLE(action text, subscription_id uuid, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  -- Plano pago em trial vencido: abre cobrança e começa a contar o prazo de atraso.
  FOR r IN
    SELECT s.id, s.user_id
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.status = 'trial'
      AND p.is_free = false
      AND s.trial_ends_at IS NOT NULL
      AND s.trial_ends_at < now()
  LOOP
    UPDATE public.subscriptions
    SET status = 'pending_payment',
        current_period_end = COALESCE(current_period_end, trial_ends_at, now())
    WHERE id = r.id;
    RETURN QUERY SELECT 'trial_expired'::text, r.id, r.user_id;
  END LOOP;

  -- Plano ativo vencido: mantém acesso, mas mostra atraso durante 7 dias.
  FOR r IN
    SELECT s.id, s.user_id
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.status = 'active'
      AND p.is_free = false
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end < now()
  LOOP
    UPDATE public.subscriptions
    SET status = 'overdue',
        blocked_at = NULL
    WHERE id = r.id;
    RETURN QUERY SELECT 'marked_overdue'::text, r.id, r.user_id;
  END LOOP;

  -- Atraso/pagamento pendente por mais de 7 dias: bloqueia acesso.
  FOR r IN
    SELECT s.id, s.user_id
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.status IN ('pending_payment','overdue')
      AND p.is_free = false
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end + interval '7 days' < now()
  LOOP
    UPDATE public.subscriptions
    SET status = 'blocked',
        blocked_at = COALESCE(blocked_at, now())
    WHERE id = r.id;
    RETURN QUERY SELECT 'blocked_after_7d'::text, r.id, r.user_id;
  END LOOP;

  -- Bloqueado por mais de 90 dias: cancela conta por inadimplência.
  FOR r IN
    SELECT s.id, s.user_id
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.status = 'blocked'
      AND p.is_free = false
      AND s.blocked_at IS NOT NULL
      AND s.blocked_at + interval '90 days' < now()
  LOOP
    UPDATE public.subscriptions
    SET status = 'cancelled'
    WHERE id = r.id;
    RETURN QUERY SELECT 'cancelled_after_90d'::text, r.id, r.user_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_trial_subscription(_user_id uuid, _plan_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plan record;
  _profile record;
  _sub_id uuid;
  _status public.subscription_status;
  _trial_end timestamptz;
  _period_end timestamptz;
BEGIN
  IF auth.uid() <> _user_id AND NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Sem permissão para criar assinatura para este usuário';
  END IF;

  SELECT * INTO _plan FROM public.plans WHERE id = _plan_id AND is_active = true;
  IF _plan IS NULL THEN
    RAISE EXCEPTION 'Plano não encontrado ou inativo';
  END IF;

  SELECT account_type INTO _profile FROM public.profiles WHERE user_id = _user_id;
  IF _profile.account_type IS NOT NULL
     AND _plan.plan_type IS NOT NULL
     AND _plan.plan_type <> _profile.account_type
     AND _plan.plan_type <> 'ambos' THEN
    RAISE EXCEPTION 'Plano incompatível com este tipo de conta';
  END IF;

  IF _plan.is_free THEN
    _status := 'active';
    _trial_end := NULL;
    _period_end := now() + interval '100 years';
  ELSE
    _status := 'pending_payment';
    _trial_end := NULL;
    _period_end := now() + interval '1 day';
  END IF;

  SELECT id INTO _sub_id
  FROM public.subscriptions
  WHERE user_id = _user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF _sub_id IS NULL THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan_id,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end,
      blocked_at
    )
    VALUES (
      _user_id,
      _plan_id,
      _status,
      _trial_end,
      now(),
      _period_end,
      NULL
    )
    RETURNING id INTO _sub_id;
  ELSE
    UPDATE public.subscriptions
    SET
      plan_id = _plan_id,
      status = _status,
      trial_ends_at = _trial_end,
      current_period_start = now(),
      current_period_end = _period_end,
      blocked_at = NULL
    WHERE id = _sub_id;
  END IF;

  RETURN _sub_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.simulate_payment_approval(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub_id uuid;
  _plan record;
  _period_end timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Apenas super admin pode simular pagamentos';
  END IF;

  SELECT s.id, p.billing_cycle, p.is_free
  INTO _sub_id, _plan.billing_cycle, _plan.is_free
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _user_id
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF _sub_id IS NULL THEN
    RAISE EXCEPTION 'Assinatura não encontrada para este usuário';
  END IF;

  _period_end := CASE
    WHEN _plan.is_free THEN now() + interval '100 years'
    WHEN _plan.billing_cycle::text = 'annual' THEN now() + interval '365 days'
    WHEN _plan.billing_cycle::text = 'semiannual' THEN now() + interval '180 days'
    WHEN _plan.billing_cycle::text = 'quarterly' THEN now() + interval '90 days'
    ELSE now() + interval '30 days'
  END;

  UPDATE public.subscriptions
  SET status = 'active',
      current_period_start = now(),
      current_period_end = _period_end,
      blocked_at = NULL,
      trial_ends_at = NULL
  WHERE id = _sub_id;

  INSERT INTO public.subscription_payments (subscription_id, amount, status, paid_at, reference_period)
  SELECT _sub_id, p.price, 'approved', now(),
         to_char(now(), 'YYYY-MM')
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.id = _sub_id;

  RETURN _sub_id;
END;
$$;
