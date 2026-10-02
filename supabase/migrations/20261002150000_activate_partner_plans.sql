-- Existing partner offers are ready for the public self-service checkout.
UPDATE public.plans
SET is_active = true
WHERE plan_type = 'parceiro'
  AND name IN ('Parceiro Essencial', 'Parceiro Destaque');
