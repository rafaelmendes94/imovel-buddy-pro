// Exporta os imóveis cadastrados (escopo do usuário via RLS) em XLSX
// no mesmo layout "MV" aceito pelo importador (Dicionario_Importacao_MV_Broker.xlsx),
// permitindo reimportar o arquivo gerado sem ajustes.

import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

const s = (v: any) => (v == null ? "" : String(v));
const n = (v: any) => (v == null || v === "" ? "" : Number(v));
const join = (v: any) => (Array.isArray(v) ? v.filter(Boolean).join("; ") : s(v));

function toRow(r: any) {
  return {
    source_id: s(r.id),
    source_row: "",
    import_approved: "SIM",
    review_required: "",
    review_reasons: "",
    status: s(r.status) || "Disponível",
    property_name: s(r.empreendimento),
    property_type: s(r.tipo),
    property_type_raw: s(r.tipo),
    source_group: s(r.padrao),
    unit_reference: s(r.unidade) || [r.quadra && `Q${r.quadra}`, r.lote && `L${r.lote}`].filter(Boolean).join(" "),
    city: s(r.cidade),
    neighborhood: s(r.bairro),
    street_raw: s(r.endereco),
    location_raw: "",
    location_confidence: "",
    price_brl: n(r.preco),
    price_raw: "",
    price_rule: "",
    bedrooms: n(r.quartos),
    suites: n(r.suites),
    rooms_raw: "",
    area_m2: n(r.area),
    area_raw: "",
    parking_spaces: n(r.vagas),
    parking_raw: s(r.box),
    construction_year: "",
    year_iptu_raw: "",
    position_solar_raw: s(r.posicao_solar),
    furnished: s(r.condicao),
    decorated: r.decorado ? "SIM" : "",
    furniture_raw: "",
    highlights: join(r.infraestrutura),
    bank_financing: join(r.condicoes_pagamento),
    bank_financing_raw: "",
    entry_percent: "",
    entry_value_brl: n(r.preco_parcelado),
    entry_raw: "",
    direct_installments: "",
    direct_term_raw: "",
    payment_terms: join(r.condicoes_pagamento),
    condo_iptu_raw: "",
    included_at: r.created_at ? new Date(r.created_at) : "",
    updated_at: r.updated_at ? new Date(r.updated_at) : "",
    weekly_flag: "",
    contact_name: s(r.proprietario),
    contact_phone: s(r.proprietario_telefone),
    contact_phone_raw: "",
    contact_extra_raw: s(r.termo_exclusividade),
    keys_access: s(r.local_chaves),
    internal_notes: s(r.descricao),
    fingerprint: "",
    exact_fingerprint: "",
  };
}

export async function exportImoveisXls(): Promise<number> {
  const { data, error } = await (supabase as any)
    .from("imoveis")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = ((data as any[]) || []).map(toRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || toRow({})).map((k) => ({
    wch: Math.max(12, Math.min(40, k.length + 2)),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Imóveis");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `imoveis-mv-${stamp}.xlsx`);
  return rows.length;
}
