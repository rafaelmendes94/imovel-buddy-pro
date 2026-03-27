import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Download,
  Eye,
  Trash2,
  Search,
  X,
  File,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PdfFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string } | null;
}

export default function Tabelas() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("tabelas").list("", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      toast({ title: "Erro ao carregar arquivos", description: error.message, variant: "destructive" });
    } else {
      setFiles(
        (data || [])
          .filter((f) => f.name.endsWith(".pdf"))
          .map((f) => ({
            name: f.name,
            id: f.id ?? f.name,
            created_at: f.created_at ?? "",
            metadata: f.metadata as PdfFile["metadata"],
          }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Formato inválido", description: "Apenas arquivos PDF são aceitos.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("tabelas").upload(fileName, file, {
      contentType: "application/pdf",
    });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Upload concluído!", description: file.name });
      fetchFiles();
    }
    setUploading(false);
    e.target.value = "";
  };

  const getPublicUrl = (name: string) => {
    const { data } = supabase.storage.from("tabelas").getPublicUrl(name);
    return data.publicUrl;
  };

  const handleDownload = (name: string) => {
    const url = getPublicUrl(name);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePreview = (name: string) => {
    const url = getPublicUrl(name);
    setPreviewUrl(url);
    setPreviewName(name.replace(/^\d+_/, ""));
  };

  const handleDelete = async (name: string) => {
    const { error } = await supabase.storage.from("tabelas").remove([name]);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Arquivo excluído" });
      fetchFiles();
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tabelas</h1>
            <p className="text-sm text-muted-foreground">
              Faça upload de PDFs de tabelas para visualizar ou baixar.
            </p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button asChild disabled={uploading}>
              <span>
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Enviando..." : "Upload PDF"}
              </span>
            </Button>
          </label>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar arquivo..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* File list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Arquivos ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <File className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  {search ? "Nenhum arquivo encontrado." : "Nenhum PDF enviado ainda."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 py-3 group hover:bg-muted/50 rounded-lg px-3 -mx-3 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name.replace(/^\d+_/, "")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(file.metadata?.size)} · {formatDate(file.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePreview(file.name)}
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" title="Excluir">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(file.name)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PDF Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-primary" />
              {previewName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg border border-border"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
