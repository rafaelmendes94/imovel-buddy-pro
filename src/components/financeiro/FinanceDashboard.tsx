import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { FinPayment, FinPlan, FinSubscriber } from "@/hooks/useFinanceData";
import {
  formatCurrency, isLate, isOpen, isPaid, monthShortLabel, monthlyEquivalent, toDate,
} from "@/lib/finance";
import { differenceInDays, endOfMonth, isSameMonth, isSameYear, startOfMonth, startOfWeek, subMonths } from "date-fns";

const PALETTE = ["hsl(215 60% 35%)", "hsl(43 74% 49%)", "hsl(160 60% 40%)", "hsl(0 70% 55%)", "hsl(260 50% 55%)"];

interface Props {
  subscribers: FinSubscriber[];
  payments: FinPayment[];
  plans: FinPlan[];
  cycleOf: (s: FinSubscriber) => string;
  planOf: (s: FinSubscriber) => FinPlan | null;
}

export function FinanceDashboard({ subscribers, payments, plans, cycleOf, planOf }: Props) {
  const [range, setRange] = useState("30");
  const now = new Date();

  const stats = useMemo(() => {
    const paid = payments.filter(isPaid);
    const open = payments.filter(isOpen);
    const sum = (list: FinPayment[]) => list.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const paidOn = (fn: (d: Date) => boolean) => sum(paid.filter((p) => { const d = toDate(p.paid_at); return !!d && fn(d); }));

    const active = subscribers.filter((s) => ["active", "pending_payment", "overdue"].includes(s.status));
    const mrr = active.reduce((s, sub) => {
      const plan = planOf(sub);
      const amount = plan?.price ?? Number(payments.find((p) => p.subscriber_id === sub.id)?.amount || 0);
      return s + monthlyEquivalent(amount, cycleOf(sub));
    }, 0);

    const monthPaid = paidOn((d) => isSameMonth(d, now));
    const monthOpen = sum(open.filter((p) => { const d = toDate(p.due_date); return !!d && isSameMonth(d, now); }));
    const lateSum = sum(open.filter((p) => isLate(p)));
    const lateSubs = new Set(open.filter((p) => isLate(p)).map((p) => p.subscriber_id));
    const paidCount = paid.length || 1;

    return {
      today: paidOn((d) => d.toDateString() === now.toDateString()),
      week: paidOn((d) => d >= startOfWeek(now, { weekStartsOn: 1 })),
      month: monthPaid,
      year: paidOn((d) => isSameYear(d, now)),
      receivable: monthOpen,
      late: lateSum,
      mrr,
      ticket: sum(paid) / paidCount,
      activeCount: active.length,
      newCount: subscribers.filter((s) => { const d = toDate(s.created_at); return !!d && isSameMonth(d, now); }).length,
      cancelled: subscribers.filter((s) => s.status === "cancelled").length,
      defaultRate: active.length ? (lateSubs.size / active.length) * 100 : 0,
      forecast: monthPaid + monthOpen,
    };
  }, [payments, subscribers, planOf, cycleOf, now]);

  const revenueSeries = useMemo(() => {
    const months = range === "365" ? 12 : range === "90" ? 3 : range === "30" ? 6 : 6;
    return Array.from({ length: months }, (_, i) => {
      const ref = subMonths(startOfMonth(now), months - 1 - i);
      const recebido = payments
        .filter((p) => isPaid(p) && toDate(p.paid_at) && isSameMonth(toDate(p.paid_at)!, ref))
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      const previsto = payments
        .filter((p) => toDate(p.due_date) && isSameMonth(toDate(p.due_date)!, ref))
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      const atraso = payments
        .filter((p) => isOpen(p) && isLate(p, endOfMonth(ref)) && toDate(p.due_date) && toDate(p.due_date)! <= endOfMonth(ref))
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      return { mes: monthShortLabel(ref), recebido, previsto, atraso };
    });
  }, [payments, range, now]);

  const byType = useMemo(() => {
    const grouped: Record<string, number> = {};
    payments.filter(isPaid).forEach((p) => {
      const sub = subscribers.find((s) => s.id === p.subscriber_id);
      const key = sub?.subscriber_type === "imobiliaria" ? "Imobiliária" : "Corretor autônomo";
      grouped[key] = (grouped[key] || 0) + Number(p.amount || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [payments, subscribers]);

  const byPlan = useMemo(() => {
    const grouped: Record<string, number> = {};
    subscribers.forEach((s) => {
      const name = planOf(s)?.name || "Sem plano";
      grouped[name] = (grouped[name] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [subscribers, planOf]);

  const kpis = [
    { label: "Receita hoje", value: formatCurrency(stats.today) },
    { label: "Receita da semana", value: formatCurrency(stats.week) },
    { label: "Receita do mês", value: formatCurrency(stats.month) },
    { label: "Receita do ano", value: formatCurrency(stats.year) },
    { label: "A receber no mês", value: formatCurrency(stats.receivable) },
    { label: "Em atraso", value: formatCurrency(stats.late) },
    { label: "MRR", value: formatCurrency(stats.mrr) },
    { label: "Ticket médio", value: formatCurrency(stats.ticket) },
    { label: "Assinantes ativos", value: String(stats.activeCount) },
    { label: "Novos no mês", value: String(stats.newCount) },
    { label: "Cancelamentos", value: String(stats.cancelled) },
    { label: "Inadimplência", value: `${stats.defaultRate.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-3.5">
            <p className="text-[11px] text-muted-foreground leading-tight">{k.label}</p>
            <p className="text-lg font-bold text-foreground mt-1 tabular-nums">{k.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Recebido x previsto</h3>
            <p className="text-xs text-muted-foreground">
              Previsão do mês: {formatCurrency(stats.month)} recebido + {formatCurrency(stats.receivable)} previsto ={" "}
              <span className="font-semibold text-foreground">{formatCurrency(stats.forecast)}</span>
            </p>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 6 meses</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="365">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="previsto" name="Previsto" fill={PALETTE[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="recebido" name="Recebido" fill={PALETTE[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Receita por tipo de cliente</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" outerRadius={80} label>
                  {byType.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Assinaturas por plano</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPlan} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Assinantes" fill={PALETTE[1]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Evolução da inadimplência</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="atraso" name="Em atraso" stroke={PALETTE[3]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
