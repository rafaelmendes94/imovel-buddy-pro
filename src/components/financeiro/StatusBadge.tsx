import { Badge } from "@/components/ui/badge";
import { SUBSCRIBER_STATUS } from "@/lib/finance";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
  overdue: "bg-orange-100 text-orange-700 border-orange-200",
  defaulting: "bg-rose-100 text-rose-700 border-rose-200",
  blocked: "bg-slate-200 text-slate-700 border-slate-300",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const item = SUBSCRIBER_STATUS.find((s) => s.value === status);
  return (
    <Badge variant="outline" className={cn("font-medium", TONE[status] || TONE.cancelled, className)}>
      {item?.label || status}
    </Badge>
  );
}

const PAY_TONE: Record<string, string> = {
  Pago: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cortesia: "bg-sky-100 text-sky-700 border-sky-200",
  Atrasado: "bg-rose-100 text-rose-700 border-rose-200",
  Pendente: "bg-amber-100 text-amber-700 border-amber-200",
  Cancelado: "bg-muted text-muted-foreground border-border",
};

export function PaymentBadge({ label, className }: { label: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", PAY_TONE[label] || PAY_TONE.Cancelado, className)}>
      {label === "Pago" ? "Pago ✓" : label}
    </Badge>
  );
}
