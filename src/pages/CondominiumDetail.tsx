import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { MiniMap } from "@/components/MiniMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSmartBack } from "@/lib/useSmartBack";
import { PLACEHOLDER_IMAGE } from "@/lib/placeholderImage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  brl, isActiveProperty, isSoldProperty, metricsFor, type MetricImovel,
} from "@/lib/condoMetrics";
import {
  ArrowLeft, Download, Edit, ExternalLink, Fence,
  FileText, Home, Images, Loader2, MapPin, Share2, Sparkles,
} from "lucide-react";
import { PhotoGallery } from "@/components/condo/PhotoGallery";
import { VideoBlock, TourBlock, isFileVideo, videoEmbedUrl, isSafeEmbedUrl } from "@/components/condo/MediaHero";

export default function CondominiumDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = useSmartBack("/condominios");
  const { isSuperAdmin, isAdminStaff } = useAuth();
  const canManage = isSuperAdmin || isAdminStaff;

  const [condo, setCondo] = useState<any>(null);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  // filtros internos dos imóveis
  const [tab, setTab] = useState<"disponiveis" | "vendidos" | "todos">("disponiveis");
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");
  const [fTipo, setFTipo] = useState("todos");
  const [fDorm, setFDorm] = useState("todos");
  const [fSuites, setFSuites] = useState("todos");
  const [fQuadra, setFQuadra] = useState("todas");
  const [iSort, setISort] = useState("recentes");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [cRes, iRes] = await Promise.all([
        supabase.from("condominios").select("*").eq("id", id).maybeSingle(),
        supabase.from("imoveis").select("*").eq("condominio_id", id).order("created_at", { ascending: false }),
      ]);
      setCondo(cRes.data);
      setImoveis((iRes.data as any) || []);
      setLoading(false);
    })();
  }, [id]);

  const photos: string[] = useMemo(() => {
    if (!condo) return [];
    return Array.from(new Set([
      condo.imagem_url,
      ...(condo.fotos_empreendimento || []),
      ...(condo.fotos_infra || []),
    ].filter(Boolean)));
  }, [condo]);

  const metrics = useMemo(() => metricsFor((imoveis as MetricImovel[]) || []), [imoveis]);

  const visibleImoveis = useMemo(() => {
    const min = fMin ? Number(fMin.replace(/\D/g, "")) : null;
    const max = fMax ? Number(fMax.replace(/\D/g, "")) : null;
    let list = imoveis.filter(i => {
      if (tab === "disponiveis" && !isActiveProperty(i.status)) return false;
      if (tab === "vendidos" && !isSoldProperty(i.status)) return false;
      const p = Number(i.preco || 0);
      if (min != null && p < min) return false;
      if (max != null && p > max) return false;
      if (fTipo !== "todos" && (i.tipo || "") !== fTipo) return false;
      if (fDorm !== "todos" && Number(i.quartos || 0) !== Number(fDorm)) return false;
      if (fSuites !== "todos" && Number(i.suites || 0) !== Number(fSuites)) return false;
      if (fQuadra !== "todas" && (i.quadra || "") !== fQuadra) return false;
      return true;
    });
    if (iSort === "menor") list = [...list].sort((a, b) => Number(a.preco || 0) - Number(b.preco || 0));
    if (iSort === "maior") list = [...list].sort((a, b) => Number(b.preco || 0) - Number(a.preco || 0));
    return list;
  }, [imoveis, tab, fMin, fMax, fTipo, fDorm, fSuites, fQuadra, iSort]);

  const tipos = useMemo(() => Array.from(new Set(imoveis.map(i => i.tipo).filter(Boolean))), [imoveis]);
  const quadras = useMemo(() => Array.from(new Set(imoveis.map(i => i.quadra).filter(Boolean))), [imoveis]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      </AppLayout>
    );
  }

  if (!condo) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">
          <Fence className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Condomínio não encontrado</p>
          <button onClick={handleBack} className="text-accent hover:underline mt-2">Voltar</button>
        </div>
      </AppLayout>
    );
  }

  const fullAddress = [condo.endereco, condo.numero, condo.complemento, condo.bairro, condo.cidade, condo.estado]
    .filter(Boolean).join(", ");
  const implantacaoUrl: string = condo.implantacao_url || "";
  const isPdf = /\.pdf($|\?)/i.test(implantacaoUrl);
  const materiais: string[] = condo.material_digital || [];

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: condo.nome, url }); return; } catch { /* ignore */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(`🏘️ ${condo.nome}\n📍 ${fullAddress}\n${url}`)}`, "_blank");
  };

  const go = (sid: string) => document.getElementById(sid)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const Metric = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );

  const Section = ({ id: sid, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section id={sid} className="space-y-3 scroll-mt-24">
      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
      {children}
    </section>
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
        {/* topo */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={handleBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={share}><Share2 className="w-4 h-4 mr-1.5" /> Compartilhar</Button>
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/editar-condominio/${condo.id}`)}>
                <Edit className="w-4 h-4 mr-1.5" /> Editar condomínio
              </Button>
            )}
          </div>
        </div>

        {/* identificação */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{condo.nome}</h1>
            {condo.tipo && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25">{condo.tipo}</span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground">{[condo.cidade, condo.estado].filter(Boolean).join(" / ")}</p>
          {fullAddress && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> {fullAddress}</p>}
        </div>

        {/* navegação sticky (somente seções existentes) */}
        {sections.length > 1 && (
          <nav className="hidden lg:flex sticky top-2 z-20 gap-1 rounded-xl border border-border bg-card/95 backdrop-blur px-2 py-1.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => go(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                {s.label}
              </button>
            ))}
          </nav>
        )}

        {/* 1. vídeo */}
        {videoUrl && (
          <Section id="video" title="Vídeo do condomínio">
            <VideoBlock url={videoUrl} poster={condo.video_capa_url || photos[0] || null} title={condo.nome} />
          </Section>
        )}

        {/* 2. galeria */}
        {photos.length > 0 && (
          <Section id="fotos" title={`Galeria de fotos (${photos.length})`}>
            <PhotoGallery photos={photos} alt={condo.nome} />
          </Section>
        )}

        {/* 3. tour 360° */}
        {tourUrl && (
          <Section id="tour360" title="Tour virtual 360°">
            <TourBlock url={tourUrl} poster={condo.tour_capa_url || null} title={condo.nome} />
          </Section>
        )}

        {/* 4. informações */}
        {condo.descricao && (
          <Section id="sobre" title="Sobre o condomínio">
            <p className="text-sm text-muted-foreground whitespace-pre-line rounded-xl border border-border bg-card p-4 leading-relaxed">{condo.descricao}</p>
          </Section>
        )}

        {(condo.taxa_condominio > 0 || condo.total_unidades > 0 || condo.construtora || condo.ano_construcao) && (
          <Section id="financeiro" title="Informações financeiras">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {condo.taxa_condominio > 0 && <Metric label="Condomínio médio" value={`${brl(condo.taxa_condominio)}/mês`} />}
              {condo.total_unidades > 0 && <Metric label="Total de unidades" value={String(condo.total_unidades)} />}
              {condo.construtora && <Metric label="Administração / Construtora" value={condo.construtora} />}
              {condo.ano_construcao && <Metric label="Ano de construção" value={String(condo.ano_construcao)} />}
            </div>
          </Section>
        )}

        {/* 5. indicadores comerciais */}
        <Section id="visao" title="Indicadores comerciais">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Metric label="Imóveis ativos" value={String(metrics.ativos)} />
            <Metric label="VGV ativo" value={brl(metrics.vgvAtivo)} />
            <Metric label="Imóveis vendidos" value={String(metrics.vendidos)} />
            <Metric label="VGV vendido" value={brl(metrics.vgvVendido)} />
            <Metric label="Ticket médio ativo" value={metrics.ticketMedioAtivo != null ? brl(metrics.ticketMedioAtivo) : "—"} />
            <Metric
              label="Faixa de preço"
              value={metrics.minPreco != null ? `${brl(metrics.minPreco)} – ${brl(metrics.maxPreco)}` : "—"}
            />
          </div>
        </Section>

        {/* 6. infraestrutura */}
        {condo.amenidades?.length > 0 && (
          <Section id="infra" title="Infraestrutura e diferenciais">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {condo.amenidades.map((a: string) => (
                <div key={a} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0" /> {a}
                </div>
              ))}
            </div>
          </Section>
        )}


        {implantacaoUrl && (
          <Section id="implantacao" title="Implantação do condomínio">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {isPdf ? (
                <iframe src={implantacaoUrl} title="Implantação" className="w-full h-[520px]" />
              ) : (
                <img src={implantacaoUrl} alt="Implantação" loading="lazy" className="w-full object-contain max-h-[560px] bg-muted" />
              )}
              <div className="flex flex-wrap gap-2 p-3 border-t border-border">
                <Button size="sm" variant="outline" onClick={() => window.open(implantacaoUrl, "_blank")}>
                  {isPdf ? <FileText className="w-4 h-4 mr-1.5" /> : <Images className="w-4 h-4 mr-1.5" />}
                  {isPdf ? "Abrir PDF" : "Ver implantação"}
                </Button>
                <a href={implantacaoUrl} download target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost"><Download className="w-4 h-4 mr-1.5" /> Baixar</Button>
                </a>
              </div>
            </div>
          </Section>
        )}

        {/* imóveis */}
        <Section id="imoveis" title="Imóveis neste condomínio">
          <div className="flex flex-wrap items-center gap-2">
            {([["disponiveis", "Disponíveis"], ["vendidos", "Vendidos"], ["todos", "Todos"]] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                  tab === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
            <div><Label className="text-[10px]">Mínimo</Label><Input value={fMin} onChange={e => setFMin(e.target.value)} inputMode="numeric" className="h-9" /></div>
            <div><Label className="text-[10px]">Máximo</Label><Input value={fMax} onChange={e => setFMax(e.target.value)} inputMode="numeric" className="h-9" /></div>
            <div>
              <Label className="text-[10px]">Tipo</Label>
              <Select value={fTipo} onValueChange={setFTipo}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem>{tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Dormitórios</Label>
              <Select value={fDorm} onValueChange={setFDorm}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem>{[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Suítes</Label>
              <Select value={fSuites} onValueChange={setFSuites}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todas</SelectItem>{[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Quadra</Label>
              <Select value={fQuadra} onValueChange={setFQuadra}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">Todas</SelectItem>{quadras.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Ordenar</Label>
              <Select value={iSort} onValueChange={setISort}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais recentes</SelectItem>
                  <SelectItem value="menor">Menor preço</SelectItem>
                  <SelectItem value="maior">Maior preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {visibleImoveis.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Home className="w-10 h-10 mx-auto mb-2 opacity-40" />
              Nenhum imóvel encontrado com esses filtros.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleImoveis.map(im => {
                const identity = [im.unidade && `Unid. ${im.unidade}`, im.quadra && `Q: ${im.quadra}`, im.lote && `L: ${im.lote}`]
                  .filter(Boolean).join(" • ");
                return (
                  <div key={im.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img src={im.imagens?.[0] || PLACEHOLDER_IMAGE} alt={im.titulo} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 space-y-1.5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground leading-tight">{im.titulo}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground whitespace-nowrap">{im.status}</span>
                      </div>
                      {identity && <p className="text-[11px] text-accent font-semibold">{identity}</p>}
                      <p className="text-[11px] text-muted-foreground">
                        {[im.quartos && `${im.quartos} dorm.`, im.suites && `${im.suites} suítes`, im.area && `${im.area} m²`].filter(Boolean).join(" • ")}
                      </p>
                      <p className="text-base font-bold text-foreground mt-auto">{brl(Number(im.preco || 0))}</p>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/imovel/${im.id}`)}>
                        Ver imóvel
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* localização */}
        <Section id="localizacao" title="Localização">
          <div className="rounded-xl border border-border overflow-hidden">
            {condo.latitude && condo.longitude ? (
              <MiniMap lat={Number(condo.latitude)} lng={Number(condo.longitude)} name={condo.nome} height="340px" />
            ) : (
              <div className="p-6 text-sm text-muted-foreground">Coordenadas não cadastradas.</div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-t border-border">
              <p className="text-xs text-muted-foreground">{fullAddress || "Endereço não informado"}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(
                  condo.latitude && condo.longitude
                    ? `https://www.google.com/maps?q=${condo.latitude},${condo.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress || condo.nome)}`,
                  "_blank"
                )}
              >
                <ExternalLink className="w-4 h-4 mr-1.5" /> Abrir no Google Maps
              </Button>
            </div>
          </div>
        </Section>

        {(materiais.length > 0 || condo.mapa_pdf_url || implantacaoUrl || (condo.videos || []).length > 0) && (
          <Section id="materiais" title="Materiais do condomínio">
            <div className="flex flex-wrap gap-2">
              {implantacaoUrl && (
                <Button size="sm" variant="outline" onClick={() => window.open(implantacaoUrl, "_blank")}>
                  <FileText className="w-4 h-4 mr-1.5" /> Implantação
                </Button>
              )}
              {condo.mapa_pdf_url && (
                <Button size="sm" variant="outline" onClick={() => window.open(condo.mapa_pdf_url, "_blank")}>
                  <FileText className="w-4 h-4 mr-1.5" /> Mapa PDF
                </Button>
              )}
              {(condo.videos || []).map((v: string, i: number) => (
                <Button key={v + i} size="sm" variant="outline" onClick={() => window.open(v, "_blank")}>
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Vídeo {i + 1}
                </Button>
              ))}
              {materiais.map((m, i) => (
                <Button key={m + i} size="sm" variant="outline" onClick={() => window.open(m, "_blank")}>
                  <Download className="w-4 h-4 mr-1.5" /> Material {i + 1}
                </Button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </AppLayout>
  );
}
