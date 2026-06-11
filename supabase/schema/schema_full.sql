-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('super_admin','admin_staff','broker','partner');
CREATE TYPE public.billing_cycle AS ENUM ('monthly','quarterly','annual');
CREATE TYPE public.subscription_status AS ENUM ('trial','active','overdue','blocked','cancelled','pending_payment');

-- ===== TABLES =====
CREATE TABLE IF NOT EXISTS public.agenciamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  imovel text NOT NULL DEFAULT ''::text,
  tipo text NOT NULL DEFAULT ''::text,
  padrao text NOT NULL DEFAULT ''::text,
  apto_quadra_lote text NOT NULL DEFAULT ''::text,
  box text NOT NULL DEFAULT ''::text,
  dormitorios text NOT NULL DEFAULT ''::text,
  metragem numeric NOT NULL DEFAULT 0,
  ano_construcao_iptu text NOT NULL DEFAULT ''::text,
  posicao text NOT NULL DEFAULT ''::text,
  mobiliado text NOT NULL DEFAULT ''::text,
  destaque text NOT NULL DEFAULT ''::text,
  bairro text NOT NULL DEFAULT ''::text,
  rua text NOT NULL DEFAULT ''::text,
  valor numeric NOT NULL DEFAULT 0,
  fin_bancario text NOT NULL DEFAULT ''::text,
  entrada text NOT NULL DEFAULT ''::text,
  prazo_direto text NOT NULL DEFAULT ''::text,
  condicao_pagamento text NOT NULL DEFAULT ''::text,
  observacoes text NOT NULL DEFAULT ''::text,
  cond_iptu text NOT NULL DEFAULT ''::text,
  chaves_obra text NOT NULL DEFAULT ''::text,
  proprietario text NOT NULL DEFAULT ''::text,
  telefone text NOT NULL DEFAULT ''::text,
  cidade text NOT NULL DEFAULT ''::text,
  data_inclusao date,
  data_atualizacao date,
  status text NOT NULL DEFAULT 'ativo'::text
);
CREATE TABLE IF NOT EXISTS public.avaliacao_utils (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  avaliacao_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asaas_customer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.brick_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text DEFAULT ''::text,
  preco numeric NOT NULL DEFAULT 0,
  categoria text NOT NULL DEFAULT 'Outros'::text,
  estado text NOT NULL DEFAULT 'Usado'::text,
  cidade text DEFAULT ''::text,
  telefone text DEFAULT ''::text,
  imagens text[] DEFAULT '{}'::text[],
  vendido boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.broker_page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  broker_slug text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.broker_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL,
  rater_id uuid NOT NULL,
  pontualidade integer NOT NULL DEFAULT 0,
  agilidade integer NOT NULL DEFAULT 0,
  conhecimento_mercado integer NOT NULL DEFAULT 0,
  atendimento integer NOT NULL DEFAULT 0,
  negociacao integer NOT NULL DEFAULT 0,
  comentario text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.city_galleries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  capa_url text NOT NULL DEFAULT ''::text,
  descricao text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tipo text NOT NULL DEFAULT ''::text,
  cidade text NOT NULL DEFAULT ''::text
);
CREATE TABLE IF NOT EXISTS public.city_gallery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'foto'::text,
  url text NOT NULL DEFAULT ''::text,
  titulo text DEFAULT ''::text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.condominios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  endereco text DEFAULT ''::text,
  cidade text DEFAULT ''::text,
  total_unidades integer DEFAULT 0,
  unidades_disponiveis integer DEFAULT 0,
  taxa_condominio numeric DEFAULT 0,
  amenidades text[] DEFAULT '{}'::text[],
  tipo text DEFAULT 'Vertical'::text,
  imagem_url text,
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  cep text DEFAULT ''::text,
  numero text DEFAULT ''::text,
  complemento text DEFAULT ''::text,
  bairro text DEFAULT ''::text,
  estado text DEFAULT ''::text,
  construtora text DEFAULT ''::text,
  ano_construcao text DEFAULT ''::text,
  descricao text DEFAULT ''::text,
  implantacao_url text DEFAULT ''::text,
  mapa_pdf_url text DEFAULT ''::text,
  fotos_infra text[] DEFAULT '{}'::text[],
  fotos_empreendimento text[] DEFAULT '{}'::text[],
  videos text[] DEFAULT '{}'::text[],
  material_digital text[] DEFAULT '{}'::text[]
);
CREATE TABLE IF NOT EXISTS public.construtora_avaliacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  construtora_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reputacao integer NOT NULL DEFAULT 0,
  cumprimento_prazos integer NOT NULL DEFAULT 0,
  facilidade_aquisicao integer NOT NULL DEFAULT 0,
  condicoes_propostas integer NOT NULL DEFAULT 0,
  qualidade_construcao integer NOT NULL DEFAULT 0,
  suporte_corretor integer NOT NULL DEFAULT 0,
  comentario text DEFAULT ''::text,
  util_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.construtora_empreendimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  construtora_id uuid NOT NULL,
  nome text NOT NULL,
  endereco text DEFAULT ''::text,
  cidade text DEFAULT ''::text,
  status text NOT NULL DEFAULT 'Lançamento'::text,
  tipo text DEFAULT 'Residencial'::text,
  total_unidades integer DEFAULT 0,
  unidades_vendidas integer DEFAULT 0,
  previsao_entrega text DEFAULT ''::text,
  imagem_url text,
  descricao text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.construtora_unidades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  numero text NOT NULL,
  andar text DEFAULT ''::text,
  tipo text DEFAULT 'Apartamento'::text,
  area numeric DEFAULT 0,
  quartos integer DEFAULT 0,
  preco numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'Disponível'::text,
  observacao text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.construtoras (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  slug text NOT NULL,
  descricao text DEFAULT ''::text,
  logo_url text,
  cover_url text,
  perfil_url text,
  cidade text DEFAULT ''::text,
  estado text DEFAULT ''::text,
  telefone text DEFAULT ''::text,
  email text DEFAULT ''::text,
  website text DEFAULT ''::text,
  instagram text DEFAULT ''::text,
  whatsapp text DEFAULT ''::text,
  cnpj text DEFAULT ''::text,
  ano_fundacao text DEFAULT ''::text,
  cor_primaria text DEFAULT '#1e3a5f'::text,
  cor_secundaria text DEFAULT '#2563eb'::text,
  cor_texto text DEFAULT '#ffffff'::text,
  cor_fundo text DEFAULT '#111827'::text,
  avaliacao numeric DEFAULT 0,
  total_avaliacoes integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.edificios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  endereco text DEFAULT ''::text,
  cidade text DEFAULT ''::text,
  andares integer DEFAULT 0,
  total_unidades integer DEFAULT 0,
  construtora text DEFAULT ''::text,
  ano_construcao text DEFAULT ''::text,
  status text DEFAULT 'Lançamento'::text,
  imagem_url text,
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  infraestrutura text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  cep text DEFAULT ''::text,
  numero text DEFAULT ''::text,
  complemento text DEFAULT ''::text,
  bairro text DEFAULT ''::text,
  estado text DEFAULT ''::text,
  fotos_infra text[] DEFAULT '{}'::text[],
  fotos_empreendimento text[] DEFAULT '{}'::text[],
  videos text[] DEFAULT '{}'::text[],
  material_digital text[] DEFAULT '{}'::text[],
  unidades_por_andar integer DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.empreendimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  endereco text DEFAULT ''::text,
  cidade text DEFAULT ''::text,
  construtora text DEFAULT ''::text,
  status text DEFAULT 'Lançamento'::text,
  tipo text DEFAULT 'Residencial'::text,
  total_unidades integer DEFAULT 0,
  previsao_entrega text DEFAULT ''::text,
  imagem_url text,
  descricao text DEFAULT ''::text,
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  infraestrutura text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  cep text DEFAULT ''::text,
  numero text DEFAULT ''::text,
  complemento text DEFAULT ''::text,
  bairro text DEFAULT ''::text,
  estado text DEFAULT ''::text,
  imagens text[] DEFAULT '{}'::text[],
  link_360 text DEFAULT ''::text,
  link_video text DEFAULT ''::text,
  fotos_infra text[] DEFAULT '{}'::text[],
  fotos_empreendimento text[] DEFAULT '{}'::text[],
  videos text[] DEFAULT '{}'::text[],
  material_digital text[] DEFAULT '{}'::text[]
);
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  imovel_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.imoveis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  endereco text NOT NULL DEFAULT ''::text,
  cidade text NOT NULL DEFAULT ''::text,
  tipo text NOT NULL DEFAULT ''::text,
  preco numeric NOT NULL DEFAULT 0,
  quartos integer NOT NULL DEFAULT 0,
  banheiros integer NOT NULL DEFAULT 0,
  area numeric NOT NULL DEFAULT 0,
  descricao text DEFAULT ''::text,
  status text NOT NULL DEFAULT 'Disponível'::text,
  imagens text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  destaque_home boolean NOT NULL DEFAULT false,
  empreendimento text DEFAULT ''::text,
  unidade text DEFAULT ''::text,
  box text DEFAULT ''::text,
  quadra text DEFAULT ''::text,
  lote text DEFAULT ''::text,
  vagas integer NOT NULL DEFAULT 0,
  area_privativa numeric NOT NULL DEFAULT 0,
  vista_mar boolean NOT NULL DEFAULT false,
  decorado boolean NOT NULL DEFAULT false,
  aceita_permuta boolean NOT NULL DEFAULT false,
  ativo_site boolean NOT NULL DEFAULT false,
  bairro text DEFAULT ''::text,
  condicoes_pagamento text[] DEFAULT '{}'::text[],
  proprietario text DEFAULT ''::text,
  proprietario_telefone text DEFAULT ''::text,
  proprietario_tipo text DEFAULT ''::text,
  condicao text DEFAULT ''::text,
  padrao text DEFAULT ''::text,
  posicao_predio text DEFAULT ''::text,
  posicao_solar text DEFAULT ''::text,
  vista text DEFAULT ''::text,
  local_chaves text DEFAULT ''::text,
  termo_exclusividade text DEFAULT ''::text,
  infraestrutura text[] DEFAULT '{}'::text[],
  outras_caracteristicas text[] DEFAULT '{}'::text[],
  comissao numeric DEFAULT 0,
  bonus numeric DEFAULT 0,
  bonus_validade text DEFAULT ''::text,
  preco_parcelado numeric DEFAULT 0,
  elevadores integer DEFAULT 0,
  destaque_categoria text DEFAULT ''::text,
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  edificio_id uuid,
  condominio_id uuid,
  empreendimento_id uuid,
  corretor_id uuid,
  corretor_nome text DEFAULT ''::text,
  imobiliaria_nome text DEFAULT ''::text,
  cep text DEFAULT ''::text,
  numero text DEFAULT ''::text,
  complemento text DEFAULT ''::text,
  estado text DEFAULT ''::text,
  link_video text DEFAULT ''::text,
  link_material text DEFAULT ''::text,
  link_360 text DEFAULT ''::text,
  views integer NOT NULL DEFAULT 0,
  lavabo integer NOT NULL DEFAULT 0,
  plataforma_venda text DEFAULT ''::text,
  data_venda date,
  termo_exclusividade_url text DEFAULT ''::text,
  drive_fotos_url text DEFAULT ''::text,
  fotos_pdf_url text,
  publicar_xml boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.imovel_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  imovel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT ''::text,
  action text NOT NULL DEFAULT 'edit'::text,
  changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.implantacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empreendimento_id uuid NOT NULL,
  imagem_capa_url text NOT NULL DEFAULT ''::text,
  mapa_url text NOT NULL DEFAULT ''::text,
  tipo_arquivo text NOT NULL DEFAULT 'imagem'::text,
  descricao text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.job_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.partner_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  rater_id uuid NOT NULL,
  rater_name text NOT NULL DEFAULT ''::text,
  rating integer NOT NULL,
  comment text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text DEFAULT ''::text,
  cover_url text DEFAULT ''::text,
  description text DEFAULT ''::text,
  address text DEFAULT ''::text,
  city text DEFAULT ''::text,
  phone text DEFAULT ''::text,
  email text DEFAULT ''::text,
  website text DEFAULT ''::text,
  category text NOT NULL DEFAULT 'Outros'::text,
  since_year text DEFAULT ''::text,
  rating numeric DEFAULT 0,
  total_ratings integer DEFAULT 0,
  projects integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active'::text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  featured boolean NOT NULL DEFAULT false,
  user_id uuid
);
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  paid_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending'::text,
  reference_month text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly'::billing_cycle,
  trial_days integer NOT NULL DEFAULT 7,
  max_properties integer NOT NULL DEFAULT 50,
  max_brokers integer NOT NULL DEFAULT 5,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  plan_type text NOT NULL DEFAULT 'corretor'::text,
  is_free boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL DEFAULT ''::text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  agency_id uuid,
  account_type text NOT NULL DEFAULT 'corretor'::text,
  ratings_public boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.public_broker_profiles (
  user_id uuid,
  full_name text,
  phone text,
  avatar_url text
);
CREATE TABLE IF NOT EXISTS public.site_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  config_type text NOT NULL DEFAULT 'main_site'::text,
  owner_id text,
  header_color text NOT NULL DEFAULT '#1e3a5f'::text,
  footer_color text NOT NULL DEFAULT '#111827'::text,
  accent_color text NOT NULL DEFAULT '#2563eb'::text,
  cover_photo_url text,
  profile_photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  site_title text NOT NULL DEFAULT 'MV BROKER CONNECT'::text,
  slogan text NOT NULL DEFAULT 'Seu imóvel dos sonhos está aqui'::text,
  title_color text NOT NULL DEFAULT '#ffffff'::text,
  logo_url text,
  footer_text text NOT NULL DEFAULT '© 2026 MV BROKER CONNECT. Todos os direitos reservados.'::text,
  whatsapp text,
  instagram text,
  email_contact text,
  bio text,
  tabela_url text
);
CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  can_view_financeiro boolean NOT NULL DEFAULT false,
  can_view_corretores boolean NOT NULL DEFAULT false,
  can_view_relatorios boolean NOT NULL DEFAULT false,
  can_manage_plans boolean NOT NULL DEFAULT false,
  can_manage_clients boolean NOT NULL DEFAULT false,
  can_manage_staff boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  permissions jsonb NOT NULL DEFAULT '{"planos": {"edit": false, "view": false, "create": false, "delete": false}, "imoveis": {"edit": false, "view": false, "create": false, "delete": false}, "tabelas": {"edit": false, "view": false, "create": false, "delete": false}, "clientes": {"edit": false, "view": false, "create": false, "delete": false}, "contratos": {"edit": false, "view": false, "create": false, "delete": false}, "dashboard": {"edit": false, "view": false, "create": false, "delete": false}, "edificios": {"edit": false, "view": false, "create": false, "delete": false}, "avaliacoes": {"edit": false, "view": false, "create": false, "delete": false}, "corretores": {"edit": false, "view": false, "create": false, "delete": false}, "financeiro": {"edit": false, "view": false, "create": false, "delete": false}, "relatorios": {"edit": false, "view": false, "create": false, "delete": false}, "condominios": {"edit": false, "view": false, "create": false, "delete": false}, "site_editor": {"edit": false, "view": false, "create": false, "delete": false}, "fotos_cidade": {"edit": false, "view": false, "create": false, "delete": false}, "funcionarios": {"edit": false, "view": false, "create": false, "delete": false}, "imobiliarias": {"edit": false, "view": false, "create": false, "delete": false}, "configuracoes": {"edit": false, "view": false, "create": false, "delete": false}, "material_extra": {"edit": false, "view": false, "create": false, "delete": false}, "dashboard_admin": {"edit": false, "view": false, "create": false, "delete": false}}'::jsonb,
  function_title text NOT NULL DEFAULT ''::text
);
CREATE TABLE IF NOT EXISTS public.subscriber_brokers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  creci text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  creci text,
  plan text NOT NULL DEFAULT 'monthly'::text,
  status text NOT NULL DEFAULT 'active'::text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  mercado_pago_payment_id text,
  paid_at timestamp with time zone,
  reference_period text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'trial'::subscription_status,
  trial_ends_at timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  mercado_pago_subscription_id text,
  blocked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.system_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL
);

