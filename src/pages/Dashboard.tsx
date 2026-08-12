import { AppLayout } from "@/components/AppLayout";
import { AdminLayout } from "@/components/AdminLayout";
import { BackButton } from "@/components/BackButton";
import { MetricCard } from "@/components/MetricCard";
import { PartnersAdSlider } from "@/components/PartnersAdSlider";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Download,
  ShoppingCart,
  BarChart3,
  Landmark,
  UserCheck,
  HardHat,
} from "lucide-react";
import { formatCurrency } from "@/data/mockData";
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
} from "recharts";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(160 84% 39%)",
  "hsl(38 92% 50%)",
  "hsl(280 65% 60%)",
  "hsl(200 90% 55%)",
];

interface ImovelRow {
  preco: number | null;
  tipo: string | null;
  status: string | null;
  data_venda: string | null;
  updated_at: string | null;
}

export default function Dashboard() {
  const { isSuperAdmin, isAdminStaff } = useAuth();
  const isAdmin = isSuperAdmin || isAdminStaff;
  const Layout = isAdmin ? AdminLayout : AppLayout;

  const [dbStats, setDbStats] = useState({ clients: 0, imobiliarias: 0, corretores: 0, construtoras: 0 });
  const [imoveis, setImoveis] = useState<ImovelRow[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [corretoresRes, imobiliariasRes, construtorasRes, imoveisRes] = await Promise.all([
        supabase.from("subscriptions").select("id, plans!inner(plan_type)", { count: "exact", head: true }).eq("status", "active").eq("plans.plan_type", "corretor"),
        supabase.from("subscriptions").select("id, plans!inner(plan_type)", { count: "exact", head: true }).eq("status", "active").eq("plans.plan_type", "imobiliaria"),
        supabase.from("construtoras").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("imoveis").select("preco, tipo, status, data_venda, updated_at").limit(5000),
      ]);
      setDbStats({
        clients: 0,
        imobiliarias: imobiliariasRes.count || 0,
        corretores: corretoresRes.count || 0,
        construtoras: construtorasRes.count || 0,
      });
      setImoveis((imoveisRes.data as ImovelRow[]) || []);
    };
    fetchStats();
  }, []);

  const isSold = (s: string | null) => !!s && s.toLowerCase().includes("vendid");

  const totalProperties = imoveis.length;
  const available = imoveis.filter((p) => (p.status || "").toLowerCase().includes("dispon")).length;
  const soldList = imoveis.filter((p) => isSold(p.status));

  const vgvCadastrado = imoveis.reduce((sum, p) => sum + (Number(p.preco) || 0), 0);
  const vgvVendido = soldList.reduce((sum, p) => sum + (Number(p.preco) || 0), 0);
  const qtdVendas = soldList.length;
  const totalRevenue = vgvVendido;
  const totalSales = qtdVendas;

  const salesByMonth = MONTHS.map((month, i) => {
    const monthSales = soldList.filter((p) => {
      const d = p.data_venda || p.updated_at;
      return d ? new Date(d).getMonth() === i : false;
    });
    return {
      month,
      vendas: monthSales.length,
      receita: monthSales.reduce((sum, p) => sum + (Number(p.preco) || 0), 0),
    };
  });

  const typeData = (() => {
    const counts: Record<string, number> = {};
    imoveis.forEach((p) => {
      const key = p.tipo || "Outros";
      counts[key] = (counts[key] || 0) + 1;
    });
    const total = imoveis.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value: Math.round((value / total) * 100),
        fill: PIE_COLORS[i % PIE_COLORS.length],
      }));
  })();


  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <BackButton />
        <PartnersAdSlider />
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
            value={dbStats.corretores.toString()}
            changeType="neutral"
            icon={Users}
          />
          <MetricCard
            title="Receita Total"
            value={formatCurrency(totalRevenue)}
            change="VGV vendido"
            changeType="neutral"
            icon={DollarSign}
          />
          <MetricCard
            title="Vendas Realizadas"
            value={totalSales.toString()}
            change="imóveis vendidos"
            changeType="neutral"
            icon={TrendingUp}
          />
        </div>

        {/* Real DB Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Corretores Ativos"
            value={dbStats.corretores.toString()}
            changeType="neutral"
            icon={Users}
          />
          <MetricCard
            title="Imobiliárias Ativas"
            value={dbStats.imobiliarias.toString()}
            changeType="neutral"
            icon={Landmark}
          />
          <MetricCard
            title="Construtoras Ativas"
            value={dbStats.construtoras.toString()}
            changeType="neutral"
            icon={HardHat}
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
                <p className="text-[10px] text-muted-foreground">{vgvCadastrado ? ((vgvVendido / vgvCadastrado) * 100).toFixed(1) : "0.0"}% do cadastrado</p>
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
                <p className="text-[10px] text-muted-foreground">Ticket médio: {formatCurrency(qtdVendas ? vgvVendido / qtdVendas : 0)}</p>
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
              <BarChart data={salesByMonth}>
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
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {typeData.map((entry, index) => (
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
              {typeData.map((item) => (
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

      </div>
    </Layout>
  );
}
