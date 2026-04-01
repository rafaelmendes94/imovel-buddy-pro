import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { DEFAULT_PROTECTED_ROUTE } from "@/config/coreNavigation";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: ("super_admin" | "admin_staff" | "broker")[];
  allowBlocked?: boolean;
}

export function AuthGuard({ children, requiredRoles, allowBlocked = false }: AuthGuardProps) {
  const { user, loading, roles, isBlocked } = useAuth();
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
      return <Navigate to={DEFAULT_PROTECTED_ROUTE} replace />;
    }
  }

  // Blocked brokers can only see subscription page
  if (isBlocked && !allowBlocked && roles.includes("broker")) {
    return <Navigate to="/painel/assinatura" replace />;
  }

  return <>{children}</>;
}
