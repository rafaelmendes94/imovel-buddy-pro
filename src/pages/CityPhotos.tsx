import { useState } from "react";
import { SmartLayout } from "@/components/SmartLayout";
import { BackButton } from "@/components/BackButton";
import {
  Camera,
  Plus,
  Search,
  MapPin,
  X,
  Save,
  Edit,
  Trash2,
  Eye,
  Download,
  Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CityPhoto {
  id: string;
  title: string;
  description: string;
  city: string;
  neighborhood: string;
  category: "Paisagem" | "Infraestrutura" | "Comércio" | "Lazer" | "Transporte";
  image: string;
  date: string;
}

const initialPhotos: CityPhoto[] = [
  {
    id: "1",
    title: "Av. Paulista ao Entardecer",
    description: "Vista panorâmica da Av. Paulista",
    city: "São Paulo",
    neighborhood: "Bela Vista",
    category: "Paisagem",
    image: "https://images.unsplash.com/photo-1543059080-f9b1272213d5?w=600&h=400&fit=crop",
    date: "2024-03-15",
  },
  {
    id: "2",
    title: "Parque Ibirapuera",
    description: "Área verde do Parque Ibirapuera",
    city: "São Paulo",
    neighborhood: "Moema",
    category: "Lazer",
    image: "https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?w=600&h=400&fit=crop",
    date: "2024-03-10",
  },
  {
    id: "3",
    title: "Estação da Luz",
    description: "Estação ferroviária histórica",
    city: "São Paulo",
    neighborhood: "Bom Retiro",
    category: "Transporte",
    image: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600&h=400&fit=crop",
    date: "2024-02-20",
  },
  {
    id: "4",
    title: "Rua Oscar Freire",
    description: "Comércio de luxo nos Jardins",
    city: "São Paulo",
    neighborhood: "Jardins",
    category: "Comércio",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
    date: "2024-01-18",
  },
  {
    id: "5",
    title: "Ponte Estaiada",
    description: "Ponte Octávio Frias de Oliveira à noite",
    city: "São Paulo",
    neighborhood: "Morumbi",
    category: "Infraestrutura",
    image: "https://images.unsplash.com/photo-1554232456-8727aae0cfa4?w=600&h=400&fit=crop",
    date: "2024-03-01",
  },
  {
    id: "6",
    title: "Vista Aérea Pinheiros",
    description: "Bairro de Pinheiros visto de cima",
    city: "São Paulo",
    neighborhood: "Pinheiros",
    category: "Paisagem",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop",
    date: "2024-02-14",
  },
];

const categoryColors: Record<string, string> = {
  Paisagem: "bg-success/10 text-success",
  Infraestrutura: "bg-info/10 text-info",
  Comércio: "bg-warning/10 text-warning",
  Lazer: "bg-accent/10 text-accent",
  Transporte: "bg-destructive/10 text-destructive",
};

const emptyForm = {
  title: "",
  description: "",
  city: "",
  neighborhood: "",
  category: "Paisagem" as CityPhoto["category"],
  image: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function CityPhotos() {
  const [photos, setPhotos] = useState<CityPhoto[]>(initialPhotos);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [lightbox, setLightbox] = useState<CityPhoto | null>(null);

  const filtered = photos.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.neighborhood.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "Todas" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const handleSubmit = () => {
    if (!form.title || !form.image) return;
    if (editingId) {
      setPhotos((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...form } : p)));
    } else {
      setPhotos((prev) => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (photo: CityPhoto) => {
    setForm({ ...photo });
    setEditingId(photo.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  return (
    <SmartLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fotos da Cidade</h1>
            <p className="text-sm text-muted-foreground mt-1">{photos.length} fotos cadastradas</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
            <Plus className="w-4 h-4" /> Nova Foto
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar foto..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Todas", "Paisagem", "Infraestrutura", "Comércio", "Lazer", "Transporte"].map((cat) => (
              <button key={cat} onClick={() => setFilterCategory(cat)} className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-colors", filterCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted")}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg animate-scale-in">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-bold text-card-foreground">{editingId ? "Editar Foto" : "Nova Foto"}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Título *</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Bairro</label>
                    <input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CityPhoto["category"] })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>Paisagem</option>
                      <option>Infraestrutura</option>
                      <option>Comércio</option>
                      <option>Lazer</option>
                      <option>Transporte</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data</label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">URL da Imagem *</label>
                    <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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

        {/* Lightbox */}
        {lightbox && (
          <div className="fixed inset-0 bg-foreground/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <div className="max-w-4xl w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <img src={lightbox.image} alt={lightbox.title} className="w-full rounded-xl" />
              <div className="mt-3 text-center">
                <h3 className="text-lg font-bold text-background">{lightbox.title}</h3>
                <p className="text-sm text-background/70">{lightbox.neighborhood}, {lightbox.city}</p>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((photo) => (
            <div key={photo.id} className="elevated-card rounded-xl overflow-hidden group relative">
              <div className="relative h-52 overflow-hidden">
                <img src={photo.image} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className={cn("absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-semibold", categoryColors[photo.category])}>
                  {photo.category}
                </span>
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setLightbox(photo)} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"><Eye className="w-3.5 h-3.5 text-foreground" /></button>
                  <button onClick={() => handleEdit(photo)} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"><Edit className="w-3.5 h-3.5 text-foreground" /></button>
                  <button onClick={() => handleDelete(photo.id)} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-colors"><Trash2 className="w-3.5 h-3.5 text-foreground" /></button>
                </div>
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-sm font-semibold text-background">{photo.title}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-background/70" />
                    <p className="text-[11px] text-background/70">{photo.neighborhood}, {photo.city}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma foto encontrada</p>
          </div>
        )}
      </div>
    </SmartLayout>
  );
}
