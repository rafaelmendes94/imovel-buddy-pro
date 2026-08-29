/**
 * Regras centralizadas de status e VGV usadas no módulo de Condomínios.
 * Somente leitura — nenhum campo novo é criado no banco.
 */

const norm = (v?: string | null) =>
  (v || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Status que representam imóvel disponível para venda. */
export const ACTIVE_STATUS = ["disponivel", "ativo", "a venda", "à venda", "lancamento", "em construcao"];
/** Status que representam venda concluída. */
export const SOLD_STATUS = ["vendido", "vendida", "venda concluida", "fechado"];

export const isActiveProperty = (status?: string | null) => ACTIVE_STATUS.includes(norm(status));
export const isSoldProperty = (status?: string | null) => SOLD_STATUS.includes(norm(status));

export interface MetricImovel {
  id: string;
  condominio_id: string | null;
  status: string | null;
  preco: number | null;
  tipo?: string | null;
  quartos?: number | null;
  suites?: number | null;
  area?: number | null;
  quadra?: string | null;
  lote?: string | null;
  unidade?: string | null;
  titulo?: string | null;
  imagens?: string[] | null;
}

export interface CondoMetrics {
  ativos: number;
  vendidos: number;
  vgvAtivo: number;
  vgvVendido: number;
  minPreco: number | null;
  maxPreco: number | null;
  ticketMedioAtivo: number | null;
}

export const emptyMetrics = (): CondoMetrics => ({
  ativos: 0, vendidos: 0, vgvAtivo: 0, vgvVendido: 0,
  minPreco: null, maxPreco: null, ticketMedioAtivo: null,
});

const price = (v: any) => (v == null || !isFinite(Number(v)) ? 0 : Number(v));

export function metricsFor(items: MetricImovel[]): CondoMetrics {
  const m = emptyMetrics();
  for (const it of items) {
    const p = price(it.preco);
    if (isActiveProperty(it.status)) {
      m.ativos += 1;
      m.vgvAtivo += p;
      if (p > 0) {
        m.minPreco = m.minPreco == null ? p : Math.min(m.minPreco, p);
        m.maxPreco = m.maxPreco == null ? p : Math.max(m.maxPreco, p);
      }
    } else if (isSoldProperty(it.status)) {
      m.vendidos += 1;
      /** Não existe coluna de valor de fechamento — usa-se o preço cadastrado. */
      m.vgvVendido += p;
    }
  }
  m.ticketMedioAtivo = m.ativos > 0 ? Math.round(m.vgvAtivo / m.ativos) : null;
  return m;
}

/** Agrega, em uma única passagem, as métricas por condomínio (evita N+1). */
export function metricsByCondo(items: MetricImovel[]): Record<string, CondoMetrics> {
  const groups: Record<string, MetricImovel[]> = {};
  for (const it of items) {
    if (!it.condominio_id) continue;
    (groups[it.condominio_id] ||= []).push(it);
  }
  return Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, metricsFor(v)]));
}

export const brl = (v?: number | null) =>
  v == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

/** Formato compacto: R$ 14,8 mi */
export const brlShort = (v?: number | null) => {
  if (!v) return "R$ 0";
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return brl(v);
};
