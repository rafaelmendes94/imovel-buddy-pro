
ALTER TABLE public.imoveis
  ADD COLUMN corretor_id uuid REFERENCES auth.users(id),
  ADD COLUMN corretor_nome text DEFAULT '',
  ADD COLUMN imobiliaria_nome text DEFAULT '';
