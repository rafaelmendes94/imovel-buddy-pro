import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SEGMENT_COLORS: Record<string, string> = {
  "Luxo": "hsl(var(--chart-1))",
  "Alto Padrão": "hsl(var(--chart-2))",
  "Médio Padrão": "hsl(var(--chart-3))",
  "Econômico": "hsl(var(--chart-5))",
};

const TYPE_COLORS: Record<string, string> = {
  "Apartamento": "hsl(var(--chart-1))",
  "Casa": "hsl(var(--chart-2))",
  "Comercial": "hsl(var(--chart-3))",
  "Terreno": "hsl(var(--chart-5))",
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

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        active
          ? "bg-accent text-accent-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </button>
  );
}

export default function Reports() {
  const [filterCity, setFilterCity] = useState<string>("Todas");
  const [filterType, setFilterType] = useState<string>("Todos");
  const [filterSegment, setFilterSegment] = useState<string>("Todos");
  const [filterSeaView, setFilterSeaView] = useState<string>("Todos");

  const filtered = useMemo(() => {
    return salesRecords.filter(s => {
      if (filterCity !== "Todas" && s.city !== filterCity) return false;
      if (filterType !== "Todos" && s.type !== filterType) return false;
      if (filterSegment !== "Todos" && s.segment !== filterSegment) return false;
      if (filterSeaView === "Sim" && !s.seaView) return false;
      if (filterSeaView === "Não" && s.seaView) return false;
      return true;
    });
  }, [filterCity, filterType, filterSegment, filterSeaView]);

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

        {/* Filters */}
        <div className="elevated-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
            <Filter className="w-4 h-4" />
            Filtros
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-1.5">
                <MapPin className="w-3 h-3" /> Cidade
              </span>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip label="Todas" active={filterCity === "Todas"} onClick={() => setFilterCity("Todas")} />
                {ALL_CITIES.map(c => (
                  <FilterChip key={c} label={c} active={filterCity === c} onClick={() => setFilterCity(c)} />
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-1.5">
                <Building2 className="w-3 h-3" /> Tipo de Imóvel
              </span>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip label="Todos" active={filterType === "Todos"} onClick={() => setFilterType("Todos")} />
                {ALL_TYPES.map(t => (
                  <FilterChip key={t} label={t} active={filterType === t} onClick={() => setFilterType(t)} />
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-1.5">
                <Star className="w-3 h-3" /> Segmento
              </span>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip label="Todos" active={filterSegment === "Todos"} onClick={() => setFilterSegment("Todos")} />
                {ALL_SEGMENTS.map(s => (
                  <FilterChip key={s} label={s} active={filterSegment === s} onClick={() => setFilterSegment(s)} />
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-1.5">
                <Home className="w-3 h-3" /> Vista Mar
              </span>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip label="Todos" active={filterSeaView === "Todos"} onClick={() => setFilterSeaView("Todos")} />
                <FilterChip label="Sim" active={filterSeaView === "Sim"} onClick={() => setFilterSeaView("Sim")} />
                <FilterChip label="Não" active={filterSeaView === "Não"} onClick={() => setFilterSeaView("Não")} />
              </div>
            </div>
          </div>
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
          {/* Revenue evolution */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              Evolução da Receita
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => [formatCurrency(value), "Receita"]} />
                <Area type="monotone" dataKey="receita" stroke="hsl(var(--accent))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceita)" />
              </AreaChart>
            </ResponsiveContainer>
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

        {/* Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ranking Empreendimentos */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Ranking Empreendimentos Mais Vendidos
            </h3>
            <div className="space-y-3">
              {rankByEmpreendimento.slice(0, 8).map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? "bg-yellow-500/20 text-yellow-500" :
                      idx === 1 ? "bg-gray-400/20 text-gray-400" :
                      idx === 2 ? "bg-orange-500/20 text-orange-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.city} · {item.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">{formatCurrency(item.vgv)}</p>
                    <p className="text-[10px] text-muted-foreground">{item.count} {item.count === 1 ? "venda" : "vendas"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking Corretores */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Ranking Corretores
            </h3>
            <div className="space-y-3">
              {rankByBroker.map((item, idx) => {
                const maxVgv = rankByBroker[0]?.vgv || 1;
                const pct = (item.vgv / maxVgv) * 100;
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? "bg-yellow-500/20 text-yellow-500" :
                          idx === 1 ? "bg-gray-400/20 text-gray-400" :
                          idx === 2 ? "bg-orange-500/20 text-orange-500" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-medium text-card-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{item.count} vendas</span>
                        <span className="font-semibold text-accent">{formatCurrency(item.vgv)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full gradient-gold rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Rankings Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* By City */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              VGV por Cidade
            </h3>
            <div className="space-y-2">
              {rankByCity.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">#{idx + 1}</span>
                    <span className="text-sm font-medium text-card-foreground">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">{formatCurrency(item.vgv)}</p>
                    <p className="text-[10px] text-muted-foreground">{item.count} vendas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Type */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" />
              VGV por Tipo
            </h3>
            <div className="space-y-2">
              {rankByType.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">#{idx + 1}</span>
                    <span className="text-sm font-medium text-card-foreground">{item.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.count}</Badge>
                  </div>
                  <p className="text-sm font-bold text-accent">{formatCurrency(item.vgv)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* By Segment */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              VGV por Segmento
            </h3>
            <div className="space-y-2">
              {rankBySegment.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">#{idx + 1}</span>
                    <span className="text-sm font-medium text-card-foreground">{item.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.count}</Badge>
                  </div>
                  <p className="text-sm font-bold text-accent">{formatCurrency(item.vgv)}</p>
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
      </div>
    </AppLayout>
  );
}
