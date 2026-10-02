CREATE TABLE IF NOT EXISTS public.partner_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  material_type text NOT NULL CHECK (material_type IN ('catalog', 'home_banner', 'weekly_pdf')),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cta_url text NOT NULL DEFAULT '',
  media_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'changes_requested')),
  admin_notes text NOT NULL DEFAULT '',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, material_type)
);

CREATE INDEX IF NOT EXISTS idx_partner_materials_partner ON public.partner_materials(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_materials_review_queue
  ON public.partner_materials(status, material_type);

ALTER TABLE public.partner_materials ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.partner_materials TO anon;
GRANT SELECT, INSERT, UPDATE ON public.partner_materials TO authenticated;
GRANT ALL ON public.partner_materials TO service_role;

DROP POLICY IF EXISTS "Public reads approved partner materials" ON public.partner_materials;
CREATE POLICY "Public reads approved partner materials"
ON public.partner_materials FOR SELECT TO anon
USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated reads partner materials" ON public.partner_materials;
CREATE POLICY "Authenticated reads partner materials"
ON public.partner_materials FOR SELECT TO authenticated
USING (
  status = 'approved'
  OR EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_materials.partner_id AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

DROP POLICY IF EXISTS "Partners create own materials" ON public.partner_materials;
CREATE POLICY "Partners create own materials"
ON public.partner_materials FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_materials.partner_id AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

DROP POLICY IF EXISTS "Partners update own materials" ON public.partner_materials;
CREATE POLICY "Partners update own materials"
ON public.partner_materials FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_materials.partner_id AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_materials.partner_id AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE OR REPLACE FUNCTION public.touch_partner_material_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_partner_material_review_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean := public.has_role(auth.uid(), 'super_admin'::public.app_role);
  _is_owner boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = NEW.partner_id AND p.user_id = auth.uid()
  ) INTO _is_owner;

  IF _is_owner AND NOT _is_admin THEN
    IF TG_OP = 'INSERT' THEN
      NEW.admin_notes := '';
      NEW.reviewed_at := NULL;
      NEW.reviewed_by := NULL;
      IF NEW.status NOT IN ('draft', 'submitted') THEN
        NEW.status := 'draft';
      END IF;
    ELSE
      NEW.admin_notes := OLD.admin_notes;
      NEW.reviewed_at := OLD.reviewed_at;
      NEW.reviewed_by := OLD.reviewed_by;
    END IF;

    IF TG_OP = 'UPDATE' AND (
      NEW.title IS DISTINCT FROM OLD.title
      OR NEW.description IS DISTINCT FROM OLD.description
      OR NEW.cta_url IS DISTINCT FROM OLD.cta_url
      OR NEW.media_urls IS DISTINCT FROM OLD.media_urls
    ) AND NEW.status <> 'submitted' THEN
      NEW.status := 'draft';
    END IF;

    IF NEW.status NOT IN ('draft', 'submitted') THEN
      NEW.status := OLD.status;
    END IF;

    IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status <> 'submitted') THEN
      NEW.submitted_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_partner_material_review ON public.partner_materials;
CREATE TRIGGER trg_guard_partner_material_review
BEFORE INSERT OR UPDATE ON public.partner_materials
FOR EACH ROW EXECUTE FUNCTION public.guard_partner_material_review_fields();

DROP TRIGGER IF EXISTS trg_touch_partner_material ON public.partner_materials;
CREATE TRIGGER trg_touch_partner_material
BEFORE UPDATE ON public.partner_materials
FOR EACH ROW EXECUTE FUNCTION public.touch_partner_material_updated_at();
