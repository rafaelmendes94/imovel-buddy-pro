import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, XCircle } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: ("super_admin" | "admin_staff" | "broker" | "partner")[];
  allowBlocked?: boolean;
  allowNoSubscription?: boolean;
}

interface ModuleGuardProps {
  children: React.ReactNode;
  adminModule?: string;
  brokerModule?: string;
  adminOnly?: boolean;
}

export function AuthGuard({ children, requiredRoles, allowBlocked = false, allowNoSubscription = false }: AuthGuardProps) {
  const { user, loading, roles, isBlocked, subscription, isSuperAdmin, isAdminStaff, isPartner, profile, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some(r => roles.includes(r));
    if (!hasRole) {
      if (isSuperAdmin || isAdminStaff) {
        return <Navigate to="/dashboard" replace />;
      }
      if (isPartner) {
        return <Navigate to="/painel-parceiro" replace />;
      }
      return <Navigate to="/painel" replace />;
    }
  }

  // Super Admin / Staff bypass subscription checks
  const isStaff = isSuperAdmin || isAdminStaff;

  const approvalStatus = profile?.approval_status || "approved";
  if (!isStaff && approvalStatus !== "approved") {
    const rejected = approvalStatus === "rejected";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {rejected ? <XCircle className="h-6 w-6 text-destructive" /> : <Clock className="h-6 w-6 text-warning" />}
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {rejected ? "Cadastro não aprovado" : "Cadastro aguardando aprovação"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {rejected
              ? profile?.rejection_reason || "Seu cadastro foi analisado, mas ainda não foi liberado para acesso."
              : "Recebemos seu cadastro. A equipe MV Broker vai verificar os dados e liberar o acesso assim que estiver tudo certo."}
          </p>
          {!rejected && (
            <p className="mt-3 text-sm font-medium text-foreground">
              Para aprovação mais rápida, mande uma mensagem no WhatsApp da MV Broker.
            </p>
          )}
          <Button variant="outline" className="mt-5 gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  // Sem subscription efetiva → escolher plano (exceto staff e rotas livres)
  if (!isStaff && !subscription && !allowNoSubscription) {
    return <Navigate to="/escolher-plano" replace />;
  }

  // Trial expirado conta como pending_payment
  const status = subscription?.status;
  const trialExpired =
    status === "trial" &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at).getTime() < Date.now();

  // pending_payment, blocked, cancelled ou trial expirado → libera só assinatura
  const needsPayment =
    status === "pending_payment" ||
    status === "cancelled" ||
    isBlocked ||
    trialExpired;

  if (!isStaff && needsPayment && !allowBlocked && !allowNoSubscription) {
    return <Navigate to="/painel/assinatura" replace />;
  }

  return <>{children}</>;
}

export function ModuleGuard({ children, adminModule, brokerModule, adminOnly = false }: ModuleGuardProps) {
  const { isSuperAdmin, isAdminStaff, isBroker, subscription, hasModuleAccess } = useAuth();

  if (isSuperAdmin) return <>{children}</>;

  if (isAdminStaff) {
    if (!adminModule) return <Navigate to="/dashboard" replace />;
    return hasModuleAccess(adminModule) ? <>{children}</> : <Navigate to="/dashboard" replace />;
  }

  if (adminOnly) return <Navigate to={isBroker ? "/painel" : "/dashboard"} replace />;

  if (isBroker) {
    if (!brokerModule) return <>{children}</>;
    const enabledModules = subscription?.plan?.modules || [];
    return enabledModules.includes(brokerModule) ? <>{children}</> : <Navigate to="/painel" replace />;
  }

  return <>{children}</>;
}
