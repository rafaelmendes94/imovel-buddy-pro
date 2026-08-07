/**
 * Colunas de `imoveis` liberadas para visitantes não autenticados.
 *
 * Os campos do proprietário (`proprietario`, `proprietario_telefone`,
 * `proprietario_tipo`) são dados pessoais e ficam restritos a usuários
 * autenticados no banco, portanto NÃO podem ser pedidos em páginas públicas
 * (usar `select("*")` numa página pública causa erro de permissão).
 */
export const PUBLIC_IMOVEL_COLUMNS = [
  "id", "user_id", "titulo", "endereco", "cidade", "tipo", "preco", "quartos",
  "suites", "banheiros", "area", "descricao", "status", "imagens", "created_at",
  "updated_at", "destaque_home", "empreendimento", "unidade", "box", "quadra",
  "lote", "vagas", "area_privativa", "vista_mar", "decorado", "aceita_permuta",
  "ativo_site", "bairro", "condicoes_pagamento", "condicao", "padrao",
  "posicao_predio", "posicao_solar", "vista", "local_chaves",
  "termo_exclusividade", "infraestrutura", "outras_caracteristicas", "comissao",
  "bonus", "bonus_validade", "preco_parcelado", "elevadores",
  "destaque_categoria", "latitude", "longitude", "edificio_id", "condominio_id",
  "empreendimento_id", "corretor_id", "corretor_nome", "imobiliaria_nome",
  "cep", "numero", "complemento", "estado", "link_video", "link_material",
  "link_360", "views", "lavabo", "plataforma_venda", "data_venda",
  "termo_exclusividade_url", "drive_fotos_url", "fotos_pdf_url", "publicar_xml",
].join(", ");
