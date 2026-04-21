import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export function SubscriptionBanner() {
  const { subscription } = useAuth();

  if (!subscription) return null;

  const { status, trial_ends_at, current_period_end } = subscription;

  if (status === "trial" && trial_ends_at) {
    const daysLeft = Math.max(0, Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86400000));
    if (daysLeft <= 3) {
      return (
        <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center gap-2 text-sm text-warning-foreground">
          <Clock className="w-4 h-4 text-warning" />
          <span>Seu trial expira em <strong>{daysLeft} dia(s)</strong>.</span>
          <Link to="/painel/assinatura" className="ml-auto text-accent font-medium hover:underline">
            Assinar agora
          </Link>
        </div>
      );
    }
  }

  if (status === "pending_payment") {
    return (
      <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center gap-2 text-sm text-warning-foreground">
        <Clock className="w-4 h-4 text-warning" />
        <span>Aguardando confirmação do pagamento.</span>
        <Link to="/painel/assinatura" className="ml-auto text-accent font-medium hover:underline">
          Ver detalhes
        </Link>
      </div>
    );
  }

  if (status === "overdue") {
    return (
      <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2 flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="w-4 h-4" />
        <span>Pagamento pendente. Regularize para evitar bloqueio.</span>
        <Link to="/painel/assinatura" className="ml-auto font-medium hover:underline">
          Regularizar
        </Link>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2 flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="w-4 h-4" />
        <span><strong>Acesso bloqueado.</strong> Regularize seu plano para continuar.</span>
        <Link to="/painel/assinatura" className="ml-auto font-medium hover:underline">
          Regularizar agora
        </Link>
      </div>
    );
  }

  return null;
}
