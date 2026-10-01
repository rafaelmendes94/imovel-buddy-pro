import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/data/mockData";
import logoImg from "@/assets/logo.png";
import sharkFriendlyIcon from "@/assets/shark-friendly.png";
import {
  Check, Star, Zap, Crown, Rocket, ArrowRight, Building2,
  ChevronDown, User, LayoutDashboard, CreditCard, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SharkAI } from "@/components/SharkAI";

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  max_properties: number;
  max_brokers: number;
  modules: any;
  trial_days: number;
  is_active: boolean;
  plan_type: string;
}

type BillingPeriod = "monthly" | "semiannual";

const BILLING_PERIODS: { value: BillingPeriod; label: string; description: string }[] = [
  { value: "monthly", label: "Mensal", description: "Pagamento todos os meses" },
  { value: "semiannual", label: "Semestral", description: "Pagamento a cada 6 meses" },
];

const PLAN_ICONS: Record<string, typeof Star> = {
  0: Star,
  1: Zap,
  2: Crown,
  3: Rocket,
};

const PLAN_COLORS = [
  { bg: "bg-gray-50", border: "border-gray-200", accent: "text-gray-700", btn: "bg-gray-800 hover:bg-gray-900" },
  { bg: "bg-blue-50", border: "border-blue-200", accent: "text-blue-700", btn: "bg-blue-600 hover:bg-blue-700" },
  { bg: "bg-primary/5", border: "border-primary/30", accent: "text-primary", btn: "bg-primary hover:bg-primary/90" },
  { bg: "bg-amber-50", border: "border-amber-200", accent: "text-amber-700", btn: "bg-amber-600 hover:bg-amber-700" },
];

const CYCLE_LABELS: Record<string, string> = {
  monthly: "/mês",
  quarterly: "/trimestre",
  semiannual: "/semestre",
  annual: "/ano",
};

