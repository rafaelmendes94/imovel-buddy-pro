import { useEffect, useState } from "react";
import { Check, Palette as PaletteIcon, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PALETTES, loadMyPalettes, paletteColors, saveMyPalettes, type Palette,
} from "@/lib/tabelaPalettes";

interface Props {
  palette: Palette;
  baseId: string;
  onChange: (palette: Palette, baseId: string) => void;
  /** Paleta gerada a partir das cores cadastradas da imobiliária. */
  companyPalette?: Palette | null;
}

const FIELDS: { key: keyof Omit<Palette, "id" | "name">; label: string }[] = [
  { key: "principal", label: "Principal" },
  { key: "secundaria", label: "Secundária" },
  { key: "destaque", label: "Destaque" },
  { key: "fundo", label: "Fundo" },
  { key: "texto", label: "Texto" },
];

/** Miniatura da tabela com as cores da paleta. */
function Thumb({ p }: { p: Palette }) {
  const c = paletteColors(p);
  return (
    <div style={{ background: c.pageBg, border: `1px solid ${c.border}` }} className="rounded-md overflow-hidden">
      <div style={{ background: c.headerBg, borderBottom: `2px solid ${c.accent}` }} className="h-3.5 flex items-center px-1 gap-1">
        <span style={{ background: c.headerText, opacity: 0.9 }} className="h-1 w-8 rounded-full" />
        <span style={{ background: c.accent }} className="h-1 w-3 rounded-full ml-auto" />
      </div>
      <div className="p-1 space-y-1">
        {[0, 1].map(i => (
          <div key={i} style={{ background: i ? c.rowAltBg : c.rowBg, border: `1px solid ${c.border}` }} className="flex items-center gap-1 rounded-sm p-1">
            <span style={{ background: c.accent, opacity: 0.5 }} className="h-3 w-4 rounded-sm" />
            <span style={{ background: c.text, opacity: 0.6 }} className="h-1 w-8 rounded-full" />
            <span style={{ background: c.priceText }} className="h-1.5 w-6 rounded-full ml-auto" />
          </div>
        ))}
      </div>
      <div style={{ background: c.headerBg }} className="h-2" />
    </div>
  );
}

export function PaletteSelector({ palette, baseId, onChange, companyPalette }: Props) {
  const [mine, setMine] = useState<Palette[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => setMine(loadMyPalettes()), []);

  const base = [...(companyPalette ? [companyPalette] : []), ...PALETTES];
  const customized = (() => {
    const src = [...base, ...mine].find(p => p.id === baseId);
    if (!src) return false;
    return FIELDS.some(f => src[f.key].toLowerCase() !== palette[f.key].toLowerCase());
  })();

  const pick = (p: Palette) => onChange({ ...p }, p.id);

  const setColor = (key: keyof Omit<Palette, "id" | "name">, value: string) =>
    onChange({ ...palette, [key]: value }, baseId);

  const savePalette = () => {
    const name = newName.trim();
    if (!name) return;
    const item: Palette = { ...palette, id: `my-${Date.now()}`, name };
    const list = [...mine, item];
    setMine(list);
    saveMyPalettes(list);
    setNewName("");
    onChange({ ...item }, item.id);
  };

  const removePalette = (id: string) => {
    const list = mine.filter(p => p.id !== id);
    setMine(list);
    saveMyPalettes(list);
  };

  const Card = ({ p, onDelete }: { p: Palette; onDelete?: () => void }) => {
    const active = baseId === p.id;
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => pick(p)}
          className={`w-full text-left rounded-lg border p-1.5 space-y-1.5 transition-colors ${
            active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:bg-accent/40"
          }`}
        >
          <Thumb p={p} />
          <div className="flex items-center gap-1 px-0.5">
            {FIELDS.slice(0, 4).map(f => (
              <span key={f.key} style={{ background: p[f.key] }} className="w-3 h-3 rounded-full border border-border" />
            ))}
            <span className="ml-auto text-[10px] font-semibold text-foreground truncate flex items-center gap-1">
              {active && <Check className="w-3 h-3 text-primary" />} {p.name}
            </span>
          </div>
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="absolute top-1 right-1 p-1 rounded bg-background/80 text-destructive"
            aria-label={`Excluir paleta ${p.name}`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <PaletteIcon className="w-4 h-4" /> Paletas prontas
        </h3>
        {customized && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
            Personalizado
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {base.map(p => <Card key={p.id} p={p} />)}
      </div>

      {mine.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Minhas paletas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {mine.map(p => <Card key={p.id} p={p} onDelete={() => removePalette(p.id)} />)}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Personalizar cores</p>
        <div className="space-y-1.5">
          {FIELDS.map(f => (
            <div key={f.key} className="flex items-center gap-2">
              <Label className="text-xs w-24 shrink-0">{f.label}</Label>
              <input
                type="color"
                aria-label={f.label}
                value={palette[f.key]}
                onChange={e => setColor(f.key, e.target.value)}
                className="w-9 h-8 rounded border border-border bg-transparent cursor-pointer p-0.5"
              />
              <Input
                value={palette[f.key]}
                onChange={e => setColor(f.key, e.target.value)}
                className="h-8 text-xs font-mono w-28"
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          O contraste do texto é ajustado automaticamente para manter a tabela legível.
        </p>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Salvar paleta como</Label>
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Ex.: MV Broker Exclusividades"
            className="h-8 text-xs"
          />
        </div>
        <Button size="sm" variant="outline" onClick={savePalette} disabled={!newName.trim()}>
          <Save className="w-3.5 h-3.5 mr-1.5" /> Salvar paleta
        </Button>
      </div>
    </section>
  );
}
