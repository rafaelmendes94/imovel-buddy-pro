CREATE TABLE IF NOT EXISTS public.broker_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_slug text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broker_page_views_slug ON public.broker_page_views(broker_slug);

ALTER TABLE public.broker_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read broker page views"
  ON public.broker_page_views FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.increment_broker_page_view(_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.broker_page_views (broker_slug) VALUES (_slug);
$$;

GRANT EXECUTE ON FUNCTION public.increment_broker_page_view(text) TO anon, authenticated;