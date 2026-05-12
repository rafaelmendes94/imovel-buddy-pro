ALTER TABLE public.broker_ratings RENAME COLUMN transparencia TO conhecimento_mercado;
ALTER TABLE public.broker_ratings RENAME COLUMN credibilidade TO atendimento;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ratings_public boolean NOT NULL DEFAULT true;