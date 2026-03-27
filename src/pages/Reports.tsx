import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard } from "@/components/MetricCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  salesRecords,
  salesData,
  brokers,
  formatCurrency,
  SaleRecord,
} from "@/data/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Download,
  Filter,
  Trophy,
  Building2,
  Home,
  MapPin,
  Star,
  BarChart3,
  CalendarDays,
  CalendarRange,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronDown,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SEGMENT_COLORS: Record<string, string> = {
  "Luxo": "hsl(142, 71%, 45%)",
  "Alto Padrão": "hsl(142, 50%, 55%)",
  "Médio Padrão": "hsl(38, 92%, 50%)",
  "Econômico": "hsl(0, 72%, 51%)",
};

const TYPE_COLORS: Record<string, string> = {
  "Apartamento": "hsl(142, 71%, 45%)",
  "Casa": "hsl(142, 50%, 60%)",
  "Comercial": "hsl(38, 92%, 50%)",
  "Terreno": "hsl(0, 60%, 55%)",
};

const ALL_CITIES = [...new Set(salesRecords.map(s => s.city))].sort();
const ALL_TYPES: SaleRecord["type"][] = ["Apartamento", "Casa", "Comercial", "Terreno"];
const ALL_SEGMENTS: SaleRecord["segment"][] = ["Luxo", "Alto Padrão", "Médio Padrão", "Econômico"];

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date("2026-03-27");
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart && d <= now;
}

