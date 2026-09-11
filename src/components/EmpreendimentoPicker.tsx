import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, X, Loader2, Search, Pencil } from "lucide-react";
import { EmpreendimentoFormDialog } from "@/components/EmpreendimentoFormDialog";
import {
  searchEmpreendimentos,
  getEmpreendimentoById,
  TIPO_LABEL,
  type EmpreendimentoRecord,
  type EmpreendimentoTipo,
} from "@/lib/empreendimentos";

interface Props {
  label?: string;
  /** Vínculo atual do imóvel. */
  value?: { tipo: EmpreendimentoTipo; id: string } | null;
  onChange: (record: EmpreendimentoRecord | null) => void;
  /** Permite editar o empreendimento selecionado pelo mesmo formulário central. */
  allowEdit?: boolean;
  className?: string;
}

export function EmpreendimentoPicker({
  label = "Empreendimento / Edifício",
  value = null,
  onChange,
  allowEdit = true,
  className,
}: Props) {
  const [selected, setSelected] = useState<EmpreendimentoRecord | null>(null);
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<EmpreendimentoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ tipo: EmpreendimentoTipo; id: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carrega o vínculo existente (edição do imóvel)
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value.id) return;
    getEmpreendimentoById(value.tipo, value.id).then((rec) => rec && setSelected(rec));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.id, value?.tipo]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const rows = await searchEmpreendimentos(term);
      if (active) {
        setResults(rows);
        setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [term, open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setTerm("");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const select = (rec: EmpreendimentoRecord | null) => {
    setSelected(rec);
    onChange(rec);
    setOpen(false);
    setTerm("");
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
    setOpen(false);
  };

  const openEdit = () => {
    if (!selected) return;
    setEditing({ tipo: selected.tipo, id: selected.id });
    setDialogOpen(true);
  };

  const describe = (r: EmpreendimentoRecord) =>
    [r.endereco, r.numero, r.bairro, r.cidade].filter(Boolean).join(", ");

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className || ""}`}>
      <Label className="text-xs flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5" /> {label}
      </Label>

      {selected ? (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{selected.nome}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {TIPO_LABEL[selected.tipo]}
              {describe(selected) ? ` • ${describe(selected)}` : ""}
            </p>
          </div>
          {allowEdit && (
            <button type="button" title="Editar empreendimento" onClick={openEdit} className="p-1 text-muted-foreground hover:text-foreground">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" title="Remover vínculo" onClick={() => select(null)} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome, endereço ou bairro..."
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />
          </div>
          <button
            type="button"
            title="Cadastrar novo empreendimento"
            onClick={openNew}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {open && !selected && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...
            </div>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={`${r.tipo}-${r.id}`}
                type="button"
                onClick={() => select(r)}
                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{r.nome}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                    {TIPO_LABEL[r.tipo]}
                  </span>
                </div>
                {describe(r) && <p className="text-[11px] text-muted-foreground truncate">{describe(r)}</p>}
              </button>
            ))}
          {!loading && results.length === 0 && (
            <p className="px-3 py-3 text-xs text-muted-foreground">Nenhum empreendimento encontrado.</p>
          )}
          <div className="sticky bottom-0 bg-popover border-t border-border flex flex-col">
            <button type="button" onClick={openNew} className="text-left px-3 py-2 text-xs font-semibold text-primary hover:bg-accent">
              + Cadastrar novo empreendimento
            </button>
            <button type="button" onClick={() => select(null)} className="text-left px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
              Nenhum empreendimento
            </button>
          </div>
        </div>
      )}

      <EmpreendimentoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultNome={editing ? "" : term}
        editing={editing}
        onSaved={(rec) => select(rec)}
      />
    </div>
  );
}
