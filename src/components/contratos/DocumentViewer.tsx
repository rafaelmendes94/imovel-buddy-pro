import { useRef, useCallback } from "react";
import {
  FileText, Copy, Download, Printer, Pencil, Check, X, Sparkles,
  ZoomIn, ZoomOut,
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
    .replace(/^### (.+)$/gm, '<h3 style="font-size:13pt;font-weight:bold;margin:18px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:14pt;font-weight:bold;margin:22px 0 8px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:16pt;font-weight:bold;margin:24px 0 10px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #ccc;margin:16px 0;" />')
    .replace(/^\- (.+)$/gm, '<li style="margin-left:16px;list-style:disc;">$1</li>');

  html = html.replace(/((<li[^>]*>.*?<\/li>\n?)+)/g, '<ul style="margin:8px 0;">$1</ul>');

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
      return `<p style="margin-bottom:10px;line-height:1.8;text-align:justify;">${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

const PAGE_STYLE = `
  @page { margin: 20mm; size: A4; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.7;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
  }
  h1 { font-size: 16pt; font-weight: bold; margin-top: 1em; }
  h2 { font-size: 14pt; font-weight: bold; margin-top: 1em; }
  h3 { font-size: 13pt; font-weight: bold; margin-top: 0.8em; }
  p { margin-bottom: 0.8em; text-align: justify; }
  strong { font-weight: bold; }
  hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
  ul { margin: 0.5em 0; padding-left: 1.5em; }
  li { margin-bottom: 0.3em; }
`;

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

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(currentText);
    toast.success("Documento copiado!");
  }, [currentText]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${templateTitle || "Documento"}</title><style>${PAGE_STYLE}</style></head><body>${markdownToHtml(currentText)}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, [currentText, templateTitle]);

  const handleDownloadPdf = useCallback(async () => {
    const el = documentRef.current;
    if (!el) return;
    toast.info("Gerando PDF...");
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: [20, 15, 20, 15],
          filename: `${templateTitle?.replace(/\s+/g, "_").toLowerCase() || "documento"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(el)
        .save();
      toast.success("PDF salvo com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF. Tente imprimir como PDF.");
    }
  }, [templateTitle]);

  const showToolbar = (generatedText && !isGenerating) || isEditing;

  return (
    <div className="space-y-0">
      {/* Sticky Toolbar - Word-style */}
      {showToolbar && (
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 rounded-t-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {isEditing ? "Editando" : templateTitle || "Documento"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={onSaveEdit} className="text-emerald-500 hover:text-emerald-400 gap-1.5 text-xs">
                  <Check className="w-3.5 h-3.5" /> Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelEdit} className="text-destructive hover:text-destructive/80 gap-1.5 text-xs">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={onStartEdit} className="gap-1.5 text-xs">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
                <div className="w-px h-5 bg-border mx-1" />
                <Button size="sm" variant="ghost" onClick={handleCopy} className="gap-1.5 text-xs">
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDownloadPdf} className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> PDF
                </Button>
                <Button size="sm" variant="ghost" onClick={handlePrint} className="gap-1.5 text-xs">
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Document Canvas - grey background like Word */}
      <div
        className={`bg-muted/50 border border-border ${showToolbar ? "rounded-b-xl border-t-0" : "rounded-xl"} py-8 px-4 overflow-auto`}
        style={{ minHeight: "60vh", maxHeight: "80vh" }}
      >
        {isEditing ? (
          <div className="mx-auto" style={{ maxWidth: "210mm" }}>
            <div
              className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-200"
              style={{
                padding: "20mm 18mm",
                minHeight: "297mm",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              <textarea
                value={editText}
                onChange={(e) => onEditChange(e.target.value)}
                className="w-full bg-transparent text-gray-900 leading-relaxed resize-none focus:outline-none"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: "12pt",
                  lineHeight: "1.7",
                  minHeight: "260mm",
                }}
              />
            </div>
          </div>
        ) : generatedText ? (
          <div className="mx-auto" style={{ maxWidth: "210mm" }}>
            <div
              ref={documentRef}
              className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-200"
              style={{
                padding: "20mm 18mm",
                minHeight: "297mm",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: "#1a1a1a",
                fontSize: "12pt",
                lineHeight: "1.7",
              }}
              dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedText) }}
            />
            {isGenerating && (
              <div className="flex justify-center py-4">
                <span className="inline-block w-2 h-5 bg-primary animate-pulse rounded-sm" />
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto" style={{ maxWidth: "210mm" }}>
            <div
              className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-200 flex flex-col items-center justify-center"
              style={{ minHeight: "297mm", padding: "20mm" }}
            >
              <Sparkles className="w-16 h-16 mb-4 text-muted-foreground/15" />
              <p className="text-sm font-medium text-muted-foreground">
                Preencha os dados e clique em "Gerar com IA"
              </p>
              <p className="text-xs mt-1 text-muted-foreground/70">
                O documento será exibido aqui no formato A4, pronto para PDF
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
