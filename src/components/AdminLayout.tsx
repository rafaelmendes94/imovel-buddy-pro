import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Menu, LayoutDashboard, Building2, Users, CreditCard, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/hooks/useAuth";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSuperAdmin, hasModuleAccess } = useAuth();
  const canSee = (moduleKey: string) => isSuperAdmin || hasModuleAccess(moduleKey);
  const bottomItems = [
    { label: "Painel", icon: LayoutDashboard, path: "/dashboard" },
    ...(canSee("imoveis") ? [{ label: "Imóveis", icon: Building2, path: "/imoveis" }] : []),
    ...(canSee("clientes") ? [{ label: "Clientes", icon: Users, path: "/admin/clientes" }] : []),
    ...(canSee("planos") ? [{ label: "Planos", icon: CreditCard, path: "/admin/planos" }] : []),
    { label: "Menu", icon: MoreHorizontal, action: () => setMobileOpen(true) },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AdminSidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <main className="flex-1 overflow-auto min-w-0">
        <div
          className="lg:hidden sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3"
          style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        >
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl active:bg-muted transition-colors -ml-2">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-sm font-bold text-foreground">Super Admin</span>
        </div>
        <div className="pb-[76px] lg:pb-0">{children}</div>
      </main>

      <MobileBottomNav items={bottomItems} />
    </div>
  );
}
