import { useEffect, useMemo, useState } from "react";
import { BrokerLayout } from "@/components/BrokerLayout";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, CalendarDays, ReceiptText, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  reference_period: string | null;
  created_at: string;
};

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const datePt = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-BR") : "-";

const statusLabel: Record<string, string> = {
  approved: "Pago",
  pending: "Pendente",
  overdue: "Em atraso",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
};

export default function BrokerFinanceiro() {
  const { subscription } = useAuth();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subscription?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("subscription_payments")
      .select("id, amount, status, paid_at, reference_period, created_at")
      .eq("subscription_id", subscription.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPayments((data as PaymentRow[]) || []);
        setLoading(false);
      });
  }, [subscription?.id]);

  const paidTotal = useMemo(
    () => payments.filter((p) => p.status === "approved").reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments],
  );

  return (
    <BrokerLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-5xl">
        <BackButton fallback="/painel" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              Financeiro
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe seu plano, vencimento e pagamentos registrados.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/painel/assinatura">Ver assinatura</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Plano atual</p>
                <p className="font-semibold text-foreground">{subscription?.plan?.name || "Sem plano"}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Próximo vencimento</p>
                <p className="font-semibold text-foreground">{datePt(subscription?.current_period_end)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <ReceiptText className="w-5 h-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Total pago</p>
                <p className="font-semibold text-foreground">{brl(paidTotal)}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Histórico de pagamentos</h2>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
          ) : payments.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{brl(payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      Competência {payment.reference_period || "-"} · Pago em {datePt(payment.paid_at)}
                    </p>
                  </div>
                  <Badge variant="outline">{statusLabel[payment.status] || payment.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </BrokerLayout>
  );
}
