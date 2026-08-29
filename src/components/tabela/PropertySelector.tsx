import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ImageOff, SlidersHorizontal, X } from "lucide-react";
import { identityLines, money, type TabelaImovel, type TabelaCorretor } from "@/lib/tabelaData";
import { cn } from "@/lib/utils";

interface Props {
  imoveis: TabelaImovel[];
  corretores: TabelaCorretor[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClear: () => void;
  loading?: boolean;
}

const ALL = "__all__";

export function PropertySelector({ imoveis, corretores, selectedIds, onToggle, onSelectAll, onClear, loading }: Props) {
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [cidade, setCidade] = useState(ALL);
  const [bairro, setBairro] = useState(ALL);
  const [tipo, setTipo] = useState(ALL);
  const [empreendimento, setEmpreendimento] = useState(ALL);
  const [dorm, setDorm] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [corretor, setCorretor] = useState(ALL);
  const [proprietario, setProprietario] = useState(ALL);
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");

  const uniq = (vals: (string | null | undefined)[]) =>
    Array.from(new Set(vals.filter((v): v is string => !!v && v.trim() !== ""))).sort((a, b) => a.localeCompare(b));

  const opts = useMemo(
    () => ({
      cidades: uniq(imoveis.map(i => i.cidade)),
      bairros: uniq(imoveis.map(i => i.bairro)),
      tipos: uniq(imoveis.map(i => i.tipo)),
      empreendimentos: uniq(imoveis.map(i => i.empreendimento)),
      status: uniq(imoveis.map(i => i.status)),
      proprietarios: uniq(imoveis.map(i => i.proprietario)),
    }),
    [imoveis]
  );

  const corretorNome = (p: TabelaImovel) =>
    corretores.find(c => c.id === p.corretorId)?.nome || p.corretorNome || "";

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const min = Number(precoMin.replace(/\D/g, "")) || 0;
    const max = Number(precoMax.replace(/\D/g, "")) || Infinity;
    return imoveis.filter(p => {
      if (term) {
        const hay = [p.titulo, p.empreendimento, p.proprietario, p.code, p.endereco, p.bairro, p.cidade, p.unidade, p.quadra, p.lote]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (cidade !== ALL && p.cidade !== cidade) return false;
      if (bairro !== ALL && p.bairro !== bairro) return false;
      if (tipo !== ALL && p.tipo !== tipo) return false;
      if (empreendimento !== ALL && p.empreendimento !== empreendimento) return false;
      if (status !== ALL && p.status !== status) return false;
      if (proprietario !== ALL && p.proprietario !== proprietario) return false;
      if (corretor !== ALL && corretorNome(p) !== corretor) return false;
      if (dorm !== ALL && Number(p.quartos || 0) < Number(dorm)) return false;
      const preco = p.preco || 0;
      if (preco < min || preco > max) return false;
      return true;
    });
  }, [imoveis, q, cidade, bairro, tipo, empreendimento, status, corretor, proprietario, dorm, precoMin, precoMax, corretores]);

  const resetFilters = () => {
    setCidade(ALL); setBairro(ALL); setTipo(ALL); setEmpreendimento(ALL);
    setDorm(ALL); setStatus(ALL); setCorretor(ALL); setProprietario(ALL);
    setPrecoMin(""); setPrecoMax("");
  };

  const Filter = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: todos</SelectItem>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar imóvel, empreendimento, proprietário, código ou endereço..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(v => !v)}>
          <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros
        </Button>
      </div>

      {showFilters && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Filter label="Cidade" value={cidade} onChange={setCidade} options={opts.cidades} />
            <Filter label="Bairro" value={bairro} onChange={setBairro} options={opts.bairros} />
            <Filter label="Tipo" value={tipo} onChange={setTipo} options={opts.tipos} />
            <Filter label="Empreendimento" value={empreendimento} onChange={setEmpreendimento} options={opts.empreendimentos} />
            <Filter label="Status" value={status} onChange={setStatus} options={opts.status} />
            <Filter label="Corretor" value={corretor} onChange={setCorretor} options={uniq(imoveis.map(corretorNome))} />
            <Filter label="Proprietário" value={proprietario} onChange={setProprietario} options={opts.proprietarios} />
            <Filter label="Dormitórios" value={dorm} onChange={setDorm} options={["1", "2", "3", "4", "5"]} />
            <Input value={precoMin} onChange={e => setPrecoMin(e.target.value)} placeholder="Valor mín." className="h-9 text-xs" />
            <Input value={precoMax} onChange={e => setPrecoMax(e.target.value)} placeholder="Valor máx." className="h-9 text-xs" />
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
            <X className="w-3 h-3 mr-1" /> Limpar filtros
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {selectedIds.length} {selectedIds.length === 1 ? "imóvel selecionado" : "imóveis selecionados"}
        </Badge>
        <span className="text-xs text-muted-foreground">{filtered.length} encontrados</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => onSelectAll(filtered.map(f => f.id))}>
          Selecionar todos
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>Limpar seleção</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum imóvel encontrado com esses filtros.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
          {filtered.map(p => {
            const selected = selectedIds.includes(p.id);
            const lines = identityLines(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggle(p.id)}
                className={cn(
                  "flex gap-3 p-2 rounded-xl border text-left transition-all",
                  selected ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "border-border bg-card hover:bg-accent/40"
                )}
              >
                <div className="w-24 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  {p.capa ? (
                    <img src={p.capa} alt={p.titulo} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff className="w-5 h-5 text-muted-foreground/50" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <p className="text-sm font-semibold text-foreground truncate flex-1">{p.titulo}</p>
                    <Checkbox checked={selected} className="mt-0.5 pointer-events-none" />
                  </div>
                  {lines.length > 0 && (
                    <p className="text-[11px] text-muted-foreground truncate">{lines.join(" • ")}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground truncate">
                    {[p.bairro, p.cidade].filter(Boolean).join(", ")}
                  </p>
                  <div className="flex items-center gap-2 mt-1 min-w-0">
                    <span className="text-sm font-bold text-primary truncate">{money(p.preco)}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{p.code}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
