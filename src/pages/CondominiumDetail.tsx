import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MiniMap } from "@/components/MiniMap";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/mockData";
import {
  ArrowLeft, Fence, MapPin, Home, Edit, Share2, ExternalLink, Loader2,
  BedDouble, Bath, Car, Ruler, Layers, Wrench, Calendar, FileUp, Download,
  Camera, Building2, Video, FolderDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaGalleryView } from "@/components/MediaGalleryView";
import { useSmartBack } from "@/lib/useSmartBack";

const imovelStatusColors: Record<string, string> = {
  Disponível: "bg-success/10 text-success border-success/30",
  Vendido: "bg-destructive/10 text-destructive border-destructive/30",
  Reservado: "bg-warning/10 text-warning border-warning/30",
  Alugado: "bg-info/10 text-info border-info/30",
};

export default function CondominiumDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = useSmartBack("/condominios");
  const [condo, setCondo] = useState<any>(null);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const [cRes, iRes] = await Promise.all([
        supabase.from("condominios").select("*").eq("id", id).maybeSingle(),
        supabase.from("imoveis").select("*").eq("condominio_id", id),
      ]);
      if (cRes.data) setCondo(cRes.data);
      if (iRes.data) setImoveis(iRes.data);
      setLoading(false);
    };
    load();
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

  if (!condo) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">
          <Fence className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Condomínio não encontrado</p>
          <button onClick={handleBack} className="text-accent hover:underline mt-2 inline-block">Voltar</button>
        </div>
      </AppLayout>
    );
  }

  const fullAddress = [condo.endereco, condo.numero, condo.complemento, condo.bairro, condo.cidade, condo.estado].filter(Boolean).join(", ");
  const implantacaoUrl = (condo as any).implantacao_url || '';
  const isPdf = implantacaoUrl.match(/\.pdf$/i);

  function shareWhatsApp() {
    const text = `🏘️ ${condo.nome}\n📍 ${fullAddress}\n🔗 ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{condo.nome}</h1>
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
            <button onClick={() => navigate(`/editar-condominio/${condo.id}`)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Edit className="w-4 h-4" /> Editar
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="rounded-xl overflow-hidden h-64">
          <img src={condo.imagem_url || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop"} alt={condo.nome} className="w-full h-full object-cover" />
        </div>

        {/* Info Bar */}
        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-card border border-border">
          {condo.tipo && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Fence className="w-4 h-4 text-accent" />{condo.tipo}</div>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Layers className="w-4 h-4 text-accent" />{condo.total_unidades} unidades</div>
          {condo.unidades_disponiveis > 0 && <div className="flex items-center gap-2 text-sm text-success font-semibold">{condo.unidades_disponiveis} disponíveis</div>}
          {condo.taxa_condominio > 0 && <div className="flex items-center gap-2 text-sm text-muted-foreground">Taxa: {formatCurrency(condo.taxa_condominio)}/mês</div>}
          {condo.construtora && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wrench className="w-4 h-4 text-accent" />{condo.construtora}</div>}
          {condo.ano_construcao && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="w-4 h-4 text-accent" />Ano {condo.ano_construcao}</div>}
          {condo.cep && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4 text-accent" />CEP {condo.cep}</div>}
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-secondary flex-wrap h-auto gap-1">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="midias">Mídias</TabsTrigger>
            <TabsTrigger value="imoveis">Imóveis ({imoveis.length})</TabsTrigger>
            {implantacaoUrl && <TabsTrigger value="implantacao">Implantação</TabsTrigger>}
            {(condo as any).mapa_pdf_url && <TabsTrigger value="mapa">Mapa PDF</TabsTrigger>}
            <TabsTrigger value="localizacao">Localização</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            {condo.descricao && (
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{condo.descricao}</p>
              </div>
            )}
            {condo.amenidades && condo.amenidades.length > 0 && (
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Amenidades</h3>
                <div className="flex flex-wrap gap-2">
                  {condo.amenidades.map((a: string) => (
                    <span key={a} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="midias" className="space-y-4">
            <MediaGalleryView title="Fotos do Empreendimento" icon={Camera} items={(condo as any).fotos_empreendimento || []} kind="image" emptyText="Nenhuma foto cadastrada" />
            <MediaGalleryView title="Fotos da Infraestrutura" icon={Building2} items={(condo as any).fotos_infra || []} kind="image" emptyText="Nenhuma foto cadastrada" />
            <MediaGalleryView title="Vídeos" icon={Video} items={(condo as any).videos || []} kind="video" emptyText="Nenhum vídeo cadastrado" />
            <MediaGalleryView title="Material Digital" icon={FolderDown} items={(condo as any).material_digital || []} kind="file" emptyText="Nenhum material disponível" />
          </TabsContent>
          <TabsContent value="imoveis" className="space-y-4">
            {imoveis.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum imóvel vinculado a este condomínio</p>
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

          {implantacaoUrl && (
            <TabsContent value="implantacao" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-accent" /> Implantação / Mapa de Lotes
                </h3>
                <a href={implantacaoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors border border-accent/20">
                  <Download className="w-4 h-4" /> Baixar
                </a>
              </div>
              {isPdf ? (
                <iframe src={implantacaoUrl} className="w-full h-[600px] rounded-xl border border-border" title="Implantação PDF" />
              ) : (
                <img src={implantacaoUrl} alt="Implantação" className="w-full rounded-xl border border-border object-contain max-h-[600px]" />
              )}
            </TabsContent>
          )}

          {(condo as any).mapa_pdf_url && (
            <TabsContent value="mapa" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-accent" /> Mapa do Condomínio
                </h3>
                <a href={(condo as any).mapa_pdf_url} download className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors border border-accent/20">
                  <Download className="w-4 h-4" /> Baixar PDF
                </a>
              </div>
              <iframe src={(condo as any).mapa_pdf_url} className="w-full h-[600px] rounded-xl border border-border" title="Mapa do Condomínio PDF" />
            </TabsContent>
          )}

          <TabsContent value="localizacao" className="space-y-3">
            {Number(condo.latitude) !== 0 && Number(condo.longitude) !== 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" /> Localização
                  </h3>
                  <a href={`https://www.google.com/maps?q=${condo.latitude},${condo.longitude}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info/10 text-info text-xs font-semibold hover:bg-info/20 transition-colors border border-info/20">
                    <ExternalLink className="w-3 h-3" /> Google Maps
                  </a>
                </div>
                <MiniMap lat={Number(condo.latitude)} lng={Number(condo.longitude)} name={condo.nome} height="400px" />
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
      </div>
    </AppLayout>
  );
}
