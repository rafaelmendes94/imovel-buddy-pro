ALTER TABLE public.imoveis 
  ADD COLUMN IF NOT EXISTS plataforma_venda text DEFAULT '',
  ADD COLUMN IF NOT EXISTS data_venda date;