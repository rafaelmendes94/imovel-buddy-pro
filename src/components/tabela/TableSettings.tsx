import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FIELDS, FORMATS, TITLE_PRESETS, type FieldKey, type TableSettingsState } from "@/lib/tabelaTemplates";
import { autoDescription, type TabelaCorretor, type TabelaImovel } from "@/lib/tabelaData";
import { PaletteSelector } from "./PaletteSelector";
import type { Palette } from "@/lib/tabelaPalettes";

interface Props {
  settings: TableSettingsState;
  onChange: (patch: Partial<TableSettingsState>) => void;
  corretores: TabelaCorretor[];
  items: TabelaImovel[];
  companyPalette?: Palette | null;
}

export function TableSettings({ settings, onChange, corretores, items, companyPalette }: Props) {
  const toggleField = (key: FieldKey) =>
    onChange({ fields: { ...settings.fields, [key]: !settings.fields[key] } });

  const groups = Array.from(new Set(FIELDS.map(f => f.group)));

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Cabeçalho</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Título da tabela</Label>
            <Input value={settings.titulo} onChange={e => onChange({ titulo: e.target.value })} />
            <div className="flex flex-wrap gap-1 pt-1">
              {TITLE_PRESETS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ titulo: t })}
                  className="px-2 py-0.5 rounded border border-border text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subtítulo</Label>
            <Input
              value={settings.subtitulo}
              onChange={e => onChange({ subtitulo: e.target.value })}
              placeholder="CAPÃO DA CANOA / RS"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="logo" checked={settings.showLogo} onCheckedChange={v => onChange({ showLogo: v })} />
          <Label htmlFor="logo" className="text-xs">Mostrar logo</Label>
        </div>
      </section>

      {/* Cores da apresentação */}
      <section className="space-y-3 rounded-xl border border-border p-3">
        <h3 className="text-sm font-semibold text-foreground">Cores da apresentação</h3>
        <PaletteSelector
          palette={settings.palette}
          baseId={settings.paletteBaseId}
          companyPalette={companyPalette}
          onChange={(palette, paletteBaseId) => onChange({ palette, paletteBaseId })}
        />
      </section>

      {/* Formato */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Formato</h3>
        <Select value={settings.formato} onValueChange={v => onChange({ formato: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {FORMATS.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </section>

      {/* Campos */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Informações exibidas</h3>
        {groups.map(g => (
          <div key={g} className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {FIELDS.filter(f => f.group === g).map(f => (
                <label key={f.key} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <Checkbox checked={settings.fields[f.key]} onCheckedChange={() => toggleField(f.key)} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* QR Code */}
      {settings.fields.qrcode && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">QR Code para</h3>
          <RadioGroup value={settings.qrTarget} onValueChange={v => onChange({ qrTarget: v as any })} className="space-y-1">
            {[
              { v: "pagina", l: "Página do imóvel" },
              { v: "drive", l: "Google Drive" },
              { v: "galeria", l: "Galeria" },
            ].map(o => (
              <label key={o.v} className="flex items-center gap-2 text-xs cursor-pointer">
                <RadioGroupItem value={o.v} /> {o.l}
              </label>
            ))}
          </RadioGroup>
        </section>
      )}

      {/* Corretor */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Corretor da apresentação</h3>
        <div className="flex items-center gap-2">
          <Switch id="broker" checked={settings.showBroker} onCheckedChange={v => onChange({ showBroker: v })} />
          <Label htmlFor="broker" className="text-xs">Mostrar corretor responsável</Label>
        </div>
        {settings.showBroker && (
          <Select
            value={settings.brokerMode === "outro" ? settings.brokerId || "" : settings.brokerMode}
            onValueChange={v => {
              if (v === "responsavel" || v === "nenhum") onChange({ brokerMode: v as any, brokerId: null });
              else onChange({ brokerMode: "outro", brokerId: v });
            }}
          >
            <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="responsavel">Corretor responsável pelo imóvel</SelectItem>
              <SelectItem value="nenhum">Não mostrar corretor</SelectItem>
              {corretores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </section>

      {/* Descrições */}
      {items.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Descrições resumidas</h3>
          <p className="text-xs text-muted-foreground">
            Geradas automaticamente com os dados cadastrados. Você pode editar cada uma (uma característica por linha).
          </p>
          {items.map(p => (
            <div key={p.id} className="space-y-1">
              <Label className="text-xs">{p.titulo}</Label>
              <Textarea
                rows={3}
                className="text-xs"
                value={settings.descricoes[p.id] ?? autoDescription(p).join("\n")}
                onChange={e => onChange({ descricoes: { ...settings.descricoes, [p.id]: e.target.value } })}
              />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
