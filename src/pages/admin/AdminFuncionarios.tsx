import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ShieldCheck, ChevronDown, ChevronRight, Pencil, Save, X, Briefcase, KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const FUNCTION_TITLES = [
  "Gerente Administrativo",
  "Coordenador de Vendas",
  "Analista Financeiro",
  "Assistente Administrativo",
  "Gerente Comercial",
  "Suporte Técnico",
  "Marketing",
  "Outro",
];

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
  function_title: string;
}

export default function AdminFuncionarios() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFunction, setNewFunction] = useState("");
  const [newCustomFunction, setNewCustomFunction] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingFunction, setEditingFunction] = useState<string | null>(null);
  const [editFunctionValue, setEditFunctionValue] = useState("");
  const [resetPasswordUser, setResetPasswordUser] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !resetPassword || resetPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setResettingPassword(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("reset-password", {
      body: { target_user_id: resetPasswordUser, new_password: resetPassword },
    });
    if (res.error || res.data?.error) {
      toast({ title: "Erro", description: res.data?.error || res.error?.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      setResetPasswordUser(null);
      setResetPassword("");
    }
    setResettingPassword(false);
  };

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
        function_title: (permRow as any)?.function_title || "",
      };
    });

    setStaff(staffList);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleCreate = async () => {
    if (!newEmail || !newName || !newPassword) return;
    setCreating(true);

    const finalFunction = newFunction === "Outro" ? newCustomFunction : newFunction;

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
      await supabase.from("staff_permissions").insert({
        user_id: data.user.id,
        permissions: DEFAULT_PERMISSIONS,
        function_title: finalFunction,
      } as any);
    }

    toast({ title: "Funcionário criado!" });
    setNewEmail(""); setNewName(""); setNewPassword(""); setNewFunction(""); setNewCustomFunction("");
    setDialogOpen(false); setCreating(false);
    fetchStaff();
  };

  const updateFunctionTitle = async (userId: string, title: string) => {
    setStaff(prev => prev.map(s => s.user_id === userId ? { ...s, function_title: title } : s));
    await supabase.from("staff_permissions").update({ function_title: title } as any).eq("user_id", userId);
    setEditingFunction(null);
    toast({ title: "Função atualizada!" });
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

  const countActivePerms = (perms: PermissionsMap) => {
    let total = 0;
    Object.values(perms).forEach(mod => {
      Object.values(mod).forEach(v => { if (v) total++; });
    });
    return total;
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
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Criar Funcionário</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome completo" value={newName} onChange={e => setNewName(e.target.value)} />
                <Input type="email" placeholder="E-mail" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                <Input type="password" placeholder="Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Função</label>
                  <Select value={newFunction} onValueChange={setNewFunction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNCTION_TITLES.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newFunction === "Outro" && (
                    <Input
                      placeholder="Digite a função"
                      value={newCustomFunction}
                      onChange={e => setNewCustomFunction(e.target.value)}
                    />
                  )}
                </div>

                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Criando..." : "Criar Funcionário"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">Nenhum funcionário cadastrado</p>
            <p className="text-sm">Clique em "Novo Funcionário" para adicionar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {staff.map(s => {
              const isExpanded = expandedUser === s.user_id;
              const activePerms = countActivePerms(s.permissions);
              const isEditingFn = editingFunction === s.user_id;

              return (
                <div key={s.user_id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => setExpandedUser(isExpanded ? null : s.user_id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">
                          {(s.profile?.full_name || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{s.profile?.full_name || "Sem nome"}</h3>
                        <p className="text-sm text-muted-foreground">{s.profile?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {s.function_title ? (
                            <Badge variant="secondary" className="text-xs">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {s.function_title}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Sem função definida
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {activePerms} permissões ativas
                          </Badge>
                        </div>
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
                        onClick={(e) => { e.stopPropagation(); setResetPasswordUser(s.user_id); setResetPassword(""); }}
                        title="Alterar senha"
                      >
                        <KeyRound className="w-4 h-4" />
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
                    <div className="px-5 pb-5 space-y-5">
                      {/* Function Title Section */}
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-foreground">Função / Cargo</span>
                          </div>
                          {!isEditingFn && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingFunction(s.user_id); setEditFunctionValue(s.function_title); }}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Editar
                            </Button>
                          )}
                        </div>
                        {isEditingFn ? (
                          <div className="mt-3 flex items-center gap-2">
                            <Select value={FUNCTION_TITLES.includes(editFunctionValue) ? editFunctionValue : "Outro"} onValueChange={(v) => {
                              if (v !== "Outro") setEditFunctionValue(v);
                              else setEditFunctionValue("");
                            }}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecione a função" />
                              </SelectTrigger>
                              <SelectContent>
                                {FUNCTION_TITLES.map(f => (
                                  <SelectItem key={f} value={f}>{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {(!FUNCTION_TITLES.includes(editFunctionValue) || editFunctionValue === "") && (
                              <Input
                                className="flex-1"
                                placeholder="Digite a função"
                                value={editFunctionValue}
                                onChange={e => setEditFunctionValue(e.target.value)}
                              />
                            )}
                            <Button size="sm" onClick={() => updateFunctionTitle(s.user_id, editFunctionValue)}>
                              <Save className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingFunction(null)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {s.function_title || "Nenhuma função definida — clique em editar para definir."}
                          </p>
                        )}
                      </div>

                      {/* Admin Section */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Módulos de Administração
                        </h4>
                        {renderPermissionTable(ADMIN_MODULES, s)}
                      </div>

                      {/* Operational Section */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Módulos Operacionais
                        </h4>
                        {renderPermissionTable(OPERATIONAL_MODULES, s)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reset Password Dialog */}
        <Dialog open={!!resetPasswordUser} onOpenChange={(open) => { if (!open) setResetPasswordUser(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Alterar Senha do Funcionário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Nova senha (mín. 6 caracteres)"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
              />
              <Button onClick={handleResetPassword} disabled={resettingPassword} className="w-full">
                {resettingPassword ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
