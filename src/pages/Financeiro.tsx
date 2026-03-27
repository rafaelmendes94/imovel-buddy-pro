import React from "react";
import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  DollarSign, Users, AlertTriangle, CheckCircle2, Plus, Search,
  Ban, TrendingUp, Calendar, Phone, Mail, CreditCard, UserPlus, ChevronDown, ChevronRight, Trash2, MessageCircle
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscriber {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  creci: string | null;
  plan: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  subscriber_id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  reference_month: string;
  created_at: string;
}

interface SubscriberBroker {
  id: string;
  subscriber_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  creci: string | null;
  status: string;
  created_at: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function Financeiro() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [brokers, setBrokers] = useState<SubscriberBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showBrokerDialog, setShowBrokerDialog] = useState<string | null>(null);
  const [newSub, setNewSub] = useState({ name: "", email: "", phone: "", creci: "", plan: "monthly", notes: "" });
  const [newBroker, setNewBroker] = useState({ name: "", email: "", phone: "", creci: "" });
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [showOverdueDialog, setShowOverdueDialog] = useState(false);
  const [editingWhatsApp, setEditingWhatsApp] = useState<string | null>(null);
  const [whatsAppInput, setWhatsAppInput] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [subRes, payRes, brokerRes] = await Promise.all([
      supabase.from("subscribers").select("*").order("name"),
      supabase.from("payments").select("*").order("due_date", { ascending: false }),
      supabase.from("subscriber_brokers").select("*").order("name"),
    ]);
    if (subRes.data) setSubscribers(subRes.data as Subscriber[]);
    if (payRes.data) setPayments(payRes.data as Payment[]);
    if (brokerRes.data) setBrokers(brokerRes.data as SubscriberBroker[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-mark overdue payments
  useEffect(() => {
    const overdue = payments.filter(
      (p) => p.status === "pending" && isBefore(parseISO(p.due_date), new Date())
    );
    if (overdue.length > 0) {
      overdue.forEach(async (p) => {
        await supabase.from("payments").update({ status: "overdue" }).eq("id", p.id);
      });
      const overdueBySubscriber: Record<string, number> = {};
      payments.filter(p => p.status === "overdue" || (p.status === "pending" && isBefore(parseISO(p.due_date), new Date()))).forEach(p => {
        overdueBySubscriber[p.subscriber_id] = (overdueBySubscriber[p.subscriber_id] || 0) + 1;
      });
      Object.entries(overdueBySubscriber).forEach(async ([subId, count]) => {
        if (count >= 2) {
          await supabase.from("subscribers").update({ status: "blocked" }).eq("id", subId);
          // Cascade block all brokers of this subscriber
          await supabase.from("subscriber_brokers").update({ status: "blocked" }).eq("subscriber_id", subId);
        }
      });
      fetchData();
    }
  }, [payments.length]);

  const handleCreateSubscriber = async () => {
    if (!newSub.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.from("subscribers").insert({
      name: newSub.name,
      email: newSub.email || null,
      phone: newSub.phone || null,
      creci: newSub.creci || null,
      plan: newSub.plan,
      notes: newSub.notes || null,
    }).select().single();

    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      return;
    }

    const now = new Date();
    if (newSub.plan === "quarterly") {
      await supabase.from("payments").insert({
        subscriber_id: data.id,
        amount: 200,
        due_date: format(now, "yyyy-MM-dd"),
        status: "pending",
        reference_month: `${format(now, "yyyy-MM")} a ${format(addMonths(now, 2), "yyyy-MM")}`,
      });
    } else {
      await supabase.from("payments").insert({
        subscriber_id: data.id,
        amount: 100,
        due_date: format(now, "yyyy-MM-dd"),
        status: "pending",
        reference_month: format(now, "yyyy-MM"),
      });
    }

    toast({ title: "Assinante cadastrado com sucesso!" });
    setNewSub({ name: "", email: "", phone: "", creci: "", plan: "monthly", notes: "" });
    setShowNewDialog(false);
    fetchData();
  };

  const handleAddBroker = async () => {
    if (!newBroker.name.trim() || !showBrokerDialog) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("subscriber_brokers").insert({
      subscriber_id: showBrokerDialog,
      name: newBroker.name,
      email: newBroker.email || null,
      phone: newBroker.phone || null,
      creci: newBroker.creci || null,
    });
    if (error) {
      toast({ title: "Erro ao adicionar corretor", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Corretor adicionado!" });
    setNewBroker({ name: "", email: "", phone: "", creci: "" });
    setShowBrokerDialog(null);
    fetchData();
  };

  const handleTogglePayment = async (payment: Payment) => {
    if (payment.status === "paid") return;
    await supabase.from("payments").update({
      status: "paid",
      paid_at: new Date().toISOString(),
    }).eq("id", payment.id);

    const subPayments = payments.filter(p => p.subscriber_id === payment.subscriber_id && p.id !== payment.id);
    const stillOverdue = subPayments.filter(p => p.status === "overdue").length;
    if (stillOverdue === 0) {
      await supabase.from("subscribers").update({ status: "active" }).eq("id", payment.subscriber_id);
      await supabase.from("subscriber_brokers").update({ status: "active" }).eq("subscriber_id", payment.subscriber_id);
    }

    const sub = subscribers.find(s => s.id === payment.subscriber_id);
    if (sub?.plan === "monthly") {
      const nextMonth = addMonths(parseISO(payment.due_date), 1);
      const existing = payments.find(p => p.subscriber_id === sub.id && p.reference_month === format(nextMonth, "yyyy-MM"));
      if (!existing) {
        await supabase.from("payments").insert({
          subscriber_id: sub.id, amount: 100,
          due_date: format(nextMonth, "yyyy-MM-dd"), status: "pending",
          reference_month: format(nextMonth, "yyyy-MM"),
        });
      }
    }

    if (sub?.plan === "quarterly" && payment.reference_month.includes(" a ")) {
      const lastMonthStr = payment.reference_month.split(" a ")[1];
      const nextStart = addMonths(parseISO(lastMonthStr + "-01"), 1);
      const nextEnd = addMonths(nextStart, 2);
      const refMonth = `${format(nextStart, "yyyy-MM")} a ${format(nextEnd, "yyyy-MM")}`;
      const existing = payments.find(p => p.subscriber_id === sub.id && p.reference_month === refMonth);
      if (!existing) {
        await supabase.from("payments").insert({
          subscriber_id: sub.id, amount: 200,
          due_date: format(nextStart, "yyyy-MM-dd"), status: "pending",
          reference_month: refMonth,
        });
      }
    }

    toast({ title: "Pagamento confirmado!" });
    fetchData();
  };

  const handleBlockSubscriber = async (sub: Subscriber) => {
    const newStatus = sub.status === "blocked" ? "active" : "blocked";
    await supabase.from("subscribers").update({ status: newStatus }).eq("id", sub.id);
    // Cascade: block/unblock all brokers of this subscriber
    await supabase.from("subscriber_brokers").update({ status: newStatus }).eq("subscriber_id", sub.id);
    toast({ title: newStatus === "blocked" ? "Assinante e corretores bloqueados" : "Assinante e corretores desbloqueados" });
    fetchData();
  };

  const handleBlockBroker = async (broker: SubscriberBroker) => {
    const newStatus = broker.status === "blocked" ? "active" : "blocked";
    await supabase.from("subscriber_brokers").update({ status: newStatus }).eq("id", broker.id);
    toast({ title: newStatus === "blocked" ? "Corretor bloqueado" : "Corretor desbloqueado" });
    fetchData();
  };

  const handleDeleteBroker = async (brokerId: string) => {
    await supabase.from("subscriber_brokers").delete().eq("id", brokerId);
    toast({ title: "Corretor removido" });
    fetchData();
  };

  const handleGenerateMonthlyPayment = async (sub: Subscriber) => {
    const now = new Date();
    const refMonth = format(now, "yyyy-MM");
    const existing = payments.find(p => p.subscriber_id === sub.id && p.reference_month.includes(refMonth));
    if (existing) {
      toast({ title: "Pagamento já existe para este mês", variant: "destructive" });
      return;
    }
    if (sub.plan === "quarterly") {
      const nextEnd = addMonths(now, 2);
      await supabase.from("payments").insert({
        subscriber_id: sub.id, amount: 200,
        due_date: format(now, "yyyy-MM-dd"), status: "pending",
        reference_month: `${refMonth} a ${format(nextEnd, "yyyy-MM")}`,
      });
    } else {
      await supabase.from("payments").insert({
        subscriber_id: sub.id, amount: 100,
        due_date: format(now, "yyyy-MM-dd"), status: "pending",
        reference_month: refMonth,
      });
    }
    toast({ title: "Cobrança gerada!" });
    fetchData();
  };

  const handleSaveWhatsApp = async (subId: string) => {
    const cleaned = whatsAppInput.replace(/\D/g, "");
    await supabase.from("subscribers").update({ phone: cleaned }).eq("id", subId);
    toast({ title: "WhatsApp salvo!" });
    setEditingWhatsApp(null);
    setWhatsAppInput("");
    fetchData();
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 11 && !cleaned.startsWith("55")) {
      cleaned = "55" + cleaned;
    }
    return cleaned;
  };

  const buildOverdueMessage = (sub: Subscriber) => {
    const subOverdue = overduePayments.filter(p => p.subscriber_id === sub.id);
    const total = subOverdue.reduce((s, p) => s + Number(p.amount), 0);
    const months = subOverdue.map(p => p.reference_month).join(", ");
    return `Olá ${sub.name.split(" ")[0]}, tudo bem? 🏠\n\nIdentificamos que sua assinatura possui *${subOverdue.length} pagamento(s) em atraso* referente(s) a: ${months}.\n\n💰 *Valor total em aberto: ${formatCurrency(total)}*\n\n📲 Para regularizar, realize o pagamento via PIX:\n\n🔑 *Chave PIX:* [SUA CHAVE PIX]\n\n⚠️ *Atenção:* O não pagamento pode resultar no *bloqueio do acesso* ao sistema para você e seus corretores vinculados.\n\nQualquer dúvida, estamos à disposição!\nEquipe Financeiro`;
  };

  const openWhatsApp = (phone: string, message?: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const url = message
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${formattedPhone}`;
    window.open(url, "_blank");
  };

  // Month filter options
  const monthOptions = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= -1; i--) {
      const d = subMonths(now, i);
      months.push({ value: format(d, "yyyy-MM"), label: `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}` });
    }
    return months;
  }, []);

  // Filtered payments by month
  const filteredPayments = useMemo(() => {
    if (filterMonth === "all") return payments;
    return payments.filter(p => p.reference_month.includes(filterMonth) || p.due_date.startsWith(filterMonth));
  }, [payments, filterMonth]);

  // Metrics (based on filtered payments)
  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter(s => s.status === "active").length;
  const blockedSubscribers = subscribers.filter(s => s.status === "blocked").length;
  const totalBrokers = brokers.length;

  const totalReceived = filteredPayments
    .filter(p => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);

  const totalPending = filteredPayments
    .filter(p => p.status === "pending" || p.status === "overdue")
    .reduce((s, p) => s + Number(p.amount), 0);

  const overduePayments = filteredPayments.filter(
    p => p.status === "overdue" || (p.status === "pending" && isBefore(parseISO(p.due_date), new Date()))
  );

  const overdueTotal = overduePayments.reduce((s, p) => s + Number(p.amount), 0);

  // Subscribers with overdue
  const subscribersWithOverdue = useMemo(() => {
    const ids = new Set(overduePayments.map(p => p.subscriber_id));
    return subscribers.filter(s => ids.has(s.id));
  }, [overduePayments, subscribers]);

  // Filtered subscribers
  const filtered = subscribers.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email?.toLowerCase().includes(search.toLowerCase())) ||
      (s.creci?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getSubscriberPayments = (subId: string) =>
    filteredPayments.filter(p => p.subscriber_id === subId).sort((a, b) => b.due_date.localeCompare(a.due_date));

  const getSubscriberBrokers = (subId: string) =>
    brokers.filter(b => b.subscriber_id === subId);

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativo</Badge>;
      case "blocked": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Bloqueado</Badge>;
      case "cancelled": return <Badge className="bg-muted text-muted-foreground">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const paymentStatusBadge = (payment: Payment) => {
    const isOverdue = payment.status === "overdue" || (payment.status === "pending" && isBefore(parseISO(payment.due_date), new Date()));
    if (payment.status === "paid") {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-default">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Pago
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge
          className="bg-red-500/20 text-red-400 border-red-500/30 cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
          onClick={() => handleTogglePayment(payment)}
        >
          <AlertTriangle className="w-3 h-3 mr-1" /> Atrasado — Clique para pagar
        </Badge>
      );
    }
    return (
      <Badge
        className="bg-amber-500/20 text-amber-400 border-amber-500/30 cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
        onClick={() => handleTogglePayment(payment)}
      >
        <CreditCard className="w-3 h-3 mr-1" /> Pendente — Clique para pagar
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-sm text-muted-foreground mt-1">Controle de assinaturas e pagamentos de corretores</p>
          </div>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Novo Assinante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Assinante</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Nome *</label>
                  <Input value={newSub.name} onChange={e => setNewSub({ ...newSub, name: e.target.value })} placeholder="Nome completo" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input value={newSub.email} onChange={e => setNewSub({ ...newSub, email: e.target.value })} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Telefone</label>
                  <Input value={newSub.phone} onChange={e => setNewSub({ ...newSub, phone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">CRECI</label>
                  <Input value={newSub.creci} onChange={e => setNewSub({ ...newSub, creci: e.target.value })} placeholder="CRECI-RS 00000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Plano</label>
                  <Select value={newSub.plan} onValueChange={v => setNewSub({ ...newSub, plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal — R$ 100,00/mês</SelectItem>
                      <SelectItem value="quarterly">Trimestral — R$ 200,00/3 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Observações</label>
                  <Input value={newSub.notes} onChange={e => setNewSub({ ...newSub, notes: e.target.value })} placeholder="Notas opcionais" />
                </div>
                <Button onClick={handleCreateSubscriber} className="w-full">Cadastrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alertas de atraso */}
        {overduePayments.length > 0 && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 cursor-pointer hover:bg-red-500/15 transition-colors"
            onClick={() => setShowOverdueDialog(true)}
          >
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">
                {overduePayments.length} pagamento{overduePayments.length > 1 ? "s" : ""} em atraso! <span className="text-xs font-normal text-red-400/70">— Clique para ver detalhes</span>
              </p>
              <p className="text-xs text-red-400/70">
                Assinantes: {subscribersWithOverdue.map(s => s.name).join(", ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-400">{formatCurrency(overdueTotal)}</p>
              <p className="text-[10px] text-red-400/70">Total em atraso</p>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assinantes</p>
                  <p className="text-xl font-bold text-foreground">{totalSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <UserPlus className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Corretores</p>
                  <p className="text-xl font-bold text-foreground">{totalBrokers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                  <p className="text-xl font-bold text-emerald-400">{activeSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Receita</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalReceived)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">A Receber</p>
                  <p className="text-lg font-bold text-amber-400">{formatCurrency(totalPending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border border-red-500/30 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors" onClick={() => setShowOverdueDialog(true)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Em Atraso</p>
                  <p className="text-lg font-bold text-red-400">{formatCurrency(overdueTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CRECI..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="blocked">Bloqueados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              {monthOptions.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subscriber Table */}
        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Assinante</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>CRECI</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Corretores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Carregando...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Nenhum assinante encontrado
                    </TableCell>
                  </TableRow>
                ) : filtered.map(sub => {
                  const subPayments = getSubscriberPayments(sub.id);
                  const subBrokers = getSubscriberBrokers(sub.id);
                  const isExpanded = expandedSub === sub.id;

                  return (
                    <React.Fragment key={sub.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                      >
                        <TableCell className="w-8 pr-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {sub.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                            </div>
                            <span className="font-medium text-foreground">{sub.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {sub.email && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" /> {sub.email}
                              </div>
                            )}
                            {sub.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" /> {sub.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{sub.creci || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {sub.plan === "quarterly" ? "Trimestral R$200" : "Mensal R$100"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {subBrokers.length} corretor{subBrokers.length !== 1 ? "es" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>{statusBadge(sub.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowBrokerDialog(sub.id)}>
                              <UserPlus className="w-3 h-3 mr-1" /> Corretor
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleGenerateMonthlyPayment(sub)}>
                              <Calendar className="w-3 h-3 mr-1" /> Cobrança
                            </Button>
                            <Button
                              size="sm"
                              variant={sub.status === "blocked" ? "default" : "destructive"}
                              className="text-xs h-7"
                              onClick={() => handleBlockSubscriber(sub)}
                            >
                              {sub.status === "blocked" ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" /> Desbloquear</>
                              ) : (
                                <><Ban className="w-3 h-3 mr-1" /> Bloquear</>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/20 p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Corretores vinculados */}
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <Users className="w-4 h-4" /> Corretores Vinculados
                                </h4>
                                {subBrokers.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">Nenhum corretor vinculado</p>
                                ) : (
                                  <div className="space-y-2">
                                    {subBrokers.map(b => (
                                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                                        <div className="flex items-center gap-3">
                                          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                                            {b.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-foreground">{b.name}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                              {b.creci && <span>CRECI: {b.creci}</span>}
                                              {b.email && <span>{b.email}</span>}
                                              {b.phone && <span>{b.phone}</span>}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {statusBadge(b.status)}
                                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleBlockBroker(b)}>
                                            {b.status === "blocked" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Ban className="w-3.5 h-3.5 text-destructive" />}
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDeleteBroker(b.id)}>
                                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Pagamentos */}
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" /> Histórico de Pagamentos
                                </h4>
                                {subPayments.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">Nenhum pagamento registrado</p>
                                ) : (
                                  <div className="space-y-2">
                                    {subPayments.map(p => (
                                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                                        <div className="flex items-center gap-4">
                                          <span className="text-sm font-medium text-foreground">{p.reference_month}</span>
                                          <span className="text-sm font-bold text-foreground">{formatCurrency(Number(p.amount))}</span>
                                          <span className="text-xs text-muted-foreground">Venc: {format(parseISO(p.due_date), "dd/MM/yyyy")}</span>
                                        </div>
                                        {paymentStatusBadge(p)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Broker Dialog */}
        <Dialog open={!!showBrokerDialog} onOpenChange={() => setShowBrokerDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Adicionar Corretor</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">
              Este corretor terá acesso ao sistema vinculado à assinatura do cliente. Não gera nova cobrança.
            </p>
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground">Nome *</label>
                <Input value={newBroker.name} onChange={e => setNewBroker({ ...newBroker, name: e.target.value })} placeholder="Nome do corretor" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={newBroker.email} onChange={e => setNewBroker({ ...newBroker, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Telefone</label>
                <Input value={newBroker.phone} onChange={e => setNewBroker({ ...newBroker, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">CRECI</label>
                <Input value={newBroker.creci} onChange={e => setNewBroker({ ...newBroker, creci: e.target.value })} placeholder="CRECI-RS 00000" />
              </div>
              <Button onClick={handleAddBroker} className="w-full">Adicionar Corretor</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
