import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

const DEFAULT_PERMISSIONS = {
  dashboard_admin: { view: false, create: false, edit: false, delete: false },
  funcionarios: { view: false, create: false, edit: false, delete: false },
  clientes: { view: false, create: false, edit: false, delete: false },
  planos: { view: false, create: false, edit: false, delete: false },
  dashboard: { view: false, create: false, edit: false, delete: false },
  relatorios: { view: false, create: false, edit: false, delete: false },
  site_editor: { view: false, create: false, edit: false, delete: false },
  imoveis: { view: false, create: false, edit: false, delete: false },
  edificios: { view: false, create: false, edit: false, delete: false },
  condominios: { view: false, create: false, edit: false, delete: false },
  fotos_cidade: { view: false, create: false, edit: false, delete: false },
  avaliacoes: { view: false, create: false, edit: false, delete: false },
  financeiro: { view: false, create: false, edit: false, delete: false },
  tabelas: { view: false, create: false, edit: false, delete: false },
  contratos: { view: false, create: false, edit: false, delete: false },
  material_extra: { view: false, create: false, edit: false, delete: false },
  corretores: { view: false, create: false, edit: false, delete: false },
  imobiliarias: { view: false, create: false, edit: false, delete: false },
  configuracoes: { view: false, create: false, edit: false, delete: false },
};

type ModuleKey = keyof typeof DEFAULT_PERMISSIONS;
type ActionKey = "view" | "create" | "edit" | "delete";
type PermissionsMap = Record<ModuleKey, Record<ActionKey, boolean>>;

const ADMIN_MODULES: { key: ModuleKey; label: string }[] = [
  { key: "dashboard_admin", label: "Dashboard Admin" },
  { key: "funcionarios", label: "Funcionários" },
  { key: "clientes", label: "Clientes" },
  { key: "planos", label: "Planos" },
];

const OPERATIONAL_MODULES: { key: ModuleKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "relatorios", label: "Relatórios" },
  { key: "site_editor", label: "Site" },
  { key: "imoveis", label: "Imóveis" },
  { key: "edificios", label: "Edifícios" },
  { key: "condominios", label: "Condomínios" },
  { key: "fotos_cidade", label: "Fotos da Cidade" },
  { key: "avaliacoes", label: "Avaliações" },
  { key: "financeiro", label: "Financeiro" },
  { key: "tabelas", label: "Tabelas" },
  { key: "contratos", label: "Contratos" },
  { key: "material_extra", label: "Material Extra" },
  { key: "corretores", label: "Corretores" },
  { key: "imobiliarias", label: "Imobiliárias" },
  { key: "configuracoes", label: "Configurações" },
];

