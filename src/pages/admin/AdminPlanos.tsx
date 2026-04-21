import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const availableModules = [
  { key: "imoveis", label: "Imóveis" },
  { key: "edificios", label: "Edifícios" },
  { key: "condominios", label: "Condomínios" },
  { key: "site", label: "Site" },
  { key: "fotos", label: "Fotos da Cidade" },
  { key: "avaliacoes", label: "Avaliações" },
  { key: "financeiro", label: "Financeiro" },
  { key: "tabelas", label: "Tabelas" },
  { key: "contratos", label: "Contratos" },
  { key: "videomaker", label: "Material Extra" },
  { key: "corretores", label: "Corretores" },
];

interface PlanForm {
  name: string;
  price: string;
  billing_cycle: string;
  trial_days: string;
  max_properties: string;
  max_brokers: string;
  modules: string[];
  plan_type: string;
  is_free: boolean;
}

const emptyForm: PlanForm = {
  name: "", price: "", billing_cycle: "monthly", trial_days: "7",
  max_properties: "50", max_brokers: "5", modules: [], plan_type: "corretor", is_free: false,
};

export default function AdminPlanos() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchPlans = async () => {
    const { data } = await supabase.from("plans").select("*").order("created_at");
    setPlans(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleSave = async () => {
    if (!form.name || form.price === "") return;
    setSaving(true);

    // Validação: só 1 plano free por plan_type
    if (form.is_free) {
      const conflict = plans.find(p => p.is_free && p.plan_type === form.plan_type && p.id !== editId);
      if (conflict) {
        toast({ title: "Já existe um plano Free para este tipo", description: `Conflito com: ${conflict.name}`, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    const payload = {
      name: form.name,
      price: form.is_free ? 0 : parseFloat(form.price),
      billing_cycle: form.billing_cycle as any,
      trial_days: form.is_free ? 0 : parseInt(form.trial_days),
      max_properties: parseInt(form.max_properties),
      max_brokers: form.plan_type === "corretor" ? 1 : parseInt(form.max_brokers),
      modules: form.modules,
      plan_type: form.plan_type,
      is_free: form.is_free,
    };

    if (editId) {
      await supabase.from("plans").update(payload).eq("id", editId);
      toast({ title: "Plano atualizado!" });
    } else {
      await supabase.from("plans").insert(payload as any);
      toast({ title: "Plano criado!" });
    }

    setDialogOpen(false);
    setEditId(null);
    setForm(emptyForm);
    setSaving(false);
    fetchPlans();
  };

  const openEdit = (plan: any) => {
    setEditId(plan.id);
    setForm({
      name: plan.name,
      price: String(plan.price),
      billing_cycle: plan.billing_cycle,
      trial_days: String(plan.trial_days),
      max_properties: String(plan.max_properties),
      max_brokers: String(plan.max_brokers),
      modules: Array.isArray(plan.modules) ? plan.modules : [],
      plan_type: plan.plan_type || "corretor",
      is_free: !!plan.is_free,
    });
    setDialogOpen(true);
  };

  const toggleModule = (key: string) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.includes(key) ? prev.modules.filter(m => m !== key) : [...prev.modules, key],
    }));
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("plans").update({ is_active: !current }).eq("id", id);
    fetchPlans();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo Plano</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                <Input placeholder="Nome do plano" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.plan_type} onValueChange={v => setForm(p => ({ ...p, plan_type: v, max_brokers: v === "corretor" ? "1" : p.max_brokers }))}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corretor">Corretor</SelectItem>
                      <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.billing_cycle} onValueChange={v => setForm(p => ({ ...p, billing_cycle: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Plano gratuito (Free)</p>
                    <p className="text-xs text-muted-foreground">Libera acesso imediato sem pagamento</p>
                  </div>
                  <Switch checked={form.is_free} onCheckedChange={v => setForm(p => ({ ...p, is_free: v, price: v ? "0" : p.price, trial_days: v ? "0" : p.trial_days }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Preço (R$)" value={form.price} disabled={form.is_free} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                  <Input type="number" placeholder="Dias trial" value={form.trial_days} disabled={form.is_free} onChange={e => setForm(p => ({ ...p, trial_days: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Máx imóveis" value={form.max_properties} onChange={e => setForm(p => ({ ...p, max_properties: e.target.value }))} />
                  {form.plan_type === "imobiliaria" && (
                    <Input type="number" placeholder="Máx corretores" value={form.max_brokers} onChange={e => setForm(p => ({ ...p, max_brokers: e.target.value }))} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Módulos inclusos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableModules.map(m => (
                      <label key={m.key} className="flex items-center gap-2 text-sm">
                        <Switch checked={form.modules.includes(m.key)} onCheckedChange={() => toggleModule(m.key)} />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? "Salvando..." : editId ? "Atualizar" : "Criar Plano"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : plans.length === 0 ? (
          <div className="text-muted-foreground">Nenhum plano cadastrado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div key={plan.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{plan.name}</h3>
                  <div className="flex items-center gap-1 flex-wrap">
                    {plan.is_free && (
                      <Badge className="bg-accent text-accent-foreground">FREE</Badge>
                    )}
                    <Badge variant="outline" className={plan.plan_type === "imobiliaria" ? "border-blue-400 text-blue-600" : "border-emerald-400 text-emerald-600"}>
                      {plan.plan_type === "imobiliaria" ? "Imobiliária" : "Corretor"}
                    </Badge>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
                <p className="text-2xl font-bold text-accent">R$ {plan.price}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.billing_cycle === "monthly" ? "Mensal" : plan.billing_cycle === "quarterly" ? "Trimestral" : "Anual"}
                  {" · "}{plan.trial_days} dias trial · {plan.max_properties} imóveis · {plan.max_brokers} corretores
                </p>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(plan.modules) ? plan.modules : []).map((m: string) => (
                    <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                    <Pencil className="w-3 h-3 mr-1" />Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(plan.id, plan.is_active)}>
                    {plan.is_active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
