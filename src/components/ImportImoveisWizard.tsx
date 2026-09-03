import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  X, Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Copy, Pencil, ArrowRight, ArrowLeft,
} from "lucide-react";
import {
  MV_COLUMN_MAP, isMvLayout, mapMvRow, validateMvRow, mergePreservingExisting, DEFAULT_IMPORT_ESTADO,
} from "@/lib/importMvImoveis";
import { LEGACY_COLUMN_MAP, mapLegacyRow, validateLegacyRow } from "@/lib/importLegacyImoveis";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

type RowStatus = "ready" | "review" | "duplicate" | "possible" | "error";
type DupAction = "ignore" | "update" | "new";

interface RowState {
  line: number;
  raw: any;
  mapped: any;
  status: RowStatus;
  reasons: string[];
  selected: boolean;
  action: DupAction;
  existingId?: string;
  existingLabel?: string;
}

type Step = "upload" | "review" | "importing" | "result";

const money = (v: number) =>
  v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—";

const STATUS_LABEL: Record<RowStatus, string> = {
  ready: "Pronto",
  review: "Revisar",
  duplicate: "Duplicado exato",
  possible: "Possível duplicidade",
  error: "Erro",
};

const STATUS_CLASS: Record<RowStatus, string> = {
  ready: "text-emerald-600",
  review: "text-amber-600",
  duplicate: "text-muted-foreground",
  possible: "text-orange-600",
  error: "text-destructive",
};

const EDITABLE: { key: string; label: string; type?: "number" | "bool" }[] = [
  { key: "titulo", label: "Título do anúncio" },
  { key: "empreendimento", label: "Empreendimento" },

  { key: "tipo", label: "Tipo" },
  { key: "endereco", label: "Endereço" },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "Estado" },
  { key: "bairro", label: "Bairro" },
  { key: "preco", label: "Preço", type: "number" },
  { key: "quartos", label: "Quartos", type: "number" },
  { key: "suites", label: "Suítes", type: "number" },
  { key: "banheiros", label: "Banheiros", type: "number" },
  { key: "area", label: "Área (m²)", type: "number" },
  { key: "unidade", label: "Unidade" },
  { key: "quadra", label: "Quadra" },
  { key: "lote", label: "Lote" },
  { key: "vagas", label: "Vagas", type: "number" },
  { key: "box", label: "Box" },
  { key: "condicao", label: "Condição" },
  { key: "decorado", label: "Decorado", type: "bool" },
  { key: "posicao_solar", label: "Posição solar" },
  { key: "padrao", label: "Padrão" },
  { key: "proprietario", label: "Proprietário" },
  { key: "proprietario_telefone", label: "Telefone" },
  { key: "local_chaves", label: "Chaves" },
];

