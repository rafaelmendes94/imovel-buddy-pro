import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: ("super_admin" | "admin_staff" | "broker" | "partner")[];
  allowBlocked?: boolean;
  allowNoSubscription?: boolean;
}

export function AuthGuard({ children, requiredRoles, allowBlocked = false, allowNoSubscription = false }: AuthGuardProps) {
  const { user, loading, roles, isBlocked, subscription, isSuperAdmin, isAdminStaff } = useAuth();
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
