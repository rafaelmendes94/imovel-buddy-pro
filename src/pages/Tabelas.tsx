import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileText,
  Download,
  Eye,
  Trash2,
  Loader2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toSlug } from "@/lib/utils";

export default function Tabelas() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tabelaUrl, setTabelaUrl] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const slug = profile?.full_name ? toSlug(profile.full_name) : "";
  const brokerName = profile?.full_name || "Corretor";
  const publicUrl = slug ? `${window.location.origin}/corretor/${slug}` : "";

  const fetchTabela = async () => {
    if (!slug) { setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("site_config") as any)
      .select("id, tabela_url")
      .eq("config_type", "broker_page")
      .eq("owner_id", slug)
      .maybeSingle();
    if (data) {
      setConfigId(data.id);
      setTabelaUrl(data.tabela_url || null);
    } else {
      setConfigId(null);
      setTabelaUrl(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTabela();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são permitidos");
      e.target.value = "";
      return;
    }
    if (!slug || !user) {
      toast.error("Perfil incompleto. Configure seu nome em Configurações.");
      return;
    }
    setUploading(true);
    try {
      const path = `brokers/${slug}/tabela-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("tabelas")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("tabelas").getPublicUrl(path);
      const url = pub?.publicUrl || "";

      if (configId) {
        const { error } = await (supabase.from("site_config") as any)
          .update({ tabela_url: url })
          .eq("id", configId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase.from("site_config") as any)
          .insert({
            config_type: "broker_page",
            owner_id: slug,
            tabela_url: url,
            site_title: brokerName,
          })
          .select("id")
          .maybeSingle();
        if (error) throw error;
        if (data) setConfigId(data.id);
      }
      setTabelaUrl(url);
      toast.success("Tabela enviada! Já está disponível na sua página pública.");
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err?.message || "tente novamente"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!configId) return;
    if (!confirm("Remover sua tabela? Os clientes não poderão mais baixá-la.")) return;
    const { error } = await (supabase.from("site_config") as any)
      .update({ tabela_url: null })
      .eq("id", configId);
    if (error) {
      toast.error("Erro ao remover tabela");
    } else {
      setTabelaUrl(null);
      toast.success("Tabela removida");
    }
  };

  const copyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link da sua página copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-3xl mx-auto">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minha Tabela</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Faça upload da sua tabela em PDF. Ela ficará disponível para download
            no botão <strong>"Baixar tabela em PDF"</strong> da sua página pública de corretor.
          </p>
          {publicUrl && (
            <button
              onClick={copyPublicLink}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Share2 className="w-3.5 h-3.5" /> {publicUrl}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : tabelaUrl ? (
          <div className="elevated-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Tabela ativa
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Vinculada a {brokerName}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setViewerOpen(true)}>
                <Eye className="w-4 h-4 mr-2" /> Visualizar
              </Button>
              <Button variant="outline" asChild>
                <a href={tabelaUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="w-4 h-4 mr-2" /> Baixar
                </a>
              </Button>
              <div className="flex-1" />
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleUpload}
                className="hidden"
                id="tabela-upload-replace"
                disabled={uploading}
              />
              <Button asChild variant="secondary" disabled={uploading}>
                <label htmlFor="tabela-upload-replace" className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? "Enviando..." : "Substituir"}
                </label>
              </Button>
              <Button variant="ghost" onClick={handleDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Remover
              </Button>
            </div>
          </div>
        ) : (
          <div className="elevated-card rounded-xl p-8 flex flex-col items-center text-center gap-3">
            <FileText className="w-14 h-14 text-muted-foreground/40" />
            <div>
              <p className="text-base font-medium text-foreground">
                Nenhuma tabela enviada ainda
              </p>
              <p className="text-sm text-muted-foreground">
                Envie um PDF para disponibilizar na sua página pública.
              </p>
            </div>
            <Input
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              className="hidden"
              id="tabela-upload"
              disabled={uploading}
            />
            <Button asChild disabled={uploading}>
              <label htmlFor="tabela-upload" className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploading ? "Enviando..." : "Enviar minha tabela"}
              </label>
            </Button>
          </div>
        )}
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Minha Tabela — {brokerName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6">
            {tabelaUrl && (
              <iframe
                src={tabelaUrl}
                className="w-full h-full rounded-lg border border-border"
                title="Tabela"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
