DO $$
DECLARE
  _modules jsonb := '[
    "imoveis",
    "edificios",
    "condominios",
    "site",
    "fotos",
    "avaliacoes",
    "financeiro",
    "tabelas",
    "contratos",
    "videomaker",
    "brick",
    "relatorios"
  ]'::jsonb;
BEGIN
  UPDATE public.plans
  SET is_active = false
  WHERE name NOT IN ('Plano 5 Imóveis', 'Plano 10 Imóveis', 'Plano 20 Imóveis');

  INSERT INTO public.plans (
    name, price, billing_cycle, trial_days, max_properties, max_brokers,
    modules, is_free, plan_type, is_active, description
  )
  VALUES
    ('Plano 5 Imóveis', 59, 'monthly', 0, 5, 1, _modules, false, 'corretor', true, 'Plano mensal para corretor com até 5 imóveis'),
    ('Plano 10 Imóveis', 79, 'monthly', 0, 10, 1, _modules, false, 'corretor', true, 'Plano mensal para corretor com até 10 imóveis'),
    ('Plano 20 Imóveis', 100, 'monthly', 0, 20, 1, _modules, false, 'corretor', true, 'Plano mensal para corretor com até 20 imóveis')
  ON CONFLICT DO NOTHING;

  UPDATE public.plans
  SET
    price = 59,
    billing_cycle = 'monthly',
    trial_days = 0,
    max_properties = 5,
    max_brokers = 1,
    modules = _modules,
    is_free = false,
    plan_type = 'corretor',
    is_active = true,
    description = 'Plano mensal para corretor com até 5 imóveis'
  WHERE name = 'Plano 5 Imóveis';

  UPDATE public.plans
  SET
    price = 79,
    billing_cycle = 'monthly',
    trial_days = 0,
    max_properties = 10,
    max_brokers = 1,
    modules = _modules,
    is_free = false,
    plan_type = 'corretor',
    is_active = true,
    description = 'Plano mensal para corretor com até 10 imóveis'
  WHERE name = 'Plano 10 Imóveis';

  UPDATE public.plans
  SET
    price = 100,
    billing_cycle = 'monthly',
    trial_days = 0,
    max_properties = 20,
    max_brokers = 1,
    modules = _modules,
    is_free = false,
    plan_type = 'corretor',
    is_active = true,
    description = 'Plano mensal para corretor com até 20 imóveis'
  WHERE name = 'Plano 20 Imóveis';
END $$;
