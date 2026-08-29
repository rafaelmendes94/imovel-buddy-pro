import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCog, CreditCard, LogOut, Crown,
  Building2, Building, Fence, Camera, ClipboardCheck, Wallet,
  Table2, FileSignature, Clapperboard, Globe, Landmark, Settings,
  FileText, Map, Briefcase, ShoppingBag, Brain, Handshake,
  GripVertical, RotateCcw, Trophy, LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarOrder } from "@/hooks/useSidebarOrder";
import { Separator } from "@/components/ui/separator";
import logoImg from "@/assets/logo.png";

const adminItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", moduleKey: "dashboard_admin" },
  { icon: UserCog, label: "Funcionários", path: "/admin/funcionarios", moduleKey: "funcionarios" },
  { icon: Briefcase, label: "Cargos e Funções", path: "/admin/cargos", moduleKey: "funcionarios" },
  { icon: CreditCard, label: "Planos", path: "/admin/planos", moduleKey: "planos" },
  { icon: Settings, label: "Opções do Sistema", path: "/admin/opcoes", moduleKey: "dashboard_admin" },
  { icon: Brain, label: "Configuração IA", path: "/admin/ia", moduleKey: "dashboard_admin" },
  { icon: CreditCard, label: "Asaas / Pagamentos", path: "/admin/asaas", moduleKey: "dashboard_admin" },
  { icon: Handshake, label: "Parceiros", path: "/admin/parceiros", moduleKey: "dashboard_admin" },
  { icon: Users, label: "Corretores", path: "/corretores", moduleKey: "corretores" },
  { icon: Landmark, label: "Imobiliárias", path: "/imobiliarias", moduleKey: "imobiliarias" },
];

const operationalItems = [
  { icon: FileText, label: "Relatórios", path: "/relatorios", moduleKey: "relatorios" },
  { icon: Trophy, label: "Ranking", path: "/ranking", moduleKey: "relatorios" },
  { icon: Globe, label: "Site", path: "/site-editor", moduleKey: "site_editor" },
  { icon: Building2, label: "Imóveis", path: "/imoveis", moduleKey: "imoveis" },
  { icon: Building, label: "Edifícios", path: "/edificios", moduleKey: "edificios" },
  { icon: Fence, label: "Condomínios", path: "/condominios", moduleKey: "condominios" },
  { icon: Map, label: "Mapas Condomínio", path: "/mapas-condominio", moduleKey: "condominios" },
  { icon: Camera, label: "Fotos da Cidade", path: "/fotos-cidade", moduleKey: "fotos_cidade" },
  { icon: ClipboardCheck, label: "Avaliações", path: "/avaliacoes", moduleKey: "avaliacoes" },
  { icon: Wallet, label: "Financeiro", path: "/financeiro", moduleKey: "financeiro" },
  { icon: Table2, label: "Tabelas", path: "/tabelas", moduleKey: "tabelas" },
  { icon: LayoutTemplate, label: "Gerador de Tabela", path: "/ferramentas/gerador-tabela", moduleKey: "tabelas" },
  { icon: FileSignature, label: "Contratos", path: "/contratos", moduleKey: "contratos" },
  { icon: Clapperboard, label: "Material Extra", path: "/videomaker", moduleKey: "material_extra" },
  { icon: Settings, label: "Configurações", path: "/configuracoes", moduleKey: "configuracoes" },
  // { icon: ShoppingBag, label: "Brick", path: "/admin/brick", moduleKey: "brick" }, // oculto
];

type Item = typeof adminItems[0];

/** Reorderable list of sidebar links (drag with mouse or the grip handle). */
function DraggableNav({
  items,
  scopeId,
  onNavigate,
}: {
  items: Item[];
  scopeId: string;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { applyOrder, moveItem, hasCustomOrder, resetOrder } = useSidebarOrder(scopeId);
  const ordered = applyOrder(items, i => i.path);
  const orderedKeys = ordered.map(i => i.path);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragState = useRef<{ index: number; startY: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);

  const startDrag = (index: number, clientY: number) => {
    dragState.current = { index, startY: clientY, moved: false };
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragState.current;
      if (!d) return;
      if (!d.moved) {
        if (Math.abs(e.clientY - d.startY) < 6) return;
        d.moved = true;
        setDragIndex(d.index);
      }
      const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)
        ?.closest<HTMLElement>(`[data-nav-scope="${scopeId}"]`);
      setOverIndex(el ? Number(el.dataset.navIndex) : null);
    };

    const onUp = () => {
      const d = dragState.current;
      if (d?.moved) {
        justDragged.current = true;
        setTimeout(() => (justDragged.current = false), 100);
        setOverIndex(prev => {
          if (prev !== null) moveItem(orderedKeys, d.index, prev);
          return null;
        });
      }
      dragState.current = null;
      setDragIndex(null);
      setOverIndex(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [moveItem, scopeId, orderedKeys.join("|")]);

  const suppressClickAfterDrag = (e: React.MouseEvent) => {
    if (justDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <>
      {ordered.map((item, index) => {
        const isActive = location.pathname === item.path;
        return (
          <div
            key={item.path}
            data-nav-scope={scopeId}
            data-nav-index={index}
            onPointerDown={(e: React.PointerEvent) => {
              if (e.pointerType === "mouse" && e.button !== 0) return;
              if (e.pointerType === "mouse") startDrag(index, e.clientY);
            }}
            onClickCapture={suppressClickAfterDrag}
            className={cn(
              "group relative rounded-lg transition-all select-none",
              dragIndex === index && "opacity-40",
              dragIndex !== null && overIndex === index && dragIndex !== index && "ring-2 ring-sidebar-primary/60"
            )}
          >
            <span
              onPointerDown={(e) => {
                e.stopPropagation();
                startDrag(index, e.clientY);
              }}
              title="Arraste para reordenar"
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded cursor-grab active:cursor-grabbing text-sidebar-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity touch-none"
            >
              <GripVertical className="w-3.5 h-3.5" aria-hidden />
            </span>
            <Link
              to={item.path}
              draggable={false}
              onClick={onNavigate}
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
          </div>
        );
      })}
      {hasCustomOrder && (
        <button
          onClick={resetOrder}
          className="mt-1 flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[11px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar ordem original</span>
        </button>
      )}
    </>
  );
}

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { signOut, profile, isSuperAdmin, hasModuleAccess } = useAuth();

  const visibleAdmin = isSuperAdmin ? adminItems : adminItems.filter(i => hasModuleAccess(i.moduleKey));
  const visibleOps = isSuperAdmin ? operationalItems : operationalItems.filter(i => hasModuleAccess(i.moduleKey));

  const userId = profile?.id || "anon";

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
        {visibleAdmin.length > 0 && (
          <>
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Administração
            </p>
            <DraggableNav items={visibleAdmin} scopeId={`${userId}:admin`} onNavigate={onNavigate} />
          </>
        )}

        {visibleAdmin.length > 0 && visibleOps.length > 0 && (
          <div className="px-3 py-2">
            <Separator className="bg-sidebar-border" />
          </div>
        )}

        {visibleOps.length > 0 && (
          <>
            <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Operacional
            </p>
            <DraggableNav items={visibleOps} scopeId={`${userId}:ops`} onNavigate={onNavigate} />
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
