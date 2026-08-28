import { useEffect, useMemo, useState } from "react";

import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  BedDouble, Bath, Car, Maximize, MapPin, Waves, Paintbrush, Repeat,
  ChevronLeft, ChevronRight, X, Play, Eye, Share2, Download, Building2, Loader2,
  MessageCircle, CalendarDays, FileText, Images, HardDrive, Map as MapIcon,
  Ruler, Box, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackPropertyView } from "@/lib/trackPropertyView";
import { PUBLIC_IMOVEL_COLUMNS } from "@/lib/publicImovelColumns";
import { toast } from "sonner";

interface ImovelRow {
  id: string;
  titulo: string;
  endereco: string;
  numero: string | null;
  complemento: string | null;
  cep: string | null;
  bairro: string | null;
  cidade: string;
  estado: string | null;
  tipo: string;
  status: string;
  preco: number;
  preco_parcelado: number | null;
  area: number;
  area_privativa: number | null;
  quartos: number;
  suites: number | null;
  banheiros: number;
  vagas: number;
  lavabo: number | null;
  imagens: string[] | null;
  descricao: string | null;
  link_video: string | null;
  link_360: string | null;
  link_material: string | null;
  drive_fotos_url: string | null;
  fotos_pdf_url: string | null;
  vista_mar: boolean;
  decorado: boolean;
  aceita_permuta: boolean;
  ativo_site: boolean;
  empreendimento: string | null;
  unidade: string | null;
  infraestrutura: string[] | null;
  outras_caracteristicas: string[] | null;
  condicoes_pagamento: string[] | null;
  vista: string | null;
  padrao: string | null;
  condicao: string | null;
  posicao_solar: string | null;
  posicao_predio: string | null;
  corretor_nome: string | null;
  imobiliaria_nome: string | null;
  latitude: number | null;
  longitude: number | null;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);

