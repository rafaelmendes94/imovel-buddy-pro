/**
 * BETA — Importar tabela em PDF (vários imóveis) para a carteira do corretor logado.
 * Fluxo isolado do cadastro manual: Upload → Leitura → Revisão editável → Importação.
 */

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  AlertTriangle, Ban, CheckCircle2, ChevronRight, FileText, Loader2, Pencil,
  Upload, X, Copy, FlaskConical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  buildImovelPayload, chunkPages, completeness, dupeKeys,
  extractImoveisFromChunk, normalizeAiImovel, readPdf,
  type NormalizedImovel,
} from "@/lib/pdfTabelaImport";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/propertyTypeRules";

type Step = "upload" | "reading" | "review" | "importing" | "result";

interface Item {
  id: string;
  page: number;
  data: NormalizedImovel;
  selected: boolean;
  sold: boolean;
  ignored: boolean;
  dupe: boolean;
  missing: string[];
}

const TIPOS = [...PROPERTY_TYPE_OPTIONS];

export function ImportPdfTabelaBeta({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { user, profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [phase, setPhase] = useState("");
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState({ created: 0, failed: [] as string[] });

  const reset = () => {
    setStep("upload");
    setPhase("");
    setFileName("");
    setItems([]);
    setThumbs({});
    setEditing(null);
    setResult({ created: 0, failed: [] });
  };

  const close = () => {
    if (step === "importing" || step === "reading") return;
    onClose();
    reset();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Envie um arquivo PDF.");
      return;
    }
    if (!user) {
      toast.error("Faça login para importar.");
      return;
    }
    setFileName(file.name);
    setStep("reading");
    try {
      setPhase("Lendo PDF...");
      const { pages, thumbs: th } = await readPdf(file, (done, total) =>
        setPhase(`Lendo PDF... página ${done} de ${total}`),
      );
      setThumbs(th);
      const hasText = pages.some((p) => p.text.length > 20);
      if (!hasText) {
        toast.error("Não foi possível ler texto neste PDF (parece ser só imagem/digitalizado).");
        setStep("upload");
        return;
      }

      setPhase("Identificando imóveis...");
      const chunks = chunkPages(pages);
      const raw = [];
      for (let i = 0; i < chunks.length; i++) {
        setPhase(`Identificando imóveis... bloco ${i + 1} de ${chunks.length}`);
        const part = await extractImoveisFromChunk(chunks[i]);
        raw.push(...part);
      }

      setPhase("Organizando dados...");
      const existing = await loadExistingKeys();
      const seen = new Set<string>();
      const list: Item[] = raw.map((ai, idx) => {
        const data = normalizeAiImovel(ai);
        const comp = completeness(data);
        const keys = dupeKeys(data);
        const dupe = keys.some((k) => existing.has(k) || seen.has(k));
        keys.forEach((k) => seen.add(k));
        const sold = !!ai.vendido;
        const ignored = !!ai.dados_insuficientes || (sold && !comp.ok);
        return {
          id: `${idx}`,
          page: Number(ai.pagina) || 0,
          data,
          sold,
          dupe,
          ignored,
          missing: comp.missing,
          selected: !sold && !dupe && !ignored && comp.ok,
        };
      });

      if (list.length === 0) {
        toast.error("Nenhum imóvel foi identificado nesta tabela.");
        setStep("upload");
        return;
      }
      setItems(list);
      setStep("review");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao ler a tabela em PDF.");
      setStep("upload");
    }
  };

  const loadExistingKeys = async () => {
    const set = new Set<string>();
    if (!user) return set;
    const { data } = await supabase
      .from("imoveis")
      .select("empreendimento, unidade, quadra, lote, endereco, numero")
      .eq("user_id", user.id)
      .limit(2000);
    (data || []).forEach((r: any) =>
      dupeKeys({
        empreendimento: r.empreendimento || "",
        unidade: r.unidade || "",
        quadra: r.quadra || "",
        lote: r.lote || "",
        endereco: r.endereco || "",
        numero: r.numero || "",
      } as NormalizedImovel).forEach((k) => set.add(k)),
    );
    return set;
  };

  const selectable = items.filter((i) => !i.ignored);
  const selected = items.filter((i) => i.selected && !i.ignored);
  const summary = useMemo(
    () => ({
      total: items.length,
      selected: selected.length,
      sold: items.filter((i) => i.sold).length,
      dupes: items.filter((i) => i.dupe).length,
      ignored: items.filter((i) => i.ignored).length,
    }),
    [items, selected.length],
  );

  const patch = (id: string, data: Partial<NormalizedImovel>) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i.data, ...data };
        return { ...i, data: next, missing: completeness(next).missing };
      }),
    );

  const doImport = async () => {
    if (!user || selected.length === 0) return;
    setStep("importing");
    setProgress({ done: 0, total: selected.length });
    let created = 0;
    const failed: string[] = [];

    for (const item of selected) {
      try {
        const payload = buildImovelPayload(item.data, user.id, profile?.full_name);
        const { error } = await supabase.from("imoveis").insert([payload] as any);
        if (error) throw error;
        created++;
      } catch (err: any) {
        const msg = String(err?.message || "erro");
        failed.push(
          `${item.data.titulo}: ${
            /row-level security|permission/i.test(msg) ? "sem permissão" : /Limite de/i.test(msg) ? msg : msg
          }`,
        );
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setResult({ created, failed });
    setStep("result");
    if (created > 0) {
      toast.success(`${created} imóveis importados`);
      onImported();
    }
    if (failed.length) toast.error(`${failed.length} imóveis não foram importados`);
  };

  if (!open) return null;
  const editItem = items.find((i) => i.id === editing) || null;

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-foreground/60 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-card w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-card-foreground flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">Importar tabela PDF</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">BETA</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {fileName || "Vários imóveis de uma tabela em PDF para os seus imóveis"}
            </p>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {step === "upload" && (
            <div className="flex flex-col items-center text-center gap-3 py-8">
              <FileText className="w-14 h-14 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-foreground">Envie a sua tabela em PDF</p>
                <p className="text-sm text-muted-foreground mt-1">
                  A IA identifica cada imóvel e você revisa antes de gravar. Nada é salvo sem a sua confirmação.
                </p>
              </div>
              <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
              >
                <Upload className="w-4 h-4" /> Escolher PDF
              </button>
            </div>
          )}

          {(step === "reading" || step === "importing") && (
            <div className="flex flex-col items-center gap-3 py-14">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {step === "reading" ? phase : `Importando ${progress.done} de ${progress.total}...`}
              </p>
              <p className="text-xs text-muted-foreground">Não feche esta janela.</p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/60 border border-border p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">{summary.total} imóveis encontrados</strong> · {summary.selected} selecionados ·{" "}
                {summary.sold} vendidos · {summary.dupes} possíveis duplicados
                {summary.ignored > 0 && ` · ${summary.ignored} ignorados`}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setItems((p) => p.map((i) => (i.ignored ? i : { ...i, selected: true })))}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-muted"
                >
                  Selecionar todos
                </button>
                <button
                  onClick={() => setItems((p) => p.map((i) => ({ ...i, selected: false })))}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-muted"
                >
                  Desmarcar todos
                </button>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border p-3 flex gap-3",
                    item.ignored ? "border-border bg-muted/40 opacity-70" : "border-border bg-card",
                  )}
                >
                  {!item.ignored && (
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) =>
                        setItems((p) => p.map((i) => (i.id === item.id ? { ...i, selected: e.target.checked } : i)))
                      }
                      className="mt-1 w-4 h-4 shrink-0 accent-primary"
                      aria-label={`Selecionar ${item.data.titulo}`}
                    />
                  )}
                  {thumbs[item.page] && (
                    <img
                      src={thumbs[item.page]}
                      alt={`Página ${item.page}`}
                      className="hidden sm:block w-14 h-20 object-cover rounded border border-border shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{item.data.titulo}</p>
                      {!item.ignored && (
                        <button
                          onClick={() => setEditing(item.id)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0"
                          aria-label="Editar imóvel"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {[
                        item.data.tipo,
                        item.data.unidade && `Un. ${item.data.unidade}`,
                        item.data.quadra && `Q${item.data.quadra}/L${item.data.lote}`,
                        item.data.box && `Box ${item.data.box}`,
                        item.data.bairro,
                        item.data.cidade,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {item.data.preco > 0
                        ? item.data.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
                        : "Preço não informado"}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.page > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">pág. {item.page}</span>
                      )}
                      {item.ignored ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground inline-flex items-center gap-1">
                          <Ban className="w-3 h-3" /> ignorado: vendido/sem dados suficientes
                        </span>
                      ) : (
                        <>
                          {item.sold && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">
                              Vendido
                            </span>
                          )}
                          {item.dupe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold inline-flex items-center gap-1">
                              <Copy className="w-3 h-3" /> Possível duplicado
                            </span>
                          )}
                          {item.missing.length > 0 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> falta {item.missing.join(", ")}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> completo
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === "result" && (
            <div className="flex flex-col items-center text-center gap-3 py-10">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              <p className="text-base font-bold text-foreground">{result.created} imóveis importados com sucesso</p>
              {result.failed.length > 0 && (
                <div className="w-full text-left rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-semibold text-destructive mb-1">
                    {result.failed.length} não foram importados:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {result.failed.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === "review" || step === "result") && (
          <div className="p-4 sm:p-5 border-t border-border flex flex-col sm:flex-row gap-2 sm:justify-end">
            {step === "review" ? (
              <>
                <button onClick={close} className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-muted">
                  Cancelar
                </button>
                <button
                  onClick={doImport}
                  disabled={selected.length === 0}
                  className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  Importar selecionados ({selected.length}) <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={close} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">
                Ver meus imóveis
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edição rápida */}
      {editItem && (
        <div className="fixed inset-0 z-[70] bg-foreground/60 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setEditing(null)}>
          <div
            className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl max-h-[88vh] overflow-y-auto p-4 sm:p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-card-foreground">Editar imóvel</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Fechar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Título" className="col-span-2" value={editItem.data.titulo} onChange={(v) => patch(editItem.id, { titulo: v })} />
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Tipo</label>
                <select
                  value={editItem.data.tipo}
                  onChange={(e) => patch(editItem.id, { tipo: e.target.value })}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm text-foreground"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <NumField label="Preço (R$)" value={editItem.data.preco} onChange={(v) => patch(editItem.id, { preco: v })} />
              <Field label="Empreendimento" value={editItem.data.empreendimento} onChange={(v) => patch(editItem.id, { empreendimento: v })} />
              <Field label="Unidade" value={editItem.data.unidade} onChange={(v) => patch(editItem.id, { unidade: v })} />
              <Field label="Quadra" value={editItem.data.quadra} onChange={(v) => patch(editItem.id, { quadra: v })} />
              <Field label="Lote" value={editItem.data.lote} onChange={(v) => patch(editItem.id, { lote: v })} />
              <Field label="Box" value={editItem.data.box} onChange={(v) => patch(editItem.id, { box: v })} />
              <NumField label="Vagas" value={editItem.data.vagas} onChange={(v) => patch(editItem.id, { vagas: v })} />
              <Field label="Cidade" value={editItem.data.cidade} onChange={(v) => patch(editItem.id, { cidade: v })} />
              <Field label="Bairro" value={editItem.data.bairro} onChange={(v) => patch(editItem.id, { bairro: v })} />
              <Field label="Rua" value={editItem.data.endereco} onChange={(v) => patch(editItem.id, { endereco: v })} />
              <Field label="Número" value={editItem.data.numero} onChange={(v) => patch(editItem.id, { numero: v })} />
              <NumField label="Dormitórios" value={editItem.data.quartos} onChange={(v) => patch(editItem.id, { quartos: v })} />
              <NumField label="Suítes" value={editItem.data.suites} onChange={(v) => patch(editItem.id, { suites: v })} />
              <NumField label="Banheiros" value={editItem.data.banheiros} onChange={(v) => patch(editItem.id, { banheiros: v })} />
              <NumField label="Área privativa (m²)" value={editItem.data.area_privativa} onChange={(v) => patch(editItem.id, { area_privativa: v })} />
              <NumField label="Área total (m²)" value={editItem.data.area} onChange={(v) => patch(editItem.id, { area: v })} />
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Descrição</label>
                <textarea
                  value={editItem.data.descricao}
                  onChange={(e) => patch(editItem.id, { descricao: e.target.value })}
                  rows={3}
                  className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-sm text-foreground"
                />
              </div>
            </div>
            <button
              onClick={() => setEditing(null)}
              className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
            >
              Salvar alterações
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

function Field({
  label, value, onChange, className,
}: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-[11px] font-semibold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm text-foreground"
      />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-muted-foreground">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm text-foreground"
      />
    </div>
  );
}
