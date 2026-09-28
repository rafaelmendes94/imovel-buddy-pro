import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, CreditCard, Loader2, Lock, MailCheck, UserPlus } from "lucide-react";
import logoImg from "@/assets/logo.png";

type Plan = {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  trial_days: number;
  max_properties: number;
  max_brokers: number;
  modules: string[] | null;
  plan_type: string;
};

const cycleLabel = (cycle?: string) =>
  cycle === "annual" ? "/ano" :
  cycle === "quarterly" ? "/trimestre" :
  cycle === "semiannual" ? "/semestre" :
  "/mês";

const planTypeToAccount = (type?: string): "corretor" | "imobiliaria" | "parceiro" =>
  type === "parceiro" ? "parceiro" : type === "imobiliaria" ? "imobiliaria" : "corretor";

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function Registro() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"corretor" | "imobiliaria" | "parceiro">("corretor");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planId = params.get("plan_id") || params.get("plan");
    if (planId) {
      setSelectedPlanId(planId);
      window.localStorage.setItem("mv_connect_pending_plan_id", planId);
    }
  }, []);

  useEffect(() => {
    const loadPlan = async () => {
      setLoadingPlan(true);
      const planId = selectedPlanId || window.localStorage.getItem("mv_connect_pending_plan_id") || "";
      if (!planId) {
        setLoadingPlan(false);
        return;
      }
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, price, billing_cycle, trial_days, max_properties, max_brokers, modules, plan_type")
        .eq("id", planId)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) {
        toast({
          title: "Plano não encontrado",
          description: "Escolha um plano disponível para continuar.",
          variant: "destructive",
        });
        setSelectedPlanId("");
        window.localStorage.removeItem("mv_connect_pending_plan_id");
      } else {
        const plan = data as Plan;
        setSelectedPlan(plan);
        setAccountType(planTypeToAccount(plan.plan_type));
      }
      setLoadingPlan(false);
    };
    loadPlan();
  }, [selectedPlanId, toast]);

  const traduzErro = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes("weak") || m.includes("pwned")) return "Esta senha é muito comum e foi vazada em bases públicas. Escolha uma senha mais forte (letras, números e símbolos).";
    if (m.includes("already registered") || m.includes("already been registered")) return "Este e-mail já possui uma conta. Faça login.";
    if (m.includes("invalid email")) return "E-mail inválido.";
    if (m.includes("password should be at least")) return "A senha deve ter no mínimo 6 caracteres.";
    if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    return msg;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      toast({ title: "Escolha um plano", description: "Volte para a página de planos e selecione uma opção.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          account_type: accountType,
          selected_plan_id: selectedPlanId || undefined,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      toast({ title: "Erro ao criar conta", description: traduzErro(error.message), variant: "destructive" });
      setLoading(false);
      return;
    }

    // Com confirmação de e-mail ativa, signUp NÃO cria sessão
    if (!data.session) {
      setLoading(false);
      setEmailEnviado(true);
      toast({
        title: "Confirme seu e-mail",
        description: "Depois de confirmar, entre com este e-mail para abrir o checkout do plano.",
      });
      return;
    }

    try {
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke("asaas-checkout", {
        body: { plan_id: selectedPlanId, user_id: data.user?.id },
      });
      if (checkoutError) throw checkoutError;
      if (checkoutData?.invoiceUrl) {
        window.localStorage.removeItem("mv_connect_pending_plan_id");
        window.location.href = checkoutData.invoiceUrl;
        return;
      }
      throw new Error(checkoutData?.error || "Não foi possível abrir o checkout.");
    } catch (err: any) {
      toast({
        title: "Conta criada, mas o checkout não abriu",
        description: err?.message || "Entre novamente para continuar o pagamento.",
        variant: "destructive",
      });
      navigate(`/escolher-plano?plan_id=${selectedPlanId}`);
    } finally {
      setLoading(false);
    }
  };

  if (emailEnviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <img src={logoImg} alt="MV BROKER CONNECT" className="mx-auto w-28 h-28 object-contain" />
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-3">
            <MailCheck className="w-10 h-10 mx-auto text-accent" />
            <h1 className="text-lg font-semibold text-foreground">Verifique seu e-mail</h1>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de confirmação para <span className="font-medium text-foreground">{email}</span>.
              Confirme para ativar sua conta. Ao entrar, o checkout do plano selecionado será aberto.
            </p>
            <Button className="w-full" onClick={() => navigate("/login")}>Ir para o login</Button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/planos" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Voltar aos planos
          </Link>
          <img src={logoImg} alt="MV BROKER CONNECT" className="h-14 object-contain" />
        </div>

        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[minmax(0,1fr)_420px]">
          <form onSubmit={handleRegister} className="p-6 sm:p-10 lg:p-12">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-primary">Checkout MV Broker Connect</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Crie sua conta para concluir a assinatura
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                O tipo da conta será aplicado automaticamente conforme o plano escolhido.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-800">Nome completo</label>
                <Input placeholder="Seu nome" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">E-mail</label>
                <Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">Telefone / WhatsApp</label>
                <Input placeholder="(99) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-800">Senha</label>
                <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>

            <Button type="submit" className="mt-7 h-12 w-full sm:w-auto sm:min-w-72" disabled={loading || loadingPlan || !selectedPlanId}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {loading ? "Preparando checkout..." : "Criar conta e ir para pagamento"}
            </Button>

            <p className="mt-6 text-sm text-slate-500">
              Já tem conta?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Entrar e continuar
              </Link>
            </p>
          </form>

          <div className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-10 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <Lock className="h-4 w-4" /> Pagamento seguro via Asaas
            </div>

            {loadingPlan ? (
              <div className="mt-10 flex items-center gap-2 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando plano...
              </div>
            ) : selectedPlan ? (
              <div className="mt-8">
                <p className="text-sm text-slate-400">Plano selecionado</p>
                <h2 className="mt-2 text-2xl font-bold">{selectedPlan.name}</h2>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-4xl font-black">{brl(Number(selectedPlan.price || 0))}</span>
                  <span className="pb-1 text-sm text-slate-400">{cycleLabel(selectedPlan.billing_cycle)}</span>
                </div>
                {selectedPlan.trial_days > 0 && (
                  <p className="mt-2 text-sm text-emerald-300">{selectedPlan.trial_days} dias grátis</p>
                )}

                <div className="mt-8 space-y-3 text-sm text-slate-200">
                  <PlanLine>Até {selectedPlan.max_properties} imóveis</PlanLine>
                  {selectedPlan.max_brokers > 0 && <PlanLine>Até {selectedPlan.max_brokers} corretores</PlanLine>}
                  {(selectedPlan.modules || []).slice(0, 8).map((module) => (
                    <PlanLine key={module}>{module}</PlanLine>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <p className="text-sm text-slate-300">
                      Depois de criar a conta, você será direcionado para o checkout do Asaas com Pix e cartão.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="font-semibold">Nenhum plano selecionado</p>
                <p className="mt-1 text-sm text-slate-400">Volte para a página de planos e escolha uma opção para continuar.</p>
                <Link to="/planos" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">
                  Ver planos
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
        <Check className="h-3 w-3 text-emerald-300" />
      </span>
      <span className="capitalize">{children}</span>
    </div>
  );
}
