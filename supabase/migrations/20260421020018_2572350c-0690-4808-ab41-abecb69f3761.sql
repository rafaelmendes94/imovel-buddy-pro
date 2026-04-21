CREATE TABLE public.broker_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  pontualidade INTEGER NOT NULL DEFAULT 0 CHECK (pontualidade BETWEEN 0 AND 5),
  agilidade INTEGER NOT NULL DEFAULT 0 CHECK (agilidade BETWEEN 0 AND 5),
  transparencia INTEGER NOT NULL DEFAULT 0 CHECK (transparencia BETWEEN 0 AND 5),
  credibilidade INTEGER NOT NULL DEFAULT 0 CHECK (credibilidade BETWEEN 0 AND 5),
  negociacao INTEGER NOT NULL DEFAULT 0 CHECK (negociacao BETWEEN 0 AND 5),
  comentario TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (broker_id, rater_id),
  CHECK (broker_id <> rater_id)
);

ALTER TABLE public.broker_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read broker ratings"
ON public.broker_ratings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Brokers can insert own ratings"
ON public.broker_ratings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = rater_id AND has_role(auth.uid(), 'broker'::app_role));

CREATE POLICY "Brokers can update own ratings"
ON public.broker_ratings FOR UPDATE TO authenticated
USING (auth.uid() = rater_id);

CREATE POLICY "Brokers can delete own ratings"
ON public.broker_ratings FOR DELETE TO authenticated
USING (auth.uid() = rater_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_broker_ratings_updated_at
BEFORE UPDATE ON public.broker_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_broker_ratings_broker ON public.broker_ratings(broker_id);