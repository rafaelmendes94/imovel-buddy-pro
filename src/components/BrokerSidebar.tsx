import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Camera, ClipboardCheck, Wallet, Table2,
  FileSignature, Clapperboard, Users, CreditCard, LogOut, Home, Building, Fence, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const allModules: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; path: string }> = {
  imoveis: { icon: Building2, label: "Imóveis", path: "/painel/imoveis" },
  edificios: { icon: Building, label: "Edifícios", path: "/painel/edificios" },
  condominios: { icon: Fence, label: "Condomínios", path: "/painel/condominios" },
  site: { icon: Globe, label: "Site", path: "/painel/site" },
  fotos: { icon: Camera, label: "Fotos da Cidade", path: "/painel/fotos-cidade" },
  avaliacoes: { icon: ClipboardCheck, label: "Avaliações", path: "/painel/avaliacoes" },
  financeiro: { icon: Wallet, label: "Financeiro", path: "/painel/financeiro" },
  tabelas: { icon: Table2, label: "Tabelas", path: "/painel/tabelas" },
  contratos: { icon: FileSignature, label: "Contratos", path: "/painel/contratos" },
  videomaker: { icon: Clapperboard, label: "Material Extra", path: "/painel/videomaker" },
  corretores: { icon: Users, label: "Corretores", path: "/painel/corretores" },
};

export function BrokerSidebar() {
  const location = useLocation();
  const { signOut, profile, subscription } = useAuth();

  const enabledModules = subscription?.plan?.modules || [];

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/painel" },
    ...enabledModules
      .map(m => allModules[m as string])
      .filter(Boolean),
    { icon: CreditCard, label: "Assinatura", path: "/painel/assinatura" },
  ];

  return (
    <aside className="flex flex-col h-screen w-[260px] bg-sidebar border-r border-sidebar-border sticky top-0">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0">
        <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
          <Home className="w-5 h-5 text-primary" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">MV CONNECT</h1>
          <p className="text-[10px] text-sidebar-foreground truncate">{profile?.full_name || "Corretor"}</p>
        </div>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border flex-shrink-0">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
