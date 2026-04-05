import { useRef, useCallback, useEffect, useState } from "react";
import {
  FileText, Copy, Download, Printer, Check, X, Sparkles,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, Type, Minus,
  Heading1, Heading2, Heading3, Pilcrow, IndentIncrease, IndentDecrease,
  Palette, Highlighter, RemoveFormatting,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

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

/* ─── helpers ─── */

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
      const t = block.trim();
      if (!t) return "";
      if (t.startsWith("<h") || t.startsWith("<ul") || t.startsWith("<hr") || t.startsWith("<li")) return t;
      return `<p style="margin-bottom:10px;line-height:1.8;text-align:justify;">${t.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
  return html;
}

const PAGE_HEIGHT_PX = 1122; // A4 proportional at 96dpi
const PAGE_PADDING_PX = 76; // ~20mm
const CONTENT_HEIGHT = PAGE_HEIGHT_PX - PAGE_PADDING_PX * 2;

const PAGE_STYLE = `
  @page { margin: 20mm; size: A4; }
  body { font-family: 'Georgia','Times New Roman',serif; font-size: 12pt; line-height: 1.7; color: #1a1a1a; margin:0; padding:0; }
  h1 { font-size:16pt; font-weight:bold; margin-top:1em; }
  h2 { font-size:14pt; font-weight:bold; margin-top:1em; }
  h3 { font-size:13pt; font-weight:bold; margin-top:0.8em; }
  p { margin-bottom:0.8em; text-align:justify; }
  strong { font-weight:bold; }
  hr { border:none; border-top:1px solid #ccc; margin:1em 0; }
  ul, ol { margin:0.5em 0; padding-left:1.5em; }
  li { margin-bottom:0.3em; }
`;

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc",
  "#c0392b", "#e74c3c", "#e67e22", "#f39c12", "#f1c40f",
  "#27ae60", "#2ecc71", "#1abc9c", "#2980b9", "#3498db",
  "#8e44ad", "#9b59b6", "#e91e63", "#795548", "#607d8b",
];

const HIGHLIGHT_COLORS = [
  "transparent", "#ffff00", "#00ff00", "#00ffff", "#ff00ff",
  "#ff0000", "#0000ff", "#ffa500", "#ffb6c1", "#98fb98",
];

/* ─── sub-components ─── */

function ToolbarSep() {
  return <div className="w-px h-6 bg-border mx-0.5 shrink-0" />;
}

function TBtn({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded hover:bg-accent transition-colors shrink-0 ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function ColorPicker({ icon: Icon, title, onSelect }: { icon: React.ElementType; title: string; onSelect: (c: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button title={title} className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <Icon className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-5 gap-1">
          {(title.includes("destaque") ? HIGHLIGHT_COLORS : COLORS).map((c) => (
            <button
              key={c}
              className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
              style={{ background: c === "transparent" ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 12px 12px" : c }}
              onClick={() => onSelect(c)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ─── Paginated wrapper ─── */

function PaginatedPages({ html, containerRef }: { html: string; containerRef?: React.Ref<HTMLDivElement> }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!measureRef.current) return;
    const measure = () => {
      const h = measureRef.current!.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(h / CONTENT_HEIGHT)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(measureRef.current);
    return () => ro.disconnect();
  }, [html]);

  return (
    <div className="space-y-6">
      {Array.from({ length: pageCount }).map((_, i) => (
        <div key={i} className="mx-auto relative" style={{ maxWidth: "210mm" }}>
          <div
            className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden"
            style={{
              height: `${PAGE_HEIGHT_PX}px`,
              padding: `${PAGE_PADDING_PX}px`,
              fontFamily: "'Georgia','Times New Roman',serif",
              color: "#1a1a1a",
              fontSize: "12pt",
              lineHeight: "1.7",
              position: "relative",
            }}
          >
            <div
              ref={i === 0 ? containerRef : undefined}
              style={{
                marginTop: `-${i * CONTENT_HEIGHT}px`,
                minHeight: `${CONTENT_HEIGHT}px`,
              }}
            >
              {i === 0 && (
                <div
                  ref={measureRef}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
              {i > 0 && (
                <div dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
            {/* Page number footer */}
            <div
              className="absolute bottom-3 left-0 right-0 text-center text-xs text-gray-400"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Página {i + 1} de {pageCount}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Editable paginated ─── */

function EditablePages({ editorRef, onInput }: { editorRef: React.RefObject<HTMLDivElement>; onInput: () => void }) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(h / CONTENT_HEIGHT)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [editorRef]);

  return (
    <div className="space-y-6">
      {Array.from({ length: pageCount }).map((_, i) => (
        <div key={i} className="mx-auto relative" style={{ maxWidth: "210mm" }}>
          <div
            className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden"
            style={{
              height: `${PAGE_HEIGHT_PX}px`,
              padding: `${PAGE_PADDING_PX}px`,
              fontFamily: "'Georgia','Times New Roman',serif",
              color: "#1a1a1a",
              fontSize: "12pt",
              lineHeight: "1.7",
              position: "relative",
            }}
          >
            {i === 0 ? (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={onInput}
                className="focus:outline-none"
                style={{ minHeight: `${CONTENT_HEIGHT}px` }}
              />
            ) : (
              <div
                style={{ marginTop: `-${i * CONTENT_HEIGHT}px`, pointerEvents: "none" }}
                dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || "" }}
              />
            )}
            <div
              className="absolute bottom-3 left-0 right-0 text-center text-xs text-gray-400"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Página {i + 1} de {pageCount}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ─── */

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
  const [lineSpacing, setLineSpacing] = useState("1.7");

  const currentText = isEditing ? editText : generatedText;

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
      const el = documentRef.current;
      if (el) el.innerHTML = editorRef.current.innerHTML;
      onEditChange(editorRef.current.innerText);
    }
    onSaveEdit();
  }, [onSaveEdit, onEditChange]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(currentText);
    toast.success("Documento copiado!");
  }, [currentText]);

  const handlePrint = useCallback(() => {
    const src = isEditing ? editorRef.current : documentRef.current;
    if (!src) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${templateTitle || "Documento"}</title><style>${PAGE_STYLE}</style></head><body>${src.innerHTML}</body></html>`);
    w.document.close(); w.focus(); w.print(); w.close();
  }, [isEditing, templateTitle]);

  const handleDownloadPdf = useCallback(async () => {
    const src = isEditing ? editorRef.current : documentRef.current;
    if (!src) return;
    toast.info("Gerando PDF...");
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const tmp = document.createElement("div");
      tmp.style.fontFamily = "'Georgia','Times New Roman',serif";
      tmp.style.fontSize = "12pt";
      tmp.style.lineHeight = lineSpacing;
      tmp.style.color = "#1a1a1a";
      tmp.innerHTML = src.innerHTML;
      document.body.appendChild(tmp);
      await html2pdf().set({
        margin: [20, 15, 20, 15],
        filename: `${templateTitle?.replace(/\s+/g, "_").toLowerCase() || "documento"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      }).from(tmp).save();
      document.body.removeChild(tmp);
      toast.success("PDF salvo com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF.");
    }
  }, [isEditing, templateTitle, lineSpacing]);

  const applyLineSpacing = useCallback((val: string) => {
    setLineSpacing(val);
    if (editorRef.current) {
      editorRef.current.style.lineHeight = val;
    }
  }, []);

  const showToolbar = generatedText && !isGenerating;

  return (
    <div className="space-y-0">
      {/* ─── View mode bar ─── */}
      {showToolbar && !isEditing && (
        <div className="flex items-center justify-between px-4 py-2 rounded-t-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{templateTitle || "Documento"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onStartEdit} className="gap-1.5 text-xs"><Type className="w-3.5 h-3.5" /> Editar</Button>
            <ToolbarSep />
            <Button size="sm" variant="ghost" onClick={handleCopy} className="gap-1.5 text-xs"><Copy className="w-3.5 h-3.5" /> Copiar</Button>
            <Button size="sm" variant="ghost" onClick={handleDownloadPdf} className="gap-1.5 text-xs"><Download className="w-3.5 h-3.5" /> PDF</Button>
            <Button size="sm" variant="ghost" onClick={handlePrint} className="gap-1.5 text-xs"><Printer className="w-3.5 h-3.5" /> Imprimir</Button>
          </div>
        </div>
      )}

      {/* ─── Edit mode toolbar (3 rows) ─── */}
      {isEditing && (
        <div className="sticky top-0 z-20 border border-border bg-card shadow-sm rounded-t-xl">
          {/* Row 1: Actions */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Editando Documento</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={handleCopy} className="gap-1.5 text-xs"><Copy className="w-3.5 h-3.5" /> Copiar</Button>
              <Button size="sm" variant="ghost" onClick={handleDownloadPdf} className="gap-1.5 text-xs"><Download className="w-3.5 h-3.5" /> PDF</Button>
              <Button size="sm" variant="ghost" onClick={handlePrint} className="gap-1.5 text-xs"><Printer className="w-3.5 h-3.5" /> Imprimir</Button>
              <ToolbarSep />
              <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-500 gap-1.5 text-xs"><Check className="w-3.5 h-3.5" /> Salvar</Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit} className="text-destructive hover:text-destructive/80 gap-1.5 text-xs"><X className="w-3.5 h-3.5" /> Cancelar</Button>
            </div>
          </div>

          {/* Row 2: Font + Style */}
          <div className="flex items-center gap-0.5 px-3 py-1 border-b border-border flex-wrap">
            <Select defaultValue="Georgia" onValueChange={(v) => execCmd("fontName", v)}>
              <SelectTrigger className="h-7 w-[130px] text-xs border-none bg-transparent hover:bg-accent"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Calibri">Calibri</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="3" onValueChange={(v) => execCmd("fontSize", v)}>
              <SelectTrigger className="h-7 w-[65px] text-xs border-none bg-transparent hover:bg-accent"><SelectValue /></SelectTrigger>
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

            <ToolbarSep />

            <TBtn onClick={() => execCmd("bold")} title="Negrito (Ctrl+B)"><Bold className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => execCmd("italic")} title="Itálico (Ctrl+I)"><Italic className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => execCmd("underline")} title="Sublinhado (Ctrl+U)"><Underline className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => execCmd("strikeThrough")} title="Tachado"><Strikethrough className="w-4 h-4" /></TBtn>

            <ToolbarSep />

            <ColorPicker icon={Palette} title="Cor do texto" onSelect={(c) => execCmd("foreColor", c)} />
            <ColorPicker icon={Highlighter} title="Cor de destaque" onSelect={(c) => execCmd("hiliteColor", c)} />
            <TBtn onClick={() => execCmd("removeFormat")} title="Limpar formatação"><RemoveFormatting className="w-4 h-4" /></TBtn>
          </div>

          {/* Row 3: Alignment + Structure */}
          <div className="flex items-center gap-0.5 px-3 py-1 flex-wrap">
            {/* Headings */}
            <Select defaultValue="p" onValueChange={(v) => execCmd("formatBlock", v)}>
              <SelectTrigger className="h-7 w-[110px] text-xs border-none bg-transparent hover:bg-accent"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="p">Normal</SelectItem>
                <SelectItem value="h1">Título 1</SelectItem>
                <SelectItem value="h2">Título 2</SelectItem>
                <SelectItem value="h3">Título 3</SelectItem>
              </SelectContent>
            </Select>

            <ToolbarSep />

            <TBtn onClick={() => execCmd("justifyLeft")} title="Alinhar à esquerda"><AlignLeft className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => execCmd("justifyCenter")} title="Centralizar"><AlignCenter className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => execCmd("justifyRight")} title="Alinhar à direita"><AlignRight className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => execCmd("justifyFull")} title="Justificar"><AlignJustify className="w-4 h-4" /></TBtn>

            <ToolbarSep />

            <TBtn onClick={() => execCmd("insertUnorderedList")} title="Lista com marcadores"><List className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => execCmd("insertOrderedList")} title="Lista numerada"><ListOrdered className="w-4 h-4" /></TBtn>

            <ToolbarSep />

            <TBtn onClick={() => execCmd("indent")} title="Aumentar recuo"><IndentIncrease className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => execCmd("outdent")} title="Diminuir recuo"><IndentDecrease className="w-4 h-4" /></TBtn>

            <ToolbarSep />

            <TBtn onClick={() => execCmd("insertHorizontalRule")} title="Linha horizontal"><Minus className="w-4 h-4" /></TBtn>

            <ToolbarSep />

            {/* Line spacing */}
            <Select value={lineSpacing} onValueChange={applyLineSpacing}>
              <SelectTrigger className="h-7 w-[70px] text-xs border-none bg-transparent hover:bg-accent"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1.0">1.0</SelectItem>
                <SelectItem value="1.15">1.15</SelectItem>
                <SelectItem value="1.5">1.5</SelectItem>
                <SelectItem value="1.7">1.7</SelectItem>
                <SelectItem value="2.0">2.0</SelectItem>
              </SelectContent>
            </Select>

            <ToolbarSep />

            <TBtn onClick={() => execCmd("undo")} title="Desfazer (Ctrl+Z)"><Undo className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => execCmd("redo")} title="Refazer (Ctrl+Y)"><Redo className="w-4 h-4" /></TBtn>
          </div>
        </div>
      )}

      {/* ─── Document Canvas (paginated) ─── */}
      <div
        className={`bg-muted/50 border border-border ${(showToolbar || isEditing) ? "rounded-b-xl border-t-0" : "rounded-xl"} py-8 px-4 overflow-auto`}
        style={{ minHeight: "60vh", maxHeight: "85vh" }}
      >
        {isEditing ? (
          <EditablePages editorRef={editorRef as React.RefObject<HTMLDivElement>} onInput={handleEditorInput} />
        ) : generatedText ? (
          <>
            <PaginatedPages html={markdownToHtml(generatedText)} containerRef={documentRef} />
            {isGenerating && (
              <div className="flex justify-center py-4">
                <span className="inline-block w-2 h-5 bg-primary animate-pulse rounded-sm" />
              </div>
            )}
          </>
        ) : (
          <div className="mx-auto" style={{ maxWidth: "210mm" }}>
            <div
              className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-200 flex flex-col items-center justify-center"
              style={{ minHeight: `${PAGE_HEIGHT_PX}px`, padding: `${PAGE_PADDING_PX}px` }}
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
