CREATE TABLE public.job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manages job_roles" ON public.job_roles FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Staff reads job_roles" ON public.job_roles FOR SELECT USING (has_role(auth.uid(), 'admin_staff'::app_role));

-- Seed default roles
INSERT INTO public.job_roles (name, permissions) VALUES
('Gerente Administrativo', '{}'::jsonb),
('Coordenador de Vendas', '{}'::jsonb),
('Analista Financeiro', '{}'::jsonb),
('Assistente Administrativo', '{}'::jsonb),
('Gerente Comercial', '{}'::jsonb),
('Suporte Técnico', '{}'::jsonb),
('Marketing', '{}'::jsonb);