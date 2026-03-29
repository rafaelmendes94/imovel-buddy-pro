import { useState } from "react";
import { BrokerSidebar } from "./BrokerSidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionBanner } from "./SubscriptionBanner";

export function BrokerLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <BrokerSidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <BrokerSidebar />
      </div>

      <main className="flex-1 overflow-auto min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors -ml-2">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-sm font-bold text-foreground">MV CONNECT</span>
        </div>
        <SubscriptionBanner />
        {children}
      </main>
    </div>
  );
}
