import { useNavigate } from "react-router-dom";
import { BrokerLayout } from "@/components/BrokerLayout";
import { BackButton } from "@/components/BackButton";
import { QuickImovelForm } from "@/components/QuickImovelForm";
import { Zap } from "lucide-react";

export default function BrokerCadastroRapido() {
  const navigate = useNavigate();

  return (
    <BrokerLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
        <BackButton />

        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" /> Cadastro Rápido de Imóvel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre em segundos — o imóvel entra automaticamente no CRM e no site.
          </p>
        </div>

        <QuickImovelForm onSaved={() => navigate("/painel")} onCancel={() => navigate("/painel")} />
      </div>
    </BrokerLayout>
  );
}
