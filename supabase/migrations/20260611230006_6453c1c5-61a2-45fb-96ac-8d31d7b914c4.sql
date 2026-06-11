
-- 1) New billing_customers table (owner-scoped)
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  asaas_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_customers TO authenticated;
GRANT ALL ON public.billing_customers TO service_role;

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own billing" ON public.billing_customers
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'));
CREATE POLICY "Users insert own billing" ON public.billing_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own billing" ON public.billing_customers
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_billing_customers_updated_at
  BEFORE UPDATE ON public.billing_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data
INSERT INTO public.billing_customers (user_id, asaas_customer_id)
SELECT user_id, asaas_customer_id
FROM public.profiles
WHERE asaas_customer_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Drop the exposed column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS asaas_customer_id;

-- 2) Drop overly broad SELECT policies on edificios / condominios / empreendimentos
DROP POLICY IF EXISTS "Authenticated users can view all edificios" ON public.edificios;
DROP POLICY IF EXISTS "Authenticated users can view all condominios" ON public.condominios;
DROP POLICY IF EXISTS "Authenticated users can view all empreendimentos" ON public.empreendimentos;

-- 3) Tighten site-assets storage policies (owner-scoped update/delete)
DROP POLICY IF EXISTS "Authenticated users can update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete site-assets" ON storage.objects;

CREATE POLICY "Owners update site-assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'super_admin')))
  WITH CHECK (bucket_id = 'site-assets' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Owners delete site-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'super_admin')));
