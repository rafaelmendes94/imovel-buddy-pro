import { AppLayout } from "@/components/AppLayout";
import { Building2, CreditCard, Bell, Shield } from "lucide-react";

export default function Settings() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie sua conta e assinatura
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              icon: Building2,
              title: "Dados da Imobiliária",
              description: "Nome, CNPJ, endereço e informações de contato",
            },
            {
              icon: CreditCard,
              title: "Plano e Assinatura",
              description: "Gerencie seu plano, pagamentos e faturamento",
            },
            {
              icon: Bell,
              title: "Notificações",
              description: "Alertas de novos leads, vendas e atividades",
            },
            {
              icon: Shield,
              title: "Segurança",
              description: "Senha, autenticação e permissões de acesso",
            },
          ].map((item) => (
            <button
              key={item.title}
              className="elevated-card rounded-xl p-5 text-left hover:border-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground text-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
