-- Complete partner offer matrix: monthly, 6 months (-15%) and 12 months (-25%).
UPDATE public.plans SET is_active = false WHERE plan_type = 'parceiro';

INSERT INTO public.plans (
  id, name, price, billing_cycle, trial_days, max_properties, max_brokers,
  modules, is_free, plan_type, is_active, description, discount_percent, notes
)
VALUES
  ('9e674be3-9b6f-4595-90df-812c1cff3257', 'Prestador de Serviço', 99.00, 'monthly', 0, 0, 0,
    '["perfil_publico"]'::jsonb, false, 'parceiro', true, 'Perfil público para prestadores de serviço', 0, null),
  ('2b0d75d3-4292-4c9f-a3d8-dcff0bc6f740', 'Catálogo Completo', 199.00, 'monthly', 0, 0, 0,
    '["catalogo"]'::jsonb, false, 'parceiro', true, 'Inclusão no catálogo completo de parceiros', 0, null),
  ('5f3011ea-a435-468f-ba74-1e83750c0120', 'Destaque na Capa', 299.00, 'monthly', 0, 0, 0,
    '["catalogo","destaque"]'::jsonb, false, 'parceiro', true, 'Catálogo completo e capa rotativa da página inicial', 0, 'Até 10 anunciantes ativos na capa, exibidos em ordem aleatória'),
  ('85237fa8-f535-4494-b8e4-2ebdbd26cd49', 'Catálogo + PDF Semanal', 499.00, 'monthly', 0, 0, 0,
    '["catalogo","pdf_semanal"]'::jsonb, false, 'parceiro', true, 'Catálogo completo e inclusão no PDF semanal enviado aos corretores', 0, 'Envio previsto toda quinta-feira'),

  ('61a8c536-2843-446d-ab5c-44d81222d710', 'Prestador de Serviço Semestral', 504.90, 'semiannual', 0, 0, 0,
    '["perfil_publico"]'::jsonb, false, 'parceiro', true, 'Perfil público para prestadores de serviço', 15, null),
  ('a2c8aee8-bcd9-4f91-a785-381105c7e992', 'Catálogo Completo Semestral', 1014.90, 'semiannual', 0, 0, 0,
    '["catalogo"]'::jsonb, false, 'parceiro', true, 'Inclusão no catálogo completo de parceiros', 15, null),
  ('ae838e66-b2c0-4835-882c-5773300b929a', 'Destaque na Capa Semestral', 1524.90, 'semiannual', 0, 0, 0,
    '["catalogo","destaque"]'::jsonb, false, 'parceiro', true, 'Catálogo completo e capa rotativa da página inicial', 15, 'Até 10 anunciantes ativos na capa, exibidos em ordem aleatória'),
  ('40cf2da7-6fd1-4469-bb28-d929a275fc5d', 'Catálogo + PDF Semanal Semestral', 2544.90, 'semiannual', 0, 0, 0,
    '["catalogo","pdf_semanal"]'::jsonb, false, 'parceiro', true, 'Catálogo completo e inclusão no PDF semanal enviado aos corretores', 15, 'Envio previsto toda quinta-feira'),

  ('c65e0343-7a27-42a5-8722-d3a1dcaa499c', 'Prestador de Serviço Anual', 891.00, 'annual', 0, 0, 0,
    '["perfil_publico"]'::jsonb, false, 'parceiro', true, 'Perfil público para prestadores de serviço', 25, null),
  ('8f75ca9b-8560-4dc2-93a1-8a1a2a4981b7', 'Catálogo Completo Anual', 1791.00, 'annual', 0, 0, 0,
    '["catalogo"]'::jsonb, false, 'parceiro', true, 'Inclusão no catálogo completo de parceiros', 25, null),
  ('2fadf216-1238-4f88-a265-e69bb6346a9d', 'Destaque na Capa Anual', 2691.00, 'annual', 0, 0, 0,
    '["catalogo","destaque"]'::jsonb, false, 'parceiro', true, 'Catálogo completo e capa rotativa da página inicial', 25, 'Até 10 anunciantes ativos na capa, exibidos em ordem aleatória'),
  ('e6396ee1-7a1a-4dce-95bd-820429ab1868', 'Catálogo + PDF Semanal Anual', 4491.00, 'annual', 0, 0, 0,
    '["catalogo","pdf_semanal"]'::jsonb, false, 'parceiro', true, 'Catálogo completo e inclusão no PDF semanal enviado aos corretores', 25, 'Envio previsto toda quinta-feira')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  billing_cycle = EXCLUDED.billing_cycle,
  trial_days = EXCLUDED.trial_days,
  max_properties = EXCLUDED.max_properties,
  max_brokers = EXCLUDED.max_brokers,
  modules = EXCLUDED.modules,
  is_free = EXCLUDED.is_free,
  plan_type = EXCLUDED.plan_type,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description,
  discount_percent = EXCLUDED.discount_percent,
  notes = EXCLUDED.notes;
