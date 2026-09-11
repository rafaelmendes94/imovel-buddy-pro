import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { FinMember, FinPayment, FinSubscriber, useFinanceData } from "@/hooks/useFinanceData";
import { AlertKey, CardKey, FinanceCards } from "@/components/financeiro/FinanceCards";
import { FinanceDashboard } from "@/components/financeiro/FinanceDashboard";
import { PaymentHistory, QuickPayButton } from "@/components/financeiro/PaymentHistory";
import { MembersPanel } from "@/components/financeiro/MembersPanel";
import { SubscriberProfile } from "@/components/financeiro/SubscriberProfile";
import { StatusBadge } from "@/components/financeiro/StatusBadge";
import {
  CancelDialog, ChargeDialog, ManualPaymentDialog, NoteDialog, SubscriberEditDialog,
} from "@/components/financeiro/FinanceDialogs";
import {
  CYCLE_LABEL, buildChargeMessage, competenceLabel, daysToDue, formatCurrency, formatDate, isLate, isOpen,
  isPaid, monthlyEquivalent, normalizeCycle, toDate, waLink,
} from "@/lib/finance";
import { isSameMonth } from "date-fns";
import { Ban, ChevronDown, ChevronRight, MessageCircle, MoreHorizontal, Pencil, Plus, Search, Users } from "lucide-react";

