import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinLog, FinMember, FinPayment, FinPlan, FinSubscriber } from "@/hooks/useFinanceData";
import {
  CYCLE_LABEL, formatCurrency, formatDate, formatDateTime, isLate, isOpen, isPaid, normalizeCycle,
} from "@/lib/finance";
import { differenceInDays } from "date-fns";
import { MembersPanel } from "./MembersPanel";
import { PaymentHistory } from "./PaymentHistory";
import { StatusBadge } from "./StatusBadge";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscriber: FinSubscriber | null;
  plan: FinPlan | null;
  payments: FinPayment[];
  members: FinMember[];
  logs: FinLog[];
  onConfirmPayment: (p: FinPayment) => Promise<void>;
  onSaveMember: (subscriberId: string, m: Partial<FinMember> & { name: string }) => Promise<void>;
  onRemoveMember: (m: FinMember) => Promise<void>;
  onMemberStatus: (m: FinMember, status: string) => Promise<void>;
  canConfirmPayments?: boolean;
  canManageMembers?: boolean;
}

export function SubscriberProfile({
  open, onOpenChange, subscriber, plan, payments, members, logs,
  onConfirmPayment, onSaveMember, onRemoveMember, onMemberStatus,
  canConfirmPayments = true, canManageMembers = true,
}: Props) {
  if (!subscriber) return null;

  const paid = payments.filter(isPaid);
  const open_ = payments.filter(isOpen);
  const totalPaid = paid.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalOpen = open_.reduce((s, p) => s + Number(p.amount || 0), 0);
  const lateCount = open_.filter((p) => isLate(p)).length;
  const clientDays = subscriber.created_at ? differenceInDays(new Date(), new Date(subscriber.created_at)) : 0;

  const info = [
    ["Plano atual", plan?.name || "—"],
    ["Valor", formatCurrency(plan?.price || Number(payments[0]?.amount || 0))],
    ["Periodicidade", CYCLE_LABEL[normalizeCycle(plan?.billing_cycle || subscriber.plan)]],
    ["Vencimento", formatDate(subscriber.next_due_date)],
    ["Início", formatDate(subscriber.start_date || subscriber.created_at)],
    ["Total pago", formatCurrency(totalPaid)],
    ["Total em aberto", formatCurrency(totalOpen)],
    ["Pagamentos", String(paid.length)],
    ["Pagamentos atrasados", String(lateCount)],
    ["Tempo como cliente", `${clientDays} dias`],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {subscriber.name}
            <StatusBadge status={subscriber.status} />
            <Badge variant="outline">
              {subscriber.subscriber_type === "imobiliaria" ? "Imobiliária" : "Corretor autônomo"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="members">Usuários</TabsTrigger>
            <TabsTrigger value="finance">Financeiro</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="notes">Observações</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ["Contato", subscriber.phone || "—"],
                ["E-mail", subscriber.email || "—"],
                ["CRECI", subscriber.creci || "—"],
                ["CPF/CNPJ", subscriber.document || "—"],
                ["Cidade", subscriber.city || "—"],
                ["Usuários vinculados", String(members.length)],
              ].map(([k, v]) => (
                <Card key={k} className="p-3">
                  <p className="text-[11px] text-muted-foreground">{k}</p>
                  <p className="text-sm font-medium text-foreground break-words">{v}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="members" className="pt-3">
            <MembersPanel
              subscriberId={subscriber.id}
              members={members}
              onSave={onSaveMember}
              onRemove={onRemoveMember}
              onStatus={onMemberStatus}
              readOnly={!canManageMembers}
            />
          </TabsContent>

          <TabsContent value="finance" className="pt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {info.map(([k, v]) => (
                <Card key={k} className="p-3">
                  <p className="text-[11px] text-muted-foreground">{k}</p>
                  <p className="text-sm font-semibold text-foreground">{v}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="pt-3">
            <PaymentHistory
              subscriber={subscriber}
              payments={payments}
              onConfirm={onConfirmPayment}
              canConfirm={canConfirmPayments}
            />
          </TabsContent>

          <TabsContent value="notes" className="pt-3">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {subscriber.notes || "Nenhuma observação registrada."}
            </p>
            {subscriber.cancel_reason && (
              <p className="text-sm text-destructive mt-3">
                Cancelado em {formatDate(subscriber.cancelled_at)} — motivo: {subscriber.cancel_reason}
              </p>
            )}
          </TabsContent>

          <TabsContent value="activity" className="pt-3">
            <div className="space-y-2">
              {logs.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>}
              {logs.map((l) => (
                <div key={l.id} className="border-l-2 border-primary/40 pl-3 py-1">
                  <p className="text-sm text-foreground">{l.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(l.created_at)} · {l.actor_name || "Sistema"}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
