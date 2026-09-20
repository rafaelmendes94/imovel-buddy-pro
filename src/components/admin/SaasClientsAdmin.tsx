import { useMemo, useState } from "react";
import { Ban, CheckCircle2, CreditCard, Edit3, FileText, RefreshCcw, ShieldCheck, UserCheck, WalletCards } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FinPayment, FinSubscriber, useFinanceData } from "@/hooks/useFinanceData";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { daysToDue, formatCurrency, formatDate, isLate, isOpen, isPaid } from "@/lib/finance";
import { StatusBadge } from "@/components/financeiro/StatusBadge";
import { CancelDialog, ManualPaymentDialog, SubscriberEditDialog } from "@/components/financeiro/FinanceDialogs";

type ClientType = "corretor" | "imobiliaria";

const typeLabel: Record<ClientType, string> = {
  corretor: "Corretores",
  imobiliaria: "Imobiliárias",
};

const statusLabel: Record<string, string> = {
  pending_approval: "Aguardando aprovação",
  without_plan: "Sem plano",
};

export function SaasClientsAdmin({ type }: { type: ClientType }) {
  const { isSuperAdmin, hasModuleAccess } = useAuth();
  const { toast } = useToast();
  const fin = useFinanceData();
  const [query, setQuery] = useState("");
  const [editSub, setEditSub] = useState<FinSubscriber | null>(null);
  const [manualSub, setManualSub] = useState<FinSubscriber | null>(null);
  const [cancelSub, setCancelSub] = useState<FinSubscriber | null>(null);
  const [blockSub, setBlockSub] = useState<{ sub: FinSubscriber; block: boolean } | null>(null);
  const [refundSub, setRefundSub] = useState<FinSubscriber | null>(null);
  const [refundPaymentId, setRefundPaymentId] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const canView = isSuperAdmin || hasModuleAccess("clientes", "view") || hasModuleAccess("financeiro", "view");
  const canEdit = isSuperAdmin || hasModuleAccess("clientes", "edit");
  const canFinance = isSuperAdmin || hasModuleAccess("financeiro", "create") || hasModuleAccess("financeiro", "edit");

  const clients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return fin.subscribers
      .filter((sub) => sub.subscriber_type === type)
      .filter((sub) => {
        if (!normalizedQuery) return true;
        return [sub.name, sub.email, sub.phone, sub.city].some((item) => (item || "").toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [fin.subscribers, query, type]);

  const paymentsOf = (subscriberId: string) => fin.payments.filter((payment) => payment.subscriber_id === subscriberId);
  const openPaymentOf = (subscriberId: string) =>
    paymentsOf(subscriberId)
      .filter(isOpen)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))[0] || null;
  const lastPaidOf = (subscriberId: string) =>
    paymentsOf(subscriberId)
      .filter(isPaid)
      .sort((a, b) => (b.paid_at || b.due_date).localeCompare(a.paid_at || a.due_date))[0] || null;

  const stats = useMemo(() => {
    const active = clients.filter((sub) => ["active", "trial"].includes(sub.status)).length;
    const pending = clients.filter((sub) => ["pending_approval", "pending_payment", "without_plan"].includes(sub.status)).length;
    const blocked = clients.filter((sub) => sub.status === "blocked").length;
    const cancelled = clients.filter((sub) => sub.status === "cancelled").length;
    const late = clients.filter((sub) => {
      const open = openPaymentOf(sub.id);
      return ["overdue", "defaulting"].includes(sub.status) || (open ? isLate(open) : false);
    }).length;
    const paidMonth = fin.payments
      .filter((payment) => clients.some((sub) => sub.id === payment.subscriber_id))
      .filter(isPaid)
      .filter((payment) => (payment.paid_at || payment.due_date).slice(0, 7) === new Date().toISOString().slice(0, 7))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return { active, pending, blocked, cancelled, late, paidMonth };
  }, [clients, fin.payments]);

  if (!canView) return null;

  const amountOf = (sub: FinSubscriber) => Number(fin.planOf(sub)?.price || 0);

  const approve = async (sub: FinSubscriber) => {
    if (sub.source === "profile" && !sub.plan_id) {
      setEditSub(sub);
      toast({ title: "Escolha um plano para liberar", description: "O cadastro será aprovado ao salvar com plano vinculado." });
      return;
    }
    await fin.updateSubscriber(sub, { status: "active" }, "Cadastro liberado pelo painel", "approved");
    toast({ title: "Cliente liberado" });
  };

  const refundablePayments = refundSub
    ? paymentsOf(refundSub.id).filter((payment) => isPaid(payment) && payment.status !== "refunded")
    : [];

  const refundPayment = async () => {
    if (!refundSub || !refundPaymentId) return;
    const payment = refundablePayments.find((item) => item.id === refundPaymentId);
    if (!payment) return;

    if (payment.source === "subscription" && payment.subscription_payment_id) {
      await supabase
        .from("subscription_payments")
        .update({ status: "refunded" } as any)
        .eq("id", payment.subscription_payment_id);
    } else if (payment.source === "legacy") {
      await supabase
        .from("payments")
        .update({ status: "refunded", notes: refundReason || "Reembolso lançado pelo painel" } as any)
        .eq("id", payment.id);
    }

    await fin.logEvent(refundSub.legacy_subscriber_id || refundSub.id, "refund", `Reembolso registrado: ${formatCurrency(payment.amount)}`, {
      payment_id: payment.id,
      reason: refundReason,
    });
    await fin.fetchAll();
    toast({ title: "Reembolso registrado" });
    setRefundSub(null);
    setRefundPaymentId("");
    setRefundReason("");
  };

  const actionDisabled = (sub: FinSubscriber) => sub.source === "profile" && !sub.plan_id;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Administração SaaS</p>
          <h2 className="text-2xl font-bold">{typeLabel[type]}</h2>
          <p className="text-sm text-muted-foreground">Cadastro, liberação, planos, cobranças, bloqueios e cancelamentos.</p>
        </div>
        <div className="w-full md:w-80">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, e-mail ou telefone..." />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        {[
          ["Total", clients.length, FileText],
          ["Em dia", stats.active, CheckCircle2],
          ["Pendentes", stats.pending, UserCheck],
          ["Atrasados", stats.late, WalletCards],
          ["Bloqueados", stats.blocked, Ban],
          ["Recebido mês", formatCurrency(stats.paidMonth), CreditCard],
        ].map(([label, value, Icon]) => (
          <Card key={String(label)} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label as string}</p>
                <p className="mt-2 text-xl font-bold">{value as string | number}</p>
              </div>
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <Table className="min-w-[1060px]">
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último pagamento</TableHead>
              <TableHead>Financeiro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fin.loading ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando clientes...</TableCell></TableRow>
            ) : clients.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum cliente encontrado.</TableCell></TableRow>
            ) : clients.map((sub) => {
              const open = openPaymentOf(sub.id);
              const lastPaid = lastPaidOf(sub.id);
              const plan = fin.planOf(sub);
              const dueDays = open ? daysToDue(open) : null;

              return (
                <TableRow key={`${sub.source}-${sub.id}`}>
                  <TableCell>
                    <p className="font-semibold">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.email || "Sem e-mail"} · {sub.phone || "Sem telefone"}</p>
                    <p className="text-xs text-muted-foreground">{sub.source === "profile" ? "Cadastro do login" : "Assinante"}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{plan?.name || "Sem plano"}</p>
                    <p className="text-xs text-muted-foreground">{plan ? formatCurrency(Number(plan.price)) : "Vincule um plano para liberar"}</p>
                  </TableCell>
                  <TableCell>
                    <p>{formatDate(open?.due_date || sub.next_due_date)}</p>
                    <p className={cn("text-xs text-muted-foreground", dueDays !== null && dueDays < 0 && "text-destructive")}>
                      {dueDays === null ? "Sem cobrança" : dueDays < 0 ? `${Math.abs(dueDays)} dia(s) em atraso` : `${dueDays} dia(s)`}
                    </p>
                  </TableCell>
                  <TableCell>
                    {statusLabel[sub.status] ? (
                      <span className="rounded-full border px-2 py-1 text-xs font-medium">{statusLabel[sub.status]}</span>
                    ) : (
                      <StatusBadge status={sub.status} />
                    )}
                  </TableCell>
                  <TableCell>
                    <p>{lastPaid ? formatDate(lastPaid.paid_at || lastPaid.due_date) : "—"}</p>
                    <p className="text-xs text-muted-foreground">{lastPaid ? formatCurrency(lastPaid.amount) : "Sem pagamento"}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{open ? formatCurrency(open.amount || amountOf(sub)) : "Sem aberto"}</p>
                    <p className="text-xs text-muted-foreground">{open ? (isLate(open) ? "Atrasado" : "Pendente") : "Em dia/sem plano"}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <Button size="sm" variant="outline" onClick={() => setEditSub(sub)}>
                          <Edit3 className="mr-1 h-3.5 w-3.5" /> Editar
                        </Button>
                      )}
                      {canEdit && ["pending_approval", "without_plan", "pending_payment"].includes(sub.status) && (
                        <Button size="sm" onClick={() => approve(sub)}>
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Liberar
                        </Button>
                      )}
                      {canFinance && (
                        <Button size="sm" variant="outline" disabled={actionDisabled(sub)} onClick={() => setManualSub(sub)}>
                          <CreditCard className="mr-1 h-3.5 w-3.5" /> Pagamento
                        </Button>
                      )}
                      {canFinance && (
                        <Button size="sm" variant="outline" disabled={!lastPaid} onClick={() => { setRefundSub(sub); setRefundPaymentId(lastPaid?.id || ""); }}>
                          <RefreshCcw className="mr-1 h-3.5 w-3.5" /> Reembolso
                        </Button>
                      )}
                      {canEdit && (
                        <Button size="sm" variant="outline" onClick={() => setBlockSub({ sub, block: sub.status !== "blocked" })}>
                          {sub.status === "blocked" ? "Liberar" : "Bloquear"}
                        </Button>
                      )}
                      {canEdit && (
                        <Button size="sm" variant="destructive" onClick={() => setCancelSub(sub)}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <SubscriberEditDialog
        open={!!editSub}
        onOpenChange={(open) => !open && setEditSub(null)}
        subscriber={editSub}
        plans={fin.plans}
        onSubmit={async (patch) => {
          if (!editSub) return;
          await fin.updateSubscriber(editSub, patch, "Cliente/plano atualizado pelo painel", "client_updated");
          toast({ title: "Cliente atualizado" });
        }}
      />

      <ManualPaymentDialog
        open={!!manualSub}
        onOpenChange={(open) => !open && setManualSub(null)}
        subscribers={clients.filter((sub) => sub.source !== "profile" || !!sub.plan_id)}
        defaultSubscriberId={manualSub?.id}
        onSubmit={async (input) => {
          await fin.registerManualPayment(input);
          toast({ title: "Pagamento registrado" });
        }}
      />

      <CancelDialog
        open={!!cancelSub}
        onOpenChange={(open) => !open && setCancelSub(null)}
        subscriber={cancelSub}
        onSubmit={async (reason, note) => {
          if (!cancelSub) return;
          await fin.cancelSubscription(cancelSub, reason, note);
          toast({ title: "Cliente cancelado" });
        }}
      />

      <AlertDialog open={!!blockSub} onOpenChange={(open) => !open && setBlockSub(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{blockSub?.block ? "Bloquear acesso?" : "Liberar acesso?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {blockSub?.block
                ? "O cliente perde o acesso ao sistema. Nenhum cadastro será apagado."
                : "O acesso será liberado novamente para o cliente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                if (!blockSub) return;
                await fin.setGroupBlocked(blockSub.sub, blockSub.block);
                toast({ title: blockSub.block ? "Acesso bloqueado" : "Acesso liberado" });
                setBlockSub(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!refundSub} onOpenChange={(open) => !open && setRefundSub(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar reembolso</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Pagamento</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={refundPaymentId}
                onChange={(event) => setRefundPaymentId(event.target.value)}
              >
                {refundablePayments.map((payment: FinPayment) => (
                  <option key={payment.id} value={payment.id}>
                    {formatDate(payment.paid_at || payment.due_date)} — {formatCurrency(payment.amount)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Motivo</Label>
              <Input value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Ex: cobrança duplicada" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundSub(null)}>Cancelar</Button>
            <Button disabled={!refundPaymentId} onClick={refundPayment}>Registrar reembolso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
