import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Palette, Loader2 } from "lucide-react";

interface SiteConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configType: "main_site" | "broker_page" | "partner_page";
  ownerId?: string;
  showProfilePhoto?: boolean;
  title?: string;
}

interface ConfigData {
  header_color: string;
  footer_color: string;
  accent_color: string;
  cover_photo_url: string | null;
  profile_photo_url: string | null;
}

const defaults: ConfigData = {
  header_color: "#1e3a5f",
  footer_color: "#111827",
  accent_color: "#2563eb",
  cover_photo_url: null,
  profile_photo_url: null,
};

export function SiteConfigDialog({
  open,
  onOpenChange,
  configType,
  ownerId,
  showProfilePhoto = false,
  title = "Configuração de Aparência",
}: SiteConfigDialogProps) {
  const [config, setConfig] = useState<ConfigData>(defaults);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) loadConfig();
  }, [open]);

  const loadConfig = async () => {
    setLoading(true);
    const query = supabase
      .from("site_config")
      .select("*")
      .eq("config_type", configType);

    if (ownerId) {
      query.eq("owner_id", ownerId);
    } else {
      query.is("owner_id", null);
    }

    const { data } = await query.maybeSingle();
    if (data) {
      setConfig({
        header_color: data.header_color,
        footer_color: data.footer_color,
        accent_color: data.accent_color,
        cover_photo_url: data.cover_photo_url,
        profile_photo_url: data.profile_photo_url,
      });
    } else {
      setConfig(defaults);
    }
    setLoading(false);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadFile(file, "covers");
    if (url) setConfig(prev => ({ ...prev, cover_photo_url: url }));
    setUploadingCover(false);
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfile(true);
    const url = await uploadFile(file, "profiles");
    if (url) setConfig(prev => ({ ...prev, profile_photo_url: url }));
    setUploadingProfile(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const payload = {
      config_type: configType,
      owner_id: ownerId || null,
      header_color: config.header_color,
      footer_color: config.footer_color,
      accent_color: config.accent_color,
      cover_photo_url: config.cover_photo_url,
      profile_photo_url: config.profile_photo_url,
      updated_at: new Date().toISOString(),
    };

    // Try update first, then insert
    const query = supabase
      .from("site_config")
      .select("id")
      .eq("config_type", configType);

    if (ownerId) {
      query.eq("owner_id", ownerId);
    } else {
      query.is("owner_id", null);
    }

    const { data: existing } = await query.maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("site_config")
        .update(payload)
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase
        .from("site_config")
        .insert(payload));
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configuração salva com sucesso!" });
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Colors */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Cores</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Cabeçalho</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.header_color}
                      onChange={e => setConfig(prev => ({ ...prev, header_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={config.header_color}
                      onChange={e => setConfig(prev => ({ ...prev, header_color: e.target.value }))}
                      className="text-xs font-mono h-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Rodapé</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.footer_color}
                      onChange={e => setConfig(prev => ({ ...prev, footer_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={config.footer_color}
                      onChange={e => setConfig(prev => ({ ...prev, footer_color: e.target.value }))}
                      className="text-xs font-mono h-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Destaque</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accent_color}
                      onChange={e => setConfig(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={config.accent_color}
                      onChange={e => setConfig(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="text-xs font-mono h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg overflow-hidden border border-border">
                <div className="h-8 flex items-center px-3" style={{ backgroundColor: config.header_color }}>
                  <span className="text-[10px] text-white font-medium">Cabeçalho</span>
                </div>
                <div className="h-12 bg-muted flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">Conteúdo</span>
                </div>
                <div className="h-8 flex items-center px-3" style={{ backgroundColor: config.footer_color }}>
                  <span className="text-[10px] text-white font-medium">Rodapé</span>
                </div>
              </div>
            </div>

            {/* Cover Photo */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Foto de Capa</h3>
              {config.cover_photo_url && (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={config.cover_photo_url}
                    alt="Capa"
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, cover_photo_url: null }))}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
                  >
                    ✕
                  </button>
                </div>
              )}
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => coverRef.current?.click()}
                disabled={uploadingCover}
                className="w-full"
              >
                {uploadingCover ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> {config.cover_photo_url ? "Trocar foto de capa" : "Enviar foto de capa"}</>
                )}
              </Button>
            </div>

            {/* Profile Photo */}
            {showProfilePhoto && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Foto de Perfil</h3>
                {config.profile_photo_url && (
                  <div className="flex items-center gap-3">
                    <img
                      src={config.profile_photo_url}
                      alt="Perfil"
                      className="w-16 h-16 rounded-full object-cover border-2 border-border"
                    />
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, profile_photo_url: null }))}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                )}
                <input ref={profileRef} type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => profileRef.current?.click()}
                  disabled={uploadingProfile}
                  className="w-full"
                >
                  {uploadingProfile ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                  ) : (
                    <><Image className="w-4 h-4 mr-2" /> {config.profile_photo_url ? "Trocar foto de perfil" : "Enviar foto de perfil"}</>
                  )}
                </Button>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
