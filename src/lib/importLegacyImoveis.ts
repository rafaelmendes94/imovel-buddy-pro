// Layout legado (planilha em português: EMPREENDIMENTO, TIPO, VALOR, ...)

export const LEGACY_COLUMN_MAP: Record<string, string> = {
  EMPREENDIMENTO: "empreendimento",
  TIPO: "tipo",
  "N° APTO QUADRA   LOTE": "unidade",
  "N° APTO QUADRA LOTE": "unidade",
  BOX: "box",
  DORMITORIOS: "quartos",
  "M²": "area",
  "ANO CONSTRUÇÃO": "descricao (ano)",
  "FRENTE   FUNDOS LATERAL": "posicao_predio",
  "FRENTE FUNDOS LATERAL": "posicao_predio",
  "MOBILIADO DECORADO": "decorado",
  BAIRRO: "bairro",
  RUA: "endereco",
  VALOR: "preco",
  "CONDIÇÃO PAGAMENTO": "condicoes_pagamento",
  "CHAVES         OBRA": "local_chaves",
  "CHAVES OBRA": "local_chaves",
  "PROPRIETARIO NUMERO": "proprietario",
  "NUMERO PROPRIETARIO": "proprietario_telefone",
  "CIDADE DO PROPRIETARIO": "cidade",
};

const parseQuartos = (s: string) => {
  const m = String(s || "").match(/(\d+)\s*D/i);
  return m ? parseInt(m[1]) : 0;
};

const parseArea = (s: any) => {
  const n = parseFloat(String(s || "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

const parsePreco = (s: any) => {
  const n = parseFloat(String(s || "").replace(/\./g, "").replace(",", "."));
  if (isNaN(n)) return 0;
  return n < 10000 ? n * 1000 : n;
};

const normalizeTipo = (t: string) => {
  const v = String(t || "").trim().toUpperCase();
  if (v === "AP" || v.includes("APART")) return "Apartamento";
  if (v.includes("CASA")) return "Casa";
  if (v.includes("SOBRADO")) return "Sobrado";
  if (v.includes("LOTE") || v.includes("TERRENO")) return "Terreno";
  if (v.includes("COMERC")) return "Comercial";
  return v || "Apartamento";
};

export const mapLegacyRow = (row: any, userId: string) => {
  const get = (col: string) => row[col] ?? "";
  const tipo = normalizeTipo(get("TIPO"));
  const emp = String(get("EMPREENDIMENTO") || "").trim();
  const unidade = String(get("N° APTO QUADRA   LOTE") || get("N° APTO QUADRA LOTE") || "").trim();
  const decoradoRaw = String(get("MOBILIADO DECORADO") || "").toUpperCase();
  const condPag = String(get("CONDIÇÃO PAGAMENTO") || "").trim();
  const ano = String(get("ANO CONSTRUÇÃO") || "").trim();

  return {
    user_id: userId,
    titulo: emp || `${tipo} ${unidade}`.trim() || "Imóvel importado",
    tipo,
    empreendimento: emp,
    unidade,
    box: String(get("BOX") || "").trim(),
    quartos: parseQuartos(get("DORMITORIOS")),
    suites: 0,
    banheiros: 0,
    area: parseArea(get("M²")),
    area_privativa: 0,
    vagas: 0,
    lavabo: 0,
    posicao_predio: String(get("FRENTE   FUNDOS LATERAL") || get("FRENTE FUNDOS LATERAL") || "").trim(),
    decorado: decoradoRaw.includes("DEC") || decoradoRaw.includes("MOB"),
    bairro: String(get("BAIRRO") || "").trim(),
    endereco: String(get("RUA") || "").trim(),
    preco: parsePreco(get("VALOR")),
    condicoes_pagamento: condPag ? [condPag] : [],
    local_chaves: String(get("CHAVES         OBRA") || get("CHAVES OBRA") || "").trim(),
    proprietario: String(get("PROPRIETARIO NUMERO") || "").trim(),
    proprietario_telefone: String(get("NUMERO PROPRIETARIO") || "").trim(),
    cidade: String(get("CIDADE DO PROPRIETARIO") || "").trim(),
    descricao: ano ? `OBSERVAÇÕES\n• Ano de construção: ${ano}` : "",
    status: "Disponível",
    ativo_site: false,
    vista_mar: false,
    aceita_permuta: false,
    destaque_home: false,
  };
};

export const validateLegacyRow = (mapped: any) => {
  const reasons: string[] = [];
  if (!mapped.cidade) reasons.push("Cidade não identificada");
  if (!mapped.preco) reasons.push("preço inválido");
  if (!mapped.titulo) reasons.push("sem identificação");
  return { ok: reasons.length === 0, reasons };
};
