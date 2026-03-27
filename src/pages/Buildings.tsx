import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import {
  Building,
  Plus,
  Search,
  MapPin,
  Layers,
  X,
  Save,
  Edit,
  Trash2,
  Camera,
  Home,
  Map,
} from "lucide-react";
import { InfraMediaModal } from "@/components/InfraMediaModal";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/mockData";

interface BuildingData {
  id: string;
  name: string;
  address: string;
  city: string;
  floors: number;
  units: number;
  builder: string;
  yearBuilt: string;
  status: "Em construção" | "Pronto" | "Lançamento";
  image: string;
  lat: number;
  lng: number;
}

const initialBuildings: BuildingData[] = [
  {
    id: "1",
    name: "Edifício Aurora",
    address: "Av. Paulista, 1500",
    city: "São Paulo",
    floors: 25,
    units: 120,
    builder: "Construtora ABC",
    yearBuilt: "2024",
    status: "Pronto",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop",
    lat: -23.5629,
    lng: -46.6544,
  },
  {
    id: "2",
    name: "Torre Horizonte",
    address: "Rua Augusta, 2200",
    city: "São Paulo",
    floors: 32,
    units: 180,
    builder: "Incorporadora XYZ",
    yearBuilt: "2025",
    status: "Em construção",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
    lat: -23.5558,
    lng: -46.6621,
  },
  {
    id: "3",
    name: "Residencial Parque Verde",
    address: "Al. Santos, 800",
    city: "São Paulo",
    floors: 18,
    units: 72,
    builder: "Green Build",
    yearBuilt: "2026",
    status: "Lançamento",
    image: "https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=400&h=300&fit=crop",
    lat: -23.5672,
    lng: -46.6483,
  },
];

const statusColors: Record<string, string> = {
  "Em construção": "bg-warning/10 text-warning border-warning/30",
  Pronto: "bg-success/10 text-success border-success/30",
  Lançamento: "bg-info/10 text-info border-info/30",
};

const emptyForm: Omit<BuildingData, "id"> = {
  name: "",
  address: "",
  city: "",
  floors: 0,
  units: 0,
  builder: "",
  yearBuilt: "",
  status: "Lançamento",
  image: "",
  lat: -23.55,
  lng: -46.63,
};

export default function Buildings() {
  const [buildings, setBuildings] = useState<BuildingData[]>(initialBuildings);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [mediaBuilding, setMediaBuilding] = useState<BuildingData | null>(null);
  const navigate = useNavigate();

  const filtered = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!form.name || !form.address) return;
    if (editingId) {
      setBuildings((prev) =>
        prev.map((b) => (b.id === editingId ? { ...b, ...form } : b))
      );
    } else {
      setBuildings((prev) => [
        ...prev,
        { ...form, id: Date.now().toString() },
      ]);
    }
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (building: BuildingData) => {
    setForm({ ...building });
    setEditingId(building.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setBuildings((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edifícios</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {buildings.length} edifícios cadastrados
            </p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start"
          >
            <Plus className="w-4 h-4" />
            Novo Edifício
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar edifício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg animate-scale-in">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-bold text-card-foreground">
                  {editingId ? "Editar Edifício" : "Novo Edifício"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do Edifício *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Endereço *</label>
                    <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Construtora</label>
                    <input value={form.builder} onChange={(e) => setForm({ ...form, builder: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Andares</label>
                    <input type="number" value={form.floors} onChange={(e) => setForm({ ...form, floors: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Unidades</label>
                    <input type="number" value={form.units} onChange={(e) => setForm({ ...form, units: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Ano</label>
                    <input value={form.yearBuilt} onChange={(e) => setForm({ ...form, yearBuilt: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BuildingData["status"] })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>Lançamento</option>
                      <option>Em construção</option>
                      <option>Pronto</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">URL da Imagem</label>
                    <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Latitude</label>
                    <input type="number" step="0.0001" value={form.lat} onChange={(e) => setForm({ ...form, lat: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Longitude</label>
                    <input type="number" step="0.0001" value={form.lng} onChange={(e) => setForm({ ...form, lng: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-border">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={handleSubmit} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Save className="w-4 h-4" />
                  {editingId ? "Salvar" : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((building) => (
            <div key={building.id} className="elevated-card rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate(`/edificios/${building.id}`)}>
              <div className="relative h-44 overflow-hidden">
                <img
                  src={building.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"}
                  alt={building.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold border", statusColors[building.status])}>
                  {building.status}
                </span>
                <div className="absolute top-3 right-3 flex gap-1.5">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(building); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                    <Edit className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(building.id); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-card-foreground text-sm">{building.name}</h3>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{building.address}, {building.city}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {building.floors} andares</span>
                  <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {building.units} unid.</span>
                  <span>{building.builder}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/edificios/${building.id}`); }}
                    className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-semibold hover:bg-emerald-500/25 transition-colors border border-emerald-500/30"
                  >
                    <Home className="w-3.5 h-3.5" /> Imóveis à Venda
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMediaBuilding(building); }}
                    className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-gradient-to-r from-foreground/10 to-foreground/5 text-foreground text-xs font-semibold hover:from-foreground/20 hover:to-foreground/10 transition-all border border-foreground/20"
                  >
                    <Camera className="w-3.5 h-3.5" /> Fotos e Vídeos
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <InfraMediaModal
          open={!!mediaBuilding}
          onClose={() => setMediaBuilding(null)}
          title={mediaBuilding?.name || ""}
          media={[]}
        />

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum edifício encontrado</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
