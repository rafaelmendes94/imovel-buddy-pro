import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, Briefcase, ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

// ── Single source of truth for all modules ──
const ADMIN_MODULES = [
  { key: "dashboard_admin", label: "Dashboard Admin" },
  { key: "funcionarios", label: "Funcionários" },
  { key: "clientes", label: "Clientes" },
  { key: "planos", label: "Planos" },
] as const;

const OPERATIONAL_MODULES = [
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
] as const;

const ALL_MODULES = [...ADMIN_MODULES, ...OPERATIONAL_MODULES];

type ActionKey = "view" | "create" | "edit" | "delete";
type ModulePerms = Record<ActionKey, boolean>;
type PermissionsMap = Record<string, ModulePerms>;

const ACTION_LABELS: { key: ActionKey; label: string }[] = [
  { key: "view", label: "Ver" },
  { key: "create", label: "Novo" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Excluir" },
];

/** Ensures every module has an entry — auto-maps new modules */
function ensureAllModules(perms: PermissionsMap): PermissionsMap {
  const result = { ...perms };
  for (const mod of ALL_MODULES) {
    if (!result[mod.key]) {
      result[mod.key] = { view: false, create: false, edit: false, delete: false };
    }
  }
  return result;
}

function buildEmptyPerms(): PermissionsMap {
  return ensureAllModules({});
}

function countActive(perms: PermissionsMap): number {
  let n = 0;
  Object.values(perms).forEach(m => Object.values(m).forEach(v => { if (v) n++; }));
  return n;
}

interface JobRole {
  id: string;
  name: string;
  permissions: PermissionsMap;
}

export default function AdminCargos() {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const { toast } = useToast();

  const fetchRoles = async () => {
    const { data } = await supabase.from("job_roles").select("*").order("name");
    if (data) {
      setRoles(data.map((r: any) => ({
        id: r.id,
        name: r.name,
        permissions: ensureAllModules((r.permissions as PermissionsMap) || {}),
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const perms = buildEmptyPerms();
    const { error } = await supabase.from("job_roles").insert({ name: trimmed, permissions: perms } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cargo criado!" });
    setNewName("");
    setDialogOpen(false);
    fetchRoles();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("job_roles").delete().eq("id", id);
    toast({ title: "Cargo removido" });
    fetchRoles();
  };

  const handleSaveName = async (id: string) => {
    const trimmed = editNameValue.trim();
    if (!trimmed) return;
    await supabase.from("job_roles").update({ name: trimmed } as any).eq("id", id);
    setEditingNameId(null);
    toast({ title: "Nome atualizado!" });
    fetchRoles();
  };

  const updatePermission = async (id: string, moduleKey: string, action: ActionKey, value: boolean) => {
    const role = roles.find(r => r.id === id);
    if (!role) return;
    const updated = { ...role.permissions };
    updated[moduleKey] = { ...updated[moduleKey], [action]: value };
    setRoles(prev => prev.map(r => r.id === id ? { ...r, permissions: updated } : r));
    await supabase.from("job_roles").update({ permissions: updated } as any).eq("id", id);
  };

  const toggleModuleAll = async (id: string, moduleKey: string) => {
    const role = roles.find(r => r.id === id);
    if (!role) return;
    const mod = role.permissions[moduleKey];
    const allOn = mod.view && mod.create && mod.edit && mod.delete;
    const val = !allOn;
    const updated = { ...role.permissions };
    updated[moduleKey] = { view: val, create: val, edit: val, delete: val };
    setRoles(prev => prev.map(r => r.id === id ? { ...r, permissions: updated } : r));
    await supabase.from("job_roles").update({ permissions: updated } as any).eq("id", id);
  };

  const toggleAll = async (id: string) => {
    const role = roles.find(r => r.id === id);
    if (!role) return;
    const allOn = ALL_MODULES.every(m => {
      const p = role.permissions[m.key];
      return p && p.view && p.create && p.edit && p.delete;
    });
    const val = !allOn;
    const updated: PermissionsMap = {};
    ALL_MODULES.forEach(m => { updated[m.key] = { view: val, create: val, edit: val, delete: val }; });
    setRoles(prev => prev.map(r => r.id === id ? { ...r, permissions: updated } : r));
    await supabase.from("job_roles").update({ permissions: updated } as any).eq("id", id);
  };

  const renderTable = (modules: readonly { key: string; label: string }[], role: JobRole) => (
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
            const perms = role.permissions[mod.key] || { view: false, create: false, edit: false, delete: false };
            const allChecked = perms.view && perms.create && perms.edit && perms.delete;
            return (
              <tr key={mod.key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-2.5 px-3 text-foreground font-medium">{mod.label}</td>
                {ACTION_LABELS.map(a => (
                  <td key={a.key} className="text-center py-2.5 px-2">
                    <Checkbox
                      checked={perms[a.key]}
                      onCheckedChange={(v) => updatePermission(role.id, mod.key, a.key, !!v)}
                    />
                  </td>
                ))}
                <td className="text-center py-2.5 px-2">
                  <Switch
                    checked={allChecked}
                    onCheckedChange={() => toggleModuleAll(role.id, mod.key)}
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
          <h1 className="text-2xl font-bold text-foreground">Cargos e Funções</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo Cargo</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Criar Cargo</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Nome do cargo ou função"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                />
                <Button onClick={handleAdd} className="w-full">Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">Nenhum cargo cadastrado</p>
            <p className="text-sm">Clique em "Novo Cargo" para adicionar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map(role => {
              const isExpanded = expandedId === role.id;
              const active = countActive(role.permissions);
              const isEditingName = editingNameId === role.id;

              return (
                <div key={role.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : role.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{role.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {active} permissões ativas
                          </Badge>
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {ALL_MODULES.length} módulos
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); toggleAll(role.id); }}
                        className="text-xs"
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        Liberar Tudo
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNameId(role.id);
                          setEditNameValue(role.name);
                          setExpandedId(role.id);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleDelete(role.id); }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-5">
                      {/* Editar Nome */}
                      {isEditingName && (
                        <div className="bg-muted/30 rounded-lg p-4">
                          <span className="text-sm font-semibold text-foreground mb-2 block">Renomear Cargo</span>
                          <div className="flex items-center gap-2">
                            <Input
                              value={editNameValue}
                              onChange={e => setEditNameValue(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && handleSaveName(role.id)}
                              className="flex-1"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => handleSaveName(role.id)}>
                              <Save className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingNameId(null)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Admin Modules */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Módulos de Administração
                        </h4>
                        {renderTable(ADMIN_MODULES, role)}
                      </div>

                      {/* Operational Modules */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Módulos Operacionais
                        </h4>
                        {renderTable(OPERATIONAL_MODULES, role)}
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
