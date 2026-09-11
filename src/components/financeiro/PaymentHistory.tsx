import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PaymentBadge } from "./StatusBadge";
import { FinPayment, FinSubscriber } from "@/hooks/useFinanceData";
import { competenceLabel, formatCurrency, formatDate, formatDateTime, isPaid, paymentStatusLabel } from "@/lib/finance";
import { cn } from "@/lib/utils";

interface Props {
  subscriber: FinSubscriber;
  payments: FinPayment[];
  onConfirm: (p: FinPayment) => Promise<void>;
}

export function PaymentHistory({ subscriber, payments, onConfirm }: Props) {
  const [target, setTarget] = useState<FinPayment | null>(null);
  const [saving, setSaving] = useState(false);

  const list = [...payments].sort((a, b) => (a.due_date < b.due_date ? 1 : -1));

  return (
    <div className="space-y-2">
      {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>}
      {list.map((p) => {
        const label = paymentStatusLabel(p);
        const clickable = !isPaid(p) && (label === "Pendente" || label === "Atrasado");
        return (
          <div
            key={p.id}
            onClick={() => clickable && setTarget(p)}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
              clickable && "cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors",
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{competenceLabel(p.competence, p.due_date)}</p>
              <p className="text-xs text-muted-foreground truncate">
                Venc. {formatDate(p.due_date)}
                {isPaid(p) && p.paid_at ? ` · Pago em ${formatDateTime(p.paid_at)}` : ""}
                {p.paid_by_name ? ` · por ${p.paid_by_name}` : ""}
                {p.method ? ` · ${p.method}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold tabular-nums">{formatCurrency(p.amount)}</span>
              <PaymentBadge label={label} />
            </div>
          </div>
        );
      })}

      <AlertDialog open={!!target} onOpenChange={(v) => !v && setTarget(null)}>
        <AlertDialogContent className="max-w-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento de {formatCurrency(target?.amount || 0)}?</AlertDialogTitle>
            <AlertDialogDescription>
              {subscriber.name} · {competenceLabel(target?.competence, target?.due_date)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={async (e) => {
                e.preventDefault();
                if (!target) return;
                setSaving(true);
                await onConfirm(target);
                setSaving(false);
                setTarget(null);
              }}
            >
              {saving ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function QuickPayButton({
  payment, onConfirm, className,
}: { payment: FinPayment | null; onConfirm: (p: FinPayment) => Promise<void>; className?: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  if (!payment) return null;
  return (
    <>
      <Button size="sm" variant="outline" className={className} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        Pago
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento de {formatCurrency(payment.amount)}?</AlertDialogTitle>
            <AlertDialogDescription>{competenceLabel(payment.competence, payment.due_date)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={async (e) => {
                e.preventDefault();
                setSaving(true);
                await onConfirm(payment);
                setSaving(false);
                setOpen(false);
              }}
            >
              {saving ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
