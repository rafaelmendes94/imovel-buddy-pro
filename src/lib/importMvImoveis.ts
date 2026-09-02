// Mapeamento do layout normalizado "MV" (planilha com colunas source_id, property_name, etc.)
// para os campos da tabela imoveis.

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
  entry_raw: "condicoes_pagamento",
  direct_term_raw: "condicoes_pagamento",
  bank_financing_raw: "condicoes_pagamento",
  contact_name: "proprietario",
  contact_phone: "proprietario_telefone",
  contact_phone_raw: "proprietario_telefone (fallback)",
  keys_access: "local_chaves",
  contact_extra_raw: "termo_exclusividade",
  construction_year: "descricao (ano)",
  highlights: "descricao",
  internal_notes: "descricao",
  condo_iptu_raw: "descricao",
  status: "status",
  import_approved: "controle de importação",
  review_required: "controle de importação",
  review_reasons: "controle de importação",
  exact_fingerprint: "deduplicação",
  fingerprint: "deduplicação",
};

export const isMvLayout = (headers: string[]) =>
  headers.includes("property_name") || headers.includes("exact_fingerprint");

const BLANKS = new Set(["", "X", "-", "--", "N/A", "NAN", "NULL", "NAO", "NÃO"]);

const txt = (v: any) => {
  const s = String(v ?? "").trim();
  return BLANKS.has(s.toUpperCase()) ? "" : s;
};

const num = (v: any) => {
  const s = String(v ?? "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const bool = (v: any) => {
  const s = String(v ?? "").trim().toUpperCase();
  return s === "1" || s === "TRUE" || s === "SIM" || s === "VERDADEIRO" || s === "1.0";
};

export const normalizeMvTipo = (row: any) => {
  const v = `${txt(row.property_type)} ${txt(row.property_type_raw)}`.toUpperCase();
  if (v.includes("APART") || /\bAP\b/.test(v)) return "Apartamento";
  if (v.includes("SOBRADO") || v.includes("CASA")) return "Casa";
  if (v.includes("COND")) return "Condomínio";
  if (v.includes("LOTE")) return "Lote";
  if (v.includes("TERRENO")) return "Terreno";
  if (v.includes("COMERC") || v.includes("SALA") || v.includes("LOJA")) return "Comercial";
  return "Apartamento";
};

const normalizePreco = (row: any) => {
  const brl = num(row.price_brl);
  if (brl > 0) return brl >= 10000 ? brl : brl * 1000;
  const raw = num(row.price_raw);
  return raw >= 10000 ? raw : raw * 1000;
};

const normalizeTelefone = (row: any) => {
  const digits = String(row.contact_phone ?? row.contact_phone_raw ?? "").replace(/\D/g, "");
  const local = digits.length > 11 ? digits.slice(-11) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return txt(row.contact_phone) || txt(row.contact_phone_raw);
};

const normalizeStatus = (row: any) => {
  const s = txt(row.status).toUpperCase();
  if (s.includes("VEND")) return "Vendido";
  if (s.includes("RESERV")) return "Reservado";
  if (s.includes("ALUG")) return "Alugado";
  if (s.includes("SUSP")) return "Suspenso";
  return "Disponível";
};

const normalizeCondicao = (row: any) => {
  const f = `${txt(row.furniture_raw)}`.toUpperCase();
  if (bool(row.decorated) || f.includes("DECOR")) return "Decorado";
  if (f.includes("SEMI")) return "Semi-mobiliado";
  if (bool(row.furnished) || f.includes("MOB")) return "Mobiliado";
  if (f.includes("VAZIO")) return "Vazio";
  return "";
};

const splitQuadraLote = (ref: string) => {
  const m = ref.match(/^([A-Za-z0-9]+)\s*[-/ ]\s*([A-Za-z0-9]+)$/);
  return m ? { quadra: m[1], lote: m[2] } : { quadra: ref, lote: "" };
};

const condicoesPagamento = (row: any) => {
  const out: string[] = [];
  const push = (v: any) => { const s = txt(v); if (s && !out.includes(s)) out.push(s); };
  push(row.payment_terms);
  push(row.entry_raw);
  push(row.direct_term_raw);
  push(row.bank_financing_raw);
  if (bool(row.bank_financing)) push("Financiamento Bancário");
  return out.slice(0, 6);
};

const descricao = (row: any) => {
  const parts: string[] = [];
  const add = (label: string, v: any) => { const s = txt(v); if (s) parts.push(`${label}: ${s}`); };
  add("Ano de construção", row.construction_year || row.year_iptu_raw);
  add("Destaques", row.highlights);
  add("Condomínio/IPTU", row.condo_iptu_raw);
  add("Condições", row.payment_terms);
  add("Observações", row.internal_notes);
  add("Contato extra", row.contact_extra_raw);
  add("Referência de origem", row.source_id);
  return parts.join("\n");
};

const aceitaPermuta = (row: any) => {
  const s = `${txt(row.payment_terms)} ${txt(row.highlights)}`.toUpperCase();
  return /PERMUT|VEÍCULO|VEICULO|CARRO|PEGA IM[ÓO]VEL|DA[ÇC][ÃA]O/.test(s);
};

export interface MvValidation {
  ok: boolean;
  reasons: string[];
}

export const validateMvRow = (row: any): MvValidation => {
  const reasons: string[] = [];
  if (row.import_approved !== undefined && !bool(row.import_approved) && row.import_approved !== true)
    reasons.push("não aprovada (import_approved)");
  if (bool(row.review_required) || row.review_required === true)
    reasons.push(txt(row.review_reasons) || "revisão pendente");
  if (!txt(row.city)) reasons.push("cidade ausente");
  if (normalizePreco(row) <= 0) reasons.push("preço inválido");
  if (!txt(row.property_name) && !txt(row.unit_reference)) reasons.push("sem identificação");
  return { ok: reasons.length === 0, reasons };
};

export const mapMvRow = (row: any, userId: string) => {
  const tipo = normalizeMvTipo(row);
  const emp = txt(row.property_name);
  const ref = txt(row.unit_reference);
  const isLote = tipo === "Lote" || tipo === "Terreno";
  const { quadra, lote } = isLote ? splitQuadraLote(ref) : { quadra: "", lote: "" };
  const unidade = isLote ? "" : ref;
  const exclusividade = txt(row.contact_extra_raw).toUpperCase();

  return {
    user_id: userId,
    titulo: emp || `${tipo} ${ref}`.trim() || "Imóvel importado",
    tipo,
    status: normalizeStatus(row),
    empreendimento: emp,
    unidade,
    quadra,
    lote,
    box: txt(row.parking_raw).replace(/\.$/, ""),
    cidade: txt(row.city) || "—",
    bairro: txt(row.neighborhood),
    endereco: txt(row.street_raw) || txt(row.location_raw) || "—",
    estado: txt(row.state) || "",
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
    decorado: bool(row.decorated),
    vista_mar: false,
    aceita_permuta: aceitaPermuta(row),
    condicoes_pagamento: condicoesPagamento(row),
    proprietario: txt(row.contact_name),
    proprietario_telefone: normalizeTelefone(row),
    local_chaves: txt(row.keys_access),
    termo_exclusividade: exclusividade.includes("SEM EXC") ? "Não" : exclusividade.includes("EXC") ? "Sim" : "",
    descricao: descricao(row),
    imagens: [] as string[],
    ativo_site: false,
    publicar_xml: true,
    destaque_home: false,
  };
};
