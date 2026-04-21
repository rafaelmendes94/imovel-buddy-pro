import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Palette, Loader2, Type, Globe, Phone, Mail, Instagram } from "lucide-react";

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
  title_color: string;
  cover_photo_url: string | null;
  profile_photo_url: string | null;
  logo_url: string | null;
  site_title: string;
  slogan: string;
  footer_text: string;
  whatsapp: string;
  instagram: string;
  email_contact: string;
  bio: string;
}

const defaults: ConfigData = {
  header_color: "#1e3a5f",
  footer_color: "#111827",
  accent_color: "#2563eb",
  title_color: "#ffffff",
  cover_photo_url: null,
  profile_photo_url: null,
  logo_url: null,
  site_title: "MV BROKER CONNECT",
  slogan: "Seu imóvel dos sonhos está aqui",
  footer_text: "© 2026 MV BROKER CONNECT. Todos os direitos reservados.",
  whatsapp: "",
  instagram: "",
  email_contact: "",
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isMainSite = configType === "main_site";

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
        title_color: (data as any).title_color || defaults.title_color,
        cover_photo_url: data.cover_photo_url,
        profile_photo_url: data.profile_photo_url,
        logo_url: (data as any).logo_url || null,
        site_title: (data as any).site_title || defaults.site_title,
        slogan: (data as any).slogan || defaults.slogan,
        footer_text: (data as any).footer_text || defaults.footer_text,
        whatsapp: (data as any).whatsapp || "",
        instagram: (data as any).instagram || "",
        email_contact: (data as any).email_contact || "",
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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folder: string,
    field: keyof ConfigData,
    setUploading: (v: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, folder);
    if (url) setConfig(prev => ({ ...prev, [field]: url }));
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const payload: any = {
      config_type: configType,
      owner_id: ownerId || null,
      header_color: config.header_color,
      footer_color: config.footer_color,
      accent_color: config.accent_color,
      title_color: config.title_color,
      cover_photo_url: config.cover_photo_url,
      profile_photo_url: config.profile_photo_url,
      logo_url: config.logo_url,
      site_title: config.site_title,
      slogan: config.slogan,
      footer_text: config.footer_text,
      whatsapp: config.whatsapp || null,
      instagram: config.instagram || null,
      email_contact: config.email_contact || null,
      updated_at: new Date().toISOString(),
    };

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
      ({ error } = await supabase.from("site_config").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("site_config").insert(payload));
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configuração salva com sucesso!" });
      onOpenChange(false);
    }
    setSaving(false);
  };

  const update = (field: keyof ConfigData, value: string | null) =>
    setConfig(prev => ({ ...prev, [field]: value }));

  const ColorField = ({ label, field }: { label: string; field: keyof ConfigData }) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={config[field] as string}
          onChange={e => update(field, e.target.value)}
          className="w-10 h-10 rounded-lg border border-border cursor-pointer"
        />
        <Input
          value={config[field] as string}
          onChange={e => update(field, e.target.value)}
          className="text-xs font-mono h-8"
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="branding" className="text-xs">
                <Type className="w-3.5 h-3.5 mr-1" /> Identidade
              </TabsTrigger>
              <TabsTrigger value="colors" className="text-xs">
                <Palette className="w-3.5 h-3.5 mr-1" /> Cores
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs">
                <Image className="w-3.5 h-3.5 mr-1" /> Mídia
              </TabsTrigger>
              <TabsTrigger value="contact" className="text-xs">
                <Globe className="w-3.5 h-3.5 mr-1" /> Contato
              </TabsTrigger>
            </TabsList>

            {/* === IDENTIDADE === */}
            <TabsContent value="branding" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Título do Site</Label>
                <Input
                  value={config.site_title}
                  onChange={e => update("site_title", e.target.value)}
                  placeholder="MV BROKER CONNECT"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Slogan</Label>
                <Input
                  value={config.slogan}
                  onChange={e => update("slogan", e.target.value)}
                  placeholder="Seu imóvel dos sonhos está aqui"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Texto do Rodapé</Label>
                <Textarea
                  value={config.footer_text}
                  onChange={e => update("footer_text", e.target.value)}
                  placeholder="© 2026 MV BROKER CONNECT..."
                  rows={2}
                />
              </div>

              {/* Live preview */}
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                <div className="h-12 flex items-center px-4 gap-3" style={{ backgroundColor: config.header_color }}>
                  {config.logo_url && (
                    <img src={config.logo_url} alt="Logo" className="h-7 w-7 rounded object-contain" />
                  )}
                  <span className="text-sm font-bold" style={{ color: config.title_color }}>
                    {config.site_title || "Título"}
                  </span>
                </div>
                <div className="h-20 bg-muted flex flex-col items-center justify-center gap-1" style={{ backgroundImage: config.cover_photo_url ? `url(${config.cover_photo_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
                  <span className="text-lg font-bold drop-shadow-lg" style={{ color: config.title_color }}>
                    {config.site_title || "Título"}
                  </span>
                  <span className="text-[10px] drop-shadow" style={{ color: config.title_color }}>
                    {config.slogan || "Slogan"}
                  </span>
                </div>
                <div className="h-10 flex items-center justify-center px-3" style={{ backgroundColor: config.footer_color }}>
                  <span className="text-[9px] text-white/70 truncate">{config.footer_text || "Rodapé"}</span>
                </div>
              </div>
            </TabsContent>

            {/* === CORES === */}
            <TabsContent value="colors" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Cor do Cabeçalho" field="header_color" />
                <ColorField label="Cor do Rodapé" field="footer_color" />
                <ColorField label="Cor de Destaque" field="accent_color" />
                <ColorField label="Cor do Título / Logo" field="title_color" />
              </div>

              {/* Preview */}
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                <div className="h-10 flex items-center px-4" style={{ backgroundColor: config.header_color }}>
                  <span className="text-xs font-bold" style={{ color: config.title_color }}>{config.site_title}</span>
                </div>
                <div className="h-16 bg-muted flex items-center justify-center gap-3">
                  <div className="w-16 h-8 rounded" style={{ backgroundColor: config.accent_color }} />
                  <span className="text-[10px] text-muted-foreground">Cor de destaque</span>
                </div>
                <div className="h-8 flex items-center px-4" style={{ backgroundColor: config.footer_color }}>
                  <span className="text-[9px] text-white/70">Rodapé</span>
                </div>
              </div>
            </TabsContent>

            {/* === MÍDIA === */}
            <TabsContent value="media" className="space-y-5 mt-4">
              {/* Logo */}
              {isMainSite && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5" /> Logo
                  </Label>
                  {config.logo_url && (
                    <div className="flex items-center gap-3">
                      <img src={config.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-contain border border-border bg-muted p-1" />
                      <button onClick={() => update("logo_url", null)} className="text-xs text-destructive hover:underline">Remover</button>
                    </div>
                  )}
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, "logos", "logo_url", setUploadingLogo)} />
                  <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={uploadingLogo} className="w-full">
                    {uploadingLogo ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <><Upload className="w-4 h-4 mr-2" /> {config.logo_url ? "Trocar logo" : "Enviar logo"}</>}
                  </Button>
                </div>
              )}

              {/* Cover */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Foto de Capa</Label>
                {config.cover_photo_url && (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={config.cover_photo_url} alt="Capa" className="w-full h-32 object-cover" />
                    <button onClick={() => update("cover_photo_url", null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70">✕</button>
                  </div>
                )}
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, "covers", "cover_photo_url", setUploadingCover)} />
                <Button variant="outline" size="sm" onClick={() => coverRef.current?.click()} disabled={uploadingCover} className="w-full">
                  {uploadingCover ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <><Upload className="w-4 h-4 mr-2" /> {config.cover_photo_url ? "Trocar foto de capa" : "Enviar foto de capa"}</>}
                </Button>
              </div>

              {/* Profile */}
              {showProfilePhoto && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Foto de Perfil</Label>
                  {config.profile_photo_url && (
                    <div className="flex items-center gap-3">
                      <img src={config.profile_photo_url} alt="Perfil" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                      <button onClick={() => update("profile_photo_url", null)} className="text-xs text-destructive hover:underline">Remover</button>
                    </div>
                  )}
                  <input ref={profileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, "profiles", "profile_photo_url", setUploadingProfile)} />
                  <Button variant="outline" size="sm" onClick={() => profileRef.current?.click()} disabled={uploadingProfile} className="w-full">
                    {uploadingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <><Image className="w-4 h-4 mr-2" /> {config.profile_photo_url ? "Trocar foto de perfil" : "Enviar foto de perfil"}</>}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* === CONTATO === */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> WhatsApp
                </Label>
                <Input
                  value={config.whatsapp}
                  onChange={e => update("whatsapp", e.target.value)}
                  placeholder="5511999999999"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </Label>
                <Input
                  value={config.instagram}
                  onChange={e => update("instagram", e.target.value)}
                  placeholder="@mvbrokerconnect"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> E-mail de Contato
                </Label>
                <Input
                  type="email"
                  value={config.email_contact}
                  onChange={e => update("email_contact", e.target.value)}
                  placeholder="contato@mvbroker.com"
                />
              </div>
            </TabsContent>

            <Button onClick={handleSave} disabled={saving} className="w-full mt-6">
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
