
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin_staff', 'broker');

-- 2. Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'overdue', 'blocked', 'cancelled');

-- 3. Create billing cycle enum
CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'quarterly', 'annual');

-- 4. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Staff permissions table
CREATE TABLE public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  can_view_financeiro BOOLEAN NOT NULL DEFAULT false,
  can_view_corretores BOOLEAN NOT NULL DEFAULT false,
  can_view_relatorios BOOLEAN NOT NULL DEFAULT false,
  can_manage_plans BOOLEAN NOT NULL DEFAULT false,
  can_manage_clients BOOLEAN NOT NULL DEFAULT false,
  can_manage_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

-- 7. Plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
  trial_days INTEGER NOT NULL DEFAULT 7,
  max_properties INTEGER NOT NULL DEFAULT 50,
  max_brokers INTEGER NOT NULL DEFAULT 5,
  modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- 8. Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  mercado_pago_subscription_id TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 9. Subscription payments table
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  mercado_pago_payment_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  reference_period TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- 10. Security definer function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 11. RLS Policies

-- Profiles: user reads/updates own, super_admin reads all
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (
  auth.uid() = user_id
);
CREATE POLICY "System inserts profile" ON public.profiles FOR INSERT WITH CHECK (true);

-- User roles: super_admin manages, users read own
CREATE POLICY "Users read own role" ON public.user_roles FOR SELECT USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Super admin manages roles" ON public.user_roles FOR ALL USING (
  public.has_role(auth.uid(), 'super_admin')
);

-- Staff permissions: super_admin manages, staff reads own
CREATE POLICY "Read own permissions" ON public.staff_permissions FOR SELECT USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Super admin manages permissions" ON public.staff_permissions FOR ALL USING (
  public.has_role(auth.uid(), 'super_admin')
);

-- Plans: public read, super_admin write
CREATE POLICY "Anyone can read active plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Super admin manages plans" ON public.plans FOR ALL USING (
  public.has_role(auth.uid(), 'super_admin')
);

-- Subscriptions: user reads own, super_admin all
CREATE POLICY "Users read own subscription" ON public.subscriptions FOR SELECT USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Super admin manages subscriptions" ON public.subscriptions FOR ALL USING (
  public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "System inserts subscription" ON public.subscriptions FOR INSERT WITH CHECK (true);

-- Subscription payments: via subscription owner or super_admin
CREATE POLICY "Users read own payments" ON public.subscription_payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions s 
    WHERE s.id = subscription_id AND (s.user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
  )
);
CREATE POLICY "Super admin manages payments" ON public.subscription_payments FOR ALL USING (
  public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "System inserts payments" ON public.subscription_payments FOR INSERT WITH CHECK (true);

-- 12. Trigger to auto-create profile and default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'broker');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
