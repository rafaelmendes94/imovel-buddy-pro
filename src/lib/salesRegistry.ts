import { supabase } from "@/integrations/supabase/client";

/**
 * Fonte única da verdade de vendas: a própria linha do imóvel.
 * Marcar como Vendido cria/ativa a venda (imóvel + corretor responsável) e ela passa
 * a contar em ranking/dashboards. Reativar remove a venda dos contadores.
 * Como a venda vive na própria linha do imóvel, não há como gerar dois registros
 * ativos da mesma venda; vendas futuras do mesmo imóvel voltam a contar normalmente.
 */

export const SOLD_STATUS = "Vendido";
export const ACTIVE_STATUS = "Disponível";

export const SOLD_STATUS_FILTER = "%vendid%";

export const isSoldStatus = (status?: string | null) => !!status && /vendid/i.test(status);
export const isActiveStatus = (status?: string | null) => !!status && /dispon/i.test(status);

const SALES_EVENT = "mv:sales-changed";

/** Avisa dashboards/rankings abertos para recarregarem os dados de vendas. */
export function notifySalesChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SALES_EVENT));
}

/** Assina mudanças de venda. Retorna a função de cleanup. */
export function onSalesChanged(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SALES_EVENT, handler);
  return () => window.removeEventListener(SALES_EVENT, handler);
}

export interface SoldPatch {
  status: string;
  data_venda: string;
  plataforma_venda?: string;
  corretor_nome?: string;
  corretor_id?: string;
}

export interface SellOptions {
  platform?: string;
  saleDate?: string;
  brokerId?: string | null;
  brokerName?: string | null;
}

/**
 * Registra a venda do imóvel. Idempotente: se o imóvel já está vendido,
 * não sobrescreve a venda existente nem duplica o registro.
 */
export async function markPropertySold(
  imovelId: string,
  opts: SellOptions = {}
): Promise<{ ok: boolean; alreadySold?: boolean; patch?: SoldPatch; error?: string }> {
  const { data: current, error: readError } = await supabase
    .from("imoveis")
    .select("status")
    .eq("id", imovelId)
    .maybeSingle();

  if (readError) return { ok: false, error: readError.message };
  if (current && isSoldStatus(current.status)) return { ok: true, alreadySold: true };

  const patch: SoldPatch = {
    status: SOLD_STATUS,
    data_venda: opts.saleDate || new Date().toISOString().slice(0, 10),
  };
  if (opts.platform) patch.plataforma_venda = opts.platform;
  if (opts.brokerName) patch.corretor_nome = opts.brokerName;
  if (opts.brokerId) patch.corretor_id = opts.brokerId;

  const { data: updated, error } = await supabase
    .from("imoveis")
    .update(patch as any)
    .eq("id", imovelId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Sem permissão para alterar este imóvel." };

  notifySalesChanged();
  return { ok: true, patch };
}

export interface ReactivatePatch {
  status: string;
  data_venda: null;
  plataforma_venda: string;
}

/**
 * Reativa o imóvel vendido: a venda deixa de contar em ranking e indicadores.
 * Uma nova venda futura volta a contar normalmente.
 */
export async function reactivateProperty(
  imovelId: string,
  newStatus: string = ACTIVE_STATUS
): Promise<{ ok: boolean; patch?: ReactivatePatch; error?: string }> {
  const patch: ReactivatePatch = {
    status: newStatus,
    data_venda: null,
    plataforma_venda: "",
  };
  const { data: updated, error } = await supabase
    .from("imoveis")
    .update(patch as any)
    .eq("id", imovelId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Sem permissão para alterar este imóvel." };

  notifySalesChanged();
  return { ok: true, patch };
}

/** Chave usada para evitar contar a mesma venda duas vezes (imóvel x agenciamento). */
export function saleDedupeKey(title: string, price: number) {
  const normalized = (title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return `${normalized}|${Math.round(Number(price) || 0)}`;
}