export default function Financeiro() {
  const { isSuperAdmin, hasModuleAccess, loading: authLoading } = useAuth();
  const canAccess = isSuperAdmin || hasModuleAccess("financeiro");

  const fin = useFinanceData();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterDue, setFilterDue] = useState("all");
  const [activeCard, setActiveCard] = useState<CardKey | null>(null);
  const [activeAlert, setActiveAlert] = useState<AlertKey | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [profileSub, setProfileSub] = useState<FinSubscriber | null>(null);
  const [membersSub, setMembersSub] = useState<FinSubscriber | null>(null);
  const [editSub, setEditSub] = useState<FinSubscriber | null>(null);
  const [chargeSub, setChargeSub] = useState<FinSubscriber | null>(null);
  const [cancelSub, setCancelSub] = useState<FinSubscriber | null>(null);
  const [noteSub, setNoteSub] = useState<FinSubscriber | null>(null);
  const [blockSub, setBlockSub] = useState<{ sub: FinSubscriber; block: boolean } | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDefault, setManualDefault] = useState<string | undefined>();
  const [unblockAsk, setUnblockAsk] = useState<FinSubscriber | null>(null);

  if (!authLoading && !canAccess) return <Navigate to="/dashboard" replace />;

  const paymentsOf = (id: string) => fin.payments.filter((p) => p.subscriber_id === id);
  const membersOf = (id: string) => fin.members.filter((m) => m.subscriber_id === id);
  const logsOf = (id: string) => fin.logs.filter((l) => l.subscriber_id === id);

  const openPaymentOf = (id: string) =>
    paymentsOf(id)
      .filter(isOpen)
      .sort((a, b) => (a.due_date > b.due_date ? 1 : -1))[0] || null;

  const lastPaidOf = (id: string) =>
    paymentsOf(id)
      .filter(isPaid)
      .sort((a, b) => ((a.paid_at || a.due_date) < (b.paid_at || b.due_date) ? 1 : -1))[0] || null;

  const amountOf = (sub: FinSubscriber) =>
    fin.planOf(sub)?.price ?? Number(openPaymentOf(sub.id)?.amount ?? lastPaidOf(sub.id)?.amount ?? 0);

  const metrics = useMemo(() => {
    const now = new Date();
    const open = fin.payments.filter(isOpen);
    const sum = (l: FinPayment[]) => l.reduce((s, p) => s + Number(p.amount || 0), 0);
    const activeSubs = fin.subscribers.filter((s) => ["active", "pending_payment", "overdue"].includes(s.status));
    return {
      revenueMonth: sum(fin.payments.filter((p) => isPaid(p) && toDate(p.paid_at) && isSameMonth(toDate(p.paid_at)!, now))),
      receivable: sum(open.filter((p) => !isLate(p))),
      overdue: sum(open.filter((p) => isLate(p))),
      activeCount: activeSubs.length,
      defaultingCount: fin.subscribers.filter((s) => ["overdue", "defaulting"].includes(s.status)).length ||
        new Set(open.filter((p) => isLate(p)).map((p) => p.subscriber_id)).size,
      mrr: activeSubs.reduce((s, sub) => s + monthlyEquivalent(amountOf(sub), fin.cycleOf(sub)), 0),
      dueToday: open.filter((p) => daysToDue(p) === 0).length,
      due7: open.filter((p) => daysToDue(p) > 0 && daysToDue(p) <= 7).length,
      lateCount: open.filter((p) => isLate(p)).length,
      blockedCount: fin.subscribers.filter((s) => s.status === "blocked").length,
    };
  }, [fin.payments, fin.subscribers, fin.plans]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return fin.subscribers.filter((s) => {
      const members = membersOf(s.id);
      if (term) {
        const hay = [s.name, s.phone, s.email, s.creci, s.city, ...members.map((m) => m.name)]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterType !== "all" && s.subscriber_type !== filterType) return false;
      if (filterPlan !== "all" && s.plan_id !== filterPlan) return false;

      const openP = openPaymentOf(s.id);
      if (filterDue === "late" && !(openP && isLate(openP))) return false;
      if (filterDue === "7" && !(openP && daysToDue(openP) >= 0 && daysToDue(openP) <= 7)) return false;
      if (filterDue === "month" && !(openP && toDate(openP.due_date) && isSameMonth(toDate(openP.due_date)!, new Date()))) return false;

      if (activeCard === "active" && !["active", "pending_payment", "overdue"].includes(s.status)) return false;
      if (activeCard === "defaulting" && !(openP && isLate(openP))) return false;
      if (activeCard === "overdue" && !(openP && isLate(openP))) return false;
      if (activeCard === "receivable" && !(openP && !isLate(openP))) return false;
      if (activeCard === "revenue_month" && !paymentsOf(s.id).some((p) => isPaid(p) && toDate(p.paid_at) && isSameMonth(toDate(p.paid_at)!, new Date()))) return false;

      if (activeAlert === "due_today" && !(openP && daysToDue(openP) === 0)) return false;
      if (activeAlert === "due_7" && !(openP && daysToDue(openP) > 0 && daysToDue(openP) <= 7)) return false;
      if (activeAlert === "late" && !(openP && isLate(openP))) return false;
      if (activeAlert === "blocked" && s.status !== "blocked") return false;
      return true;
    });
  }, [fin.subscribers, fin.payments, fin.members, search, filterStatus, filterType, filterPlan, filterDue, activeCard, activeAlert]);

  const confirmPayment = async (sub: FinSubscriber, payment: FinPayment) => {
    await fin.confirmPayment(payment, sub);
    toast({ title: "Pagamento registrado", description: `${sub.name} · ${formatCurrency(payment.amount)}` });
    if (sub.status === "blocked") setUnblockAsk(sub);
  };

  const charge = (sub: FinSubscriber) => {
    const openP = openPaymentOf(sub.id);
    const amount = openP ? Number(openP.amount) : amountOf(sub);
    const due = openP?.due_date || sub.next_due_date || "";
    const link = waLink(sub.phone, buildChargeMessage(sub.name, amount, due));
    if (!link) {
      toast({ title: "Sem WhatsApp cadastrado", description: "Cadastre o telefone do assinante.", variant: "destructive" });
      return;
    }
    fin.logEvent(sub.id, "charge_sent", `Cobrança enviada por WhatsApp (${formatCurrency(amount)})`);
    window.open(link, "_blank");
  };

  const cycleLabel = (sub: FinSubscriber) => CYCLE_LABEL[normalizeCycle(fin.cycleOf(sub))];

  const rowActions = (sub: FinSubscriber) => (
    <div className="flex items-center gap-1.5 justify-end">
      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); charge(sub); }}>
        <MessageCircle className="w-3.5 h-3.5 mr-1" />Cobrar
      </Button>
      <QuickPayButton payment={openPaymentOf(sub.id)} onConfirm={(p) => confirmPayment(sub, p)} />
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditSub(sub); }}>
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setMembersSub(sub); }}>
        <Users className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className={sub.status === "blocked" ? "text-emerald-600" : "text-destructive"}
        onClick={(e) => { e.stopPropagation(); setBlockSub({ sub, block: sub.status !== "blocked" }); }}
      >
        <Ban className="w-3.5 h-3.5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setProfileSub(sub)}>Ver histórico e perfil</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditSub(sub)}>Alterar plano / vencimento</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setChargeSub(sub)}>Gerar cobrança</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setManualDefault(sub.id); setManualOpen(true); }}>
            Registrar pagamento
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setManualDefault(sub.id); setManualOpen(true); }}>
            Desconto / cortesia
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setNoteSub(sub)}>Observação</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => setCancelSub(sub)}>
            Cancelar assinatura
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const expandedPanel = (sub: FinSubscriber) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 bg-muted/30 p-4 rounded-lg">
      <MembersPanel
        subscriberId={sub.id}
        members={membersOf(sub.id)}
        onSave={fin.upsertMember}
        onRemove={fin.removeMember}
        onStatus={fin.setMemberStatus}
      />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Histórico de pagamentos
        </p>
        <PaymentHistory subscriber={sub} payments={paymentsOf(sub.id)} onConfirm={(p) => confirmPayment(sub, p)} />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Financeiro</h1>
              <p className="text-xs text-muted-foreground">Assinaturas, cobranças e recorrência</p>
            </div>
          </div>
          <Button onClick={() => { setManualDefault(undefined); setManualOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Registrar pagamento
          </Button>
        </div>

        <Tabs defaultValue="assinantes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assinantes">Assinantes</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="assinantes" className="space-y-4">
            <FinanceCards
              metrics={metrics}
              activeCard={activeCard}
              activeAlert={activeAlert}
              onCard={(k) => { setActiveCard(activeCard === k ? null : k); setActiveAlert(null); }}
              onAlert={(k) => { setActiveAlert(activeAlert === k ? null : k); setActiveCard(null); }}
            />

            <Card className="p-3 md:p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Nome, telefone, CRECI, corretor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="pending_payment">Pagamento pendente</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="defaulting">Inadimplente</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                    <SelectItem value="corretor">Corretor autônomo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger><SelectValue placeholder="Plano" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os planos</SelectItem>
                    {fin.plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Select value={filterDue} onValueChange={setFilterDue}>
                <SelectTrigger className="md:w-64"><SelectValue placeholder="Vencimento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer vencimento</SelectItem>
                  <SelectItem value="late">Atrasados</SelectItem>
                  <SelectItem value="7">Próximos 7 dias</SelectItem>
                  <SelectItem value="month">Neste mês</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            {fin.loading ? (
              <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">Nenhum assinante encontrado.</Card>
            ) : (
              <>
                {/* Desktop */}
                <Card className="hidden md:block overflow-x-auto">
                  <Table className="min-w-[1180px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>Assinante</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Último pgto.</TableHead>
                        <TableHead>Próximo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((sub) => {
                        const openP = openPaymentOf(sub.id);
                        const lastP = lastPaidOf(sub.id);
                        const isOpenRow = expanded === sub.id;
                        return (
                          <>
                            <TableRow
                              key={sub.id}
                              className="cursor-pointer"
                              onClick={() => setExpanded(isOpenRow ? null : sub.id)}
                            >
                              <TableCell>{isOpenRow ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</TableCell>
                              <TableCell>
                                <button className="text-left" onClick={(e) => { e.stopPropagation(); setProfileSub(sub); }}>
                                  <p className="font-semibold text-foreground hover:underline">{sub.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {membersOf(sub.id).length} usuário(s) · {sub.city || "—"}
                                  </p>
                                </button>
                              </TableCell>
                              <TableCell className="text-xs">
                                <p>{sub.phone || "—"}</p>
                                <p className="text-muted-foreground">{sub.email || "—"}</p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[11px]">
                                  {sub.subscriber_type === "imobiliaria" ? "Imobiliária" : "Corretor"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                <p className="font-medium">{fin.planOf(sub)?.name || "Sem plano"}</p>
                                <p className="text-muted-foreground">{cycleLabel(sub)}</p>
                              </TableCell>
                              <TableCell className="font-semibold tabular-nums">{formatCurrency(amountOf(sub))}</TableCell>
                              <TableCell className="text-xs">{formatDate(openP?.due_date || sub.next_due_date)}</TableCell>
                              <TableCell><StatusBadge status={sub.status} /></TableCell>
                              <TableCell className="text-xs">{lastP ? formatDate(lastP.paid_at || lastP.due_date) : "—"}</TableCell>
                              <TableCell className="text-xs">{competenceLabel(openP?.competence, openP?.due_date)}</TableCell>
                              <TableCell>{rowActions(sub)}</TableCell>
                            </TableRow>
                            {isOpenRow && (
                              <TableRow key={`${sub.id}-exp`}>
                                <TableCell colSpan={11} className="p-3">{expandedPanel(sub)}</TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>

                {/* Mobile */}
                <div className="md:hidden space-y-3">
                  {filtered.map((sub) => {
                    const openP = openPaymentOf(sub.id);
                    return (
                      <Card key={sub.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{sub.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {fin.planOf(sub)?.name || cycleLabel(sub)} · {formatCurrency(amountOf(sub))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vence {formatDate(openP?.due_date || sub.next_due_date)}
                            </p>
                          </div>
                          <StatusBadge status={sub.status} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Button size="lg" variant="outline" className="h-11" onClick={() => charge(sub)}>Cobrar</Button>
                          {openP ? (
                            <QuickPayButton payment={openP} onConfirm={(p) => confirmPayment(sub, p)} className="h-11 w-full" />
                          ) : (
                            <Button size="lg" variant="outline" className="h-11" disabled>Pago</Button>
                          )}
                          <Button size="lg" className="h-11" onClick={() => setProfileSub(sub)}>Abrir</Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="dashboard">
            <FinanceDashboard
              subscribers={fin.subscribers}
              payments={fin.payments}
              plans={fin.plans}
              cycleOf={fin.cycleOf}
              planOf={fin.planOf}
            />
          </TabsContent>
        </Tabs>
      </div>

      <SubscriberProfile
        open={!!profileSub}
        onOpenChange={(v) => !v && setProfileSub(null)}
        subscriber={profileSub}
        plan={profileSub ? fin.planOf(profileSub) : null}
        payments={profileSub ? paymentsOf(profileSub.id) : []}
        members={profileSub ? membersOf(profileSub.id) : []}
        logs={profileSub ? logsOf(profileSub.id) : []}
        onConfirmPayment={(p) => confirmPayment(profileSub!, p)}
        onSaveMember={fin.upsertMember}
        onRemoveMember={fin.removeMember}
        onMemberStatus={fin.setMemberStatus}
      />

      <SubscriberProfile
        open={!!membersSub}
        onOpenChange={(v) => !v && setMembersSub(null)}
        subscriber={membersSub}
        plan={membersSub ? fin.planOf(membersSub) : null}
        payments={membersSub ? paymentsOf(membersSub.id) : []}
        members={membersSub ? membersOf(membersSub.id) : []}
        logs={membersSub ? logsOf(membersSub.id) : []}
        onConfirmPayment={(p) => confirmPayment(membersSub!, p)}
        onSaveMember={fin.upsertMember}
        onRemoveMember={fin.removeMember}
        onMemberStatus={fin.setMemberStatus}
      />

      <SubscriberEditDialog
        open={!!editSub}
        onOpenChange={(v) => !v && setEditSub(null)}
        subscriber={editSub}
        plans={fin.plans}
        onSubmit={async (patch) => {
          if (!editSub) return;
          await fin.updateSubscriber(editSub, patch, "Plano/cadastro atualizado", "plan_changed");
          toast({ title: "Assinante atualizado" });
        }}
      />

      <ChargeDialog
        open={!!chargeSub}
        onOpenChange={(v) => !v && setChargeSub(null)}
        subscriber={chargeSub}
        defaultAmount={chargeSub ? amountOf(chargeSub) : 0}
        onSubmit={async (amount, dueDate) => {
          if (!chargeSub) return;
          await fin.createCharge(chargeSub, amount, dueDate);
          toast({ title: "Cobrança criada" });
        }}
      />

      <ManualPaymentDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        subscribers={fin.subscribers}
        defaultSubscriberId={manualDefault}
        onSubmit={async (input) => {
          await fin.registerManualPayment(input);
          toast({ title: "Lançamento registrado" });
        }}
      />

      <CancelDialog
        open={!!cancelSub}
        onOpenChange={(v) => !v && setCancelSub(null)}
        subscriber={cancelSub}
        onSubmit={async (reason, note) => {
          if (!cancelSub) return;
          await fin.cancelSubscription(cancelSub, reason, note);
          toast({ title: "Assinatura cancelada" });
        }}
      />

      <NoteDialog
        open={!!noteSub}
        onOpenChange={(v) => !v && setNoteSub(null)}
        subscriber={noteSub}
        onSubmit={async (notes) => {
          if (!noteSub) return;
          await fin.updateSubscriber(noteSub, { notes }, "Observação registrada", "note");
          toast({ title: "Observação salva" });
        }}
      />

      <AlertDialog open={!!blockSub} onOpenChange={(v) => !v && setBlockSub(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockSub?.block ? "Bloquear acesso do grupo?" : "Liberar acesso do grupo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockSub?.block
                ? "O titular e todos os usuários vinculados perdem o acesso. Nenhum dado é apagado."
                : "Os acessos que estavam ativos antes do bloqueio serão restaurados."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
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

      <AlertDialog open={!!unblockAsk} onOpenChange={(v) => !v && setUnblockAsk(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Liberar o acesso agora?</AlertDialogTitle>
            <AlertDialogDescription>
              {unblockAsk?.name} está bloqueado. Deseja liberar o acesso do titular e dos vinculados?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter bloqueado</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!unblockAsk) return;
                await fin.setGroupBlocked(unblockAsk, false);
                toast({ title: "Acesso liberado" });
                setUnblockAsk(null);
              }}
            >
              Liberar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