-- ===== PRIMARY KEYS & UNIQUE =====
ALTER TABLE public.agenciamentos ADD CONSTRAINT vendas_manuais_pkey PRIMARY KEY (id);
ALTER TABLE public.avaliacao_utils ADD CONSTRAINT avaliacao_utils_avaliacao_id_user_id_key UNIQUE (avaliacao_id, user_id);
ALTER TABLE public.avaliacao_utils ADD CONSTRAINT avaliacao_utils_pkey PRIMARY KEY (id);
ALTER TABLE public.billing_customers ADD CONSTRAINT billing_customers_pkey PRIMARY KEY (id);
ALTER TABLE public.billing_customers ADD CONSTRAINT billing_customers_user_id_key UNIQUE (user_id);
ALTER TABLE public.brick_items ADD CONSTRAINT brick_items_pkey PRIMARY KEY (id);
ALTER TABLE public.broker_page_views ADD CONSTRAINT broker_page_views_pkey PRIMARY KEY (id);
ALTER TABLE public.broker_ratings ADD CONSTRAINT broker_ratings_broker_id_rater_id_key UNIQUE (broker_id, rater_id);
ALTER TABLE public.broker_ratings ADD CONSTRAINT broker_ratings_pkey PRIMARY KEY (id);
ALTER TABLE public.city_galleries ADD CONSTRAINT city_galleries_pkey PRIMARY KEY (id);
ALTER TABLE public.city_gallery_items ADD CONSTRAINT city_gallery_items_pkey PRIMARY KEY (id);
ALTER TABLE public.condominios ADD CONSTRAINT condominios_pkey PRIMARY KEY (id);
ALTER TABLE public.construtora_avaliacoes ADD CONSTRAINT construtora_avaliacoes_pkey PRIMARY KEY (id);
ALTER TABLE public.construtora_empreendimentos ADD CONSTRAINT construtora_empreendimentos_pkey PRIMARY KEY (id);
ALTER TABLE public.construtora_unidades ADD CONSTRAINT construtora_unidades_pkey PRIMARY KEY (id);
ALTER TABLE public.construtoras ADD CONSTRAINT construtoras_pkey PRIMARY KEY (id);
ALTER TABLE public.construtoras ADD CONSTRAINT construtoras_slug_key UNIQUE (slug);
ALTER TABLE public.edificios ADD CONSTRAINT edificios_pkey PRIMARY KEY (id);
ALTER TABLE public.empreendimentos ADD CONSTRAINT empreendimentos_pkey PRIMARY KEY (id);
ALTER TABLE public.favorites ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);
ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_imovel_id_key UNIQUE (user_id, imovel_id);
ALTER TABLE public.imoveis ADD CONSTRAINT imoveis_pkey PRIMARY KEY (id);
ALTER TABLE public.imovel_logs ADD CONSTRAINT imovel_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.implantacoes ADD CONSTRAINT implantacoes_pkey PRIMARY KEY (id);
ALTER TABLE public.job_roles ADD CONSTRAINT job_roles_name_key UNIQUE (name);
ALTER TABLE public.job_roles ADD CONSTRAINT job_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.partner_ratings ADD CONSTRAINT partner_ratings_pkey PRIMARY KEY (id);
ALTER TABLE public.partners ADD CONSTRAINT partners_pkey PRIMARY KEY (id);
ALTER TABLE public.partners ADD CONSTRAINT partners_slug_key UNIQUE (slug);
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE public.plans ADD CONSTRAINT plans_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
ALTER TABLE public.site_config ADD CONSTRAINT site_config_config_type_owner_id_key UNIQUE (config_type, owner_id);
ALTER TABLE public.site_config ADD CONSTRAINT site_config_pkey PRIMARY KEY (id);
ALTER TABLE public.staff_permissions ADD CONSTRAINT staff_permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.staff_permissions ADD CONSTRAINT staff_permissions_user_id_key UNIQUE (user_id);
ALTER TABLE public.subscriber_brokers ADD CONSTRAINT subscriber_brokers_pkey PRIMARY KEY (id);
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_pkey PRIMARY KEY (id);
ALTER TABLE public.subscription_payments ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.system_options ADD CONSTRAINT system_options_category_value_key UNIQUE (category, value);
ALTER TABLE public.system_options ADD CONSTRAINT system_options_pkey PRIMARY KEY (id);
ALTER TABLE public.system_settings ADD CONSTRAINT system_settings_key_key UNIQUE (key);
ALTER TABLE public.system_settings ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- ===== FOREIGN KEYS =====
ALTER TABLE public.avaliacao_utils ADD CONSTRAINT avaliacao_utils_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES construtora_avaliacoes(id) ON DELETE CASCADE;
ALTER TABLE public.avaliacao_utils ADD CONSTRAINT avaliacao_utils_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.billing_customers ADD CONSTRAINT billing_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.city_gallery_items ADD CONSTRAINT city_gallery_items_gallery_id_fkey FOREIGN KEY (gallery_id) REFERENCES city_galleries(id) ON DELETE CASCADE;
ALTER TABLE public.condominios ADD CONSTRAINT condominios_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.construtora_avaliacoes ADD CONSTRAINT construtora_avaliacoes_construtora_id_fkey FOREIGN KEY (construtora_id) REFERENCES construtoras(id) ON DELETE CASCADE;
ALTER TABLE public.construtora_avaliacoes ADD CONSTRAINT construtora_avaliacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.construtora_empreendimentos ADD CONSTRAINT construtora_empreendimentos_construtora_id_fkey FOREIGN KEY (construtora_id) REFERENCES construtoras(id) ON DELETE CASCADE;
ALTER TABLE public.construtora_unidades ADD CONSTRAINT construtora_unidades_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES construtora_empreendimentos(id) ON DELETE CASCADE;
ALTER TABLE public.edificios ADD CONSTRAINT edificios_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.empreendimentos ADD CONSTRAINT empreendimentos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE;
ALTER TABLE public.imoveis ADD CONSTRAINT imoveis_condominio_id_fkey FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE SET NULL;
ALTER TABLE public.imoveis ADD CONSTRAINT imoveis_corretor_id_fkey FOREIGN KEY (corretor_id) REFERENCES auth.users(id);
ALTER TABLE public.imoveis ADD CONSTRAINT imoveis_edificio_id_fkey FOREIGN KEY (edificio_id) REFERENCES edificios(id) ON DELETE SET NULL;
ALTER TABLE public.imoveis ADD CONSTRAINT imoveis_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id);
ALTER TABLE public.implantacoes ADD CONSTRAINT implantacoes_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT payments_subscriber_id_fkey FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.staff_permissions ADD CONSTRAINT staff_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.subscriber_brokers ADD CONSTRAINT subscriber_brokers_subscriber_id_fkey FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE;
ALTER TABLE public.subscription_payments ADD CONSTRAINT subscription_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===== CHECK CONSTRAINTS =====
ALTER TABLE public.broker_ratings ADD CONSTRAINT broker_ratings_agilidade_check CHECK (((agilidade >= 0) AND (agilidade <= 5)));
ALTER TABLE public.broker_ratings ADD CONSTRAINT broker_ratings_check CHECK ((broker_id <> rater_id));
ALTER TABLE public.broker_ratings ADD CONSTRAINT broker_ratings_credibilidade_check CHECK (((atendimento >= 0) AND (atendimento <= 5)));
ALTER TABLE public.broker_ratings ADD CONSTRAINT broker_ratings_negociacao_check CHECK (((negociacao >= 0) AND (negociacao <= 5)));
ALTER TABLE public.broker_ratings ADD CONSTRAINT broker_ratings_pontualidade_check CHECK (((pontualidade >= 0) AND (pontualidade <= 5)));
ALTER TABLE public.broker_ratings ADD CONSTRAINT broker_ratings_transparencia_check CHECK (((conhecimento_mercado >= 0) AND (conhecimento_mercado <= 5)));
ALTER TABLE public.construtora_avaliacoes ADD CONSTRAINT construtora_avaliacoes_condicoes_propostas_check CHECK (((condicoes_propostas >= 0) AND (condicoes_propostas <= 5)));
ALTER TABLE public.construtora_avaliacoes ADD CONSTRAINT construtora_avaliacoes_cumprimento_prazos_check CHECK (((cumprimento_prazos >= 0) AND (cumprimento_prazos <= 5)));
ALTER TABLE public.construtora_avaliacoes ADD CONSTRAINT construtora_avaliacoes_facilidade_aquisicao_check CHECK (((facilidade_aquisicao >= 0) AND (facilidade_aquisicao <= 5)));
ALTER TABLE public.construtora_avaliacoes ADD CONSTRAINT construtora_avaliacoes_qualidade_construcao_check CHECK (((qualidade_construcao >= 0) AND (qualidade_construcao <= 5)));
ALTER TABLE public.construtora_avaliacoes ADD CONSTRAINT construtora_avaliacoes_reputacao_check CHECK (((reputacao >= 0) AND (reputacao <= 5)));
ALTER TABLE public.construtora_avaliacoes ADD CONSTRAINT construtora_avaliacoes_suporte_corretor_check CHECK (((suporte_corretor >= 0) AND (suporte_corretor <= 5)));
ALTER TABLE public.partner_ratings ADD CONSTRAINT partner_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text])));
ALTER TABLE public.subscriber_brokers ADD CONSTRAINT subscriber_brokers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'blocked'::text])));
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_plan_check CHECK ((plan = ANY (ARRAY['monthly'::text, 'quarterly'::text])));
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'blocked'::text, 'cancelled'::text])));

