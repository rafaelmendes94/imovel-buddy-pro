import { supabase } from "@/integrations/supabase/client";

export type PropertyEventType = "whatsapp_click" | "detail_open" | "share";

const db = supabase as any;

/** Registra um evento de engajamento do imóvel (fire-and-forget). */
export async function logPropertyEvent(
  imovelId: string,
  eventType: PropertyEventType,
  origem = "feed"
) {
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await db.from("property_events").insert({
      imovel_id: imovelId,
      event_type: eventType,
      corretor_que_clicou_id: uid,
      origem,
    });
  } catch (e) {
    console.warn("[events] falha ao registrar evento", e);
  }
}

export interface ImovelContact {
  nome: string | null;
  whatsapp: string | null;
  creci: string | null;
  imobiliaria: string | null;
}

/** Busca o contato do corretor responsável (somente usuários autenticados). */
export async function fetchImovelContact(imovelId: string): Promise<ImovelContact | null> {
  const { data, error } = await db.rpc("get_imovel_contact", { _imovel_id: imovelId });
  if (error) {
    console.warn("[contato] falha:", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row ? (row as ImovelContact) : null;
}

/** Normaliza telefone brasileiro para o formato do WhatsApp. */
export function toWhatsappNumber(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
  if (digits.length < 12 || digits.length > 13) return null;
  return digits;
}

export interface WhatsappMessageInput {
  id: string;
  titulo?: string | null;
  tipo?: string | null;
  preco?: number | null;
  codigo?: string | null;
}

export function buildWhatsappMessage(imovel: WhatsappMessageInput) {
  const link = `${window.location.origin}/imovel/${imovel.id}`;
  const valor =
    imovel.preco && imovel.preco > 0
      ? imovel.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
      : "Valor a combinar";
  const codigo = (imovel.codigo || imovel.id).slice(0, 8).toUpperCase();
  return [
    "Olá! Vi este imóvel no MV Connect e gostaria de mais informações.",
    "",
    imovel.titulo || "Imóvel",
    imovel.tipo || "",
    valor,
    `Código: ${codigo}`,
    "",
    `Link: ${link}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export function openWhatsapp(number: string, message: string) {
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
