
-- 1) partners.user_id — dono da conta
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON public.partners(user_id);

-- 2) RLS: parceiro gerencia próprio registro
DROP POLICY IF EXISTS "Partner manages own row" ON public.partners;
CREATE POLICY "Partner manages own row"
ON public.partners
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3) Tabela de avaliações de parceiros
CREATE TABLE IF NOT EXISTS public.partner_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  rater_id uuid NOT NULL,
  rater_name text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partner_ratings_partner ON public.partner_ratings(partner_id);

GRANT SELECT ON public.partner_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_ratings TO authenticated;
GRANT ALL ON public.partner_ratings TO service_role;

ALTER TABLE public.partner_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read partner ratings"
ON public.partner_ratings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated insert own rating"
ON public.partner_ratings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Update own rating"
ON public.partner_ratings FOR UPDATE TO authenticated
USING (auth.uid() = rater_id);

CREATE POLICY "Delete own rating or admin"
ON public.partner_ratings FOR DELETE TO authenticated
USING (auth.uid() = rater_id OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- 4) Atualiza handle_new_user: cria role + partner record quando account_type='parceiro'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _account_type text;
  _full_name text;
  _slug text;
BEGIN
  _account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'corretor');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.profiles (user_id, full_name, email, account_type)
  VALUES (NEW.id, _full_name, NEW.email, _account_type);

  IF _account_type = 'parceiro' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'partner');

    _slug := lower(regexp_replace(
      translate(COALESCE(NULLIF(_full_name,''), split_part(NEW.email,'@',1)),
        'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
        'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
      '[^a-zA-Z0-9]+', '-', 'g'
    ));
    _slug := trim(both '-' from _slug) || '-' || substr(NEW.id::text, 1, 6);

    INSERT INTO public.partners (user_id, name, slug, category, status, featured)
    VALUES (NEW.id, COALESCE(NULLIF(_full_name,''), 'Novo Parceiro'), _slug, 'Outros', 'active', false);
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'broker');
  END IF;

  RETURN NEW;
END;
$function$;

-- 5) Função que ajusta featured do parceiro conforme plano
CREATE OR REPLACE FUNCTION public.sync_partner_featured_from_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _modules jsonb;
  _is_partner boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.partners WHERE user_id = NEW.user_id) INTO _is_partner;
  IF NOT _is_partner THEN RETURN NEW; END IF;

  SELECT to_jsonb(modules) INTO _modules FROM public.plans WHERE id = NEW.plan_id;

  IF NEW.status IN ('active','trial') AND _modules ? 'destaque' THEN
    UPDATE public.partners SET featured = true WHERE user_id = NEW.user_id;
  ELSIF NEW.status IN ('blocked','cancelled','pending_payment') THEN
    UPDATE public.partners SET featured = false WHERE user_id = NEW.user_id;
  ELSE
    UPDATE public.partners SET featured = (_modules ? 'destaque') WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_partner_featured ON public.subscriptions;
CREATE TRIGGER trg_sync_partner_featured
AFTER INSERT OR UPDATE OF status, plan_id ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_partner_featured_from_subscription();

-- 6) Insere planos do parceiro (idempotente)
INSERT INTO public.plans (name, price, billing_cycle, trial_days, max_properties, max_brokers, modules, is_free, plan_type, is_active)
SELECT 'Parceiro Essencial', 99, 'monthly', 7, 0, 0, '[]'::jsonb, false, 'parceiro', true
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE plan_type='parceiro' AND price=99);

INSERT INTO public.plans (name, price, billing_cycle, trial_days, max_properties, max_brokers, modules, is_free, plan_type, is_active)
SELECT 'Parceiro Destaque', 199, 'monthly', 7, 0, 0, '["destaque"]'::jsonb, false, 'parceiro', true
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE plan_type='parceiro' AND price=199);
