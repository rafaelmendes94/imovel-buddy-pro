import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard } from "@/components/MetricCard";
import {
  salesRecords,
  salesData,
  formatCurrency,
  SaleRecord,
} from "@/data/mockData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine, LineChart, Line, Legend,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Target, Calendar, Download,
  Trophy, Building2, Home, MapPin, Star, BarChart3, CalendarDays,
  CalendarRange, ArrowUp, ArrowDown, Minus, ChevronDown, SlidersHorizontal, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Constants ───
const SEGMENT_COLORS: Record<string, string> = {
  "Luxo": "hsl(142, 71%, 45%)", "Alto Padrão": "hsl(142, 50%, 55%)",
  "Médio Padrão": "hsl(38, 92%, 50%)", "Econômico": "hsl(0, 72%, 51%)",
};
const TYPE_COLORS: Record<string, string> = {
  "Apartamento": "hsl(142, 71%, 45%)", "Casa": "hsl(142, 50%, 60%)",
  "Comercial": "hsl(38, 92%, 50%)", "Terreno": "hsl(0, 60%, 55%)",
};

const ALL_CITIES = [...new Set(salesRecords.map(s => s.city))].sort();
const ALL_TYPES: SaleRecord["type"][] = ["Apartamento", "Casa", "Comercial", "Terreno"];
const ALL_SEGMENTS: SaleRecord["segment"][] = ["Luxo", "Alto Padrão", "Médio Padrão", "Econômico"];
const ALL_MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ALL_YEARS = [...new Set(salesRecords.map(s => new Date(s.date).getFullYear()))].sort((a, b) => b - a);
const MONTH_MAP: Record<string, number> = { "Jan": 0, "Fev": 1, "Mar": 2, "Abr": 3, "Mai": 4, "Jun": 5, "Jul": 6, "Ago": 7, "Set": 8, "Out": 9, "Nov": 10, "Dez": 11 };

type TimePeriod = "Todos" | "Dia" | "Semana" | "Mês" | "Ano";
type TabType = "relatorio" | "comparativo";

// ─── Helpers ───
function isToday(d: string) { return new Date(d).toDateString() === new Date("2026-03-27").toDateString(); }
function isThisWeek(d: string) {
  const date = new Date(d), now = new Date("2026-03-27"), ws = new Date(now);
  ws.setDate(now.getDate() - now.getDay()); ws.setHours(0, 0, 0, 0);
  return date >= ws && date <= now;
}
function isThisMonth(d: string) { const dt = new Date(d); return dt.getMonth() === 2 && dt.getFullYear() === 2026; }
function isThisYear(d: string) { return new Date(d).getFullYear() === 2026; }

// ─── Filter Chip ───
function FilterChip({ label, active, onClick, onRemove, size = "sm" }: {
  label: string; active: boolean; onClick: () => void; onRemove?: () => void; size?: "sm" | "xs";
}) {
  return (
    <button onClick={onClick} className={`
      ${size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"}
      rounded-md font-medium transition-all inline-flex items-center gap-1 border
      ${active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
      }
    `}>
      {label}
      {active && onRemove && <X className="w-2.5 h-2.5 ml-0.5 opacity-70" onClick={(e) => { e.stopPropagation(); onRemove(); }} />}
    </button>
  );
}

