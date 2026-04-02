import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { QuickPick } from "@/components/QuickPick";
import { CepAutoFill, type AddressData } from "@/components/CepAutoFill";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Landmark, Plus, Search, MapPin, X, Save, Edit, Trash2, Loader2, Calendar, Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const statusOptions = ["Lançamento", "Em construção", "Pronto", "Em vendas"];
const tipoOptions = ["Residencial", "Comercial", "Misto", "Loteamento"];
const allInfra = ["Piscina", "Academia", "Salão de Festas", "Playground", "Quadra", "Churrasqueira", "Segurança 24h", "Portaria", "Área Verde", "Coworking"];

const statusColors: Record<string, string> = {
  "Em construção": "bg-warning/10 text-warning border-warning/30",
  Pronto: "bg-success/10 text-success border-success/30",
  Lançamento: "bg-info/10 text-info border-info/30",
  "Em vendas": "bg-accent/10 text-accent border-accent/30",
};

interface EmpreendimentoRow {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  construtora: string;
  tipo: string;
  status: string;
  total_unidades: number;
  previsao_entrega: string;
  infraestrutura: string[];
  descricao: string;
  imagem_url: string;
  latitude: number;
  longitude: number;
  user_id: string;
}

const emptyForm = {
  nome: "", endereco: "", cidade: "", construtora: "", tipo: "Residencial", status: "Lançamento",
  total_unidades: 0, previsao_entrega: "", infraestrutura: [] as string[], descricao: "",
  imagem_url: "", latitude: "", longitude: "",
};

export default function Empreendimentos() {
  const [items, setItems] = useState<EmpreendimentoRow[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from("empreendimentos").select("*").order("nome");
    if (data) setItems(data as any);
    setLoading(false);
  };

  const filtered = items.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    (e.cidade || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleInfra = (item: string) => {
    setForm(f => ({
      ...f,
      infraestrutura: f.infraestrutura.includes(item) ? f.infraestrutura.filter(x => x !== item) : [...f.infraestrutura, item],
    }));
  };

  const handleSubmit = async () => {
    if (!form.nome || !user) return;
    setSaving(true);
    const payload = {
      nome: form.nome, endereco: form.endereco, cidade: form.cidade, construtora: form.construtora,
      tipo: form.tipo, status: form.status, total_unidades: form.total_unidades,
      previsao_entrega: form.previsao_entrega, infraestrutura: form.infraestrutura,
      descricao: form.descricao, imagem_url: form.imagem_url,
      latitude: parseFloat(form.latitude) || 0, longitude: parseFloat(form.longitude) || 0,
    };
    if (editingId) {
      await supabase.from("empreendimentos").update(payload).eq("id", editingId);
      toast({ title: "Empreendimento atualizado ✅" });
    } else {
      await supabase.from("empreendimentos").insert([{ ...payload, user_id: user.id }]);
      toast({ title: "Empreendimento cadastrado ✅" });
    }
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
    loadData();
  };

  const handleEdit = (e: EmpreendimentoRow) => {
    setForm({
      nome: e.nome, endereco: e.endereco || "", cidade: e.cidade || "", construtora: e.construtora || "",
      tipo: e.tipo || "Residencial", status: e.status || "Lançamento",
      total_unidades: e.total_unidades || 0, previsao_entrega: e.previsao_entrega || "",
      infraestrutura: e.infraestrutura || [], descricao: e.descricao || "",
      imagem_url: e.imagem_url || "",
      latitude: e.latitude ? String(e.latitude) : "", longitude: e.longitude ? String(e.longitude) : "",
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("empreendimentos").delete().eq("id", id);
    toast({ title: "Empreendimento excluído" });
    loadData();
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Empreendimentos</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} empreendimentos cadastrados</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
            <Plus className="w-4 h-4" /> Novo Empreendimento
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar empreendimento..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="text-lg font-bold text-card-foreground">{editingId ? "Editar Empreendimento" : "Novo Empreendimento"}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                  <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Endereço</label>
                    <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Cidade</label>
                    <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Construtora</label>
                  <input value={form.construtora} onChange={(e) => setForm({ ...form, construtora: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>

                <QuickPick label="Tipo" options={tipoOptions} value={form.tipo} onChange={(v) => setForm({ ...form, tipo: String(v) })} />
                <QuickPick label="Status" options={statusOptions} value={form.status} onChange={(v) => setForm({ ...form, status: String(v) })} />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Total de Unidades</label>
                    <input type="number" value={form.total_unidades} onChange={(e) => setForm({ ...form, total_unidades: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Previsão de Entrega</label>
                    <input value={form.previsao_entrega} onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })} placeholder="Ex: Dez/2026" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                  <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">URL da Imagem</label>
                  <input value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Latitude</label>
                    <input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Longitude</label>
                    <input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Infraestrutura</label>
                  <div className="flex flex-wrap gap-2">
                    {allInfra.map(a => (
                      <button key={a} type="button" onClick={() => toggleInfra(a)} className={cn("px-2.5 py-1 rounded-md text-xs font-medium border transition-all", form.infraestrutura.includes(a) ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted")}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-border">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? "Salvar" : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((emp) => (
              <div key={emp.id} className="elevated-card rounded-xl overflow-hidden group">
                <div className="relative h-44 overflow-hidden">
                  <img src={emp.imagem_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"} alt={emp.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold border", statusColors[emp.status] || "bg-muted text-muted-foreground")}>{emp.status}</span>
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button onClick={() => handleEdit(emp)} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"><Edit className="w-3.5 h-3.5 text-foreground" /></button>
                    <button onClick={() => handleDelete(emp.id)} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-colors"><Trash2 className="w-3.5 h-3.5 text-foreground" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-card-foreground text-sm">{emp.nome}</h3>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{emp.endereco}, {emp.cidade}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {emp.total_unidades} unid.</span>
                    <span>{emp.tipo}</span>
                    {emp.construtora && <span>{emp.construtora}</span>}
                    {emp.previsao_entrega && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {emp.previsao_entrega}</span>}
                  </div>
                  {emp.infraestrutura && emp.infraestrutura.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {emp.infraestrutura.slice(0, 4).map(i => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{i}</span>
                      ))}
                      {emp.infraestrutura.length > 4 && <span className="text-[10px] text-muted-foreground">+{emp.infraestrutura.length - 4}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Landmark className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum empreendimento encontrado</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
