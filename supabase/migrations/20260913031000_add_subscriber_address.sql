ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS address text;
