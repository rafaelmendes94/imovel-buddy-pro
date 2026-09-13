import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Ban, PlayCircle, Pause, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Client {
  user_id: string;
  full_name: string;
  email: string | null;
  subscription?: any;
}

const statusColors: Record<string, string> = {
  trial: "bg-info/10 text-info border-info/30",
  active: "bg-success/10 text-success border-success/30",
  overdue: "bg-warning/10 text-warning border-warning/30",
  blocked: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function AdminClientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [asTrial, setAsTrial] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    const [rolesRes, plansRes] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "broker"),
      supabase.from("plans").select("*").eq("is_active", true).in("plan_type", ["corretor", "imobiliaria"]),
    ]);

    setPlans(plansRes.data || []);

    if (rolesRes.data && rolesRes.data.length > 0) {
      const userIds = rolesRes.data.map(r => r.user_id);
      const [profilesRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds),
        supabase.from("subscriptions").select("*, plans(name)").in("user_id", userIds),
      ]);

      const clientList = userIds.map(uid => ({
        user_id: uid,
        full_name: profilesRes.data?.find(p => p.user_id === uid)?.full_name || "Sem nome",
        email: profilesRes.data?.find(p => p.user_id === uid)?.email || null,
        subscription: subsRes.data?.find(s => s.user_id === uid),
      }));
      setClients(clientList);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!newEmail || !newName || !newPassword || !selectedPlan) return;
    setCreating(true);

    const { data, error } = await supabase.functions.invoke("admin-create-broker", {
      body: {
        full_name: newName,
        email: newEmail,
        password: newPassword,
        account_type: "corretor",
        plan_id: selectedPlan,
      },
    });

    if (error || data?.error) {
      toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" });
      setCreating(false);
      return;
    }

    if (!asTrial && data?.user_id) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", data.user_id)
        .order("created_at", { ascending: false })
        .limit(1);
      const subId = subs?.[0]?.id;
      if (subId) {
        await supabase.from("subscriptions").update({
          status: "active" as any,
          trial_ends_at: null,
        }).eq("id", subId);
      }
    }

    toast({ title: "Cliente criado!" });
    setDialogOpen(false);
    setNewEmail(""); setNewName(""); setNewPassword(""); setSelectedPlan(""); setAsTrial(false);
    setCreating(false);
    fetchData();
  };

  const updateSubscriptionStatus = async (subId: string, status: string) => {
    await supabase.from("subscriptions").update({ 
      status: status as any,
      blocked_at: status === "blocked" ? new Date().toISOString() : null,
    }).eq("id", subId);
    toast({ title: `Status atualizado para ${status}` });
    fetchData();
  };

  const simulatePayment = async (userId: string) => {
    const { error } = await supabase.rpc("simulate_payment_approval", { _user_id: userId });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pagamento simulado", description: "Assinatura ativada por 30 dias." });
    fetchData();
  };

  const expireTrial = async (subId: string) => {
    await supabase.from("subscriptions")
      .update({ trial_ends_at: new Date(Date.now() - 86400000).toISOString() })
      .eq("id", subId);
    toast({ title: "Trial expirado (data forçada para ontem)" });
    fetchData();
  };

  const runLifecycle = async () => {
    const { error } = await supabase.rpc("process_subscription_lifecycle");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ciclo de vida processado", description: "Trials expirados e bloqueios aplicados." });
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Clientes (Corretores)</h1>
          <div className="flex flex-wrap gap-2">

            <Button variant="outline" onClick={runLifecycle} title="Processa trials expirados, bloqueios e cancelamentos agora">
              <RefreshCw className="w-4 h-4 mr-2" />Rodar ciclo agora
            </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Cliente</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} />
                <Input type="email" placeholder="E-mail" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                <Input type="password" placeholder="Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                  <SelectContent>
                    {plans.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} - R$ {p.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={asTrial} onChange={e => setAsTrial(e.target.checked)} className="rounded" />
                  Iniciar como Trial
                </label>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Criando..." : "Criar Cliente"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : clients.length === 0 ? (
          <div className="text-muted-foreground">Nenhum cliente cadastrado.</div>
        ) : (
          <div className="space-y-3">
            {clients.map(c => (
              <div key={c.user_id} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{c.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{c.email}</p>
                </div>
                {c.subscription ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className={statusColors[c.subscription.status] || ""}>
                      {c.subscription.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {(c.subscription as any).plans?.name || "Sem plano"}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" title="Simular pagamento aprovado" onClick={() => simulatePayment(c.user_id)}>
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      </Button>
                      {c.subscription.status === "trial" && (
                        <Button size="sm" variant="ghost" title="Forçar trial expirado" onClick={() => expireTrial(c.subscription.id)}>
                          <Clock className="w-4 h-4 text-warning" />
                        </Button>
                      )}
                      {c.subscription.status !== "active" && (
                        <Button size="sm" variant="ghost" title="Marcar ativo" onClick={() => updateSubscriptionStatus(c.subscription.id, "active")}>
                          <PlayCircle className="w-4 h-4 text-success" />
                        </Button>
                      )}
                      {c.subscription.status !== "blocked" && (
                        <Button size="sm" variant="ghost" title="Bloquear" onClick={() => updateSubscriptionStatus(c.subscription.id, "blocked")}>
                          <Ban className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                      {c.subscription.status !== "cancelled" && (
                        <Button size="sm" variant="ghost" title="Cancelar" onClick={() => updateSubscriptionStatus(c.subscription.id, "cancelled")}>
                          <Pause className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Sem assinatura</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