export default function Planos() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [loading, setLoading] = useState(true);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("price");
      if (data) setPlans(data as Plan[]);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const brokerPlans = useMemo(
    () => plans
      .filter((plan) => plan.plan_type === "corretor")
      .sort((a, b) => a.max_properties - b.max_properties || a.price - b.price),
    [plans],
  );

  const visiblePlans = useMemo(
    () => brokerPlans.filter((plan) => plan.billing_cycle === billingPeriod),
    [billingPeriod, brokerPlans],
  );

  const handlePlanClick = async (plan: Plan) => {
    if (!user) {
      navigate(`/registro?plan_id=${plan.id}`);
      return;
    }

    setCheckoutPlanId(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-checkout", {
        body: { plan_id: plan.id, user_id: user.id },
      });

      if (error) throw error;

      if (data?.invoiceUrl) {
        window.location.href = data.invoiceUrl;
        return;
      }

      toast({
        title: "Checkout não disponível",
        description: data?.error || "Não foi possível abrir o checkout do Asaas para este plano.",
        variant: "destructive",
      });
    } catch (err: any) {
      toast({
        title: "Erro no checkout",
        description: err?.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setCheckoutPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="MV BROKER CONNECT" className="h-8 object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Início</Link>
            <Link to="/planos" className="text-primary font-semibold">Planos</Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("mv:open-shark-ai"))}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <img src={sharkFriendlyIcon} alt="" className="w-5 h-5 object-contain" />
              IA
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-semibold text-gray-700"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline max-w-[100px] truncate">{profile?.full_name || "Conta"}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button onClick={() => { navigate("/dashboard"); setUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </button>
                    <button onClick={() => { navigate("/painel/assinatura"); setUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <CreditCard className="w-4 h-4" /> Minha Assinatura
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  Entrar
                </Link>
                <Link to="/registro" className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity">
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24 text-center px-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">
          Escolha o plano ideal <br className="hidden sm:block" />
          <span className="text-primary">para o seu negócio</span>
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
          Escolha a periodicidade e o limite de imóveis ideal para organizar seus contatos e vendas.
        </p>
      </section>

      {/* Plans Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8">
        <div className="mx-auto mb-10 grid w-full max-w-md grid-cols-2 rounded-lg border border-gray-200 bg-gray-100 p-1">
          {BILLING_PERIODS.map((period) => {
            const active = billingPeriod === period.value;
            const planCount = brokerPlans.filter((plan) => plan.billing_cycle === period.value).length;

            return (
              <button
                key={period.value}
                type="button"
                onClick={() => setBillingPeriod(period.value)}
                className={cn(
                  "min-w-0 rounded-md px-3 py-2.5 text-center transition-colors",
                  active
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-500 hover:text-gray-800",
                )}
                aria-pressed={active}
              >
                <span className="block text-sm font-bold">
                  {period.label}
                  {planCount > 0 && <span className="ml-1 text-xs font-medium text-gray-400">({planCount})</span>}
                </span>
                <span className="mt-0.5 hidden text-[11px] sm:block">{period.description}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : visiblePlans.length === 0 ? (
          <p className="text-center text-gray-500 py-16">
            Nenhum plano {billingPeriod === "monthly" ? "mensal" : "semestral"} disponível no momento.
          </p>
        ) : (
          <div className={cn(
            "grid gap-6",
            visiblePlans.length === 1 && "grid-cols-1 max-w-md mx-auto",
            visiblePlans.length === 2 && "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto",
            visiblePlans.length >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            visiblePlans.length === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          )}>
            {visiblePlans.map((plan, idx) => {
              const colors = PLAN_COLORS[idx % PLAN_COLORS.length];
              const Icon = PLAN_ICONS[idx] || Star;
              const isPopular = idx === Math.min(visiblePlans.length - 1, 1);
              const modules = Array.isArray(plan.modules) ? plan.modules as string[] : [];

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border-2 p-6 sm:p-8 flex flex-col transition-all hover:shadow-xl hover:-translate-y-1",
                    colors.border, colors.bg,
                    isPopular && "ring-2 ring-primary/20 shadow-lg scale-[1.02]"
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      Mais Popular
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg)}>
                      <Icon className={cn("w-5 h-5", colors.accent)} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      {plan.trial_days > 0 && (
                        <p className="text-[10px] text-gray-500 font-medium">{plan.trial_days} dias grátis</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">
                        {CYCLE_LABELS[plan.billing_cycle] || "/mês"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 mb-6">
                    <FeatureItem icon={Building2} text={`Até ${plan.max_properties} imóveis`} />
                    {modules.map((mod, i) => (
                      <FeatureItem key={i} icon={Check} text={String(mod)} />
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={checkoutPlanId === plan.id}
                    onClick={() => handlePlanClick(plan)}
                    className={cn(
                      "w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:cursor-wait disabled:opacity-70",
                      colors.btn
                    )}
                  >
                    {checkoutPlanId === plan.id
                      ? "Abrindo checkout..."
                      : user
                        ? "Assinar com Asaas"
                        : "Começar Agora"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Perguntas Frequentes</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            { q: "Posso trocar de plano depois?", a: "Sim! Você pode fazer upgrade ou downgrade a qualquer momento." },
            { q: "Existe período de teste?", a: "Sim, todos os planos oferecem período de teste gratuito para você experimentar a plataforma." },
            { q: "Como funciona o pagamento?", a: "O pagamento é processado em uma página segura do Asaas, com opções de Pix e cartão." },
            { q: "Posso cancelar a qualquer momento?", a: "Sim, sem multas ou taxas de cancelamento. Você mantém acesso até o fim do período pago." },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{faq.q}</h3>
              <p className="text-sm text-gray-500">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Pronto para começar?</h2>
        <p className="text-gray-500 mb-6">Cadastre-se agora e experimente gratuitamente.</p>
        <Link
          to={user ? "/painel/assinatura" : "/registro"}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity"
        >
          {user ? "Ver Minha Assinatura" : "Criar Conta Grátis"}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <SharkAI properties={[]} />
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: typeof Check; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <Icon className="w-3 h-3 text-green-600" />
      </div>
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
}