// ─── Select Filter ───
function SelectFilter({ label, icon: Icon, options, value, onChange }: {
  label: string; icon: React.ElementType; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border border-border rounded-md px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer appearance-none pr-6"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Rankings helper ───
function useRankings(filtered: SaleRecord[]) {
  return useMemo(() => {
    const rank = (key: keyof SaleRecord | ((s: SaleRecord) => string)) => {
      const map: Record<string, { count: number; vgv: number }> = {};
      filtered.forEach(s => {
        const k = typeof key === "function" ? key(s) : String(s[key]);
        if (!map[k]) map[k] = { count: 0, vgv: 0 };
        map[k].count++; map[k].vgv += s.price;
      });
      return Object.entries(map).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.vgv - a.vgv);
    };
    return {
      byType: rank("type"), bySegment: rank("segment"), byCity: rank("city"),
      byBroker: rank("broker"), byOwner: rank("owner"), byNeighborhood: rank("neighborhood"),
      byEmpreendimento: rank(s => s.empreendimento || "Avulso"),
    };
  }, [filtered]);
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabType>("relatorio");
  const [filterCity, setFilterCity] = useState("Todas");
  const [filterType, setFilterType] = useState("Todos");
  const [filterSegment, setFilterSegment] = useState("Todos");
  const [filterSeaView, setFilterSeaView] = useState("Todos");
  const [filterPeriod, setFilterPeriod] = useState<TimePeriod>("Todos");
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = [filterCity !== "Todas", filterType !== "Todos", filterSegment !== "Todos", filterSeaView !== "Todos", filterPeriod !== "Todos", filterMonth !== null, filterYear !== null].filter(Boolean).length;
  const clearAll = () => { setFilterCity("Todas"); setFilterType("Todos"); setFilterSegment("Todos"); setFilterSeaView("Todos"); setFilterPeriod("Todos"); setFilterMonth(null); setFilterYear(null); };

  const filtered = useMemo(() => salesRecords.filter(s => {
    if (filterCity !== "Todas" && s.city !== filterCity) return false;
    if (filterType !== "Todos" && s.type !== filterType) return false;
    if (filterSegment !== "Todos" && s.segment !== filterSegment) return false;
    if (filterSeaView === "Sim" && !s.seaView) return false;
    if (filterSeaView === "Não" && s.seaView) return false;
    if (filterPeriod === "Dia" && !isToday(s.date)) return false;
    if (filterPeriod === "Semana" && !isThisWeek(s.date)) return false;
    if (filterPeriod === "Mês" && !isThisMonth(s.date)) return false;
    if (filterPeriod === "Ano" && !isThisYear(s.date)) return false;
    const d = new Date(s.date);
    if (filterMonth !== null && d.getMonth() !== filterMonth) return false;
    if (filterYear !== null && d.getFullYear() !== filterYear) return false;
    return true;
  }), [filterCity, filterType, filterSegment, filterSeaView, filterPeriod, filterMonth, filterYear]);

  const vgvYear = filtered.filter(s => isThisYear(s.date)).reduce((sum, s) => sum + s.price, 0);
  const vgvMonth = filtered.filter(s => isThisMonth(s.date)).reduce((sum, s) => sum + s.price, 0);
  const vgvWeek = filtered.filter(s => isThisWeek(s.date)).reduce((sum, s) => sum + s.price, 0);
  const totalSales = filtered.filter(s => isThisYear(s.date)).length;
  const avgTicket = totalSales > 0 ? vgvYear / totalSales : 0;

  const rankings = useRankings(filtered);

  const revenueBarData = salesData.map((d, i) => {
    const prev = i > 0 ? salesData[i - 1].receita : d.receita;
    const change = ((d.receita - prev) / prev) * 100;
    return { ...d, change: i === 0 ? 0 : change, trend: i === 0 ? "neutral" : change > 0 ? "alta" : change < 0 ? "baixa" : "neutral" };
  });
  const avgRevenue = salesData.reduce((s, d) => s + d.receita, 0) / salesData.length;
  const segmentPie = rankings.bySegment.map(s => ({ name: s.name, value: s.vgv, fill: SEGMENT_COLORS[s.name] || "hsl(var(--chart-4))" }));
  const typePie = rankings.byType.map(s => ({ name: s.name, value: s.count, fill: TYPE_COLORS[s.name] || "hsl(var(--chart-4))" }));

  // ─── Comparativo Anual ───
  const currentYear = 2026;
  const previousYear = 2025;
  const comparativoData = useMemo(() => {
    const currentYearSales = salesRecords.filter(s => new Date(s.date).getFullYear() === currentYear);
    const previousYearSales = salesRecords.filter(s => new Date(s.date).getFullYear() === previousYear);
    const segmentComparison = ALL_SEGMENTS.map(seg => {
      const curVgv = currentYearSales.filter(s => s.segment === seg).reduce((sum, s) => sum + s.price, 0);
      const prevVgv = previousYearSales.filter(s => s.segment === seg).reduce((sum, s) => sum + s.price, 0);
      const curCount = currentYearSales.filter(s => s.segment === seg).length;
      const prevCount = previousYearSales.filter(s => s.segment === seg).length;
      const valorization = prevVgv > 0 ? ((curVgv - prevVgv) / prevVgv) * 100 : curVgv > 0 ? 100 : 0;
      const curAvgTicket = curCount > 0 ? curVgv / curCount : 0;
      const prevAvgTicket = prevCount > 0 ? prevVgv / prevCount : 0;
      const ticketChange = prevAvgTicket > 0 ? ((curAvgTicket - prevAvgTicket) / prevAvgTicket) * 100 : 0;
      return { segment: seg, curVgv, prevVgv, curCount, prevCount, valorization, curAvgTicket, prevAvgTicket, ticketChange };
    });
    const monthlyComparison = ALL_MONTHS.map((m, i) => {
      const curMonthVgv = currentYearSales.filter(s => new Date(s.date).getMonth() === i).reduce((sum, s) => sum + s.price, 0);
      const prevMonthVgv = previousYearSales.filter(s => new Date(s.date).getMonth() === i).reduce((sum, s) => sum + s.price, 0);
      return { month: m, [`VGV ${currentYear}`]: curMonthVgv, [`VGV ${previousYear}`]: prevMonthVgv };
    });
    const curTotal = currentYearSales.reduce((sum, s) => sum + s.price, 0);
    const prevTotal = previousYearSales.reduce((sum, s) => sum + s.price, 0);
    const totalValorization = prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : 0;
    return { segmentComparison, monthlyComparison, curTotal, prevTotal, totalValorization, curCount: currentYearSales.length, prevCount: previousYearSales.length };
  }, []);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatório de Vendas</h1>
            <p className="text-xs text-muted-foreground mt-0.5">VGV, ranking e análise completa por segmentação</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg w-fit">
          <button onClick={() => setActiveTab("relatorio")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "relatorio" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <BarChart3 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Relatório
          </button>
          <button onClick={() => setActiveTab("comparativo")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "comparativo" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <TrendingUp className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Comparativo Anual
          </button>
        </div>

        {activeTab === "relatorio" ? (
          <>
            {/* ─── FILTERS ─── */}
            <div className="elevated-card rounded-xl p-3">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Primary filters as selects */}
                <SelectFilter label="Cidade" icon={MapPin} value={filterCity} onChange={setFilterCity} options={[{ value: "Todas", label: "Todas cidades" }, ...ALL_CITIES.map(c => ({ value: c, label: c }))]} />
                <SelectFilter label="Tipo" icon={Building2} value={filterType} onChange={setFilterType} options={[{ value: "Todos", label: "Todos tipos" }, ...ALL_TYPES.map(t => ({ value: t, label: t }))]} />
                <SelectFilter label="Segmento" icon={Star} value={filterSegment} onChange={setFilterSegment} options={[{ value: "Todos", label: "Todos" }, ...ALL_SEGMENTS.map(s => ({ value: s, label: s }))]} />

                <div className="w-px h-6 bg-border" />

                {/* Period chips inline */}
                {(["Dia", "Semana", "Mês", "Ano"] as TimePeriod[]).map(p => (
                  <FilterChip key={p} label={p} active={filterPeriod === p} onClick={() => setFilterPeriod(filterPeriod === p ? "Todos" : p)} />
                ))}

                <div className="ml-auto flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button onClick={clearAll} className="text-[10px] text-destructive hover:underline flex items-center gap-0.5">
                      <X className="w-3 h-3" /> Limpar ({activeFilterCount})
                    </button>
                  )}
                  <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${showAdvanced ? "border-primary/30 text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <SlidersHorizontal className="w-3 h-3" />
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {showAdvanced && (
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2 flex-wrap">
                  <SelectFilter label="Vista Mar" icon={Home} value={filterSeaView} onChange={setFilterSeaView} options={[{ value: "Todos", label: "Todos" }, { value: "Sim", label: "Com vista" }, { value: "Não", label: "Sem vista" }]} />
                </div>
              )}
            </div>

            {/* ─── VGV METRICS ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <MetricCard title="VGV Ano (2026)" value={formatCurrency(vgvYear)} change={`${totalSales} vendas`} changeType="positive" icon={CalendarRange} />
              <MetricCard title="VGV Mês (Mar)" value={formatCurrency(vgvMonth)} change={`${filtered.filter(s => isThisMonth(s.date)).length} vendas`} changeType="positive" icon={CalendarDays} />
              <MetricCard title="VGV Semana" value={formatCurrency(vgvWeek)} change={`${filtered.filter(s => isThisWeek(s.date)).length} vendas`} changeType="positive" icon={Calendar} />
              <MetricCard title="Ticket Médio" value={formatCurrency(avgTicket)} change="+5.2%" changeType="positive" icon={TrendingUp} />
              <MetricCard title="Total de Vendas" value={String(totalSales)} change="no período" changeType="neutral" icon={Target} />
            </div>

            {/* ─── MONTH/YEAR PICKER ─── */}
            <div className="elevated-card rounded-xl px-4 py-3">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" /> Mês
                </span>
                <div className="flex gap-1 flex-wrap">
                  <FilterChip size="xs" label="Todos" active={filterMonth === null} onClick={() => setFilterMonth(null)} />
                  {ALL_MONTHS.map((m, i) => (
                    <FilterChip size="xs" key={m} label={m} active={filterMonth === i} onClick={() => setFilterMonth(filterMonth === i ? null : i)} />
                  ))}
                </div>
                <div className="w-px h-5 bg-border" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarRange className="w-3 h-3" /> Ano
                </span>
                <div className="flex gap-1">
                  <FilterChip size="xs" label="Todos" active={filterYear === null} onClick={() => setFilterYear(null)} />
                  {ALL_YEARS.map(y => (
                    <FilterChip size="xs" key={y} label={String(y)} active={filterYear === y} onClick={() => setFilterYear(filterYear === y ? null : y)} />
                  ))}
                </div>
              </div>
            </div>

            {/* ─── CHARTS ROW ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue Bar Chart */}
              <div className="elevated-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent" /> Receita Mensal
                </h3>
                <p className="text-[10px] text-muted-foreground mb-3">Clique em uma barra para detalhes</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueBarData} barCategoryGap="20%" onClick={(data) => { if (data?.activeLabel) setSelectedMonth(data.activeLabel); }} style={{ cursor: "pointer" }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} formatter={(value: number) => [formatCurrency(value), "Receita"]} />
                    <ReferenceLine y={avgRevenue} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                    <Bar dataKey="receita" radius={[4, 4, 0, 0]} animationDuration={800}>
                      {revenueBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.trend === "alta" ? "hsl(142, 71%, 45%)" : entry.trend === "baixa" ? "hsl(0, 72%, 51%)" : "hsl(var(--muted-foreground))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-around mt-2">
                  {revenueBarData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground">{d.vendas} un.</span>
                      <span className={`text-[10px] font-bold ${d.trend === "alta" ? "text-emerald-500" : d.trend === "baixa" ? "text-destructive" : "text-muted-foreground"}`}>
                        {i === 0 ? "—" : `${d.change > 0 ? "+" : ""}${d.change.toFixed(0)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie Charts */}
              <div className="elevated-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-accent" /> Distribuição
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground text-center mb-1 font-medium">Segmento (VGV)</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart><Pie data={segmentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>{segmentPie.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "10px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                      {segmentPie.map(s => <div key={s.name} className="flex items-center gap-1 text-[9px] text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full" style={{ background: s.fill }} />{s.name}</div>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground text-center mb-1 font-medium">Tipo (Qtd)</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart><Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>{typePie.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "10px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                      {typePie.map(s => <div key={s.name} className="flex items-center gap-1 text-[9px] text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full" style={{ background: s.fill }} />{s.name}</div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RANKINGS ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RankingBarCard title="Tipo de Imóvel" data={rankings.byType} colors={TYPE_COLORS} />
              <RankingBarCard title="Cidade" data={rankings.byCity} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <RankingListCard title="Top Empreendimentos" icon={Building2} data={rankings.byEmpreendimento.slice(0, 6)} />
              <RankingProgressCard title="Top Corretores" data={rankings.byBroker} />
              <RankingListCard title="VGV por Segmento" icon={Star} data={rankings.bySegment} colors={SEGMENT_COLORS} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RankingProgressCard title="Proprietários" data={rankings.byOwner} />
              <RankingBarCard title="Bairros" data={rankings.byNeighborhood} />
            </div>

            {/* ─── RECENT SALES ─── */}
            <div className="elevated-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" /> Últimas Vendas
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Data", "Imóvel", "Cidade", "Tipo", "Segmento", "Corretor", "Valor"].map(h => (
                        <th key={h} className={`py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider ${h === "Valor" ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 10).map(sale => (
                      <tr key={sale.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="py-2 text-xs text-muted-foreground">{new Date(sale.date).toLocaleDateString("pt-BR")}</td>
                        <td className="py-2 text-xs font-medium text-card-foreground">{sale.propertyTitle}</td>
                        <td className="py-2 text-xs text-muted-foreground">{sale.city}</td>
                        <td className="py-2"><Badge variant="outline" className="text-[9px] px-1.5 py-0">{sale.type}</Badge></td>
                        <td className="py-2"><Badge variant="secondary" className="text-[9px] px-1.5 py-0">{sale.segment}</Badge></td>
                        <td className="py-2 text-xs text-muted-foreground">{sale.broker}</td>
                        <td className="py-2 text-right text-xs font-bold text-accent">{formatCurrency(sale.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* ─── COMPARATIVO ANUAL TAB ─── */
          <ComparativoAnual data={comparativoData} currentYear={currentYear} previousYear={previousYear} />
        )}

        {/* Month Sales Dialog */}
        <Dialog open={!!selectedMonth} onOpenChange={() => setSelectedMonth(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader><DialogTitle>Vendas de {selectedMonth}</DialogTitle></DialogHeader>
            {(() => {
              const monthNum = selectedMonth ? MONTH_MAP[selectedMonth] : -1;
              const monthSales = filtered.filter(s => new Date(s.date).getMonth() === monthNum);
              const totalVgv = monthSales.reduce((sum, s) => sum + s.price, 0);
              return (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-lg bg-primary/10"><p className="text-xs text-muted-foreground">Total de Vendas</p><p className="text-lg font-bold text-foreground">{monthSales.length}</p></div>
                    <div className="p-3 rounded-lg bg-accent/10"><p className="text-xs text-muted-foreground">VGV do Mês</p><p className="text-lg font-bold text-accent">{formatCurrency(totalVgv)}</p></div>
                  </div>
                  {monthSales.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma venda neste mês</p> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Imóvel</TableHead><TableHead>Cidade</TableHead><TableHead>Tipo</TableHead><TableHead>Segmento</TableHead><TableHead>Corretor</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {monthSales.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium text-foreground">{s.propertyTitle}</TableCell>
                            <TableCell className="text-muted-foreground">{s.city}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{s.type}</Badge></TableCell>
                            <TableCell><Badge className="text-xs" style={{ background: SEGMENT_COLORS[s.segment] + "33", color: SEGMENT_COLORS[s.segment], border: "none" }}>{s.segment}</Badge></TableCell>
                            <TableCell className="text-muted-foreground">{s.broker}</TableCell>
                            <TableCell className="text-right font-bold text-foreground">{formatCurrency(s.price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// ─── COMPARATIVO ANUAL COMPONENT ───
function ComparativoAnual({ data, currentYear, previousYear }: {
  data: { segmentComparison: any[]; monthlyComparison: any[]; curTotal: number; prevTotal: number; totalValorization: number; curCount: number; prevCount: number };
  currentYear: number; previousYear: number;
}) {
  return (
    <div className="space-y-5">
      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="elevated-card rounded-xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">VGV {currentYear}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(data.curTotal)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{data.curCount} vendas</p>
        </div>
        <div className="elevated-card rounded-xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">VGV {previousYear}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(data.prevTotal)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{data.prevCount} vendas</p>
        </div>
        <div className="elevated-card rounded-xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Valorização Geral</p>
          <p className={`text-2xl font-bold mt-1 flex items-center gap-2 ${data.totalValorization >= 0 ? "text-emerald-500" : "text-destructive"}`}>
            {data.totalValorization >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
            {data.totalValorization > 0 ? "+" : ""}{data.totalValorization.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">vs ano anterior</p>
        </div>
      </div>

      {/* Monthly comparison chart */}
      <div className="elevated-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" /> VGV Mensal — {currentYear} vs {previousYear}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthlyComparison} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v > 0 ? `${(v / 1000000).toFixed(1)}M` : "0"} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [formatCurrency(v)]} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey={`VGV ${currentYear}`} fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey={`VGV ${previousYear}`} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Segment Valorization Table */}
      <div className="elevated-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" /> Valorização por Segmento
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Segmento", `VGV ${currentYear}`, `VGV ${previousYear}`, "Valorização", `Vendas ${currentYear}`, `Vendas ${previousYear}`, `Ticket Médio ${currentYear}`, "Var. Ticket"].map(h => (
                  <th key={h} className="py-2.5 px-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-left first:pl-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.segmentComparison.map(seg => (
                <tr key={seg.segment} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-3 first:pl-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: SEGMENT_COLORS[seg.segment] }} />
                      <span className="text-xs font-medium text-foreground">{seg.segment}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs font-semibold text-foreground">{formatCurrency(seg.curVgv)}</td>
                  <td className="py-3 px-3 text-xs text-muted-foreground">{formatCurrency(seg.prevVgv)}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      seg.valorization > 0 ? "text-emerald-600 bg-emerald-500/10" :
                      seg.valorization < 0 ? "text-destructive bg-destructive/10" :
                      "text-muted-foreground bg-muted"
                    }`}>
                      {seg.valorization > 0 ? <ArrowUp className="w-3 h-3" /> : seg.valorization < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {seg.valorization > 0 ? "+" : ""}{seg.valorization.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-foreground font-medium">{seg.curCount}</td>
                  <td className="py-3 px-3 text-xs text-muted-foreground">{seg.prevCount}</td>
                  <td className="py-3 px-3 text-xs text-foreground font-medium">{formatCurrency(seg.curAvgTicket)}</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold ${seg.ticketChange > 0 ? "text-emerald-500" : seg.ticketChange < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {seg.ticketChange > 0 ? "+" : ""}{seg.ticketChange.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segment bars visual */}
      <div className="elevated-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-accent" /> Comparativo Visual por Segmento
        </h3>
        <div className="space-y-4">
          {data.segmentComparison.map(seg => {
            const maxVgv = Math.max(...data.segmentComparison.flatMap(s => [s.curVgv, s.prevVgv]), 1);
            return (
              <div key={seg.segment} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{seg.segment}</span>
                  <span className={`text-[10px] font-bold ${seg.valorization >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                    {seg.valorization > 0 ? "+" : ""}{seg.valorization.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground w-8">{currentYear}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(seg.curVgv / maxVgv) * 100}%`, background: SEGMENT_COLORS[seg.segment] }} />
                    </div>
                    <span className="text-[9px] text-foreground font-medium w-20 text-right">{formatCurrency(seg.curVgv)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground w-8">{previousYear}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 opacity-40" style={{ width: `${(seg.prevVgv / maxVgv) * 100}%`, background: SEGMENT_COLORS[seg.segment] }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground w-20 text-right">{formatCurrency(seg.prevVgv)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── REUSABLE RANKING COMPONENTS ───
function RankingBarCard({ title, data, colors }: { title: string; data: { name: string; count: number; vgv: number }[]; colors?: Record<string, string> }) {
  return (
    <div className="elevated-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> Ranking — {title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={90} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [formatCurrency(v), "VGV"]} />
          <Bar dataKey="vgv" radius={[0, 4, 4, 0]} animationDuration={800}>
            {data.map((e, i) => <Cell key={i} fill={colors?.[e.name] || (i === 0 ? "hsl(142, 71%, 45%)" : i === 1 ? "hsl(142, 50%, 60%)" : "hsl(38, 92%, 50%)")} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 space-y-1">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold ${idx === 0 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>{idx + 1}</span>
              <span className="text-card-foreground font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{item.count}×</span>
              <span className="font-bold text-accent text-[11px]">{formatCurrency(item.vgv)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingListCard({ title, icon: Icon, data, colors }: { title: string; icon: React.ElementType; data: { name: string; count: number; vgv: number }[]; colors?: Record<string, string> }) {
  return (
    <div className="elevated-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2"><Icon className="w-4 h-4 text-accent" /> {title}</h3>
      <div className="space-y-1.5">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold ${idx === 0 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>{idx + 1}</span>
              <span className="text-xs font-medium text-card-foreground">{item.name}</span>
              {colors && <div className="w-1.5 h-1.5 rounded-full ml-1" style={{ background: colors[item.name] }} />}
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{item.count}×</span>
              <span className="text-xs font-bold text-accent">{formatCurrency(item.vgv)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingProgressCard({ title, data }: { title: string; data: { name: string; count: number; vgv: number }[] }) {
  const maxVgv = data[0]?.vgv || 1;
  return (
    <div className="elevated-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> {title}</h3>
      <div className="space-y-2.5">
        {data.map((item, idx) => (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold ${idx === 0 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>{idx + 1}</span>
                <span className="font-medium text-card-foreground">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{item.count}×</span>
                <span className="font-bold text-accent text-[11px]">{formatCurrency(item.vgv)}</span>
              </div>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${(item.vgv / maxVgv) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
