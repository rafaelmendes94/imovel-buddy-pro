import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PLACEHOLDER_IMAGE } from "@/lib/placeholderImage";
import {
  brl, brlShort, emptyMetrics, metricsByCondo, type CondoMetrics, type MetricImovel,
} from "@/lib/condoMetrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, Fence, FolderOpen, Images, Loader2, Map as MapIcon, MapPin, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";

interface CondoRow {
  id: string; nome: string; endereco: string | null; cidade: string | null; estado: string | null;
  bairro: string | null; tipo: string | null; taxa_condominio: number | null; amenidades: string[] | null;
  imagem_url: string | null; descricao: string | null;
  fotos_empreendimento: string[] | null; fotos_infra: string[] | null;
  mapa_pdf_url: string | null; implantacao_url: string | null;
  material_digital: string[] | null;
}

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "condominio";

const photosOf = (c: CondoRow) =>
  Array.from(new Set([...(c.fotos_empreendimento || []), ...(c.fotos_infra || []), ...(c.imagem_url ? [c.imagem_url] : [])].filter(Boolean)));

const driveOf = (c: CondoRow) =>
  (c.material_digital || []).find(u => /drive\.google|onedrive|dropbox/i.test(u || "")) || null;

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(href);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

const PRICE_RANGES = [
  { label: "Até R$ 500 mil", min: 0, max: 500_000 },
  { label: "R$ 500 mil – R$ 1 milhão", min: 500_000, max: 1_000_000 },
  { label: "R$ 1 – 2 milhões", min: 1_000_000, max: 2_000_000 },
  { label: "R$ 2 – 3 milhões", min: 2_000_000, max: 3_000_000 },
  { label: "R$ 3 – 5 milhões", min: 3_000_000, max: 5_000_000 },
  { label: "Acima de R$ 5 milhões", min: 5_000_000, max: null as number | null },
];

const CONDO_FEE_RANGES = [
  { id: "todos", label: "Todos", min: null as number | null, max: null as number | null },
  { id: "ate500", label: "Até R$ 500", min: 0, max: 500 },
  { id: "500a1000", label: "R$ 500 – R$ 1.000", min: 500, max: 1000 },
  { id: "1000a2000", label: "R$ 1.000 – R$ 2.000", min: 1000, max: 2000 },
  { id: "acima2000", label: "Acima de R$ 2.000", min: 2000, max: null },
];

const coverOf = (c: CondoRow) =>
  c.imagem_url || c.fotos_empreendimento?.[0] || c.fotos_infra?.[0] || PLACEHOLDER_IMAGE;

