import { Link, useLocation } from "react-router-dom";
import { Home, Building2, Map, LayoutGrid, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
};

export const MV_MOBILE_NAV_INTENT = "mv_mobile_nav_intent";

export function PublicMobileNav() {
  const location = useLocation();

  const left: Item[] = [
    { label: "Início", icon: Home, path: "/" },
    { label: "Imóveis", icon: Building2, path: "/todos-imoveis" },
  ];

  const center: Item = { label: "Feed", icon: Flame, path: "/feed" };

  const right: Item[] = [
    { label: "Mapa", icon: Map, path: "/mapa" },
    { label: "Meus Imóveis", icon: LayoutGrid, path: "/imoveis" },
  ];

  const isActive = (item: Item) => {
    const base = item.path.split("?")[0];
    if (base === "/") return location.pathname === "/";
    return location.pathname === base || location.pathname.startsWith(base + "/");
  };

  const itemContent = (item: Item, active: boolean) => (
    <span
      className={cn(
        "flex flex-col items-center justify-center gap-1 h-full w-full text-[10.5px] font-semibold select-none transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center h-8 w-14 rounded-full transition-all",
          active ? "bg-primary/10" : "bg-transparent"
        )}
      >
        <item.icon className={cn("w-[22px] h-[22px] transition-transform", active && "scale-110")} />
      </span>
      <span className="leading-none truncate max-w-full">{item.label}</span>
    </span>
  );

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-2px_18px_hsl(var(--foreground)/0.1)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around h-[68px] px-1">
        {left.map((item) => (
          <li key={item.label} className="flex-1">
            <Link to={item.path} className="block h-full active:opacity-70">
              {itemContent(item, isActive(item))}
            </Link>
          </li>
        ))}

        {/* Botão central elevado — Feed */}
        <li className="flex-1 relative">
          <Link to={center.path} aria-label="Explorar feed de imóveis">
            <span
              className={cn(
                "absolute left-1/2 -translate-x-1/2 -top-5 w-[56px] h-[56px] rounded-full bg-primary text-primary-foreground border-4 border-card flex items-center justify-center active:scale-95 transition-transform",
                isActive(center)
                  ? "shadow-[0_8px_24px_hsl(var(--primary)/0.5)]"
                  : "shadow-[0_8px_20px_hsl(var(--primary)/0.35)]"
              )}
            >
              <center.icon className="w-7 h-7" />
            </span>
            <span
              className={cn(
                "absolute bottom-2.5 left-0 right-0 text-center text-[10.5px] font-semibold leading-none",
                isActive(center) ? "text-primary" : "text-primary"
              )}
            >
              {center.label}
            </span>
          </Link>
        </li>

        {right.map((item) => (
          <li key={item.label} className="flex-1">
            <Link to={item.path} className="block h-full active:opacity-70">
              {itemContent(item, isActive(item))}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