-- ===== INDEXES =====
CREATE INDEX idx_agenciamentos_cidade ON public.agenciamentos USING btree (cidade);
CREATE INDEX idx_agenciamentos_status ON public.agenciamentos USING btree (status);
CREATE INDEX idx_agenciamentos_user ON public.agenciamentos USING btree (user_id);
CREATE INDEX idx_broker_page_views_slug ON public.broker_page_views USING btree (broker_slug);
CREATE INDEX idx_broker_ratings_broker ON public.broker_ratings USING btree (broker_id);
CREATE INDEX idx_imovel_logs_created_at ON public.imovel_logs USING btree (created_at DESC);
CREATE INDEX idx_imovel_logs_imovel_id ON public.imovel_logs USING btree (imovel_id);
CREATE INDEX idx_partner_ratings_partner ON public.partner_ratings USING btree (partner_id);
CREATE INDEX idx_partners_user_id ON public.partners USING btree (user_id);
CREATE INDEX partners_featured_idx ON public.partners USING btree (featured) WHERE (featured = true);
CREATE INDEX idx_profiles_agency_id ON public.profiles USING btree (agency_id);

-- ===== FUNCTIONS =====
CREATE OR REPLACE FUNCTION public.count_imoveis_in_subscription(_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _owner uuid;
  _total integer;
BEGIN
  SELECT COALESCE(p.agency_id, _user_id) INTO _owner
  FROM public.profiles p
  WHERE p.user_id = _user_id;

  IF _owner IS NULL THEN _owner := _user_id; END IF;

  SELECT COUNT(*)::int INTO _total
  FROM public.imoveis i
  WHERE i.user_id = _owner
     OR i.user_id IN (SELECT pp.user_id FROM public.profiles pp WHERE pp.agency_id = _owner);

  RETURN COALESCE(_total, 0);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.create_trial_subscription(_user_id uuid, _plan_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _plan record;
  _sub_id uuid;
  _status public.subscription_status;
  _trial_end timestamptz;
  _period_end timestamptz;
BEGIN
  SELECT * INTO _plan FROM public.plans WHERE id = _plan_id AND is_active = true;
  IF _plan IS NULL THEN
    RAISE EXCEPTION 'Plano não encontrado ou inativo';
  END IF;

  IF _plan.is_free THEN
    _status := 'active';
    _trial_end := NULL;
    _period_end := now() + interval '100 years';
  ELSE
    _status := 'trial';
    _trial_end := now() + (_plan.trial_days || ' days')::interval;
    _period_end := _trial_end;
  END IF;

  INSERT INTO public.subscriptions (user_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
  VALUES (_user_id, _plan_id, _status, _trial_end, now(), _period_end)
  RETURNING id INTO _sub_id;

  RETURN _sub_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.enforce_broker_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _max int;
  _current int;
BEGIN
  IF NEW.agency_id IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' AND OLD.agency_id IS NOT DISTINCT FROM NEW.agency_id THEN
    RETURN NEW;
  END IF;

  SELECT pl.max_brokers INTO _max
  FROM public.subscriptions s
  JOIN public.plans pl ON pl.id = s.plan_id
  WHERE s.user_id = NEW.agency_id
    AND s.status IN ('active','trial')
  ORDER BY s.created_at DESC LIMIT 1;

  IF _max IS NULL THEN
    RAISE EXCEPTION 'A imobiliária não possui assinatura ativa.';
  END IF;

  SELECT COUNT(*)::int INTO _current
  FROM public.profiles p
  WHERE p.agency_id = NEW.agency_id
    AND (TG_OP = 'INSERT' OR p.user_id <> NEW.user_id);

  IF _current >= _max THEN
    RAISE EXCEPTION 'Limite de % corretores da imobiliária atingido.', _max;
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.enforce_imovel_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _owner uuid;
  _max int;
  _current int;
BEGIN
  IF public.has_role(NEW.user_id, 'super_admin') OR public.has_role(NEW.user_id, 'admin_staff') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(p.agency_id, NEW.user_id) INTO _owner
  FROM public.profiles p WHERE p.user_id = NEW.user_id;
  IF _owner IS NULL THEN _owner := NEW.user_id; END IF;

  SELECT pl.max_properties INTO _max
  FROM public.subscriptions s
  JOIN public.plans pl ON pl.id = s.plan_id
  WHERE s.user_id = _owner
    AND s.status IN ('active','trial')
  ORDER BY s.created_at DESC LIMIT 1;

  IF _max IS NULL THEN
    RAISE EXCEPTION 'Sem assinatura ativa. Escolha um plano para cadastrar imóveis.';
  END IF;

  SELECT COUNT(*)::int INTO _current
  FROM public.imoveis i
  WHERE i.user_id = _owner
     OR i.user_id IN (SELECT pp.user_id FROM public.profiles pp WHERE pp.agency_id = _owner);

  IF _current >= _max THEN
    RAISE EXCEPTION 'Limite de % imóveis do seu plano atingido. Faça upgrade para cadastrar mais.', _max;
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_effective_subscription(_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, plan_id uuid, status subscription_status, trial_ends_at timestamp with time zone, current_period_start timestamp with time zone, current_period_end timestamp with time zone, blocked_at timestamp with time zone, effective_owner uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _owner uuid;
BEGIN
  SELECT COALESCE(p.agency_id, _user_id) INTO _owner
  FROM public.profiles p
  WHERE p.user_id = _user_id;

  IF _owner IS NULL THEN
    _owner := _user_id;
  END IF;

  RETURN QUERY
  SELECT s.id, s.user_id, s.plan_id, s.status, s.trial_ends_at,
         s.current_period_start, s.current_period_end, s.blocked_at, _owner
  FROM public.subscriptions s
  WHERE s.user_id = _owner
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _account_type text;
  _full_name text;
  _slug text;
BEGIN
  _account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'corretor');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.profiles (user_id, full_name, email, account_type)
  VALUES (NEW.id, _full_name, NEW.email, _account_type);

  IF _account_type = 'parceiro' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'partner');

    _slug := lower(regexp_replace(
      translate(COALESCE(NULLIF(_full_name,''), split_part(NEW.email,'@',1)),
        'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
        'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
      '[^a-zA-Z0-9]+', '-', 'g'
    ));
    _slug := trim(both '-' from _slug) || '-' || substr(NEW.id::text, 1, 6);

    INSERT INTO public.partners (user_id, name, slug, category, status, featured)
    VALUES (NEW.id, COALESCE(NULLIF(_full_name,''), 'Novo Parceiro'), _slug, 'Outros', 'active', false);
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'broker');
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$
;
CREATE OR REPLACE FUNCTION public.imovel_owner_has_active_sub(_owner uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = COALESCE(
      (SELECT pr.agency_id FROM public.profiles pr WHERE pr.user_id = _owner),
      _owner
    )
    AND (
      s.status = 'active'
      OR (s.status = 'trial' AND (s.trial_ends_at IS NULL OR s.trial_ends_at > now()))
    )
  );
$function$
;
CREATE OR REPLACE FUNCTION public.increment_broker_page_view(_slug text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  INSERT INTO public.broker_page_views (broker_slug) VALUES (_slug);
$function$
;
CREATE OR REPLACE FUNCTION public.increment_imovel_views(imovel_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.imoveis SET views = views + 1 WHERE id = imovel_id;
$function$
;
CREATE OR REPLACE FUNCTION public.link_broker_to_agency(_broker_email text, _agency_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _broker_user_id uuid;
BEGIN
  IF auth.uid() <> _agency_user_id AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT user_id INTO _broker_user_id
  FROM public.profiles
  WHERE LOWER(email) = LOWER(_broker_email)
  LIMIT 1;

  IF _broker_user_id IS NULL THEN
    RAISE EXCEPTION 'Corretor com este e-mail não encontrado. Peça que ele crie a conta primeiro.';
  END IF;

  IF _broker_user_id = _agency_user_id THEN
    RAISE EXCEPTION 'A imobiliária não pode vincular a si mesma';
  END IF;

  UPDATE public.profiles
  SET agency_id = _agency_user_id
  WHERE user_id = _broker_user_id;

  RETURN _broker_user_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.owns_site_config_slug(_owner_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND lower(regexp_replace(
        translate(p.full_name,
          'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
          'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
        '[^a-zA-Z0-9]+', '-', 'g'
      )) = lower(trim(both '-' from _owner_id))
  );
$function$
;
CREATE OR REPLACE FUNCTION public.process_subscription_lifecycle()
 RETURNS TABLE(action text, subscription_id uuid, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r record;
BEGIN
  -- 1) Trial expirado de plano PAGO → pending_payment
  FOR r IN
    SELECT s.id, s.user_id
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.status = 'trial'
      AND p.is_free = false
      AND s.trial_ends_at IS NOT NULL
      AND s.trial_ends_at < now()
  LOOP
    UPDATE public.subscriptions
    SET status = 'pending_payment'
    WHERE id = r.id;
    RETURN QUERY SELECT 'trial_expired'::text, r.id, r.user_id;
  END LOOP;

  -- 2) pending_payment / overdue há +7 dias do vencimento → blocked
  FOR r IN
    SELECT s.id, s.user_id
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.status IN ('pending_payment','overdue')
      AND p.is_free = false
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end + interval '7 days' < now()
  LOOP
    UPDATE public.subscriptions
    SET status = 'blocked', blocked_at = now()
    WHERE id = r.id;
    RETURN QUERY SELECT 'blocked_after_7d'::text, r.id, r.user_id;
  END LOOP;

  -- 3) Bloqueado há +60 dias → cancelled
  FOR r IN
    SELECT s.id, s.user_id
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.status = 'blocked'
      AND p.is_free = false
      AND s.blocked_at IS NOT NULL
      AND s.blocked_at + interval '60 days' < now()
  LOOP
    UPDATE public.subscriptions
    SET status = 'cancelled'
    WHERE id = r.id;
    RETURN QUERY SELECT 'cancelled_after_60d'::text, r.id, r.user_id;
  END LOOP;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.simulate_payment_approval(_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _sub_id uuid;
  _plan record;
  _period_end timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Apenas super admin pode simular pagamentos';
  END IF;

  SELECT s.id, p.billing_cycle, p.is_free
  INTO _sub_id, _plan.billing_cycle, _plan.is_free
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _user_id
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF _sub_id IS NULL THEN
    RAISE EXCEPTION 'Assinatura não encontrada para este usuário';
  END IF;

  _period_end := CASE
    WHEN _plan.is_free THEN now() + interval '100 years'
    WHEN _plan.billing_cycle = 'annual' THEN now() + interval '365 days'
    WHEN _plan.billing_cycle = 'quarterly' THEN now() + interval '90 days'
    ELSE now() + interval '30 days'
  END;

  UPDATE public.subscriptions
  SET status = 'active',
      current_period_start = now(),
      current_period_end = _period_end,
      blocked_at = NULL,
      trial_ends_at = NULL
  WHERE id = _sub_id;

  INSERT INTO public.subscription_payments (subscription_id, amount, status, paid_at, reference_period)
  SELECT _sub_id, p.price, 'approved', now(),
         to_char(now(), 'YYYY-MM')
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.id = _sub_id;

  RETURN _sub_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.simulate_subscription_status(_user_id uuid, _new_status subscription_status)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _sub_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Apenas super admin pode simular status';
  END IF;

  SELECT id INTO _sub_id
  FROM public.subscriptions
  WHERE user_id = _user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF _sub_id IS NULL THEN
    RAISE EXCEPTION 'Assinatura não encontrada';
  END IF;

  UPDATE public.subscriptions
  SET status = _new_status,
      blocked_at = CASE WHEN _new_status = 'blocked' THEN now() ELSE blocked_at END
  WHERE id = _sub_id;

  RETURN _sub_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.sync_partner_featured_from_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _modules jsonb;
  _is_partner boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.partners WHERE user_id = NEW.user_id) INTO _is_partner;
  IF NOT _is_partner THEN RETURN NEW; END IF;

  SELECT to_jsonb(modules) INTO _modules FROM public.plans WHERE id = NEW.plan_id;

  IF NEW.status IN ('active','trial') AND _modules ? 'destaque' THEN
    UPDATE public.partners SET featured = true WHERE user_id = NEW.user_id;
  ELSIF NEW.status IN ('blocked','cancelled','pending_payment') THEN
    UPDATE public.partners SET featured = false WHERE user_id = NEW.user_id;
  ELSE
    UPDATE public.partners SET featured = (_modules ? 'destaque') WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.test_lifecycle_flow(_subscription_id uuid)
 RETURNS TABLE(etapa text, status_resultado text, blocked_at_resultado timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _original_status subscription_status;
  _original_trial timestamptz;
  _original_period_end timestamptz;
  _original_blocked timestamptz;
  _new_status subscription_status;
  _new_blocked timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Apenas super admin pode executar testes';
  END IF;

  -- Snapshot
  SELECT status, trial_ends_at, current_period_end, blocked_at
  INTO _original_status, _original_trial, _original_period_end, _original_blocked
  FROM subscriptions WHERE id = _subscription_id;

  -- Cenário 1: trial expirado → pending_payment
  UPDATE subscriptions SET status='trial', trial_ends_at=now()-interval '1 day',
    current_period_end=now()-interval '1 day', blocked_at=NULL
  WHERE id=_subscription_id;
  PERFORM process_subscription_lifecycle();
  SELECT status INTO _new_status FROM subscriptions WHERE id=_subscription_id;
  RETURN QUERY SELECT '1_trial_expirado'::text, _new_status::text, NULL::timestamptz;

  -- Cenário 2: pending_payment +7d → blocked
  UPDATE subscriptions SET current_period_end=now()-interval '8 days' WHERE id=_subscription_id;
  PERFORM process_subscription_lifecycle();
  SELECT status, blocked_at INTO _new_status, _new_blocked FROM subscriptions WHERE id=_subscription_id;
  RETURN QUERY SELECT '2_blocked_apos_7d'::text, _new_status::text, _new_blocked;

  -- Cenário 3: blocked +60d → cancelled
  UPDATE subscriptions SET blocked_at=now()-interval '61 days' WHERE id=_subscription_id;
  PERFORM process_subscription_lifecycle();
  SELECT status INTO _new_status FROM subscriptions WHERE id=_subscription_id;
  RETURN QUERY SELECT '3_cancelled_apos_60d'::text, _new_status::text, NULL::timestamptz;

  -- Restaura estado original
  UPDATE subscriptions SET status=_original_status, trial_ends_at=_original_trial,
    current_period_end=_original_period_end, blocked_at=_original_blocked
  WHERE id=_subscription_id;
  RETURN QUERY SELECT '4_restaurado'::text, _original_status::text, _original_blocked;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

-- ===== TRIGGERS =====
CREATE TRIGGER update_vendas_manuais_updated_at BEFORE UPDATE ON public.agenciamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_billing_customers_updated_at BEFORE UPDATE ON public.billing_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_broker_ratings_updated_at BEFORE UPDATE ON public.broker_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_city_galleries_updated_at BEFORE UPDATE ON public.city_galleries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_enforce_imovel_limit BEFORE INSERT ON public.imoveis FOR EACH ROW EXECUTE FUNCTION enforce_imovel_limit();
CREATE TRIGGER update_implantacoes_updated_at BEFORE UPDATE ON public.implantacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_enforce_broker_limit BEFORE INSERT OR UPDATE OF agency_id ON public.profiles FOR EACH ROW EXECUTE FUNCTION enforce_broker_limit();
CREATE TRIGGER trg_sync_partner_featured AFTER INSERT OR UPDATE OF status, plan_id ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION sync_partner_featured_from_subscription();

-- ===== GRANTS + RLS =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenciamentos TO authenticated;
GRANT ALL ON public.agenciamentos TO service_role;
GRANT SELECT ON public.agenciamentos TO anon;
ALTER TABLE public.agenciamentos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacao_utils TO authenticated;
GRANT ALL ON public.avaliacao_utils TO service_role;
GRANT SELECT ON public.avaliacao_utils TO anon;
ALTER TABLE public.avaliacao_utils ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_customers TO authenticated;
GRANT ALL ON public.billing_customers TO service_role;
GRANT SELECT ON public.billing_customers TO anon;
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brick_items TO authenticated;
GRANT ALL ON public.brick_items TO service_role;
GRANT SELECT ON public.brick_items TO anon;
ALTER TABLE public.brick_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_page_views TO authenticated;
GRANT ALL ON public.broker_page_views TO service_role;
GRANT SELECT ON public.broker_page_views TO anon;
ALTER TABLE public.broker_page_views ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_ratings TO authenticated;
GRANT ALL ON public.broker_ratings TO service_role;
GRANT SELECT ON public.broker_ratings TO anon;
ALTER TABLE public.broker_ratings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.city_galleries TO authenticated;
GRANT ALL ON public.city_galleries TO service_role;
GRANT SELECT ON public.city_galleries TO anon;
ALTER TABLE public.city_galleries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.city_gallery_items TO authenticated;
GRANT ALL ON public.city_gallery_items TO service_role;
GRANT SELECT ON public.city_gallery_items TO anon;
ALTER TABLE public.city_gallery_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.condominios TO authenticated;
GRANT ALL ON public.condominios TO service_role;
GRANT SELECT ON public.condominios TO anon;
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construtora_avaliacoes TO authenticated;
GRANT ALL ON public.construtora_avaliacoes TO service_role;
GRANT SELECT ON public.construtora_avaliacoes TO anon;
ALTER TABLE public.construtora_avaliacoes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construtora_empreendimentos TO authenticated;
GRANT ALL ON public.construtora_empreendimentos TO service_role;
GRANT SELECT ON public.construtora_empreendimentos TO anon;
ALTER TABLE public.construtora_empreendimentos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construtora_unidades TO authenticated;
GRANT ALL ON public.construtora_unidades TO service_role;
GRANT SELECT ON public.construtora_unidades TO anon;
ALTER TABLE public.construtora_unidades ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construtoras TO authenticated;
GRANT ALL ON public.construtoras TO service_role;
GRANT SELECT ON public.construtoras TO anon;
ALTER TABLE public.construtoras ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edificios TO authenticated;
GRANT ALL ON public.edificios TO service_role;
GRANT SELECT ON public.edificios TO anon;
ALTER TABLE public.edificios ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empreendimentos TO authenticated;
GRANT ALL ON public.empreendimentos TO service_role;
GRANT SELECT ON public.empreendimentos TO anon;
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
GRANT SELECT ON public.favorites TO anon;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imoveis TO authenticated;
GRANT ALL ON public.imoveis TO service_role;
GRANT SELECT ON public.imoveis TO anon;
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imovel_logs TO authenticated;
GRANT ALL ON public.imovel_logs TO service_role;
GRANT SELECT ON public.imovel_logs TO anon;
ALTER TABLE public.imovel_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.implantacoes TO authenticated;
GRANT ALL ON public.implantacoes TO service_role;
GRANT SELECT ON public.implantacoes TO anon;
ALTER TABLE public.implantacoes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_roles TO authenticated;
GRANT ALL ON public.job_roles TO service_role;
GRANT SELECT ON public.job_roles TO anon;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_ratings TO authenticated;
GRANT ALL ON public.partner_ratings TO service_role;
GRANT SELECT ON public.partner_ratings TO anon;
ALTER TABLE public.partner_ratings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
GRANT SELECT ON public.partners TO anon;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
GRANT SELECT ON public.payments TO anon;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
GRANT SELECT ON public.plans TO anon;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_config TO authenticated;
GRANT ALL ON public.site_config TO service_role;
GRANT SELECT ON public.site_config TO anon;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_permissions TO authenticated;
GRANT ALL ON public.staff_permissions TO service_role;
GRANT SELECT ON public.staff_permissions TO anon;
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriber_brokers TO authenticated;
GRANT ALL ON public.subscriber_brokers TO service_role;
GRANT SELECT ON public.subscriber_brokers TO anon;
ALTER TABLE public.subscriber_brokers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscribers TO authenticated;
GRANT ALL ON public.subscribers TO service_role;
GRANT SELECT ON public.subscribers TO anon;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_payments TO authenticated;
GRANT ALL ON public.subscription_payments TO service_role;
GRANT SELECT ON public.subscription_payments TO anon;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
GRANT SELECT ON public.subscriptions TO anon;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_options TO authenticated;
GRANT ALL ON public.system_options TO service_role;
GRANT SELECT ON public.system_options TO anon;
ALTER TABLE public.system_options ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
GRANT SELECT ON public.system_settings TO anon;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.user_roles TO anon;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES =====
CREATE POLICY "Users delete own agenciamentos" ON public.agenciamentos AS PERMISSIVE FOR DELETE TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users insert own agenciamentos" ON public.agenciamentos AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read own agenciamentos" ON public.agenciamentos AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Users update own agenciamentos" ON public.agenciamentos AS PERMISSIVE FOR UPDATE TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Authenticated users can insert own utils" ON public.avaliacao_utils AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can read utils" ON public.avaliacao_utils AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can delete own utils" ON public.avaliacao_utils AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own billing" ON public.billing_customers AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read own billing" ON public.billing_customers AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Users update own billing" ON public.billing_customers AS PERMISSIVE FOR UPDATE TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Anyone can read brick items" ON public.brick_items AS PERMISSIVE FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY "Users delete own brick items" ON public.brick_items AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own brick items" ON public.brick_items AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own brick items" ON public.brick_items AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Anyone can read broker page views" ON public.broker_page_views AS PERMISSIVE FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY "Anyone authenticated can read broker ratings" ON public.broker_ratings AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert own ratings" ON public.broker_ratings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((auth.uid() = rater_id) AND (auth.uid() <> broker_id)));
CREATE POLICY "Brokers can delete own ratings" ON public.broker_ratings AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = rater_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Brokers can update own ratings" ON public.broker_ratings AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = rater_id));
CREATE POLICY "Anon reads galleries" ON public.city_galleries AS PERMISSIVE FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone reads galleries" ON public.city_galleries AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages galleries" ON public.city_galleries AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Anon reads gallery items" ON public.city_gallery_items AS PERMISSIVE FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone reads gallery items" ON public.city_gallery_items AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages gallery items" ON public.city_gallery_items AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users delete own condominios" ON public.condominios AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users insert own condominios" ON public.condominios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read own condominios" ON public.condominios AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Users update own condominios" ON public.condominios AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Authenticated users can insert own avaliacoes" ON public.construtora_avaliacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can read all avaliacoes" ON public.construtora_avaliacoes AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can delete own avaliacoes" ON public.construtora_avaliacoes AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users can update own avaliacoes" ON public.construtora_avaliacoes AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Delete empreendimentos via construtora" ON public.construtora_empreendimentos AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM construtoras c
  WHERE ((c.id = construtora_empreendimentos.construtora_id) AND ((c.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))))));
CREATE POLICY "Insert empreendimentos via construtora" ON public.construtora_empreendimentos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM construtoras c
  WHERE ((c.id = construtora_empreendimentos.construtora_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Read empreendimentos via construtora" ON public.construtora_empreendimentos AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM construtoras c
  WHERE ((c.id = construtora_empreendimentos.construtora_id) AND ((c.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role))))));
