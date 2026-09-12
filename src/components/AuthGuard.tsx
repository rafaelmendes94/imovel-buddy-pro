import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

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
  const { user, loading, roles, isBlocked, subscription, isSuperAdmin, isAdminStaff, isPartner } = useAuth();
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
