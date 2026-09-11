ALTER TYPE public.billing_cycle ADD VALUE IF NOT EXISTS 'semiannual';

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS discount_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS subscriber_type text NOT NULL DEFAULT 'corretor',
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS due_day integer,
  ADD COLUMN IF NOT EXISTS next_due_date date,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS document text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE public.subscriber_brokers
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS member_role text NOT NULL DEFAULT 'broker',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS last_access_at timestamptz,
  ADD COLUMN IF NOT EXISTS previous_status text;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS competence date,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS paid_by uuid,
  ADD COLUMN IF NOT EXISTS paid_by_name text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_courtesy boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.financial_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id uuid NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.financial_activity_logs TO authenticated;
GRANT ALL ON public.financial_activity_logs TO service_role;

ALTER TABLE public.financial_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read financial logs" ON public.financial_activity_logs;
CREATE POLICY "Admins read financial logs"
ON public.financial_activity_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'));

DROP POLICY IF EXISTS "Admins write financial logs" ON public.financial_activity_logs;
CREATE POLICY "Admins write financial logs"
ON public.financial_activity_logs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_staff'));

CREATE INDEX IF NOT EXISTS idx_financial_logs_subscriber ON public.financial_activity_logs(subscriber_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_subscriber_due ON public.payments(subscriber_id, due_date DESC);

UPDATE public.payments
SET competence = date_trunc('month', due_date)::date
WHERE competence IS NULL;

UPDATE public.subscribers s
SET start_date = COALESCE(s.start_date, s.created_at::date),
    due_day = COALESCE(s.due_day, EXTRACT(DAY FROM s.created_at)::int),
    next_due_date = COALESCE(s.next_due_date, (
      SELECT MIN(p.due_date) FROM public.payments p
      WHERE p.subscriber_id = s.id AND p.paid_at IS NULL
    ));