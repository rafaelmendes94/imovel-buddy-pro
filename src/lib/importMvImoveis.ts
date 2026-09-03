// Contrato oficial de dados: Dicionario_Importacao_MV_Broker.xlsx (abas Mapeamento, Regras, Exemplos).
// Mapeia o layout normalizado "MV" para os campos EXISTENTES da tabela imoveis.
// Nenhuma coluna nova é criada no banco; auditoria vive em import_logs.

export const MV_COLUMN_MAP: Record<string, string> = {
  source_id: "auditoria (import_logs)",
  source_row: "auditoria (import_logs)",
  import_approved: "controle de importação",
  review_required: "controle de importação",
  review_reasons: "motivos de revisão",
  status: "status (novo = Disponível)",
  property_name: "empreendimento",
  property_type: "tipo",
  property_type_raw: "tipo (fallback / auditoria)",
  source_group: "padrao (PREMIUM → Alto Padrão)",
  unit_reference: "unidade ou quadra + lote",
  city: "cidade",
  neighborhood: "bairro",
  street_raw: "endereco",
  location_raw: "auditoria de localização",
  location_confidence: "confiança (baixa → revisar)",
  price_brl: "preco",
  price_raw: "auditoria de preço",
  price_rule: "auditoria de preço",
  bedrooms: "quartos",
  suites: "suites",
  rooms_raw: "auditoria de quartos",
  area_m2: "area",
  area_raw: "auditoria de área",
  parking_spaces: "vagas",
  parking_raw: "box",
  construction_year: "descricao (ano de construção)",
  year_iptu_raw: "descricao (observações)",
  position_solar_raw: "posicao_solar",
  furnished: "condicao",
  decorated: "decorado",
  furniture_raw: "condicao (desambiguação)",
  highlights: "descricao (destaques)",
  bank_financing: "condicoes_pagamento",
  bank_financing_raw: "condicoes_pagamento (auditoria)",
  entry_percent: "condicoes_pagamento",
  entry_value_brl: "condicoes_pagamento",
  entry_raw: "condicoes_pagamento (auditoria)",
  direct_installments: "condicoes_pagamento",
  direct_term_raw: "condicoes_pagamento (auditoria)",
  payment_terms: "condicoes_pagamento",
  condo_iptu_raw: "descricao (despesas)",
  included_at: "created_at",
  updated_at: "updated_at",
  weekly_flag: "auditoria",
  contact_name: "proprietario",
  contact_phone: "proprietario_telefone",
  contact_phone_raw: "proprietario_telefone (fallback)",
  contact_extra_raw: "termo_exclusividade / observação",
  keys_access: "local_chaves",
  internal_notes: "descricao (observações)",
  fingerprint: "deduplicação (possível)",
  exact_fingerprint: "deduplicação (exata)",
};

export const isMvLayout = (headers: string[]) =>
  headers.includes("property_name") || headers.includes("exact_fingerprint");

/** Estado padrão da base atual de importação (RS). Centralizado para futuras importações. */
export const DEFAULT_IMPORT_ESTADO = "RS";

const BLANKS = new Set(["", "X", "XX", "-", "--", "N/A", "NA", "NAN", "NULL", "UNDEFINED", "NONE", "?"]);

const txt = (v: any) => {
  const s = String(v ?? "").trim().replace(/\s+/g, " ");
  return BLANKS.has(s.toUpperCase()) ? "" : s;
};

