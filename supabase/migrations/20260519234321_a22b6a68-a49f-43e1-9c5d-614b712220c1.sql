
-- 1) Criar usuário no auth.users
DO $$
DECLARE
  _uid uuid := gen_random_uuid();
  _hashed text;
  _free_plan uuid;
BEGIN
  -- Verificar se já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'rafaelcunha94@gmail.com') THEN
    SELECT id INTO _uid FROM auth.users WHERE email = 'rafaelcunha94@gmail.com';
  ELSE
    _hashed := crypt('Corretor@2026', gen_salt('bf'));

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', _uid, 'authenticated', 'authenticated',
      'rafaelcunha94@gmail.com', _hashed, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Rafael Cunha","account_type":"corretor"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), _uid,
      jsonb_build_object('sub', _uid::text, 'email', 'rafaelcunha94@gmail.com', 'email_verified', true),
      'email', _uid::text, now(), now(), now());
  END IF;

  -- Garantir profile
  INSERT INTO public.profiles (user_id, full_name, email, account_type, phone)
  VALUES (_uid, 'Rafael Cunha', 'rafaelcunha94@gmail.com', 'corretor', '(48) 99999-0000')
  ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

  -- Garantir role broker
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'broker')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Criar assinatura ativa com primeiro plano disponível
  SELECT id INTO _free_plan FROM public.plans WHERE is_active = true ORDER BY price ASC LIMIT 1;
  IF _free_plan IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _uid) THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
    VALUES (_uid, _free_plan, 'active', now(), now() + interval '100 years');
  END IF;

  -- 10 imóveis
  INSERT INTO public.imoveis (user_id, titulo, endereco, cidade, bairro, estado, tipo, preco, quartos, banheiros, vagas, area, area_privativa, status, ativo_site, descricao, condicoes_pagamento, latitude, longitude, corretor_nome)
  VALUES
  (_uid, 'Apto Vista Mar 3 dorms — Beira-mar Norte', 'Av. Beira Mar Norte, 1500', 'Florianópolis', 'Centro', 'SC', 'Apartamento', 950000, 3, 2, 2, 110, 95, 'Disponível', true, 'Lindo apartamento com vista para o mar.', ARRAY['Financiamento','À vista'], -27.5807, -48.5481, 'Rafael Cunha'),
  (_uid, 'Cobertura Duplex Jurerê Internacional', 'Av. dos Búzios, 200', 'Florianópolis', 'Jurerê Internacional', 'SC', 'Cobertura', 2800000, 4, 4, 3, 280, 240, 'Disponível', true, 'Cobertura com piscina privativa.', ARRAY['Financiamento','Permuta'], -27.4391, -48.5006, 'Rafael Cunha'),
  (_uid, 'Casa em Condomínio — Lagoa da Conceição', 'Servidão das Tartarugas, 30', 'Florianópolis', 'Lagoa da Conceição', 'SC', 'Casa', 1450000, 3, 3, 2, 180, 160, 'Disponível', true, 'Casa rústica chique em condomínio fechado.', ARRAY['Financiamento'], -27.5969, -48.4682, 'Rafael Cunha'),
  (_uid, 'Studio Mobiliado — Centro', 'Rua Felipe Schmidt, 800', 'Florianópolis', 'Centro', 'SC', 'Apartamento', 380000, 1, 1, 1, 38, 35, 'Disponível', true, 'Ideal para investimento.', ARRAY['Financiamento','À vista'], -27.5969, -48.5495, 'Rafael Cunha'),
  (_uid, 'Apto 2 dorms — Trindade', 'Rua Lauro Linhares, 1200', 'Florianópolis', 'Trindade', 'SC', 'Apartamento', 620000, 2, 2, 1, 72, 65, 'Disponível', true, 'Próximo à UFSC.', ARRAY['Financiamento'], -27.6014, -48.5223, 'Rafael Cunha'),
  (_uid, 'Casa de Praia — Campeche', 'Av. Pequeno Príncipe, 500', 'Florianópolis', 'Campeche', 'SC', 'Casa', 1850000, 4, 3, 3, 220, 200, 'Disponível', true, 'A 200m do mar.', ARRAY['Financiamento','Permuta'], -27.6789, -48.4831, 'Rafael Cunha'),
  (_uid, 'Apto Garden — Itacorubi', 'Rod. Admar Gonzaga, 2000', 'Florianópolis', 'Itacorubi', 'SC', 'Apartamento', 880000, 3, 2, 2, 130, 100, 'Disponível', true, 'Garden com 30m² de área externa.', ARRAY['Financiamento'], -27.5852, -48.5042, 'Rafael Cunha'),
  (_uid, 'Loft Moderno — Coqueiros', 'Rua Desembargador Pedro Silva, 700', 'Florianópolis', 'Coqueiros', 'SC', 'Apartamento', 540000, 1, 1, 1, 55, 50, 'Disponível', true, 'Loft com pé direito duplo.', ARRAY['Financiamento','À vista'], -27.6111, -48.5811, 'Rafael Cunha'),
  (_uid, 'Sobrado Alto Padrão — Santo Antônio de Lisboa', 'Rod. Gilson da Costa Xavier, 100', 'Florianópolis', 'Santo Antônio de Lisboa', 'SC', 'Casa', 2200000, 4, 4, 4, 300, 270, 'Disponível', true, 'Vista para a baía norte.', ARRAY['Financiamento','Permuta'], -27.5089, -48.5197, 'Rafael Cunha'),
  (_uid, 'Apto Lançamento — Estreito', 'Rua General Liberato Bittencourt, 50', 'Florianópolis', 'Estreito', 'SC', 'Apartamento', 720000, 2, 2, 2, 80, 72, 'Disponível', true, 'Pronto para morar.', ARRAY['Financiamento','Subsídio'], -27.5947, -48.5805, 'Rafael Cunha');

  -- Tabela PDF vinculada à página pública do corretor
  INSERT INTO public.site_config (config_type, owner_id, site_title, tabela_url)
  VALUES ('broker_page', 'rafael-cunha', 'Rafael Cunha',
          'https://mgnawkfmfbwzpjiilhcf.supabase.co/storage/v1/object/public/tabelas/brokers/rafael-cunha/tabela-rafael.pdf')
  ON CONFLICT DO NOTHING;
END $$;
