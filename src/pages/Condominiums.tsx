import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import {
  Fence,
  Plus,
  Search,
  MapPin,
  Home,
  Users,
  Car,
  Trees,
  Dumbbell,
  ShieldCheck,
  X,
  Save,
  Edit,
  Trash2,
  Camera,
} from "lucide-react";
import { InfraMediaModal } from "@/components/InfraMediaModal";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/mockData";

interface Condominium {
  id: string;
  name: string;
  address: string;
  city: string;
  totalUnits: number;
  availableUnits: number;
  monthlyFee: number;
  amenities: string[];
  type: "Horizontal" | "Vertical" | "Misto";
  image: string;
  lat: number;
  lng: number;
}

const initialCondominiums: Condominium[] = [
  {
    id: "1",
    name: "Alphaville Residencial",
    address: "Al. Araguaia, 1500",
    city: "Barueri",
    totalUnits: 350,
    availableUnits: 45,
    monthlyFee: 1800,
    amenities: ["Piscina", "Academia", "Segurança 24h", "Playground"],
    type: "Horizontal",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    lat: -23.5013,
    lng: -46.8753,
  },
  {
    id: "2",
    name: "Condomínio Parque das Flores",
    address: "Rua das Orquídeas, 200",
    city: "São Paulo",
    totalUnits: 180,
    availableUnits: 12,
    monthlyFee: 2500,
    amenities: ["Piscina", "Salão de Festas", "Quadra", "Segurança 24h"],
    type: "Vertical",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    lat: -23.5505,
    lng: -46.6333,
  },
  {
    id: "3",
    name: "Vila Verde Condomínio",
    address: "Estrada Municipal, 3000",
    city: "Cotia",
    totalUnits: 90,
    availableUnits: 28,
    monthlyFee: 950,
    amenities: ["Área Verde", "Portaria", "Churrasqueira"],
    type: "Horizontal",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    lat: -23.6043,
    lng: -46.9190,
  },
];

const typeColors: Record<string, string> = {
  Horizontal: "bg-success/10 text-success border-success/30",
  Vertical: "bg-info/10 text-info border-info/30",
  Misto: "bg-warning/10 text-warning border-warning/30",
};

const amenityIcons: Record<string, typeof Dumbbell> = {
  Piscina: Trees,
  Academia: Dumbbell,
  "Segurança 24h": ShieldCheck,
  Playground: Home,
  Portaria: ShieldCheck,
  "Salão de Festas": Users,
  Quadra: Dumbbell,
  Churrasqueira: Home,
  "Área Verde": Trees,
};

const emptyForm = {
  name: "",
  address: "",
  city: "",
  totalUnits: 0,
  availableUnits: 0,
  monthlyFee: 0,
  amenities: [] as string[],
  type: "Vertical" as Condominium["type"],
  image: "",
  lat: -23.55,
  lng: -46.63,
};

const allAmenities = ["Piscina", "Academia", "Segurança 24h", "Playground", "Portaria", "Salão de Festas", "Quadra", "Churrasqueira", "Área Verde"];

export default function Condominiums() {
  const [condos, setCondos] = useState<Condominium[]>(initialCondominiums);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [mediaCondo, setMediaCondo] = useState<Condominium | null>(null);
  const navigate = useNavigate();

  const filtered = condos.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.address) return;
    if (editingId) {
      setCondos((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...form } : c)));
    } else {
      setCondos((prev) => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (condo: Condominium) => {
    setForm({ ...condo });
    setEditingId(condo.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => setCondos((prev) => prev.filter((c) => c.id !== id));

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
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

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="text-lg font-bold text-card-foreground">{editingId ? "Editar Condomínio" : "Novo Condomínio"}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome *</label>
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
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Condominium["type"] })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>Vertical</option>
                      <option>Horizontal</option>
                      <option>Misto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Total de Unidades</label>
                    <input type="number" value={form.totalUnits} onChange={(e) => setForm({ ...form, totalUnits: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Unidades Disponíveis</label>
                    <input type="number" value={form.availableUnits} onChange={(e) => setForm({ ...form, availableUnits: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Taxa Condominial (R$)</label>
                    <input type="number" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: +e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">URL da Imagem</label>
                    <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Comodidades</label>
                    <div className="flex flex-wrap gap-2">
                      {allAmenities.map((a) => (
                        <button key={a} onClick={() => toggleAmenity(a)} className={cn("px-2.5 py-1 rounded-md text-xs font-medium border transition-all", form.amenities.includes(a) ? "bg-accent/10 text-accent border-accent/30" : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted")}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-border">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={handleSubmit} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Save className="w-4 h-4" /> {editingId ? "Salvar" : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((condo) => (
            <div key={condo.id} className="elevated-card rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate(`/condominios/${condo.id}`)}>
              <div className="relative h-44 overflow-hidden">
                <img src={condo.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"} alt={condo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold border", typeColors[condo.type])}>{condo.type}</span>
                <div className="absolute top-3 right-3 flex gap-1.5">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(condo); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"><Edit className="w-3.5 h-3.5 text-foreground" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(condo.id); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-colors"><Trash2 className="w-3.5 h-3.5 text-foreground" /></button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-card-foreground text-sm">{condo.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{condo.address}, {condo.city}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-accent">{formatCurrency(condo.monthlyFee)}<span className="text-xs text-muted-foreground font-normal">/mês</span></p>
                  <span className="text-xs text-success font-semibold">{condo.availableUnits} disponíveis</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                  {condo.amenities.map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{a}</span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/condominios/${condo.id}`); }}
                    className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-semibold hover:bg-emerald-500/25 transition-colors border border-emerald-500/30"
                  >
                    <Home className="w-3.5 h-3.5" /> Imóveis à Venda
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMediaCondo(condo); }}
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
          open={!!mediaCondo}
          onClose={() => setMediaCondo(null)}
          title={mediaCondo?.name || ""}
          media={[]}
        />

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Fence className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum condomínio encontrado</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
