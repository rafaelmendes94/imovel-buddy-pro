import { useRef } from "react";
import {
  FileText, Copy, Download, Printer, Pencil, Check, X, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DocumentViewerProps {
  generatedText: string;
  isGenerating: boolean;
  isEditing: boolean;
  editText: string;
  templateTitle?: string;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditChange: (text: string) => void;
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-6 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, '<hr class="my-4 border-border" />')
    .replace(/^\- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((<li[^>]*>.*?<\/li>\n?)+)/g, '<ul class="my-2">$1</ul>');

  // Paragraphs
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<li")
      )
        return trimmed;
      return `<p class="mb-3 leading-relaxed">${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

export function DocumentViewer({
  generatedText,
  isGenerating,
  isEditing,
  editText,
  templateTitle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditChange,
}: DocumentViewerProps) {
  const documentRef = useRef<HTMLDivElement>(null);

  const currentText = isEditing ? editText : generatedText;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentText);
    toast.success("Documento copiado!");
  };

  const handlePrint = () => {
    const printContent = documentRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${templateTitle || "Documento"}</title>
        <style>
          @page { margin: 2cm; size: A4; }
          body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; }
          h1 { font-size: 16pt; font-weight: bold; margin-top: 1em; }
          h2 { font-size: 14pt; font-weight: bold; margin-top: 1em; }
          h3 { font-size: 13pt; font-weight: bold; margin-top: 0.8em; }
          p { margin-bottom: 0.8em; text-align: justify; }
          strong { font-weight: bold; }
          hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
          ul { margin: 0.5em 0; padding-left: 1.5em; }
          li { margin-bottom: 0.3em; }
        </style>
      </head>
      <body>${markdownToHtml(currentText)}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownloadPdf = async () => {
    const el = documentRef.current;
    if (!el) return;

    toast.info("Gerando PDF...");

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: [15, 15, 15, 15],
          filename: `${templateTitle?.replace(/\s+/g, "_").toLowerCase() || "documento"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(el)
        .save();

      toast.success("PDF salvo com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF. Tente imprimir como PDF.");
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {generatedText && !isGenerating && (
        <div className="flex items-center justify-between px-4 py-2 rounded-lg border border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            {isEditing ? "Editando Documento" : "Documento Gerado"}
          </h3>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={onSaveEdit} className="text-emerald-500 hover:text-emerald-400 gap-1">
                  <Check className="w-3.5 h-3.5" /> Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelEdit} className="text-destructive hover:text-destructive/80 gap-1">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={onStartEdit} className="gap-1">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCopy} className="gap-1">
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDownloadPdf} className="gap-1">
                  <Download className="w-3.5 h-3.5" /> PDF
                </Button>
                <Button size="sm" variant="ghost" onClick={handlePrint} className="gap-1">
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* A4 Document Area */}
      <div className="flex justify-center">
        <div
          className="w-full max-w-[210mm] bg-white shadow-[0_0_30px_rgba(0,0,0,0.12)] rounded-sm border border-gray-200"
          style={{ minHeight: "297mm" }}
        >
          {isEditing ? (
            <div className="p-[20mm]">
              <textarea
                value={editText}
                onChange={(e) => onEditChange(e.target.value)}
                className="w-full min-h-[260mm] bg-transparent text-sm text-gray-900 leading-relaxed resize-none focus:outline-none"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              />
            </div>
          ) : generatedText ? (
            <div
              ref={documentRef}
              className="p-[20mm] prose-document"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: "#1a1a1a", fontSize: "12pt", lineHeight: "1.7" }}
              dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedText) }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[297mm] text-muted-foreground">
              <Sparkles className="w-16 h-16 mb-4 opacity-15" />
              <p className="text-sm font-medium">Preencha os dados e clique em "Gerar com IA"</p>
              <p className="text-xs mt-1 opacity-70">O documento será gerado automaticamente aqui</p>
            </div>
          )}

          {isGenerating && generatedText && (
            <div className="px-[20mm] pb-[20mm]">
              <div
                ref={documentRef}
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: "#1a1a1a", fontSize: "12pt", lineHeight: "1.7" }}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedText) }}
              />
              <span className="inline-block w-2 h-5 bg-primary animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
