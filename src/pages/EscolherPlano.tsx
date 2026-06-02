import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Sparkles, Loader2 } from "lucide-react";
import logoImg from "@/assets/logo.png";

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  trial_days: number;
  max_properties: number;
  max_brokers: number;
  modules: any;
  is_free: boolean;
  plan_type: string;
}

export default function EscolherPlano() {
  const { user, signOut, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string>("corretor");

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", user.id)
        .maybeSingle();

      const type = (profile as any)?.account_type
        || (user.user_metadata as any)?.account_type
        || "corretor";
      setAccountType(type);

      const { data } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .eq("plan_type", type)
        .order("price");

      setPlans((data as any[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const homePath = accountType === "parceiro" ? "/painel-parceiro" : "/painel";

  const handleSelectFree = async (plan: Plan) => {
    if (!user) return;
    setSelectingId(plan.id);
    const { error } = await supabase.rpc("create_trial_subscription", {
      _user_id: user.id,
      _plan_id: plan.id,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setSelectingId(null);
      return;
    }
    await refreshUserData();
    toast({ title: "Plano ativado!", description: "Aproveite o MV BROKER CONNECT." });
    setSelectingId(null);
    navigate(homePath, { replace: true });
  };

  const handleSelectPaid = async (plan: Plan) => {
    if (!user) return;
    setSelectingId(plan.id);

    const { error: subscriptionError } = await supabase.rpc("create_trial_subscription", {
      _user_id: user.id,
      _plan_id: plan.id,
    });

    if (subscriptionError) {
      toast({ title: "Erro", description: subscriptionError.message, variant: "destructive" });
      setSelectingId(null);
      return;
    }

    await refreshUserData();

    if (plan.trial_days > 0) {
      toast({ title: "Trial ativado!", description: "Você já pode acessar o painel." });
      setSelectingId(null);
      navigate(homePath, { replace: true });
      return;
    }

    const { data, error } = await supabase.functions.invoke("asaas-checkout", {
      body: { plan_id: plan.id, user_id: user.id },
    });

    setSelectingId(null);

    if (error || !data?.invoiceUrl) {
      toast({
        title: "Pagamento indisponível",
        description: data?.error || "Não foi possível abrir o checkout. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    window.open(data.invoiceUrl, "_blank");
    navigate("/painel/assinatura");
  };

  const cycleLabel = (c: string) =>
    c === "monthly" ? "/mês" : c === "quarterly" ? "/trim." : c === "annual" ? "/ano" : "";

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center mb-10">
          <img src={logoImg} alt="Logo" className="w-20 h-20 object-contain mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {accountType === "parceiro" ? "Apareça para mais de 2.000 corretores" : "Escolha seu plano"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            {accountType === "parceiro"
              ? "Sua marca exposta no site e dentro do CRM para milhares de corretores ativos. Impulsione seu negócio."
              : accountType === "imobiliaria"
                ? "Planos para imobiliárias com múltiplos corretores"
                : "Planos para corretores autônomos"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            Nenhum plano disponível no momento.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map(plan => {
              const isFree = plan.is_free;
              const isSelecting = selectingId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative bg-card border rounded-2xl p-6 flex flex-col ${
                    isFree ? "border-accent shadow-lg ring-2 ring-accent/20" : "border-border"
                  }`}
                >
                  {isFree && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                      <Sparkles className="w-3 h-3 mr-1" /> Comece grátis
                    </Badge>
                  )}
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <div className="mt-3 mb-5">
                    <span className="text-3xl font-black text-foreground">
                      R$ {Number(plan.price).toFixed(0)}
                    </span>
                    {!isFree && (
                      <span className="text-sm text-muted-foreground ml-1">
                        {cycleLabel(plan.billing_cycle)}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm text-foreground flex-1 mb-5">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent" />
                      Até <strong>{plan.max_properties}</strong> imóveis
                    </li>
                    {accountType === "imobiliaria" && (
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-accent" />
                        Até <strong>{plan.max_brokers}</strong> corretores
                      </li>
                    )}
                    {!isFree && plan.trial_days > 0 && (
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-accent" />
                        {plan.trial_days} dias de trial grátis
                      </li>
                    )}
                    {Array.isArray(plan.modules) && plan.modules.slice(0, 4).map((m: string) => (
                      <li key={m} className="flex items-center gap-2 capitalize">
                        <Check className="w-4 h-4 text-accent" /> {m}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isFree ? "default" : "outline"}
                    disabled={isSelecting}
                    onClick={() => isFree ? handleSelectFree(plan) : handleSelectPaid(plan)}
                  >
                    {isSelecting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
                    ) : isFree ? "Começar grátis" : "Assinar agora"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-10">
          <button
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
