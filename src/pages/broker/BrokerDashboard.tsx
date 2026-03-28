import { BrokerLayout } from "@/components/BrokerLayout";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Users, FileSignature, CreditCard } from "lucide-react";

export default function BrokerDashboard() {
  const { profile, subscription } = useAuth();

  const planName = subscription?.plan?.name || "Sem plano";
  const status = subscription?.status || "—";

  return (
    <BrokerLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {profile?.full_name || "Corretor"}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Plano: <strong className="text-accent">{planName}</strong> · Status: <strong>{status}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Building2, label: "Imóveis", value: "—" },
            { icon: Users, label: "Corretores", value: `0 / ${subscription?.plan?.max_brokers || "—"}` },
            { icon: FileSignature, label: "Contratos", value: "—" },
            { icon: CreditCard, label: "Assinatura", value: status },
          ].map(c => (
            <div key={c.label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <c.icon className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{c.value}</p>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrokerLayout>
  );
}
