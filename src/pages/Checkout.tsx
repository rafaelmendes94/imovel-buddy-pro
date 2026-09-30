import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlanPaymentCheckout, type CheckoutPlan } from "@/components/PlanPaymentCheckout";
import logoImg from "@/assets/logo.png";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState<CheckoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const planId = searchParams.get("plan_id") || window.localStorage.getItem("mv_connect_pending_plan_id") || "";

  useEffect(() => {
    if (!planId) {
      setLoading(false);
      return;
    }
    supabase
      .from("plans")
      .select("id, name, price, billing_cycle, max_properties, max_brokers, modules, plan_type")
      .eq("id", planId)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        setPlan(data as CheckoutPlan | null);
        setLoading(false);
      });
  }, [planId]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/escolher-plano" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Alterar plano
          </Link>
          <img src={logoImg} alt="MV BROKER CONNECT" className="h-12 object-contain" />
        </div>

        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : plan ? (
          <PlanPaymentCheckout plan={plan} checkoutStatus={searchParams.get("checkout")} />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-xl font-bold text-slate-950">Plano não encontrado</h1>
            <p className="mt-2 text-sm text-slate-500">Escolha um plano disponível para continuar.</p>
            <Link to="/escolher-plano" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Ver planos</Link>
          </div>
        )}
      </div>
    </div>
  );
}
