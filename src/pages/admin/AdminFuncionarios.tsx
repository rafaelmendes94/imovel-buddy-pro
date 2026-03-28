import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface StaffMember {
  user_id: string;
  profile: { full_name: string; email: string | null } | null;
  permissions: any;
}

export default function AdminFuncionarios() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchStaff = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin_staff");
    if (!roles || roles.length === 0) { setStaff([]); setLoading(false); return; }

    const userIds = roles.map(r => r.user_id);
    const [profilesRes, permsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds),
      supabase.from("staff_permissions").select("*").in("user_id", userIds),
    ]);

    const staffList = userIds.map(uid => ({
      user_id: uid,
      profile: profilesRes.data?.find(p => p.user_id === uid) || null,
      permissions: permsRes.data?.find(p => p.user_id === uid) || null,
    }));

    setStaff(staffList);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleCreate = async () => {
    if (!newEmail || !newName || !newPassword) return;
    setCreating(true);

    // Sign up as admin_staff via edge function would be ideal, but for now use client
    const { data, error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: { data: { full_name: newName } },
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setCreating(false);
      return;
    }

    if (data.user) {
      // Update role to admin_staff (trigger creates broker by default)
      await supabase.from("user_roles").update({ role: "admin_staff" as any }).eq("user_id", data.user.id);
      // Create permissions row
      await supabase.from("staff_permissions").insert({ user_id: data.user.id } as any);
    }

    toast({ title: "Funcionário criado!" });
    setNewEmail("");
    setNewName("");
    setNewPassword("");
    setDialogOpen(false);
    setCreating(false);
    fetchStaff();
  };

  const togglePermission = async (userId: string, field: string, value: boolean) => {
    await supabase.from("staff_permissions").update({ [field]: value } as any).eq("user_id", userId);
    fetchStaff();
  };

  const permFields = [
    { key: "can_view_financeiro", label: "Financeiro" },
    { key: "can_view_corretores", label: "Corretores" },
    { key: "can_view_relatorios", label: "Relatórios" },
    { key: "can_manage_plans", label: "Gerenciar Planos" },
    { key: "can_manage_clients", label: "Gerenciar Clientes" },
    { key: "can_manage_staff", label: "Gerenciar Equipe" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Funcionários</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo Funcionário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Funcionário</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} />
                <Input type="email" placeholder="E-mail" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                <Input type="password" placeholder="Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Criando..." : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : staff.length === 0 ? (
          <div className="text-muted-foreground">Nenhum funcionário cadastrado.</div>
        ) : (
          <div className="space-y-4">
            {staff.map(s => (
              <div key={s.user_id} className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground">{s.profile?.full_name || "Sem nome"}</h3>
                <p className="text-sm text-muted-foreground mb-3">{s.profile?.email}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {permFields.map(pf => (
                    <label key={pf.key} className="flex items-center gap-2 text-sm text-foreground">
                      <Switch
                        checked={s.permissions?.[pf.key] || false}
                        onCheckedChange={v => togglePermission(s.user_id, pf.key, v)}
                      />
                      {pf.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
