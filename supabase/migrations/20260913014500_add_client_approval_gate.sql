ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_approval_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

UPDATE public.profiles
SET approval_status = 'approved'
WHERE approval_status IS NULL;

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
    VALUES (NEW.id, COALESCE(NULLIF(_full_name,''), 'Novo Parceiro'), _slug, 'Outros', 'active', false);
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'broker');
  END IF;

  RETURN NEW;
END;
$function$;
