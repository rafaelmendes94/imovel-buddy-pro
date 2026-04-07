import { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CityGalleryGrid } from "@/components/city-photos/CityGalleryGrid";
import { CityGalleryDetail } from "@/components/city-photos/CityGalleryDetail";
import { GalleryFormModal } from "@/components/city-photos/GalleryFormModal";
import { Plus, Camera, Filter } from "lucide-react";

export interface CityGallery {
  id: string;
  titulo: string;
  capa_url: string;
  descricao: string;
  tipo: string;
  cidade: string;
  created_at: string;
  item_count?: number;
}

export interface GalleryItem {
  id: string;
  gallery_id: string;
  tipo: string;
  url: string;
  titulo: string;
  sort_order: number;
}

export default function CityPhotos() {
  const { isSuperAdmin } = useAuth();
  const [galleries, setGalleries] = useState<CityGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGallery, setSelectedGallery] = useState<CityGallery | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGallery, setEditingGallery] = useState<CityGallery | null>(null);
  const [filterTipo, setFilterTipo] = useState("");
  const [filterCidade, setFilterCidade] = useState("");
  const [tipoOptions, setTipoOptions] = useState<string[]>([]);

  // Fetch tipo options from system_options
  useEffect(() => {
    supabase.from("system_options").select("value").eq("category", "gallery_tipo").order("sort_order")
      .then(({ data }) => { if (data) setTipoOptions(data.map((d: any) => d.value)); });
  }, []);

  // Derive unique cities from galleries
  const cidadeOptions = useMemo(() => {
    const cities = galleries.map(g => g.cidade).filter(c => c.length > 0);
    return [...new Set(cities)].sort();
  }, [galleries]);

  const filteredGalleries = useMemo(() => {
    return galleries.filter(g => {
      if (filterTipo && g.tipo !== filterTipo) return false;
      if (filterCidade && g.cidade !== filterCidade) return false;
      return true;
    });
  }, [galleries, filterTipo, filterCidade]);

  const fetchGalleries = useCallback(async () => {
    setLoading(true);
    const { data: gals, error } = await supabase
      .from("city_galleries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { toast.error("Erro ao carregar galerias"); setLoading(false); return; }

    // get counts
    const { data: items } = await supabase
      .from("city_gallery_items")
      .select("gallery_id");

    const countMap: Record<string, number> = {};
    items?.forEach((i: any) => { countMap[i.gallery_id] = (countMap[i.gallery_id] || 0) + 1; });

    setGalleries((gals || []).map((g: any) => ({ ...g, item_count: countMap[g.id] || 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchGalleries(); }, [fetchGalleries]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("city_galleries").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir galeria"); return; }
    toast.success("Galeria excluída");
    fetchGalleries();
  };

  const handleEdit = (g: CityGallery) => {
    setEditingGallery(g);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGallery(null);
  };

  const handleFormSaved = () => {
    handleFormClose();
    fetchGalleries();
  };

  if (selectedGallery) {
    return (
      <AppLayout>
        <CityGalleryDetail
          gallery={selectedGallery}
          onBack={() => { setSelectedGallery(null); fetchGalleries(); }}
          isSuperAdmin={isSuperAdmin}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fotos da Cidade</h1>
            <p className="text-sm text-muted-foreground mt-1">{filteredGalleries.length} galerias</p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => { setEditingGallery(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors self-start"
            >
              <Plus className="w-4 h-4" /> Nova Galeria
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos os tipos</option>
            {tipoOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterCidade}
            onChange={(e) => setFilterCidade(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas as cidades</option>
            {cidadeOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {(filterTipo || filterCidade) && (
            <button onClick={() => { setFilterTipo(""); setFilterCidade(""); }} className="text-xs text-primary hover:underline">Limpar filtros</button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredGalleries.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma galeria encontrada</p>
          </div>
        ) : (
          <CityGalleryGrid
            galleries={filteredGalleries}
            isSuperAdmin={isSuperAdmin}
            onSelect={setSelectedGallery}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {showForm && (
          <GalleryFormModal
            gallery={editingGallery}
            onClose={handleFormClose}
            onSaved={handleFormSaved}
          />
        )}
      </div>
    </AppLayout>
  );
}
