import { useState } from "react";
import { MediaGalleryUpload } from "@/components/MediaGalleryUpload";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, Video, FolderOpen } from "lucide-react";

const tipos = ["Apartamento", "Casa", "Comercial", "Terreno", "Lote", "Condomínio"];

interface QuickImovelFormProps {
  onSaved?: () => void;
  onCancel?: () => void;
  defaultCidade?: string;
  cancelLabel?: string;
}

export function QuickImovelForm({ onSaved, onCancel, defaultCidade = "", cancelLabel = "Cancelar" }: QuickImovelFormProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("Apartamento");
  const [cidade, setCidade] = useState(defaultCidade);
  const [bairro, setBairro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [preco, setPreco] = useState(0);
  const [quartos, setQuartos] = useState("");
  const [suites, setSuites] = useState("");
  const [banheiros, setBanheiros] = useState("");
  const [vagas, setVagas] = useState("");
  const [area, setArea] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  const [linkVideo, setLinkVideo] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  const reset = () => {
    setTitulo("");
    setBairro("");
    setEndereco("");
    setPreco(0);
    setQuartos("");
    setSuites("");
    setBanheiros("");
    setVagas("");
    setArea("");
    setDescricao("");
    setImagens([]);
    setLinkVideo("");
    setDriveUrl("");
  };

  const submit = async () => {
    if (!user) {
      toast({ title: "Faça login para cadastrar", variant: "destructive" });
      return;
    }
    if (!titulo.trim() || !cidade.trim()) {
      toast({ title: "Preencha título e cidade", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("imoveis").insert([{
      user_id: user.id,
      titulo: titulo.trim(),
      tipo,
      status: "Disponível",
      cidade: cidade.trim(),
      bairro: bairro.trim() || null,
      endereco: endereco.trim(),
      preco: preco || 0,
      quartos: Number(quartos) || 0,
      suites: Number(suites) || 0,
      banheiros: Number(banheiros) || 0,
      vagas: Number(vagas) || 0,
      area: Number(area) || 0,
      descricao: descricao.trim() || null,
      imagens,
      link_video: linkVideo.trim() || null,
      drive_fotos_url: driveUrl.trim() || null,
      corretor_nome: profile?.full_name || null,
      ativo_site: true,
    }]);
    setSaving(false);

    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Imóvel cadastrado ✅", description: "Já disponível no CRM e no site." });
    reset();
    onSaved?.();
  };

  return (
    <div className="space-y-6">
      <div className="elevated-card rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Apartamento 3 dorms frente mar" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <div className="flex flex-wrap gap-1.5">
              {tipos.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    tipo === t ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Preço</Label>
            <CurrencyInput value={preco} onValueChange={(v) => setPreco(parseFloat(v) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cidade *</Label>
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bairro</Label>
            <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Endereço</Label>
            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Dormitórios", v: quartos, set: setQuartos },
            { label: "Suítes", v: suites, set: setSuites },
            { label: "Banheiros", v: banheiros, set: setBanheiros },
            { label: "Vagas", v: vagas, set: setVagas },
            { label: "Metragem Total (m²)", v: area, set: setArea },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <Label className="text-xs">{f.label}</Label>
              <Input type="number" min={0} value={f.v} onChange={(e) => f.set(e.target.value)} />
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Descrição</Label>
          <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} />
        </div>
      </div>

      <div className="elevated-card rounded-xl p-5 space-y-5">
        <MediaGalleryUpload
          label="Fotos do imóvel (a primeira é a capa)"
          values={imagens}
          onChange={setImagens}
          folder="imoveis/cadastro-rapido"
          kind="image"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Link do vídeo</Label>
            <Input value={linkVideo} onChange={(e) => setLinkVideo(e.target.value)} placeholder="https://youtube.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Link do Drive (baixar fotos)</Label>
            <Input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/..." />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={submit} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {saving ? "Salvando..." : "Cadastrar imóvel"}
        </Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>}
      </div>
    </div>
  );
}
