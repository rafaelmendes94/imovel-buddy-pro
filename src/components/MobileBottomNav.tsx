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
    return paths.some((p) => location.pathname === p);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around h-[64px]">
        {items.map((item) => {
          const active = isActive(item);
          const content = (
            <span
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-full w-full text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-[22px] h-[22px]", active && "scale-105")} />
              <span className="leading-none">{item.label}</span>
              <span
                className={cn(
                  "block h-[3px] w-6 rounded-full transition-colors",
                  active ? "bg-primary" : "bg-transparent"
                )}
              />
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
