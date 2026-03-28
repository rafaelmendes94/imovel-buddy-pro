import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, CreditCard, UserCog, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalClients: 0, activeSubscriptions: 0, blockedSubscriptions: 0, totalStaff: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [clients, activeSubs, blockedSubs, staff] = await Promise.all([
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "broker"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "blocked"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin_staff"),
      ]);
      setStats({
        totalClients: clients.count || 0,
        activeSubscriptions: activeSubs.count || 0,
        blockedSubscriptions: blockedSubs.count || 0,
        totalStaff: staff.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { icon: Users, label: "Corretores", value: stats.totalClients, color: "text-accent" },
    { icon: CreditCard, label: "Assinaturas Ativas", value: stats.activeSubscriptions, color: "text-success" },
    { icon: TrendingUp, label: "Bloqueados", value: stats.blockedSubscriptions, color: "text-destructive" },
    { icon: UserCog, label: "Funcionários", value: stats.totalStaff, color: "text-info" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard Administrativo</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <div key={card.label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <card.icon className={`w-8 h-8 ${card.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
