import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { PlanPaymentCheckout } from "@/components/PlanPaymentCheckout";
import { formatBrazilianPhone, onlyPhoneDigits } from "@/lib/phone";

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

const planTypeToAccount = (type?: string): "corretor" | "imobiliaria" | "parceiro" =>
  type === "parceiro" ? "parceiro" : type === "imobiliaria" ? "imobiliaria" : "corretor";

export default function Registro() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"corretor" | "imobiliaria" | "parceiro">("corretor");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
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

  const createAccount = async () => {
    if (accountCreated) return true;
    if (!selectedPlanId) {
      toast({ title: "Escolha um plano", description: "Volte para a página de planos e selecione uma opção.", variant: "destructive" });
      return false;
    }
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      toast({
        title: "Revise seus dados",
        description: "Informe nome, e-mail e uma senha com pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return false;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: onlyPhoneDigits(phone),
          account_type: accountType,
          selected_plan_id: selectedPlanId || undefined,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      toast({ title: "Erro ao criar conta", description: traduzErro(error.message), variant: "destructive" });
      return false;
    }

    if (!data.session) {
      setEmailEnviado(true);
      toast({
        title: "Confirme seu e-mail",
        description: "Depois de confirmar, entre com este e-mail para abrir o checkout do plano.",
      });
      return false;
    }

    setAccountCreated(true);
    return true;
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
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/planos" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Voltar aos planos
          </Link>
          <img src={logoImg} alt="MV BROKER CONNECT" className="h-12 object-contain" />
        </div>

        {loadingPlan ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : selectedPlan ? (
          <PlanPaymentCheckout
            plan={selectedPlan}
            embedded
            beforePayment={createAccount}
            accountFields={(
              <div className="grid gap-4 border-b border-slate-100 pb-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-800">Nome completo</label>
                  <Input placeholder="Seu nome" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">E-mail</label>
                  <Input type="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">Telefone / WhatsApp</label>
                  <Input
                    type="tel"
                    inputMode="tel"
                    maxLength={15}
                    placeholder="(99) 99999-9999"
                    value={phone}
                    onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))}
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-800">Senha</label>
                  <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
                </div>
                <p className="text-sm text-slate-500 sm:col-span-2">
                  Já tem conta?{" "}
                  <Link to="/login" className="font-semibold text-primary hover:underline">Entrar e continuar</Link>
                </p>
              </div>
            )}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-xl font-bold text-slate-950">Nenhum plano selecionado</h1>
            <p className="mt-2 text-sm text-slate-500">Volte para a página de planos e escolha uma opção para continuar.</p>
            <Link to="/planos" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Ver planos</Link>
          </div>
        )}
      </div>
    </div>
  );
}
