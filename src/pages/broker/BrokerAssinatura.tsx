import { BrokerLayout } from "@/components/BrokerLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  trial: "Trial",
  active: "Ativo",
  overdue: "Pendente",
  blocked: "Bloqueado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  trial: "bg-info/10 text-info border-info/30",
  active: "bg-success/10 text-success border-success/30",
  overdue: "bg-warning/10 text-warning border-warning/30",
  blocked: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function BrokerAssinatura() {
  const { subscription, user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const accountType = user?.user_metadata?.account_type || "corretor";
    supabase.from("plans").select("*").eq("is_active", true).eq("plan_type", accountType).then(({ data }) => setPlans(data || []));
  }, [user]);

  const handleCheckout = async (planId: string) => {
    setLoadingCheckout(planId);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-checkout", {
        body: { plan_id: planId, user_id: user?.id },
      });

      if (error) throw error;

      if (data?.invoiceUrl) {
        window.open(data.invoiceUrl, "_blank");
      } else if (data?.error) {
        toast({ title: "Checkout não disponível", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Checkout não disponível", description: "Configure o Asaas nas configurações do sistema.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro no checkout", description: err.message, variant: "destructive" });
    }
    setLoadingCheckout(null);
  };

  return (
    <BrokerLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Minha Assinatura</h1>

        {/* Current subscription */}
        {subscription && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-accent" />
              <div>
                <h2 className="font-semibold text-foreground text-lg">{subscription.plan?.name || "Plano atual"}</h2>
                <Badge variant="outline" className={statusColors[subscription.status] || ""}>
                  {statusLabels[subscription.status] || subscription.status}
                </Badge>
              </div>
            </div>
            {subscription.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Período atual até: <strong>{new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}</strong>
              </p>
            )}
            {subscription.trial_ends_at && subscription.status === "trial" && (
              <p className="text-sm text-muted-foreground">
                Trial até: <strong>{new Date(subscription.trial_ends_at).toLocaleDateString("pt-BR")}</strong>
              </p>
            )}
          </div>
        )}

        {/* Available plans */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Planos disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => {
              const isCurrent = subscription?.plan_id === plan.id;
              const modules = Array.isArray(plan.modules) ? plan.modules : [];

              return (
                <div key={plan.id} className={`bg-card border rounded-xl p-6 space-y-4 ${isCurrent ? "border-accent ring-2 ring-accent/20" : "border-border"}`}>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{plan.name}</h3>
                    <p className="text-3xl font-bold text-accent mt-1">
                      R$ {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.billing_cycle === "monthly" ? "mês" : plan.billing_cycle === "quarterly" ? "trim" : "ano"}
                      </span>
                    </p>
                  </div>

                  <ul className="space-y-1.5 text-sm">
                    <li className="flex items-center gap-2 text-foreground">
                      <Check className="w-4 h-4 text-success" />{plan.max_properties} imóveis
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <Check className="w-4 h-4 text-success" />{plan.max_brokers} corretores
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <Check className="w-4 h-4 text-success" />{plan.trial_days} dias de trial
                    </li>
                    {modules.slice(0, 5).map((m: string) => (
                      <li key={m} className="flex items-center gap-2 text-foreground">
                        <Check className="w-4 h-4 text-success" />{m}
                      </li>
                    ))}
                    {modules.length > 5 && (
                      <li className="text-muted-foreground text-xs">+{modules.length - 5} módulos</li>
                    )}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrent ? "secondary" : "default"}
                    disabled={isCurrent || loadingCheckout === plan.id}
                    onClick={() => handleCheckout(plan.id)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isCurrent ? "Plano atual" : loadingCheckout === plan.id ? "Redirecionando..." : "Assinar"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BrokerLayout>
  );
}