const ACTION_LABELS: { key: ActionKey; label: string }[] = [
  { key: "view", label: "Ver" },
  { key: "create", label: "Novo" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Excluir" },
];

interface StaffMember {
  user_id: string;
  profile: { full_name: string; email: string | null } | null;
  permissions: PermissionsMap;
  permRowId: string | null;
}

export default function AdminFuncionarios() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStaff = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin_staff");
    if (!roles || roles.length === 0) { setStaff([]); setLoading(false); return; }

    const userIds = roles.map(r => r.user_id);
    const [profilesRes, permsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds),
      supabase.from("staff_permissions").select("*").in("user_id", userIds),
    ]);

    const staffList = userIds.map(uid => {
      const permRow = permsRes.data?.find(p => p.user_id === uid);
      return {
        user_id: uid,
        profile: profilesRes.data?.find(p => p.user_id === uid) || null,
        permissions: (permRow as any)?.permissions || { ...DEFAULT_PERMISSIONS },
        permRowId: permRow?.id || null,
      };
    });

    setStaff(staffList);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleCreate = async () => {
    if (!newEmail || !newName || !newPassword) return;
    setCreating(true);

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
      await supabase.from("user_roles").update({ role: "admin_staff" as any }).eq("user_id", data.user.id);
      await supabase.from("staff_permissions").insert({ user_id: data.user.id, permissions: DEFAULT_PERMISSIONS } as any);
    }

    toast({ title: "Funcionário criado!" });
    setNewEmail(""); setNewName(""); setNewPassword("");
    setDialogOpen(false); setCreating(false);
    fetchStaff();
  };

  const updatePermission = async (userId: string, moduleKey: ModuleKey, action: ActionKey, value: boolean) => {
    const member = staff.find(s => s.user_id === userId);
    if (!member) return;

    const updated = { ...member.permissions };
    updated[moduleKey] = { ...updated[moduleKey], [action]: value };

    setStaff(prev => prev.map(s => s.user_id === userId ? { ...s, permissions: updated } : s));

    await supabase.from("staff_permissions").update({ permissions: updated } as any).eq("user_id", userId);
  };

  const toggleModuleAll = async (userId: string, moduleKey: ModuleKey) => {
    const member = staff.find(s => s.user_id === userId);
    if (!member) return;

    const mod = member.permissions[moduleKey];
    const allTrue = mod.view && mod.create && mod.edit && mod.delete;
    const newVal = !allTrue;

    const updated = { ...member.permissions };
    updated[moduleKey] = { view: newVal, create: newVal, edit: newVal, delete: newVal };

    setStaff(prev => prev.map(s => s.user_id === userId ? { ...s, permissions: updated } : s));
    await supabase.from("staff_permissions").update({ permissions: updated } as any).eq("user_id", userId);
  };

  const toggleAllPermissions = async (userId: string) => {
    const member = staff.find(s => s.user_id === userId);
    if (!member) return;

    const allModules = [...Object.keys(DEFAULT_PERMISSIONS)] as ModuleKey[];
    const allTrue = allModules.every(mk => {
      const m = member.permissions[mk];
      return m.view && m.create && m.edit && m.delete;
    });
    const newVal = !allTrue;

    const updated = {} as PermissionsMap;
    allModules.forEach(mk => {
      updated[mk] = { view: newVal, create: newVal, edit: newVal, delete: newVal };
    });

    setStaff(prev => prev.map(s => s.user_id === userId ? { ...s, permissions: updated } : s));
    await supabase.from("staff_permissions").update({ permissions: updated } as any).eq("user_id", userId);
  };

  const deleteStaff = async (userId: string) => {
    await supabase.from("staff_permissions").delete().eq("user_id", userId);
    await supabase.from("user_roles").delete().eq("user_id", userId);
    toast({ title: "Funcionário removido" });
    fetchStaff();
  };

  const renderPermissionTable = (modules: { key: ModuleKey; label: string }[], member: StaffMember) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Módulo</th>
            {ACTION_LABELS.map(a => (
              <th key={a.key} className="text-center py-2 px-2 text-muted-foreground font-medium w-20">{a.label}</th>
            ))}
            <th className="text-center py-2 px-2 text-muted-foreground font-medium w-20">Todos</th>
          </tr>
        </thead>
        <tbody>
          {modules.map(mod => {
            const perms = member.permissions[mod.key] || { view: false, create: false, edit: false, delete: false };
            const allChecked = perms.view && perms.create && perms.edit && perms.delete;
            return (
              <tr key={mod.key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-2.5 px-3 text-foreground font-medium">{mod.label}</td>
                {ACTION_LABELS.map(a => (
                  <td key={a.key} className="text-center py-2.5 px-2">
                    <Checkbox
                      checked={perms[a.key]}
                      onCheckedChange={(v) => updatePermission(member.user_id, mod.key, a.key, !!v)}
                    />
                  </td>
                ))}
                <td className="text-center py-2.5 px-2">
                  <Switch
                    checked={allChecked}
                    onCheckedChange={() => toggleModuleAll(member.user_id, mod.key)}
                    className="scale-75"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

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
            {staff.map(s => {
              const isExpanded = expandedUser === s.user_id;
              return (
                <div key={s.user_id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => setExpandedUser(isExpanded ? null : s.user_id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      <div>
                        <h3 className="font-semibold text-foreground">{s.profile?.full_name || "Sem nome"}</h3>
                        <p className="text-sm text-muted-foreground">{s.profile?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); toggleAllPermissions(s.user_id); }}
                        className="text-xs"
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        Liberar Tudo
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); deleteStaff(s.user_id); }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4">
                      {/* Admin Section */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Administração</h4>
                        {renderPermissionTable(ADMIN_MODULES, s)}
                      </div>

                      {/* Operational Section */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Operacional</h4>
                        {renderPermissionTable(OPERATIONAL_MODULES, s)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
