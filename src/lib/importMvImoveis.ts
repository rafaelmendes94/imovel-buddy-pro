// Mapeamento do layout normalizado "MV" (planilha com colunas source_id, property_name, etc.)
// para os campos EXISTENTES da tabela imoveis. Nenhum campo novo é criado.

export const MV_COLUMN_MAP: Record<string, string> = {
  property_name: "titulo / empreendimento",
  property_type: "tipo",
  property_type_raw: "tipo (fallback)",
  source_group: "padrao",
  unit_reference: "unidade / quadra+lote",
  city: "cidade",
  neighborhood: "bairro",
  street_raw: "endereco",
  price_brl: "preco",
  bedrooms: "quartos",
  suites: "suites",
  area_m2: "area",
  parking_spaces: "vagas",
  parking_raw: "box",
  position_solar_raw: "posicao_solar",
  furnished: "condicao",
  decorated: "decorado",
  furniture_raw: "condicao (fallback)",
  payment_terms: "condicoes_pagamento",
  entry_percent: "condicoes_pagamento",
  entry_value_brl: "condicoes_pagamento",
  entry_raw: "condicoes_pagamento",
  direct_installments: "condicoes_pagamento",
  direct_term_raw: "condicoes_pagamento",
  bank_financing: "condicoes_pagamento",
  bank_financing_raw: "condicoes_pagamento",
  contact_name: "proprietario",
  contact_phone: "proprietario_telefone",
  contact_phone_raw: "proprietario_telefone (fallback)",
  keys_access: "local_chaves",
  contact_extra_raw: "termo_exclusividade",
  construction_year: "descricao (ano de construção)",
  highlights: "descricao (destaques)",
  internal_notes: "descricao (observações)",
  condo_iptu_raw: "descricao (condomínio/IPTU)",
  included_at: "created_at",
  updated_at: "updated_at",
  status: "controle (status padrão = Disponível)",
  import_approved: "controle de importação",
  review_required: "controle de importação",
  review_reasons: "controle de importação",
  exact_fingerprint: "deduplicação (exata)",
  fingerprint: "deduplicação (possível)",
};

export const isMvLayout = (headers: string[]) =>
  headers.includes("property_name") || headers.includes("exact_fingerprint");

/** Estado padrão da base atual de importação (RS). Centralizado para futuras importações. */
export const DEFAULT_IMPORT_ESTADO = "RS";

const BLANKS = new Set(["", "X", "-", "--", "N/A", "NA", "NAN", "NULL", "UNDEFINED", "NONE"]);

const txt = (v: any) => {
  const s = String(v ?? "").trim().replace(/\s+/g, " ");
  return BLANKS.has(s.toUpperCase()) ? "" : s;
};

