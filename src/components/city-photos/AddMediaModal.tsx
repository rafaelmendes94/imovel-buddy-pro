import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Upload, Save, Video, ImageIcon } from "lucide-react";

interface Props {
  galleryId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AddMediaModal({ galleryId, onClose, onSaved }: Props) {
  const [tipo, setTipo] = useState<"foto" | "video">("foto");
  const [titulo, setTitulo] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);

    if (tipo === "video") {
      if (!videoUrl.trim()) { toast.error("Cole o link do vídeo"); setSaving(false); return; }
      const { error } = await supabase.from("city_gallery_items").insert({
        gallery_id: galleryId,
        tipo: "video",
        url: videoUrl.trim(),
        titulo,
      });
      if (error) { toast.error("Erro ao salvar vídeo"); setSaving(false); return; }
      toast.success("Vídeo adicionado");
      onSaved();
      return;
    }

    if (files.length === 0) { toast.error("Selecione ao menos uma foto"); setSaving(false); return; }

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `items/${galleryId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("city-photos").upload(path, file);
      if (upErr) { toast.error(`Erro no upload: ${file.name}`); continue; }
      const { data: pub } = supabase.storage.from("city-photos").getPublicUrl(path);
      await supabase.from("city_gallery_items").insert({
        gallery_id: galleryId,
        tipo: "foto",
        url: pub.publicUrl,
        titulo: titulo || file.name,
      });
    }

    toast.success(`${files.length} foto(s) adicionada(s)`);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-card-foreground">Adicionar Mídia</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setTipo("foto")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tipo === "foto" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              <ImageIcon className="w-4 h-4" /> Foto
            </button>
            <button
              onClick={() => setTipo("video")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tipo === "video" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              <Video className="w-4 h-4" /> Vídeo
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Título (opcional)</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {tipo === "foto" ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Selecionar fotos</label>
              <label className="flex items-center gap-2 px-3 py-4 border border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-sm text-muted-foreground text-center justify-center">
                <Upload className="w-4 h-4" />
                {files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : "Clique para selecionar"}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              </label>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Link do YouTube</label>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
