import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
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
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StoredFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string };
}

export default function Tabelas() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerName, setViewerName] = useState("");

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("tabelas").list("", {
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      toast.error("Erro ao carregar arquivos");
    } else {
      setFiles((data || []).filter((f) => f.name !== ".emptyFolderPlaceholder") as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são permitidos");
      return;
    }
    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("tabelas")
      .upload(fileName, file, { contentType: "application/pdf" });
    if (error) {
      toast.error("Erro ao enviar arquivo: " + error.message);
    } else {
      toast.success("Arquivo enviado com sucesso!");
      fetchFiles();
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDownload = async (fileName: string) => {
    const { data } = supabase.storage.from("tabelas").getPublicUrl(fileName);
    if (data?.publicUrl) {
      const a = document.createElement("a");
      a.href = data.publicUrl;
      a.download = fileName.replace(/^\d+_/, "");
      a.target = "_blank";
      a.click();
    }
  };

  const handleView = (fileName: string) => {
    const { data } = supabase.storage.from("tabelas").getPublicUrl(fileName);
    if (data?.publicUrl) {
      setViewerUrl(data.publicUrl);
      setViewerName(fileName.replace(/^\d+_/, ""));
      setViewerOpen(true);
    }
  };

  const handleDelete = async (fileName: string) => {
    const { error } = await supabase.storage.from("tabelas").remove([fileName]);
    if (error) {
      toast.error("Erro ao excluir arquivo");
    } else {
      toast.success("Arquivo excluído");
      fetchFiles();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tabelas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Faça upload de PDFs para visualizar ou baixar
            </p>
          </div>
          <div>
            <Input
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              className="hidden"
              id="pdf-upload"
              disabled={uploading}
            />
            <Button asChild disabled={uploading}>
              <label htmlFor="pdf-upload" className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploading ? "Enviando..." : "Upload PDF"}
              </label>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
            <p className="text-sm">Faça upload de um PDF para começar</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {files.map((file) => (
              <div
                key={file.id || file.name}
                className="elevated-card rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name.replace(/^\d+_/, "")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.metadata?.size
                        ? formatSize(file.metadata.size)
                        : "—"}{" "}
                      •{" "}
                      {new Date(file.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleView(file.name)}
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDownload(file.name)}
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(file.name)}
                    title="Excluir"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {viewerName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6">
            <iframe
              src={viewerUrl}
              className="w-full h-full rounded-lg border border-border"
              title={viewerName}
            />
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
