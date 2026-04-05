import { useRef, useCallback, useEffect } from "react";
import {
  FileText, Copy, Download, Printer, Check, X, Sparkles,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<hr") || trimmed.startsWith("<li"))
        return trimmed;
      return `<p style="margin-bottom:10px;line-height:1.8;text-align:justify;">${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
  return html;
}

const PAGE_STYLE = `
  @page { margin: 20mm; size: A4; }
  body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 12pt; line-height: 1.7; color: #1a1a1a; margin: 0; padding: 0; }
  h1 { font-size: 16pt; font-weight: bold; margin-top: 1em; }
  h2 { font-size: 14pt; font-weight: bold; margin-top: 1em; }
  h3 { font-size: 13pt; font-weight: bold; margin-top: 0.8em; }
  p { margin-bottom: 0.8em; text-align: justify; }
  strong { font-weight: bold; }
  hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
  ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
  li { margin-bottom: 0.3em; }
`;

function ToolbarSeparator() {
  return <div className="w-px h-6 bg-border mx-0.5" />;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-accent transition-colors ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
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
  const editorRef = useRef<HTMLDivElement>(null);

  const currentText = isEditing ? editText : generatedText;

  // When entering edit mode, populate contentEditable with HTML
  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(editText);
    }
  }, [isEditing]);

  const execCmd = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      onEditChange(editorRef.current.innerText);
    }
  }, [onEditChange]);

  const handleSaveEdit = useCallback(() => {
    if (editorRef.current) {
      // Store the rich HTML for PDF export
      const el = documentRef.current;
      if (el) {
        el.innerHTML = editorRef.current.innerHTML;
      }
      onEditChange(editorRef.current.innerText);
    }
    onSaveEdit();
  }, [onSaveEdit, onEditChange]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(currentText);
    toast.success("Documento copiado!");
  }, [currentText]);

  const handlePrint = useCallback(() => {
    const sourceEl = isEditing ? editorRef.current : documentRef.current;
    if (!sourceEl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${templateTitle || "Documento"}</title><style>${PAGE_STYLE}</style></head><body>${sourceEl.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, [isEditing, templateTitle]);

  const handleDownloadPdf = useCallback(async () => {
    const sourceEl = isEditing ? editorRef.current : documentRef.current;
    if (!sourceEl) return;
    toast.info("Gerando PDF...");
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      // Create a temporary container with proper styling for PDF
      const tempDiv = document.createElement("div");
      tempDiv.style.fontFamily = "'Georgia', 'Times New Roman', serif";
      tempDiv.style.fontSize = "12pt";
      tempDiv.style.lineHeight = "1.7";
      tempDiv.style.color = "#1a1a1a";
      tempDiv.innerHTML = sourceEl.innerHTML;
      document.body.appendChild(tempDiv);
      
      await html2pdf()
        .set({
          margin: [20, 15, 20, 15],
          filename: `${templateTitle?.replace(/\s+/g, "_").toLowerCase() || "documento"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(tempDiv)
        .save();
      
      document.body.removeChild(tempDiv);
      toast.success("PDF salvo com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF. Tente imprimir como PDF.");
    }
  }, [isEditing, templateTitle]);

  const showToolbar = generatedText && !isGenerating;

  return (
    <div className="space-y-0">
      {/* Action Bar */}
      {showToolbar && !isEditing && (
        <div className="flex items-center justify-between px-4 py-2 rounded-t-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{templateTitle || "Documento"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onStartEdit} className="gap-1.5 text-xs">
              <Type className="w-3.5 h-3.5" /> Editar
            </Button>
            <ToolbarSeparator />
            <Button size="sm" variant="ghost" onClick={handleCopy} className="gap-1.5 text-xs">
              <Copy className="w-3.5 h-3.5" /> Copiar
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDownloadPdf} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </Button>
          </div>
        </div>
      )}

      {/* Rich Text Formatting Toolbar (edit mode) */}
      {isEditing && (
        <div className="sticky top-0 z-20 border border-border bg-card shadow-sm rounded-t-xl">
          {/* Row 1: Save/Cancel + Export */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Editando Documento</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={handleDownloadPdf} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button size="sm" variant="ghost" onClick={handlePrint} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </Button>
              <ToolbarSeparator />
              <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-500 gap-1.5 text-xs">
                <Check className="w-3.5 h-3.5" /> Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit} className="text-destructive hover:text-destructive/80 gap-1.5 text-xs">
                <X className="w-3.5 h-3.5" /> Cancelar
              </Button>
            </div>
          </div>
          {/* Row 2: Formatting tools */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 flex-wrap">
            {/* Font Family */}
            <Select defaultValue="Georgia" onValueChange={(v) => execCmd("fontName", v)}>
              <SelectTrigger className="h-7 w-[130px] text-xs border-none bg-transparent hover:bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Calibri">Calibri</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
              </SelectContent>
            </Select>

            {/* Font Size */}
            <Select defaultValue="3" onValueChange={(v) => execCmd("fontSize", v)}>
              <SelectTrigger className="h-7 w-[65px] text-xs border-none bg-transparent hover:bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">8pt</SelectItem>
                <SelectItem value="2">10pt</SelectItem>
                <SelectItem value="3">12pt</SelectItem>
                <SelectItem value="4">14pt</SelectItem>
                <SelectItem value="5">18pt</SelectItem>
                <SelectItem value="6">24pt</SelectItem>
                <SelectItem value="7">36pt</SelectItem>
              </SelectContent>
            </Select>

            <ToolbarSeparator />

            {/* Text Style */}
            <ToolbarButton onClick={() => execCmd("bold")} title="Negrito (Ctrl+B)">
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCmd("italic")} title="Itálico (Ctrl+I)">
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCmd("underline")} title="Sublinhado (Ctrl+U)">
              <Underline className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Alignment */}
            <ToolbarButton onClick={() => execCmd("justifyLeft")} title="Alinhar à Esquerda">
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCmd("justifyCenter")} title="Centralizar">
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCmd("justifyRight")} title="Alinhar à Direita">
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCmd("justifyFull")} title="Justificar">
              <AlignJustify className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Lists */}
            <ToolbarButton onClick={() => execCmd("insertUnorderedList")} title="Lista com Marcadores">
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCmd("insertOrderedList")} title="Lista Numerada">
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Undo/Redo */}
            <ToolbarButton onClick={() => execCmd("undo")} title="Desfazer (Ctrl+Z)">
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => execCmd("redo")} title="Refazer (Ctrl+Y)">
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* Document Canvas */}
      <div
        className={`bg-muted/50 border border-border ${(showToolbar || isEditing) ? "rounded-b-xl border-t-0" : "rounded-xl"} py-8 px-4 overflow-auto`}
        style={{ minHeight: "60vh", maxHeight: "80vh" }}
      >
        {isEditing ? (
          <div className="mx-auto" style={{ maxWidth: "210mm" }}>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-200 focus:outline-none"
              style={{
                padding: "20mm 18mm",
                minHeight: "297mm",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: "#1a1a1a",
                fontSize: "12pt",
                lineHeight: "1.7",
              }}
            />
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
              <p className="text-sm font-medium text-muted-foreground">Preencha os dados e clique em "Gerar com IA"</p>
              <p className="text-xs mt-1 text-muted-foreground/70">O documento será exibido aqui no formato A4, pronto para PDF</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
