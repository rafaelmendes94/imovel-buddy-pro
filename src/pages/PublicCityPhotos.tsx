import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Camera, ArrowLeft, Search, X, Play, Image as ImageIcon, MapPin, Filter } from "lucide-react";

interface CityGallery {
  id: string;
  titulo: string;
  capa_url: string;
  descricao: string;
  tipo: string;
  cidade: string;
  item_count?: number;
}

interface GalleryItem {
  id: string;
  gallery_id: string;
  tipo: string;
  url: string;
  titulo: string;
  sort_order: number;
}

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] || null;
}

export default function PublicCityPhotos() {
  const [galleries, setGalleries] = useState<CityGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGallery, setSelectedGallery] = useState<CityGallery | null>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [filterCidade, setFilterCidade] = useState("");
  const [filterTipo, setFilterTipo] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("city_galleries")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        // Get item counts
        const { data: allItems } = await supabase
          .from("city_gallery_items")
          .select("gallery_id");

        const counts: Record<string, number> = {};
        (allItems || []).forEach((i: any) => {
          counts[i.gallery_id] = (counts[i.gallery_id] || 0) + 1;
        });

        setGalleries(data.map((g: any) => ({ ...g, item_count: counts[g.id] || 0 })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const loadItems = useCallback(async (galleryId: string) => {
    setItemsLoading(true);
    const { data } = await supabase
      .from("city_gallery_items")
      .select("*")
      .eq("gallery_id", galleryId)
      .order("sort_order");
    setItems((data as GalleryItem[]) || []);
    setItemsLoading(false);
  }, []);

  const handleSelectGallery = (g: CityGallery) => {
    setSelectedGallery(g);
    loadItems(g.id);
  };

  const cidadeOptions = useMemo(() => {
    const cities = galleries.map(g => g.cidade).filter(Boolean);
    return [...new Set(cities)].sort();
  }, [galleries]);

  const tipoOptions = useMemo(() => {
    const tipos = galleries.map(g => g.tipo).filter(Boolean);
    return [...new Set(tipos)].sort();
  }, [galleries]);

  const filtered = useMemo(() => {
    return galleries.filter(g => {
      if (filterCidade && g.cidade !== filterCidade) return false;
      if (filterTipo && g.tipo !== filterTipo) return false;
      return true;
    });
  }, [galleries, filterCidade, filterTipo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  // Detail view
  if (selectedGallery) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16">
            <button onClick={() => { setSelectedGallery(null); setItems([]); }}
              className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <h1 className="text-lg font-bold text-gray-900 truncate">{selectedGallery.titulo}</h1>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {selectedGallery.descricao && (
            <p className="text-gray-600 mb-6">{selectedGallery.descricao}</p>
          )}
          <div className="flex items-center gap-2 mb-6">
            {selectedGallery.cidade && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5" /> {selectedGallery.cidade}
              </span>
            )}
            {selectedGallery.tipo && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{selectedGallery.tipo}</span>
            )}
            <span className="text-sm text-gray-400">{items.length} mídias</span>
          </div>

          {itemsLoading ? (
            <p className="text-center text-gray-400 py-12">Carregando mídias...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Nenhuma mídia nesta galeria</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map(item => {
                const ytId = item.tipo === "video" ? getYoutubeId(item.url) : null;
                return (
                  <div key={item.id}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 cursor-pointer group"
                    onClick={() => setLightbox(item)}>
                    {ytId ? (
                      <>
                        <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={item.titulo || ""}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-10 h-10 text-white drop-shadow-lg" />
                        </div>
                      </>
                    ) : (
                      <img src={item.url} alt={item.titulo || ""} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setLightbox(null)}>
              <X className="w-8 h-8" />
            </button>
            <div className="max-w-4xl max-h-[85vh] w-full" onClick={e => e.stopPropagation()}>
              {lightbox.tipo === "video" && getYoutubeId(lightbox.url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeId(lightbox.url)}?autoplay=1`}
                  className="w-full aspect-video rounded-xl"
                  allowFullScreen allow="autoplay"
                />
              ) : (
                <img src={lightbox.url} alt={lightbox.titulo || ""} className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/site" className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              <h1 className="text-lg font-bold text-gray-900">Fotos da Cidade</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters */}
        {(cidadeOptions.length > 1 || tipoOptions.length > 1) && (
          <div className="flex flex-wrap gap-3">
            {cidadeOptions.length > 1 && (
              <select value={filterCidade} onChange={e => setFilterCidade(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">Todas as cidades</option>
                {cidadeOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {tipoOptions.length > 1 && (
              <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">Todos os tipos</option>
                {tipoOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma galeria encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(g => (
              <div key={g.id}
                className="rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group"
                onClick={() => handleSelectGallery(g)}>
                <div className="relative aspect-video">
                  {g.capa_url ? (
                    <img src={g.capa_url} alt={g.titulo} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-base drop-shadow-lg">{g.titulo}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {g.cidade && <span className="text-white/80 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{g.cidade}</span>}
                      {g.item_count !== undefined && <span className="text-white/70 text-xs">{g.item_count} fotos</span>}
                    </div>
                  </div>
                </div>
                {g.tipo && (
                  <div className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">{g.tipo}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}