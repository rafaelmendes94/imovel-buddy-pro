-- Catálogo público seguro para visitantes e usuários autenticados.
-- A tabela base continua disponível por completo somente ao dono e à equipe autorizada.
DROP POLICY IF EXISTS "Authenticated reads active site properties" ON public.imoveis;
DROP POLICY IF EXISTS "Public reads active properties" ON public.imoveis;
REVOKE SELECT ON public.imoveis FROM anon;

DROP VIEW IF EXISTS public.public_imoveis;
CREATE VIEW public.public_imoveis
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  i.id,
  i.user_id,
  i.titulo,
  i.endereco,
  i.cidade,
  i.tipo,
  i.preco,
  i.quartos,
  i.suites,
  i.banheiros,
  i.area,
  i.descricao,
  i.status,
  i.imagens,
  i.created_at,
  i.updated_at,
  i.destaque_home,
  i.empreendimento,
  i.unidade,
  i.box,
  i.quadra,
  i.lote,
  i.vagas,
  i.area_privativa,
  i.vista_mar,
  i.decorado,
  i.aceita_permuta,
  i.ativo_site,
  i.bairro,
  i.condicoes_pagamento,
  i.condicao,
  i.padrao,
  i.posicao_predio,
  i.posicao_solar,
  i.vista,
  i.termo_exclusividade,
  i.infraestrutura,
  i.outras_caracteristicas,
  i.preco_parcelado,
  i.elevadores,
  i.destaque_categoria,
  i.latitude,
  i.longitude,
  i.edificio_id,
  i.condominio_id,
  i.empreendimento_id,
  i.corretor_id,
  i.corretor_cadastro_id,
  i.corretor_nome,
  i.imobiliaria_nome,
  i.cep,
  i.numero,
  i.complemento,
  i.estado,
  i.link_video,
  i.link_material,
  i.link_360,
  i.views,
  i.lavabo,
  i.plataforma_venda,
  i.data_venda,
  i.termo_exclusividade_url,
  i.drive_fotos_url,
  i.fotos_pdf_url,
  CASE WHEN e.id IS NULL THEN NULL ELSE jsonb_build_object(
    'nome', e.nome,
    'endereco', e.endereco,
    'numero', e.numero,
    'complemento', e.complemento,
    'bairro', e.bairro,
    'cidade', e.cidade,
    'estado', e.estado,
    'cep', e.cep,
    'latitude', e.latitude,
    'longitude', e.longitude
  ) END AS edificios,
  CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object(
    'nome', c.nome,
    'endereco', c.endereco,
    'numero', c.numero,
    'complemento', c.complemento,
    'bairro', c.bairro,
    'cidade', c.cidade,
    'estado', c.estado,
    'cep', c.cep,
    'latitude', c.latitude,
    'longitude', c.longitude,
    'mapa_pdf_url', c.mapa_pdf_url,
    'implantacao_url', c.implantacao_url
  ) END AS condominios,
  CASE WHEN ep.id IS NULL THEN NULL ELSE jsonb_build_object(
    'nome', ep.nome,
    'endereco', ep.endereco,
    'numero', ep.numero,
    'complemento', ep.complemento,
    'bairro', ep.bairro,
    'cidade', ep.cidade,
    'estado', ep.estado,
    'cep', ep.cep,
    'latitude', ep.latitude,
    'longitude', ep.longitude
  ) END AS empreendimentos
FROM public.imoveis i
LEFT JOIN public.edificios e ON e.id = i.edificio_id
LEFT JOIN public.condominios c ON c.id = i.condominio_id
LEFT JOIN public.empreendimentos ep ON ep.id = i.empreendimento_id
WHERE i.ativo_site = true
  AND lower(coalesce(i.status, '')) NOT IN (
    'suspenso',
    'pré-importação',
    'pre-importação',
    'pré importação',
    'pre importação',
    'inativo',
    'arquivado'
  )
  AND (
    public.has_role(i.user_id, 'super_admin'::public.app_role)
    OR public.has_role(i.user_id, 'admin_staff'::public.app_role)
    OR public.imovel_owner_has_active_sub(i.user_id)
  );

REVOKE ALL ON public.public_imoveis FROM PUBLIC;
GRANT SELECT ON public.public_imoveis TO anon, authenticated;

COMMENT ON VIEW public.public_imoveis IS
  'Campos públicos de imóveis publicados, sem dados internos de proprietário, chaves, comissão, bônus ou XML.';
