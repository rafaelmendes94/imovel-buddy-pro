import { BrokerLayout } from "@/components/BrokerLayout";
import { BackButton } from "@/components/BackButton";
import { MetricCard } from "@/components/MetricCard";
import { PartnersAdSlider } from "@/components/PartnersAdSlider";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/mockData";
import {
  Building2,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Eye,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
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

interface Imovel {
  id: string;
  preco: number;
  status: string;
  tipo: string;
  views: number;
  created_at: string;
  updated_at: string;
  data_venda: string | null;
}

const TYPE_COLORS = ["hsl(var(--accent))", "hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function BrokerDashboard() {
  const { user, profile, subscription } = useAuth();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  const planName = subscription?.plan?.name || "Sem plano";
  const status = subscription?.status || "—";

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("imoveis")
        .select("id, preco, status, tipo, views, created_at, updated_at, data_venda")
        .eq("user_id", user.id);
      setImoveis(
        (data || []).map((r: any) => ({
          id: r.id,
          preco: Number(r.preco) || 0,
          status: r.status || "",
          tipo: r.tipo || "Outros",
          views: Number(r.views) || 0,
          created_at: r.created_at,
          updated_at: r.updated_at,
          data_venda: r.data_venda,
        }))
      );
      setLoading(false);
    })();
  }, [user]);

  const stats = useMemo(() => {
    const isSold = (s: string) => /vendid/i.test(s);
    const total = imoveis.length;
    const sold = imoveis.filter((i) => isSold(i.status));
    const available = imoveis.filter((i) => /dispon/i.test(i.status)).length;
    const vgvCadastrado = imoveis.reduce((s, i) => s + i.preco, 0);
    const vgvVendido = sold.reduce((s, i) => s + i.preco, 0);
    const totalViews = imoveis.reduce((s, i) => s + i.views, 0);
    const qtdVendas = sold.length;
    const ticketMedio = qtdVendas > 0 ? vgvVendido / qtdVendas : 0;
    return { total, sold, available, vgvCadastrado, vgvVendido, totalViews, qtdVendas, ticketMedio };
  }, [imoveis]);

  const monthlyData = useMemo(() => {
    const sold = stats.sold;
    return MONTHS.map((month, i) => {
      const m = sold.filter((s) => {
        const d = new Date(s.data_venda || s.updated_at);
        return d.getMonth() === i;
      });
      return {
        month,
        vendas: m.length,
        receita: m.reduce((sum, s) => sum + s.preco, 0),
      };
    });
  }, [stats.sold]);

  const typeData = useMemo(() => {
    const map: Record<string, number> = {};
    imoveis.forEach((i) => {
      const t = i.tipo || "Outros";
      map[t] = (map[t] || 0) + 1;
    });
    const total = imoveis.length || 1;
    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value: Math.round((value / total) * 100),
      fill: TYPE_COLORS[idx % TYPE_COLORS.length],
    }));
  }, [imoveis]);

  return (
    <BrokerLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <PartnersAdSlider />

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {profile?.full_name || "Corretor"}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plano: <strong className="text-accent">{planName}</strong> · Status: <strong>{status}</strong>
          </p>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Meus Imóveis"
            value={stats.total.toString()}
            change={`${stats.available} disponíveis`}
            changeType="neutral"
            icon={Building2}
          />
          <MetricCard
            title="Vendas Realizadas"
            value={stats.qtdVendas.toString()}
            change={stats.qtdVendas > 0 ? `Ticket médio: ${formatCurrency(stats.ticketMedio)}` : "Sem vendas ainda"}
            changeType="positive"
            icon={TrendingUp}
          />
          <MetricCard
            title="Receita Total"
            value={formatCurrency(stats.vgvVendido)}
            change={`${stats.qtdVendas} vendas`}
            changeType="positive"
            icon={DollarSign}
          />
          <MetricCard
            title="Visualizações"
            value={stats.totalViews.toLocaleString("pt-BR")}
            change="Acumulado nos imóveis"
            changeType="neutral"
            icon={Eye}
          />
        </div>

        {/* VGV / Plano */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="elevated-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VGV Cadastrado</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(stats.vgvCadastrado)}</p>
                <p className="text-[10px] text-muted-foreground">{stats.total} imóveis no portfólio</p>
              </div>
            </div>
          </div>
          <div className="elevated-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VGV Vendido</p>
                <p className="text-xl font-bold text-emerald-500">{formatCurrency(stats.vgvVendido)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {stats.vgvCadastrado > 0
                    ? `${((stats.vgvVendido / stats.vgvCadastrado) * 100).toFixed(1)}% do cadastrado`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="elevated-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10">
                <CreditCard className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plano Atual</p>
                <p className="text-xl font-bold text-foreground">{planName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {subscription?.plan?.max_properties
                    ? `${stats.total} / ${subscription.plan.max_properties} imóveis`
                    : status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Minhas Vendas por Mês</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
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

          <div className="elevated-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Tipos de Imóveis</h3>
            {typeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
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
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium text-card-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Receita mensal */}
        <div className="elevated-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
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

        {/* Relatório de Vendas */}
        <div className="elevated-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-card-foreground">Relatório de Vendas</h3>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </div>
          {stats.sold.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {loading ? "Carregando..." : "Você ainda não possui vendas registradas."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4 font-medium">Data</th>
                    <th className="py-2 pr-4 font-medium">Tipo</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.sold]
                    .sort((a, b) => new Date(b.data_venda || b.updated_at).getTime() - new Date(a.data_venda || a.updated_at).getTime())
                    .map((s) => (
                      <tr key={s.id} className="border-b border-border/50">
                        <td className="py-2 pr-4 text-card-foreground">
                          {new Date(s.data_venda || s.updated_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-2 pr-4 text-card-foreground">{s.tipo}</td>
                        <td className="py-2 pr-4 text-card-foreground">{s.status}</td>
                        <td className="py-2 pr-4 text-right font-medium text-emerald-500">{formatCurrency(s.preco)}</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td colSpan={3} className="py-2 pr-4 font-semibold text-card-foreground">
                      Total ({stats.qtdVendas} vendas)
                    </td>
                    <td className="py-2 pr-4 text-right font-bold text-emerald-500">{formatCurrency(stats.vgvVendido)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </BrokerLayout>
  );
}
