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
  const cards: { key: CardKey; label: string; value: string; icon: any; accent: string }[] = [
    { key: "revenue_month", label: "Receita do mês", value: formatCurrency(metrics.revenueMonth), icon: DollarSign, accent: "text-emerald-600 bg-emerald-50" },
    { key: "receivable", label: "A receber", value: formatCurrency(metrics.receivable), icon: CalendarClock, accent: "text-sky-600 bg-sky-50" },
    { key: "overdue", label: "Em atraso", value: formatCurrency(metrics.overdue), icon: AlertTriangle, accent: "text-rose-600 bg-rose-50" },
    { key: "active", label: "Assinantes ativos", value: String(metrics.activeCount), icon: Users, accent: "text-indigo-600 bg-indigo-50" },
    { key: "defaulting", label: "Inadimplentes", value: String(metrics.defaultingCount), icon: Ban, accent: "text-orange-600 bg-orange-50" },
    { key: "mrr", label: "MRR", value: formatCurrency(metrics.mrr), icon: Repeat, accent: "text-violet-600 bg-violet-50" },
  ];

  const alerts: { key: AlertKey; label: string; count: number; icon: any; tone: string }[] = [
    { key: "due_today", label: "Vencem hoje", count: metrics.dueToday, icon: CalendarDays, tone: "border-amber-200 text-amber-700 bg-amber-50" },
    { key: "due_7", label: "Próximos 7 dias", count: metrics.due7, icon: TrendingUp, tone: "border-sky-200 text-sky-700 bg-sky-50" },
    { key: "late", label: "Atrasados", count: metrics.lateCount, icon: AlertTriangle, tone: "border-rose-200 text-rose-700 bg-rose-50" },
    { key: "blocked", label: "Clientes bloqueados", count: metrics.blockedCount, icon: Ban, tone: "border-slate-200 text-slate-700 bg-slate-100" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card
            key={c.key}
            onClick={() => onCard(c.key)}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md active:scale-[0.99] border",
              activeCard === c.key ? "border-primary ring-2 ring-primary/20" : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted-foreground leading-tight">{c.label}</p>
              <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", c.accent)}>
                <c.icon className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground mt-2 tabular-nums">{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {alerts.map((a) => (
          <button
            key={a.key}
            onClick={() => onAlert(a.key)}
            className={cn(
              "shrink-0 flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all",
              a.tone,
              activeAlert === a.key && "ring-2 ring-primary/30",
            )}
          >
            <a.icon className="w-3.5 h-3.5" />
            {a.label}
            <span className="rounded-full bg-white/70 px-1.5 py-0.5 tabular-nums">{a.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
