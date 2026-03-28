import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCog, CreditCard, LogOut, Crown,
  Building2, Building, Fence, Camera, ClipboardCheck, Wallet,
  Table2, FileSignature, Clapperboard, Globe, Landmark, Settings,
  FileText, Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";

const adminItems = [
  { icon: LayoutDashboard, label: "Dashboard Admin", path: "/admin/dashboard" },
  { icon: UserCog, label: "Funcionários", path: "/admin/funcionarios" },
  { icon: Users, label: "Clientes", path: "/admin/clientes" },
  { icon: CreditCard, label: "Planos", path: "/admin/planos" },
];

const operationalItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FileText, label: "Relatórios", path: "/relatorios" },
  { icon: Globe, label: "Site", path: "/site" },
  { icon: Building2, label: "Imóveis", path: "/imoveis" },
  { icon: Building, label: "Edifícios", path: "/edificios" },
  { icon: Fence, label: "Condomínios", path: "/condominios" },
  { icon: Camera, label: "Fotos da Cidade", path: "/fotos-cidade" },
  { icon: ClipboardCheck, label: "Avaliações", path: "/avaliacoes" },
  { icon: Wallet, label: "Financeiro", path: "/financeiro" },
  { icon: Table2, label: "Tabelas", path: "/tabelas" },
  { icon: FileSignature, label: "Contratos", path: "/contratos" },
  { icon: Clapperboard, label: "Material Extra", path: "/videomaker" },
  { icon: Users, label: "Corretores", path: "/corretores" },
  { icon: Landmark, label: "Imobiliárias", path: "/imobiliarias" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function AdminSidebar() {
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const renderItem = (item: typeof adminItems[0]) => {
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
  };

  return (
    <aside className="flex flex-col h-screen w-[260px] bg-sidebar border-r border-sidebar-border sticky top-0">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0">
        <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">MV Connect</h1>
          <p className="text-[10px] text-sidebar-foreground truncate">{profile?.full_name || "Super Admin"}</p>
        </div>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {/* Admin section */}
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Administração
        </p>
        {adminItems.map(renderItem)}

        <div className="px-3 py-2">
          <Separator className="bg-sidebar-border" />
        </div>

        {/* Operational section */}
        <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Operacional
        </p>
        {operationalItems.map(renderItem)}
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
