import { Link, useLocation } from "react-router-dom";
import {
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logoImg from "@/assets/logo.png";
import { CORE_NAV_ITEMS } from "@/config/coreNavigation";

type NavItem = (typeof CORE_NAV_ITEMS)[number];

export function AdminSidebar() {
  const location = useLocation();
  const { signOut, profile, isSuperAdmin, hasModuleAccess } = useAuth();

  const visibleModules = isSuperAdmin
    ? CORE_NAV_ITEMS
    : CORE_NAV_ITEMS.filter(item => hasModuleAccess(item.moduleKey));

  const renderItem = (item: NavItem) => {
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
        <img src={logoImg} alt="MV BROKER CONNECT" className="w-9 h-9 object-contain flex-shrink-0" />
        <div className="overflow-hidden">
          <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">MV BROKER CONNECT</h1>
          <p className="text-[10px] text-sidebar-foreground truncate">{profile?.full_name || "Super Admin"}</p>
        </div>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {visibleModules.length > 0 && (
          <>
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Módulos
            </p>
            {visibleModules.map(renderItem)}
          </>
        )}
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