export default function Condominiums() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdminStaff } = useAuth();
  const canManage = isSuperAdmin || isAdminStaff;

  const [condos, setCondos] = useState<CondoRow[]>([]);
  const [imoveis, setImoveis] = useState<MetricImovel[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [search, setSearch] = useState("");
  const [cidade, setCidade] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [fee, setFee] = useState("todos");
  const [minVal, setMinVal] = useState("");
  const [maxVal, setMaxVal] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState("padrao");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Duas consultas agregadas apenas — nada de query por condomínio (sem N+1)
      const [cRes, iRes] = await Promise.all([
        supabase
          .from("condominios")
          .select("id, nome, endereco, cidade, estado, bairro, tipo, taxa_condominio, amenidades, imagem_url, descricao, fotos_empreendimento, fotos_infra, mapa_pdf_url, implantacao_url, material_digital")
          .order("nome"),
        supabase
          .from("imoveis")
          .select("id, condominio_id, status, preco")
          .not("condominio_id", "is", null),
      ]);
      setCondos((cRes.data as any) || []);
      setImoveis((iRes.data as any) || []);
      setLoading(false);
    })();
  }, []);

  const metricsMap = useMemo(() => metricsByCondo(imoveis), [imoveis]);
  const metricsOf = (id: string): CondoMetrics => metricsMap[id] || emptyMetrics();

  const cidades = useMemo(
    () => Array.from(new Set(condos.map(c => (c.cidade || "").trim()).filter(Boolean))).sort(),
    [condos]
  );
  const tipos = useMemo(
    () => Array.from(new Set(condos.map(c => (c.tipo || "").trim()).filter(Boolean))).sort(),
    [condos]
  );
  const allFeatures = useMemo(
    () => Array.from(new Set(condos.flatMap(c => c.amenidades || []).map(a => a.trim()).filter(Boolean))).sort(),
    [condos]
  );

  const priceRange = useMemo(() => {
    const min = minVal ? Number(minVal.replace(/\D/g, "")) : null;
    const max = maxVal ? Number(maxVal.replace(/\D/g, "")) : null;
    return { min, max };
  }, [minVal, maxVal]);

  const activeFilters =
    (search ? 1 : 0) + (cidade !== "todas" ? 1 : 0) + (tipo !== "todos" ? 1 : 0) +
    (fee !== "todos" ? 1 : 0) + (priceRange.min != null || priceRange.max != null ? 1 : 0) +
    features.length + (onlyAvailable ? 1 : 0);

  const clearFilters = () => {
    setSearch(""); setCidade("todas"); setTipo("todos"); setFee("todos");
    setMinVal(""); setMaxVal(""); setFeatures([]); setOnlyAvailable(false); setPage(1);
  };

  const norm = (s?: string | null) =>
    (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filtered = useMemo(() => {
    const q = norm(search).trim();
    const feeCfg = CONDO_FEE_RANGES.find(f => f.id === fee)!;

    const list = condos.filter(c => {
      const m = metricsOf(c.id);

      if (q) {
        const haystack = norm(
          [c.nome, c.cidade, c.bairro, c.endereco, c.estado, c.descricao, ...(c.amenidades || [])].join(" ")
        );
        if (!haystack.includes(q)) return false;
      }
      if (cidade !== "todas" && (c.cidade || "").trim() !== cidade) return false;
      if (tipo !== "todos" && (c.tipo || "").trim() !== tipo) return false;

      if (feeCfg.min != null || feeCfg.max != null) {
        const v = Number(c.taxa_condominio || 0);
        if (feeCfg.min != null && v < feeCfg.min) return false;
        if (feeCfg.max != null && v > feeCfg.max) return false;
      }

      if (features.length) {
        const own = (c.amenidades || []).map(norm);
        if (!features.every(f => own.some(o => o.includes(norm(f))))) return false;
      }

      if (onlyAvailable && m.ativos === 0) return false;

      if (priceRange.min != null || priceRange.max != null) {
        // Ao menos um imóvel ATIVO dentro da faixa
        const ok = imoveis.some(i => {
          if (i.condominio_id !== c.id) return false;
          const p = Number(i.preco || 0);
          if (!p) return false;
          if (!m.ativos) return false;
          if (priceRange.min != null && p < priceRange.min) return false;
          if (priceRange.max != null && p > priceRange.max) return false;
          return true;
        });
        if (!ok) return false;
      }
      return true;
    });

    const byM = (id: string) => metricsOf(id);
    const sorted = [...list];
    switch (sort) {
      case "nome-az": sorted.sort((a, b) => a.nome.localeCompare(b.nome)); break;
      case "nome-za": sorted.sort((a, b) => b.nome.localeCompare(a.nome)); break;
      case "vgv-ativo": sorted.sort((a, b) => byM(b.id).vgvAtivo - byM(a.id).vgvAtivo); break;
      case "vgv-vendido": sorted.sort((a, b) => byM(b.id).vgvVendido - byM(a.id).vgvVendido); break;
      case "mais-ativos": sorted.sort((a, b) => byM(b.id).ativos - byM(a.id).ativos); break;
      case "mais-vendidos": sorted.sort((a, b) => byM(b.id).vendidos - byM(a.id).vendidos); break;
      case "menor-preco":
        sorted.sort((a, b) => (byM(a.id).minPreco ?? Infinity) - (byM(b.id).minPreco ?? Infinity)); break;
      case "maior-preco":
        sorted.sort((a, b) => (byM(b.id).maxPreco ?? -1) - (byM(a.id).maxPreco ?? -1)); break;
      default: break;
    }
    return sorted;
  }, [condos, imoveis, search, cidade, tipo, fee, features, onlyAvailable, priceRange, sort, metricsMap]);

  // Indicadores reagem aos filtros
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, c) => {
        const m = metricsOf(c.id);
        acc.ativos += m.ativos; acc.vendidos += m.vendidos;
        acc.vgvAtivo += m.vgvAtivo; acc.vgvVendido += m.vgvVendido;
        return acc;
      },
      { ativos: 0, vendidos: 0, vgvAtivo: 0, vgvVendido: 0 }
    );
  }, [filtered, metricsMap]);

  useEffect(() => { setPage(1); }, [search, cidade, tipo, fee, minVal, maxVal, features, onlyAvailable, perPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleFeature = (f: string) =>
    setFeatures(prev => (prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]));

  const Indicator = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col px-3.5 py-1.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground truncate">{value}</span>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1700px] mx-auto">
        <BackButton />

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Condomínios</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie e visualize os condomínios cadastrados</p>
          </div>
          {canManage && (
            <Button onClick={() => navigate("/cadastro-condominio")} className="self-start">
              <Plus className="w-4 h-4 mr-2" /> Novo Condomínio
            </Button>
          )}
        </div>

        {/* Busca + filtros */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar condomínio por nome, cidade, bairro ou características..."
              className="h-12 pl-10 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={cidade} onValueChange={setCidade}>
              <SelectTrigger className="h-12 w-[160px]"><SelectValue placeholder="Cidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as cidades</SelectItem>
                {cidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-12">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtros{activeFilters > 0 ? ` (${activeFilters})` : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[330px] space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label className="text-xs">Faixa de valor dos imóveis ativos</Label>
                  <div className="flex gap-2">
                    <Input value={minVal} onChange={e => setMinVal(e.target.value)} placeholder="Mínimo" inputMode="numeric" />
                    <Input value={maxVal} onChange={e => setMaxVal(e.target.value)} placeholder="Máximo" inputMode="numeric" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRICE_RANGES.map(r => (
                      <button
                        key={r.label}
                        onClick={() => { setMinVal(String(r.min)); setMaxVal(r.max ? String(r.max) : ""); }}
                        className="px-2 py-1 rounded-md border border-border text-[11px] hover:border-primary hover:text-primary"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Valor do condomínio</Label>
                  <Select value={fee} onValueChange={setFee}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDO_FEE_RANGES.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {allFeatures.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Características</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {allFeatures.map(f => (
                        <button
                          key={f}
                          onClick={() => toggleFeature(f)}
                          className={cn(
                            "px-2 py-1 rounded-md border text-[11px] transition-colors",
                            features.includes(f)
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <Checkbox checked={onlyAvailable} onCheckedChange={v => setOnlyAvailable(!!v)} />
                  Somente com imóveis disponíveis
                </label>

                {activeFilters > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                    <X className="w-3.5 h-3.5 mr-1.5" /> Limpar filtros
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-12 w-[190px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="padrao">Padrão</SelectItem>
                <SelectItem value="nome-az">Nome A-Z</SelectItem>
                <SelectItem value="nome-za">Nome Z-A</SelectItem>
                <SelectItem value="vgv-ativo">Maior VGV ativo</SelectItem>
                <SelectItem value="vgv-vendido">Maior VGV vendido</SelectItem>
                <SelectItem value="mais-ativos">Mais imóveis disponíveis</SelectItem>
                <SelectItem value="mais-vendidos">Mais imóveis vendidos</SelectItem>
                <SelectItem value="menor-preco">Menor preço disponível</SelectItem>
                <SelectItem value="maior-preco">Maior preço disponível</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Indicadores compactos */}
        <div className="flex flex-wrap items-center divide-x divide-border rounded-xl border border-border bg-card py-1.5">
          <Indicator label="Condomínios" value={String(filtered.length)} />
          <Indicator label="Imóveis ativos" value={String(totals.ativos)} />
          <Indicator label="VGV ativo" value={brlShort(totals.vgvAtivo)} />
          <Indicator label="Imóveis vendidos" value={String(totals.vendidos)} />
          <Indicator label="VGV vendido" value={brlShort(totals.vgvVendido)} />
        </div>

        {/* Galeria */}
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : pageItems.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Fence className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum condomínio encontrado com esses filtros.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Limpar filtros</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {pageItems.map(c => {
              const m = metricsOf(c.id);
              const hasFotos = !!(c.imagem_url || (c.fotos_empreendimento?.length ?? 0) || (c.fotos_infra?.length ?? 0));
              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/condominios/${c.id}`)}
                  onKeyDown={e => { if (e.key === "Enter") navigate(`/condominios/${c.id}`); }}
                  className="group relative block w-full text-left rounded-2xl overflow-hidden border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={coverOf(c)}
                      alt={c.nome}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#04122a]/95 via-[#04122a]/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 space-y-1.5">
                      <h3 className="text-lg font-bold text-white leading-tight drop-shadow">{c.nome}</h3>
                      <p className="flex items-center gap-1 text-[11px] text-white/85">
                        <MapPin className="w-3 h-3" />
                        {[c.cidade, c.estado].filter(Boolean).join(" / ") || "Localização não informada"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/90 pt-0.5">
                        <span><b className="text-white">{m.ativos}</b> ativos</span>
                        <span className="text-accent font-semibold">VGV {brlShort(m.vgvAtivo)}</span>
                        <span><b className="text-white">{m.vendidos}</b> vendidos</span>
                        <span className="text-white/70">{brlShort(m.vgvVendido)}</span>
                      </div>
                      {m.minPreco != null && m.maxPreco != null && (
                        <p className="text-[10px] text-white/70">
                          Imóveis de {brl(m.minPreco)} a {brl(m.maxPreco)}
                        </p>
                      )}
                    </div>
                  </div>
                  {(hasFotos || c.mapa_pdf_url || c.implantacao_url) && (
                    <div className="flex items-stretch gap-2 p-2.5 border-t border-border bg-muted/40">
                      {hasFotos && (
                        <button
                          title="Ver fotos do condomínio"
                          onClick={e => { e.stopPropagation(); navigate(`/condominios/${c.id}`); }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Images className="w-4 h-4 text-primary" /> Fotos
                        </button>
                      )}
                      {c.mapa_pdf_url && (
                        <button
                          title="Baixar mapa (PDF)"
                          onClick={e => { e.stopPropagation(); window.open(c.mapa_pdf_url!, "_blank", "noopener"); }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <MapIcon className="w-4 h-4 text-primary" /> Mapa
                        </button>
                      )}
                      {c.implantacao_url && (
                        <button
                          title="Baixar implantação"
                          onClick={e => { e.stopPropagation(); window.open(c.implantacao_url!, "_blank", "noopener"); }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Download className="w-4 h-4 text-primary" /> Implantação
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} de {filtered.length} condomínios
            </p>
            <div className="flex items-center gap-2">
              <Select value={String(perPage)} onValueChange={v => setPerPage(Number(v))}>
                <SelectTrigger className="h-9 w-[90px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectContent>
              </Select>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={page === i + 1 ? "default" : "outline"}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
