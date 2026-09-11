import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Building2, Route, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import sharkFriendlyIcon from "@/assets/shark-friendly.png";

type Item = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
};

export const MV_MOBILE_NAV_INTENT = "mv_mobile_nav_intent";

export function PublicMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const left: Item[] = [
    { label: "Início", icon: Home, path: "/" },
    { label: "Imóveis", icon: Building2, path: "/todos-imoveis" },
  ];

  const right: Item[] = [
    { label: "Rota", icon: Route, path: "__rota__" },
    { label: "Parceiros", icon: Handshake, path: "/parceiros" },
  ];

  const isActive = (item: Item) => {
    const base = item.path.split("?")[0];
    if (base.startsWith("__")) return false;
    if (base === "/") return location.pathname === "/";
    return location.pathname === base || location.pathname.startsWith(base + "/");
  };

  const trigger = (intent: "rota" | "ia") => {
    const eventName = intent === "rota" ? "mv:open-route-planner" : "mv:open-shark-ai";
    const handled = !window.dispatchEvent(new CustomEvent(eventName, { cancelable: true }));
    if (!handled) {
      try {
        sessionStorage.setItem(MV_MOBILE_NAV_INTENT, intent);
      } catch {
        /* ignore */
      }
      navigate("/");
    }
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

        <li className="flex-1 relative">
          <button
            type="button"
            onClick={() => trigger("ia")}
            aria-label="Abrir assistente de IA"
            className="absolute left-1/2 -translate-x-1/2 -top-5 w-[56px] h-[56px] rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/0.35)] border-4 border-card flex items-center justify-center active:scale-95 transition-transform"
          >
            <img src={sharkFriendlyIcon} alt="" className="w-9 h-9 object-contain" />
          </button>
          <span className="absolute bottom-2.5 left-0 right-0 text-center text-[10.5px] font-semibold text-primary leading-none">
            IA
          </span>
        </li>

        {right.map((item) => (
          <li key={item.label} className="flex-1">
            {item.path === "__rota__" ? (
              <button
                type="button"
                onClick={() => trigger("rota")}
                className="block h-full w-full active:opacity-70"
                aria-label="Traçar rota"
              >
                {itemContent(item, false)}
              </button>
            ) : (
              <Link to={item.path} className="block h-full active:opacity-70">
                {itemContent(item, isActive(item))}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
