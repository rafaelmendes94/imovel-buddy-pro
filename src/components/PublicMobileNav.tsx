import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Building2, Search, Map, Menu as MenuIcon, X, Images, CreditCard,
  Users, Handshake, Phone, LayoutDashboard, LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type Item = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: () => void;
};

const menuLinks = [
  { label: "Ver todos os imóveis", icon: Search, path: "/todos-imoveis" },
  { label: "Mapa Condomínio", icon: Map, path: "/mapas-condominio" },
  { label: "Fotos da Cidade", icon: Images, path: "/galeria-cidade" },
  { label: "Corretores", icon: Users, path: "/ranking" },
  { label: "Parceiros", icon: Handshake, path: "/parceiros" },
  { label: "Planos", icon: CreditCard, path: "/planos" },
];

export function PublicMobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const items: Item[] = [
    { label: "Início", icon: Home, path: "/" },
    { label: "Imóveis", icon: Building2, path: "/todos-imoveis" },
    { label: "Buscar", icon: Search, path: "/todos-imoveis?busca=1" },
    { label: "Mapa", icon: Map, path: "/mapas-condominio" },
    { label: "Menu", icon: MenuIcon, action: () => setOpen(true) },
  ];

  const isActive = (item: Item) => {
    if (!item.path) return false;
    const base = item.path.split("?")[0];
    if (base === "/") return location.pathname === "/";
    return location.pathname === base || location.pathname.startsWith(base + "/");
  };

  return (
    <>
      {/* Menu bottom sheet */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-foreground">Navegar</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="p-2 -mr-2 rounded-xl active:bg-muted"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {menuLinks.map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/60 border border-border px-2 py-4 active:scale-95 transition-transform"
                >
                  <l.icon className="w-6 h-6 text-primary" />
                  <span className="text-[11px] font-semibold text-foreground text-center leading-tight">{l.label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <a
                href="#contato"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-border bg-card text-sm font-bold text-foreground active:scale-95 transition-transform"
              >
                <Phone className="w-4 h-4" /> Contato
              </a>
              <button
                onClick={() => { setOpen(false); navigate(user ? "/dashboard" : "/login"); }}
                className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-sm active:scale-95 transition-transform"
              >
                {user ? <LayoutDashboard className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                {user ? "Painel" : "Entrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-2px_18px_hsl(var(--foreground)/0.1)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex items-stretch justify-around h-[68px] px-1">
          {items.map((item) => {
            const active = isActive(item);
            const content = (
              <span
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-full w-full text-[10.5px] font-semibold select-none transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center h-8 w-14 rounded-full transition-all",
                    active ? "bg-primary/12" : "bg-transparent"
                  )}
                >
                  <item.icon className={cn("w-[22px] h-[22px] transition-transform", active && "scale-110")} />
                </span>
                <span className="leading-none truncate max-w-full">{item.label}</span>
              </span>
            );
            return (
              <li key={item.label} className="flex-1">
                {item.path ? (
                  <Link to={item.path} className="block h-full active:opacity-70">{content}</Link>
                ) : (
                  <button
                    type="button"
                    onClick={item.action}
                    aria-label={item.label}
                    className="block h-full w-full active:opacity-70"
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