export function ImportImoveisWizard({ open, onClose, onImported }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mvLayout, setMvLayout] = useState(false);
  const [rows, setRows] = useState<RowState[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ created: number; updated: number; ignored: number; fail: number } | null>(null);

  const columnMap = mvLayout ? MV_COLUMN_MAP : LEGACY_COLUMN_MAP;

  const counts = useMemo(() => {
    const c = { total: rows.length, ready: 0, review: 0, duplicate: 0, error: 0 };
    rows.forEach((r) => {
      if (r.status === "ready") c.ready++;
      else if (r.status === "review") c.review++;
      else if (r.status === "duplicate" || r.status === "possible") c.duplicate++;
      else c.error++;
    });
    return c;
  }, [rows]);

  // Por padrão registros em revisão/erro não importam; com "allowPending" o usuário força a importação.
  const importable = (r: RowState) => allowPending || (r.status !== "review" && r.status !== "error");
  const selectedRows = rows.filter((r) => r.selected && importable(r));



  const reset = () => {
    setStep("upload");
    setRows([]);
    setHeaders([]);
    setFileName("");
    setResult(null);
    setProgress({ done: 0, total: 0 });
  };

  const validate = (isMv: boolean, raw: any, mapped: any) =>
    isMv ? validateMvRow(raw) : validateLegacyRow(mapped);

  const handleFile = async (file: File) => {
    if (!user) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
    if (!json.length) { toast.error("Planilha vazia"); return; }

    const hs = Object.keys(json[0]);
    const isMv = isMvLayout(hs);
    setHeaders(hs);
    setMvLayout(isMv);

    const mappedRows = json.map((raw, i) => {
      const mapped = isMv ? mapMvRow(raw, user.id, DEFAULT_IMPORT_ESTADO) : mapLegacyRow(raw, user.id);
      const v = validate(isMv, raw, mapped);
      return {
        line: i + 2,
        raw,
        mapped,
        status: (v.ok ? "ready" : "review") as RowStatus,
        reasons: v.reasons,
        selected: v.ok,
        action: "ignore" as DupAction,
      };
    });

    // Deduplicação: fingerprints já importados + comparação auxiliar no banco
    const fps = mappedRows.map((r) => String(r.raw.exact_fingerprint ?? "").trim()).filter(Boolean);
    const softFps = mappedRows.map((r) => String(r.raw.fingerprint ?? "").trim()).filter(Boolean);
    const seenExact = new Set<string>();
    const seenSoft = new Set<string>();

    if (fps.length || softFps.length) {
      const { data } = await supabase
        .from("import_logs")
        .select("exact_fingerprint, fingerprint, imovel_id")
        .eq("user_id", user.id)
        .or(
          [
            fps.length ? `exact_fingerprint.in.(${fps.map((f) => `"${f}"`).join(",")})` : "",
            softFps.length ? `fingerprint.in.(${softFps.map((f) => `"${f}"`).join(",")})` : "",
          ].filter(Boolean).join(","),
        );
      (data ?? []).forEach((d: any) => {
        if (d.exact_fingerprint) seenExact.add(d.exact_fingerprint);
        if (d.fingerprint) seenSoft.add(d.fingerprint);
      });
    }

    const { data: existing } = await supabase
      .from("imoveis")
      .select("id, titulo, unidade, cidade, preco")
      .eq("user_id", user.id);

    const key = (t: any, u: any, c: any, p: any) =>
      `${String(t ?? "").trim().toLowerCase()}|${String(u ?? "").trim().toLowerCase()}|${String(c ?? "").trim().toLowerCase()}|${Number(p ?? 0)}`;
    const existingMap = new Map<string, { id: string; label: string }>();
    (existing ?? []).forEach((e: any) =>
      existingMap.set(key(e.titulo, e.unidade, e.cidade, e.preco), {
        id: e.id,
        label: `${e.titulo}${e.unidade ? ` · ${e.unidade}` : ""} · ${money(Number(e.preco))}`,
      }),
    );

    const withDupes = mappedRows.map((r) => {
      const exact = String(r.raw.exact_fingerprint ?? "").trim();
      const soft = String(r.raw.fingerprint ?? "").trim();
      const match = existingMap.get(key(r.mapped.titulo, r.mapped.unidade, r.mapped.cidade, r.mapped.preco));
      const dup =
        exact && seenExact.has(exact) ? "já importado (exact_fingerprint)"
        : match || (soft && seenSoft.has(soft)) ? "possível duplicidade"
        : "";
      if (!dup) return r;
      // Revisão tem prioridade sobre duplicidade: linha com problema nunca importa direto.
      const status: RowStatus =
        r.status === "review" ? "review" : exact && seenExact.has(exact) ? "duplicate" : "possible";
      return { ...r, status, selected: false, reasons: [...r.reasons, dup], existingId: match?.id, existingLabel: match?.label };
    });



    setRows(withDupes);
    setStep("review");
    toast.success(`${withDupes.length} linhas processadas`);
  };

  const patchRow = (line: number, patch: Partial<RowState>) =>
    setRows((prev) => prev.map((r) => (r.line === line ? { ...r, ...patch } : r)));

  const saveEdit = (line: number, mapped: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.line !== line) return r;
        const v = mvLayout
          ? { ok: !!mapped.cidade && mapped.preco > 0 && !!mapped.titulo && !!mapped.tipo, reasons: [] as string[] }
          : validateLegacyRow(mapped);
        const reasons = v.ok ? [] : ["revisar campos obrigatórios (cidade, preço, título, tipo)"];
        const status: RowStatus =
          r.status === "duplicate" || r.status === "possible" ? r.status : v.ok ? "ready" : "review";
        return { ...r, mapped, reasons, status, selected: v.ok ? r.selected : false };
      }),
    );
    setEditing(null);
  };

  const doImport = async () => {
    if (!user || selectedRows.length === 0) return;
    setStep("importing");
    const batchId = crypto.randomUUID();
    let created = 0, updated = 0, ignored = 0, fail = 0;
    setProgress({ done: 0, total: selectedRows.length });

    for (const r of selectedRows) {
      const isDupe = r.status === "duplicate" || r.status === "possible";
      let imovelId: string | null = null;
      let error: string | null = null;

      try {
        if (isDupe && r.action === "ignore") {
          ignored++;
        } else if (isDupe && r.action === "update" && r.existingId) {
          const { data: current } = await supabase.from("imoveis").select("*").eq("id", r.existingId).maybeSingle();
          const merged = current ? mergePreservingExisting(current as any, r.mapped) : r.mapped;
          const { user_id: _u, id: _i, ...payload } = merged as any;
          const { error: e } = await supabase.from("imoveis").update(payload).eq("id", r.existingId);
          if (e) throw e;
          imovelId = r.existingId;
          updated++;
        } else {
          const { data, error: e } = await supabase.from("imoveis").insert(r.mapped as any).select("id").single();
          if (e) throw e;
          imovelId = data.id;
          created++;
        }
      } catch (e: any) {
        error = e?.message ?? String(e);
        fail++;
      }

      await supabase.from("import_logs").insert({
        user_id: user.id,
        file_name: fileName,
        batch_id: batchId,
        row_number: r.line,
        raw_data: r.raw,
        normalized_data: r.mapped,
        status: error ? "erro" : imovelId ? (updated && imovelId === r.existingId ? "atualizado" : "criado") : "ignorado",
        error,
        warning: r.reasons.join("; ") || null,
        fingerprint: String(r.raw.fingerprint ?? "") || null,
        exact_fingerprint: String(r.raw.exact_fingerprint ?? "") || null,
        imovel_id: imovelId,
      } as any);

      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setResult({ created, updated, ignored, fail });
    setStep("result");
    if (created + updated > 0) { toast.success(`${created + updated} imóveis gravados`); onImported(); }
    if (fail > 0) toast.error(`${fail} falhas`);
  };

  if (!open) return null;
  const editingRow = rows.find((r) => r.line === editing) ?? null;

  return (
    <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">Importar imóveis do Excel</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {["Upload", "Validação", "Revisão", "Importação", "Resultado"].map((s, i) => {
                const active =
                  (step === "upload" && i === 0) ||
                  (step === "review" && (i === 1 || i === 2)) ||
                  (step === "importing" && i === 3) ||
                  (step === "result" && i === 4);
                return (
                  <span key={s} className={active ? "text-primary font-semibold" : ""}>
                    {i > 0 && " › "}{s}
                  </span>
                );
              })}
            </p>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {step === "upload" && (
            <>
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-foreground">Layouts aceitos</p>
                <p>• Planilha normalizada MV (<code>property_name, property_type, price_brl, unit_reference…</code>) — detectada automaticamente, estado padrão <strong>{DEFAULT_IMPORT_ESTADO}</strong>.</p>
                <p>• Planilha legada em português (EMPREENDIMENTO, TIPO, VALOR, BAIRRO…).</p>
                <p>Nenhum dado existente é apagado: valores vazios da planilha nunca sobrescrevem informação já cadastrada.</p>
              </div>
              <label className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors">
                <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
                <span className="text-sm font-medium text-card-foreground">Selecionar arquivo .xlsx / .csv</span>
                <span className="text-xs text-muted-foreground">A primeira aba da planilha será usada</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </>
          )}

          {step === "review" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                {[
                  { l: "Total", v: counts.total, c: "text-foreground" },
                  { l: "Prontos", v: counts.ready, c: "text-emerald-600" },
                  { l: "Revisar", v: counts.review, c: "text-amber-600" },
                  { l: "Duplicados", v: counts.duplicate, c: "text-orange-600" },
                  { l: "Erros", v: counts.error, c: "text-destructive" },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg border border-border bg-muted/30 p-2">
                    <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
                    <p className="text-[11px] text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  {fileName} · layout {mvLayout ? "normalizado MV" : "legado"} · {selectedRows.length} selecionados
                </span>
                <button
                  onClick={() => setRows((p) => p.map((r) => ({ ...r, selected: r.status === "ready" })))}
                  className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground font-medium"
                >
                  Selecionar todos os válidos
                </button>
                <button
                  onClick={() => setRows((p) => p.map((r) => ({ ...r, selected: importable(r) && r.action !== "ignore" ? true : r.status === "ready" })))}
                  className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground font-medium"
                >
                  Selecionar prontos + duplicidades resolvidas
                </button>

                <button
                  onClick={() => setRows((p) => p.map((r) => ({ ...r, selected: false })))}
                  className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground font-medium"
                >
                  Limpar seleção
                </button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-auto max-h-[45vh]">
                  <table className="text-xs w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        {["", "Linha", "Título", "Empreendimento", "Tipo", "Unidade", "Box", "Cidade", "Bairro", "Preço", "Qtos", "Suítes", "Área", "Proprietário", "Telefone", "Status", "Problema", ""].map((h, i) => (
                          <th key={`${h}-${i}`} className="px-2 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.line} className="border-t border-border hover:bg-muted/20">
                          <td className="px-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={r.selected && importable(r)}
                              disabled={!importable(r)}
                              title={importable(r) ? "" : "Corrija a linha na revisão para poder importar"}
                              onChange={(e) => patchRow(r.line, { selected: e.target.checked })}
                              className="accent-primary disabled:opacity-40"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-muted-foreground">{r.line}</td>
                          <td className="px-2 py-1.5 text-foreground max-w-[180px] truncate">{r.mapped.titulo}</td>
                          <td className="px-2 py-1.5 max-w-[150px] truncate">{r.mapped.empreendimento || "—"}</td>
                          <td className="px-2 py-1.5">{r.mapped.tipo}</td>
                          <td className="px-2 py-1.5">{r.mapped.unidade || [r.mapped.quadra && `QD ${r.mapped.quadra}`, r.mapped.lote && `LT ${r.mapped.lote}`].filter(Boolean).join(" ") || "—"}</td>
                          <td className="px-2 py-1.5">{r.mapped.box || "—"}</td>
                          <td className="px-2 py-1.5">{r.mapped.cidade || "—"}</td>
                          <td className="px-2 py-1.5">{r.mapped.bairro || "—"}</td>

                          <td className="px-2 py-1.5 whitespace-nowrap">{money(Number(r.mapped.preco))}</td>
                          <td className="px-2 py-1.5">{r.mapped.quartos || "—"}</td>
                          <td className="px-2 py-1.5">{r.mapped.suites || "—"}</td>
                          <td className="px-2 py-1.5">{r.mapped.area || "—"}</td>

                          <td className="px-2 py-1.5 max-w-[130px] truncate">{r.mapped.proprietario || "—"}</td>
                          <td className="px-2 py-1.5 whitespace-nowrap">{r.mapped.proprietario_telefone || "—"}</td>
                          <td className={`px-2 py-1.5 font-medium whitespace-nowrap ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</td>
                          <td className="px-2 py-1.5 text-amber-600 max-w-[180px]">
                            {r.reasons.join(", ") || "—"}
                            {(r.status === "duplicate" || r.status === "possible") && (
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                {r.existingLabel && <span className="text-[10px] text-muted-foreground block w-full truncate">Existente: {r.existingLabel}</span>}
                                {(["ignore", "update", "new"] as DupAction[]).map((a) => (
                                  <button
                                    key={a}
                                    disabled={a === "update" && !r.existingId}
                                    onClick={() => patchRow(r.line, { action: a, selected: a !== "ignore" })}
                                    className={`px-1.5 py-0.5 rounded text-[10px] border ${r.action === a ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"} disabled:opacity-40`}
                                  >
                                    {a === "ignore" ? "Ignorar" : a === "update" ? "Atualizar" : "Importar novo"}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-1.5">
                            <button onClick={() => setEditing(r.line)} className="p-1 rounded hover:bg-muted" title="Editar registro">
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium">Ver mapeamento de colunas</summary>
                <div className="mt-2 grid sm:grid-cols-2 gap-1">
                  {headers.map((h) => (
                    <div key={h} className="flex items-center gap-2">
                      <Copy className="w-3 h-3 shrink-0" />
                      <span className="text-foreground truncate">{h}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                      {columnMap[h] ? <span className="text-primary truncate">{columnMap[h]}</span> : <span className="italic">ignorada</span>}
                    </div>
                  ))}
                </div>
              </details>
            </>
          )}

          {step === "importing" && (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-card-foreground font-medium">Importando {progress.done}/{progress.total}</p>
              <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {step === "result" && result && (
            <div className="py-10 flex flex-col items-center gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { l: "Criados", v: result.created },
                  { l: "Atualizados", v: result.updated },
                  { l: "Ignorados", v: result.ignored },
                  { l: "Falhas", v: result.fail },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg border border-border bg-muted/30 p-3 min-w-[90px]">
                    <p className="text-lg font-bold text-foreground">{s.v}</p>
                    <p className="text-[11px] text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Auditoria gravada por linha (arquivo, dados originais e imóvel criado).
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 p-5 border-t border-border">
          {step === "review" ? (
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" /> Trocar arquivo
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button onClick={() => { reset(); onClose(); }} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
              {step === "result" ? "Fechar" : "Cancelar"}
            </button>
            {step === "review" && (
              <button
                onClick={doImport}
                disabled={selectedRows.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Upload className="w-4 h-4" /> Importar {selectedRows.length} selecionados
              </button>
            )}
          </div>
        </div>
      </div>

      {editingRow && (
        <EditRowDrawer row={editingRow} onCancel={() => setEditing(null)} onSave={(m) => saveEdit(editingRow.line, m)} />
      )}
    </div>
  );
}

function EditRowDrawer({ row, onCancel, onSave }: { row: RowState; onCancel: () => void; onSave: (mapped: any) => void }) {
  const [form, setForm] = useState<any>({ ...row.mapped });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-foreground/60 z-[60] flex items-center justify-end" onClick={onCancel}>
      <div className="bg-card h-full w-full max-w-md border-l border-border flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border">
          <h3 className="text-base font-bold text-card-foreground">Revisar linha {row.line}</h3>
          <p className="text-xs text-muted-foreground mt-1">{row.reasons.join(", ") || "Ajuste os campos antes de importar."}</p>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {EDITABLE.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
              {f.type === "bool" ? (
                <label className="flex items-center gap-2 text-sm mt-1">
                  <input type="checkbox" checked={!!form[f.key]} onChange={(e) => set(f.key, e.target.checked)} className="accent-primary" />
                  {form[f.key] ? "Sim" : "Não"}
                </label>
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                />
              )}
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Condições de pagamento (uma por linha)</label>
            <textarea
              value={(form.condicoes_pagamento ?? []).join("\n")}
              onChange={(e) => set("condicoes_pagamento", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <textarea
              value={form.descricao ?? ""}
              onChange={(e) => set("descricao", e.target.value)}
              rows={6}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg gradient-gold text-primary text-sm font-semibold">Salvar e revalidar</button>
        </div>
      </div>
    </div>
  );
}
