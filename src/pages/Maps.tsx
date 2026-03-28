import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { PropertyMap } from "@/components/PropertyMap";
import { properties, formatCurrency } from "@/data/mockData";
import {
  MapPin,
  Plus,
  Search,
  X,
  Save,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MapLocation {
  id: string;
  name: string;
  description: string;
  category: "Imóvel" | "Edifício" | "Condomínio" | "Ponto de Interesse";
  lat: number;
  lng: number;
}

const initialLocations: MapLocation[] = [
  { id: "1", name: "Escritório Central", description: "Sede da imobiliária — Capão da Canoa", category: "Ponto de Interesse", lat: -29.7456, lng: -50.1028 },
  { id: "2", name: "Shopping Capão", description: "Centro comercial", category: "Ponto de Interesse", lat: -29.7500, lng: -50.1080 },
  { id: "b1", name: "Edifício Aurora", description: "Av. Beira Mar, 1500 — Capão da Canoa", category: "Edifício", lat: -29.7460, lng: -50.1000 },
  { id: "b2", name: "Torre Horizonte", description: "Rua Sepé, 800 — Capão da Canoa", category: "Edifício", lat: -29.7490, lng: -50.1060 },
  { id: "b3", name: "Residencial Parque Verde", description: "Av. Paraguassú, 400 — Capão da Canoa", category: "Edifício", lat: -29.7520, lng: -50.1100 },
  { id: "c1", name: "Condomínio Praia Dourada", description: "Rua das Gaivotas, 200 — Capão da Canoa", category: "Condomínio", lat: -29.7550, lng: -50.0950 },
  { id: "c2", name: "Residencial Atlântida Sul", description: "Av. Atlântida, 600 — Xangri-lá", category: "Condomínio", lat: -29.7850, lng: -50.0700 },
  { id: "c3", name: "Village das Dunas", description: "Rua dos Coqueiros, 300 — Xangri-lá", category: "Condomínio", lat: -29.8050, lng: -50.0520 },
];

const categoryColors: Record<string, string> = {
  Imóvel: "bg-accent/10 text-accent",
  Edifício: "bg-info/10 text-info",
  Condomínio: "bg-success/10 text-success",
  "Ponto de Interesse": "bg-warning/10 text-warning",
};

const emptyForm = {
  name: "",
  description: "",
  category: "Ponto de Interesse" as MapLocation["category"],
  lat: -29.75,
  lng: -50.10,
};

export default function Maps() {
  const [locations, setLocations] = useState<MapLocation[]>(initialLocations);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = () => {
    if (!form.name) return;
    setLocations((prev) => [...prev, { ...form, id: Date.now().toString() }]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleDelete = (id: string) => setLocations((prev) => prev.filter((l) => l.id !== id));

  // Combine property markers with custom locations
  const allMapProperties = properties.map((p) => ({
    ...p,
    images: p.images || [p.image],
  }));

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize imóveis e pontos de interesse no mapa
            </p>
          </div>
          <button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
            <Plus className="w-4 h-4" /> Novo Marcador
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md animate-scale-in">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-bold text-card-foreground">Novo Marcador</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MapLocation["category"] })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Imóvel</option>
                    <option>Edifício</option>
                    <option>Condomínio</option>
                    <option>Ponto de Interesse</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <Save className="w-4 h-4" /> Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <PropertyMap properties={allMapProperties} />

        {/* Saved locations list */}
        <div className="elevated-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Layers className="w-4 h-4" /> Pontos Salvos
            </h3>
            <span className="text-xs text-muted-foreground">{locations.length} marcadores</span>
          </div>
          <div className="space-y-2">
            {locations.map((loc) => (
              <div key={loc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{loc.name}</p>
                    <p className="text-xs text-muted-foreground">{loc.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold", categoryColors[loc.category])}>{loc.category}</span>
                  <button onClick={() => handleDelete(loc.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
