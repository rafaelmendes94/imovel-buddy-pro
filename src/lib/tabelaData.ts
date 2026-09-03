/**
 * Normalização dos dados REAIS de `imoveis` para o Gerador de Tabela.
 * Somente leitura — nenhum campo do banco é alterado ou duplicado.
 */

import { supabase } from "@/integrations/supabase/client";
import { identityKind } from "@/lib/propertyIdentity";

export interface TabelaCorretor {
  id: string;
  nome: string;
  telefone: string | null;
  creci: string | null;
  foto_url: string | null;
}

export interface TabelaImovel {
  id: string;
  code: string;
  titulo: string;
  tipo: string;
  status: string;
  empreendimento: string;
  unidade: string;
  box: string;
  quadra: string;
  lote: string;
  cidade: string;
  bairro: string;
  endereco: string;
  preco: number | null;
  precoParcelado: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  area: number | null;
  areaPrivativa: number | null;
  mobiliado: boolean;
  decorado: boolean;
  vistaMar: boolean;
  vista: string;
  condicoesPagamento: string[];
  caracteristicas: string[];
  descricao: string;
  capa: string | null;
  imagens: string[];
  driveUrl: string | null;
  fotosPdfUrl: string | null;
  linkMaterial: string | null;
  link360: string | null;
  proprietario: string | null;
  corretorId: string | null;
  corretorNome: string;
}

const str = (v: any) => {
  const s = (v ?? "").toString().trim();
  const lower = s.toLowerCase();
  if (!s || ["-", "--", "null", "undefined", "n/a", "não informado", "nao informado"].includes(lower)) return "";
  return s;
};

const num = (v: any) => (v == null || v === "" || !isFinite(Number(v)) ? null : Number(v));

export const propertyCode = (id: string) => `MV-${id.replace(/-/g, "").slice(0, 5).toUpperCase()}`;

export const money = (v?: number | null) =>
  v == null || !isFinite(Number(v))
    ? ""
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(v));

const hasFeature = (list: string[], needle: string) =>
  list.some(f => f.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(needle));

export function normalizeImovel(row: any): TabelaImovel {
  const caracteristicas = [
    ...((row.infraestrutura as string[]) || []),
    ...((row.outras_caracteristicas as string[]) || []),
  ].map(str).filter(Boolean);

  const empreendimento =
    str(row.empreendimento) ||
    str(row.edificios?.nome) ||
    str(row.condominios?.nome) ||
    str(row.empreendimentos?.nome);

  const imagens = ((row.imagens as string[]) || []).filter(Boolean);

  return {
    id: row.id,
    code: propertyCode(row.id),
    titulo: str(row.titulo) || "Imóvel",
    tipo: str(row.tipo),
    status: str(row.status),
    empreendimento,
    unidade: str(row.unidade),
    box: str(row.box),
    quadra: str(row.quadra),
    lote: str(row.lote),
    cidade: str(row.cidade),
    bairro: str(row.bairro),
    endereco: str(row.endereco),
    preco: num(row.preco),
    precoParcelado: num(row.preco_parcelado),
    quartos: num(row.quartos),
    suites: num(row.suites),
    banheiros: num(row.banheiros),
    vagas: num(row.vagas),
    area: num(row.area),
    areaPrivativa: num(row.area_privativa),
    mobiliado: hasFeature(caracteristicas, "mobiliad"),
    decorado: !!row.decorado || hasFeature(caracteristicas, "decorad"),
    vistaMar: !!row.vista_mar,
    vista: str(row.vista),
    condicoesPagamento: ((row.condicoes_pagamento as string[]) || []).map(str).filter(Boolean),
    caracteristicas,
    descricao: str(row.descricao),
    capa: imagens[0] || null,
    imagens,
    driveUrl: str(row.drive_fotos_url) || null,
    fotosPdfUrl: str(row.fotos_pdf_url) || null,
    linkMaterial: str(row.link_material) || null,
    link360: str(row.link_360) || null,
    proprietario: str(row.proprietario) || null,
    corretorId: row.corretor_cadastro_id || null,
    corretorNome: str(row.corretor_nome),
  };
}

/** Busca os imóveis acessíveis ao usuário (RLS garante o escopo). */
export async function fetchTabelaImoveis(): Promise<TabelaImovel[]> {
  const { data, error } = await (supabase as any)
    .from("imoveis")
    .select("*, edificios(nome), condominios(nome), empreendimentos(nome)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as any[]) || []).map(normalizeImovel);
}

/** Partes da identificação, conforme o tipo do imóvel. Campos vazios são omitidos. */
export function identityLines(p: TabelaImovel): string[] {
  const lines: string[] = [];
  if (p.empreendimento) lines.push(p.empreendimento.toUpperCase());
  const kind = identityKind(p.tipo);
  if (kind === "quadra-lote") {
    if (p.quadra || p.lote) {
      if (p.quadra) lines.push(`Q: ${p.quadra}`);
      if (p.lote) lines.push(`L: ${p.lote}`);
    } else if (p.unidade) {
      lines.push(`Apto ${p.unidade}`);
    }
    if (p.box) lines.push(`Box ${p.box}`);
  } else {
    if (p.unidade) lines.push(`Apto ${p.unidade}`);
    if (p.box) lines.push(`Box ${p.box}`);
  }
  return lines;
}

/** Descrição resumida automática — apenas com dados realmente cadastrados. */
export function autoDescription(p: TabelaImovel): string[] {
  const items: string[] = [];
  if (p.quartos) {
    items.push(
      p.suites
        ? `${p.quartos} dormitório${p.quartos > 1 ? "s" : ""}, sendo ${p.suites} suíte${p.suites > 1 ? "s" : ""}`
        : `${p.quartos} dormitório${p.quartos > 1 ? "s" : ""}`
    );
  }
  if (p.mobiliado && p.decorado) items.push("Mobiliado e decorado");
  else if (p.mobiliado) items.push("Mobiliado");
  else if (p.decorado) items.push("Decorado");
  if (p.vistaMar) items.push("Vista para o mar");
  else if (p.vista) items.push(`Vista ${p.vista.toLowerCase()}`);
  if (p.vagas) items.push(`${p.vagas} vaga${p.vagas > 1 ? "s" : ""} de garagem`);
  if (p.box) items.push(`Box ${p.box}`);
  if (p.areaPrivativa) items.push(`${p.areaPrivativa}m² privativos`);
  else if (p.area) items.push(`${p.area}m² totais`);
  const extras = p.caracteristicas.filter(
    c => !/mobiliad|decorad/i.test(c)
  ).slice(0, 3);
  return [...items, ...extras];
}

/** Link público da página do imóvel. */
export const propertyPageUrl = (id: string) =>
  typeof window !== "undefined" ? `${window.location.origin}/imovel/${id}` : `/imovel/${id}`;

/** Link de fotos preferencial: Drive > PDF de fotos > material > página pública. */
export function photosUrl(p: TabelaImovel): { url: string; label: string } | null {
  if (p.driveUrl) return { url: p.driveUrl, label: "VER FOTOS NO DRIVE" };
  if (p.fotosPdfUrl) return { url: p.fotosPdfUrl, label: "VER FOTOS" };
  if (p.linkMaterial) return { url: p.linkMaterial, label: "VER FOTOS" };
  if (p.imagens.length) return { url: propertyPageUrl(p.id), label: "VER FOTOS" };
  return null;
}
