CREATE TABLE public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  file_name text NOT NULL,
  batch_id uuid NOT NULL,
  row_number integer NOT NULL,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalized_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL,
  error text,
  warning text,
  fingerprint text,
  exact_fingerprint text,
  imovel_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.import_logs TO authenticated;
GRANT ALL ON public.import_logs TO service_role;

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own import logs" ON public.import_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users create own import logs" ON public.import_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_import_logs_batch ON public.import_logs (batch_id);
CREATE INDEX idx_import_logs_user ON public.import_logs (user_id, created_at DESC);