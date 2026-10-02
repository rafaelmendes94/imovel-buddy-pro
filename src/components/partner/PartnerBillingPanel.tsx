import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, CreditCard, ReceiptText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Payment {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  reference_period: string | null;
  created_at: string;
}

interface Props {
  subscriptionId?: string | null;
  planName: string;
  status?: string | null;
  periodEnd?: string | null;
}

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function PartnerBillingPanel({ subscriptionId, planName, status, periodEnd }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!subscriptionId) return;
    supabase
      .from("subscription_payments")
      .select("id,amount,status,paid_at,reference_period,created_at")
      .eq("subscription_id", subscriptionId)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setPayments((data as Payment[]) || []));
  }, [subscriptionId]);

  const active = status === "active" || status === "trial";

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" />Plano e pagamentos</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Plano atual</p>
            <p className="mt-1 text-sm font-bold">{planName}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Situação</p>
            <Badge className={active ? "mt-1 bg-emerald-100 text-emerald-800" : "mt-1 bg-amber-100 text-amber-800"}>
              {active ? "Ativo" : status || "Sem assinatura"}
            </Badge>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Próxima renovação</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {periodEnd ? new Date(periodEnd).toLocaleDateString("pt-BR") : "—"}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ReceiptText className="h-4 w-4" />Últimos pagamentos</h3>
          {payments.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
          ) : (
            <div className="divide-y rounded-md border">
              {payments.map((payment) => {
                const paid = payment.status === "approved" || payment.status === "paid" || !!payment.paid_at;
                return (
                  <div key={payment.id} className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-semibold">{money.format(Number(payment.amount) || 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.reference_period || new Date(payment.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge className={paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                      {paid && <CheckCircle2 className="mr-1 h-3 w-3" />}{paid ? "Pago" : "Pendente"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
