import { addMonths, differenceInDays, format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export type BillingCycle = "monthly" | "quarterly" | "semiannual" | "annual";

export const CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

export const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

export const SUBSCRIBER_STATUS = [
  { value: "active", label: "Ativo", tone: "emerald" },
  { value: "pending_payment", label: "Pagamento pendente", tone: "amber" },
  { value: "overdue", label: "Vencido", tone: "orange" },
  { value: "defaulting", label: "Inadimplente", tone: "rose" },
  { value: "blocked", label: "Bloqueado", tone: "slate" },
  { value: "cancelled", label: "Cancelado", tone: "zinc" },
] as const;

export const MEMBER_ROLES = [
  { value: "owner", label: "Proprietário" },
  { value: "manager", label: "Gerente" },
  { value: "broker", label: "Corretor" },
  { value: "finance", label: "Financeiro" },
] as const;

export const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao", label: "Cartão" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
  { value: "outro", label: "Outro" },
] as const;

export const CANCEL_REASONS = [
  "Preço",
  "Não está utilizando",
  "Migrou para outro sistema",
  "Atendimento",
  "Encerramento das atividades",
  "Inadimplência",
  "Outro",
] as const;

export const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);

export const toDate = (v?: string | null): Date | null => {
  if (!v) return null;
  try {
    return v.length <= 10 ? parseISO(`${v}T00:00:00`) : parseISO(v);
  } catch {
    return null;
  }
};

export const formatDate = (v?: string | null) => {
  const d = toDate(v);
  return d ? format(d, "dd/MM/yyyy") : "—";
};

export const formatDateTime = (v?: string | null) => {
  const d = toDate(v);
  return d ? format(d, "dd/MM/yyyy 'às' HH:mm") : "—";
};

/** "Set/2026" a partir da competência ou do vencimento. */
export const competenceLabel = (competence?: string | null, fallback?: string | null) => {
  const d = toDate(competence) || toDate(fallback);
  if (!d) return "—";
  const label = format(d, "LLL/yyyy", { locale: ptBR }).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const normalizeCycle = (cycle?: string | null): BillingCycle =>
  (cycle && cycle in CYCLE_MONTHS ? cycle : "monthly") as BillingCycle;

/** Próximo vencimento conforme periodicidade (nunca gera várias cobranças). */
export const nextDueDate = (from: Date, cycle?: string | null) =>
  addMonths(from, CYCLE_MONTHS[normalizeCycle(cycle)]);

export const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

export const monthlyEquivalent = (amount: number, cycle?: string | null) =>
  (Number(amount) || 0) / CYCLE_MONTHS[normalizeCycle(cycle)];

export interface PaymentLike {
  id: string;
  subscriber_id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  competence?: string | null;
  is_courtesy?: boolean | null;
  discount_amount?: number | null;
}

export const isPaid = (p: PaymentLike) => !!p.paid_at || ["paid", "approved", "confirmed"].includes(p.status);
export const isCourtesy = (p: PaymentLike) => !!p.is_courtesy;

export const isOpen = (p: PaymentLike) => !isPaid(p) && !isCourtesy(p) && p.status !== "cancelled";

export const isLate = (p: PaymentLike, ref: Date = new Date()) => {
  if (!isOpen(p)) return false;
  const due = toDate(p.due_date);
  return !!due && due.getTime() < startOfDay(ref).getTime();
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const daysToDue = (p: PaymentLike, ref: Date = new Date()) => {
  const due = toDate(p.due_date);
  return due ? differenceInDays(startOfDay(due), startOfDay(ref)) : 999;
};

export const paymentStatusLabel = (p: PaymentLike) => {
  if (isCourtesy(p)) return "Cortesia";
  if (isPaid(p)) return "Pago";
  if (isLate(p)) return "Atrasado";
  if (p.status === "cancelled") return "Cancelado";
  return "Pendente";
};

export const sumPaid = (payments: PaymentLike[], filter?: (d: Date) => boolean) =>
  payments
    .filter((p) => isPaid(p))
    .filter((p) => {
      if (!filter) return true;
      const d = toDate(p.paid_at);
      return !!d && filter(d);
    })
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

export const sumOpen = (payments: PaymentLike[], filter?: (d: Date) => boolean) =>
  payments
    .filter(isOpen)
    .filter((p) => {
      if (!filter) return true;
      const d = toDate(p.due_date);
      return !!d && filter(d);
    })
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

export const inMonth = (ref: Date) => (d: Date) => isSameMonth(d, ref);
export const monthStartKey = (d: Date) => format(startOfMonth(d), "yyyy-MM");
export const monthShortLabel = (d: Date) => {
  const l = format(d, "LLL/yy", { locale: ptBR }).replace(".", "");
  return l.charAt(0).toUpperCase() + l.slice(1);
};

export const buildChargeMessage = (name: string, amount: number, dueDate: string) =>
  `Olá ${name}! Passando para lembrar da sua assinatura do MV Broker Connect.\n\n` +
  `Valor: ${formatCurrency(amount)}\nVencimento: ${formatDate(dueDate)}\n\n` +
  `Qualquer dúvida estou à disposição. Obrigado!`;

export const waLink = (phone?: string | null, message?: string) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
};
