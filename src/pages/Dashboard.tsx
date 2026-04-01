import { SmartLayout } from "@/components/SmartLayout";
import { BackButton } from "@/components/BackButton";
import { MetricCard } from "@/components/MetricCard";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Download,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import {
  salesData,
  propertyTypeData,
  formatCurrency,
  properties,
  brokers,
  salesRecords,
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
  LineChart,
  Line,
} from "recharts";

export default function Dashboard() {
  const totalProperties = properties.length;
  const available = properties.filter((p) => p.status === "Disponível").length;
  const totalRevenue = salesData.reduce((sum, d) => sum + d.receita, 0);
  const totalSales = salesData.reduce((sum, d) => sum + d.vendas, 0);

  // VGV total cadastrado = sum of all property prices
  const vgvCadastrado = properties.reduce((sum, p) => sum + p.price, 0);
  // VGV vendido = sum of all salesRecords prices
  const vgvVendido = salesRecords.reduce((sum, s) => sum + s.price, 0);
  const qtdVendas = salesRecords.length;

  return (
    <SmartLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visão geral do seu portfólio imobiliário
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Imóveis"
            value={totalProperties.toString()}
            change={`${available} disponíveis`}
            changeType="neutral"
            icon={Building2}
          />
          <MetricCard
            title="Corretores Ativos"
            value={brokers.filter((b) => b.status === "Ativo").length.toString()}
            change="+2 este mês"
            changeType="positive"
            icon={Users}
          />
          <MetricCard
            title="Receita Total"
            value={formatCurrency(totalRevenue)}
            change="+12.5% vs mês anterior"
            changeType="positive"
            icon={DollarSign}
          />
          <MetricCard
            title="Vendas Realizadas"
            value={totalSales.toString()}
            change="+8.3% vs mês anterior"
            changeType="positive"
            icon={TrendingUp}
          />
        </div>

        {/* VGV Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="elevated-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VGV Total Cadastrado</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(vgvCadastrado)}</p>
                <p className="text-[10px] text-muted-foreground">{totalProperties} imóveis no portfólio</p>
              </div>
            </div>
          </div>
          <div className="elevated-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VGV Total Vendido</p>
                <p className="text-xl font-bold text-emerald-500">{formatCurrency(vgvVendido)}</p>
                <p className="text-[10px] text-muted-foreground">{((vgvVendido / vgvCadastrado) * 100).toFixed(1)}% do cadastrado</p>
              </div>
            </div>
          </div>
          <div className="elevated-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10">
                <ShoppingCart className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Quantidade de Vendas</p>
                <p className="text-xl font-bold text-foreground">{qtdVendas}</p>
                <p className="text-[10px] text-muted-foreground">Ticket médio: {formatCurrency(vgvVendido / qtdVendas)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales chart */}
          <div className="lg:col-span-2 elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">
              Vendas por Mês
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="vendas" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Property types */}
          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">
              Tipos de Imóveis
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={propertyTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {propertyTypeData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {propertyTypeData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-card-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue line chart */}
        <div className="elevated-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Receita Mensal
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
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
              <Line
                type="monotone"
                dataKey="receita"
                stroke="hsl(var(--accent))"
                strokeWidth={2.5}
                dot={{ fill: "hsl(var(--accent))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SmartLayout>
  );
}