const num = (v: any) => {
  const s = String(v ?? "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const int = (v: any) => {
  const n = Math.round(num(v));
  return n > 0 ? n : 0;
};

const bool = (v: any) => {
  if (v === true) return true;
  const s = String(v ?? "").trim().toUpperCase();
  return s === "1" || s === "1.0" || s === "TRUE" || s === "SIM" || s === "VERDADEIRO";
};

const isFalse = (v: any) => {
  if (v === false) return true;
  const s = String(v ?? "").trim().toUpperCase();
  return s === "0" || s === "0.0" || s === "FALSE" || s === "NAO" || s === "NÃO";
};

const deaccent = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const LOWER_WORDS = new Set(["da", "de", "do", "das", "dos", "e", "d'"]);

/** CAPÃO DA CANOA → Capão da Canoa */
export const titleCase = (s: string) =>
  txt(s)
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((w, i) => (i > 0 && LOWER_WORDS.has(w) ? w : w.charAt(0).toLocaleUpperCase("pt-BR") + w.slice(1)))
    .join(" ");

const STREET_RE = /^(RUA|R\.|AV|AV\.|AVENIDA|TRAVESSA|TV\.|ESTRADA|ROD|RODOVIA|ALAMEDA|BECO|PRACA|PRAÇA)\b/;

/** "PREMIUM" e variações nunca podem virar título/empreendimento. */
const FORBIDDEN_NAMES = new Set(["PREMIUM", "PADRAO", "PADRÃO", "SEMANAL", "GERAL", "LISTA"]);

export const isForbiddenName = (s: string) => FORBIDDEN_NAMES.has(deaccent(txt(s)).toUpperCase());

export const normalizeEmpreendimento = (row: any) => {
  const name = txt(row.property_name);
  if (!name || isForbiddenName(name)) return "";
  return name;
};

export const normalizeMvTipo = (row: any) => {
  const v = deaccent(`${txt(row.property_type)} ${txt(row.property_type_raw)}`).toUpperCase();
  if (v.includes("APART") || /\bAPTO?\b/.test(v) || /\bAP\b/.test(v)) return "Apartamento";
  if (v.includes("SOBRADO") || v.includes("CASA")) return "Casa";
  if (v.includes("COND")) return "Condomínio";
  if (v.includes("LOTE")) return "Lote";
  if (v.includes("TERRENO")) return "Terreno";
  if (v.includes("COMERC") || v.includes("SALA") || v.includes("LOJA")) return "Comercial";
  return "";
};

const isLoteType = (tipo: string) => tipo === "Lote" || tipo === "Terreno" || tipo === "Condomínio";
/** Tipos cuja referência pode ser "Quadra/Lote" (inclui casas de condomínio). */
const isQuadraLoteType = (tipo: string) => isLoteType(tipo) || tipo === "Casa" || tipo === "Sobrado";

/** AP:1304 / APTO 1304 / UNIDADE 1304 → 1304 · preserva sufixos reais (309 A). */
export const cleanUnidade = (ref: string) => {
  let s = txt(ref);
  if (!s) return "";
  s = s.replace(/^(APARTAMENTO|APTO?|AP|UNIDADE|UND|UN|SALA|LOJA)\s*[:.\-–]?\s*/i, "");
  s = s.replace(/^(N[ºo°]?|NUMERO|NÚMERO)\s*[:.\-]?\s*/i, "");
  return s.replace(/\.$/, "").trim();
};

/** Separa "H-17", "H 17", "H/17" em quadra/lote. Retorna ok=false quando não é seguro. */
export const splitQuadraLote = (ref: string) => {
  const s = txt(ref).replace(/\b(QD|QUADRA)\b\s*/i, "").replace(/\b(LT|LOTE)\b\s*/i, "-");
  const m = s.match(/^([A-Za-z]{1,3}|\d{1,3})\s*[-/ ]\s*(\d{1,4}[A-Za-z]?)$/);
  return m ? { quadra: m[1].toUpperCase(), lote: m[2], ok: true } : { quadra: "", lote: "", ok: false };
};

/** Remove rótulo "Box"/"BOX" preservando referências múltiplas ("119 e 120." → "119 e 120"). */
export const cleanBox = (v: any) => {
  const s = txt(v).replace(/\b(BOX(ES)?|VAGA(S)?)\b\s*[:.\-]?\s*/gi, "").replace(/\.$/, "").trim();
  return /^\d+\s*(vaga|carro)/i.test(txt(v)) ? "" : s;
};

/** price_brl é a fonte definitiva. price_raw/price_rule apenas auditoria. */
const normalizePreco = (row: any) => {
  const brl = num(row.price_brl);
  if (brl > 0) return brl;
  return 0;
};

const normalizeTelefone = (row: any) => {
  const digits = String(row.contact_phone ?? row.contact_phone_raw ?? "").replace(/\D/g, "");
  const local = digits.length > 11 ? digits.slice(-11) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return txt(row.contact_phone) || txt(row.contact_phone_raw);
};

/** furnished=false só vira "Vazio" com confirmação no dado bruto. */
const normalizeCondicao = (row: any) => {
  const f = deaccent(txt(row.furniture_raw)).toUpperCase();
  if (f.includes("SEMI")) return "Semi-mobiliado";
  if (bool(row.furnished) || /\bMOB/.test(f) || f.includes("DECOR")) return "Mobiliado";
  if (f.includes("VAZIO") || f.includes("SEM MOBILIA") || (isFalse(row.furnished) && f.includes("SEM")))
    return "Vazio";
  return "";
};

const isDecorado = (row: any) => {
  const f = deaccent(txt(row.furniture_raw)).toUpperCase();
  return bool(row.decorated) || f.includes("DECOR");
};

const SOLAR = ["Norte", "Sul", "Leste", "Oeste"];
export const normalizePosicaoSolar = (v: any) => {
  const s = deaccent(txt(v)).toUpperCase();
  if (!s) return "";
  const parts = SOLAR.filter((p) => s.includes(deaccent(p).toUpperCase()));
  return parts.length ? parts.join("/") : txt(v);
};

/** area <= 0 é tratado como não informado. */
const normalizeArea = (row: any) => {
  const a = num(row.area_m2);
  return a > 0 ? a : 0;
};

export const condicoesPagamento = (row: any): string[] => {
  const out: string[] = [];
  const push = (s: string) => { const v = txt(s); if (v && !out.includes(v)) out.push(v); };
  const pct = num(row.entry_percent);
  const entrada = num(row.entry_value_brl);
  const parcelas = int(row.direct_installments);
  if (pct > 0) push(`Entrada de ${pct % 1 === 0 ? pct : pct.toFixed(1)}%`);
  else if (entrada > 0) push(`Entrada de R$ ${entrada.toLocaleString("pt-BR")}`);
  else push(txt(row.entry_raw));
  if (parcelas > 0) push(`Saldo em até ${parcelas}x`);
  else push(txt(row.direct_term_raw));
  if (bool(row.bank_financing)) push("Aceita financiamento bancário");
  else if (isFalse(row.bank_financing)) push("Não aceita financiamento bancário");
  else push(txt(row.bank_financing_raw));
  push(txt(row.payment_terms));
  return out.slice(0, 8);
};

export const buildDescricao = (row: any) => {
  const blocks: string[] = [];
  const destaques: string[] = [];
  const obs: string[] = [];
  const ano = txt(row.construction_year) || txt(row.year_iptu_raw);

  if (txt(row.highlights)) destaques.push(txt(row.highlights));
  if (ano) obs.push(`Ano de construção: ${ano}`);
  if (txt(row.condo_iptu_raw)) obs.push(`Despesas (condomínio/IPTU): ${txt(row.condo_iptu_raw)}`);
  if (txt(row.internal_notes)) obs.push(txt(row.internal_notes));
  const extra = deaccent(txt(row.contact_extra_raw)).toUpperCase();
  if (txt(row.contact_extra_raw) && !extra.includes("EXC")) obs.push(`Contato: ${txt(row.contact_extra_raw)}`);
  if (txt(row.source_id)) obs.push(`Referência de origem: ${txt(row.source_id)}`);

  const pagamento = condicoesPagamento(row);

  if (destaques.length) blocks.push(`DESTAQUES\n${destaques.map((d) => `• ${d}`).join("\n")}`);
  if (pagamento.length) blocks.push(`CONDIÇÕES DE PAGAMENTO\n${pagamento.map((d) => `• ${d}`).join("\n")}`);
  if (obs.length) blocks.push(`OBSERVAÇÕES\n${obs.map((d) => `• ${d}`).join("\n")}`);
  return blocks.join("\n\n");
};

const aceitaPermuta = (row: any) => {
  const s = deaccent(`${txt(row.payment_terms)} ${txt(row.highlights)}`).toUpperCase();
  return /PERMUT|VEICULO|CARRO|PEGA IMOVEL|DACAO/.test(s);
};

/** Converte serial do Excel / dd/mm/yyyy / ISO em ISO string. Null quando inválido. */
export const parseExcelDate = (v: any): string | null => {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
  const s = String(v).trim();
  if (/^\d{4,5}(\.\d+)?$/.test(s)) {
    const serial = parseFloat(s);
    const ms = Math.round((serial - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return new Date(`${br[3]}-${br[2]}-${br[1]}T12:00:00Z`).toISOString();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

/** Bairro só aceita bairro; rua/avenida vai para revisão. */
export const bairroLooksLikeStreet = (row: any) => {
  const b = deaccent(txt(row.neighborhood)).toUpperCase();
  if (!b) return false;
  if (STREET_RE.test(b)) return true;
  const st = deaccent(txt(row.street_raw)).toUpperCase();
  return !!st && st === b;
};

/** Título comercial do anúncio, separado do empreendimento. */
export const buildTitulo = (row: any, tipo: string) => {
  const cidade = titleCase(row.city);
  const base = `${tipo.toLocaleUpperCase("pt-BR")} À VENDA`;
  return cidade ? `${base} - ${cidade}` : base;
};

export interface MvValidation {
  ok: boolean;
  reasons: string[];
}

export const validateMvRow = (row: any): MvValidation => {
  const reasons: string[] = [];
  if (bool(row.review_required)) reasons.push(txt(row.review_reasons) || "revisão pendente");
  if (row.import_approved !== undefined && !bool(row.import_approved))
    reasons.push("não aprovada (import_approved)");
  if (!txt(row.city)) reasons.push("Cidade não identificada");
  if (normalizePreco(row) <= 0) reasons.push("preço inválido (price_brl)");
  const tipo = normalizeMvTipo(row);
  if (!tipo) reasons.push("Tipo precisa ser revisado");
  const ref = txt(row.unit_reference);
  if (isLoteType(tipo) && ref && !splitQuadraLote(ref).ok) reasons.push("quadra/lote não identificados");
  if (bairroLooksLikeStreet(row)) reasons.push("bairro parece endereço (revisar)");
  if (num(row.area_m2) < 0) reasons.push("área inválida");
  const conf = deaccent(txt(row.location_confidence)).toUpperCase();
  if (conf === "BAIXA" || conf === "LOW") reasons.push("localização de baixa confiança");
  if (isForbiddenName(row.property_name)) reasons.push("nome do empreendimento inválido (PREMIUM)");
  return { ok: reasons.length === 0, reasons };
};

/** Função central de normalização — usar SEMPRE antes de insert/update. */
export const mapMvRow = (row: any, userId: string, estado = DEFAULT_IMPORT_ESTADO) => {
  const tipo = normalizeMvTipo(row) || "Apartamento";
  const emp = normalizeEmpreendimento(row);
  const ref = txt(row.unit_reference);
  const lote = isQuadraLoteType(tipo);
  // Colunas explícitas do dicionário têm prioridade sobre a leitura de unit_reference.
  const quadraCol = txt(row.quadra) || txt(row.block);
  const loteCol = txt(row.lote) || txt(row.lot);
  const parsed = lote ? splitQuadraLote(ref) : { quadra: "", lote: "", ok: false };
  const split = quadraCol || loteCol
    ? { quadra: quadraCol.toUpperCase(), lote: loteCol, ok: true }
    : parsed;
  const unidade = split.ok ? "" : cleanUnidade(ref);
  const exclusividade = deaccent(`${txt(row.contact_extra_raw)} ${txt(row.keys_access)}`).toUpperCase();
  const createdAt = parseExcelDate(row.included_at);
  const updatedAt = parseExcelDate(row.updated_at);
  const numero = txt(row.street_number) || txt(row.number);
  const rua = bairroLooksLikeStreet(row) && !txt(row.street_raw) ? txt(row.neighborhood) : txt(row.street_raw);
  const endereco = [rua || txt(row.location_raw), numero].filter(Boolean).join(", ");
  const bairro = bairroLooksLikeStreet(row) ? "" : titleCase(row.neighborhood);
  const semExc = /SEM\s*EXC/.test(exclusividade);
  const comExc = !semExc && /\bEXCLUSIV|COM\s*EXC/.test(exclusividade);

  return {
    user_id: userId,
    titulo: buildTitulo(row, tipo),
    tipo,
    status: "Disponível",
    empreendimento: emp,
    unidade,
    quadra: split.quadra,
    lote: split.lote,
    box: cleanBox(row.parking_raw),
    cidade: titleCase(row.city),
    bairro,
    endereco,
    numero,
    estado,
    preco: normalizePreco(row),
    quartos: int(row.bedrooms),
    suites: int(row.suites),
    banheiros: 0,
    lavabo: 0,
    vagas: int(row.parking_spaces),
    area: normalizeArea(row),
    area_privativa: 0,
    padrao: deaccent(txt(row.source_group)).toUpperCase() === "PREMIUM" ? "Alto Padrão" : "",
    posicao_solar: normalizePosicaoSolar(row.position_solar_raw),
    condicao: normalizeCondicao(row),
    decorado: isDecorado(row),
    vista_mar: false,
    aceita_permuta: aceitaPermuta(row),
    condicoes_pagamento: condicoesPagamento(row),
    proprietario: txt(row.contact_name),
    proprietario_telefone: normalizeTelefone(row),
    local_chaves: txt(row.keys_access),
    termo_exclusividade: semExc ? "Não" : comExc ? "Sim" : "",
    descricao: buildDescricao(row),
    imagens: [] as string[],
    ativo_site: false,
    publicar_xml: true,
    destaque_home: false,
    ...(createdAt ? { created_at: createdAt } : {}),
    ...(updatedAt ? { updated_at: updatedAt } : {}),
  };
};

/** Campos que só devem sobrescrever o banco quando o Excel traz valor válido. */
export const mergePreservingExisting = <T extends Record<string, any>>(existing: T, incoming: T): T => {
  const out: Record<string, any> = { ...existing };
  Object.entries(incoming).forEach(([k, v]) => {
    if (k === "banheiros" || k === "user_id" || k === "id" || k === "created_at" || k === "views") return;
    const empty =
      v === null ||
      v === undefined ||
      v === "" ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === "number" && v === 0) ||
      (typeof v === "string" && BLANKS.has(v.trim().toUpperCase()));
    if (!empty) out[k] = v;
  });
  return out as T;
};
