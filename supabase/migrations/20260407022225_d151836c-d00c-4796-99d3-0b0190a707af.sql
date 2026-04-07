
CREATE TABLE public.imovel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT 'edit',
  changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.imovel_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_imovel_logs_imovel_id ON public.imovel_logs (imovel_id);
CREATE INDEX idx_imovel_logs_created_at ON public.imovel_logs (created_at DESC);

CREATE POLICY "Users read logs of own properties" ON public.imovel_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.imoveis
      WHERE imoveis.id = imovel_logs.imovel_id
      AND (imoveis.user_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_staff'))
    )
  );

CREATE POLICY "Authenticated users insert logs" ON public.imovel_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
