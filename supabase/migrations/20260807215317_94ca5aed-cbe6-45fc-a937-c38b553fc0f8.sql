ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS suites integer DEFAULT 0;

UPDATE public.imoveis SET suites = 0 WHERE suites IS NULL;

COMMENT ON COLUMN public.imoveis.suites IS 'Número de suítes do imóvel (0 a 10)';