CREATE POLICY "Update empreendimentos via construtora" ON public.construtora_empreendimentos AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM construtoras c
  WHERE ((c.id = construtora_empreendimentos.construtora_id) AND ((c.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))))));
CREATE POLICY "Delete unidades via empreendimento" ON public.construtora_unidades AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (construtora_empreendimentos e
     JOIN construtoras c ON ((c.id = e.construtora_id)))
  WHERE ((e.id = construtora_unidades.empreendimento_id) AND ((c.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))))));
CREATE POLICY "Insert unidades via empreendimento" ON public.construtora_unidades AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM (construtora_empreendimentos e
     JOIN construtoras c ON ((c.id = e.construtora_id)))
  WHERE ((e.id = construtora_unidades.empreendimento_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Read unidades via empreendimento" ON public.construtora_unidades AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (construtora_empreendimentos e
     JOIN construtoras c ON ((c.id = e.construtora_id)))
  WHERE ((e.id = construtora_unidades.empreendimento_id) AND ((c.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role))))));
CREATE POLICY "Update unidades via empreendimento" ON public.construtora_unidades AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (construtora_empreendimentos e
     JOIN construtoras c ON ((c.id = e.construtora_id)))
  WHERE ((e.id = construtora_unidades.empreendimento_id) AND ((c.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))))));
