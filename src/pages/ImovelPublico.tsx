import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  BedDouble, Bath, Car, Maximize, MapPin, Waves, Paintbrush, Repeat,
  ChevronLeft, ChevronRight, X, Play, Share2, Building2, Loader2,
  MessageCircle, CalendarDays, FileText, Images, HardDrive, Map as MapIcon,
  Ruler, Box, Pencil, Check, Volume2, Maximize2, ArrowLeft, Download,
  LayoutGrid, FileDown,
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
  quadra: string | null;
  lote: string | null;
  box: string | null;
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
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCanEdit(!!data.session));
  }, []);

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
  const isMp4 = !!imovel?.link_video && !yt && /\.(mp4|webm|mov)(\?|$)/i.test(imovel.link_video);
  const hasVideo = !!imovel?.link_video;

  const fullAddress = imovel
    ? [
        [imovel.endereco, imovel.numero].filter(Boolean).join(", "),
        imovel.bairro,
        [imovel.cidade, imovel.estado].filter(Boolean).join(" - "),
        imovel.cep,
      ].filter(Boolean).join(", ")
    : "";

  const subtitle = imovel
    ? [
        imovel.empreendimento ? `Empreendimento: ${imovel.empreendimento}` : null,
        imovel.unidade ? `Apto/Unidade ${imovel.unidade}` : null,
        imovel.quadra || imovel.lote
          ? `Quadra ${imovel.quadra || "-"}, Lote ${imovel.lote || "-"}`
          : null,
        imovel.box ? `Box ${imovel.box}` : null,
      ].filter(Boolean).join(" • ")
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
      const { generatePhotoBookPdf } = await import("@/utils/generatePhotoBookPdf");
      await generatePhotoBookPdf({
        title: imovel.titulo,
        price: Number(imovel.preco),
        priceInstallment: imovel.preco_parcelado,
        address: [imovel.endereco, imovel.numero].filter(Boolean).join(", "),
        neighborhood: imovel.bairro,
        city: [imovel.cidade, imovel.estado].filter(Boolean).join(" - "),
        status: imovel.status,
        type: imovel.tipo,
        empreendimento: imovel.empreendimento,
        unit: imovel.unidade,
        quadra: imovel.quadra,
        lote: imovel.lote,
        box: imovel.box,
        area: imovel.area,
        privateArea: imovel.area_privativa,
        bedrooms: imovel.quartos,
        suites: imovel.suites,
        bathrooms: imovel.banheiros,
        parking: imovel.vagas,
        description: imovel.descricao,
        features: [
          ...(imovel.infraestrutura || []),
          ...(imovel.outras_caracteristicas || []),
          imovel.vista ? `Vista: ${imovel.vista}` : "",
          imovel.padrao ? `Padrão: ${imovel.padrao}` : "",
          imovel.condicao ? `Condição: ${imovel.condicao}` : "",
          imovel.posicao_solar ? `Posição solar: ${imovel.posicao_solar}` : "",
          imovel.vista_mar ? "Vista para o mar" : "",
          imovel.decorado ? "Decorado" : "",
          imovel.aceita_permuta ? "Aceita permuta" : "",
        ].filter(Boolean) as string[],
        brokerName: imovel.corretor_nome,
        agencyName: imovel.imobiliaria_nome,
        images,
        pageUrl: window.location.href,
      });
      toast.dismiss("pdf"); toast.success("PDF gerado!");
    } catch (e) { toast.dismiss("pdf"); toast.error("Erro ao gerar PDF"); }
  };


  const scrollThumbs = (dir: 1 | -1) => {
    thumbsRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
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
  const visitaMsg = encodeURIComponent(`Olá! Gostaria de agendar uma visita ao imóvel: ${imovel.titulo}`);

  const stats = [
    { icon: BedDouble, value: imovel.suites ?? imovel.quartos, label: "Suítes" },
    { icon: Bath, value: imovel.banheiros, label: "Banheiros" },
    { icon: Car, value: imovel.vagas, label: "Vagas" },
    { icon: Ruler, value: `${imovel.area_privativa ?? imovel.area} m²`, label: "Área construída" },
    { icon: Maximize, value: `${imovel.area} m²`, label: "Área do terreno" },
  ];

  const fichaTecnica: [string, string][] = [
    ["Código do imóvel", imovel.id.slice(0, 8).toUpperCase()],
    ["Tipo do imóvel", imovel.tipo],
    ["Status", imovel.status],
    ["Área construída", `${imovel.area_privativa ?? imovel.area} m²`],
    ["Área do terreno", `${imovel.area} m²`],
    ["Quartos", imovel.suites ? `${imovel.quartos} (${imovel.suites} suítes)` : String(imovel.quartos)],
    ["Banheiros", String(imovel.banheiros)],
    ...(imovel.lavabo ? [["Lavabo", String(imovel.lavabo)] as [string, string]] : []),
    ["Vagas", String(imovel.vagas)],
    ...(imovel.padrao ? [["Padrão", imovel.padrao] as [string, string]] : []),
    ...(imovel.condicao ? [["Condição", imovel.condicao] as [string, string]] : []),
    ...(imovel.vista ? [["Vista", imovel.vista] as [string, string]] : []),
    ...(imovel.posicao_solar ? [["Posição solar", imovel.posicao_solar] as [string, string]] : []),
    ["Aceita permuta", imovel.aceita_permuta ? "Sim" : "Não"],
  ];

  const downloads = [
    images.length > 0 && { icon: Images, title: "Baixar Todas as Fotos", sub: `ZIP (${images.length} fotos)`, onClick: handleDownloadFotos },
    hasVideo && { icon: Play, title: "Vídeo do Imóvel", sub: "Assistir agora", onClick: () => document.getElementById("video")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
    imovel.link_360 && { icon: Box, title: "Tour 360°", sub: "Abrir Tour", href: imovel.link_360 },
    imovel.fotos_pdf_url && { icon: FileText, title: "Documentação", sub: "PDF", href: imovel.fotos_pdf_url },
    imovel.link_material && { icon: LayoutGrid, title: "Plantas", sub: "PDF", href: imovel.link_material },
    images.length > 0 && { icon: FileDown, title: "Catálogo do Imóvel", sub: "PDF", onClick: handleDownloadFotos },
  ].filter(Boolean) as { icon: any; title: string; sub: string; href?: string | null; onClick?: () => void }[];

  const scrollTo = (idEl: string) => document.getElementById(idEl)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ===== Barra superior ===== */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <Link to="/imoveis" onClick={(e) => { if (window.history.length > 1) { e.preventDefault(); window.history.back(); } }} className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors min-w-0">
            <ArrowLeft className="w-4 h-4 flex-shrink-0" /> <span className="truncate">Voltar para Imóveis</span>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleShare} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border text-xs sm:text-sm font-semibold text-foreground hover:bg-muted">
              <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Compartilhar</span>
            </button>
            <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border text-xs sm:text-sm font-semibold text-foreground hover:bg-muted">
              <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">WhatsApp</span>
            </a>
            {canEdit && (
              <Link to={`/editar-imovel/${imovel.id}`} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90">
                <Pencil className="w-4 h-4" /> <span className="hidden sm:inline">Editar imóvel</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28">
        {/* ===== Hero player ===== */}
        <div className="relative bg-foreground rounded-xl sm:rounded-2xl overflow-hidden shadow-xl aspect-[4/3] sm:aspect-video">
          {videoPlaying && hasVideo ? (
            yt ? (
              <iframe src={`${yt}?autoplay=1&rel=0`} title="Vídeo do imóvel" className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : isMp4 ? (
              <video src={imovel.link_video!} className="w-full h-full" controls autoPlay playsInline />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <a href={imovel.link_video!} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Abrir vídeo</a>
              </div>
            )
          ) : images.length > 0 ? (
            <img src={images[idx]} alt={`${imovel.titulo} - foto ${idx + 1}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-background/60 text-sm">Sem imagem</div>
          )}

          {/* Badge vídeo */}
          {hasVideo && !videoPlaying && (
            <span className="absolute top-3 left-3 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold shadow-lg">
              Vídeo do Imóvel
            </span>
          )}

          {/* Contador */}
          {images.length > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-foreground/70 text-background text-xs font-bold backdrop-blur-sm">
              <Images className="w-3.5 h-3.5" /> {idx + 1}/{images.length}
            </span>
          )}

          {/* Play central */}
          {hasVideo && !videoPlaying && (
            <button
              aria-label="Reproduzir vídeo"
              onClick={() => setVideoPlaying(true)}
              className="absolute inset-0 flex items-center justify-center group"
            >
              <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-card/90 group-hover:bg-card flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
                <Play className="w-7 h-7 sm:w-9 sm:h-9 text-foreground fill-foreground ml-1" />
              </span>
            </button>
          )}

          {/* Setas */}
          {images.length > 1 && !videoPlaying && (
            <>
              <button aria-label="Foto anterior" onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 hover:bg-card flex items-center justify-center shadow-lg">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button aria-label="Próxima foto" onClick={() => setIdx((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 hover:bg-card flex items-center justify-center shadow-lg">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </>
          )}

          {/* Flags */}
          {!videoPlaying && (imovel.vista_mar || imovel.decorado || imovel.aceita_permuta) && (
            <div className={cn("absolute flex gap-1.5 flex-wrap", hasVideo ? "bottom-14 left-3" : "bottom-3 left-3")}>
              {imovel.vista_mar && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/90 text-white flex items-center gap-1"><Waves className="w-3 h-3" /> Vista Mar</span>}
              {imovel.decorado && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/90 text-white flex items-center gap-1"><Paintbrush className="w-3 h-3" /> Decorado</span>}
              {imovel.aceita_permuta && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500/90 text-white flex items-center gap-1"><Repeat className="w-3 h-3" /> Permuta</span>}
            </div>
          )}

          {/* Barra inferior do player */}
          <div className="absolute bottom-0 inset-x-0 h-11 bg-gradient-to-t from-foreground/80 to-transparent flex items-center justify-end gap-1 px-3">
            {videoPlaying && (
              <button aria-label="Fechar vídeo" onClick={() => setVideoPlaying(false)} className="w-9 h-9 rounded-md flex items-center justify-center text-background hover:bg-card/10">
                <X className="w-4 h-4" />
              </button>
            )}
            {!videoPlaying && images.length > 0 && (
              <button aria-label="Tela cheia" onClick={() => setLightbox(idx)} className="w-9 h-9 rounded-md flex items-center justify-center text-background hover:bg-card/10">
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ===== Miniaturas ===== */}
        {images.length > 1 && (
          <div className="relative mt-3 flex items-center gap-2">
            <button aria-label="Miniaturas anteriores" onClick={() => scrollThumbs(-1)} className="hidden sm:flex w-8 h-8 rounded-full border border-border bg-card items-center justify-center flex-shrink-0 hover:bg-muted">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <div ref={thumbsRef} className="flex gap-2 overflow-x-auto pb-1 scroll-smooth min-w-0" style={{ scrollbarWidth: "none" }}>
              {images.map((img, i) => (
                <button key={i} onClick={() => { setIdx(i); setVideoPlaying(false); }} className={cn("flex-shrink-0 w-24 h-16 sm:w-36 sm:h-24 rounded-lg overflow-hidden border-2 transition-all", i === idx && !videoPlaying ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <button aria-label="Próximas miniaturas" onClick={() => scrollThumbs(1)} className="hidden sm:flex w-8 h-8 rounded-full border border-border bg-card items-center justify-center flex-shrink-0 hover:bg-muted">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        )}

        {/* ===== Cabeçalho do imóvel ===== */}
        <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6">
          {/* Breadcrumb */}
          <nav className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-primary">Início</Link>
            <span>›</span>
            <Link to="/imoveis" className="hover:text-primary">Imóveis</Link>
            <span>›</span>
            <span>{imovel.tipo}</span>
            {imovel.empreendimento && (<><span>›</span><span className="text-foreground font-medium">{imovel.empreendimento}</span></>)}
          </nav>

          <span className="inline-block px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wide mt-3">
            {imovel.status}
          </span>
          <h1 className="text-xl sm:text-3xl font-black text-foreground leading-tight mt-2">{imovel.titulo}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm font-semibold text-primary mt-1.5">{subtitle}</p>
          )}
          <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-muted-foreground mt-1.5 flex items-start gap-1.5 hover:text-primary transition-colors">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{fullAddress}</span>
          </a>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 mt-4 sm:mt-5 items-center">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-primary">{fmt(Number(imovel.preco))}</p>
              {imovel.preco_parcelado ? (
                <p className="text-xs text-muted-foreground mt-1">Parcelado a partir de {fmt(Number(imovel.preco_parcelado))}</p>
              ) : null}
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-y-4 gap-x-2">
              {stats.map((s, i) => (
                <div key={i} className="text-center px-1">
                  <s.icon className="w-5 h-5 text-primary mx-auto" />
                  <p className="text-sm font-bold text-foreground mt-1">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-5">
            <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
              <MessageCircle className="w-4 h-4" /> Falar com Corretor
            </a>
            <a href={`https://wa.me/?text=${visitaMsg}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors">
              <CalendarDays className="w-4 h-4" /> Agendar Visita
            </a>
          </div>

          {(imovel.corretor_nome || imovel.imobiliaria_nome) && (
            <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
              Anunciado por <strong className="text-foreground">{imovel.corretor_nome || imovel.imobiliaria_nome}</strong>
            </p>
          )}
        </div>

        {/* ===== Downloads e Materiais ===== */}
        {(downloads.length > 0 || imovel.drive_fotos_url) && (
          <div id="downloads" className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6 scroll-mt-20">
            <h2 className="text-base font-bold text-foreground">Downloads e Materiais</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Baixe fotos, vídeos e documentos do imóvel</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
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

        {/* ===== Vídeo do Imóvel (largura total) ===== */}
        {hasVideo && (
          <div id="video" className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6 scroll-mt-20">
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" /> Vídeo do Imóvel
            </h2>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-foreground">
              {yt ? (
                <iframe src={yt} title="Vídeo do imóvel" className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              ) : isMp4 ? (
                <video src={imovel.link_video!} className="w-full h-full" controls playsInline />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <a href={imovel.link_video!} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Abrir vídeo</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Tour 360° (largura total) ===== */}
        {imovel.link_360 && (
          <div id="tour360" className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6 scroll-mt-20">
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              Tour 360° <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">Novo</span>
            </h2>
            {imovel.link_360.includes("http") ? (
              <>
                <div className="aspect-video w-full rounded-xl overflow-hidden">
                  <iframe src={imovel.link_360} title="Tour 360" className="w-full h-full border-0" allowFullScreen />
                </div>
                <a href={imovel.link_360} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted">
                  <Box className="w-4 h-4 text-primary" /> Abrir Tour 360° em tela cheia
                </a>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{imovel.link_360}</p>
            )}
          </div>
        )}

        {/* ===== Sobre / Características ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6 items-start">
          {imovel.descricao && (
            <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h2 className="text-base font-bold text-foreground mb-3">Sobre o Imóvel</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{imovel.descricao}</p>
              {imovel.outras_caracteristicas && imovel.outras_caracteristicas.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-5 pt-5 border-t border-border">
                  {imovel.outras_caracteristicas.map((c, i) => (
                    <span key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5" /></span>
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
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

        {/* ===== Infraestrutura / pagamento ===== */}
        {imovel.infraestrutura && imovel.infraestrutura.length > 0 && (
          <ListBlock title="Infraestrutura e Lazer" items={imovel.infraestrutura} />
        )}
        {imovel.condicoes_pagamento && imovel.condicoes_pagamento.length > 0 && (
          <ListBlock title="Condições de Pagamento" items={imovel.condicoes_pagamento} />
        )}

        {/* ===== Localização ===== */}
        {mapEmbedUrl && (
          <div id="localizacao" className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6 scroll-mt-20">
            <h2 className="text-base font-bold text-foreground mb-3">Localização</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden border border-border">
                <iframe src={mapEmbedUrl} title="Mapa do imóvel" className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <div>
                <p className="text-sm text-foreground font-medium">{fullAddress}</p>
                <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted">
                  <MapIcon className="w-4 h-4 text-primary" /> Ver no Google Maps
                </a>
              </div>
            </div>
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground py-8">
          MV BROKER CONNECT • Para mais informações, entre em contato com o anunciante.
        </footer>
      </main>

      {/* ===== Barra inferior de recursos (desktop) ===== */}
      <div className="hidden lg:block fixed bottom-3 inset-x-3 z-40">
        <div className="max-w-6xl mx-auto bg-foreground text-background rounded-2xl shadow-2xl px-4 py-3 grid grid-cols-7 gap-2">
          <BottomResource icon={Images} title="Galeria de Fotos" sub={`${images.length} fotos`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <BottomResource icon={Play} title="Vídeo do Imóvel" sub={hasVideo ? "Disponível" : "Não informado"} onClick={hasVideo ? () => { setVideoPlaying(true); window.scrollTo({ top: 0, behavior: "smooth" }); } : undefined} />
          <BottomResource icon={Box} title="Tour 360°" sub={imovel.link_360 ? "Disponível" : "Não informado"} onClick={imovel.link_360 ? () => scrollTo("tour360") : undefined} />
          <BottomResource icon={LayoutGrid} title="Plantas" sub={imovel.link_material ? "Ver plantas" : "Não informado"} onClick={imovel.link_material ? () => window.open(imovel.link_material!, "_blank") : undefined} />
          <BottomResource icon={FileText} title="Documentação" sub={imovel.fotos_pdf_url || imovel.link_material ? "Em dia" : "Não informada"} onClick={imovel.fotos_pdf_url ? () => window.open(imovel.fotos_pdf_url!, "_blank") : undefined} />
          <BottomResource icon={HardDrive} title="Abrir no Drive" sub={imovel.drive_fotos_url ? "Acessar pasta" : "Não informado"} onClick={imovel.drive_fotos_url ? () => window.open(imovel.drive_fotos_url!, "_blank") : undefined} />
          <BottomResource icon={Share2} title="Compartilhar" sub="Enviar imóvel" onClick={handleShare} />
        </div>
      </div>

      {/* ===== Barra fixa de CTA no mobile ===== */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-shrink-0">
            <p className="text-base font-black text-primary leading-tight truncate">{fmt(Number(imovel.preco))}</p>
            {imovel.preco_parcelado ? (
              <p className="text-[10px] text-muted-foreground leading-tight">a partir de {fmt(Number(imovel.preco_parcelado))}/mês</p>
            ) : null}
          </div>
          <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
            <MessageCircle className="w-4 h-4" /> Falar com Corretor
          </a>
          <a href={`https://wa.me/?text=${visitaMsg}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-primary text-primary text-xs font-bold">
            <CalendarDays className="w-4 h-4" /> Visita
          </a>
        </div>
      </div>

      {/* ===== Lightbox ===== */}
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

function BottomResource({ icon: Icon, title, sub, onClick }: { icon: any; title: string; sub: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} className={cn("flex items-center gap-2.5 text-left rounded-lg px-2 py-1 transition-colors", onClick ? "hover:bg-background/10 cursor-pointer" : "opacity-50 cursor-default")}>
      <span className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-background" /></span>
      <span className="min-w-0">
        <span className="block text-xs font-bold leading-tight truncate">{title}</span>
        <span className="block text-[11px] opacity-70">{sub}</span>
      </span>
    </button>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6">
      <h2 className="text-base font-bold text-foreground mb-3">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-foreground">{it}</span>
        ))}
      </div>
    </div>
  );
}
