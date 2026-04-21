
-- 1) plans.is_free
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;

-- 2) profiles.agency_id + account_type
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_id uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'corretor';
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON public.profiles(agency_id);

-- 3) Add pending_payment to subscription_status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_payment'
                 AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')) THEN
    ALTER TYPE public.subscription_status ADD VALUE 'pending_payment';
  END IF;
END $$;

-- 4) Update handle_new_user to capture account_type from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'corretor')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'broker');

  RETURN NEW;
END;
$function$;

-- 5) get_effective_subscription
CREATE OR REPLACE FUNCTION public.get_effective_subscription(_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  plan_id uuid,
  status public.subscription_status,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  blocked_at timestamptz,
  effective_owner uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner uuid;
BEGIN
  SELECT COALESCE(p.agency_id, _user_id) INTO _owner
  FROM public.profiles p
  WHERE p.user_id = _user_id;

  IF _owner IS NULL THEN
    _owner := _user_id;
  END IF;

  RETURN QUERY
  SELECT s.id, s.user_id, s.plan_id, s.status, s.trial_ends_at,
         s.current_period_start, s.current_period_end, s.blocked_at, _owner
  FROM public.subscriptions s
  WHERE s.user_id = _owner
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- 6) count_imoveis_in_subscription
CREATE OR REPLACE FUNCTION public.count_imoveis_in_subscription(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner uuid;
  _total integer;
BEGIN
  SELECT COALESCE(p.agency_id, _user_id) INTO _owner
  FROM public.profiles p
  WHERE p.user_id = _user_id;

  IF _owner IS NULL THEN _owner := _user_id; END IF;

  SELECT COUNT(*)::int INTO _total
  FROM public.imoveis i
  WHERE i.user_id = _owner
     OR i.user_id IN (SELECT pp.user_id FROM public.profiles pp WHERE pp.agency_id = _owner);

  RETURN COALESCE(_total, 0);
END;
$$;

-- 7) create_trial_subscription
CREATE OR REPLACE FUNCTION public.create_trial_subscription(_user_id uuid, _plan_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plan record;
  _sub_id uuid;
  _status public.subscription_status;
  _trial_end timestamptz;
  _period_end timestamptz;
BEGIN
  SELECT * INTO _plan FROM public.plans WHERE id = _plan_id AND is_active = true;
  IF _plan IS NULL THEN
    RAISE EXCEPTION 'Plano não encontrado ou inativo';
  END IF;

  IF _plan.is_free THEN
    _status := 'active';
    _trial_end := NULL;
    _period_end := now() + interval '100 years';
  ELSE
    _status := 'trial';
    _trial_end := now() + (_plan.trial_days || ' days')::interval;
    _period_end := _trial_end;
  END IF;

  INSERT INTO public.subscriptions (user_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
  VALUES (_user_id, _plan_id, _status, _trial_end, now(), _period_end)
  RETURNING id INTO _sub_id;

  RETURN _sub_id;
END;
$$;

-- 8) link_broker_to_agency
CREATE OR REPLACE FUNCTION public.link_broker_to_agency(_broker_email text, _agency_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _broker_user_id uuid;
BEGIN
  IF auth.uid() <> _agency_user_id AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT user_id INTO _broker_user_id
  FROM public.profiles
  WHERE LOWER(email) = LOWER(_broker_email)
  LIMIT 1;

  IF _broker_user_id IS NULL THEN
    RAISE EXCEPTION 'Corretor com este e-mail não encontrado. Peça que ele crie a conta primeiro.';
  END IF;

  IF _broker_user_id = _agency_user_id THEN
    RAISE EXCEPTION 'A imobiliária não pode vincular a si mesma';
  END IF;

  UPDATE public.profiles
  SET agency_id = _agency_user_id
  WHERE user_id = _broker_user_id;

  RETURN _broker_user_id;
END;
$$;

-- 9) Trigger: enforce_imovel_limit
CREATE OR REPLACE FUNCTION public.enforce_imovel_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner uuid;
  _max int;
  _current int;
BEGIN
  IF public.has_role(NEW.user_id, 'super_admin') OR public.has_role(NEW.user_id, 'admin_staff') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(p.agency_id, NEW.user_id) INTO _owner
  FROM public.profiles p WHERE p.user_id = NEW.user_id;
  IF _owner IS NULL THEN _owner := NEW.user_id; END IF;

  SELECT pl.max_properties INTO _max
  FROM public.subscriptions s
  JOIN public.plans pl ON pl.id = s.plan_id
  WHERE s.user_id = _owner
    AND s.status IN ('active','trial')
  ORDER BY s.created_at DESC LIMIT 1;

  IF _max IS NULL THEN
    RAISE EXCEPTION 'Sem assinatura ativa. Escolha um plano para cadastrar imóveis.';
  END IF;

  SELECT COUNT(*)::int INTO _current
  FROM public.imoveis i
  WHERE i.user_id = _owner
     OR i.user_id IN (SELECT pp.user_id FROM public.profiles pp WHERE pp.agency_id = _owner);

  IF _current >= _max THEN
    RAISE EXCEPTION 'Limite de % imóveis do seu plano atingido. Faça upgrade para cadastrar mais.', _max;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_imovel_limit ON public.imoveis;
CREATE TRIGGER trg_enforce_imovel_limit
BEFORE INSERT ON public.imoveis
FOR EACH ROW EXECUTE FUNCTION public.enforce_imovel_limit();

-- 10) Trigger: enforce_broker_limit
CREATE OR REPLACE FUNCTION public.enforce_broker_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _max int;
  _current int;
BEGIN
  IF NEW.agency_id IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' AND OLD.agency_id IS NOT DISTINCT FROM NEW.agency_id THEN
    RETURN NEW;
  END IF;

  SELECT pl.max_brokers INTO _max
  FROM public.subscriptions s
  JOIN public.plans pl ON pl.id = s.plan_id
  WHERE s.user_id = NEW.agency_id
    AND s.status IN ('active','trial')
  ORDER BY s.created_at DESC LIMIT 1;

  IF _max IS NULL THEN
    RAISE EXCEPTION 'A imobiliária não possui assinatura ativa.';
  END IF;

  SELECT COUNT(*)::int INTO _current
  FROM public.profiles p
  WHERE p.agency_id = NEW.agency_id
    AND (TG_OP = 'INSERT' OR p.user_id <> NEW.user_id);

  IF _current >= _max THEN
    RAISE EXCEPTION 'Limite de % corretores da imobiliária atingido.', _max;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_broker_limit ON public.profiles;
CREATE TRIGGER trg_enforce_broker_limit
BEFORE INSERT OR UPDATE OF agency_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_broker_limit();

-- 11) Seeds: Free plans (only if none exist for that type)
INSERT INTO public.plans (name, price, billing_cycle, trial_days, max_properties, max_brokers, modules, is_active, plan_type, is_free)
SELECT 'Free Corretor', 0, 'monthly', 0, 5, 1, '[]'::jsonb, true, 'corretor', true
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE is_free = true AND plan_type = 'corretor');

INSERT INTO public.plans (name, price, billing_cycle, trial_days, max_properties, max_brokers, modules, is_active, plan_type, is_free)
SELECT 'Free Imobiliária', 0, 'monthly', 0, 10, 2, '[]'::jsonb, true, 'imobiliaria', true
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE is_free = true AND plan_type = 'imobiliaria');
