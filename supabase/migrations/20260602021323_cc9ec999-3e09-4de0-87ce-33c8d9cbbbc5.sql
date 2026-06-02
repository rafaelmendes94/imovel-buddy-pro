ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS partners_featured_idx ON public.partners (featured) WHERE featured = true;