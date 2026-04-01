import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "./AdminLayout";
import { AppLayout } from "./AppLayout";

export function SmartLayout({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isStaff } = useAuth();

  if (isSuperAdmin || isStaff) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <AppLayout>{children}</AppLayout>;
}
