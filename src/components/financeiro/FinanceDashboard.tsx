import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { FinPayment, FinPlan, FinSubscriber } from "@/hooks/useFinanceData";
import {
  formatCurrency, isLate, isOpen, isPaid, monthShortLabel, monthlyEquivalent, toDate,
} from "@/lib/finance";
import { differenceInDays, endOfMonth, isSameMonth, isSameYear, startOfMonth, startOfWeek, subMonths } from "date-fns";

const PALETTE = [
  "hsl(var(--fin-blue))",
  "hsl(var(--fin-navy))",
  "hsl(var(--fin-ink))",
  "hsl(var(--fin-slate))",
  "hsl(210 45% 62%)",
];

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

    const active = subscribers.filter((s) => ["trial", "active", "pending_payment", "overdue"].includes(s.status));
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

  const kpis: { label: string; value: string; tone: string }[] = [
    { label: "Receita hoje", value: formatCurrency(stats.today), tone: "var(--fin-emerald)" },
    { label: "Receita da semana", value: formatCurrency(stats.week), tone: "var(--fin-emerald)" },
    { label: "Receita do mês", value: formatCurrency(stats.month), tone: "var(--fin-emerald)" },
    { label: "Receita do ano", value: formatCurrency(stats.year), tone: "var(--fin-emerald)" },
    { label: "A receber no mês", value: formatCurrency(stats.receivable), tone: "var(--fin-amber)" },
    { label: "Em atraso", value: formatCurrency(stats.late), tone: "var(--fin-rose)" },
    { label: "MRR", value: formatCurrency(stats.mrr), tone: "var(--fin-blue)" },
    { label: "Ticket médio", value: formatCurrency(stats.ticket), tone: "var(--fin-blue)" },
    { label: "Assinantes ativos", value: String(stats.activeCount), tone: "var(--fin-navy)" },
    { label: "Novos no mês", value: String(stats.newCount), tone: "var(--fin-blue)" },
    { label: "Cancelamentos", value: String(stats.cancelled), tone: "var(--fin-ink)" },
    { label: "Inadimplência", value: `${stats.defaultRate.toFixed(1)}%`, tone: "var(--fin-rose)" },
  ];

  const totalByType = byType.reduce((s, d) => s + d.value, 0);

  const axis = {
    tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
    stroke: "hsl(var(--border))",
    tickLine: false,
    axisLine: false,
  } as const;

  const ChartTooltip = ({ active, payload, label, money = true }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border/40 bg-foreground/90 backdrop-blur px-3 py-2 shadow-lg">
        {label && <p className="text-[11px] font-medium text-background/70 mb-1">{label}</p>}
        {payload.map((p: any) => (
          <div key={p.dataKey ?? p.name} className="flex items-center gap-2 text-xs text-background">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
            <span className="text-background/80">{p.name}</span>
            <span className="font-semibold tabular-nums ml-auto">
              {money ? formatCurrency(Number(p.value)) : String(p.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const legend = (
    <Legend
      iconType="circle"
      iconSize={8}
      wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "hsl(var(--muted-foreground))" }}
    />
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <Card
            key={k.label}
            style={{ ["--fin-tone" as any]: k.tone, animationDelay: `${i * 40}ms` }}
            className="fin-card fin-rise p-3.5 border border-border/60"
          >
            <p className="relative text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">{k.label}</p>
            <p className="relative text-xl font-bold text-foreground mt-1.5 tabular-nums tracking-tight">{k.value}</p>
          </Card>
        ))}
      </div>

      <Card className="fin-rise p-4 md:p-5 rounded-2xl border-border/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-semibold text-foreground text-base">Receita por período</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Previsão do mês: {formatCurrency(stats.month)} recebido + {formatCurrency(stats.receivable)} previsto ={" "}
              <span className="font-semibold text-foreground">{formatCurrency(stats.forecast)}</span>
            </p>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 6 meses</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="365">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.7} />
              <XAxis dataKey="mes" {...axis} />
              <YAxis {...axis} width={48} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.5 }} />
              <Bar
                dataKey="recebido"
                name="Recebido"
                fill="hsl(var(--fin-emerald))"
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
                animationDuration={900}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="fin-rise p-4 md:p-5 rounded-2xl border-border/60 shadow-sm">
        <h3 className="font-semibold text-foreground text-base">Recebido x previsto</h3>
        <p className="text-xs text-muted-foreground mt-0.5 mb-5">Comparativo mensal de valores previstos e efetivamente recebidos</p>
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={6}>
              <defs>
                <linearGradient id="finBarPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--fin-amber))" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(var(--fin-amber))" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="finBarRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--fin-emerald))" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="hsl(var(--fin-emerald))" stopOpacity={0.45} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.7} />
              <XAxis dataKey="mes" {...axis} />
              <YAxis {...axis} width={48} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.5 }} />
              {legend}
              <Bar dataKey="previsto" name="Previsto" fill="url(#finBarPrev)" radius={[8, 8, 0, 0]} maxBarSize={38} animationDuration={800} />
              <Bar dataKey="recebido" name="Recebido" fill="url(#finBarRec)" radius={[8, 8, 0, 0]} maxBarSize={38} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="fin-rise p-4 md:p-5 rounded-2xl border-border/60 shadow-sm">
          <h3 className="font-semibold text-foreground">Receita por tipo de cliente</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Imobiliárias x corretores autônomos</p>
          <div className="h-56 relative mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byType}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                  animationDuration={900}
                >
                  {byType.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                {legend}
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-x-0 top-[38%] -translate-y-1/2 text-center pointer-events-none">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="text-base font-bold text-foreground tabular-nums">{formatCurrency(totalByType)}</p>
            </div>
          </div>
        </Card>

        <Card className="fin-rise p-4 md:p-5 rounded-2xl border-border/60 shadow-sm">
          <h3 className="font-semibold text-foreground">Assinaturas por plano</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">Distribuição de assinantes</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPlan} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="finBarPlan" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--fin-navy))" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="hsl(var(--fin-blue))" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} {...axis} />
                <Tooltip content={<ChartTooltip money={false} />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.5 }} />
                <Bar dataKey="value" name="Assinantes" fill="url(#finBarPlan)" radius={[0, 8, 8, 0]} maxBarSize={22} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="fin-rise p-4 md:p-5 rounded-2xl border-border/60 shadow-sm">
          <h3 className="font-semibold text-foreground">Evolução da inadimplência</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">Valores em atraso por mês</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="finAreaLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--fin-rose))" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="hsl(var(--fin-rose))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.7} />
                <XAxis dataKey="mes" {...axis} />
                <YAxis {...axis} width={44} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
                <Area
                  type="monotone"
                  dataKey="atraso"
                  name="Em atraso"
                  stroke="hsl(var(--fin-rose))"
                  strokeWidth={2.5}
                  fill="url(#finAreaLate)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
