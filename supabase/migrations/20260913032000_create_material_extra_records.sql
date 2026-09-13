CREATE TABLE IF NOT EXISTS public.material_extra_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_type text NOT NULL CHECK (record_type IN ('job', 'finance', 'event')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_material_extra_records_type
  ON public.material_extra_records(record_type, created_at DESC);

ALTER TABLE public.material_extra_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Material extra read" ON public.material_extra_records;
DROP POLICY IF EXISTS "Material extra create" ON public.material_extra_records;
DROP POLICY IF EXISTS "Material extra update" ON public.material_extra_records;
DROP POLICY IF EXISTS "Material extra delete" ON public.material_extra_records;

CREATE POLICY "Material extra read" ON public.material_extra_records
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin_staff'::public.app_role)
  );

CREATE POLICY "Material extra create" ON public.material_extra_records
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin_staff'::public.app_role)
  );

CREATE POLICY "Material extra update" ON public.material_extra_records
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin_staff'::public.app_role)
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin_staff'::public.app_role)
  );

CREATE POLICY "Material extra delete" ON public.material_extra_records
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin_staff'::public.app_role)
  );