function isThisMonth(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date("2026-03-27");
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isThisYear(dateStr: string) {
  const d = new Date(dateStr);
  return d.getFullYear() === 2026;
}

function FilterChip({ label, active, onClick, onRemove }: { label: string; active: boolean; onClick: () => void; onRemove?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1 ${
        active
          ? "bg-accent text-accent-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
      {active && onRemove && (
        <X className="w-3 h-3 ml-0.5" onClick={(e) => { e.stopPropagation(); onRemove(); }} />
      )}
    </button>
  );
}

const MONTH_MAP: Record<string, number> = {
  "Jan": 0, "Fev": 1, "Mar": 2, "Abr": 3, "Mai": 4, "Jun": 5,
  "Jul": 6, "Ago": 7, "Set": 8, "Out": 9, "Nov": 10, "Dez": 11,
};

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date("2026-03-27");
  return d.toDateString() === now.toDateString();
}

type TimePeriod = "Todos" | "Dia" | "Semana" | "Mês" | "Ano" | "Customizado";

const ALL_MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ALL_YEARS = [...new Set(salesRecords.map(s => new Date(s.date).getFullYear()))].sort((a, b) => b - a);

export default function Reports() {
  const [filterCity, setFilterCity] = useState<string>("Todas");
  const [filterType, setFilterType] = useState<string>("Todos");
  const [filterSegment, setFilterSegment] = useState<string>("Todos");
  const [filterSeaView, setFilterSeaView] = useState<string>("Todos");
  const [filterPeriod, setFilterPeriod] = useState<TimePeriod>("Todos");
  const [filterMonth, setFilterMonth] = useState<number | null>(null); // 0-11
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showDetailedFilters, setShowDetailedFilters] = useState(false);

  const activeFilterCount = [filterCity !== "Todas", filterType !== "Todos", filterSegment !== "Todos", filterSeaView !== "Todos", filterPeriod !== "Todos" && filterPeriod !== "Customizado", filterMonth !== null, filterYear !== null].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterCity("Todas");
    setFilterType("Todos");
    setFilterSegment("Todos");
    setFilterSeaView("Todos");
    setFilterPeriod("Todos");
    setFilterMonth(null);
    setFilterYear(null);
  };

  const filtered = useMemo(() => {
    return salesRecords.filter(s => {
      if (filterCity !== "Todas" && s.city !== filterCity) return false;
      if (filterType !== "Todos" && s.type !== filterType) return false;
      if (filterSegment !== "Todos" && s.segment !== filterSegment) return false;
      if (filterSeaView === "Sim" && !s.seaView) return false;
      if (filterSeaView === "Não" && s.seaView) return false;
      if (filterPeriod === "Dia" && !isToday(s.date)) return false;
      if (filterPeriod === "Semana" && !isThisWeek(s.date)) return false;
      if (filterPeriod === "Mês" && !isThisMonth(s.date)) return false;
      if (filterPeriod === "Ano" && !isThisYear(s.date)) return false;
      // Custom month/year filters
      const d = new Date(s.date);
      if (filterMonth !== null && d.getMonth() !== filterMonth) return false;
      if (filterYear !== null && d.getFullYear() !== filterYear) return false;
      return true;
    });
  }, [filterCity, filterType, filterSegment, filterSeaView, filterPeriod, filterMonth, filterYear]);

  // VGV calculations
  const vgvYear = filtered.filter(s => isThisYear(s.date)).reduce((sum, s) => sum + s.price, 0);
  const vgvMonth = filtered.filter(s => isThisMonth(s.date)).reduce((sum, s) => sum + s.price, 0);
  const vgvWeek = filtered.filter(s => isThisWeek(s.date)).reduce((sum, s) => sum + s.price, 0);
  const totalSales = filtered.filter(s => isThisYear(s.date)).length;
  const avgTicket = totalSales > 0 ? vgvYear / totalSales : 0;

  // Ranking by type
  const rankByType = useMemo(() => {
    const map: Record<string, { count: number; vgv: number }> = {};
    filtered.forEach(s => {
      if (!map[s.type]) map[s.type] = { count: 0, vgv: 0 };
      map[s.type].count++;
      map[s.type].vgv += s.price;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.vgv - a.vgv);
  }, [filtered]);

  // Ranking by segment
  const rankBySegment = useMemo(() => {
    const map: Record<string, { count: number; vgv: number }> = {};
    filtered.forEach(s => {
      if (!map[s.segment]) map[s.segment] = { count: 0, vgv: 0 };
      map[s.segment].count++;
      map[s.segment].vgv += s.price;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.vgv - a.vgv);
  }, [filtered]);

  // Ranking by city
  const rankByCity = useMemo(() => {
    const map: Record<string, { count: number; vgv: number }> = {};
    filtered.forEach(s => {
      if (!map[s.city]) map[s.city] = { count: 0, vgv: 0 };
      map[s.city].count++;
      map[s.city].vgv += s.price;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.vgv - a.vgv);
  }, [filtered]);

  // Ranking by empreendimento
  const rankByEmpreendimento = useMemo(() => {
    const map: Record<string, { count: number; vgv: number; type: string; city: string }> = {};
    filtered.forEach(s => {
      const key = s.empreendimento || "Avulso";
      if (!map[key]) map[key] = { count: 0, vgv: 0, type: s.type, city: s.city };
      map[key].count++;
      map[key].vgv += s.price;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.vgv - a.vgv);
  }, [filtered]);

  // Ranking by broker
  const rankByBroker = useMemo(() => {
    const map: Record<string, { count: number; vgv: number }> = {};
    filtered.forEach(s => {
      if (!map[s.broker]) map[s.broker] = { count: 0, vgv: 0 };
      map[s.broker].count++;
      map[s.broker].vgv += s.price;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.vgv - a.vgv);
  }, [filtered]);

  // Ranking by owner
  const rankByOwner = useMemo(() => {
    const map: Record<string, { count: number; vgv: number }> = {};
    filtered.forEach(s => {
      if (!map[s.owner]) map[s.owner] = { count: 0, vgv: 0 };
      map[s.owner].count++;
      map[s.owner].vgv += s.price;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.vgv - a.vgv);
  }, [filtered]);

  // Ranking by neighborhood
  const rankByNeighborhood = useMemo(() => {
    const map: Record<string, { count: number; vgv: number }> = {};
    filtered.forEach(s => {
      if (!map[s.neighborhood]) map[s.neighborhood] = { count: 0, vgv: 0 };
      map[s.neighborhood].count++;
      map[s.neighborhood].vgv += s.price;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.vgv - a.vgv);
  }, [filtered]);

  // Bar chart data with month-over-month change indicators
  const revenueBarData = salesData.map((d, i) => {
    const prev = i > 0 ? salesData[i - 1].receita : d.receita;
    const change = ((d.receita - prev) / prev) * 100;
    return {
      ...d,
      change: i === 0 ? 0 : change,
      trend: i === 0 ? "neutral" : change > 0 ? "alta" : change < 0 ? "baixa" : "neutral",
    };
  });

  const avgRevenue = salesData.reduce((sum, d) => sum + d.receita, 0) / salesData.length;

  // Pie chart data for segments
  const segmentPie = rankBySegment.map(s => ({
    name: s.name,
    value: s.vgv,
    fill: SEGMENT_COLORS[s.name] || "hsl(var(--chart-4))",
  }));

  const typePie = rankByType.map(s => ({
    name: s.name,
    value: s.count,
    fill: TYPE_COLORS[s.name] || "hsl(var(--chart-4))",
  }));

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatório de Vendas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              VGV, ranking e análise completa por segmentação
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>

        {/* Filters - Quick Row + Expandable Details */}
        <div className="elevated-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground">
                <Filter className="w-3.5 h-3.5" />
                Filtros Rápidos
              </div>
              {/* Quick city chips */}
              {ALL_CITIES.map(c => (
                <FilterChip
                  key={c}
                  label={c}
                  active={filterCity === c}
                  onClick={() => setFilterCity(filterCity === c ? "Todas" : c)}
                  onRemove={filterCity === c ? () => setFilterCity("Todas") : undefined}
                />
              ))}
              {/* Quick type chips */}
              {ALL_TYPES.map(t => (
                <FilterChip
                  key={t}
                  label={t}
                  active={filterType === t}
                  onClick={() => setFilterType(filterType === t ? "Todos" : t)}
                  onRemove={filterType === t ? () => setFilterType("Todos") : undefined}
                />
              ))}
              {/* Separator */}
              <div className="w-px h-5 bg-border mx-1" />
              {/* Quick time period chips */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground">
                <Calendar className="w-3.5 h-3.5" />
                Período
              </div>
              {(["Dia", "Semana", "Mês", "Ano"] as TimePeriod[]).map(p => (
                <FilterChip
                  key={p}
                  label={p}
                  active={filterPeriod === p}
                  onClick={() => setFilterPeriod(filterPeriod === p ? "Todos" : p)}
                  onRemove={filterPeriod === p ? () => setFilterPeriod("Todos") : undefined}
                />
              ))}
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="px-2 py-1 rounded-full text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1">
                  <X className="w-3 h-3" /> Limpar ({activeFilterCount})
                </button>
              )}
            </div>
            <button
              onClick={() => setShowDetailedFilters(!showDetailedFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Detalhado
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDetailedFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showDetailedFilters && (
            <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mb-1.5 uppercase tracking-wider">
                  <MapPin className="w-3 h-3" /> Cidade
                </span>
                <div className="flex flex-wrap gap-1">
                  <FilterChip label="Todas" active={filterCity === "Todas"} onClick={() => setFilterCity("Todas")} />
                  {ALL_CITIES.map(c => (
                    <FilterChip key={c} label={c} active={filterCity === c} onClick={() => setFilterCity(c)} />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mb-1.5 uppercase tracking-wider">
                  <Building2 className="w-3 h-3" /> Tipo
                </span>
                <div className="flex flex-wrap gap-1">
                  <FilterChip label="Todos" active={filterType === "Todos"} onClick={() => setFilterType("Todos")} />
                  {ALL_TYPES.map(t => (
                    <FilterChip key={t} label={t} active={filterType === t} onClick={() => setFilterType(t)} />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mb-1.5 uppercase tracking-wider">
                  <Star className="w-3 h-3" /> Segmento
                </span>
                <div className="flex flex-wrap gap-1">
                  <FilterChip label="Todos" active={filterSegment === "Todos"} onClick={() => setFilterSegment("Todos")} />
                  {ALL_SEGMENTS.map(s => (
                    <FilterChip key={s} label={s} active={filterSegment === s} onClick={() => setFilterSegment(s)} />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mb-1.5 uppercase tracking-wider">
                  <Home className="w-3 h-3" /> Vista Mar
                </span>
                <div className="flex flex-wrap gap-1">
                  <FilterChip label="Todos" active={filterSeaView === "Todos"} onClick={() => setFilterSeaView("Todos")} />
                  <FilterChip label="Sim" active={filterSeaView === "Sim"} onClick={() => setFilterSeaView("Sim")} />
                  <FilterChip label="Não" active={filterSeaView === "Não"} onClick={() => setFilterSeaView("Não")} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* VGV Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="VGV Ano (2026)"
            value={formatCurrency(vgvYear)}
            change={`${totalSales} vendas`}
            changeType="positive"
            icon={CalendarRange}
          />
          <MetricCard
            title="VGV Mês (Mar)"
            value={formatCurrency(vgvMonth)}
            change={`${filtered.filter(s => isThisMonth(s.date)).length} vendas`}
            changeType="positive"
            icon={CalendarDays}
          />
          <MetricCard
            title="VGV Semana"
            value={formatCurrency(vgvWeek)}
            change={`${filtered.filter(s => isThisWeek(s.date)).length} vendas`}
            changeType="positive"
            icon={Calendar}
          />
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(avgTicket)}
            change="+5.2%"
            changeType="positive"
            icon={TrendingUp}
          />
          <MetricCard
            title="Total de Vendas"
            value={String(totalSales)}
            change="no período"
            changeType="neutral"
            icon={Target}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Bar Chart with trend indicators */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              Receita Mensal — Comparativo
            </h3>
            <p className="text-[10px] text-muted-foreground mb-3">Clique em uma barra para ver as vendas do mês</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueBarData} barCategoryGap="20%" onClick={(data) => { if (data?.activeLabel) setSelectedMonth(data.activeLabel); }} style={{ cursor: "pointer" }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number, name: string) => {
                    if (name === "receita") return [formatCurrency(value), "Receita"];
                    if (name === "vendas") return [value, "Unidades Vendidas"];
                    return [value, name];
                  }}
                />
                <ReferenceLine y={avgRevenue} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Média", position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Bar dataKey="receita" radius={[6, 6, 0, 0]} animationDuration={1200} animationBegin={200}>
                  {revenueBarData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.trend === "alta" ? "hsl(142, 71%, 45%)" : entry.trend === "baixa" ? "hsl(0, 72%, 51%)" : "hsl(var(--muted-foreground))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Month indicators */}
            <div className="flex justify-around mt-3 px-2">
              {revenueBarData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-semibold text-accent">{d.vendas} un.</span>
                  {d.trend === "alta" ? (
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                  ) : d.trend === "baixa" ? (
                    <ArrowDown className="w-3.5 h-3.5 text-destructive" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className={`text-[10px] font-bold ${
                    d.trend === "alta" ? "text-emerald-500" : d.trend === "baixa" ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {i === 0 ? "—" : `${d.change > 0 ? "+" : ""}${d.change.toFixed(0)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Segment & Type Pies */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              VGV por Segmento / Vendas por Tipo
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground text-center mb-1">Segmento (VGV)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={segmentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {segmentPie.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {segmentPie.map(s => (
                    <div key={s.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.fill }} />
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground text-center mb-1">Tipo (Qtd)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {typePie.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {typePie.map(s => (
                    <div key={s.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.fill }} />
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Type & City Bar Chart Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ranking Tipo de Imóvel - Bar Chart */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              Ranking — Tipo de Imóvel Mais Vendido
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rankByType} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={90} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => [formatCurrency(value), "VGV"]} />
                <Bar dataKey="vgv" radius={[0, 6, 6, 0]} animationDuration={1200}>
                  {rankByType.map((entry, i) => (
                    <Cell key={i} fill={TYPE_COLORS[entry.name] || "hsl(var(--accent))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {rankByType.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                    }`}>{idx + 1}</span>
                    <span className="font-medium text-card-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.count} vendas</Badge>
                    <span className="font-bold text-accent">{formatCurrency(item.vgv)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking Cidade - Bar Chart */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              Ranking — Cidade Mais Vendida
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rankByCity} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={100} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => [formatCurrency(value), "VGV"]} />
                <Bar dataKey="vgv" radius={[0, 6, 6, 0]} animationDuration={1200}>
                   {rankByCity.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "hsl(142, 71%, 45%)" : i === 1 ? "hsl(142, 50%, 60%)" : "hsl(38, 92%, 50%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {rankByCity.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                    }`}>{idx + 1}</span>
                    <span className="font-medium text-card-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.count} vendas</Badge>
                    <span className="font-bold text-accent">{formatCurrency(item.vgv)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Rankings Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Empreendimentos */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              Top Empreendimentos
            </h3>
            <div className="space-y-2">
              {rankByEmpreendimento.slice(0, 6).map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                    }`}>{idx + 1}</span>
                    <div>
                      <p className="text-xs font-medium text-card-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-accent">{formatCurrency(item.vgv)}</p>
                    <p className="text-[10px] text-muted-foreground">{item.count} vendas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Corretores */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              Top Corretores
            </h3>
            <div className="space-y-2.5">
              {rankByBroker.map((item, idx) => {
                const maxVgv = rankByBroker[0]?.vgv || 1;
                const pct = (item.vgv / maxVgv) * 100;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 0 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                        }`}>{idx + 1}</span>
                        <span className="font-medium text-card-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{item.count} vendas</span>
                        <span className="font-bold text-accent">{formatCurrency(item.vgv)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full gradient-gold rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Segmento */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              VGV por Segmento
            </h3>
            <div className="space-y-2">
              {rankBySegment.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                    }`}>{idx + 1}</span>
                    <span className="text-sm font-medium text-card-foreground">{item.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.count}</Badge>
                  </div>
                  <p className="text-sm font-bold text-accent">{formatCurrency(item.vgv)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Owner & Neighborhood Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ranking Proprietários */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              Ranking — Proprietários
            </h3>
            <div className="space-y-2">
              {rankByOwner.map((item, idx) => {
                const maxVgv = rankByOwner[0]?.vgv || 1;
                const pct = (item.vgv / maxVgv) * 100;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 0 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                        }`}>{idx + 1}</span>
                        <span className="font-medium text-card-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.count} vendas</Badge>
                        <span className="font-bold text-accent">{formatCurrency(item.vgv)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ranking Bairros */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              Ranking — Bairros
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rankByNeighborhood} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={110} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => [formatCurrency(value), "VGV"]} />
                <Bar dataKey="vgv" radius={[0, 6, 6, 0]} animationDuration={1200}>
                   {rankByNeighborhood.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "hsl(142, 71%, 45%)" : i === 1 ? "hsl(142, 50%, 60%)" : i === 2 ? "hsl(38, 92%, 50%)" : "hsl(0, 60%, 55%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {rankByNeighborhood.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                    }`}>{idx + 1}</span>
                    <span className="font-medium text-card-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.count} vendas</Badge>
                    <span className="font-bold text-accent">{formatCurrency(item.vgv)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sales Table */}
        <div className="elevated-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-accent" />
            Últimas Vendas Registradas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Data</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Imóvel</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Cidade</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Tipo</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Segmento</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Corretor</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 10).map(sale => (
                  <tr key={sale.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 text-muted-foreground">{new Date(sale.date).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2.5 font-medium text-card-foreground">{sale.propertyTitle}</td>
                    <td className="py-2.5 text-muted-foreground">{sale.city}</td>
                    <td className="py-2.5"><Badge variant="outline" className="text-[10px]">{sale.type}</Badge></td>
                    <td className="py-2.5"><Badge variant="secondary" className="text-[10px]">{sale.segment}</Badge></td>
                    <td className="py-2.5 text-muted-foreground">{sale.broker}</td>
                    <td className="py-2.5 text-right font-bold text-accent">{formatCurrency(sale.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Month Sales Dialog */}
        <Dialog open={!!selectedMonth} onOpenChange={() => setSelectedMonth(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Vendas de {selectedMonth}</DialogTitle>
            </DialogHeader>
            {(() => {
              const monthNum = selectedMonth ? MONTH_MAP[selectedMonth] : -1;
              const monthSales = filtered.filter(s => {
                const d = new Date(s.date);
                return d.getMonth() === monthNum;
              });
              const totalVgv = monthSales.reduce((sum, s) => sum + s.price, 0);
              return (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <p className="text-xs text-muted-foreground">Total de Vendas</p>
                      <p className="text-lg font-bold text-foreground">{monthSales.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <p className="text-xs text-muted-foreground">VGV do Mês</p>
                      <p className="text-lg font-bold text-emerald-500">{formatCurrency(totalVgv)}</p>
                    </div>
                  </div>
                  {monthSales.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma venda registrada neste mês</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imóvel</TableHead>
                          <TableHead>Cidade</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Segmento</TableHead>
                          <TableHead>Corretor</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
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
