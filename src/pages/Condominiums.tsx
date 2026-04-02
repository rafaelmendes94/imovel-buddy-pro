import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { QuickPick } from "@/components/QuickPick";
import { CepAutoFill, type AddressData } from "@/components/CepAutoFill";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { InfraMediaModal } from "@/components/InfraMediaModal";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/mockData";
import {
  Fence, Plus, Search, MapPin, Home, X, Save, Edit, Trash2, Camera, Map, Loader2,
} from "lucide-react";

const typeOptions = ["Vertical", "Horizontal", "Misto"];
const allAmenities = ["Piscina", "Academia", "Segurança 24h", "Playground", "Portaria", "Salão de Festas", "Quadra", "Churrasqueira", "Área Verde", "Sauna", "Spa"];

const typeColors: Record<string, string> = {
  Horizontal: "bg-success/10 text-success border-success/30",
  Vertical: "bg-info/10 text-info border-info/30",
  Misto: "bg-warning/10 text-warning border-warning/30",
};

interface CondoRow {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  total_unidades: number;
  unidades_disponiveis: number;
  taxa_condominio: number;
  amenidades: string[];
  tipo: string;
  imagem_url: string;
  latitude: number;
  longitude: number;
  user_id: string;
}

const emptyForm = {
  nome: "", endereco: "", cidade: "", total_unidades: 0, unidades_disponiveis: 0,
  taxa_condominio: 0, amenidades: [] as string[], tipo: "Vertical",
  imagem_url: "", latitude: "", longitude: "",
};

export default function Condominiums() {
  const [condos, setCondos] = useState<CondoRow[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [mediaCondo, setMediaCondo] = useState<CondoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from("condominios").select("*").order("nome");
    if (data) setCondos(data as any);
    setLoading(false);
  };

  const filtered = condos.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.endereco || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleAmenity = (a: string) => {
    setForm(f => ({
      ...f,
      amenidades: f.amenidades.includes(a) ? f.amenidades.filter(x => x !== a) : [...f.amenidades, a],
    }));
  };

  const handleSubmit = async () => {
    if (!form.nome || !user) return;
    setSaving(true);
    const payload = {
      nome: form.nome, endereco: form.endereco, cidade: form.cidade,
      total_unidades: form.total_unidades, unidades_disponiveis: form.unidades_disponiveis,
      taxa_condominio: form.taxa_condominio, amenidades: form.amenidades, tipo: form.tipo,
      imagem_url: form.imagem_url,
      latitude: parseFloat(form.latitude) || 0, longitude: parseFloat(form.longitude) || 0,
    };
    if (editingId) {
      await supabase.from("condominios").update(payload).eq("id", editingId);
      toast({ title: "Condomínio atualizado ✅" });
    } else {
      await supabase.from("condominios").insert([{ ...payload, user_id: user.id }]);
      toast({ title: "Condomínio cadastrado ✅" });
    }
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
    loadData();
  };

  const handleEdit = (c: CondoRow) => {
    setForm({
      nome: c.nome, endereco: c.endereco || "", cidade: c.cidade || "",
      total_unidades: c.total_unidades || 0, unidades_disponiveis: c.unidades_disponiveis || 0,
      taxa_condominio: c.taxa_condominio || 0, amenidades: c.amenidades || [],
      tipo: c.tipo || "Vertical", imagem_url: c.imagem_url || "",
      latitude: c.latitude ? String(c.latitude) : "", longitude: c.longitude ? String(c.longitude) : "",
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("condominios").delete().eq("id", id);
    toast({ title: "Condomínio excluído" });
    loadData();
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Condomínios</h1>
            <p className="text-sm text-muted-foreground mt-1">{condos.length} condomínios cadastrados</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
            <Plus className="w-4 h-4" /> Novo Condomínio
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar condomínio..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="text-lg font-bold text-card-foreground">{editingId ? "Editar Condomínio" : "Novo Condomínio"}</h2>
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

                <QuickPick label="Tipo" options={typeOptions} value={form.tipo} onChange={(v) => setForm({ ...form, tipo: String(v) })} />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Total Unidades</label>
                    <input type="number" value={form.total_unidades} onChange={(e) => setForm({ ...form, total_unidades: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Disponíveis</label>
                    <input type="number" value={form.unidades_disponiveis} onChange={(e) => setForm({ ...form, unidades_disponiveis: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Taxa Condominial (R$)</label>
                    <input type="number" value={form.taxa_condominio} onChange={(e) => setForm({ ...form, taxa_condominio: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
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
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Comodidades</label>
                  <div className="flex flex-wrap gap-2">
                    {allAmenities.map(a => (
                      <button key={a} type="button" onClick={() => toggleAmenity(a)} className={cn("px-2.5 py-1 rounded-md text-xs font-medium border transition-all", form.amenidades.includes(a) ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted")}>
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
            {filtered.map((condo) => (
              <div key={condo.id} className="elevated-card rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate(`/condominios/${condo.id}`)}>
                <div className="relative h-44 overflow-hidden">
                  <img src={condo.imagem_url || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"} alt={condo.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold border", typeColors[condo.tipo] || "bg-muted text-muted-foreground")}>{condo.tipo}</span>
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(condo); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"><Edit className="w-3.5 h-3.5 text-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(condo.id); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-colors"><Trash2 className="w-3.5 h-3.5 text-foreground" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-card-foreground text-sm">{condo.nome}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{condo.endereco}, {condo.cidade}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-accent">{formatCurrency(condo.taxa_condominio)}<span className="text-xs text-muted-foreground font-normal">/mês</span></p>
                    <span className="text-xs text-success font-semibold">{condo.unidades_disponiveis} disponíveis</span>
                  </div>
                  {condo.amenidades && condo.amenidades.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                      {condo.amenidades.map(a => (
                        <span key={a} className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/condominios/${condo.id}`); }} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-semibold hover:bg-emerald-500/25 transition-colors border border-emerald-500/30">
                      <Home className="w-3.5 h-3.5" /> Imóveis
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setMediaCondo(condo); }} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-gradient-to-r from-foreground/10 to-foreground/5 text-foreground text-xs font-semibold hover:from-foreground/20 hover:to-foreground/10 transition-all border border-foreground/20">
                      <Camera className="w-3.5 h-3.5" /> Mídia
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps?q=${condo.latitude},${condo.longitude}`, "_blank"); }} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-info/10 text-info text-xs font-semibold hover:bg-info/20 transition-colors border border-info/20">
                      <Map className="w-3.5 h-3.5" /> Mapa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <InfraMediaModal open={!!mediaCondo} onClose={() => setMediaCondo(null)} title={mediaCondo?.nome || ""} media={[]} />

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Fence className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum condomínio encontrado</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