const num = (v: any) => {
  const s = String(v ?? "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
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

export const normalizeMvTipo = (row: any) => {
  const v = deaccent(`${txt(row.property_type)} ${txt(row.property_type_raw)}`).toUpperCase();
  if (v.includes("APART") || /\bAPTO?\b/.test(v)) return "Apartamento";
  if (v.includes("SOBRADO") || v.includes("CASA")) return "Casa";
  if (v.includes("COND")) return "Condomínio";
  if (v.includes("LOTE")) return "Lote";
  if (v.includes("TERRENO")) return "Terreno";
  if (v.includes("COMERC") || v.includes("SALA") || v.includes("LOJA")) return "Comercial";
  return "";
};

/** price_brl já vem tratado; usa-se como está. price_raw é apenas fallback/auditoria. */
const normalizePreco = (row: any) => {
  const brl = num(row.price_brl);
  if (brl > 0) return brl;
  const raw = num(row.price_raw);
  return raw > 0 && raw < 10000 ? raw * 1000 : raw;
};

const normalizeTelefone = (row: any) => {
  const digits = String(row.contact_phone ?? row.contact_phone_raw ?? "").replace(/\D/g, "");
  const local = digits.length > 11 ? digits.slice(-11) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return txt(row.contact_phone) || txt(row.contact_phone_raw);
};

const normalizeCondicao = (row: any) => {
  const f = deaccent(txt(row.furniture_raw)).toUpperCase();
  if (f.includes("SEMI")) return "Semi-mobiliado";
  if (bool(row.furnished) || /\bMOB/.test(f) || f.includes("DECOR")) return "Mobiliado";
  if (f.includes("VAZIO") || f.includes("SEM MOBILIA") || isFalse(row.furnished)) return "Vazio";
  return "";
};

const isDecorado = (row: any) => {
  const f = deaccent(txt(row.furniture_raw)).toUpperCase();
  return bool(row.decorated) || f.includes("DECOR");
};

/** Separa "H-17", "H 17", "H/17" em quadra/lote. Retorna ok=false quando não é seguro. */
export const splitQuadraLote = (ref: string) => {
  const m = ref.match(/^([A-Za-z]{1,3}|\d{1,3})\s*[-/ ]\s*(\d{1,4}[A-Za-z]?)$/);
  return m ? { quadra: m[1].toUpperCase(), lote: m[2], ok: true } : { quadra: "", lote: "", ok: false };
};

export const condicoesPagamento = (row: any): string[] => {
  const out: string[] = [];
  const push = (s: string) => { const v = txt(s); if (v && !out.includes(v)) out.push(v); };
  const pct = num(row.entry_percent);
  const entrada = num(row.entry_value_brl);
  const parcelas = Math.round(num(row.direct_installments));
  if (pct > 0) push(`Entrada de ${pct % 1 === 0 ? pct : pct.toFixed(1)}%`);
  else if (entrada > 0) push(`Entrada de R$ ${entrada.toLocaleString("pt-BR")}`);
  else push(txt(row.entry_raw));
  if (parcelas > 0) push(`Saldo em ${parcelas}x`);
  else push(txt(row.direct_term_raw));
  if (bool(row.bank_financing)) push("Aceita financiamento bancário");
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
  if (txt(row.condo_iptu_raw)) obs.push(`Condomínio/IPTU: ${txt(row.condo_iptu_raw)}`);
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

export interface MvValidation {
  ok: boolean;
  reasons: string[];
}

export const validateMvRow = (row: any): MvValidation => {
  const reasons: string[] = [];
  if (row.import_approved !== undefined && !bool(row.import_approved))
    reasons.push("não aprovada (import_approved)");
  if (bool(row.review_required)) reasons.push(txt(row.review_reasons) || "revisão pendente");
  if (!txt(row.city)) reasons.push("Cidade não identificada");
  if (normalizePreco(row) <= 0) reasons.push("preço inválido");
  if (!txt(row.property_name) && !txt(row.unit_reference)) reasons.push("sem identificação");
  if (!normalizeMvTipo(row)) reasons.push("Tipo precisa ser revisado");
  const tipo = normalizeMvTipo(row);
  const ref = txt(row.unit_reference);
  if ((tipo === "Lote" || tipo === "Terreno") && ref && !splitQuadraLote(ref).ok)
    reasons.push("quadra/lote não identificados");
  return { ok: reasons.length === 0, reasons };
};

export const mapMvRow = (row: any, userId: string, estado = DEFAULT_IMPORT_ESTADO) => {
  const tipo = normalizeMvTipo(row) || "Apartamento";
  const emp = txt(row.property_name);
  const ref = txt(row.unit_reference);
  const isLote = tipo === "Lote" || tipo === "Terreno";
  const split = isLote ? splitQuadraLote(ref) : { quadra: "", lote: "", ok: false };
  const unidade = isLote && split.ok ? "" : ref; // nunca perder unit_reference
  const exclusividade = deaccent(txt(row.contact_extra_raw)).toUpperCase();
  const createdAt = parseExcelDate(row.included_at);
  const updatedAt = parseExcelDate(row.updated_at);
  const numero = txt(row.street_number) || txt(row.number);
  const endereco = [txt(row.street_raw) || txt(row.location_raw), numero].filter(Boolean).join(", ");

  return {
    user_id: userId,
    titulo: emp || `${txt(row.property_type_raw) || tipo} ${ref}`.trim() || "Imóvel importado",
    tipo,
    status: "Disponível",
    empreendimento: emp,
    unidade,
    quadra: split.quadra,
    lote: split.lote,
    box: txt(row.parking_raw).replace(/\.$/, ""),
    cidade: txt(row.city),
    bairro: txt(row.neighborhood),
    endereco,
    estado,
    preco: normalizePreco(row),
    quartos: Math.round(num(row.bedrooms)),
    suites: Math.round(num(row.suites)),
    banheiros: 0,
    lavabo: 0,
    vagas: Math.round(num(row.parking_spaces)),
    area: num(row.area_m2),
    area_privativa: 0,
    padrao: txt(row.source_group).toUpperCase() === "PREMIUM" ? "Alto Padrão" : "",
    posicao_solar: txt(row.position_solar_raw),
    condicao: normalizeCondicao(row),
    decorado: isDecorado(row),
    vista_mar: false,
    aceita_permuta: aceitaPermuta(row),
    condicoes_pagamento: condicoesPagamento(row),
    proprietario: txt(row.contact_name),
    proprietario_telefone: normalizeTelefone(row),
    local_chaves: txt(row.keys_access),
    termo_exclusividade: exclusividade.includes("SEM EXC")
      ? "Não"
      : /\bEXCLUSIV|COM EXC/.test(exclusividade)
        ? "Sim"
        : "",
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
    if (k === "banheiros" || k === "user_id" || k === "id") return;
    const empty =
      v === null ||
      v === undefined ||
      v === "" ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === "number" && v === 0);
    if (!empty) out[k] = v;
  });
  return out as T;
};
