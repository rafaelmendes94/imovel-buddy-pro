CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id),
  CONSTRAINT system_settings_key_key UNIQUE (key)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin manages system_settings" ON public.system_settings;
CREATE POLICY "Super admin manages system_settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

GRANT SELECT ON public.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

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
    _period_end := NULL;
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
