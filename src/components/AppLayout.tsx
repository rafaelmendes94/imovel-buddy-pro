import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Menu, Home, Building2, Search, Users, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSuperAdmin, isAdminStaff, isBroker, subscription, hasModuleAccess } = useAuth();
  const useAdmin = isSuperAdmin || isAdminStaff;
  const Sidebar = useAdmin ? AdminSidebar : AppSidebar;
  const brokerModules = subscription?.plan?.modules || [];
  const canSee = (moduleKey: string) =>
    isSuperAdmin ||
    (isAdminStaff && hasModuleAccess(moduleKey)) ||
    (isBroker && brokerModules.includes(moduleKey));
  const bottomItems = useAdmin
    ? [
        { label: "Painel", icon: Home, path: "/dashboard" },
        ...(canSee("imoveis") ? [{ label: "Imóveis", icon: Building2, path: "/imoveis", matchPaths: ["/imoveis", "/cadastro-imovel"] }] : []),
        { label: "Buscar", icon: Search, path: "/todos-imoveis" },
        ...(canSee("corretores") ? [{ label: "Corretores", icon: Users, path: "/corretores" }] : []),
        { label: "Menu", icon: MoreHorizontal, action: () => setMobileOpen(true) },
      ]
    : [
        { label: "Início", icon: Home, path: "/painel" },
        ...(canSee("imoveis") ? [{ label: "Imóveis", icon: Building2, path: "/imoveis", matchPaths: ["/imoveis", "/cadastro-imovel"] }] : []),
        { label: "Buscar", icon: Search, path: "/todos-imoveis" },
        { label: "Corretores", icon: Users, path: "/cadastro-corretores" },
        { label: "Menu", icon: MoreHorizontal, action: () => setMobileOpen(true) },
      ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile header */}
        <div
          className="lg:hidden sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3"
          style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl active:bg-muted transition-colors -ml-2"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-sm font-bold text-foreground">MV BROKER CONNECT</span>
        </div>
        <div className="pb-[76px] lg:pb-0">{children}</div>
      </main>

      <MobileBottomNav items={bottomItems} />
    </div>
  );
}
