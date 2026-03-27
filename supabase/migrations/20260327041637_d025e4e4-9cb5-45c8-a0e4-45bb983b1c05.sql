
CREATE TABLE public.subscriber_brokers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  creci TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriber_brokers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on subscriber_brokers" ON public.subscriber_brokers FOR ALL USING (true) WITH CHECK (true);
