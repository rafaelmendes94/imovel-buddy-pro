import type { CityGallery } from "@/pages/CityPhotos";
import { Edit, Trash2, ImageIcon } from "lucide-react";

interface Props {
  galleries: CityGallery[];
  isSuperAdmin: boolean;
  onSelect: (g: CityGallery) => void;
  onEdit: (g: CityGallery) => void;
  onDelete: (id: string) => void;
}

export function CityGalleryGrid({ galleries, isSuperAdmin, onSelect, onEdit, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {galleries.map((g) => (
        <div
          key={g.id}
          className="rounded-xl border border-border bg-card overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSelect(g)}
        >
          <div className="relative aspect-video bg-muted">
            {g.capa_url ? (
              <img src={g.capa_url} alt={g.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {isSuperAdmin && (
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(g); }}
                  className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card"
                >
                  <Edit className="w-3.5 h-3.5 text-foreground" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}
                  className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90"
                >
                  <Trash2 className="w-3.5 h-3.5 text-foreground" />
                </button>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-card-foreground truncate">{g.titulo}</h3>
            <p className="text-xs text-muted-foreground mt-1">{g.item_count || 0} mídias</p>
          </div>
        </div>
      ))}
    </div>
  );
}
