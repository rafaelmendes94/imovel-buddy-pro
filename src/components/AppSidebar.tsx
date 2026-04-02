import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, FileText, Settings,
  ChevronLeft, ChevronRight, Building, Camera, Fence,
  Globe, ClipboardCheck, Wallet, Table2, FileSignature,
  Clapperboard, Landmark, Landmark as Landmark2, HardHat, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Relatórios", path: "/relatorios" },
  { icon: Globe, label: "Site", path: "/site-editor" },
  { icon: Building2, label: "Imóveis", path: "/imoveis" },
  { icon: Building, label: "Edifícios", path: "/edificios" },
  { icon: Fence, label: "Condomínios", path: "/condominios" },
  { icon: Landmark, label: "Empreendimentos", path: "/empreendimentos" },
  { icon: Camera, label: "Fotos da Cidade", path: "/fotos-cidade" },
  { icon: ClipboardCheck, label: "Avaliações", path: "/avaliacoes" },
  { icon: Wallet, label: "Financeiro", path: "/financeiro" },
  { icon: Table2, label: "Tabelas", path: "/tabelas" },
  { icon: FileSignature, label: "Contratos", path: "/contratos" },
  { icon: Clapperboard, label: "Material Extra", path: "/videomaker" },
  { icon: Users, label: "Corretores", path: "/corretores" },
  { icon: Landmark2, label: "Imobiliárias", path: "/imobiliarias" },
  { icon: HardHat, label: "Construtoras", path: "/construtoras" },
  { icon: ShoppingBag, label: "Brick", path: "/brick" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0">
        <img src={logoImg} alt="MV BROKER CONNECT" className="w-9 h-9 object-contain flex-shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">
              MV BROKER CONNECT
            </h1>
            <p className="text-[10px] text-sidebar-foreground">
              Gestão Imobiliária
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border flex-shrink-0 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
