import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import {
  salesData,
  properties,
  brokers,
  formatCurrency,
} from "@/data/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Target,
  Clock,
  Download,
} from "lucide-react";

export default function Reports() {
  const totalRevenue = salesData.reduce((sum, d) => sum + d.receita, 0);
  const avgTicket = totalRevenue / salesData.reduce((sum, d) => sum + d.vendas, 0);
  const sold = properties.filter((p) => p.status === "Vendido").length;
  const conversionRate = ((sold / properties.length) * 100).toFixed(1);

  const brokerPerformance = brokers
    .filter((b) => b.status === "Ativo")
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise detalhada de vendas e desempenho
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Receita Total"
            value={formatCurrency(totalRevenue)}
            change="+12.5%"
            changeType="positive"
            icon={DollarSign}
          />
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(avgTicket)}
            change="+5.2%"
            changeType="positive"
            icon={TrendingUp}
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${conversionRate}%`}
            change="-2.1%"
            changeType="negative"
            icon={Target}
          />
          <MetricCard
            title="Tempo Médio de Venda"
            value="45 dias"
            change="-8 dias"
            changeType="positive"
            icon={Clock}
          />
        </div>

        {/* Revenue area chart */}
        <div className="elevated-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Evolução da Receita
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [formatCurrency(value), "Receita"]}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="hsl(var(--accent))"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorReceita)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Broker performance */}
        <div className="elevated-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Desempenho por Corretor
          </h3>
          <div className="space-y-4">
            {brokerPerformance.map((broker, idx) => {
              const maxRevenue = brokerPerformance[0].revenue;
              const pct = (broker.revenue / maxRevenue) * 100;
              return (
                <div key={broker.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5">
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-card-foreground">
                        {broker.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">
                        {broker.sales} vendas
                      </span>
                      <span className="font-semibold text-accent">
                        {formatCurrency(broker.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-gold rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
