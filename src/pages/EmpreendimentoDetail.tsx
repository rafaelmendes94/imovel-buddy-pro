import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MiniMap } from "@/components/MiniMap";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/mockData";
import {
  ArrowLeft, Building2, MapPin, Home, Edit, Share2, ExternalLink, Loader2,
  BedDouble, Bath, Car, Ruler, Layers, Wrench, Calendar, Image, Video, Eye, Download, X,
  Camera, FolderDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaGalleryView } from "@/components/MediaGalleryView";
import { useSmartBack } from "@/lib/useSmartBack";

const statusColors: Record<string, string> = {
  "Em construção": "bg-warning/10 text-warning border-warning/30",
  Pronto: "bg-success/10 text-success border-success/30",
  Lançamento: "bg-info/10 text-info border-info/30",
  "Em vendas": "bg-accent/10 text-accent border-accent/30",
};

const imovelStatusColors: Record<string, string> = {
  Disponível: "bg-success/10 text-success border-success/30",
  Vendido: "bg-destructive/10 text-destructive border-destructive/30",
  Reservado: "bg-warning/10 text-warning border-warning/30",
  Alugado: "bg-info/10 text-info border-info/30",
};

export default function EmpreendimentoDetail() {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const handleBack = useSmartBack("/empreendimentos");
  const [emp, setEmp] = useState<any>(null);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const isInternal = !!id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (id) {
        const [eRes, iRes] = await Promise.all([
          supabase.from("empreendimentos").select("*").eq("id", id).maybeSingle(),
          supabase.from("imoveis").select("*").eq("empreendimento_id", id),
        ]);
        if (eRes.data) setEmp(eRes.data);
        if (iRes.data) setImoveis(iRes.data);
      }
      setLoading(false);
    };
    if (id) load();
    else setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!emp) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Loteamento não encontrado</p>
          <Link to="/empreendimentos" className="text-accent hover:underline mt-2 inline-block">Voltar</Link>
        </div>
      </AppLayout>
    );
  }

  const fullAddress = [emp.endereco, emp.numero, emp.complemento, emp.bairro, emp.cidade, emp.estado].filter(Boolean).join(", ");
  const gallery: string[] = emp.imagens || [];
  const fotosEmp: string[] = emp.fotos_empreendimento || [];
  const fotosInfra: string[] = emp.fotos_infra || [];
  const videosArr: string[] = emp.videos || [];
  const materialDigital: string[] = emp.material_digital || [];
  const hasMedia = gallery.length > 0 || emp.link_video || emp.link_360 || fotosEmp.length || fotosInfra.length || videosArr.length || materialDigital.length;

  function shareWhatsApp() {
    const text = `🏗️ ${emp.nome}\n📍 ${fullAddress}\n🔗 ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function downloadImage(url: string) {
    window.open(url, "_blank");
  }

  function downloadAll() {
    gallery.forEach((url) => window.open(url, "_blank"));
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/empreendimentos" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{emp.nome}</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{fullAddress}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button onClick={shareWhatsApp} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Share2 className="w-4 h-4" /> WhatsApp
            </button>
            <button onClick={() => navigate(`/editar-empreendimento/${emp.id}`)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Edit className="w-4 h-4" /> Editar
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="rounded-xl overflow-hidden h-64">
          <img src={emp.imagem_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop"} alt={emp.nome} className="w-full h-full object-cover" />
        </div>

        {/* Info Bar */}
        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-card border border-border">
          {emp.status && (
            <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border", statusColors[emp.status] || "bg-muted text-muted-foreground")}>{emp.status}</span>
          )}
          {emp.tipo && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="w-4 h-4 text-accent" />{emp.tipo}</div>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Layers className="w-4 h-4 text-accent" />{emp.total_unidades} unidades</div>
          {emp.construtora && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wrench className="w-4 h-4 text-accent" />{emp.construtora}</div>}
          {emp.previsao_entrega && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="w-4 h-4 text-accent" />Entrega: {emp.previsao_entrega}</div>}
          {emp.cep && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4 text-accent" />CEP {emp.cep}</div>}
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="info">Informações</TabsTrigger>
            {hasMedia && <TabsTrigger value="midia">Mídia ({gallery.length})</TabsTrigger>}
            <TabsTrigger value="imoveis">Imóveis ({imoveis.length})</TabsTrigger>
            <TabsTrigger value="localizacao">Localização</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            {emp.descricao && (
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{emp.descricao}</p>
              </div>
            )}
            {emp.infraestrutura && emp.infraestrutura.length > 0 && (
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Infraestrutura</h3>
                <div className="flex flex-wrap gap-2">
                  {emp.infraestrutura.map((i: string) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20">{i}</span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {hasMedia && (
            <TabsContent value="midia" className="space-y-4">
              {/* Links */}
              <div className="flex flex-wrap gap-3">
                {emp.link_video && (
                  <a href={emp.link_video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors border border-destructive/20">
                    <Video className="w-4 h-4" /> Vídeo
                  </a>
                )}
                {emp.link_360 && (
                  <a href={emp.link_360} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-info/10 text-info text-sm font-semibold hover:bg-info/20 transition-colors border border-info/20">
                    <Eye className="w-4 h-4" /> Tour 360°
                  </a>
                )}
                {gallery.length > 0 && (
                  <button onClick={downloadAll} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors border border-accent/20">
                    <Download className="w-4 h-4" /> Baixar Todas ({gallery.length})
                  </button>
                )}
              </div>

              {/* Gallery Grid */}
              {gallery.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gallery.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden h-40 cursor-pointer" onClick={() => setLightboxImg(url)}>
                      <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button onClick={(e) => { e.stopPropagation(); downloadImage(url); }} className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-card/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="w-4 h-4 text-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {gallery.length === 0 && fotosEmp.length === 0 && fotosInfra.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nenhuma foto na galeria</p>
                </div>
              )}

              <MediaGalleryView title="Fotos do Empreendimento" icon={Camera} items={fotosEmp} kind="image" />
              <MediaGalleryView title="Fotos da Infraestrutura" icon={Building2} items={fotosInfra} kind="image" />
              <MediaGalleryView title="Vídeos" icon={Video} items={videosArr} kind="video" />
              <MediaGalleryView title="Material Digital" icon={FolderDown} items={materialDigital} kind="file" />
            </TabsContent>
          )}

          <TabsContent value="imoveis" className="space-y-4">
            {imoveis.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum imóvel vinculado a este loteamento</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">{imoveis.length} imóvel(is)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {imoveis.map((im) => {
                    const imgs = im.imagens && im.imagens.length > 0 ? im.imagens : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop"];
                    const conditions = im.condicoes_pagamento || [];
                    return (
                      <div key={im.id} onClick={() => navigate(`/editar-imovel/${im.id}`)} className="elevated-card rounded-xl overflow-hidden cursor-pointer group flex flex-col">
                        <div className="relative h-44 overflow-hidden">
                          <img src={imgs[0]} alt={im.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          {im.proprietario_tipo && (
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success text-success-foreground">{im.proprietario_tipo}</span>
                          )}
                          <span className={cn("absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-semibold border", imovelStatusColors[im.status] || "bg-muted text-muted-foreground")}>{im.status}</span>
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                            <p className="text-lg font-bold text-white drop-shadow-lg">{formatCurrency(im.preco)}</p>
                            <div className="flex gap-1">
                              {im.vista_mar && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-info/90 text-info-foreground">Mar</span>}
                              {im.decorado && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/90 text-white">Dec.</span>}
                            </div>
                          </div>
                        </div>
                        <div className="p-3.5 space-y-2.5 flex-1 flex flex-col">
                          <h4 className="font-bold text-card-foreground text-sm leading-tight uppercase">{im.titulo}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{im.endereco}, {im.cidade}</span>
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {im.quartos > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {im.quartos}</span>}
                            {im.banheiros > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {im.banheiros}</span>}
                            {im.vagas > 0 && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {im.vagas}</span>}
                            {im.area > 0 && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {im.area}m² t.</span>}
                            {im.area_privativa > 0 && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {im.area_privativa}m² p.</span>}
                          </div>
                          {conditions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {conditions.map((c: string) => (
                                <span key={c} className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">{c}</span>
                              ))}
                            </div>
                          )}
                          <div className="mt-auto pt-2 border-t border-border flex items-center gap-2">
                            <span className="text-xs font-semibold text-accent">{im.corretor_nome || "Corretor"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="localizacao" className="space-y-3">
            {Number(emp.latitude) !== 0 && Number(emp.longitude) !== 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" /> Localização
                  </h3>
                  <a href={`https://www.google.com/maps?q=${emp.latitude},${emp.longitude}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info/10 text-info text-xs font-semibold hover:bg-info/20 transition-colors border border-info/20">
                    <ExternalLink className="w-3 h-3" /> Google Maps
                  </a>
                </div>
                <MiniMap lat={Number(emp.latitude)} lng={Number(emp.longitude)} name={emp.nome} height="400px" />
                <p className="text-xs text-muted-foreground text-center">{fullAddress}</p>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Coordenadas não cadastradas</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Lightbox */}
        {lightboxImg && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/80 flex items-center justify-center" onClick={() => setLightboxImg(null)}>
              <X className="w-5 h-5 text-foreground" />
            </button>
            <img src={lightboxImg} alt="Ampliada" className="max-w-full max-h-[90vh] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
            <a href={lightboxImg} target="_blank" rel="noopener noreferrer" className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-card/80 text-foreground text-sm font-semibold hover:bg-card transition-colors" onClick={(e) => e.stopPropagation()}>
              <Download className="w-4 h-4" /> Baixar
            </a>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export function empreendimentoSlug(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
