-- ============================================================
-- 1. Função: ciclo de vida das assinaturas (executada por cron)
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_subscription_lifecycle()
RETURNS TABLE(action text, subscription_id uuid, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  -- 1) Trial expirado de plano PAGO → pending_payment
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
    SET status = 'pending_payment'
    WHERE id = r.id;
    RETURN QUERY SELECT 'trial_expired'::text, r.id, r.user_id;
  END LOOP;

  -- 2) pending_payment / overdue há +7 dias do vencimento → blocked
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
    SET status = 'blocked', blocked_at = now()
    WHERE id = r.id;
    RETURN QUERY SELECT 'blocked_after_7d'::text, r.id, r.user_id;
  END LOOP;

  -- 3) Bloqueado há +60 dias → cancelled
  FOR r IN
    SELECT s.id, s.user_id
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.status = 'blocked'
      AND p.is_free = false
      AND s.blocked_at IS NOT NULL
      AND s.blocked_at + interval '60 days' < now()
  LOOP
    UPDATE public.subscriptions
    SET status = 'cancelled'
    WHERE id = r.id;
    RETURN QUERY SELECT 'cancelled_after_60d'::text, r.id, r.user_id;
  END LOOP;
END;
$$;

-- ============================================================
-- 2. Atualiza RLS pública de imóveis: dono precisa ter sub válida
-- ============================================================
DROP POLICY IF EXISTS "Public reads active properties" ON public.imoveis;

CREATE POLICY "Public reads active properties"
ON public.imoveis
FOR SELECT
TO anon
USING (
  ativo_site = true
  AND EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.user_id = COALESCE(
            (SELECT pr.agency_id FROM public.profiles pr WHERE pr.user_id = imoveis.user_id),
            imoveis.user_id
          )
      AND (
        s.status = 'active'
        OR (s.status = 'trial' AND (s.trial_ends_at IS NULL OR s.trial_ends_at > now()))
      )
  )
);

-- ============================================================
-- 3. Funções de simulação para Super Admin (sem Asaas)
-- ============================================================
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
    WHEN _plan.billing_cycle = 'annual' THEN now() + interval '365 days'
    WHEN _plan.billing_cycle = 'quarterly' THEN now() + interval '90 days'
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

CREATE OR REPLACE FUNCTION public.simulate_subscription_status(
  _user_id uuid,
  _new_status public.subscription_status
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Apenas super admin pode simular status';
  END IF;

  SELECT id INTO _sub_id
  FROM public.subscriptions
  WHERE user_id = _user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF _sub_id IS NULL THEN
    RAISE EXCEPTION 'Assinatura não encontrada';
  END IF;

  UPDATE public.subscriptions
  SET status = _new_status,
      blocked_at = CASE WHEN _new_status = 'blocked' THEN now() ELSE blocked_at END
  WHERE id = _sub_id;

  RETURN _sub_id;
END;
$$;

-- ============================================================
-- 4. Cron diário (pg_cron) — roda às 03:00 UTC todos os dias
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'subscription-lifecycle-daily') THEN
    PERFORM cron.unschedule('subscription-lifecycle-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'subscription-lifecycle-daily',
  '0 3 * * *',
  $$ SELECT public.process_subscription_lifecycle(); $$
);