function youtubeEmbed(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function ImovelPublico() {
  const { id } = useParams<{ id: string }>();
  const [imovel, setImovel] = useState<ImovelRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("imoveis")
        .select(PUBLIC_IMOVEL_COLUMNS)
        .eq("id", id)
        .eq("ativo_site", true)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setImovel(data as any);
        trackPropertyView(id);
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!imovel) return;
    document.title = `${imovel.titulo} - ${fmt(Number(imovel.preco))}`;
    const desc = `${imovel.tipo} em ${imovel.bairro || imovel.cidade} • ${imovel.quartos} quartos • ${imovel.area}m²`;
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", desc);
    const og = (prop: string, content: string) => {
      let t = document.querySelector(`meta[property="${prop}"]`);
      if (!t) { t = document.createElement("meta"); t.setAttribute("property", prop); document.head.appendChild(t); }
      t.setAttribute("content", content);
    };
    og("og:title", imovel.titulo);
    og("og:description", desc);
    if (imovel.imagens?.[0]) og("og:image", imovel.imagens[0]);
    og("og:type", "website");
  }, [imovel]);

  const images = useMemo(() => imovel?.imagens?.filter(Boolean) || [], [imovel]);
  const yt = imovel?.link_video ? youtubeEmbed(imovel.link_video) : null;

  const fullAddress = imovel
    ? [
        [imovel.endereco, imovel.numero].filter(Boolean).join(", "),
        imovel.bairro,
        [imovel.cidade, imovel.estado].filter(Boolean).join(" - "),
        imovel.cep,
      ].filter(Boolean).join(", ")
    : "";

  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const mapEmbedUrl = imovel?.latitude && imovel?.longitude
    ? `https://maps.google.com/maps?q=${imovel.latitude},${imovel.longitude}&z=15&output=embed`
    : fullAddress
      ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&z=15&output=embed`
      : null;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: imovel?.titulo, text: imovel?.titulo, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const handleDownloadFotos = async () => {
    if (!imovel || !images.length) { toast.info("Sem fotos para baixar."); return; }
    try {
      toast.loading("Gerando PDF...", { id: "pdf" });
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(20); pdf.text(imovel.titulo, pageW / 2, 30, { align: "center" });
      pdf.setFontSize(14); pdf.text(fmt(Number(imovel.preco)), pageW / 2, 42, { align: "center" });
      pdf.setFontSize(11); pdf.text(`${imovel.endereco} - ${imovel.cidade}`, pageW / 2, 52, { align: "center" });
      const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = src;
      });
      for (const src of images) {
        try {
          const img = await loadImg(src);
          const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext("2d")!.drawImage(img, 0, 0);
          const d = c.toDataURL("image/jpeg", 0.85);
          const r = img.naturalWidth / img.naturalHeight;
          let w = pageW - 20, h = w / r; if (h > pageH - 20) { h = pageH - 20; w = h * r; }
          pdf.addPage(); pdf.addImage(d, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
        } catch {}
      }
      pdf.save(`${imovel.titulo.replace(/\s+/g, "_")}.pdf`);
      toast.dismiss("pdf"); toast.success("PDF gerado!");
    } catch (e) { toast.dismiss("pdf"); toast.error("Erro ao gerar PDF"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !imovel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mb-3" />
        <h1 className="text-xl font-bold text-foreground">Imóvel indisponível</h1>
        <p className="text-sm text-muted-foreground mt-1">Este imóvel não está mais ativo ou o link é inválido.</p>
        <Link to="/" className="mt-5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Ir para o site</Link>
      </div>
    );
  }

  const whatsappMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${imovel.titulo} - ${fmt(Number(imovel.preco))} (${window.location.href})`);
  const specs = [
    { icon: BedDouble, value: imovel.quartos, label: "Quartos" },
    ...(imovel.suites ? [{ icon: BedDouble, value: imovel.suites, label: "Suítes" }] : []),
    { icon: Bath, value: imovel.banheiros, label: "Banheiros" },
    { icon: Car, value: imovel.vagas, label: "Vagas" },
    ...(imovel.area_privativa ? [{ icon: Ruler, value: `${imovel.area_privativa} m²`, label: "Área privativa" }] : []),
    { icon: Maximize, value: `${imovel.area} m²`, label: "Área total" },
  ];

  const fichaTecnica: [string, string][] = [
    ["Tipo do imóvel", imovel.tipo],
    ["Status", imovel.status],
    ["Área total", `${imovel.area} m²`],
    ...(imovel.area_privativa ? [["Área privativa", `${imovel.area_privativa} m²`] as [string, string]] : []),
    ["Quartos", String(imovel.quartos)],
    ...(imovel.suites ? [["Suítes", String(imovel.suites)] as [string, string]] : []),
    ["Banheiros", String(imovel.banheiros)],
    ...(imovel.lavabo ? [["Lavabo", String(imovel.lavabo)] as [string, string]] : []),
    ["Vagas", String(imovel.vagas)],
    ...(imovel.padrao ? [["Padrão", imovel.padrao] as [string, string]] : []),
    ...(imovel.condicao ? [["Condição", imovel.condicao] as [string, string]] : []),
    ...(imovel.vista ? [["Vista", imovel.vista] as [string, string]] : []),
    ...(imovel.posicao_solar ? [["Posição solar", imovel.posicao_solar] as [string, string]] : []),
    ...(imovel.posicao_predio ? [["Posição no prédio", imovel.posicao_predio] as [string, string]] : []),
    ["Aceita permuta", imovel.aceita_permuta ? "Sim" : "Não"],
  ];

  const downloads = [
    images.length > 0 && { icon: Images, title: "Baixar Todas as Fotos", sub: `PDF (${images.length} fotos)`, onClick: handleDownloadFotos },
    imovel.link_video && { icon: Play, title: "Vídeo do Imóvel", sub: "Assistir agora", href: imovel.link_video },
    imovel.link_360 && { icon: Box, title: "Tour 360°", sub: "Abrir tour", href: imovel.link_360 },
    imovel.fotos_pdf_url && { icon: FileText, title: "Catálogo do Imóvel", sub: "PDF", href: imovel.fotos_pdf_url },
    imovel.link_material && { icon: FileText, title: "Material / Plantas", sub: "Abrir arquivo", href: imovel.link_material },
  ].filter(Boolean) as { icon: any; title: string; sub: string; href?: string; onClick?: () => void }[];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground min-w-0">
            <Building2 className="w-5 h-5 text-primary flex-shrink-0" /> <span className="truncate">MV BROKER CONNECT</span>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleDownloadFotos} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border text-xs sm:text-sm font-semibold text-foreground hover:bg-muted">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Baixar fotos</span>
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90">
              <Share2 className="w-4 h-4" /> <span className="hidden xs:inline sm:inline">Compartilhar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 sm:gap-6 items-start">
          {/* ============ COLUNA ESQUERDA ============ */}
          <div className="space-y-4 sm:space-y-6 min-w-0">
            {/* Galeria */}
            <div className="relative bg-foreground rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
              {images.length > 0 ? (
                <button onClick={() => setLightbox(idx)} className="block w-full aspect-[4/3] sm:aspect-[16/10] cursor-zoom-in">
                  <img src={images[idx]} alt={`${imovel.titulo} - foto ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ) : (
                <div className="w-full aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center text-background/60 text-sm">Sem imagem</div>
              )}
              {images.length > 1 && (
                <>
                  <button aria-label="Foto anterior" onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 hover:bg-card flex items-center justify-center shadow-lg">
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <button aria-label="Próxima foto" onClick={() => setIdx((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 hover:bg-card flex items-center justify-center shadow-lg">
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-foreground/60 text-background text-xs font-bold backdrop-blur-sm">
                    {idx + 1} / {images.length}
                  </div>
                </>
              )}
              <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                {imovel.vista_mar && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/90 text-white flex items-center gap-1"><Waves className="w-3 h-3" /> Vista Mar</span>}
                {imovel.decorado && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/90 text-white flex items-center gap-1"><Paintbrush className="w-3 h-3" /> Decorado</span>}
                {imovel.aceita_permuta && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500/90 text-white flex items-center gap-1"><Repeat className="w-3 h-3" /> Permuta</span>}
              </div>
            </div>

            {/* Thumbs */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setIdx(i)} className={cn("flex-shrink-0 w-20 h-14 sm:w-28 sm:h-20 rounded-lg overflow-hidden border-2 transition-all", i === idx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100")}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Vídeo */}
            {imovel.link_video && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <button onClick={() => setShowVideo((s) => !s)} className="w-full flex items-center justify-between p-4 hover:bg-muted/50">
                  <span className="flex items-center gap-2 text-sm font-bold"><Play className="w-4 h-4 text-primary fill-primary" /> Vídeo do Imóvel</span>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", showVideo && "rotate-90")} />
                </button>
                {showVideo && (yt ? (
                  <div className="aspect-video bg-foreground">
                    <iframe src={yt} title="Vídeo do imóvel" className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                  </div>
                ) : (
                  <a href={imovel.link_video} target="_blank" rel="noopener noreferrer" className="block p-4 text-sm text-primary font-semibold">Abrir vídeo <ExternalLink className="inline w-3.5 h-3.5" /></a>
                ))}
              </div>
            )}

            {/* Tour 360 + Sobre + Ficha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {imovel.link_360 && (
                <div className="bg-card border border-border rounded-2xl p-5 md:col-span-2">
                  <h2 className="flex items-center gap-2 text-base font-bold text-foreground mb-3">
                    <Eye className="w-4 h-4 text-primary" /> Tour Virtual 360°
                  </h2>
                  {imovel.link_360.includes("http") ? (
                    <div className="aspect-video rounded-xl overflow-hidden">
                      <iframe src={imovel.link_360} title="Tour 360" className="w-full h-full border-0" allowFullScreen />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{imovel.link_360}</p>
                  )}
                </div>
              )}

              {imovel.descricao && (
                <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                  <h2 className="text-base font-bold text-foreground mb-3">Sobre o Imóvel</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{imovel.descricao}</p>
                  {imovel.outras_caracteristicas && imovel.outras_caracteristicas.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-5 pt-5 border-t border-border">
                      {imovel.outras_caracteristicas.map((c, i) => (
                        <span key={i} className="flex items-center gap-2 text-sm text-foreground">
                          <span className="w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[9px] font-black">✓</span>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ficha técnica */}
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                <h2 className="text-base font-bold text-foreground mb-3">Características</h2>
                <dl className="divide-y divide-border">
                  {fichaTecnica.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3 py-2">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="text-xs font-bold text-foreground text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Infraestrutura / pagamento */}
            {imovel.infraestrutura && imovel.infraestrutura.length > 0 && (
              <ListBlock title="Infraestrutura e Lazer" items={imovel.infraestrutura} />
            )}
            {imovel.condicoes_pagamento && imovel.condicoes_pagamento.length > 0 && (
              <ListBlock title="Condições de Pagamento" items={imovel.condicoes_pagamento} />
            )}
          </div>

          {/* ============ SIDEBAR ============ */}
          <aside className="lg:sticky lg:top-20 space-y-4 sm:space-y-5">
            {/* Resumo + CTA */}
            <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <span className="inline-block px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wide">
                {imovel.status}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-foreground leading-tight mt-2.5 sm:mt-3">{imovel.titulo}</h1>
              <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground mt-1.5 flex items-start gap-1.5 hover:text-primary transition-colors">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{[imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(" - ")}</span>
              </a>
              {imovel.empreendimento && (
                <p className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 mt-2">
                  <Building2 className="w-3.5 h-3.5" /> {imovel.empreendimento}{imovel.unidade ? ` • Un. ${imovel.unidade}` : ""}
                </p>
              )}

              <p className="text-2xl sm:text-4xl font-black text-primary mt-3 sm:mt-4">{fmt(Number(imovel.preco))}</p>
              {imovel.preco_parcelado ? (
                <p className="text-xs text-muted-foreground mt-1">Parcelado a partir de {fmt(Number(imovel.preco_parcelado))}</p>
              ) : null}

              {/* Specs */}
              <div className="grid grid-cols-3 gap-y-4 gap-x-2 mt-5 pt-5 border-t border-border">
                {specs.map((s, i) => (
                  <div key={i} className="text-center">
                    <s.icon className="w-4 h-4 text-primary mx-auto" />
                    <p className="text-sm font-bold text-foreground mt-1">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">
                <a
                  href={`https://wa.me/?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Falar com Corretor
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Olá! Gostaria de agendar uma visita ao imóvel: ${imovel.titulo}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors"
                >
                  <CalendarDays className="w-4 h-4" /> Agendar Visita
                </a>
              </div>

              {(imovel.corretor_nome || imovel.imobiliaria_nome) && (
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                  Anunciado por <strong className="text-foreground">{imovel.corretor_nome || imovel.imobiliaria_nome}</strong>
                </p>
              )}
            </div>

            {/* Downloads e Materiais */}
            {downloads.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                <h2 className="text-base font-bold text-foreground">Downloads e Materiais</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Baixe fotos, vídeos e documentos do imóvel</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  {downloads.map((d, i) => {
                    const inner = (
                      <>
                        <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <d.icon className="w-4 h-4 text-primary" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-foreground leading-tight">{d.title}</span>
                          <span className="block text-[11px] text-muted-foreground">{d.sub}</span>
                        </span>
                      </>
                    );
                    const cls = "flex items-center gap-2.5 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/40 transition-colors text-left";
                    return d.href
                      ? <a key={i} href={d.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                      : <button key={i} onClick={d.onClick} className={cls}>{inner}</button>;
                  })}
                </div>

                {imovel.drive_fotos_url && (
                  <a href={imovel.drive_fotos_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-3 mt-2 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/40 transition-colors">
                    <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><HardDrive className="w-4 h-4 text-primary" /></span>
                    <span>
                      <span className="block text-xs font-bold text-foreground">Abrir Pasta no Google Drive</span>
                      <span className="block text-[11px] text-muted-foreground">Acesse todos os arquivos</span>
                    </span>
                  </a>
                )}
              </div>
            )}

            {/* Localização */}
            {mapEmbedUrl && (
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                <h2 className="text-base font-bold text-foreground mb-3">Localização</h2>
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border">
                  <iframe src={mapEmbedUrl} title="Mapa do imóvel" className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <p className="text-xs text-muted-foreground mt-3">{fullAddress}</p>
                <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted">
                  <MapIcon className="w-4 h-4 text-primary" /> Ver no Google Maps
                </a>
              </div>
            )}
          </aside>
        </div>

        {/* Barra de recursos */}
        <div className="bg-card border border-border rounded-2xl mt-6 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 divide-border">
          <Resource icon={Images} title="Galeria de Fotos" sub={`${images.length} foto${images.length === 1 ? "" : "s"}`} />
          <Resource icon={Play} title="Vídeo do Imóvel" sub={imovel.link_video ? "Disponível" : "Não informado"} />
          <Resource icon={Box} title="Tour 360°" sub={imovel.link_360 ? "Disponível" : "Não informado"} />
          <Resource icon={FileText} title="Documentação" sub={imovel.fotos_pdf_url || imovel.link_material ? "Disponível" : "Não informada"} />
        </div>

        <footer className="text-center text-xs text-muted-foreground py-8">
          MV BROKER CONNECT • Para mais informações, entre em contato com o anunciante.
        </footer>
      </main>

      {/* Barra fixa de CTA no mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-shrink-0">
            <p className="text-base font-black text-primary leading-tight truncate">{fmt(Number(imovel.preco))}</p>
            {imovel.preco_parcelado ? (
              <p className="text-[10px] text-muted-foreground leading-tight">a partir de {fmt(Number(imovel.preco_parcelado))}/mês</p>
            ) : null}
          </div>
          <a
            href={`https://wa.me/?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
          >
            <MessageCircle className="w-4 h-4" /> Falar com Corretor
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Olá! Gostaria de agendar uma visita ao imóvel: ${imovel.titulo}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-primary text-primary text-xs font-bold"
          >
            <CalendarDays className="w-4 h-4" /> Visita
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && images[lightbox] && (
        <div className="fixed inset-0 bg-foreground/95 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-11 h-11 rounded-full bg-card/10 hover:bg-card/20 flex items-center justify-center text-background"><X className="w-6 h-6" /></button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! - 1 + images.length) % images.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/10 hover:bg-card/20 flex items-center justify-center text-background"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! + 1) % images.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/10 hover:bg-card/20 flex items-center justify-center text-background"><ChevronRight className="w-6 h-6" /></button>
            </>
          )}
          <img src={images[lightbox]} alt="" onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}

function Resource({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-primary" /></span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-foreground leading-tight">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{sub}</span>
      </span>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
      <h2 className="text-base font-bold text-foreground mb-3">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-foreground">{it}</span>
        ))}
      </div>
    </div>
  );
}