CREATE POLICY "Users delete own construtoras" ON public.construtoras AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users insert own construtoras" ON public.construtoras AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read own construtoras" ON public.construtoras AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Users update own construtoras" ON public.construtoras AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users delete own edificios" ON public.edificios AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users insert own edificios" ON public.edificios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read own edificios" ON public.edificios AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Users update own edificios" ON public.edificios AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users delete own empreendimentos" ON public.empreendimentos AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users insert own empreendimentos" ON public.empreendimentos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read own empreendimentos" ON public.empreendimentos AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Users update own empreendimentos" ON public.empreendimentos AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users can add their own favorites" ON public.favorites AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can remove their own favorites" ON public.favorites AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own favorites" ON public.favorites AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Authenticated reads active site properties" ON public.imoveis AS PERMISSIVE FOR SELECT TO authenticated USING (((ativo_site = true) AND (has_role(user_id, 'super_admin'::app_role) OR has_role(user_id, 'admin_staff'::app_role) OR imovel_owner_has_active_sub(user_id))));
CREATE POLICY "Public reads active properties" ON public.imoveis AS PERMISSIVE FOR SELECT TO anon USING (((ativo_site = true) AND (has_role(user_id, 'super_admin'::app_role) OR has_role(user_id, 'admin_staff'::app_role) OR imovel_owner_has_active_sub(user_id))));
CREATE POLICY "Super admin can insert any imovel" ON public.imoveis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users delete own imoveis" ON public.imoveis AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users insert own imoveis" ON public.imoveis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read own imoveis" ON public.imoveis AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Users update own imoveis" ON public.imoveis AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Authenticated users insert logs" ON public.imovel_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read logs of own properties" ON public.imovel_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM imoveis
  WHERE ((imoveis.id = imovel_logs.imovel_id) AND ((imoveis.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role))))));
