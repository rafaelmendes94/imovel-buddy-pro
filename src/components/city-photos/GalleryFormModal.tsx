import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Save, Upload } from "lucide-react";
import type { CityGallery } from "@/pages/CityPhotos";

interface Props {
  gallery: CityGallery | null;
  onClose: () => void;
  onSaved: () => void;
}

export function GalleryFormModal({ gallery, onClose, onSaved }: Props) {
  const [titulo, setTitulo] = useState(gallery?.titulo || "");
  const [descricao, setDescricao] = useState(gallery?.descricao || "");
  const [tipo, setTipo] = useState(gallery?.tipo || "");
  const [cidade, setCidade] = useState(gallery?.cidade || "");
  const [capaUrl, setCapaUrl] = useState(gallery?.capa_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tipoOptions, setTipoOptions] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("system_options").select("value").eq("category", "gallery_tipo").order("sort_order")
      .then(({ data }) => { if (data) setTipoOptions(data.map((d: any) => d.value)); });
  }, []);

  const handleUploadCapa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `capas/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("city-photos").upload(path, file);
    if (error) { toast.error("Erro no upload"); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("city-photos").getPublicUrl(path);
    setCapaUrl(pub.publicUrl);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    const payload = { titulo, descricao, capa_url: capaUrl, tipo, cidade };
    if (gallery) {
      const { error } = await supabase.from("city_galleries").update(payload).eq("id", gallery.id);
      if (error) { toast.error("Erro ao salvar"); setSaving(false); return; }
      toast.success("Galeria atualizada");
    } else {
      const { error } = await supabase.from("city_galleries").insert(payload);
      if (error) { toast.error("Erro ao criar galeria"); setSaving(false); return; }
      toast.success("Galeria criada");
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-card-foreground">{gallery ? "Editar Galeria" : "Nova Galeria"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Título *</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                {tipoOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade</label>
              <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Balneário Camboriú" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Foto de Capa</label>
            {capaUrl && <img src={capaUrl} alt="Capa" className="w-full h-32 object-cover rounded-lg mb-2" />}
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-sm text-muted-foreground">
              <Upload className="w-4 h-4" />
              {uploading ? "Enviando..." : "Selecionar imagem"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadCapa} disabled={uploading} />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {gallery ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
