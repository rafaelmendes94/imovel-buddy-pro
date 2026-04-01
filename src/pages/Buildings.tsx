import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { SmartLayout } from "@/components/SmartLayout";
import {
  Building, Plus, Search, MapPin, Layers, X, Save, Edit, Trash2, Camera, Home, Map, Loader2,
} from "lucide-react";
import { InfraMediaModal } from "@/components/InfraMediaModal";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface BuildingData {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  andares: number;
  total_unidades: number;
  construtora: string;
  ano_construcao: string;
  status: string;
  imagem_url: string | null;
  latitude: number;
  longitude: number;
  infraestrutura: string[];
  user_id: string;
  imoveis_count?: number;
}

const statusColors: Record<string, string> = {
  "Em construção": "bg-warning/10 text-warning border-warning/30",
  Pronto: "bg-success/10 text-success border-success/30",
  Lançamento: "bg-info/10 text-info border-info/30",
};

const emptyForm = {
  nome: "", endereco: "", cidade: "", andares: 0, total_unidades: 0,
  construtora: "", ano_construcao: "", status: "Lançamento",
  imagem_url: "", latitude: -23.55, longitude: -46.63, infraestrutura: [] as string[],
};

export default function Buildings() {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [mediaBuilding, setMediaBuilding] = useState<BuildingData | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBuildings = async (signal?: AbortSignal) => {
    setLoading(true);
    const [{ data, error }, { data: counts }] = await Promise.all([
      supabase.from("edificios").select("id,nome,endereco,cidade,andares,total_unidades,construtora,ano_construcao,status,imagem_url,latitude,longitude,infraestrutura,user_id").order("created_at", { ascending: false }),
      supabase.from("imoveis").select("edificio_id").not("edificio_id", "is", null),
    ]);
    if (signal?.aborted) return;
    if (!error && data) {
      const countMap: Record<string, number> = {};
      counts?.forEach((row: any) => { countMap[row.edificio_id] = (countMap[row.edificio_id] || 0) + 1; });
      setBuildings(data.map((b: any) => ({ ...b, imoveis_count: countMap[b.id] || 0 })));
    }
    setLoading(false);
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchBuildings(ac.signal);
    return () => ac.abort();
  }, []);

  const filtered = buildings.filter(
    (b) => b.nome.toLowerCase().includes(search.toLowerCase()) || b.endereco.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!form.nome || !form.endereco || !user) return;
    setSaving(true);
    try {
      const payload = { ...form, imagem_url: form.imagem_url || null, user_id: user.id };
      if (editingId) {
        const { user_id, ...updatePayload } = payload;
        const { error } = await supabase.from("edificios").update(updatePayload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Edifício atualizado! ✅" });
      } else {
        const { error } = await supabase.from("edificios").insert([payload]);
        if (error) throw error;
        toast({ title: "Edifício cadastrado! ✅" });
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      fetchBuildings();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleEdit = (b: BuildingData) => {
    setForm({
      nome: b.nome, endereco: b.endereco, cidade: b.cidade, andares: b.andares,
      total_unidades: b.total_unidades, construtora: b.construtora, ano_construcao: b.ano_construcao,
      status: b.status, imagem_url: b.imagem_url || "", latitude: b.latitude, longitude: b.longitude,
      infraestrutura: b.infraestrutura || [],
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("edificios").delete().eq("id", id);
    if (!error) { fetchBuildings(); toast({ title: "Edifício removido" }); }
  };

  return (
    <SmartLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edifícios</h1>
            <p className="text-sm text-muted-foreground mt-1">{buildings.length} edifícios cadastrados</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
            <Plus className="w-4 h-4" /> Novo Edifício
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar edifício..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="text-lg font-bold text-card-foreground">{editingId ? "Editar Edifício" : "Novo Edifício"}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do Edifício *</label>
                    <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Endereço *</label>
                    <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade</label>
                    <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Construtora</label>
                    <input value={form.construtora} onChange={(e) => setForm({ ...form, construtora: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Andares</label>
                    <input type="number" value={form.andares} onChange={(e) => setForm({ ...form, andares: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Unidades</label>
                    <input type="number" value={form.total_unidades} onChange={(e) => setForm({ ...form, total_unidades: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Ano</label>
                    <input value={form.ano_construcao} onChange={(e) => setForm({ ...form, ano_construcao: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>Lançamento</option><option>Em construção</option><option>Pronto</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">URL da Imagem</label>
                    <input value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Latitude</label>
                    <input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Longitude</label>
                    <input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((building) => (
              <div key={building.id} className="elevated-card rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate(`/edificios/${building.id}`)}>
                <div className="relative h-44 overflow-hidden">
                  <img src={building.imagem_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"} alt={building.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold border", statusColors[building.status] || "bg-muted text-muted-foreground")}>
                    {building.status}
                  </span>
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(building); }} className="w-7 h-7 rounded-md bg-card/90 flex items-center justify-center hover:bg-card transition-colors">
                      <Edit className="w-3.5 h-3.5 text-foreground" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(building.id); }} className="w-7 h-7 rounded-md bg-card/90 flex items-center justify-center hover:bg-destructive/90 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-foreground" />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-card-foreground text-sm">{building.nome}</h3>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{building.endereco}, {building.cidade}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {building.andares} andares</span>
                    <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {building.total_unidades} unid.</span>
                    <span>{building.construtora}</span>
                  </div>
                  {(building.imoveis_count || 0) > 0 && (
                    <p className="text-xs font-semibold text-accent">{building.imoveis_count} imóveis vinculados</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/edificios/${building.id}`); }}
                      className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-semibold hover:bg-emerald-500/25 transition-colors border border-emerald-500/30">
                      <Home className="w-3.5 h-3.5" /> Imóveis
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setMediaBuilding(building); }}
                      className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-gradient-to-r from-foreground/10 to-foreground/5 text-foreground text-xs font-semibold hover:from-foreground/20 hover:to-foreground/10 transition-all border border-foreground/20">
                      <Camera className="w-3.5 h-3.5" /> Mídia
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps?q=${building.latitude},${building.longitude}`, "_blank"); }}
                      className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-info/10 text-info text-xs font-semibold hover:bg-info/20 transition-colors border border-info/20">
                      <Map className="w-3.5 h-3.5" /> Mapa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <InfraMediaModal open={!!mediaBuilding} onClose={() => setMediaBuilding(null)} title={mediaBuilding?.nome || ""} media={[]} />

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum edifício encontrado</p>
          </div>
        )}
      </div>
    </SmartLayout>
  );
}
