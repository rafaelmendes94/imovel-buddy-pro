import { Badge } from "@/components/ui/badge";
import { SUBSCRIBER_STATUS } from "@/lib/finance";
import { cn } from "@/lib/utils";

/** Tons semânticos: verde = em dia, amarelo = atenção, vermelho = dívida, neutro = restante */
const TONE: Record<string, string> = {
  active: "bg-[hsl(var(--fin-emerald)/0.12)] text-[hsl(var(--fin-emerald))] border-[hsl(var(--fin-emerald)/0.3)]",
  pending_payment: "bg-[hsl(var(--fin-amber)/0.14)] text-[hsl(var(--fin-amber))] border-[hsl(var(--fin-amber)/0.32)]",
  overdue: "bg-[hsl(var(--fin-rose)/0.1)] text-[hsl(var(--fin-rose))] border-[hsl(var(--fin-rose)/0.28)]",
  defaulting: "bg-[hsl(var(--fin-rose)/0.14)] text-[hsl(var(--fin-rose))] border-[hsl(var(--fin-rose)/0.35)]",
  blocked: "bg-[hsl(var(--fin-rose)/0.16)] text-[hsl(var(--fin-rose))] border-[hsl(var(--fin-rose)/0.4)]",
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
  Pago: "bg-[hsl(var(--fin-emerald)/0.12)] text-[hsl(var(--fin-emerald))] border-[hsl(var(--fin-emerald)/0.3)]",
  Cortesia: "bg-[hsl(var(--fin-blue)/0.1)] text-[hsl(var(--fin-blue))] border-[hsl(var(--fin-blue)/0.28)]",
  Atrasado: "bg-[hsl(var(--fin-rose)/0.12)] text-[hsl(var(--fin-rose))] border-[hsl(var(--fin-rose)/0.32)]",
  Pendente: "bg-[hsl(var(--fin-amber)/0.14)] text-[hsl(var(--fin-amber))] border-[hsl(var(--fin-amber)/0.32)]",
  Cancelado: "bg-muted text-muted-foreground border-border",
};

export function PaymentBadge({ label, className }: { label: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", PAY_TONE[label] || PAY_TONE.Cancelado, className)}>
      {label === "Pago" ? "Pago ✓" : label}
    </Badge>
  );
}
