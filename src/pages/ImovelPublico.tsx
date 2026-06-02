import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  BedDouble, Bath, Car, Maximize, MapPin, Waves, Paintbrush, Repeat,
  ChevronLeft, ChevronRight, X, Play, Eye, Share2, Download, Building2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImovelRow {
  id: string;
  titulo: string;
  endereco: string;
  bairro: string | null;
  cidade: string;
  estado: string | null;
  tipo: string;
  status: string;
  preco: number;
  area: number;
  area_privativa: number | null;
  quartos: number;
  banheiros: number;
  vagas: number;
  lavabo: number | null;
  imagens: string[] | null;
  descricao: string | null;
  link_video: string | null;
  link_360: string | null;
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
  posicao_solar: string | null;
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
        .select("*")
        .eq("id", id)
        .eq("ativo_site", true)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setImovel(data as any);
        // bump views
        supabase.rpc("increment_imovel_views", { imovel_id: id });
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header simples sem corretor */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Building2 className="w-5 h-5 text-primary" /> MV BROKER CONNECT
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadFotos} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs sm:text-sm font-semibold text-foreground hover:bg-muted">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Baixar fotos</span>
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90">
              <Share2 className="w-4 h-4" /> Compartilhar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Galeria */}
        <div className="relative bg-foreground rounded-2xl overflow-hidden shadow-xl">
          {images.length > 0 ? (
            <button onClick={() => setLightbox(idx)} className="block w-full aspect-[16/10] cursor-zoom-in">
              <img src={images[idx]} alt={imovel.titulo} className="w-full h-full object-cover" />
            </button>
          ) : (
            <div className="w-full aspect-[16/10] flex items-center justify-center text-background/60">Sem fotos</div>
          )}
          {images.length > 1 && (
            <>
              <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 hover:bg-card flex items-center justify-center shadow-lg">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={() => setIdx((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 hover:bg-card flex items-center justify-center shadow-lg">
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
              <button key={i} onClick={() => setIdx(i)} className={cn("flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all", i === idx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100")}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Header info */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground leading-tight">{imovel.titulo}</h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {[imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(" - ")}
              </p>
              {imovel.empreendimento && (
                <p className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 mt-2">
                  <Building2 className="w-3.5 h-3.5" /> {imovel.empreendimento}{imovel.unidade ? ` • Un. ${imovel.unidade}` : ""}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl sm:text-4xl font-black text-primary">{fmt(Number(imovel.preco))}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{imovel.tipo}</p>
            </div>
          </div>

          {/* specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
            <Spec icon={BedDouble} label="Quartos" value={imovel.quartos} />
            <Spec icon={Bath} label="Banheiros" value={imovel.banheiros} />
            <Spec icon={Car} label="Vagas" value={imovel.vagas} />
            <Spec icon={Maximize} label="Área" value={`${imovel.area}m²`} />
          </div>
        </div>

        {/* Vídeo */}
        {imovel.link_video && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button onClick={() => setShowVideo((s) => !s)} className="w-full flex items-center justify-between p-4 hover:bg-muted/50">
              <span className="flex items-center gap-2 text-sm font-bold"><Play className="w-4 h-4 text-primary fill-primary" /> Vídeo do Imóvel</span>
              <ChevronRight className={cn("w-4 h-4 transition-transform", showVideo && "rotate-90")} />
            </button>
            {showVideo && yt && (
              <div className="aspect-video bg-foreground">
                <iframe src={yt} title="Vídeo" className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              </div>
            )}
          </div>
        )}

        {/* 360 */}
        {imovel.link_360 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 p-4 bg-muted/40 text-sm font-bold"><Eye className="w-4 h-4 text-accent" /> Tour Virtual 360°</div>
            {imovel.link_360.includes("http") ? (
              <div className="aspect-video"><iframe src={imovel.link_360} title="360" className="w-full h-full border-0" allowFullScreen /></div>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">{imovel.link_360}</p>
            )}
          </div>
        )}

        {/* Descrição */}
        {imovel.descricao && (
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
            <h2 className="text-base font-bold text-foreground mb-3">Sobre o imóvel</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{imovel.descricao}</p>
          </div>
        )}

        {/* Infraestrutura */}
        {imovel.infraestrutura && imovel.infraestrutura.length > 0 && (
          <ListBlock title="Infraestrutura e Lazer" items={imovel.infraestrutura} />
        )}
        {imovel.outras_caracteristicas && imovel.outras_caracteristicas.length > 0 && (
          <ListBlock title="Características" items={imovel.outras_caracteristicas} />
        )}
        {imovel.condicoes_pagamento && imovel.condicoes_pagamento.length > 0 && (
          <ListBlock title="Condições de Pagamento" items={imovel.condicoes_pagamento} />
        )}

        <footer className="text-center text-xs text-muted-foreground py-6">
          MV BROKER CONNECT • Para mais informações, entre em contato com o anunciante.
        </footer>
      </main>

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

function Spec({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4.5 h-4.5 text-primary" /></div>
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
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
