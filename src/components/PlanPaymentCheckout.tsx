import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CheckCircle2, Copy, CreditCard, Loader2, Lock, QrCode, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPartnerPlanFeatures } from "@/lib/partnerPlans";

export type CheckoutPlan = {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  max_properties: number;
  max_brokers: number;
  modules: string[] | null;
  plan_type: string;
};

type PaymentMethod = "PIX" | "CREDIT_CARD";

type PixPayment = {
  encodedImage: string;
  payload: string;
  expirationDate?: string;
};

const cycleLabel = (cycle: string) =>
  cycle === "annual" ? "por ano" :
  cycle === "semiannual" ? "por semestre" :
  cycle === "quarterly" ? "por trimestre" :
  "por mês";

const formatDocument = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

export function PlanPaymentCheckout({
  plan,
  checkoutStatus,
  embedded = false,
  accountFields,
  beforePayment,
}: {
  plan: CheckoutPlan;
  checkoutStatus?: string | null;
  embedded?: boolean;
  accountFields?: ReactNode;
  beforePayment?: () => Promise<boolean>;
}) {
  const { user, profile, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [document, setDocument] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(checkoutStatus === "success");
  const [pix, setPix] = useState<PixPayment | null>(null);

  const destination = profile?.account_type === "parceiro" ? "/painel-parceiro" : "/painel";

  const checkPayment = useCallback(async () => {
    if (!user) return false;
    const { data: syncData } = await supabase.functions.invoke("asaas-sync-status");
    if (syncData?.status === "active") {
      window.localStorage.removeItem("mv_connect_pending_plan_id");
      await refreshUserData();
      toast({ title: "Pagamento confirmado!", description: "Seu plano já está liberado." });
      navigate(destination, { replace: true });
      return true;
    }

    const { data } = await supabase.rpc("get_effective_subscription", { _user_id: user.id });
    const current = Array.isArray(data) ? data[0] : null;
    if (current?.status !== "active" && current?.status !== "trial") return false;

    window.localStorage.removeItem("mv_connect_pending_plan_id");
    await refreshUserData();
    toast({ title: "Pagamento confirmado!", description: "Seu plano já está liberado." });
    navigate(destination, { replace: true });
    return true;
  }, [destination, navigate, refreshUserData, toast, user]);

  useEffect(() => {
    if (!checking && !pix) return;
    let active = true;
    const verify = async () => {
      const paid = await checkPayment();
      if (paid || !active) return;
    };
    void verify();
    const interval = window.setInterval(verify, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [checking, checkPayment, pix]);

  const startPayment = async () => {
    const digits = document.replace(/\D/g, "");
    if (![11, 14].includes(digits.length)) {
      toast({ title: "Informe seu CPF ou CNPJ", description: "Esse dado é necessário para gerar a cobrança.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (beforePayment) {
        const canContinue = await beforePayment();
        if (!canContinue) return;
      }

      const { data, error } = await supabase.functions.invoke("asaas-checkout", {
        body: { plan_id: plan.id, payment_method: method, cpf_cnpj: digits },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Não foi possível iniciar o pagamento.");

      window.localStorage.setItem("mv_connect_pending_plan_id", plan.id);
      if (method === "CREDIT_CARD") {
        if (!data?.checkoutUrl) throw new Error("O Asaas não retornou o checkout seguro.");
        window.location.assign(data.checkoutUrl);
        return;
      }

      if (!data?.pix?.payload || !data?.pix?.encodedImage) throw new Error("O Asaas não retornou o QR Code Pix.");
      setPix(data.pix);
      setChecking(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      toast({ title: "Pagamento indisponível", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyPix = async () => {
    if (!pix?.payload) return;
    await navigator.clipboard.writeText(pix.payload);
    toast({ title: "Código Pix copiado" });
  };

  const qrSource = pix?.encodedImage.startsWith("data:")
    ? pix.encodedImage
    : `data:image/png;base64,${pix?.encodedImage || ""}`;
  const isPartnerPlan = plan.plan_type === "parceiro";
  const partnerFeatures = getPartnerPlanFeatures(plan.modules);

  return (
    <div className={cn("grid overflow-hidden border border-slate-200 bg-white shadow-xl lg:grid-cols-[minmax(0,1fr)_400px]", embedded ? "rounded-3xl" : "rounded-2xl")}>
      <section className="p-6 sm:p-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <Lock className="h-4 w-4" /> Checkout seguro
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
          {accountFields ? "Assine o MV Broker Connect" : "Finalize sua assinatura"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {accountFields
            ? "Preencha seus dados e escolha o pagamento para concluir em uma única etapa."
            : "Escolha como deseja pagar. A liberação ocorre automaticamente após a confirmação do Asaas."}
        </p>

        {checkoutStatus === "cancelled" && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            O pagamento anterior foi cancelado. Você pode tentar novamente.
          </div>
        )}
        {checkoutStatus === "expired" && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            O checkout expirou. Gere um novo pagamento abaixo.
          </div>
        )}
        {checkoutStatus === "success" && checking && (
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <Loader2 className="h-4 w-4 animate-spin" /> Confirmando o pagamento e liberando seu plano...
          </div>
        )}

        {pix ? (
          <div className="mt-7 text-center">
            <div className="mx-auto w-fit rounded-xl border border-slate-200 bg-white p-3">
              <img src={qrSource} alt="QR Code Pix" className="h-56 w-56" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-950">Escaneie o QR Code</h2>
            <p className="mt-1 text-sm text-slate-500">A tela será atualizada automaticamente quando o pagamento for confirmado.</p>
            <div className="mt-4 flex gap-2">
              <Input readOnly value={pix.payload} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={copyPix} title="Copiar código Pix">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" /> Aguardando pagamento
            </div>
          </div>
        ) : (
          <div className="mt-7 space-y-6">
            {accountFields}

            <div>
              <label className="text-sm font-medium text-slate-800">CPF ou CNPJ do pagador</label>
              <Input
                value={document}
                onChange={(event) => setDocument(formatDocument(event.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                className="mt-2 h-11"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-800">Forma de pagamento</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("PIX")}
                  className={cn(
                    "flex min-h-24 flex-col items-start justify-between rounded-lg border p-4 text-left transition-colors",
                    method === "PIX" ? "border-emerald-600 bg-emerald-50" : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <QrCode className={cn("h-5 w-5", method === "PIX" ? "text-emerald-700" : "text-slate-500")} />
                  <span><strong className="block text-sm text-slate-950">Pix</strong><small className="text-slate-500">Liberação rápida</small></span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("CREDIT_CARD")}
                  className={cn(
                    "flex min-h-24 flex-col items-start justify-between rounded-lg border p-4 text-left transition-colors",
                    method === "CREDIT_CARD" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <CreditCard className={cn("h-5 w-5", method === "CREDIT_CARD" ? "text-blue-700" : "text-slate-500")} />
                  <span><strong className="block text-sm text-slate-950">Cartão</strong><small className="text-slate-500">Cobrança automática</small></span>
                </button>
              </div>
            </div>

            <Button type="button" className="h-12 w-full text-base" onClick={startPayment} disabled={loading || checking}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : method === "PIX" ? <QrCode className="mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />}
              {loading
                ? beforePayment ? "Finalizando sua assinatura..." : "Gerando pagamento..."
                : method === "PIX"
                  ? beforePayment ? "Finalizar assinatura com Pix" : "Gerar Pix"
                  : beforePayment ? "Finalizar assinatura com cartão" : "Ir para o pagamento seguro"}
            </Button>

            <div className="flex items-start gap-3 border-t border-slate-100 pt-5 text-xs text-slate-500">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p>O cartão é informado diretamente no ambiente seguro do Asaas. O MV Broker Connect não armazena os dados do seu cartão.</p>
            </div>
          </div>
        )}
      </section>

      <aside className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
        <p className="text-xs font-semibold uppercase text-slate-400">Resumo do pedido</p>
        <h2 className="mt-3 text-2xl font-bold">{plan.name}</h2>
        <div className="mt-5 border-b border-white/10 pb-5">
          <span className="text-4xl font-black">{Number(plan.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          <span className="ml-2 text-sm text-slate-400">{cycleLabel(plan.billing_cycle)}</span>
        </div>
        <div className="mt-6 space-y-3 text-sm text-slate-200">
          {isPartnerPlan ? (
            partnerFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" /> {feature}
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Até {plan.max_properties} imóveis</div>
              {plan.max_brokers > 0 && <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Até {plan.max_brokers} corretores</div>}
              {(plan.modules || []).slice(0, 6).map((module) => (
                <div key={module} className="flex items-center gap-2 capitalize"><Check className="h-4 w-4 text-emerald-400" /> {module}</div>
              ))}
            </>
          )}
        </div>
        <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5 text-sm text-slate-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Pagamento processado pelo Asaas
        </div>
      </aside>
    </div>
  );
}
