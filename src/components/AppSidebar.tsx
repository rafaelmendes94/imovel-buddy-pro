import { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, FileText, Settings,
  ChevronLeft, ChevronRight, Home, Building, Camera, Fence,
  Globe, ClipboardCheck, Wallet, Table2, FileSignature,
  Clapperboard, GripVertical, Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const defaultNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Relatórios", path: "/relatorios" },
  { icon: Globe, label: "Site", path: "/site-editor" },
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

function loadSavedOrder(): NavItem[] {
  try {
    const saved = localStorage.getItem("sidebar-order");
    if (!saved) return defaultNavItems;
    const paths: string[] = JSON.parse(saved);
    const mapped = paths.map(p => defaultNavItems.find(n => n.path === p)).filter(Boolean) as NavItem[];
    const missing = defaultNavItems.filter(n => !paths.includes(n.path));
    return [...mapped, ...missing];
  } catch {
    return defaultNavItems;
  }
}

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(loadSavedOrder);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const location = useLocation();

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(idx);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    setNavItems(prev => {
      const items = [...prev];
      const [moved] = items.splice(dragIdx, 1);
      items.splice(dropIdx, 0, moved);
      localStorage.setItem("sidebar-order", JSON.stringify(items.map(i => i.path)));
      return items;
    });
    setDragIdx(null);
    setOverIdx(null);
  }, [dragIdx]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
  }, []);

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

      {/* Navigation - scrollable */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          const isDragging = dragIdx === idx;
          const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;

          return (
            <div
              key={item.path}
              draggable
              onDragStart={e => handleDragStart(e, idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDrop={e => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative transition-all duration-150",
                isDragging && "opacity-40 scale-95",
                isOver && "before:absolute before:inset-x-1 before:top-0 before:h-0.5 before:bg-accent before:rounded-full",
              )}
            >
              <Link
                to={item.path}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {!collapsed && (
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 flex-shrink-0 cursor-grab active:cursor-grabbing transition-colors" />
                )}
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle - hidden on mobile since sidebar is always full */}
      <div className="p-2 border-t border-sidebar-border flex-shrink-0 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
