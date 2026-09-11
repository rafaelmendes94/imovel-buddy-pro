import { Link, useLocation } from "react-router-dom";
import { Home, Building2, Search, Users, Menu as MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomNavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: () => void;
  matchPaths?: string[];
};

export function MobileBottomNav({ items }: { items: BottomNavItem[] }) {
  const location = useLocation();

  const isActive = (item: BottomNavItem) => {
    const paths = item.matchPaths ?? (item.path ? [item.path] : []);
    return paths.some(
      (p) => location.pathname === p || (p !== "/" && location.pathname.startsWith(p + "/"))
    );
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border shadow-[0_-2px_16px_hsl(var(--foreground)/0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around h-[62px] px-1">
        {items.map((item) => {
          const active = isActive(item);
          const content = (
            <span
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-full w-full text-[10.5px] font-medium transition-all select-none",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center h-8 w-12 rounded-full transition-all",
                  active ? "bg-primary/10" : "bg-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "w-[21px] h-[21px] transition-transform",
                    active && "scale-110"
                  )}
                />
              </span>
              <span className="leading-none truncate max-w-full">{item.label}</span>
            </span>
          );

          return (
            <li key={item.label} className="flex-1">
              {item.path ? (
                <Link to={item.path} className="block h-full active:opacity-70">
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={item.action}
                  className="block h-full w-full active:opacity-70"
                  aria-label={item.label}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const bottomNavIcons = { Home, Building2, Search, Users, MenuIcon };
