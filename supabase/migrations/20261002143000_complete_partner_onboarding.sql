-- Partner accounts are published only after payment and explicit admin approval.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _account_type text;
  _full_name text;
  _phone text;
  _slug text;
BEGIN
  _account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'corretor');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  _phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'telefone', '');

  INSERT INTO public.profiles (user_id, full_name, email, phone, account_type, approval_status)
  VALUES (NEW.id, _full_name, NEW.email, _phone, _account_type, 'pending');

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
    VALUES (NEW.id, COALESCE(NULLIF(_full_name,''), 'Novo Parceiro'), _slug, 'Outros', 'inactive', false);
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'broker');
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_partner_publication_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() = OLD.user_id AND NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    NEW.user_id := OLD.user_id;
    NEW.status := OLD.status;
    NEW.featured := OLD.featured;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_partner_publication_fields ON public.partners;
CREATE TRIGGER trg_protect_partner_publication_fields
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.protect_partner_publication_fields();

CREATE OR REPLACE FUNCTION public.protect_profile_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() = OLD.user_id AND NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    NEW.approval_status := OLD.approval_status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_profile_approval_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_approval_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_approval_fields();

CREATE OR REPLACE FUNCTION public.set_partner_approval(
  _partner_id uuid,
  _approved boolean,
  _reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _payment_confirmed boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Apenas o super administrador pode aprovar parceiros.';
  END IF;

  SELECT user_id INTO _user_id
  FROM public.partners
  WHERE id = _partner_id
  FOR UPDATE;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Este parceiro não possui uma conta vinculada.';
  END IF;

  IF _approved THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.subscriptions
      WHERE user_id = _user_id
        AND status IN ('active', 'trial')
    ) INTO _payment_confirmed;

    IF NOT _payment_confirmed THEN
      RAISE EXCEPTION 'O pagamento do parceiro ainda não foi confirmado.';
    END IF;

    UPDATE public.profiles
    SET approval_status = 'approved',
        rejection_reason = NULL,
        approved_at = now(),
        approved_by = auth.uid()
    WHERE user_id = _user_id;

    UPDATE public.partners SET status = 'active' WHERE id = _partner_id;
  ELSE
    UPDATE public.profiles
    SET approval_status = 'rejected',
        rejection_reason = COALESCE(NULLIF(trim(_reason), ''), 'Cadastro de parceiro não aprovado pela administração.'),
        approved_at = NULL,
        approved_by = auth.uid()
    WHERE user_id = _user_id;

    UPDATE public.partners SET status = 'inactive', featured = false WHERE id = _partner_id;
  END IF;

  RETURN jsonb_build_object(
    'partner_id', _partner_id,
    'user_id', _user_id,
    'approval_status', CASE WHEN _approved THEN 'approved' ELSE 'rejected' END,
    'published', _approved
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.set_partner_approval(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_partner_approval(uuid, boolean, text) TO authenticated;
