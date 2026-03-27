import { useState } from "react";
import { X, Camera, Video, ChevronLeft, ChevronRight, Play, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  type: "photo" | "video";
  url: string;
  thumbnail?: string;
  title: string;
}

interface InfraMediaModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  media: MediaItem[];
}

const defaultMedia: MediaItem[] = [
  { type: "photo", url: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&h=600&fit=crop", title: "Piscina" },
  { type: "photo", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop", title: "Academia" },
  { type: "photo", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop", title: "Salão de Festas" },
  { type: "photo", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop", title: "Área Externa" },
  { type: "photo", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop", title: "Área Gourmet" },
  { type: "photo", url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop", title: "Playground" },
  { type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop", title: "Tour Virtual" },
  { type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop", title: "Vídeo Institucional" },
];

export function InfraMediaModal({ open, onClose, title, media }: InfraMediaModalProps) {
  const [activeTab, setActiveTab] = useState<"photos" | "videos">("photos");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!open) return null;

  const items = media.length > 0 ? media : defaultMedia;
  const photos = items.filter((m) => m.type === "photo");
  const videos = items.filter((m) => m.type === "video");
  const currentList = activeTab === "photos" ? photos : videos;

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-card-foreground">Mídia da Infraestrutura</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-4">
            <button
              onClick={() => setActiveTab("photos")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "photos" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Camera className="w-4 h-4" /> Fotos ({photos.length})
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "videos" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Video className="w-4 h-4" /> Vídeos ({videos.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {currentList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma mídia disponível</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentList.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (item.type === "photo") {
                        setLightboxIndex(idx);
                      } else {
                        window.open(item.url, "_blank");
                      }
                    }}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden group"
                  >
                    <img
                      src={item.type === "video" ? item.thumbnail || item.url : item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                      {item.type === "video" && (
                        <div className="w-10 h-10 rounded-full bg-card/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-foreground fill-foreground" />
                        </div>
                      )}
                    </div>
                    <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/70 to-transparent p-2 text-[11px] font-medium text-background text-left">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 bg-foreground/90 z-[60] flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 text-background/80 hover:text-background z-10">
            <X className="w-6 h-6" />
          </button>
          {lightboxIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }} className="absolute left-4 text-background/80 hover:text-background z-10">
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {lightboxIndex < photos.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }} className="absolute right-4 text-background/80 hover:text-background z-10">
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          <img
            src={photos[lightboxIndex]?.url}
            alt={photos[lightboxIndex]?.title}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-background text-sm font-medium">{photos[lightboxIndex]?.title}</p>
        </div>
      )}
    </>
  );
}
