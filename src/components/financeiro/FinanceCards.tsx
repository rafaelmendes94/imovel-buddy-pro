import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/finance";
import {
  AlertTriangle, Ban, CalendarClock, CalendarDays, DollarSign, Repeat, TrendingUp, Users,
} from "lucide-react";

export type CardKey = "revenue_month" | "receivable" | "overdue" | "active" | "defaulting" | "mrr";
export type AlertKey = "due_today" | "due_7" | "late" | "blocked";

interface Props {
  metrics: {
    revenueMonth: number;
    receivable: number;
    overdue: number;
    activeCount: number;
    defaultingCount: number;
    mrr: number;
    dueToday: number;
    due7: number;
    lateCount: number;
    blockedCount: number;
  };
  activeCard: CardKey | null;
  activeAlert: AlertKey | null;
  onCard: (k: CardKey) => void;
  onAlert: (k: AlertKey) => void;
}

export function FinanceCards({ metrics, activeCard, activeAlert, onCard, onAlert }: Props) {
  const cards: { key: CardKey; label: string; value: string; icon: any; tone: string }[] = [
    { key: "revenue_month", label: "Receita do mês", value: formatCurrency(metrics.revenueMonth), icon: DollarSign, tone: "var(--fin-emerald)" },
    { key: "receivable", label: "A receber", value: formatCurrency(metrics.receivable), icon: CalendarClock, tone: "var(--fin-amber)" },
    { key: "overdue", label: "Em atraso", value: formatCurrency(metrics.overdue), icon: AlertTriangle, tone: "var(--fin-rose)" },
    { key: "active", label: "Assinantes ativos", value: String(metrics.activeCount), icon: Users, tone: "var(--fin-blue)" },
    { key: "defaulting", label: "Inadimplentes", value: String(metrics.defaultingCount), icon: Ban, tone: "var(--fin-rose)" },
    { key: "mrr", label: "MRR", value: formatCurrency(metrics.mrr), icon: Repeat, tone: "var(--fin-navy)" },
  ];

  const alerts: { key: AlertKey; label: string; count: number; icon: any; tone: string }[] = [
    { key: "due_today", label: "Vencem hoje", count: metrics.dueToday, icon: CalendarDays, tone: "var(--fin-amber)" },
    { key: "due_7", label: "Próximos 7 dias", count: metrics.due7, icon: TrendingUp, tone: "var(--fin-blue)" },
    { key: "late", label: "Atrasados", count: metrics.lateCount, icon: AlertTriangle, tone: "var(--fin-rose)" },
    { key: "blocked", label: "Clientes bloqueados", count: metrics.blockedCount, icon: Ban, tone: "var(--fin-rose)" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((c, i) => (
          <Card
            key={c.key}
            onClick={() => onCard(c.key)}
            style={{ ["--fin-tone" as any]: c.tone, animationDelay: `${i * 55}ms` }}
            className={cn(
              "fin-card fin-rise p-4 cursor-pointer border active:scale-[0.99]",
              activeCard === c.key ? "border-primary ring-2 ring-primary/20" : "border-border/60",
            )}
          >
            <div className="relative flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">{c.label}</p>
              <span className="fin-icon w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <c.icon className="w-4 h-4" />
              </span>
            </div>
            <p className="relative text-2xl md:text-[28px] font-bold text-foreground mt-2.5 tabular-nums tracking-tight">
              {c.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {alerts.map((a) => (
          <button
            key={a.key}
            onClick={() => onAlert(a.key)}
            style={{ ["--fin-tone" as any]: a.tone }}
            className={cn(
              "fin-pill shrink-0 flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all hover:-translate-y-0.5",
              activeAlert === a.key && "ring-2 ring-primary/30",
            )}
          >
            <a.icon className="w-3.5 h-3.5" />
            {a.label}
            <span className="rounded-full bg-background/70 px-1.5 py-0.5 tabular-nums">{a.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