CREATE POLICY "Users delete own implantacoes" ON public.implantacoes AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Users insert own implantacoes" ON public.implantacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read own implantacoes" ON public.implantacoes AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Users update own implantacoes" ON public.implantacoes AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Staff reads job_roles" ON public.job_roles AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin_staff'::app_role));
CREATE POLICY "Super admin manages job_roles" ON public.job_roles AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Anyone can read partner ratings" ON public.partner_ratings AS PERMISSIVE FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY "Authenticated insert own rating" ON public.partner_ratings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = rater_id));
CREATE POLICY "Delete own rating or admin" ON public.partner_ratings AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = rater_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Update own rating" ON public.partner_ratings AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = rater_id));
CREATE POLICY "Anyone can read active partners" ON public.partners AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Partner manages own row" ON public.partners AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Super admin manages partners" ON public.partners AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins manage payments" ON public.payments AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role))) WITH CHECK ((has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Anyone can read active plans" ON public.plans AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Super admin manages plans" ON public.plans AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Authenticated users read all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "System inserts profile" ON public.profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admin manages site config" ON public.site_config AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role))) WITH CHECK ((has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Anyone can read site_config" ON public.site_config AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Brokers manage own page config" ON public.site_config AS PERMISSIVE FOR ALL TO authenticated USING (((config_type = ANY (ARRAY['broker_page'::text, 'partner_page'::text])) AND (owner_id = (auth.uid())::text))) WITH CHECK (((config_type = ANY (ARRAY['broker_page'::text, 'partner_page'::text])) AND (owner_id = (auth.uid())::text)));
CREATE POLICY "Brokers manage own page config by slug" ON public.site_config AS PERMISSIVE FOR ALL TO authenticated USING (((config_type = ANY (ARRAY['broker_page'::text, 'partner_page'::text])) AND owns_site_config_slug(owner_id))) WITH CHECK (((config_type = ANY (ARRAY['broker_page'::text, 'partner_page'::text])) AND owns_site_config_slug(owner_id)));
CREATE POLICY "Read own permissions" ON public.staff_permissions AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Super admin manages permissions" ON public.staff_permissions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins manage subscriber_brokers" ON public.subscriber_brokers AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role))) WITH CHECK ((has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Admins manage subscribers" ON public.subscribers AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role))) WITH CHECK ((has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_staff'::app_role)));
CREATE POLICY "Super admin manages payments" ON public.subscription_payments AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "System inserts payments" ON public.subscription_payments AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users read own payments" ON public.subscription_payments AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM subscriptions s
  WHERE ((s.id = subscription_payments.subscription_id) AND ((s.user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))))));
CREATE POLICY "Super admin manages subscriptions" ON public.subscriptions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "System inserts subscription" ON public.subscriptions AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users read own subscription" ON public.subscriptions AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Anyone authenticated can read system_options" ON public.system_options AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages system_options" ON public.system_options AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admin manages system_settings" ON public.system_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admin reads system_settings" ON public.system_settings AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admin manages roles" ON public.user_roles AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users read own role" ON public.user_roles AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role)));
