import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CityGallery, GalleryItem } from "@/pages/CityPhotos";
import { ArrowLeft, Plus, Trash2, Download, X, Play, Image as ImageIcon } from "lucide-react";
import { AddMediaModal } from "./AddMediaModal";

interface Props {
  gallery: CityGallery;
  onBack: () => void;
  isSuperAdmin: boolean;
}

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] || null;
}

export function CityGalleryDetail({ gallery, onBack, isSuperAdmin }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("city_gallery_items")
      .select("*")
      .eq("gallery_id", gallery.id)
      .order("sort_order", { ascending: true });
    if (error) toast.error("Erro ao carregar mídias");
    setItems((data as GalleryItem[]) || []);
    setLoading(false);
  }, [gallery.id]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from("city_gallery_items").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Mídia excluída");
    fetchItems();
  };

  const handleDownload = (url: string, title: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = title || "foto";
    a.click();
  };

  const photos = items.filter((i) => i.tipo === "foto");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{gallery.titulo}</h1>
            {gallery.descricao && <p className="text-sm text-muted-foreground">{gallery.descricao}</p>}
          </div>
        </div>
        <div className="flex gap-2 self-start">
          {photos.length > 0 && (
            <button
              onClick={() => photos.forEach((p) => handleDownload(p.url, p.titulo))}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" /> Baixar Todas
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Adicionar Mídia
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhuma mídia nesta galeria</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => {
            const ytId = item.tipo === "video" ? getYoutubeId(item.url) : null;
            return (
              <div key={item.id} className="relative group rounded-lg overflow-hidden border border-border bg-card">
                {item.tipo === "foto" ? (
                  <div className="aspect-square cursor-pointer" onClick={() => setLightbox(item)}>
                    <img src={item.url} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : ytId ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.tipo === "foto" && (
                    <button
                      onClick={() => handleDownload(item.url, item.titulo)}
                      className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card"
                    >
                      <Download className="w-3.5 h-3.5 text-foreground" />
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-foreground" />
                    </button>
                  )}
                </div>
                {item.titulo && (
                  <div className="px-2 py-1.5">
                    <p className="text-xs text-muted-foreground truncate">{item.titulo}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-foreground/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-background hover:text-background/80" onClick={() => setLightbox(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={lightbox.url} alt={lightbox.titulo} className="max-w-full max-h-[90vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {showAdd && (
        <AddMediaModal
          galleryId={gallery.id}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchItems(); }}
        />
      )}
    </div>
  );
}
