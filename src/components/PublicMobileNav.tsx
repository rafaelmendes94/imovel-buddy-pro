import { Link, useLocation } from "react-router-dom";
import { Home, Building2, Search, Trophy, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
};

export function PublicMobileNav() {
  const location = useLocation();

  const items: Item[] = [
    { label: "Início", icon: Home, path: "/" },
    { label: "Imóveis", icon: Building2, path: "/todos-imoveis" },
    { label: "Buscar", icon: Search, path: "/todos-imoveis?busca=1" },
    { label: "Ranking", icon: Trophy, path: "/ranking" },
    { label: "Parceiros", icon: Handshake, path: "/parceiros" },
  ];

  const isActive = (item: Item) => {
    const base = item.path.split("?")[0];
    if (base === "/") return location.pathname === "/";
    return location.pathname === base || location.pathname.startsWith(base + "/");
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-2px_18px_hsl(var(--foreground)/0.1)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around h-[68px] px-1">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <li key={item.label} className="flex-1">
              <Link to={item.path} className="block h-full active:opacity-70">
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
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
