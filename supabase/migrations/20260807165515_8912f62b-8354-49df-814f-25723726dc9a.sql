-- 1. Helper to resolve the caller's agency without recursive RLS on profiles
CREATE OR REPLACE FUNCTION public.current_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.agency_id FROM public.profiles p WHERE p.user_id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.current_agency_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_agency_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_agency_id() TO authenticated, service_role;

-- 2. profiles: scope reads to self / agency / admins
DROP POLICY IF EXISTS "Authenticated users read all profiles" ON public.profiles;
CREATE POLICY "Users read own or related profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin_staff')
  OR agency_id = auth.uid()
  OR user_id = public.current_agency_id()
  OR (agency_id IS NOT NULL AND agency_id = public.current_agency_id())
);

DROP POLICY IF EXISTS "System inserts profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Public broker directory: only non-sensitive, intentionally public columns
DROP VIEW IF EXISTS public.public_broker_profiles;
CREATE VIEW public.public_broker_profiles
WITH (security_invoker = false) AS
  SELECT user_id, full_name, phone, avatar_url, ratings_public
  FROM public.profiles;
GRANT SELECT ON public.public_broker_profiles TO anon, authenticated;

-- 4. Remove always-true INSERT policies
DROP POLICY IF EXISTS "System inserts subscription" ON public.subscriptions;
CREATE POLICY "Users insert own subscription"
ON public.subscriptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System inserts payments" ON public.subscription_payments;
CREATE POLICY "Owners insert own subscription payments"
ON public.subscription_payments FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.subscriptions s
  WHERE s.id = subscription_id AND s.user_id = auth.uid()
));

-- 5. Hide property owner PII from anonymous visitors (column-level privileges)
REVOKE SELECT ON public.imoveis FROM anon;
GRANT SELECT (
  id, user_id, titulo, endereco, cidade, tipo, preco, quartos, banheiros, area,
  descricao, status, imagens, created_at, updated_at, destaque_home, empreendimento,
  unidade, box, quadra, lote, vagas, area_privativa, vista_mar, decorado,
  aceita_permuta, ativo_site, bairro, condicoes_pagamento, condicao, padrao,
  posicao_predio, posicao_solar, vista, local_chaves, termo_exclusividade,
  infraestrutura, outras_caracteristicas, comissao, bonus, bonus_validade,
  preco_parcelado, elevadores, destaque_categoria, latitude, longitude,
  edificio_id, condominio_id, empreendimento_id, corretor_id, corretor_nome,
  imobiliaria_nome, cep, numero, complemento, estado, link_video, link_material,
  link_360, views, lavabo, plataforma_venda, data_venda, termo_exclusividade_url,
  drive_fotos_url, fotos_pdf_url, publicar_xml
) ON public.imoveis TO anon;

-- 6. Hide marketplace seller phone from anonymous visitors
REVOKE SELECT ON public.brick_items FROM anon;
GRANT SELECT (
  id, user_id, titulo, descricao, preco, categoria, estado, cidade,
  imagens, vendido, created_at, updated_at
) ON public.brick_items TO anon;

-- 7. Storage: ownership checks for implantacoes and tabelas
DROP POLICY IF EXISTS "Auth users delete implantacoes" ON storage.objects;
CREATE POLICY "Owners delete implantacoes"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'implantacoes'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
);

DROP POLICY IF EXISTS "Auth users upload implantacoes" ON storage.objects;
CREATE POLICY "Owners upload implantacoes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'implantacoes' AND owner = auth.uid());

DROP POLICY IF EXISTS "Auth users insert tabelas" ON storage.objects;
CREATE POLICY "Owners insert tabelas"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tabelas' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owners update tabelas" ON storage.objects;
CREATE POLICY "Owners update tabelas"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'tabelas'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
)
WITH CHECK (
  bucket_id = 'tabelas'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
);

-- 8. Public buckets: stop anonymous file listing (public URLs keep working)
DROP POLICY IF EXISTS "Anyone can read site assets" ON storage.objects;
CREATE POLICY "Auth users read site assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Anyone reads city photos" ON storage.objects;
CREATE POLICY "Auth users read city photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'city-photos');

DROP POLICY IF EXISTS "Anyone reads implantacoes" ON storage.objects;
CREATE POLICY "Auth users read implantacoes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'implantacoes');

DROP POLICY IF EXISTS "Public read access on tabelas" ON storage.objects;
CREATE POLICY "Auth users read tabelas"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'tabelas');

-- 9. SECURITY DEFINER functions: least-privilege EXECUTE
REVOKE EXECUTE ON FUNCTION public.count_imoveis_in_subscription(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.count_imoveis_in_subscription(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_effective_subscription(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_effective_subscription(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_site_config_slug(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owns_site_config_slug(text) FROM anon;

REVOKE EXECUTE ON FUNCTION public.simulate_subscription_status(uuid, public.subscription_status) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.simulate_subscription_status(uuid, public.subscription_status) FROM anon;
REVOKE EXECUTE ON FUNCTION public.simulate_subscription_status(uuid, public.subscription_status) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.test_lifecycle_flow(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.test_lifecycle_flow(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.test_lifecycle_flow(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.simulate_payment_approval(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.simulate_payment_approval(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.link_broker_to_agency(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_broker_to_agency(text, uuid) FROM anon;